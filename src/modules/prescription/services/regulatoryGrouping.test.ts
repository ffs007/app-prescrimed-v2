/**
 * Testes do motor de agrupamento regulatório.
 *
 * Foco: regra de unificação — quando houver Controle Especial ou
 * Antimicrobiano, todos os itens de Receita comum devem ser mesclados
 * no mesmo documento. Notificações A/B continuam separadas.
 */
import { describe, it, expect } from "vitest";
import { buildRegulatoryGroups } from "./regulatoryGrouping";
import type { Medication, SelectedMed } from "../types/prescription";

const med = (id: number, name: string): Medication => ({
  id,
  name,
  dosage: "",
  instructions: "",
  category: "test",
});

const sel = (id: number, name: string): SelectedMed => ({
  id,
  name,
  text: `${name} — uso conforme orientação`,
});

const DIPIRONA = med(1, "Dipirona 500mg");
const PARACETAMOL = med(2, "Paracetamol 750mg");
const SERTRALINA = med(3, "Sertralina 50mg"); // C1 → controle-especial
const CLONAZEPAM = med(4, "Clonazepam 2mg"); // B1 → notificacao-B
const MORFINA = med(5, "Morfina 10mg"); // A1 → notificacao-A
const AMOXICILINA = med(6, "Amoxicilina 500mg"); // antimicrobiano

describe("buildRegulatoryGroups — regra de unificação", () => {
  it("mescla comuns no Controle Especial quando há C1", () => {
    const result = buildRegulatoryGroups(
      [sel(1, "Dipirona 500mg"), sel(2, "Paracetamol 750mg"), sel(3, "Sertralina 50mg")],
      [DIPIRONA, PARACETAMOL, SERTRALINA],
    );

    expect(result.totalDocuments).toBe(1);
    expect(result.groups[0].family).toBe("controle-especial");
    expect(result.groups[0].items).toHaveLength(3);
    const ids = result.groups[0].items.map((i) => i.medication.id).sort();
    expect(ids).toEqual([1, 2, 3]);
  });

  it("mescla comuns no Antimicrobiano quando há antimicrobiano (e não há CE)", () => {
    const result = buildRegulatoryGroups(
      [sel(1, "Dipirona 500mg"), sel(6, "Amoxicilina 500mg")],
      [DIPIRONA, AMOXICILINA],
    );

    expect(result.totalDocuments).toBe(1);
    expect(result.groups[0].family).toBe("antimicrobiano");
    expect(result.groups[0].items).toHaveLength(2);
  });

  it("prioriza Controle Especial sobre Antimicrobiano para absorver comuns", () => {
    const result = buildRegulatoryGroups(
      [
        sel(1, "Dipirona 500mg"),
        sel(3, "Sertralina 50mg"),
        sel(6, "Amoxicilina 500mg"),
      ],
      [DIPIRONA, SERTRALINA, AMOXICILINA],
    );

    // Comum + CE em 1 doc; Antimicrobiano em outro doc.
    expect(result.totalDocuments).toBe(2);
    const ce = result.groups.find((g) => g.family === "controle-especial");
    const am = result.groups.find((g) => g.family === "antimicrobiano");
    expect(ce?.items.map((i) => i.medication.id).sort()).toEqual([1, 3]);
    expect(am?.items.map((i) => i.medication.id)).toEqual([6]);
  });

  it("mantém Notificação B separada mesmo havendo CE absorvendo comuns", () => {
    const result = buildRegulatoryGroups(
      [sel(1, "Dipirona 500mg"), sel(3, "Sertralina 50mg"), sel(4, "Clonazepam 2mg")],
      [DIPIRONA, SERTRALINA, CLONAZEPAM],
    );

    expect(result.totalDocuments).toBe(2);
    const ce = result.groups.find((g) => g.family === "controle-especial");
    const nb = result.groups.find((g) => g.family === "notificacao-B");
    expect(ce?.items.map((i) => i.medication.id).sort()).toEqual([1, 3]);
    expect(nb?.items.map((i) => i.medication.id)).toEqual([4]);
  });

  it("mantém Notificação A separada (talonário oficial)", () => {
    const result = buildRegulatoryGroups(
      [sel(1, "Dipirona 500mg"), sel(5, "Morfina 10mg")],
      [DIPIRONA, MORFINA],
    );

    // Comum sozinho (sem CE/antimicrobiano para absorver) + Notificação A.
    expect(result.totalDocuments).toBe(2);
    const families = result.groups.map((g) => g.family).sort();
    expect(families).toEqual(["comum", "notificacao-A"]);
  });

  it("não divide CE por limite de princípios ativos (regra removida)", () => {
    // 4 substâncias C1 distintas — antes seria dividido em 2 docs.
    const FLUOXETINA = med(10, "Fluoxetina 20mg");
    const PAROXETINA = med(11, "Paroxetina 20mg");
    const CITALOPRAM = med(12, "Citalopram 20mg");
    const result = buildRegulatoryGroups(
      [
        sel(3, "Sertralina 50mg"),
        sel(10, "Fluoxetina 20mg"),
        sel(11, "Paroxetina 20mg"),
        sel(12, "Citalopram 20mg"),
      ],
      [SERTRALINA, FLUOXETINA, PAROXETINA, CITALOPRAM],
    );

    expect(result.totalDocuments).toBe(1);
    expect(result.groups[0].family).toBe("controle-especial");
    expect(result.groups[0].items).toHaveLength(4);
    expect(result.wasSplit).toBe(false);
  });

  it("apenas comum → 1 documento comum", () => {
    const result = buildRegulatoryGroups(
      [sel(1, "Dipirona 500mg"), sel(2, "Paracetamol 750mg")],
      [DIPIRONA, PARACETAMOL],
    );
    expect(result.totalDocuments).toBe(1);
    expect(result.groups[0].family).toBe("comum");
  });

  it("splitMessage só aparece quando há mais de 1 documento", () => {
    const single = buildRegulatoryGroups(
      [sel(1, "Dipirona 500mg"), sel(3, "Sertralina 50mg")],
      [DIPIRONA, SERTRALINA],
    );
    expect(single.splitMessage).toBeUndefined();

    const multi = buildRegulatoryGroups(
      [sel(3, "Sertralina 50mg"), sel(4, "Clonazepam 2mg")],
      [SERTRALINA, CLONAZEPAM],
    );
    expect(multi.splitMessage).toBeDefined();
  });
});
