-- Migration aditiva: produtos existentes continuam sem foto.
ALTER TABLE "Product" ADD COLUMN "imageKey" TEXT;

CREATE TABLE "ImageCleanup" (
    "id" TEXT NOT NULL,
    "imageKey" TEXT NOT NULL,
    "lastError" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ImageCleanup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ImageCleanup_imageKey_key" ON "ImageCleanup"("imageKey");
