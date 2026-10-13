// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtemp, rm, symlink, mkdir, writeFile, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { deleteProductImage, listOldProductImages, MAX_IMAGE_BYTES, normalizeProductImage, parseImageKey, readProductImage, writeProductImage } from "./product-images";

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "boxshop-images-"));
  vi.stubEnv("PRODUCT_IMAGES_DIR", root);
});
afterEach(async () => { vi.unstubAllEnvs(); await rm(root, { recursive: true, force: true }); });
const png = () => sharp({ create: { width: 20, height: 10, channels: 3, background: "red" } }).png().toBuffer();

test.each(["jpeg", "png", "webp"] as const)("normaliza %s e remove metadados", async (format) => {
  const input = await sharp(await png()).toFormat(format).withExif({ IFD0: { Artist: "private" } }).toBuffer();
  const result = await normalizeProductImage(input);
  const metadata = await sharp(result).metadata();
  expect(metadata.format).toBe("webp");
  expect(metadata.exif).toBeUndefined();
});

test("aplica orientação EXIF", async () => {
  const input = await sharp(await png()).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const metadata = await sharp(await normalizeProductImage(input)).metadata();
  expect([metadata.width, metadata.height]).toEqual([10, 20]);
});

test("rejeita bytes vazios, acima do limite, corrompidos e formatos falsos", async () => {
  for (const input of [Buffer.alloc(0), Buffer.alloc(MAX_IMAGE_BYTES + 1), Buffer.from("image/png"), Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>')]) {
    await expect(normalizeProductImage(input)).rejects.toThrow();
  }
});

test.each([[4097, 1], [4001, 4000]])("rejeita dimensões/pixels %s x %s", async (width, height) => {
  const input = await sharp({ create: { width, height, channels: 3, background: "red" } }).png().toBuffer();
  await expect(normalizeProductImage(input)).rejects.toThrow();
});

test("grava chaves imutáveis, lê, remove idempotentemente e reconcilia só arquivos antigos", async () => {
  const content = await normalizeProductImage(await png());
  const key = await writeProductImage("tenant-a", "product-a", content);
  const other = await writeProductImage("tenant-a", "product-a", content);
  expect(key).not.toBe(other);
  expect(await readProductImage(key)).toEqual(content);
  expect(await listOldProductImages(new Date(Date.now() - 86_400_000))).toEqual([]);
  const old = new Date(Date.now() - 172_800_000);
  await utimes(path.join(root, key), old, old);
  expect(await listOldProductImages(new Date(Date.now() - 86_400_000))).toEqual([key]);
  await deleteProductImage(key);
  await deleteProductImage(key);
  await expect(readProductImage(key)).rejects.toThrow();
  expect(await readProductImage(other)).toEqual(content);
});

test.each(["/tmp/x", "../tenant/product", "tenant/../../etc/passwd", "tenant/product/x.webp", "tenant/product/../../../x"])("nega chave maliciosa %s", async (key) => {
  expect(() => parseImageKey(key)).toThrow();
  await expect(readProductImage(key)).rejects.toThrow();
  await expect(deleteProductImage(key)).rejects.toThrow();
});

test("nega diretório simbólico e raiz relativa/ausente", async () => {
  await symlink(tmpdir(), path.join(root, "tenant"));
  await expect(writeProductImage("tenant", "product", await png())).rejects.toThrow();
  vi.stubEnv("PRODUCT_IMAGES_DIR", "relative");
  await expect(writeProductImage("tenant", "product", await png())).rejects.toThrow();
  vi.stubEnv("PRODUCT_IMAGES_DIR", "");
  await expect(writeProductImage("tenant", "product", await png())).rejects.toThrow();
});

test("nega symlink de arquivo e falha de escrita sem alterar arquivo existente", async () => {
  const content = await normalizeProductImage(await png());
  const key = await writeProductImage("tenant", "product", content);
  await rm(path.join(root, key));
  await symlink("/etc/passwd", path.join(root, key));
  await expect(readProductImage(key)).rejects.toThrow();
  await expect(deleteProductImage(key)).rejects.toThrow();
  await mkdir(path.join(root, "blocked"));
  await writeFile(path.join(root, "blocked", "product"), "unchanged");
  await expect(writeProductImage("blocked", "product", content)).rejects.toThrow();
});

test("rejeita WebP animado", async () => {
  const pixels = Buffer.concat([Buffer.alloc(20 * 10 * 3, 255), Buffer.alloc(20 * 10 * 3, 0)]);
  const input = await sharp(pixels, { raw: { width: 20, height: 20, channels: 3, pageHeight: 10 } }).webp({ loop: 0, delay: [100, 100] }).toBuffer();
  expect((await sharp(input, { animated: true }).metadata()).pages).toBe(2);
  await expect(normalizeProductImage(input)).rejects.toThrow();
});

test("rejeita chunk de controle APNG mesmo se decoder apresenta apenas primeiro frame", async () => {
  const image = await png();
  const chunk = Buffer.alloc(20);
  chunk.writeUInt32BE(8, 0); chunk.write("acTL", 4); chunk.writeUInt32BE(2, 8);
  await expect(normalizeProductImage(Buffer.concat([image.subarray(0, 33), chunk, image.subarray(33)]))).rejects.toThrow();
});

test("nega armazenamento sem permissão de criação", async () => {
  vi.stubEnv("PRODUCT_IMAGES_DIR", "/proc");
  await expect(writeProductImage("boxshop-test-no-write", "product", await png())).rejects.toThrow();
});


test("reconcilia temporário antigo de escrita interrompida, preservando o recente", async () => {
  const key = await writeProductImage("tenant", "product", await png());
  const parts = parseImageKey(key);
  const temporaryKey = `tenant/product/.${parts.version}.tmp`;
  await writeFile(path.join(root, temporaryKey), "partial");
  const cutoff = new Date(Date.now() - 86_400_000);
  expect(await listOldProductImages(cutoff)).not.toContain(temporaryKey);
  const old = new Date(Date.now() - 172_800_000);
  await utimes(path.join(root, temporaryKey), old, old);
  expect(await listOldProductImages(cutoff)).toContain(temporaryKey);
  await expect(readProductImage(temporaryKey)).rejects.toThrow();
  await deleteProductImage(temporaryKey);
  expect(await listOldProductImages(cutoff)).not.toContain(temporaryKey);
  await expect(readProductImage(key)).resolves.toBeDefined();
});
