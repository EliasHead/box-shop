import { expect, test } from "vitest";
import { errorMessage } from "./error-message";

test.each([new Error("Falha conhecida"), { message: "Falha conhecida" }])("preserva mensagem de erro", (error) => {
  expect(errorMessage(error, "Fallback")).toBe("Falha conhecida");
});

test.each([null, undefined, "falha", {}, { message: "" }, { message: 42 }])("usa fallback para exceção sem mensagem: %j", (error) => {
  expect(errorMessage(error, "Fallback")).toBe("Fallback");
});
