import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductsClient } from "./products-client";
import { createProduct, updateProduct } from "@/lib/actions/products";

vi.mock("@/lib/actions/products", () => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}));

const product = {
  id: "product-1", name: "Camiseta", slug: "camiseta", price: 19.9,
  status: "DRAFT", stock: 0, trackInventory: true, categoryId: null,
  tenantId: "tenant-1", description: null, sku: null,
  createdAt: new Date("2026-10-11"), updatedAt: new Date("2026-10-11"),
  variationTypes: [], variants: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createProduct).mockResolvedValue(product);
  vi.mocked(updateProduct).mockResolvedValue(product);
});
afterEach(cleanup);

function openNew() {
  render(<ProductsClient initialProducts={[]} categories={[]} />);
  fireEvent.click(screen.getByRole("button", { name: "Novo Produto" }));
  fireEvent.change(screen.getByLabelText("Nome do Produto"), { target: { value: "Camiseta" } });
  fireEvent.change(screen.getByLabelText("Slug (URL)"), { target: { value: "camiseta" } });
}

function openEdit() {
  render(<ProductsClient initialProducts={[product]} categories={[]} />);
  const row = screen.getByRole("row", { name: /Camiseta/ });
  fireEvent.click(within(row).getAllByRole("button")[0]);
}

function submit() {
  // Exercise the handler even when native validation would block a browser submit.
  const form = screen.getByRole("button", { name: "Salvar Produto" }).closest("form");
  if (!form) throw new Error("Formulário não encontrado");
  fireEvent.submit(form);
}

describe("preço base no formulário", () => {
  it("permite limpar o preço sem salvar ou forçar zero", () => {
    openNew();
    const input = screen.getByLabelText("Preço Base (R$)");
    expect(input).toHaveValue(0);
    fireEvent.change(input, { target: { value: "" } });
    expect(input).toHaveValue(null);
    expect(createProduct).not.toHaveBeenCalled();
  });

  it.each([["19.90", 19.9], ["0", 0]])("envia %s como número ao criar", async (text, price) => {
    openNew();
    fireEvent.change(screen.getByLabelText("Preço Base (R$)"), { target: { value: text } });
    submit();
    await waitFor(() => expect(createProduct).toHaveBeenCalledWith(expect.objectContaining({ price })));
  });

  it.each([[null, 19.9], ["12.35", 12.35], ["0", 0]])("preserva ou altera o preço ao editar: %s", async (text, price) => {
    openEdit();
    const input = screen.getByLabelText("Preço Base (R$)");
    expect(input).toHaveValue(19.9);
    if (text !== null) fireEvent.change(input, { target: { value: text } });
    submit();
    await waitFor(() => expect(updateProduct).toHaveBeenCalledWith(product.id, expect.objectContaining({ price })));
  });

  it.each(["", "-0.01", "abc", "1e309"])("bloqueia preço inválido e permite corrigir: %j", async (value) => {
    openNew();
    const input = screen.getByLabelText("Preço Base (R$)");
    fireEvent.change(input, { target: { value } });
    submit();
    expect(screen.getByText(/Informe .*preço base/)).toBeInTheDocument();
    expect(createProduct).not.toHaveBeenCalled();
    expect(updateProduct).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Salvar Produto" })).toBeEnabled();
    fireEvent.change(input, { target: { value: "19.90" } });
    submit();
    await waitFor(() => expect(createProduct).toHaveBeenCalledWith(expect.objectContaining({ price: 19.9 })));
  });

  it("bloqueia preço apagado durante a edição", () => {
    openEdit();
    fireEvent.change(screen.getByLabelText("Preço Base (R$)"), { target: { value: "" } });
    submit();
    expect(screen.getByText("Informe o preço base.")).toBeInTheDocument();
    expect(updateProduct).not.toHaveBeenCalled();
  });
});
