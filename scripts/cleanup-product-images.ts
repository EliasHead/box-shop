import { reconcileProductImages } from "../src/lib/storage/image-cleanup";
import { prisma } from "../src/lib/prisma";

reconcileProductImages()
  .then(() => console.log("Reconciliação das imagens concluída."))
  .catch((error) => { console.error("Falha na reconciliação:", error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
