// @vitest-environment node
import { beforeEach, expect, test, vi } from "vitest";
const mocks = vi.hoisted(() => ({ find: vi.fn(), pending: vi.fn(), removeQueue: vi.fn(), queue: vi.fn(), remove: vi.fn(), list: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { product: { findFirst: mocks.find }, imageCleanup: { findMany: mocks.pending, deleteMany: mocks.removeQueue, upsert: mocks.queue } } }));
vi.mock("./product-images", () => ({ deleteProductImage: mocks.remove, listOldProductImages: mocks.list }));
import { cleanupProductImage, reconcileProductImages } from "./image-cleanup";
beforeEach(() => { vi.resetAllMocks(); mocks.find.mockResolvedValue(null); mocks.pending.mockResolvedValue([]); mocks.list.mockResolvedValue([]); });
test("preserva imagem associada", async () => { mocks.find.mockResolvedValue({ id: "product" }); await cleanupProductImage("associated"); expect(mocks.remove).not.toHaveBeenCalled(); });
test("registra falha persistente e permite nova tentativa idempotente", async () => {
  mocks.remove.mockRejectedValueOnce(new Error("NFS offline"));
  await cleanupProductImage("unused");
  expect(mocks.queue).toHaveBeenCalledWith(expect.objectContaining({ create: { imageKey: "unused", lastError: "NFS offline", attempts: 1 } }));
  await cleanupProductImage("unused");
  expect(mocks.removeQueue).toHaveBeenCalledWith({ where: { imageKey: "unused" } });
});
test("falha da fila gera registro operacional com chave", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.remove.mockRejectedValue(new Error("NFS offline")); mocks.queue.mockRejectedValue(new Error("DB offline"));
  await cleanupProductImage("unused");
  expect(log).toHaveBeenCalledWith("PRODUCT_IMAGE_CLEANUP_REQUIRED", expect.objectContaining({ imageKey: "unused" })); log.mockRestore();
});
test("reconcilia fila e órfãos com janela mínima de 24h e sem duplicação", async () => {
  mocks.pending.mockResolvedValue([{ imageKey: "queued" }]); mocks.list.mockResolvedValue(["queued", "orphan"]);
  const now = new Date("2026-10-12T12:00:00Z"); await reconcileProductImages(now);
  expect(mocks.list).toHaveBeenCalledWith(new Date("2026-10-11T12:00:00Z"));
  expect(mocks.remove).toHaveBeenCalledTimes(2);
});
