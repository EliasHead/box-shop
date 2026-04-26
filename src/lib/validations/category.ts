import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres").max(100, "O nome não pode exceder 100 caracteres"),
  slug: z.string().min(2, "O slug deve ter pelo menos 2 caracteres").max(100, "O slug não pode exceder 100 caracteres").regex(/^[a-z0-9-]+$/, "O slug deve conter apenas letras minúsculas, números e hifens"),
});

export type CategoryInput = z.infer<typeof categorySchema>;
