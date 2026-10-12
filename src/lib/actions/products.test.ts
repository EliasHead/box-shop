import { productFixture, sessionFixture } from "@/test/fixtures";
import { expect, test, vi, beforeEach } from "vitest";
import type { ProductInput } from "@/lib/validations/product";
import type { Session } from "next-auth";
import { createProduct, updateProduct } from "./products";
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

const priceInput: ProductInput = {
  name: "Camiseta", slug: "camiseta", price: 19.9, status: "DRAFT",
  stock: 0, trackInventory: true, variationTypes: [], variants: [],
};

// Select the no-argument session overload rather than the middleware overload.
const sessionAuth = vi.mocked(auth as () => Promise<Session | null>);

test.each([null, undefined, ""])("criação rejeita sessão sem loja (%s) antes de consultar ou escrever", async (tenantId) => {
  sessionAuth.mockResolvedValueOnce({
    user: { id: "user-1", role: "OWNER", tenantId },
    expires: "2099-01-01T00:00:00Z",
  });
  await expect(createProduct(priceInput)).rejects.toThrow("Não autorizado");
  expect(prisma.product.findUnique).not.toHaveBeenCalled();
  expect(prisma.category.findFirst).not.toHaveBeenCalled();
  expect(prisma.$transaction).not.toHaveBeenCalled();
  expect(txMock.product.create).not.toHaveBeenCalled();
});

test("criação rejeita categoria de outra loja antes de escrever", async () => {
  sessionAuth.mockResolvedValueOnce({
    user: { id: "user-1", role: "OWNER", tenantId: "tenant-1" },
    expires: "2099-01-01T00:00:00Z",
  });
  vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);
  vi.mocked(prisma.category.findFirst).mockResolvedValueOnce(null);
  await expect(createProduct({ ...priceInput, categoryId: "other-store-category" }))
    .rejects.toThrow("Categoria não encontrada ou não pertence ao seu Tenant");
  expect(prisma.product.findUnique).toHaveBeenCalledWith({
    where: { tenantId_slug: { tenantId: "tenant-1", slug: "camiseta" } },
  });
  expect(prisma.category.findFirst).toHaveBeenCalledWith({
    where: { id: "other-store-category", tenantId: "tenant-1" },
  });
  expect(prisma.$transaction).not.toHaveBeenCalled();
  expect(txMock.product.create).not.toHaveBeenCalled();
});

test("criação e edição rejeitam operação sem sessão sem escrever", async () => {
  sessionAuth.mockResolvedValue(null);
  await expect(createProduct(priceInput)).rejects.toThrow("Não autorizado");
  await expect(updateProduct("product-1", priceInput)).rejects.toThrow("Não autorizado");
  expect(prisma.$transaction).not.toHaveBeenCalled();
  expect(txMock.product.create).not.toHaveBeenCalled();
  expect(txMock.product.update).not.toHaveBeenCalled();
});

test("edição rejeita produto de outra loja sem escrever", async () => {
  sessionAuth.mockResolvedValueOnce({
    user: { id: "user-1", role: "OWNER", tenantId: "tenant-1" },
    expires: "2099-01-01T00:00:00Z",
  });
  vi.mocked(prisma.product.findFirst).mockResolvedValueOnce(null);
  await expect(updateProduct("other-store-product", priceInput)).rejects.toThrow("Produto não encontrado");
  expect(prisma.product.findFirst).toHaveBeenCalledWith({
    where: { id: "other-store-product", tenantId: "tenant-1" },
  });
  expect(prisma.$transaction).not.toHaveBeenCalled();
  expect(txMock.product.update).not.toHaveBeenCalled();
});

test("createProduct falha se o slug já existir no tenant", async () => {
  sessionAuth.mockResolvedValueOnce(sessionFixture());
  vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(productFixture({ id: "existing" }));

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
  sessionAuth.mockResolvedValueOnce(sessionFixture());
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
  sessionAuth.mockResolvedValueOnce(sessionFixture());
  vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);
  
  const mockCreated = productFixture();
  txMock.product.create.mockResolvedValueOnce(mockCreated);

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
  sessionAuth.mockResolvedValueOnce(sessionFixture());
  vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);

  const mockCreatedProduct = { id: "prod-vars", name: "Tênis", slug: "tenis", price: 100, tenantId: "tenant-1" };
  txMock.product.create.mockResolvedValueOnce(mockCreatedProduct);
  
  const mockTypeRecord = {
    id: "type-1",
    name: "Tamanho",
    options: [
      { id: "opt-1", value: "39" },
      { id: "opt-2", value: "40" }
    ]
  };
  txMock.productVariationType.create.mockResolvedValueOnce(mockTypeRecord);
  txMock.productVariant.create.mockResolvedValue({ id: "var-1" });

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
