"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { cleanupProductImage } from "@/lib/storage/image-cleanup";
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
      variationTypes: {
        include: {
          options: true,
        },
      },
      variants: {
        include: {
          options: {
            include: {
              variationType: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Cria um novo produto para o Tenant atual.
 */
export async function createProduct(data: ProductInput) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) {
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
        tenantId,
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
        tenantId,
      },
    });

    if (!category) {
      throw new Error("Categoria não encontrada ou não pertence ao seu Tenant");
    }
  }

  const product = await prisma.$transaction(async (tx) => {
    // 1. Create base product
    const newProduct = await tx.product.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description,
        price: parsed.data.price,
        status: parsed.data.status,
        sku: parsed.data.sku || undefined,
        categoryId: parsed.data.categoryId || undefined,
        tenantId,
        stock: parsed.data.stock,
        trackInventory: parsed.data.trackInventory,
      },
    });

    // 2. Create variation types and options
    if (parsed.data.variationTypes && parsed.data.variationTypes.length > 0) {
      const optionMap: Record<string, Record<string, string>> = {};

      for (const vt of parsed.data.variationTypes) {
        const typeRecord = await tx.productVariationType.create({
          data: {
            name: vt.name,
            productId: newProduct.id,
            options: {
              create: vt.options.map((opt) => ({ value: opt })),
            },
          },
          include: { options: true },
        });

        optionMap[vt.name] = {};
        for (const optRecord of typeRecord.options) {
          optionMap[vt.name][optRecord.value] = optRecord.id;
        }
      }

      // 3. Create variants
      if (parsed.data.variants && parsed.data.variants.length > 0) {
        for (const variant of parsed.data.variants) {
          const optionIds = Object.entries(variant.options).map(([typeName, optionValue]) => {
            const val = optionValue as string;
            const optId = optionMap[typeName]?.[val];
            if (!optId) throw new Error(`Opção ${val} do tipo ${typeName} não encontrada.`);
            return { id: optId };
          });

          await tx.productVariant.create({
            data: {
              productId: newProduct.id,
              sku: variant.sku,
              price: variant.price,
              stock: variant.stock,
              options: {
                connect: optionIds,
              },
            },
          });
        }
      }
    }

    return newProduct;
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

  const product = await prisma.$transaction(async (tx) => {
    const updatedProduct = await tx.product.update({
      where: { id },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description,
        price: parsed.data.price,
        status: parsed.data.status,
        sku: parsed.data.sku || null,
        categoryId: parsed.data.categoryId || null,
        stock: parsed.data.stock,
        trackInventory: parsed.data.trackInventory,
      },
    });

    // Delete existing variations to recreate them cleanly
    await tx.productVariationType.deleteMany({ where: { productId: id } });
    await tx.productVariant.deleteMany({ where: { productId: id } });

    // Recreate variations
    if (parsed.data.variationTypes && parsed.data.variationTypes.length > 0) {
      const optionMap: Record<string, Record<string, string>> = {};

      for (const vt of parsed.data.variationTypes) {
        const typeRecord = await tx.productVariationType.create({
          data: {
            name: vt.name,
            productId: updatedProduct.id,
            options: {
              create: vt.options.map((opt) => ({ value: opt })),
            },
          },
          include: { options: true },
        });

        optionMap[vt.name] = {};
        for (const optRecord of typeRecord.options) {
          optionMap[vt.name][optRecord.value] = optRecord.id;
        }
      }

      if (parsed.data.variants && parsed.data.variants.length > 0) {
        for (const variant of parsed.data.variants) {
          const optionIds = Object.entries(variant.options).map(([typeName, optionValue]) => {
            const val = optionValue as string;
            const optId = optionMap[typeName]?.[val];
            if (!optId) throw new Error(`Opção ${val} do tipo ${typeName} não encontrada.`);
            return { id: optId };
          });

          await tx.productVariant.create({
            data: {
              productId: updatedProduct.id,
              sku: variant.sku,
              price: variant.price,
              stock: variant.stock,
              options: {
                connect: optionIds,
              },
            },
          });
        }
      }
    }

    return updatedProduct;
  });

  revalidatePath("/app/products");
  return product;
}

/**
 * Exclui um produto.
 */
export async function deleteProduct(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autorizado ou Tenant não encontrado");
  const removed = await prisma.$transaction(async (tx) => {
    const users = await tx.$queryRaw<Array<{ tenantId: string | null }>>`SELECT "tenantId" FROM "User" WHERE "id" = ${session.user.id} FOR SHARE`;
    const tenantId = users[0]?.tenantId;
    if (!tenantId) throw new Error("Não autorizado ou Tenant não encontrado");
    // DELETE retorna a referência final mesmo que um upload termine durante a exclusão.
    return tx.product.delete({ where: { id, tenantId } });
  });
  if (removed.imageKey) await cleanupProductImage(removed.imageKey);
  revalidatePath("/app/dashboard/products");
  revalidatePath("/[domain]", "page");
  return true;
}
