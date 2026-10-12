import type { Category, Product, Tenant, User } from "@prisma/client";
import type { Session } from "next-auth";

const timestamps = { createdAt: new Date("2026-10-12"), updatedAt: new Date("2026-10-12") };

export function sessionFixture(user: Partial<Session["user"]> = {}): Session {
  return { user: { id: "user-1", role: "OWNER", tenantId: "tenant-1", ...user }, expires: "2099-01-01T00:00:00Z" };
}

export function categoryFixture(overrides: Partial<Category> = {}): Category {
  return { id: "cat-1", name: "Categoria 1", slug: "categoria-1", tenantId: "tenant-1", ...timestamps, ...overrides };
}

export function productFixture(overrides: Partial<Product> = {}): Product {
  return { id: "prod-1", name: "Camiseta", slug: "camiseta", description: null, price: 10, status: "DRAFT", sku: null, categoryId: null, tenantId: "tenant-1", stock: 0, trackInventory: true, ...timestamps, ...overrides };
}

export function tenantFixture(overrides: Partial<Tenant> = {}): Tenant {
  return { id: "tenant-1", name: "Loja", domain: "loja", ...timestamps, ...overrides };
}

export function userFixture(overrides: Partial<User> = {}): User {
  return { id: "user-1", name: null, email: null, emailVerified: null, image: null, password: null, role: "OWNER", tenantId: "tenant-1", ...timestamps, ...overrides };
}
