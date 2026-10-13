"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cleanupProductImage } from "@/lib/storage/image-cleanup";
import { MAX_IMAGE_BYTES, normalizeProductImage, writeProductImage } from "@/lib/storage/product-images";

async function mutateImage(productId: string, formData?: FormData) {
  let newKey: string | null = null;
  let confirmed = false;
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado.");
    const userId = session.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
    if (!user?.tenantId) throw new Error("Usuário ou loja não encontrado.");
    const tenantId = user.tenantId;
    const previous = await prisma.product.findFirst({ where: { id: productId, tenantId } });
    if (!previous) throw new Error("Produto não encontrado ou sem permissão.");
    if (formData) {
      const file = formData.get("image");
      if (!(file instanceof File) || !file.size || file.size > MAX_IMAGE_BYTES) {
        throw new Error("Envie uma imagem de até 5 MiB, maior que zero.");
      }
      const content = await normalizeProductImage(new Uint8Array(await file.arrayBuffer()));
      newKey = await writeProductImage(tenantId, productId, content);
    }
    await prisma.$transaction(async (tx) => {
      // Bloqueio do vínculo durante a confirmação, sem processamento ou NFS na transação.
      const current = await tx.$queryRaw<Array<{ tenantId: string | null }>>`SELECT "tenantId" FROM "User" WHERE "id" = ${userId} FOR SHARE`;
      if (current[0]?.tenantId !== tenantId) throw new Error("Vínculo da loja alterado. Recarregue a página.");
      const updated = await tx.product.updateMany({
        where: { id: productId, tenantId, imageKey: previous.imageKey }, data: { imageKey: newKey },
      });
      if (updated.count !== 1) throw new Error("A foto foi alterada por outra operação. Recarregue e tente novamente.");
    });
    confirmed = true;
    if (previous.imageKey) await cleanupProductImage(previous.imageKey);
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { domain: true } });
    revalidatePath("/app/dashboard/products");
    if (tenant) revalidatePath(`/${tenant.domain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"}`);
    return { success: true, imageKey: newKey } as const;
  } catch (error) {
    if (newKey && !confirmed) await cleanupProductImage(newKey);
    console.error("Falha ao gerenciar foto:", error);
    return { error: confirmed ? "Foto salva, mas não foi possível atualizar a tela. Recarregue a página." : error instanceof Error && /^(Não autenticado|Usuário ou loja|Produto não encontrado|Envie uma imagem|Imagem inválida|Vínculo da loja|A foto foi alterada)/.test(error.message) ? error.message : "Não foi possível salvar a foto. Tente novamente." } as const;
  }
}

export async function uploadProductImage(productId: string, formData: FormData) {
  return mutateImage(productId, formData);
}
export async function removeProductImage(productId: string) {
  return mutateImage(productId);
}
