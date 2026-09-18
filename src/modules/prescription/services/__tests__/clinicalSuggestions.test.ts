/**
 * Etapa 1 — testes funcionais do motor único de sugestões e busca.
 * Cobrem os 7 casos definidos na auditoria.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const rpcMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
    from: (...args: unknown[]) => fromMock(...args),
    auth: { getUser: async () => ({ data: { user: null } }) },
  },
}));

import {
  getClinicalSuggestions,
  searchMedications,
  suggestionToMedication,
  normalizeClinical,
} from "../clinicalSuggestions";

/** Builder mínimo do query builder do Supabase. */
function makeBuilder(result: { data: unknown; error: unknown }) {
  const calls: Array<[string, unknown[]]> = [];
  const builder: Record<string, unknown> = {};
  const chain = (name: string) => (...args: unknown[]) => {
    calls.push([name, args]);
    return builder;
  };
  for (const m of ["select", "eq", "neq", "ilike", "order", "maybeSingle"]) builder[m] = chain(m);
  builder.limit = (...args: unknown[]) => {
    calls.push(["limit", args]);
    return Promise.resolve(result);
  };
  (builder as { __calls: typeof calls }).__calls = calls;
  return builder;
}

const linkRow = (over: Record<string, unknown> = {}) => ({
  origem: "patologia",
  vinculo_id: "link-1",
  medicamento_id: "med-1",
  medicamento_nome: "Amoxicilina",
  principio_ativo: "Amoxicilina",
  apresentacao: "cápsula 500 mg",
  concentracao: "500 mg",
  via: "VO",
  dose_adulto: "500 mg 8/8h",
  dose_pediatrica: "50 mg/kg/dia",
  frequencia: "8/8h",
  duracao: "7 dias",
  linha: "primeira",
  prioridade: 10,
  observacao: null,
  evitar_gestante: false,
  ajuste_renal: false,
  ajuste_hepatico: false,
  tipo_receita: "antimicrobiano",
  alto_risco: false,
  dose_incompleta: false,
  ...over,
});

beforeEach(() => {
  rpcMock.mockReset();
  fromMock.mockReset();
});

describe("Caso 1 — medicamento associado ao quadro aparece na sugestão", () => {
  it("retorna o vínculo revisado com dose e apresentação", async () => {
    rpcMock.mockResolvedValue({ data: [linkRow()], error: null });
    const r = await getClinicalSuggestions({ condition: "Pneumonia", environment: "urgencia" });
    expect(r.suggestions).toHaveLength(1);
    expect(r.suggestions[0].name).toBe("Amoxicilina");
    expect(r.suggestions[0].adultDose).toBe("500 mg 8/8h");
    expect(r.suggestions[0].presentation).toBe("cápsula 500 mg");
    expect(r.diagnostics.displayed).toBe(1);
  });
});

describe("Caso 2 — medicamento sem associação não aparece na sugestão", () => {
  it("quadro sem vínculo devolve lista vazia, sem inventar itens", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    const r = await getClinicalSuggestions({ condition: "Quadro sem vínculo", environment: "urgencia" });
    expect(r.suggestions).toEqual([]);
    expect(r.diagnostics.origin).toBe("nenhuma");
  });

  it("mas a busca manual encontra o medicamento na base", async () => {
    const b = makeBuilder({
      data: [{ id: "med-9", principio_ativo: "Dipirona", concentracao: "500 mg", dose_adulto: "1 g 6/6h" }],
      error: null,
    });
    fromMock.mockReturnValue(b);
    const rows = await searchMedications("dipirona");
    expect(rows[0].activeIngredient).toBe("Dipirona");
  });
});

describe("Caso 3 e 4 — apresentação e dose acompanham o item sugerido", () => {
  it("converte para o item de prescrição preservando dose, via e apresentação", async () => {
    rpcMock.mockResolvedValue({ data: [linkRow()], error: null });
    const r = await getClinicalSuggestions({ condition: "Pneumonia", environment: "urgencia" });
    const med = suggestionToMedication(r.suggestions[0], false);
    expect(med.dosage).toContain("VO");
    expect(med.dosage).toContain("500 mg 8/8h");
    expect(med.instructions).toContain("cápsula 500 mg");
    expect(med.instructions).toContain("7 dias");
  });

  it("usa a dose pediátrica quando o paciente é criança", async () => {
    rpcMock.mockResolvedValue({ data: [linkRow()], error: null });
    const r = await getClinicalSuggestions({ condition: "Pneumonia", environment: "ambulatorial" });
    expect(suggestionToMedication(r.suggestions[0], true).dosage).toContain("50 mg/kg/dia");
  });
});

describe("Caso 5 — medicamento inativo não entra no fluxo clínico", () => {
  it("a busca filtra explicitamente por ativo e status revisado", async () => {
    const b = makeBuilder({ data: [], error: null });
    fromMock.mockReturnValue(b);
    await searchMedications("amoxicilina");
    const calls = (b as unknown as { __calls: Array<[string, unknown[]]> }).__calls;
    expect(calls).toContainEqual(["eq", ["ativo", true]]);
    expect(calls).toContainEqual(["neq", ["status_revisao", "inativo"]]);
  });
});

describe("Caso 6 — busca normalizada encontra o registro", () => {
  it("ignora acento, caixa e hífen e exige todos os termos", async () => {
    expect(normalizeClinical("AMOXI-CILINA + Clavulanato")).toBe("amoxi cilina clavulanato");
    const b = makeBuilder({ data: [], error: null });
    fromMock.mockReturnValue(b);
    await searchMedications("Amoxicilina Clavulanato");
    const ilikes = (b as unknown as { __calls: Array<[string, unknown[]]> }).__calls.filter(([n]) => n === "ilike");
    expect(ilikes).toHaveLength(2);
    expect(ilikes[0][1]).toEqual(["busca_normalizada", "%amoxicilina%"]);
    expect(ilikes[1][1]).toEqual(["busca_normalizada", "%clavulanato%"]);
  });
});

describe("Caso 7 — nenhuma informação clínica inventada", () => {
  it("dose ausente é sinalizada, nunca preenchida", async () => {
    rpcMock.mockResolvedValue({
      data: [linkRow({ dose_adulto: null, dose_pediatrica: null, dose_incompleta: true })],
      error: null,
    });
    const r = await getClinicalSuggestions({ condition: "Pneumonia", environment: "urgencia" });
    expect(r.suggestions[0].flags.incompleteDose).toBe(true);
    expect(suggestionToMedication(r.suggestions[0], false).dosage).toContain("Dose não cadastrada");
  });

  it("sem condição e sem síndrome não consulta o banco", async () => {
    const r = await getClinicalSuggestions({});
    expect(rpcMock).not.toHaveBeenCalled();
    expect(r.suggestions).toEqual([]);
  });
});

describe("Segurança do paciente", () => {
  it("marca item a evitar na gestação", async () => {
    rpcMock.mockResolvedValue({ data: [linkRow({ evitar_gestante: true })], error: null });
    const r = await getClinicalSuggestions({
      condition: "Pneumonia",
      environment: "urgencia",
      patient: { isPregnant: true },
    });
    expect(r.suggestions[0].flags.unsafeForPatient).toBe(true);
  });
});

/* ==================== Etapa 4 — motor de sugestões ==================== */

const link4 = (over: Record<string, unknown> = {}) =>
  linkRow({
    linha: undefined,
    papel: "primeira_linha",
    care_context: "urgencia",
    vinculo_revisado: true,
    medicamento_liberado: true,
    alertas_paciente: [],
    ...over,
  });

describe("Etapa 4 — papel terapêutico e ordenação", () => {
  it("nunca coloca vínculo não revisado acima de vínculo revisado", async () => {
    rpcMock.mockResolvedValue({
      data: [
        link4({ vinculo_id: "b", medicamento_nome: "Pendente", vinculo_revisado: false, grupo: 4, prioridade: 1 }),
        link4({ vinculo_id: "a", medicamento_nome: "Revisado", grupo: 1, prioridade: 50 }),
      ],
      error: null,
    });
    const r = await getClinicalSuggestions({ condition: "Pneumonia", environment: "urgencia" });
    expect(r.suggestions.map((s) => s.name)).toEqual(["Revisado", "Pendente"]);
    expect(r.byGroup[1]).toHaveLength(1);
    expect(r.byGroup[4][0].linkReviewed).toBe(false);
  });

  it("separa alternativa e sintomático da primeira linha", async () => {
    rpcMock.mockResolvedValue({
      data: [
        link4({ vinculo_id: "s", medicamento_nome: "Dipirona", papel: "sintomatico", grupo: 3 }),
        link4({ vinculo_id: "p", medicamento_nome: "Haloperidol", papel: "primeira_linha", grupo: 1 }),
        link4({ vinculo_id: "x", medicamento_nome: "Midazolam", papel: "alternativa", grupo: 2 }),
      ],
      error: null,
    });
    const r = await getClinicalSuggestions({ condition: "Agitação psicomotora", environment: "urgencia" });
    expect(r.suggestions.map((s) => s.role)).toEqual(["primeira_linha", "alternativa", "sintomatico"]);
    expect(r.byGroup[3][0].name).toBe("Dipirona");
  });

  it("envia condição, síndrome, contexto e paciente ao motor único", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    await getClinicalSuggestions({
      condition: "Pneumonia",
      syndrome: "Dispneia",
      environment: "emergencia",
      patient: { isPregnant: true, weightKg: 70 },
    });
    const [fnName, args] = rpcMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(fnName).toBe("fn_sugestoes_terapeuticas");
    expect(args.p_contexto).toBe("emergencia");
    expect((args.p_paciente as Record<string, unknown>).gestante).toBe(true);
    expect((args.p_paciente as Record<string, unknown>).peso).toBe(70);
  });

  it("preserva alertas de paciente vindos do banco e os calculados", async () => {
    rpcMock.mockResolvedValue({
      data: [link4({ alertas_paciente: ["Ajustar na insuficiência renal"], ajuste_hepatico: true })],
      error: null,
    });
    const r = await getClinicalSuggestions({
      condition: "Pneumonia",
      environment: "urgencia",
      patient: { hasHepaticImpairment: true },
    });
    expect(r.suggestions[0].patientAlerts).toContain("Ajustar na insuficiência renal");
    expect(r.suggestions[0].patientAlerts).toContain("Requer ajuste hepático");
  });
});
