// @vitest-environment node
import { beforeEach, expect, test, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), user: vi.fn(), tenant: vi.fn(), product: vi.fn(), read: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.user }, tenant: { findUnique: mocks.tenant }, product: { findFirst: mocks.product } } }));
vi.mock("@/lib/storage/product-images", async (original) => ({ ...await original<object>(), readProductImage: mocks.read }));
import { GET } from "./route";
const version = "12345678-1234-4234-8234-123456789abc.webp";
async function get(host: string, requested = version) {
  return GET(new Request(`http://localhost:3000/api/product-images/product/${requested}`, { headers: { host } }), { params: Promise.resolve({ productId: "product", version: requested }) });
}
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "localhost:3000");
  mocks.auth.mockResolvedValue({ user: { id: "user", tenantId: "stale" } });
  mocks.user.mockResolvedValue({ tenantId: "tenant" });
  mocks.tenant.mockResolvedValue({ id: "tenant" });
  mocks.product.mockResolvedValue({ id: "product" });
  mocks.read.mockResolvedValue(Buffer.from("image"));
});
test("vitrine sem sessão exige ACTIVE e envia WebP sem cache", async () => {
  const response = await get("loja.localhost:3000");
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("content-type")).toBe("image/webp");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(mocks.auth).not.toHaveBeenCalled();
  expect(mocks.product.mock.calls[0][0].where).toEqual({ id: "product", tenantId: "tenant", imageKey: `tenant/product/${version}`, status: "ACTIVE" });
});
test("painel usa vínculo atual e permite prévia de rascunho", async () => {
  expect((await get("app.localhost:3000")).status).toBe(200);
  expect(mocks.product.mock.calls[0][0].where).not.toHaveProperty("status");
  expect(mocks.product.mock.calls[0][0].where.tenantId).toBe("tenant");
});
test.each(["localhost:3000", "unknown.test", "loja.localhost:3000.evil.test", "sub.loja.localhost:3000"])("nega host %s", async (host) => {
  expect((await get(host)).status).toBe(404); expect(mocks.read).not.toHaveBeenCalled();
});
test.each(["no-session", "removed-user", "no-tenant", "old-version-or-draft", "missing-file"])("nega %s sem divulgar detalhes", async (failure) => {
  let host = "app.localhost:3000";
  if (failure === "no-session") mocks.auth.mockResolvedValue(null);
  if (failure === "removed-user") mocks.user.mockResolvedValue(null);
  if (failure === "no-tenant") mocks.user.mockResolvedValue({ tenantId: null });
  if (failure === "old-version-or-draft") { mocks.product.mockResolvedValue(null); host = "other.localhost:3000"; }
  if (failure === "missing-file") mocks.read.mockRejectedValue(new Error("ENOENT private path"));
  const response = await get(host);
  expect(response.status).toBe(404); expect(await response.text()).toBe("");
});
