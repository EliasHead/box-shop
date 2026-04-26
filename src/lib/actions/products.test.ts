import { expect, test, vi, beforeEach } from "vitest";
import { getProducts, createProduct, updateProduct, deleteProduct } from "./products";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test("createProduct falha se o slug já existir no tenant", async () => {
  vi.mocked(auth).mockResolvedValueOnce({ user: { tenantId: "tenant-1" } } as any);
  vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({ id: "existing" } as any);

  await expect(
    createProduct({ name: "Camiseta", slug: "camiseta", price: 10, status: "ACTIVE" })
  ).rejects.toThrow("Já existe um produto com este slug no seu Tenant");
});

test("createProduct falha se categoryId for fornecido mas a categoria não existir", async () => {
  vi.mocked(auth).mockResolvedValueOnce({ user: { tenantId: "tenant-1" } } as any);
  vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);
  vi.mocked(prisma.category.findFirst).mockResolvedValueOnce(null); // category not found

  await expect(
    createProduct({ name: "Camiseta", slug: "camiseta", price: 10, status: "ACTIVE", categoryId: "cat-1" })
  ).rejects.toThrow("Categoria não encontrada ou não pertence ao seu Tenant");
});

test("createProduct cria o produto com sucesso", async () => {
  vi.mocked(auth).mockResolvedValueOnce({ user: { tenantId: "tenant-1" } } as any);
  vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);
  
  const mockCreated = { id: "prod-1", name: "Camiseta", slug: "camiseta", price: 10, tenantId: "tenant-1" };
  vi.mocked(prisma.product.create).mockResolvedValueOnce(mockCreated as any);

  const result = await createProduct({ name: "Camiseta", slug: "camiseta", price: 10, status: "ACTIVE" });
  expect(result).toEqual(mockCreated);
  expect(prisma.product.create).toHaveBeenCalledWith({
    data: { 
      name: "Camiseta", 
      slug: "camiseta", 
      price: 10, 
      status: "ACTIVE", 
      tenantId: "tenant-1",
      categoryId: undefined,
      description: undefined,
      sku: undefined
    },
  });
});
