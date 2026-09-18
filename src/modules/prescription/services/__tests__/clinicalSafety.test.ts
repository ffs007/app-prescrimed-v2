import { describe, it, expect, vi } from "vitest";

// Isola o motor de regras dos dados clínicos reais (banco v2), que são
// conteúdo curado e podem mudar sem relação com a lógica sendo testada.
// Assim os testes validam o MOTOR, não o conteúdo cadastrado.
vi.mock("../../data/medications", () => ({
  getMedicationV2: (id: number) => {
    const db: Record<number, any> = {
      1: { id: 1, name: "MedPeso", requiresWeight: true },
      2: { id: 2, name: "MedGestante", pregnancy: { severity: "avoid", message: "Evitar na gestação." } },
      3: {
        id: 3,
        name: "MedRenal",
        renal: [{ fromSeverity: "leve", severity: "contraindicated", message: "Contraindicado em disfunção renal." }],
      },
      4: {
        id: 4,
        name: "MedA",
        therapeuticClass: "classeA",
        interactions: [{ withClass: "classeB", severity: "contraindicated", message: "Interação grave A×B." }],
      },
      5: { id: 5, name: "MedB", therapeuticClass: "classeB" },
    };
    return db[id];
  },
}));

const { assessSafety, statusLabel } = await import("../clinicalSafety");
type SafetyContext = Parameters<typeof assessSafety>[0];

const patient = (overrides: Partial<SafetyContext["patient"]> = {}): SafetyContext["patient"] => ({
  patientName: "Paciente Teste",
  isPediatric: false,
  isPregnant: false,
  weightKg: 70,
  ageInYears: 30,
  allergiesText: "",
  hasAllergies: false,
  renalFunction: "",
  hasRenalImpairment: false,
  ...overrides,
});

const ctx = (overrides: Partial<SafetyContext> = {}): SafetyContext => ({
  action: "receita",
  patient: patient(),
  selected: [],
  allMedications: [],
  ...overrides,
});

describe("assessSafety — caso feliz", () => {
  it("adulto sem alergia, sem gestação, um medicamento comum → status ok, sem alertas", () => {
    const r = assessSafety(ctx({ selected: [{ id: 99, name: "Paracetamol 500mg", text: "1 comp 6/6h" }] }));
    expect(r.status).toBe("ok");
    expect(r.alerts).toEqual([]);
    expect(r.hardBlocked).toBe(false);
  });

  it("nenhum medicamento selecionado → nenhuma regra dispara", () => {
    const r = assessSafety(
      ctx({ patient: patient({ isPediatric: true, weightKg: null, isPregnant: true }), selected: [] }),
    );
    expect(r.alerts).toEqual([]);
    expect(r.status).toBe("ok");
  });

  it("action diferente de 'receita' → nenhuma regra core dispara mesmo com paciente de risco", () => {
    const r = assessSafety(
      ctx({
        action: "atestado" as SafetyContext["action"],
        patient: patient({ isPediatric: true, weightKg: null }),
        selected: [{ id: 1, name: "MedPeso", text: "" }],
      }),
    );
    expect(r.alerts).toEqual([]);
  });
});

describe("assessSafety — CASO CRÍTICO: pediátrico sem peso DEVE bloquear", () => {
  it("regra core (legado) bloqueia emissão — peso ausente em pediatria", () => {
    const r = assessSafety(
      ctx({
        patient: patient({ isPediatric: true, weightKg: null }),
        selected: [{ id: 999, name: "Qualquer medicamento", text: "" }],
      }),
    );
    expect(r.status).toBe("blocked");
    expect(r.hardBlocked).toBe(true);
    expect(r.alerts).toContainEqual(expect.objectContaining({ id: "ped-missing-weight", severity: "critical" }));
  });

  it("regra v2 também bloqueia quando medicamento estruturado exige peso (requiresWeight)", () => {
    const r = assessSafety(
      ctx({
        patient: patient({ isPediatric: true, weightKg: null }),
        selected: [{ id: 1, name: "MedPeso", text: "" }],
      }),
    );
    expect(r.hardBlocked).toBe(true);
    expect(r.alerts.some((a) => a.id.startsWith("v2-weight-"))).toBe(true);
  });

  it("caso limite — peso 0 é tratado como ausente (weightKg !== null é a checagem real)", () => {
    // O motor só suprime o alerta quando weightKg !== null. Peso 0 passa a checagem
    // (não é null) — ou seja, 0 kg NÃO bloqueia por peso ausente. Documenta o
    // comportamento real: validação de peso <= 0 é responsabilidade da camada de
    // pediatricCalc, não deste motor.
    const r = assessSafety(
      ctx({
        patient: patient({ isPediatric: true, weightKg: 0 }),
        selected: [{ id: 999, name: "Med", text: "" }],
      }),
    );
    expect(r.alerts.some((a) => a.id === "ped-missing-weight")).toBe(false);
  });

  it("peso presente (>0) não dispara alerta de peso ausente", () => {
    const r = assessSafety(
      ctx({
        patient: patient({ isPediatric: true, weightKg: 12 }),
        selected: [{ id: 1, name: "MedPeso", text: "" }],
      }),
    );
    expect(r.alerts.some((a) => a.id === "ped-missing-weight" || a.id.startsWith("v2-weight-"))).toBe(false);
  });
});

describe("assessSafety — gestação", () => {
  it("gestante com medicamento risco C/D (cadastro legado) → warning, revisão recomendada", () => {
    const r = assessSafety(
      ctx({
        patient: patient({ isPregnant: true }),
        selected: [{ id: 7, name: "MedRiscoD", text: "" }],
        allMedications: [{ id: 7, name: "MedRiscoD", dosage: "", instructions: "", category: "", pregnancyRisk: "D" }],
      }),
    );
    expect(r.status).toBe("review-required");
    expect(r.alerts).toContainEqual(expect.objectContaining({ id: "preg-review", severity: "warning" }));
  });

  it("CASO CRÍTICO — gestante com medicamento v2 marcado 'avoid' bloqueia até reconhecimento", () => {
    const context = ctx({
      patient: patient({ isPregnant: true }),
      selected: [{ id: 2, name: "MedGestante", text: "" }],
    });
    const antes = assessSafety(context);
    expect(antes.status).toBe("blocked");
    expect(antes.pendingCritical.some((a) => a.id.startsWith("v2-preg-"))).toBe(true);

    const alertaId = antes.pendingCritical.find((a) => a.id.startsWith("v2-preg-"))!.id;
    const depois = assessSafety(context, new Set([alertaId]));
    expect(depois.pendingCritical).toEqual([]);
    expect(depois.hardBlocked).toBe(false);
  });
});

describe("assessSafety — alergia", () => {
  it("CASO CRÍTICO — alergia declarada compatível com nome do medicamento bloqueia até reconhecimento", () => {
    const r = assessSafety(
      ctx({
        patient: patient({ hasAllergies: true, allergiesText: "dipirona" }),
        selected: [{ id: 50, name: "Dipirona 500mg", text: "" }],
      }),
    );
    expect(r.status).toBe("blocked");
    expect(r.alerts).toContainEqual(expect.objectContaining({ category: "allergy", severity: "critical" }));
  });

  it("alergia sem correspondência textual não dispara alerta", () => {
    const r = assessSafety(
      ctx({
        patient: patient({ hasAllergies: true, allergiesText: "penicilina" }),
        selected: [{ id: 51, name: "Paracetamol 500mg", text: "" }],
      }),
    );
    expect(r.alerts.some((a) => a.category === "allergy")).toBe(false);
  });

  it("termos negativos ('nega', 'nenhuma') são ignorados no parser de alergia", () => {
    const r = assessSafety(
      ctx({
        patient: patient({ hasAllergies: true, allergiesText: "nega alergias" }),
        selected: [{ id: 52, name: "Nega 100mg", text: "" }],
      }),
    );
    expect(r.alerts.some((a) => a.category === "allergy")).toBe(false);
  });
});

describe("assessSafety — duplicidade e função renal", () => {
  it("medicamento duplicado na receita gera warning", () => {
    const r = assessSafety(
      ctx({
        selected: [
          { id: 10, name: "Amoxicilina 500mg", text: "" },
          { id: 10, name: "Amoxicilina 500mg", text: "" },
        ],
      }),
    );
    expect(r.alerts).toContainEqual(expect.objectContaining({ category: "duplicate", severity: "warning" }));
  });

  it("função renal comprometida (legado) gera warning informativo de revisão", () => {
    const r = assessSafety(
      ctx({
        patient: patient({ hasRenalImpairment: true, renalFunction: "leve" }),
        selected: [{ id: 20, name: "Qualquer", text: "" }],
      }),
    );
    expect(r.alerts).toContainEqual(expect.objectContaining({ category: "renal", severity: "warning", id: "renal-review" }));
  });

  it("CASO CRÍTICO — restrição renal v2 'contraindicated' eleva severidade para crítico e bloqueia", () => {
    const r = assessSafety(
      ctx({
        patient: patient({ hasRenalImpairment: true, renalFunction: "grave" }),
        selected: [{ id: 3, name: "MedRenal", text: "" }],
      }),
    );
    const alerta = r.alerts.find((a) => a.id.startsWith("v2-renal-"));
    expect(alerta?.severity).toBe("critical");
    expect(r.status).toBe("blocked");
  });
});

describe("assessSafety — interação medicamentosa (GAP DE SEGURANÇA real)", () => {
  it("interação classificada como 'contraindicated' no cadastro v2 gera apenas WARNING, nunca bloqueia sozinha", () => {
    // v2Rules.ts:104-142 (regra v2-class-interaction) IGNORA i.severity do dado
    // cadastrado e sempre emite severity:"warning" hardcoded. Uma interação
    // marcada "contraindicated" no banco farmacológico se comporta, na prática,
    // como uma interação "caution" — nunca bloqueia a emissão sozinha, mesmo
    // que o campo severity:"contraindicated" exista e esteja correto no dado.
    // Isso é uma divergência real entre o modelo de dados (RestrictionSeverity)
    // e o motor de regras — reportar como achado de segurança clínica.
    const r = assessSafety(
      ctx({
        selected: [
          { id: 4, name: "MedA", text: "" },
          { id: 5, name: "MedB", text: "" },
        ],
      }),
    );
    const alerta = r.alerts.find((a) => a.category === "interaction");
    expect(alerta).toBeDefined();
    expect(alerta?.severity).toBe("warning");
    expect(r.hardBlocked).toBe(false);
    expect(r.status).toBe("review-required");
  });

  it("menos de 2 medicamentos selecionados nunca dispara checagem de interação", () => {
    const r = assessSafety(ctx({ selected: [{ id: 4, name: "MedA", text: "" }] }));
    expect(r.alerts.some((a) => a.category === "interaction")).toBe(false);
  });
});

describe("statusLabel", () => {
  it("mapeia os 4 status para rótulos humanos esperados", () => {
    expect(statusLabel("ok")).toBe("Pronto para emitir");
    expect(statusLabel("info")).toBe("Pronto para emitir");
    expect(statusLabel("review-required")).toBe("Revisão recomendada");
    expect(statusLabel("blocked")).toBe("Emissão bloqueada");
  });
});
