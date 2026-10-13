// @vitest-environment node
import { beforeEach, expect, test, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(), user: vi.fn(), product: vi.fn(), update: vi.fn(), current: vi.fn(),
  write: vi.fn(), normalize: vi.fn(), cleanup: vi.fn(), revalidate: vi.fn(), transaction: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findUnique: mocks.user }, product: { findFirst: mocks.product },
  tenant: { findUnique: vi.fn(async () => ({ domain: "loja" })) },
  $transaction: mocks.transaction,
} }));
vi.mock("@/lib/storage/product-images", () => ({ MAX_IMAGE_BYTES: 5 * 1024 * 1024, normalizeProductImage: mocks.normalize, writeProductImage: mocks.write }));
vi.mock("@/lib/storage/image-cleanup", () => ({ cleanupProductImage: mocks.cleanup }));
import { removeProductImage, uploadProductImage } from "./product-images";
const form = () => { const data = new FormData(); data.set("image", new File(["bytes"], "fake.png", { type: "text/plain" })); return data; };
beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.auth.mockResolvedValue({ user: { id: "user", tenantId: "stale-jwt" } });
  mocks.user.mockResolvedValue({ tenantId: "current-tenant" });
  mocks.current.mockResolvedValue([{ tenantId: "current-tenant" }]);
  mocks.product.mockResolvedValue({ imageKey: "old" });
  mocks.update.mockResolvedValue({ count: 1 });
  mocks.normalize.mockResolvedValue(Buffer.from("normalized"));
  mocks.write.mockResolvedValue("new");
  mocks.transaction.mockImplementation(async (callback) => callback({ $queryRaw: mocks.current, product: { updateMany: mocks.update } }));
});

test.each([null, { user: {} }])("nega ausência de sessão", async (session) => {
  mocks.auth.mockResolvedValue(session);
  expect(await uploadProductImage("product", form())).toHaveProperty("error");
  expect(mocks.write).not.toHaveBeenCalled();
});
test.each([null, { tenantId: null }])("nega usuário removido ou sem loja", async (user) => {
  mocks.user.mockResolvedValue(user);
  expect(await removeProductImage("product")).toHaveProperty("error");
  expect(mocks.update).not.toHaveBeenCalled();
});
test("usa vínculo atual, normaliza bytes sem confiar no MIME e revalida destinos internos", async () => {
  expect(await uploadProductImage("product", form())).toEqual({ success: true, imageKey: "new" });
  expect(mocks.product).toHaveBeenCalledWith({ where: { id: "product", tenantId: "current-tenant" } });
  expect(mocks.update).toHaveBeenCalledWith({ where: { id: "product", tenantId: "current-tenant", imageKey: "old" }, data: { imageKey: "new" } });
  expect(mocks.cleanup).toHaveBeenCalledWith("old");
  expect(mocks.cleanup).not.toHaveBeenCalledWith("new");
  expect(mocks.revalidate).toHaveBeenCalledWith("/app/dashboard/products");
  expect(mocks.revalidate).toHaveBeenCalledWith("/loja.localhost:3000");
});
test("nega produto de outra loja antes de processar", async () => {
  mocks.product.mockResolvedValue(null);
  expect(await uploadProductImage("other", form())).toHaveProperty("error");
  expect(mocks.normalize).not.toHaveBeenCalled();
});
test("arquivo inválido preserva referência anterior", async () => {
  mocks.normalize.mockRejectedValue(new Error("Imagem inválida."));
  expect(await uploadProductImage("product", form())).toEqual({ error: "Imagem inválida." });
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.cleanup).not.toHaveBeenCalled();
});
test.each(["conflict", "database", "link"])("compensa arquivo novo em falha %s", async (failure) => {
  if (failure === "conflict") mocks.update.mockResolvedValue({ count: 0 });
  if (failure === "database") mocks.transaction.mockRejectedValue(new Error("private db details"));
  if (failure === "link") mocks.current.mockResolvedValue([{ tenantId: "other" }]);
  expect(await uploadProductImage("product", form())).toHaveProperty("error");
  expect(mocks.cleanup).toHaveBeenCalledWith("new");
  expect(mocks.cleanup).not.toHaveBeenCalledWith("old");
});
test("falha de armazenamento não altera banco nem divulga caminhos", async () => {
  mocks.write.mockRejectedValue(new Error("EACCES /private/path"));
  expect(await uploadProductImage("product", form())).toEqual({ error: "Não foi possível salvar a foto. Tente novamente." });
  expect(mocks.update).not.toHaveBeenCalled();
});
test("remove imagem condicionalmente e preserva demais campos", async () => {
  expect(await removeProductImage("product")).toEqual({ success: true, imageKey: null });
  expect(mocks.update.mock.calls[0][0].data).toEqual({ imageKey: null });
  expect(mocks.cleanup).toHaveBeenCalledWith("old");
});
