import { expect, test, vi, beforeEach } from "vitest";
import { getCategories, createCategory, updateCategory, deleteCategory } from "./categories";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

test("getCategories retorna erro se não autenticado", async () => {
  vi.mocked(auth).mockResolvedValueOnce(null as any);
  await expect(getCategories()).rejects.toThrow("Não autorizado ou Tenant não encontrado");
});

test("getCategories retorna as categorias do tenant", async () => {
  vi.mocked(auth).mockResolvedValueOnce({ user: { tenantId: "tenant-1" } } as any);
  const mockCategories = [{ id: "cat-1", name: "Categoria 1" }];
  vi.mocked(prisma.category.findMany).mockResolvedValueOnce(mockCategories as any);

  const result = await getCategories();
  expect(result).toEqual(mockCategories);
  expect(prisma.category.findMany).toHaveBeenCalledWith({
    where: { tenantId: "tenant-1" },
    orderBy: { createdAt: "desc" },
  });
});

test("createCategory falha com dados inválidos", async () => {
  vi.mocked(auth).mockResolvedValueOnce({ user: { tenantId: "tenant-1" } } as any);
  
  await expect(createCategory({ name: "A", slug: "A" })).rejects.toThrow("Dados inválidos");
});

test("createCategory falha se o slug já existir no tenant", async () => {
  vi.mocked(auth).mockResolvedValueOnce({ user: { tenantId: "tenant-1" } } as any);
  vi.mocked(prisma.category.findUnique).mockResolvedValueOnce({ id: "existing" } as any);

  await expect(createCategory({ name: "Calcados", slug: "calcados" })).rejects.toThrow("Já existe uma categoria com este slug");
});

test("createCategory cria a categoria com sucesso", async () => {
  vi.mocked(auth).mockResolvedValueOnce({ user: { tenantId: "tenant-1" } } as any);
  vi.mocked(prisma.category.findUnique).mockResolvedValueOnce(null);
  const mockCreated = { id: "cat-1", name: "Calçados", slug: "calcados", tenantId: "tenant-1" };
  vi.mocked(prisma.category.create).mockResolvedValueOnce(mockCreated as any);

  const result = await createCategory({ name: "Calçados", slug: "calcados" });
  expect(result).toEqual(mockCreated);
  expect(prisma.category.create).toHaveBeenCalledWith({
    data: { name: "Calçados", slug: "calcados", tenantId: "tenant-1" },
  });
});

test("deleteCategory exclui a categoria se pertencer ao tenant", async () => {
  vi.mocked(auth).mockResolvedValueOnce({ user: { tenantId: "tenant-1" } } as any);
  vi.mocked(prisma.category.findFirst).mockResolvedValueOnce({ id: "cat-1", tenantId: "tenant-1" } as any);
  vi.mocked(prisma.category.delete).mockResolvedValueOnce({} as any);

  const result = await deleteCategory("cat-1");
  expect(result).toBe(true);
  expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: "cat-1" } });
});
