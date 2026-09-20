import { describe, expect, it } from "vitest";
import { sanitizeAuditDetails } from "./sanitizeAudit";

describe("sanitizeAuditDetails", () => {
  it("redige campos que identificam paciente ou carregam texto clínico", () => {
    expect(
      sanitizeAuditDetails({ paciente_nome: "Maria", cpf: "123", email: "a@b.c", hash: "abc", origem: "atendimento_atual" }),
    ).toEqual({ paciente_nome: "[redigido]", cpf: "[redigido]", email: "[redigido]", hash: "abc", origem: "atendimento_atual" });
  });

  it("preserva metadados técnicos e valores vazios", () => {
    expect(sanitizeAuditDetails({ operacao: "cancelamento", nome: "", contagem: 3 })).toEqual({
      operacao: "cancelamento",
      nome: "",
      contagem: 3,
    });
  });

  it("aplica recursivamente em objetos e listas", () => {
    expect(sanitizeAuditDetails({ itens: [{ posologia: "1 cp 8/8h", id: 7 }] })).toEqual({
      itens: [{ posologia: "[redigido]", id: 7 }],
    });
  });

  it("não redige chaves apenas parecidas", () => {
    expect(sanitizeAuditDetails({ nomenclatura: "x", hash_documento: "h" })).toEqual({ nomenclatura: "x", hash_documento: "h" });
  });
});
