"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ProductInput, productSchema } from "@/lib/validations/product";

/**
 * Retorna os produtos do Tenant atual.
 */
export async function getProducts() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error("Não autorizado ou Tenant não encontrado");
  }

  return prisma.product.findMany({
    where: { tenantId: session.user.tenantId },
    include: {
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Cria um novo produto para o Tenant atual.
 */
export async function createProduct(data: ProductInput) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error("Não autorizado ou Tenant não encontrado");
  }

  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Dados inválidos");
  }

  // Verifica se o slug já existe neste tenant
  const existing = await prisma.product.findUnique({
    where: {
      tenantId_slug: {
        tenantId: session.user.tenantId,
        slug: parsed.data.slug,
      },
    },
  });

  if (existing) {
    throw new Error("Já existe um produto com este slug no seu Tenant");
  }

  // Se passou categoryId, verifica se a categoria existe e pertence ao tenant
  if (parsed.data.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: parsed.data.categoryId,
        tenantId: session.user.tenantId,
      },
    });

    if (!category) {
      throw new Error("Categoria não encontrada ou não pertence ao seu Tenant");
    }
  }

  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      price: parsed.data.price,
      status: parsed.data.status,
      sku: parsed.data.sku,
      categoryId: parsed.data.categoryId,
      tenantId: session.user.tenantId,
    },
  });

  revalidatePath("/app/products");
  return product;
}

/**
 * Atualiza um produto existente.
 */
export async function updateProduct(id: string, data: ProductInput) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error("Não autorizado ou Tenant não encontrado");
  }

  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Dados inválidos");
  }

  // Verificar se pertence ao tenant
  const existing = await prisma.product.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });

  if (!existing) {
    throw new Error("Produto não encontrado ou você não tem permissão");
  }

  // Verifica slug duplicado
  if (existing.slug !== parsed.data.slug) {
    const slugInUse = await prisma.product.findUnique({
      where: {
        tenantId_slug: {
          tenantId: session.user.tenantId,
          slug: parsed.data.slug,
        },
      },
    });

    if (slugInUse) {
      throw new Error("Já existe outro produto com este slug");
    }
  }

  // Verifica categoria
  if (parsed.data.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: parsed.data.categoryId,
        tenantId: session.user.tenantId,
      },
    });

    if (!category) {
      throw new Error("Categoria não encontrada ou não pertence ao seu Tenant");
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      price: parsed.data.price,
      status: parsed.data.status,
      sku: parsed.data.sku,
      categoryId: parsed.data.categoryId,
    },
  });

  revalidatePath("/app/products");
  return product;
}

/**
 * Exclui um produto.
 */
export async function deleteProduct(id: string) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error("Não autorizado ou Tenant não encontrado");
  }

  // Verificar se pertence ao tenant
  const existing = await prisma.product.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });

  if (!existing) {
    throw new Error("Produto não encontrado ou você não tem permissão");
  }

  await prisma.product.delete({
    where: { id },
  });

  revalidatePath("/app/products");
  return true;
}
