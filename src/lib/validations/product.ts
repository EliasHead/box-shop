import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres").max(200, "O nome não pode exceder 200 caracteres"),
  slug: z.string().min(2, "O slug deve ter pelo menos 2 caracteres").max(200, "O slug não pode exceder 200 caracteres").regex(/^[a-z0-9-]+$/, "O slug deve conter apenas letras minúsculas, números e hifens"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "O preço não pode ser negativo"),
  status: z.enum(["ACTIVE", "DRAFT"]).default("DRAFT"),
  sku: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  stock: z.coerce.number().min(0, "O estoque não pode ser negativo").default(0),
  trackInventory: z.boolean().default(true),
  variationTypes: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1, "O nome do tipo de variação é obrigatório"),
      options: z.array(z.string().min(1, "A opção não pode ser vazia")),
    })
  ).optional().default([]),
  variants: z.array(
    z.object({
      id: z.string().optional(),
      sku: z.string().optional(),
      price: z.coerce.number().nullable().optional(),
      stock: z.coerce.number().min(0, "Estoque da variante não pode ser negativo").default(0),
      options: z.record(z.string(), z.string()), // e.g. { "Cor": "Azul", "Tamanho": "P" }
    })
  ).optional().default([]),
});

export type ProductInput = z.infer<typeof productSchema>;
