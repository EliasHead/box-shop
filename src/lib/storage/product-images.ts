import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { lstat, mkdir, open, readdir, rename, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PIXELS = 16_000_000;
const ID = /^[a-zA-Z0-9_-]{1,128}$/;
const VERSION = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/;

export async function normalizeProductImage(input: Uint8Array): Promise<Buffer> {
  if (!input.byteLength || input.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Envie uma imagem de até 5 MiB, maior que zero.");
  }
  try {
    // Alguns decodificadores PNG apresentam somente o primeiro frame de APNG.
    // Inspecionar chunks impede aceitar animação mesmo nesses decodificadores.
    if (Buffer.from(input.subarray(0, 8)).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      const png = Buffer.from(input);
      for (let offset = 8; offset + 12 <= png.length;) {
        const length = png.readUInt32BE(offset);
        if (png.toString("ascii", offset + 4, offset + 8) === "acTL") throw new Error("animated");
        if (length > png.length - offset - 12) throw new Error("corrupt");
        offset += length + 12;
      }
    }
    const image = sharp(input, { limitInputPixels: MAX_PIXELS, failOn: "warning" });
    const metadata = await image.metadata();
    if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)
      || (metadata.pages ?? 1) !== 1 || !metadata.width || !metadata.height
      || metadata.width > 4096 || metadata.height > 4096
      || metadata.width * metadata.height > MAX_PIXELS) {
      throw new Error("invalid");
    }
    return await image.rotate().webp({ quality: 85 }).toBuffer();
  } catch {
    throw new Error("Imagem inválida. Use JPEG, PNG ou WebP estático de até 4096 pixels por lado e 16 milhões de pixels.");
  }
}

export function parseImageKey(key: string, allowTemporary = false) {
  const parts = key.split("/");
  if (parts.length !== 3 || !ID.test(parts[0]) || !ID.test(parts[1]) || !(VERSION.test(parts[2]) || (allowTemporary && parts[2].startsWith(".") && parts[2].endsWith(".tmp") && VERSION.test(parts[2].slice(1, -4))))) {
    throw new Error("Referência de imagem inválida.");
  }
  return { tenantId: parts[0], productId: parts[1], version: parts[2] };
}

async function directory(parts: string[], create = false) {
  const root = process.env.PRODUCT_IMAGES_DIR;
  if (!root || !path.isAbsolute(root)) throw new Error("Armazenamento de imagens não configurado.");
  // Verificar cada componente, inclusive os ancestrais da raiz configurada.
  let current = path.parse(root).root;
  for (const segment of [...root.slice(current.length).split(path.sep).filter(Boolean), ...parts]) {
    current = path.join(current, segment);
    if (create) await mkdir(current).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "EEXIST") throw error;
    });
    const info = await lstat(current);
    if (info.isSymbolicLink() || !info.isDirectory()) throw new Error("Diretório de imagens inválido.");
  }
  return current;
}

export async function writeProductImage(tenantId: string, productId: string, content: Buffer) {
  if (!ID.test(tenantId) || !ID.test(productId)) throw new Error("Identificador inválido.");
  const folder = await directory([tenantId, productId], true);
  const version = `${randomUUID()}.webp`;
  const temp = path.join(folder, `.${version}.tmp`);
  const destination = path.join(folder, version);
  const file = await open(temp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
  try {
    await file.writeFile(content);
    await file.sync();
    await file.close();
    await rename(temp, destination);
  } catch (error) {
    await file.close().catch(() => {});
    await unlink(temp).catch(() => {});
    throw error;
  }
  return `${tenantId}/${productId}/${version}`;
}

export async function readProductImage(key: string) {
  const { tenantId, productId, version } = parseImageKey(key);
  const folder = await directory([tenantId, productId]);
  const file = await open(path.join(folder, version), constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    if (!(await file.stat()).isFile()) throw new Error("Imagem indisponível.");
    return await file.readFile();
  } finally { await file.close(); }
}

export async function deleteProductImage(key: string) {
  const { tenantId, productId, version } = parseImageKey(key, true);
  try {
    const folder = await directory([tenantId, productId]);
    const target = path.join(folder, version);
    if (!(await lstat(target)).isFile()) throw new Error("Arquivo de imagem inválido.");
    await unlink(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

export async function listOldProductImages(before: Date) {
  const root = await directory([]);
  const result: string[] = [];
  for (const tenant of await readdir(root, { withFileTypes: true })) {
    if (!tenant.isDirectory() || !ID.test(tenant.name)) continue;
    const tenantPath = await directory([tenant.name]);
    for (const product of await readdir(tenantPath, { withFileTypes: true })) {
      if (!product.isDirectory() || !ID.test(product.name)) continue;
      const folder = await directory([tenant.name, product.name]);
      for (const file of await readdir(folder, { withFileTypes: true })) {
        if (!file.isFile()) continue;
        try { parseImageKey(`${tenant.name}/${product.name}/${file.name}`, true); }
        catch { continue; }
        if ((await lstat(path.join(folder, file.name))).mtime < before) {
          result.push(`${tenant.name}/${product.name}/${file.name}`);
        }
      }
    }
  }
  return result;
}
