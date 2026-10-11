export function parseBasePrice(value: string): number {
  if (!value.trim()) {
    throw new Error("Informe o preço base.");
  }

  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Informe um preço base válido, maior ou igual a zero.");
  }

  return price;
}
