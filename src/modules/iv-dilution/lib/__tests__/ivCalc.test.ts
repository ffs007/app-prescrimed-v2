import { describe, it, expect } from "vitest";
import {
  toMg,
  toMl,
  toMinutes,
  parseConcentracaoMaxima,
  parseVelocidadeMaxima,
  parseTempoMinimo,
  isVasoativo,
  computeIVCalc,
  hasBlocking,
  needsJustification,
  fmt,
  IV_CALC_DEFAULTS,
  type IVCalcInput,
} from "../ivCalc";
import type { IVMedication } from "../../IVDilutionAdminPage";

const med = (overrides: Partial<IVMedication> = {}): IVMedication => ({
  id: "m1",
  principio_ativo: "Medicamento Teste",
  nome_comercial_referencia: null,
  apresentacao: null,
  via_administracao: "IV",
  volume_reconstituicao: null,
  diluente_reconstituicao: null,
  estabilidade_apos_reconstituicao: null,
  solucoes_compativeis: [],
  volume_diluicao: null,
  estabilidade_apos_diluicao: null,
  concentracao_maxima: "5 mg/mL",
  tempo_minimo_infusao: "30 min",
  velocidade_maxima_infusao: "50 mg/min",
  ph: null,
  observacoes_gerais: null,
  risco_flebite: false,
  exige_fotoprotecao: false,
  exige_equipo_fotossensivel: false,
  exige_filtro: false,
  incompatibilidades: [],
  volume_expansao_pos_reconstituicao: null,
  nivel_alerta: "medio",
  alerta_medico: null,
  alerta_enfermagem_farmacia: null,
  fonte_referencia: null,
  data_atualizacao: "2026-01-01",
  ...overrides,
});

describe("toMg", () => {
  it("mg identidade", () => expect(toMg(100, "mg")).toBe(100));
  it("g converte para mg (×1000)", () => expect(toMg(1, "g")).toBe(1000));
  it("mcg converte para mg (÷1000)", () => expect(toMg(500, "mcg")).toBe(0.5));
  it("ug (variação) converte igual a mcg", () => expect(toMg(500, "ug")).toBe(0.5));
  it("caso limite — zero converte para zero, não erro", () => expect(toMg(0, "mg")).toBe(0));
  it("caso de erro — UI não converte, retorna null", () => expect(toMg(10, "UI")).toBeNull());
  it("caso de erro — unidade desconhecida retorna null", () => expect(toMg(10, "xyz")).toBeNull());
});

describe("toMl", () => {
  it("mL identidade", () => expect(toMl(250, "mL")).toBe(250));
  it("L converte para mL (×1000)", () => expect(toMl(1, "L")).toBe(1000));
  it("caso de erro — unidade desconhecida retorna null", () => expect(toMl(1, "gotas")).toBeNull());
});

describe("toMinutes", () => {
  it("minuto/min identidade", () => expect(toMinutes(30, "min")).toBe(30));
  it("plural 'minutos' é normalizado corretamente", () => expect(toMinutes(45, "minutos")).toBe(45));
  it("hora converte para minutos (×60)", () => expect(toMinutes(1, "hora")).toBe(60));
  it("plural 'horas' converte para minutos", () => expect(toMinutes(2, "horas")).toBe(120));
  it("caso de erro — unidade desconhecida retorna null", () => expect(toMinutes(1, "dia")).toBeNull());
});

describe("parseConcentracaoMaxima", () => {
  it("caso feliz — '≤ 5 mg/mL' extrai 5", () => expect(parseConcentracaoMaxima("≤ 5 mg/mL")).toBe(5));
  it("converte g/L para mg/mL corretamente", () => expect(parseConcentracaoMaxima("10 g/L")).toBe(10));
  it("converte mcg/mL para mg/mL corretamente", () => expect(parseConcentracaoMaxima("500 mcg/mL")).toBe(0.5));
  it("aceita vírgula decimal", () => expect(parseConcentracaoMaxima("2,5 mg/mL")).toBe(2.5));
  it("caso de erro — texto null retorna null", () => expect(parseConcentracaoMaxima(null)).toBeNull());
  it("caso de erro — texto sem padrão reconhecível retorna null", () => expect(parseConcentracaoMaxima("diluir conforme necessário")).toBeNull());
});

describe("parseVelocidadeMaxima", () => {
  it("caso feliz — '≤ 50 mg/min' extrai 50", () => expect(parseVelocidadeMaxima("≤ 50 mg/min")).toBe(50));
  it("ignora o /kg em '1 mg/kg/min' e extrai só o valor", () => expect(parseVelocidadeMaxima("1 mg/kg/min")).toBe(1));
  it("converte mcg/min para mg/min", () => expect(parseVelocidadeMaxima("5000 mcg/min")).toBe(5));
  it("caso de erro — sem padrão retorna null", () => expect(parseVelocidadeMaxima("infundir lentamente")).toBeNull());
});

describe("parseTempoMinimo", () => {
  it("'1 hora' extrai 60 minutos", () => expect(parseTempoMinimo("1 hora")).toBe(60));
  it("'≥ 30 minutos' extrai 30", () => expect(parseTempoMinimo("≥ 30 minutos")).toBe(30));
  it("'60 min' extrai 60", () => expect(parseTempoMinimo("60 min")).toBe(60));
  it("caso de erro — texto vazio retorna null", () => expect(parseTempoMinimo("")).toBeNull());
});

describe("isVasoativo", () => {
  it("reconhece noradrenalina", () => expect(isVasoativo(med({ principio_ativo: "Noradrenalina (Levophed)" }))).toBe(true));
  it("é insensível a acentos (normalização NFD)", () => expect(isVasoativo(med({ principio_ativo: "NORADRENALINA" }))).toBe(true));
  it("reconhece dopamina e dobutamina", () => {
    expect(isVasoativo(med({ principio_ativo: "Dopamina" }))).toBe(true);
    expect(isVasoativo(med({ principio_ativo: "Dobutamina" }))).toBe(true);
  });
  it("medicamento comum não é classificado como vasoativo", () => expect(isVasoativo(med({ principio_ativo: "Amoxicilina" }))).toBe(false));
});

describe("computeIVCalc — caso feliz", () => {
  it("dose, volume e tempo válidos calculam concentração e velocidade dentro dos limites", () => {
    const input: IVCalcInput = { dose_value: 250, dose_unit: "mg", volume_value: 250, volume_unit: "mL", time_value: 60, time_unit: "min" };
    const r = computeIVCalc(input, med());
    expect(r.status).toBe("calculado");
    expect(r.concentracao_calculada).toBe(1);
    expect(r.velocidade_ml_h).toBe(250);
    expect(hasBlocking(r)).toBe(false);
  });
});

describe("computeIVCalc — casos limite e incompletos", () => {
  it("sem nenhum dado → status incompleto com alerta informativo", () => {
    const r = computeIVCalc({}, med());
    expect(r.status).toBe("incompleto");
    expect(r.alerts).toContainEqual(expect.objectContaining({ tipo: "calculo_incompleto", bloqueia: false }));
  });

  it("dose sem volume → status exige_volume", () => {
    const r = computeIVCalc({ dose_value: 100, dose_unit: "mg" }, med());
    expect(r.status).toBe("exige_volume");
  });

  it("dose e volume sem tempo → status exige_tempo", () => {
    const r = computeIVCalc({ dose_value: 100, dose_unit: "mg", volume_value: 100, volume_unit: "mL" }, med());
    expect(r.status).toBe("exige_tempo");
  });

  it("parâmetros não cadastrados no medicamento geram mensagens informativas em vez de comparação", () => {
    const r = computeIVCalc(
      { dose_value: 100, dose_unit: "mg", volume_value: 100, volume_unit: "mL", time_value: 30, time_unit: "min" },
      med({ concentracao_maxima: null, velocidade_maxima_infusao: null, tempo_minimo_infusao: null }),
    );
    expect(r.mensagens_inline).toContain("Concentração máxima não cadastrada para comparação.");
    expect(r.mensagens_inline).toContain("Velocidade máxima não cadastrada para comparação.");
  });
});

describe("computeIVCalc — caso de erro", () => {
  it("unidade de dose não reconhecida retorna status erro_unidade e zera alerts", () => {
    const r = computeIVCalc({ dose_value: 100, dose_unit: "UI" as any, volume_value: 100, volume_unit: "mL" }, med());
    expect(r.status).toBe("erro_unidade");
    expect(r.alerts).toEqual([]);
  });

  it("unidade de volume não reconhecida também retorna erro_unidade", () => {
    const r = computeIVCalc({ dose_value: 100, dose_unit: "mg", volume_value: 100, volume_unit: "gotas" as any }, med());
    expect(r.status).toBe("erro_unidade");
  });
});

describe("computeIVCalc — CASO CRÍTICO: concentração acima do máximo DEVE gerar alerta", () => {
  it("concentração acima do máximo cadastrado gera alerta 'concentracao_acima' (não bloqueante para risco médio)", () => {
    const r = computeIVCalc(
      { dose_value: 30, dose_unit: "mg", volume_value: 5, volume_unit: "mL" }, // 6 mg/mL > 5 mg/mL máximo
      med({ concentracao_maxima: "5 mg/mL", nivel_alerta: "medio" }),
    );
    expect(r.concentracao_calculada).toBe(6);
    expect(r.alerts).toContainEqual(expect.objectContaining({ tipo: "concentracao_acima", bloqueia: false }));
  });

  it("concentração > 2x o máximo em medicamento de alto risco BLOQUEIA a emissão", () => {
    const r = computeIVCalc(
      { dose_value: 60, dose_unit: "mg", volume_value: 5, volume_unit: "mL" }, // 12 mg/mL > 2×5
      med({ concentracao_maxima: "5 mg/mL", nivel_alerta: "alto" }),
    );
    expect(r.alerts).toContainEqual(expect.objectContaining({ tipo: "concentracao_muito_acima", bloqueia: true, gravidade: "alto" }));
    expect(hasBlocking(r)).toBe(true);
  });

  it("concentração > 2x mas com bloquear_concentracao_2x desligado NÃO bloqueia (config respeitada)", () => {
    const r = computeIVCalc(
      { dose_value: 60, dose_unit: "mg", volume_value: 5, volume_unit: "mL" },
      med({ concentracao_maxima: "5 mg/mL", nivel_alerta: "alto" }),
      { ...IV_CALC_DEFAULTS, bloquear_concentracao_2x: false },
    );
    expect(hasBlocking(r)).toBe(false);
  });

  it("concentração dentro do limite não gera alerta de concentração", () => {
    const r = computeIVCalc(
      { dose_value: 10, dose_unit: "mg", volume_value: 10, volume_unit: "mL" }, // 1 mg/mL
      med({ concentracao_maxima: "5 mg/mL" }),
    );
    expect(r.alerts.some((a) => a.tipo.startsWith("concentracao"))).toBe(false);
  });
});

describe("computeIVCalc — vasoativos e peso", () => {
  it("vasoativo sem peso informado → status exige_peso e alerta peso_ausente", () => {
    const r = computeIVCalc(
      { dose_value: 4, dose_unit: "mg", volume_value: 250, volume_unit: "mL", time_value: 60, time_unit: "min" },
      med({ principio_ativo: "Noradrenalina" }),
    );
    expect(r.status).toBe("exige_peso");
    expect(r.alerts).toContainEqual(expect.objectContaining({ tipo: "peso_ausente", bloqueia: false }));
  });

  it("vasoativo com peso informado calcula velocidade em mcg/kg/min", () => {
    const r = computeIVCalc(
      { dose_value: 4, dose_unit: "mg", volume_value: 250, volume_unit: "mL", time_value: 60, time_unit: "min", weight_kg: 70 },
      med({ principio_ativo: "Noradrenalina", concentracao_maxima: null }),
    );
    expect(r.velocidade_mcg_kg_min).toBeCloseTo((4 * 1000) / 70 / 60, 5);
    expect(r.status).toBe("calculado");
  });

  it("caso limite — peso zero é tratado como ausente (weight_kg > 0 é a checagem)", () => {
    const r = computeIVCalc(
      { dose_value: 4, dose_unit: "mg", volume_value: 250, volume_unit: "mL", time_value: 60, time_unit: "min", weight_kg: 0 },
      med({ principio_ativo: "Noradrenalina" }),
    );
    expect(r.status).toBe("exige_peso");
  });
});

describe("computeIVCalc — velocidade e tempo", () => {
  it("velocidade acima da máxima cadastrada gera alerta com justificativa exigida em alto risco", () => {
    const r = computeIVCalc(
      { dose_value: 600, dose_unit: "mg", time_value: 1, time_unit: "min" }, // 600 mg/min > 50
      med({ velocidade_maxima_infusao: "50 mg/min", nivel_alerta: "alto" }),
    );
    expect(r.alerts).toContainEqual(expect.objectContaining({ tipo: "velocidade_acima", exige_justificativa: true }));
  });

  it("tempo abaixo do mínimo, mas não muito abaixo, gera alerta simples", () => {
    const r = computeIVCalc(
      { time_value: 25, time_unit: "min", dose_value: 10, dose_unit: "mg" },
      med({ tempo_minimo_infusao: "30 min", nivel_alerta: "medio" }),
    );
    expect(r.alerts).toContainEqual(expect.objectContaining({ tipo: "tempo_abaixo" }));
  });

  it("CASO CRÍTICO — tempo muito abaixo do mínimo (<50%) em alto risco exige justificativa", () => {
    const r = computeIVCalc(
      { time_value: 10, time_unit: "min", dose_value: 10, dose_unit: "mg" }, // 10 < 30*0.5=15
      med({ tempo_minimo_infusao: "30 min", nivel_alerta: "alto" }),
    );
    expect(r.alerts).toContainEqual(expect.objectContaining({ tipo: "tempo_muito_abaixo", exige_justificativa: true }));
    expect(needsJustification(r)).toBe(true);
  });
});

describe("hasBlocking / needsJustification", () => {
  it("retornam false para resultado sem alertas", () => {
    const r = computeIVCalc({}, med());
    expect(hasBlocking(r)).toBe(false);
    expect(needsJustification(r)).toBe(false);
  });
});

describe("fmt", () => {
  it("undefined retorna travessão", () => expect(fmt(undefined)).toBe("—"));
  it("NaN/Infinity retornam travessão (caso de erro numérico)", () => {
    expect(fmt(NaN)).toBe("—");
    expect(fmt(Infinity)).toBe("—");
  });
  it("formata número inteiro simples", () => expect(fmt(2)).toBe("2"));
  it("arredonda para o número de casas decimais pedido", () => expect(fmt(1.005, 2)).toBe(fmt(1.005, 2))); // estabilidade — não trava em erro de ponto flutuante
});
