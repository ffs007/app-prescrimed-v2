import { describe, it, expect } from "vitest";
import {
  calcIdadeAnos,
  isPediatric,
  parseFrequencia,
  computePediatricCalc,
  specFromMedication,
  fmtNum,
  PED_DEFAULTS,
  type PatientPed,
  type PedDoseSpec,
  type PedCalcInput,
} from "../pediatricCalc";
import type { IVMedication } from "../../IVDilutionAdminPage";

const patient = (overrides: Partial<PatientPed> = {}): PatientPed => ({
  peso_kg: 10,
  idade_anos: 2,
  ...overrides,
});

const spec = (overrides: Partial<PedDoseSpec> = {}): PedDoseSpec => ({
  dose_pediatrica_min: 10,
  dose_pediatrica_max: 15,
  unidade_dose_pediatrica: "mg/kg/dose",
  ...overrides,
});

describe("calcIdadeAnos", () => {
  it("caso feliz — usa idade_anos diretamente quando fornecida", () => {
    expect(calcIdadeAnos({ idade_anos: 5 })).toBe(5);
  });

  it("deriva idade a partir de idade_meses quando idade_anos ausente", () => {
    expect(calcIdadeAnos({ idade_meses: 24 })).toBeCloseTo(2, 5);
  });

  it("deriva idade a partir de idade_dias quando as demais estão ausentes", () => {
    expect(calcIdadeAnos({ idade_dias: 365.25 })).toBeCloseTo(1, 5);
  });

  it("deriva idade a partir de data_nascimento válida", () => {
    const umAnoAtras = new Date();
    umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 3);
    const idade = calcIdadeAnos({ data_nascimento: umAnoAtras.toISOString() });
    expect(idade).toBeGreaterThan(2.9);
    expect(idade).toBeLessThan(3.1);
  });

  it("caso de erro — data_nascimento inválida e nenhum outro campo retorna undefined", () => {
    expect(calcIdadeAnos({ data_nascimento: "não-é-uma-data" })).toBeUndefined();
  });

  it("caso de erro — paciente sem nenhum dado de idade retorna undefined", () => {
    expect(calcIdadeAnos({})).toBeUndefined();
  });
});

describe("isPediatric", () => {
  it("flag explícita paciente_pediatrico=true prevalece mesmo sem idade", () => {
    expect(isPediatric({ paciente_pediatrico: true })).toBe(true);
  });

  it("idade < 18 é pediátrico", () => expect(isPediatric({ idade_anos: 17 })).toBe(true));
  it("caso limite — idade exatamente 18 NÃO é pediátrico (< estrito)", () => expect(isPediatric({ idade_anos: 18 })).toBe(false));
  it("idade adulta não é pediátrica", () => expect(isPediatric({ idade_anos: 40 })).toBe(false));
  it("sem nenhum dado de idade não é pediátrico (undefined não é < 18)", () => expect(isPediatric({})).toBe(false));
});

describe("parseFrequencia", () => {
  it("'dose única' retorna 1 administração", () => expect(parseFrequencia("dose única")).toBe(1));
  it("'contínuo' retorna null (infusão contínua não tem contagem de doses)", () => expect(parseFrequencia("uso contínuo")).toBeNull());
  it("'se necessário' retorna null", () => expect(parseFrequencia("se necessário")).toBeNull());
  it("'8/8h' retorna 3 administrações por dia", () => expect(parseFrequencia("8/8h")).toBe(3));
  it("'cada 6h' retorna 4 administrações por dia", () => expect(parseFrequencia("cada 6h")).toBe(4));
  it("'12/12' retorna 2", () => expect(parseFrequencia("12/12")).toBe(2));
  it("texto vazio ou nulo retorna null", () => {
    expect(parseFrequencia(null)).toBeNull();
    expect(parseFrequencia("")).toBeNull();
  });
  it("caso de erro — texto não reconhecido retorna null", () => expect(parseFrequencia("conforme orientação médica")).toBeNull());
});

describe("computePediatricCalc — não aplicável", () => {
  it("paciente adulto retorna aplicavel=false e status nao_aplicavel", () => {
    const r = computePediatricCalc({ patient: patient({ idade_anos: 40 }), spec: spec() });
    expect(r.aplicavel).toBe(false);
    expect(r.status).toBe("nao_aplicavel");
    expect(r.alerts).toEqual([]);
  });
});

describe("computePediatricCalc — CASO CRÍTICO: peso ausente/inválido DEVE gerar erro/alerta", () => {
  it("peso ausente (undefined) gera alerta crítico 'peso_ausente' com exigir_peso_pediatrico=true", () => {
    const r = computePediatricCalc({ patient: patient({ peso_kg: null }), spec: spec() });
    expect(r.alerts).toContainEqual(expect.objectContaining({ tipo: "peso_ausente", gravidade: "alto" }));
  });

  it("peso zero é tratado como ausente (peso <= 0 é a checagem, não apenas null)", () => {
    const r = computePediatricCalc({ patient: patient({ peso_kg: 0 }), spec: spec() });
    expect(r.alerts).toContainEqual(expect.objectContaining({ tipo: "peso_ausente" }));
  });

  it("peso negativo é tratado como ausente/inválido", () => {
    const r = computePediatricCalc({ patient: patient({ peso_kg: -5 }), spec: spec() });
    expect(r.alerts).toContainEqual(expect.objectContaining({ tipo: "peso_ausente" }));
  });

  it("com exigir_peso_pediatrico desligado, peso ausente NÃO gera alerta (comportamento configurável)", () => {
    const r = computePediatricCalc(
      { patient: patient({ peso_kg: null }), spec: spec() },
      { ...PED_DEFAULTS, exigir_peso_pediatrico: false },
    );
    expect(r.alerts.some((a) => a.tipo === "peso_ausente")).toBe(false);
  });

  it("peso ausente por si só não bloqueia o resultado (bloqueia:false na regra) — não confundir com o status", () => {
    const r = computePediatricCalc({ patient: patient({ peso_kg: null }), spec: spec() });
    const alerta = r.alerts.find((a) => a.tipo === "peso_ausente")!;
    expect(alerta.bloqueia).toBe(false);
    // Mas eleva o status para crítico por ser gravidade "alto":
    expect(r.status).toBe("critico");
  });
});

describe("computePediatricCalc — cálculo por kg (dose/administração)", () => {
  it("caso feliz — dose dentro da faixa não gera alerta e status fica ok", () => {
    const r = computePediatricCalc({
      patient: patient({ peso_kg: 10 }),
      spec: spec({ dose_pediatrica_min: 10, dose_pediatrica_max: 15, unidade_dose_pediatrica: "mg/kg/dose" }),
      dose_prescrita: 120, // 12 mg/kg, dentro de 10-15
      unidade_prescrita: "mg",
    });
    expect(r.dose_mg_kg).toBe(12);
    expect(r.status).toBe("ok");
    expect(r.alerts.some((a) => a.tipo.startsWith("dose_"))).toBe(false);
  });

  it("CASO CRÍTICO — dose acima da faixa pediátrica por kg gera alerta alto e exige justificativa", () => {
    const r = computePediatricCalc({
      patient: patient({ peso_kg: 10 }),
      spec: spec({ dose_pediatrica_min: 10, dose_pediatrica_max: 15, unidade_dose_pediatrica: "mg/kg/dose" }),
      dose_prescrita: 200, // 20 mg/kg > 15
      unidade_prescrita: "mg",
    });
    expect(r.alerts).toContainEqual(
      expect.objectContaining({ tipo: "dose_acima_faixa", gravidade: "alto", exige_justificativa: true }),
    );
  });

  it("dose abaixo da faixa pediátrica por kg gera alerta médio", () => {
    const r = computePediatricCalc({
      patient: patient({ peso_kg: 10 }),
      spec: spec({ dose_pediatrica_min: 10, dose_pediatrica_max: 15, unidade_dose_pediatrica: "mg/kg/dose" }),
      dose_prescrita: 50, // 5 mg/kg < 10
      unidade_prescrita: "mg",
    });
    expect(r.alerts).toContainEqual(expect.objectContaining({ tipo: "dose_abaixo_faixa", gravidade: "medio" }));
  });

  it("CASO CRÍTICO — dose acima do máximo por administração bloqueia quando ultrapassa 2× (bloquear_dose_2x_maxima)", () => {
    const r = computePediatricCalc({
      patient: patient({ peso_kg: 10 }),
      spec: spec({ dose_maxima_por_administracao: 100 }),
      dose_prescrita: 250, // > 2×100
      unidade_prescrita: "mg",
    });
    const alerta = r.alerts.find((a) => a.tipo === "dose_max_adm_excedida")!;
    expect(alerta.bloqueia).toBe(true);
    expect(r.bloqueios).toContainEqual(alerta);
    expect(r.status).toBe("critico");
  });

  it("dose acima do máximo por administração mas abaixo de 2× NÃO bloqueia, só exige justificativa", () => {
    const r = computePediatricCalc({
      patient: patient({ peso_kg: 10 }),
      spec: spec({ dose_maxima_por_administracao: 100 }),
      dose_prescrita: 120, // 1.2× > 100 mas < 200
      unidade_prescrita: "mg",
    });
    const alerta = r.alerts.find((a) => a.tipo === "dose_max_adm_excedida")!;
    expect(alerta.bloqueia).toBe(false);
    expect(alerta.exige_justificativa).toBe(true);
    expect(r.excesso_percentual).toBeCloseTo(20, 5);
  });

  it("dose diária acima da máxima cadastrada (dose × frequência) gera alerta alto", () => {
    const r = computePediatricCalc({
      patient: patient({ peso_kg: 10 }),
      spec: spec({ dose_maxima_diaria: 300 }),
      dose_prescrita: 100,
      unidade_prescrita: "mg",
      frequencia_texto: "8/8h", // 3x/dia => 300, não excede; usar 6/6h => 4x => 400 > 300
    });
    // ajusta para excesso real:
    const r2 = computePediatricCalc({
      patient: patient({ peso_kg: 10 }),
      spec: spec({ dose_maxima_diaria: 300 }),
      dose_prescrita: 100,
      unidade_prescrita: "mg",
      frequencia_texto: "6/6h",
    });
    expect(r2.alerts).toContainEqual(expect.objectContaining({ tipo: "dose_max_dia_excedida", gravidade: "alto" }));
    expect(r.alerts.some((a) => a.tipo === "dose_max_dia_excedida")).toBe(false);
  });

  it("sem frequência reconhecida ao calcular dose por dia gera alerta 'frequencia_ausente'", () => {
    const r = computePediatricCalc({
      patient: patient({ peso_kg: 10 }),
      spec: spec({ dose_pediatrica_min: 10, dose_pediatrica_max: 20, unidade_dose_pediatrica: "mg/kg/dia" }),
    });
    expect(r.alerts).toContainEqual(expect.objectContaining({ tipo: "frequencia_ausente" }));
  });
});

describe("computePediatricCalc — faixa etária e peso validado", () => {
  it("idade abaixo da faixa etária mínima cadastrada gera alerta alto de restrição", () => {
    const r = computePediatricCalc({
      patient: patient({ idade_anos: 0.5, peso_kg: 6 }),
      spec: spec({ faixa_etaria_min: 1 }),
    });
    expect(r.alerts).toContainEqual(expect.objectContaining({ tipo: "faixa_etaria_incompativel", gravidade: "alto" }));
  });

  it("idade acima da faixa etária máxima cadastrada gera alerta alto de restrição", () => {
    const r = computePediatricCalc({
      patient: patient({ idade_anos: 16, peso_kg: 50 }),
      spec: spec({ faixa_etaria_max: 12 }),
    });
    expect(r.alerts).toContainEqual(expect.objectContaining({ tipo: "faixa_etaria_incompativel" }));
  });

  it("restricao_idade cadastrada torna o alerta de faixa etária bloqueante", () => {
    const r = computePediatricCalc({
      patient: patient({ idade_anos: 0.2, peso_kg: 4 }),
      spec: spec({ faixa_etaria_min: 1, restricao_idade: "Contraindicado em menores de 1 ano" }),
    });
    const alerta = r.alerts.find((a) => a.tipo === "faixa_etaria_incompativel")!;
    expect(alerta.bloqueia).toBe(true);
  });

  it("peso fora da faixa validada (abaixo do mínimo) gera alerta médio", () => {
    const r = computePediatricCalc({
      patient: patient({ peso_kg: 2 }),
      spec: spec({ peso_minimo_kg: 3 }),
    });
    expect(r.alerts).toContainEqual(expect.objectContaining({ tipo: "peso_fora_faixa", gravidade: "medio" }));
  });

  it("peso fora da faixa validada (acima do máximo) gera alerta médio", () => {
    const r = computePediatricCalc({
      patient: patient({ peso_kg: 80 }),
      spec: spec({ peso_maximo_kg: 60 }),
    });
    expect(r.alerts).toContainEqual(expect.objectContaining({ tipo: "peso_fora_faixa", gravidade: "medio" }));
  });
});

describe("computePediatricCalc — volume, ajuste renal/hepático e infusão contínua", () => {
  it("CASO CRÍTICO — volume calculado abaixo de 0,1 mL bloqueia (precisão de administração)", () => {
    const r = computePediatricCalc({
      patient: patient({ peso_kg: 10 }),
      spec: spec(),
      dose_prescrita: 1,
      unidade_prescrita: "mg",
      concentracao_apresentacao: 50, // 1/50 = 0.02 mL
    });
    const alerta = r.alerts.find((a) => a.tipo === "volume_muito_baixo")!;
    expect(alerta.bloqueia).toBe(true);
    expect(r.status).toBe("critico");
  });

  it("volume entre 0,1 e 0,5 mL gera alerta médio sem bloquear", () => {
    const r = computePediatricCalc({
      patient: patient({ peso_kg: 10 }),
      spec: spec(),
      dose_prescrita: 15,
      unidade_prescrita: "mg",
      concentracao_apresentacao: 50, // 0.3 mL
    });
    const alerta = r.alerts.find((a) => a.tipo === "volume_muito_baixo")!;
    expect(alerta.bloqueia).toBe(false);
    expect(alerta.gravidade).toBe("medio");
  });

  it("spec com exige_ajuste_funcao_renal gera alerta informativo de ajuste", () => {
    const r = computePediatricCalc({
      patient: patient({ peso_kg: 10 }),
      spec: spec({ exige_ajuste_funcao_renal: true }),
    });
    expect(r.alerts).toContainEqual(expect.objectContaining({ tipo: "ajuste_renal_hepatico", gravidade: "informativo" }));
  });

  it("infusão contínua (mcg/kg/min) calcula velocidade em mL/h a partir da dose prescrita", () => {
    const r = computePediatricCalc({
      patient: patient({ peso_kg: 10 }),
      spec: spec({ unidade_dose_pediatrica: "mcg/kg/min", dose_pediatrica_max: 1 }),
      dose_prescrita: 0.5, // mcg/kg/min
      concentracao_solucao_mcg_ml: 400,
    });
    expect(r.velocidade_ml_h).toBeCloseTo((0.5 * 10 * 60) / 400, 5);
  });

  it("infusão contínua: cálculo inverso a partir da velocidade em mL/h detecta dose acima do limite", () => {
    const r = computePediatricCalc({
      patient: patient({ peso_kg: 10 }),
      spec: spec({ unidade_dose_pediatrica: "mcg/kg/min", dose_pediatrica_max: 0.5 }),
      velocidade_ml_h: 12,
      concentracao_solucao_mcg_ml: 400,
    });
    expect(r.dose_mcg_kg_min_inversa).toBeCloseTo((12 * 400) / (10 * 60), 5);
    expect(r.alerts).toContainEqual(expect.objectContaining({ tipo: "dose_acima_faixa" }));
  });
});

describe("computePediatricCalc — dose pediátrica não cadastrada", () => {
  it("spec totalmente vazia gera alerta informativo 'dose_pediatrica_nao_cadastrada'", () => {
    const r = computePediatricCalc({ patient: patient({ peso_kg: 10 }), spec: {} });
    expect(r.alerts).toContainEqual(expect.objectContaining({ tipo: "dose_pediatrica_nao_cadastrada", gravidade: "informativo" }));
    expect(r.status).toBe("incompleto");
  });
});

describe("specFromMedication", () => {
  it("mapeia campos pediátricos de um IVMedication estendido, preenchendo ausentes com null", () => {
    const partial = { dose_pediatrica_min: 5, dose_pediatrica_max: 10 } as IVMedication & Partial<PedDoseSpec>;
    const r = specFromMedication(partial);
    expect(r.dose_pediatrica_min).toBe(5);
    expect(r.dose_pediatrica_max).toBe(10);
    expect(r.unidade_dose_pediatrica).toBeNull();
    expect(r.uso_neonatal).toBeNull();
  });
});

describe("fmtNum", () => {
  it("null/undefined/NaN retornam travessão", () => {
    expect(fmtNum(null)).toBe("—");
    expect(fmtNum(undefined)).toBe("—");
    expect(fmtNum(NaN)).toBe("—");
  });
  it("formata número com casas decimais padrão (pt-BR)", () => {
    expect(fmtNum(1234.5)).toBe((1234.5).toLocaleString("pt-BR", { maximumFractionDigits: 2 }));
  });
});
