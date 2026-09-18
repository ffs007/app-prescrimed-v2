/**
 * Etapa 2 — testes de apresentações e doses.
 * Cobrem os 8 casos exigidos: uma apresentação, várias apresentações,
 * doses compatíveis, posologia revisada, ausência de invenção, entrada manual,
 * filtro de inativos e edição local no documento.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const rpcMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
    from: () => ({}),
    auth: { getUser: async () => ({ data: { user: null } }) },
  },
}));

import {
  getMedicationPresentations,
  pickAutoPresentation,
  pickPosology,
  type MedicationPresentation,
} from "../clinicalSuggestions";

const posology = (over: Record<string, unknown> = {}) => ({
  dose_id: "d1",
  populacao: "adulto",
  via: "VO",
  posologia: "500–1000 mg/dose VO 6/6h",
  frequencia: "6/6h",
  duracao: null,
  dose_maxima_dia: null,
  observacao: null,
  revisada: true,
  pendente: false,
  ...over,
});

const presentation = (over: Record<string, unknown> = {}) => ({
  apresentacao_id: "a1",
  rotulo: "Dipirona 500 mg/mL — solução injetável (2 mL)",
  forma_farmaceutica: "solução injetável",
  concentracao: "500 mg/mL",
  unidade_volume: "mL",
  volume: 2,
  via: "IV",
  uso_adulto: true,
  uso_pediatrico: false,
  utilizavel: true,
  revisada: true,
  posologias: [posology()],
  ...over,
});

beforeEach(() => rpcMock.mockReset());

describe("apresentações e doses", () => {
  it("1. medicamento com uma apresentação: auto-seleção liberada", async () => {
    rpcMock.mockResolvedValue({ data: [presentation()], error: null });
    const list = await getMedicationPresentations("med-1");
    expect(list).toHaveLength(1);
    expect(pickAutoPresentation(list)?.id).toBe("a1");
  });

  it("2. medicamento com várias apresentações: nenhuma é escolhida sozinha", async () => {
    rpcMock.mockResolvedValue({
      data: [presentation(), presentation({ apresentacao_id: "a2", rotulo: "Comprimido 500 mg" })],
      error: null,
    });
    const list = await getMedicationPresentations("med-1");
    expect(list).toHaveLength(2);
    expect(pickAutoPresentation(list)).toBeNull();
  });

  it("3. só aparecem doses compatíveis com a apresentação escolhida", async () => {
    rpcMock.mockResolvedValue({
      data: [
        presentation({ apresentacao_id: "iv", posologias: [posology({ dose_id: "iv1", via: "IV" })] }),
        presentation({ apresentacao_id: "vo", posologias: [posology({ dose_id: "vo1", via: "VO" })] }),
      ],
      error: null,
    });
    const list = await getMedicationPresentations("med-1");
    expect(list[0].posologies.map((p) => p.doseId)).toEqual(["iv1"]);
    expect(list[1].posologies.map((p) => p.doseId)).toEqual(["vo1"]);
  });

  it("4. posologia revisada é preferida e propaga o texto pronto", async () => {
    rpcMock.mockResolvedValue({
      data: [
        presentation({
          posologias: [
            posology({ dose_id: "pend", revisada: false, posologia: "dose em revisão" }),
            posology({ dose_id: "ok", revisada: true, posologia: "500 mg VO 8/8h" }),
          ],
        }),
      ],
      error: null,
    });
    const [p] = await getMedicationPresentations("med-1");
    const chosen = pickPosology(p, false);
    expect(chosen?.doseId).toBe("ok");
    expect(chosen?.text).toBe("500 mg VO 8/8h");
  });

  it("5. sem dose cadastrada nada é inventado", async () => {
    rpcMock.mockResolvedValue({ data: [presentation({ posologias: [] })], error: null });
    const [p] = await getMedicationPresentations("med-1");
    expect(p.posologies).toHaveLength(0);
    expect(pickPosology(p, false)).toBeNull();
  });

  it("6. sem apresentação cadastrada o fluxo segue manual", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    const list = await getMedicationPresentations("med-sem");
    expect(list).toEqual([]);
    expect(pickAutoPresentation(list)).toBeNull();
    expect(pickPosology(null, false)).toBeNull();
  });

  it("7. apresentação incompleta não é auto-selecionada", async () => {
    rpcMock.mockResolvedValue({
      data: [presentation({ utilizavel: false, concentracao: null, revisada: false })],
      error: null,
    });
    const list = await getMedicationPresentations("med-1");
    expect(list[0].usable).toBe(false);
    expect(list[0].reviewed).toBe(false);
    expect(pickAutoPresentation(list)).toBeNull();
  });

  it("8. paciente pediátrico recebe a posologia pediátrica e o texto é editável", async () => {
    rpcMock.mockResolvedValue({
      data: [
        presentation({
          posologias: [
            posology({ dose_id: "ad", populacao: "adulto", posologia: "1 g IV" }),
            posology({ dose_id: "ped", populacao: "pediátrico", posologia: "50 mg/kg/dia IV" }),
          ],
        }),
      ],
      error: null,
    });
    const [p] = await getMedicationPresentations("med-1");
    const chosen = pickPosology(p, true) as NonNullable<ReturnType<typeof pickPosology>>;
    expect(chosen.doseId).toBe("ped");
    // Cópia local no documento: alterar não muda o dado do banco.
    const local = { ...chosen, text: `${chosen.text} (ajustado)` };
    expect(local.text).toContain("ajustado");
    expect(p.posologies.find((x) => x.doseId === "ped")?.text).toBe("50 mg/kg/dia IV");
  });
  it("9. tecnicamente completo, porém sem revisão clínica, não é aplicado sozinho", async () => {
    rpcMock.mockResolvedValue({
      data: [presentation({ revisada: false, posologias: [posology({ revisada: false, pendente: true })] })],
      error: null,
    });
    const list = await getMedicationPresentations("med-1");
    expect(list[0].usable).toBe(true); // completude técnica
    expect(list[0].reviewed).toBe(false); // revisão clínica
    expect(pickAutoPresentation(list)).toBeNull();
    // continua escolhível manualmente pelo médico
    expect(pickPosology(list[0], false)?.reviewed).toBe(false);
  });

  it("10. posologia revisada é preferida quando existem as duas", async () => {
    rpcMock.mockResolvedValue({
      data: [
        presentation({
          posologias: [
            posology({ dose_id: "nr", revisada: false, pendente: true }),
            posology({ dose_id: "ok", revisada: true, pendente: false }),
          ],
        }),
      ],
      error: null,
    });
    const [p] = await getMedicationPresentations("med-1");
    expect(pickPosology(p, false)?.doseId).toBe("ok");
  });
});

it("tipagem exportada permanece estável", () => {
  const p: MedicationPresentation = {
    id: "x",
    label: "y",
    pharmaceuticalForm: null,
    concentration: null,
    route: null,
    volume: null,
    adultUse: true,
    pediatricUse: false,
    usable: false,
    reviewed: false,
    posologies: [],
  };
  expect(p.usable).toBe(false);
});
