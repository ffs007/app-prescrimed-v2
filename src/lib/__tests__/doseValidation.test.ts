import { describe, it, expect } from "vitest";
import { validarDose, validarLote, UNIDADES_POR_TIPO, type DoseRegistro } from "../doseValidation";

const base = (overrides: Partial<DoseRegistro> = {}): DoseRegistro => ({
  id: "d1",
  lote_id: "l1",
  linha_origem: null,
  principio_ativo: "amoxicilina",
  via: "oral",
  indicacao: "faringite",
  populacao: "adulto",
  dose_tipo: "fixa",
  dose_min: "500",
  dose_max: "1000",
  dose_unidade: "mg",
  fonte_id: "f1",
  ...overrides,
});

describe("validarDose", () => {
  it("caso feliz — dose fixa válida não gera inconsistências", () => {
    const out = validarDose(base());
    expect(out).toEqual([]);
  });

  it("caso feliz — dose por peso válida com unidade /kg não gera inconsistências", () => {
    const out = validarDose(
      base({ dose_tipo: "peso", dose_unidade: "mg/kg", dose_min: "10", dose_max: "20" }),
    );
    expect(out).toEqual([]);
  });

  it("bloqueia campo obrigatório ausente (princípio ativo vazio)", () => {
    const out = validarDose(base({ principio_ativo: "" }));
    expect(out).toContainEqual(
      expect.objectContaining({ campo: "principio_ativo", severidade: "erro" }),
    );
  });

  it("bloqueia todos os 6 campos obrigatórios ausentes de uma vez", () => {
    const out = validarDose(
      base({
        principio_ativo: null,
        via: null,
        populacao: null,
        dose_tipo: null,
        dose_unidade: null,
        fonte_id: null,
      }),
    );
    const campos = out.filter((i) => i.severidade === "erro").map((i) => i.campo);
    expect(campos).toEqual(
      expect.arrayContaining([
        "principio_ativo",
        "via",
        "populacao",
        "dose_tipo",
        "dose_unidade",
        "fonte_id",
      ]),
    );
  });

  it("dose_min ausente gera erro obrigatório", () => {
    const out = validarDose(base({ dose_min: null }));
    expect(out).toContainEqual(
      expect.objectContaining({ campo: "dose_min", severidade: "erro", mensagem: "Dose mínima é obrigatória." }),
    );
  });

  it("dose_min não numérica gera erro de formato", () => {
    const out = validarDose(base({ dose_min: "abc" }));
    expect(out).toContainEqual(
      expect.objectContaining({ campo: "dose_min", severidade: "erro", mensagem: "Dose mínima não é um número válido." }),
    );
  });

  it("dose_min negativa é bloqueada (caso limite: fronteira em 0)", () => {
    const out = validarDose(base({ dose_min: "-1" }));
    expect(out).toContainEqual(
      expect.objectContaining({ campo: "dose_min", severidade: "erro", mensagem: "Dose mínima não pode ser negativa." }),
    );
  });

  it("dose_min = 0 exato NÃO é bloqueado (limite exato aceito)", () => {
    const out = validarDose(base({ dose_min: "0" }));
    expect(out.some((i) => i.campo === "dose_min" && i.severidade === "erro")).toBe(false);
  });

  it("dose_max negativa é bloqueada", () => {
    const out = validarDose(base({ dose_max: "-5" }));
    expect(out).toContainEqual(
      expect.objectContaining({ campo: "dose_max", severidade: "erro", mensagem: "Dose máxima não pode ser negativa." }),
    );
  });

  it("CASO CRÍTICO — dose_min maior que dose_max é bloqueada (valores invertidos)", () => {
    const out = validarDose(base({ dose_min: "1000", dose_max: "500" }));
    expect(out).toContainEqual(
      expect.objectContaining({
        campo: "dose_max",
        severidade: "erro",
        mensagem: "Valores invertidos: mínima (1000) maior que máxima (500).",
      }),
    );
  });

  it("dose_min igual a dose_max NÃO é considerado invertido", () => {
    const out = validarDose(base({ dose_min: "500", dose_max: "500" }));
    expect(out.some((i) => i.mensagem.startsWith("Valores invertidos"))).toBe(false);
  });

  it("caso limite — intervalo > 100x entre min e max gera alerta (não erro)", () => {
    const out = validarDose(base({ dose_min: "1", dose_max: "101" }));
    expect(out).toContainEqual(
      expect.objectContaining({ campo: "dose_max", severidade: "alerta" }),
    );
  });

  it("caso limite — intervalo exatamente 100x NÃO gera alerta (> estrito)", () => {
    const out = validarDose(base({ dose_min: "1", dose_max: "100" }));
    expect(out.some((i) => i.mensagem.includes("muito amplo"))).toBe(false);
  });

  it("unidade fora da lista padronizada gera alerta", () => {
    const out = validarDose(base({ dose_unidade: "gotas" }));
    expect(out).toContainEqual(
      expect.objectContaining({ campo: "dose_unidade", severidade: "alerta" }),
    );
  });

  it("CASO CRÍTICO — dose_tipo peso com unidade sem /kg é bloqueada (risco de erro de dose por peso)", () => {
    const out = validarDose(base({ dose_tipo: "peso", dose_unidade: "mg", dose_min: "5", dose_max: "10" }));
    expect(out).toContainEqual(
      expect.objectContaining({
        campo: "dose_unidade",
        severidade: "erro",
        mensagem: 'Dose por peso deve usar unidade por kg (recebido "mg").',
      }),
    );
  });

  it("dose_tipo fixa com unidade /kg é bloqueada (inconsistência inversa)", () => {
    const out = validarDose(base({ dose_tipo: "fixa", dose_unidade: "mg/kg", dose_min: "5", dose_max: "10" }));
    expect(out).toContainEqual(
      expect.objectContaining({
        campo: "dose_unidade",
        severidade: "erro",
        mensagem: 'Dose fixa não deve usar unidade por kg (recebido "mg/kg").',
      }),
    );
  });

  it("aceita vírgula decimal como separador (formato pt-BR)", () => {
    const out = validarDose(base({ dose_min: "1,5", dose_max: "2,5" }));
    expect(out.some((i) => i.campo === "dose_min" && i.severidade === "erro")).toBe(false);
  });

  it("UNIDADES_POR_TIPO expõe listas separadas para peso e fixa", () => {
    expect(UNIDADES_POR_TIPO.peso).toContain("mg/kg");
    expect(UNIDADES_POR_TIPO.fixa).toContain("mg");
    expect(UNIDADES_POR_TIPO.peso).not.toContain("mg");
  });
});

describe("validarLote", () => {
  it("caso feliz — lote sem inconsistências retorna contadores zerados", () => {
    const out = validarLote([base({ id: "a" }), base({ id: "b" })]);
    expect(out.erros).toBe(0);
    expect(out.alertas).toBe(0);
    expect(out.inconsistencias).toEqual([]);
  });

  it("agrupa inconsistências por doseId em porDose", () => {
    const out = validarLote([base({ id: "a", dose_min: "-1" }), base({ id: "b" })]);
    expect(out.porDose["a"]).toHaveLength(1);
    expect(out.porDose["b"]).toBeUndefined();
  });

  it("caso limite — lote vazio não quebra e retorna zerado", () => {
    const out = validarLote([]);
    expect(out.erros).toBe(0);
    expect(out.alertas).toBe(0);
    expect(out.inconsistencias).toEqual([]);
  });

  it("soma erros e alertas de múltiplas doses corretamente", () => {
    const out = validarLote([
      base({ id: "a", dose_min: "-1" }), // 1 erro
      base({ id: "b", dose_unidade: "gotas" }), // 1 alerta
    ]);
    expect(out.erros).toBe(1);
    expect(out.alertas).toBe(1);
  });
});
