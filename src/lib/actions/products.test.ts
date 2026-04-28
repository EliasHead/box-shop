import { expect, test, vi, beforeEach } from "vitest";
import { getProducts, createProduct, updateProduct, deleteProduct } from "./products";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const txMock = {
  product: {
    create: vi.fn(),
    update: vi.fn(),
  },
  productVariationType: {
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  productVariant: {
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn((cb) => cb(txMock)),
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test("createProduct falha se o slug já existir no tenant", async () => {
  vi.mocked(auth).mockResolvedValueOnce({ user: { tenantId: "tenant-1" } } as any);
  vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({ id: "existing" } as any);

  await expect(
    createProduct({ 
      name: "Camiseta", 
      slug: "camiseta", 
      price: 10, 
      status: "ACTIVE",
      stock: 0,
      trackInventory: false,
      variationTypes: [],
      variants: []
    })
  ).rejects.toThrow("Já existe um produto com este slug no seu Tenant");
});

test("createProduct falha se categoryId for fornecido mas a categoria não existir", async () => {
  vi.mocked(auth).mockResolvedValueOnce({ user: { tenantId: "tenant-1" } } as any);
  vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);
  vi.mocked(prisma.category.findFirst).mockResolvedValueOnce(null); // category not found

  await expect(
    createProduct({ 
      name: "Camiseta", 
      slug: "camiseta", 
      price: 10, 
      status: "ACTIVE", 
      categoryId: "cat-1",
      stock: 0,
      trackInventory: false,
      variationTypes: [],
      variants: []
    })
  ).rejects.toThrow("Categoria não encontrada ou não pertence ao seu Tenant");
});

test("createProduct cria o produto base com sucesso", async () => {
  vi.mocked(auth).mockResolvedValueOnce({ user: { tenantId: "tenant-1" } } as any);
  vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);
  
  const mockCreated = { id: "prod-1", name: "Camiseta", slug: "camiseta", price: 10, tenantId: "tenant-1" };
  txMock.product.create.mockResolvedValueOnce(mockCreated as any);

  const result = await createProduct({ 
    name: "Camiseta", 
    slug: "camiseta", 
    price: 10, 
    status: "ACTIVE",
    stock: 0,
    trackInventory: false,
    variationTypes: [],
    variants: []
  });
  expect(result).toEqual(mockCreated);
  expect(txMock.product.create).toHaveBeenCalledWith({
    data: { 
      name: "Camiseta", 
      slug: "camiseta", 
      price: 10, 
      status: "ACTIVE", 
      tenantId: "tenant-1",
      categoryId: undefined,
      description: undefined,
      sku: undefined,
      stock: 0,
      trackInventory: false,
    },
  });
});

test("createProduct cria produto com variações e estoque atômico", async () => {
  vi.mocked(auth).mockResolvedValueOnce({ user: { tenantId: "tenant-1" } } as any);
  vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);

  const mockCreatedProduct = { id: "prod-vars", name: "Tênis", slug: "tenis", price: 100, tenantId: "tenant-1" };
  txMock.product.create.mockResolvedValueOnce(mockCreatedProduct as any);
  
  const mockTypeRecord = {
    id: "type-1",
    name: "Tamanho",
    options: [
      { id: "opt-1", value: "39" },
      { id: "opt-2", value: "40" }
    ]
  };
  txMock.productVariationType.create.mockResolvedValueOnce(mockTypeRecord as any);
  txMock.productVariant.create.mockResolvedValue({ id: "var-1" } as any);

  const result = await createProduct({
    name: "Tênis",
    slug: "tenis",
    price: 100,
    status: "ACTIVE",
    stock: 0,
    trackInventory: true,
    variationTypes: [
      { name: "Tamanho", options: ["39", "40"] }
    ],
    variants: [
      { sku: "TENIS-39", price: 100, stock: 5, options: { "Tamanho": "39" } },
      { sku: "TENIS-40", price: 100, stock: 2, options: { "Tamanho": "40" } }
    ]
  });

  expect(result).toEqual(mockCreatedProduct);

  expect(txMock.productVariationType.create).toHaveBeenCalledWith({
    data: {
      name: "Tamanho",
      productId: "prod-vars",
      options: {
        create: [{ value: "39" }, { value: "40" }]
      }
    },
    include: { options: true }
  });

  expect(txMock.productVariant.create).toHaveBeenCalledTimes(2);
  expect(txMock.productVariant.create).toHaveBeenNthCalledWith(1, {
    data: {
      productId: "prod-vars",
      sku: "TENIS-39",
      price: 100,
      stock: 5,
      options: {
        connect: [{ id: "opt-1" }]
      }
    }
  });
  expect(txMock.productVariant.create).toHaveBeenNthCalledWith(2, {
    data: {
      productId: "prod-vars",
      sku: "TENIS-40",
      price: 100,
      stock: 2,
      options: {
        connect: [{ id: "opt-2" }]
      }
    }
  });
});
