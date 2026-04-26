"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { CategoryInput, categorySchema } from "@/lib/validations/category";

/**
 * Retorna as categorias do Tenant atual.
 */
export async function getCategories() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error("Não autorizado ou Tenant não encontrado");
  }

  return prisma.category.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Cria uma nova categoria para o Tenant atual.
 */
export async function createCategory(data: CategoryInput) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error("Não autorizado ou Tenant não encontrado");
  }

  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Dados inválidos");
  }

  // Verifica se o slug já existe neste tenant
  const existing = await prisma.category.findUnique({
    where: {
      tenantId_slug: {
        tenantId: session.user.tenantId,
        slug: parsed.data.slug,
      },
    },
  });

  if (existing) {
    throw new Error("Já existe uma categoria com este slug no seu Tenant");
  }

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      tenantId: session.user.tenantId,
    },
  });

  revalidatePath("/app/categories");
  revalidatePath("/app/products");
  return category;
}

/**
 * Atualiza uma categoria existente.
 */
export async function updateCategory(id: string, data: CategoryInput) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error("Não autorizado ou Tenant não encontrado");
  }

  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Dados inválidos");
  }

  // Verificar se pertence ao tenant
  const existing = await prisma.category.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });

  if (!existing) {
    throw new Error("Categoria não encontrada ou você não tem permissão");
  }

  // Verifica slug duplicado se estiver alterando o slug
  if (existing.slug !== parsed.data.slug) {
    const slugInUse = await prisma.category.findUnique({
      where: {
        tenantId_slug: {
          tenantId: session.user.tenantId,
          slug: parsed.data.slug,
        },
      },
    });

    if (slugInUse) {
      throw new Error("Já existe outra categoria com este slug");
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
    },
  });

  revalidatePath("/app/categories");
  revalidatePath("/app/products");
  return category;
}

/**
 * Exclui uma categoria. O schema Prisma cuida de setar os produtos como null (SetNull).
 */
export async function deleteCategory(id: string) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error("Não autorizado ou Tenant não encontrado");
  }

  // Verificar se pertence ao tenant
  const existing = await prisma.category.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });

  if (!existing) {
    throw new Error("Categoria não encontrada ou você não tem permissão");
  }

  await prisma.category.delete({
    where: { id },
  });

  revalidatePath("/app/categories");
  revalidatePath("/app/products");
  return true;
}
