import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ProductImageDialog } from "./product-image-dialog";
import { removeProductImage, uploadProductImage } from "@/lib/actions/product-images";
vi.mock("@/lib/actions/product-images", () => ({ uploadProductImage: vi.fn(), removeProductImage: vi.fn() }));
vi.mock("@/components/product-image", () => ({ ProductImage: () => <div>Prévia</div> }));

test("envia, bloqueia comandos pendentes, mantém diálogo em falha e permite tentar novamente", async () => {
  let finish!: (result: { error: string }) => void;
  vi.mocked(uploadProductImage).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
  const saved = vi.fn(), closed = vi.fn();
  render(<ProductImageDialog product={{ id: "p", name: "Camiseta", imageKey: null }} onSaved={saved} onClose={closed} />);
  fireEvent.change(screen.getByLabelText("Escolher foto"), { target: { files: [new File(["image"], "photo.png", { type: "image/png" })] } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar foto" }));
  expect(screen.getByText("Processando foto…")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Enviar foto" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Remover foto" })).toBeDisabled();
  finish({ error: "Imagem inválida." });
  await screen.findByText("Imagem inválida.");
  expect(closed).not.toHaveBeenCalled();
  vi.mocked(uploadProductImage).mockResolvedValueOnce({ success: true, imageKey: "t/p/new.webp" });
  fireEvent.click(screen.getByRole("button", { name: "Enviar foto" }));
  await waitFor(() => expect(saved).toHaveBeenCalledWith("t/p/new.webp"));
});

test("substitui e remove foto existente sem alterar outros dados", async () => {
  const saved = vi.fn();
  vi.mocked(uploadProductImage).mockResolvedValueOnce({ success: true, imageKey: "new" });
  vi.mocked(removeProductImage).mockResolvedValueOnce({ success: true, imageKey: null });
  render(<ProductImageDialog product={{ id: "p", name: "Camiseta", imageKey: "old" }} onSaved={saved} onClose={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("Escolher foto"), { target: { files: [new File(["image"], "photo.webp")] } });
  fireEvent.click(screen.getByRole("button", { name: "Substituir foto" }));
  await waitFor(() => expect(saved).toHaveBeenCalledWith("new"));
  fireEvent.click(screen.getByRole("button", { name: "Remover foto" }));
  await waitFor(() => expect(saved).toHaveBeenCalledWith(null));
  expect(removeProductImage).toHaveBeenCalledWith("p");
});
