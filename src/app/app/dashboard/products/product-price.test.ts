import { describe, expect, it } from "vitest";
import { parseBasePrice } from "./product-price";

describe("validação do preço base", () => {
  it.each(["", " ", "\t"])("rejeita preço obrigatório ausente: %j", (value) => {
    expect(() => parseBasePrice(value)).toThrow("Informe o preço base.");
  });

  it.each(["abc", "19.90abc", "Infinity", "-Infinity", "1e309", "NaN", "-0.01"])(
    "rejeita preço inválido: %s",
    (value) => {
      expect(() => parseBasePrice(value)).toThrow("Informe um preço base válido");
    },
  );
});
