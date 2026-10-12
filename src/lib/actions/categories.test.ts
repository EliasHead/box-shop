import type { Session } from "next-auth";
import { categoryFixture, sessionFixture } from "@/test/fixtures";
import { expect, test, vi, beforeEach } from "vitest";
import { getCategories, createCategory, deleteCategory } from "./categories";
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

const sessionAuth = vi.mocked(auth as () => Promise<Session | null>);

beforeEach(() => {
  vi.clearAllMocks();
});

test("getCategories retorna erro se não autenticado", async () => {
  sessionAuth.mockResolvedValueOnce(null);
  await expect(getCategories()).rejects.toThrow("Não autorizado ou Tenant não encontrado");
});

test("getCategories retorna as categorias do tenant", async () => {
  sessionAuth.mockResolvedValueOnce(sessionFixture());
  const mockCategories = [categoryFixture()];
  vi.mocked(prisma.category.findMany).mockResolvedValueOnce(mockCategories);

  const result = await getCategories();
  expect(result).toEqual(mockCategories);
  expect(prisma.category.findMany).toHaveBeenCalledWith({
    where: { tenantId: "tenant-1" },
    orderBy: { createdAt: "desc" },
  });
});

test("createCategory falha com dados inválidos", async () => {
  sessionAuth.mockResolvedValueOnce(sessionFixture());
  
  await expect(createCategory({ name: "A", slug: "A" })).rejects.toThrow("Dados inválidos");
});

test("createCategory falha se o slug já existir no tenant", async () => {
  sessionAuth.mockResolvedValueOnce(sessionFixture());
  vi.mocked(prisma.category.findUnique).mockResolvedValueOnce(categoryFixture({ id: "existing" }));

  await expect(createCategory({ name: "Calcados", slug: "calcados" })).rejects.toThrow("Já existe uma categoria com este slug");
});

test("createCategory cria a categoria com sucesso", async () => {
  sessionAuth.mockResolvedValueOnce(sessionFixture());
  vi.mocked(prisma.category.findUnique).mockResolvedValueOnce(null);
  const mockCreated = categoryFixture({ name: "Calçados", slug: "calcados" });
  vi.mocked(prisma.category.create).mockResolvedValueOnce(mockCreated);

  const result = await createCategory({ name: "Calçados", slug: "calcados" });
  expect(result).toEqual(mockCreated);
  expect(prisma.category.create).toHaveBeenCalledWith({
    data: { name: "Calçados", slug: "calcados", tenantId: "tenant-1" },
  });
});

test("deleteCategory exclui a categoria se pertencer ao tenant", async () => {
  sessionAuth.mockResolvedValueOnce(sessionFixture());
  vi.mocked(prisma.category.findFirst).mockResolvedValueOnce(categoryFixture());
  vi.mocked(prisma.category.delete).mockResolvedValueOnce(categoryFixture());

  const result = await deleteCategory("cat-1");
  expect(result).toBe(true);
  expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: "cat-1" } });
});
