import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres").max(200, "O nome não pode exceder 200 caracteres"),
  slug: z.string().min(2, "O slug deve ter pelo menos 2 caracteres").max(200, "O slug não pode exceder 200 caracteres").regex(/^[a-z0-9-]+$/, "O slug deve conter apenas letras minúsculas, números e hifens"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "O preço não pode ser negativo"),
  status: z.enum(["ACTIVE", "DRAFT"]).default("DRAFT"),
  sku: z.string().optional(),
  categoryId: z.string().optional().nullable(),
});

export type ProductInput = z.infer<typeof productSchema>;
