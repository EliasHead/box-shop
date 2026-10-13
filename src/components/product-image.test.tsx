import { createElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ProductImage } from "./product-image";
vi.mock("next/image", () => ({ default: ({ src, alt, onError, unoptimized }: { src: string; alt: string; onError: () => void; unoptimized: boolean }) => createElement("img", { src, alt, onError, "data-unoptimized": unoptimized }) }));
test("foto própria sem otimizador, fallback em erro e recuperação ao substituir", () => {
  const { rerender } = render(<ProductImage productId="p" imageKey="t/p/first.webp" name="Camiseta" />);
  expect(screen.getByRole("img", { name: "Camiseta" })).toHaveAttribute("src", "/api/product-images/p/first.webp");
  expect(screen.getByRole("img", { name: "Camiseta" })).toHaveAttribute("data-unoptimized", "true");
  fireEvent.error(screen.getByRole("img", { name: "Camiseta" }));
  expect(screen.getByRole("img", { name: "Camiseta: sem foto disponível" })).toBeInTheDocument();
  rerender(<ProductImage productId="p" imageKey="t/p/second.webp" name="Camiseta" />);
  expect(screen.getByRole("img", { name: "Camiseta" })).toHaveAttribute("src", "/api/product-images/p/second.webp");
  rerender(<ProductImage productId="p" imageKey={null} name="Camiseta" />);
  expect(screen.getByRole("img", { name: "Camiseta: sem foto disponível" })).toBeInTheDocument();
});
