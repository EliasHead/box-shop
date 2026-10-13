// @vitest-environment node
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { access, readFile, rm } from "node:fs/promises";
const state = vi.hoisted(() => ({ session: null as null | { user: { id: string; tenantId: string } } }));
vi.mock("@/auth", () => ({ auth: async () => state.session }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { prisma } from "@/lib/prisma";
import { uploadProductImage, removeProductImage } from "@/lib/actions/product-images";
import { createProduct, deleteProduct } from "@/lib/actions/products";
import { GET } from "@/app/api/product-images/[productId]/[version]/route";
import { cleanupProductImage, reconcileProductImages } from "@/lib/storage/image-cleanup";
import { writeProductImage } from "@/lib/storage/product-images";

const enabled = process.env.RUN_DATABASE_TESTS === "1";
const suite = enabled ? test : test.skip;
let tenantId: string, otherTenantId: string, userId: string, productId: string;
let content: Buffer;
function form() { const value = new FormData(); value.set("image", new File([new Uint8Array(content)], "test.jpg", { type: "image/jpeg" })); return value; }
async function image(key: string, host?: string) {
  return GET(new Request("http://localhost:3000/api/product-images", { headers: { host: host ?? `images-${tenantId}.localhost:3000` } }), { params: Promise.resolve({ productId, version: key.split("/").at(-1)! }) });
}
beforeAll(async () => {
  if (!enabled) return;
  if (new URL(process.env.DATABASE_URL!).pathname !== "/boxshop_images_validation"
    || !process.env.PRODUCT_IMAGES_DIR?.includes("/.validation.")) {
    throw new Error("Use banco boxshop_images_validation e diretório exclusivo .validation.* para estes testes.");
  }
  const tag = randomUUID();
  const tenant = await prisma.tenant.create({ data: { name: "Image integration", domain: `images-${tag}` } });
  tenantId = tenant.id;
  // O domínio de teste também pode ser obtido a partir do ID, sem sessão pública.
  await prisma.tenant.update({ where: { id: tenantId }, data: { domain: `images-${tenantId}` } });
  const other = await prisma.tenant.create({ data: { name: "Other", domain: `other-${tag}` } }); otherTenantId = other.id;
  const user = await prisma.user.create({ data: { tenantId } }); userId = user.id;
  state.session = { user: { id: userId, tenantId } };
  content = await sharp({ create: { width: 24, height: 12, channels: 3, background: "blue" } }).jpeg().toBuffer();
});
afterAll(async () => {
  if (!enabled) return;
  for (const id of [tenantId, otherTenantId].filter(Boolean)) {
    const products = await prisma.product.findMany({ where: { tenantId: id } });
    await prisma.product.deleteMany({ where: { tenantId: id } });
    for (const product of products) if (product.imageKey) await cleanupProductImage(product.imageKey);
    await prisma.user.deleteMany({ where: { tenantId: id } });
    await prisma.tenant.delete({ where: { id } });
    await rm(join(process.env.PRODUCT_IMAGES_DIR!, id), { recursive: true, force: true });
  }
  await prisma.$disconnect();
});

suite("fluxo completo com PostgreSQL e mídia persistente: envio, isolamento, concorrência, remoção e exclusão", async () => {
  const product = await createProduct({ name: "Foto", slug: "foto", price: 10, status: "ACTIVE", stock: 0, trackInventory: false, variationTypes: [], variants: [] });
  productId = product.id;
  const first = await uploadProductImage(productId, form());
  expect(first.success).toBe(true); if (!first.success || !first.imageKey) throw new Error("upload failed");
  expect((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).imageKey).toBe(first.imageKey);
  expect((await image(first.imageKey)).status).toBe(200);
  expect((await image(first.imageKey, "unknown.test")).status).toBe(404);
  const otherStore = await prisma.tenant.findUniqueOrThrow({ where: { id: otherTenantId } });
  expect((await image(first.imageKey, `${otherStore.domain}.localhost:3000`)).status).toBe(404);
  const mediaRoot = process.env.PRODUCT_IMAGES_DIR!;
  try {
    process.env.PRODUCT_IMAGES_DIR = "/proc";
    expect(await uploadProductImage(productId, form())).toHaveProperty("error");
  } finally { process.env.PRODUCT_IMAGES_DIR = mediaRoot; }
  expect((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).imageKey).toBe(first.imageKey);
  await access(join(mediaRoot, first.imageKey));
  const other = await prisma.product.create({ data: { name: "Other", slug: "other", price: 5, tenantId: otherTenantId } });
  expect(await uploadProductImage(other.id, form())).toHaveProperty("error");
  expect((await prisma.product.findUniqueOrThrow({ where: { id: other.id } })).imageKey).toBeNull();
  const invalid = new FormData(); invalid.set("image", new File(["bad"], "bad.png"));
  expect(await uploadProductImage(productId, invalid)).toHaveProperty("error");
  expect((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).imageKey).toBe(first.imageKey);
  const second = await uploadProductImage(productId, form());
  expect(second.success).toBe(true); if (!second.success || !second.imageKey) throw new Error("replacement failed");
  expect((await image(first.imageKey)).status).toBe(404);
  await expect(access(join(process.env.PRODUCT_IMAGES_DIR!, first.imageKey))).rejects.toThrow();
  await prisma.product.update({ where: { id: productId }, data: { status: "DRAFT" } });
  expect((await image(second.imageKey)).status).toBe(404);
  expect((await image(second.imageKey, "app.localhost:3000")).status).toBe(200);
  state.session = null;
  expect((await image(second.imageKey, "app.localhost:3000")).status).toBe(404);
  state.session = { user: { id: userId, tenantId: "stale" } };
  expect((await image(second.imageKey, "app.localhost:3000")).status).toBe(200);
  const concurrent = await Promise.all([uploadProductImage(productId, form()), uploadProductImage(productId, form())]);
  expect(concurrent.some((result) => result.success)).toBe(true);
  const final = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  await access(join(process.env.PRODUCT_IMAGES_DIR!, final.imageKey!));
  expect(await removeProductImage(productId)).toEqual({ success: true, imageKey: null });
  expect((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).price).toBe(10);
  const last = await uploadProductImage(productId, form()); if (!last.success || !last.imageKey) throw new Error("upload failed");
  await deleteProduct(productId);
  expect((await image(last.imageKey)).status).toBe(404);
  await expect(access(join(process.env.PRODUCT_IMAGES_DIR!, last.imageKey))).rejects.toThrow();
});

suite("comando de limpeza preserva arquivo associado e remove órfão antigo", async () => {
  const product = await prisma.product.create({ data: { name: "Cleanup", slug: "cleanup", price: 1, tenantId } });
  const buffer = await sharp(content).webp().toBuffer();
  const associated = await writeProductImage(tenantId, product.id, buffer);
  await prisma.product.update({ where: { id: product.id }, data: { imageKey: associated } });
  const orphan = await writeProductImage(tenantId, product.id, buffer);
  const { utimes } = await import("node:fs/promises");
  const old = new Date(Date.now() - 172800000);
  await utimes(join(process.env.PRODUCT_IMAGES_DIR!, orphan), old, old);
  await utimes(join(process.env.PRODUCT_IMAGES_DIR!, associated), old, old);
  await reconcileProductImages();
  expect(await readFile(join(process.env.PRODUCT_IMAGES_DIR!, associated))).toEqual(buffer);
  await expect(access(join(process.env.PRODUCT_IMAGES_DIR!, orphan))).rejects.toThrow();
});


suite("remoção e exclusão concorrentes com upload preservam toda referência final", async () => {
  for (const operation of ["remove", "delete"]) {
    const product = await prisma.product.create({ data: { name: "Race", slug: `race-${operation}`, price: 1, tenantId } });
    await uploadProductImage(product.id, form());
    const results = await Promise.allSettled([
      uploadProductImage(product.id, form()),
      operation === "remove" ? removeProductImage(product.id) : deleteProduct(product.id),
    ]);
    expect(results[1].status).toBe("fulfilled");
    const final = await prisma.product.findUnique({ where: { id: product.id } });
    if (operation === "delete") expect(final).toBeNull();
    if (final?.imageKey) await access(join(process.env.PRODUCT_IMAGES_DIR!, final.imageKey));
  }
});
