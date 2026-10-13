import { prisma } from "@/lib/prisma";
import { deleteProductImage, listOldProductImages } from "./product-images";

export async function cleanupProductImage(imageKey: string) {
  try {
    if (await prisma.product.findFirst({ where: { imageKey }, select: { id: true } })) return;
    await deleteProductImage(imageKey);
    await prisma.imageCleanup.deleteMany({ where: { imageKey } });
  } catch (error) {
    const lastError = error instanceof Error ? error.message : "Falha de limpeza";
    try {
      await prisma.imageCleanup.upsert({
        where: { imageKey },
        create: { imageKey, lastError, attempts: 1 },
        update: { lastError, attempts: { increment: 1 } },
      });
    } catch (queueError) {
      console.error("PRODUCT_IMAGE_CLEANUP_REQUIRED", { imageKey, lastError, queueError });
    }
  }
}

export async function reconcileProductImages(now = new Date()) {
  const queued = await prisma.imageCleanup.findMany({ select: { imageKey: true } });
  const old = await listOldProductImages(new Date(now.getTime() - 86_400_000));
  for (const imageKey of new Set([...queued.map((item) => item.imageKey), ...old])) {
    await cleanupProductImage(imageKey);
  }
}
