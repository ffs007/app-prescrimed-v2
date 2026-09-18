/**
 * Regras estruturadas baseadas no banco farmacológico v2.
 * Carregam-se no boot via side-effect import em `clinicalSafety.ts`.
 */

import { registerRule } from "./ruleRegistry";
import { getMedicationV2 } from "../data/medications";
import type { ClinicalAlert, SafetyContext } from "./clinicalSafety";

/** R-V2-1 — Medicamento exige peso e o paciente é pediátrico sem peso. */
registerRule({
  id: "v2-requires-weight",
  category: "missing-data",
  description: "Medicamento estruturado exige peso para prescrição segura em pediatria.",
  evaluate: (ctx: SafetyContext): ClinicalAlert | null => {
    if (ctx.action !== "receita") return null;
    if (!ctx.patient.isPediatric) return null;
    if (ctx.patient.weightKg !== null) return null;

    const requiring = ctx.selected
      .map((s) => getMedicationV2(s.id))
      .filter((m) => m?.requiresWeight);
    if (requiring.length === 0) return null;

    return {
      id: `v2-weight-${requiring.map((m) => m!.id).join("-")}`,
      severity: "critical",
      category: "missing-data",
      title: "Peso obrigatório para dose pediátrica",
      message: `Os medicamentos ${requiring.map((m) => `"${m!.name}"`).join(", ")} têm dose calculada por kg.`,
      action: "Preencha o peso no Bloco A.",
      medIds: requiring.map((m) => m!.id),
      overridable: false,
    };
  },
});

/** R-V2-2 — Restrição renal estruturada. */
registerRule({
  id: "v2-renal-restriction",
  category: "renal",
  description: "Banco v2 indica restrição/ajuste para função renal do paciente.",
  evaluate: (ctx: SafetyContext): ClinicalAlert | null => {
    if (ctx.action !== "receita") return null;
    if (!ctx.patient.hasRenalImpairment) return null;
    const renalLevel = ctx.patient.renalFunction;
    if (renalLevel !== "leve" && renalLevel !== "moderada" && renalLevel !== "grave") return null;

    const flagged: { medId: number; name: string; message: string; severity: string }[] = [];
    for (const sel of ctx.selected) {
      const m = getMedicationV2(sel.id);
      if (!m?.renal?.length) continue;
      for (const r of m.renal) {
        const order = { leve: 1, moderada: 2, grave: 3 } as const;
        if (order[renalLevel] >= order[r.fromSeverity]) {
          flagged.push({ medId: m.id, name: m.name, message: r.message, severity: r.severity });
        }
      }
    }
    if (flagged.length === 0) return null;

    const hasAvoid = flagged.some((f) => f.severity === "avoid" || f.severity === "contraindicated");
    return {
      id: `v2-renal-${flagged.map((f) => f.medId).join("-")}`,
      severity: hasAvoid ? "critical" : "warning",
      category: "renal",
      title: "Restrição renal estruturada",
      message: flagged.map((f) => `${f.name}: ${f.message}`).join(" • "),
      action: "Ajustar dose ou substituir conforme clearance.",
      medIds: flagged.map((f) => f.medId),
      overridable: true,
    };
  },
});

/** R-V2-3 — Restrição estruturada para gestantes. */
registerRule({
  id: "v2-pregnancy-avoid",
  category: "pregnancy",
  description: "Banco v2 marca medicamento como evitar/contraindicado em gestantes.",
  evaluate: (ctx: SafetyContext): ClinicalAlert | null => {
    if (ctx.action !== "receita") return null;
    if (!ctx.patient.isPregnant) return null;

    const flagged = ctx.selected
      .map((s) => getMedicationV2(s.id))
      .filter((m) => m?.pregnancy && (m.pregnancy.severity === "avoid" || m.pregnancy.severity === "contraindicated"));
    if (flagged.length === 0) return null;

    return {
      id: `v2-preg-${flagged.map((m) => m!.id).join("-")}`,
      severity: "critical",
      category: "pregnancy",
      title: "Medicamento a evitar em gestantes",
      message: flagged.map((m) => `${m!.name}: ${m!.pregnancy!.message}`).join(" • "),
      action: "Substituir por alternativa segura.",
      medIds: flagged.map((m) => m!.id),
      overridable: true,
    };
  },
});

/** R-V2-4 — Interação por classe terapêutica entre selecionados. */
registerRule({
  id: "v2-class-interaction",
  category: "interaction",
  description: "Detecta interação declarada quando outro medicamento da classe alvo está prescrito.",
  evaluate: (ctx: SafetyContext): ClinicalAlert | null => {
    if (ctx.action !== "receita") return null;
    if (ctx.selected.length < 2) return null;

    const v2s = ctx.selected
      .map((s) => getMedicationV2(s.id))
      .filter(Boolean);
    if (v2s.length === 0) return null;

    const presentClasses = new Set(v2s.map((m) => m!.therapeuticClass).filter(Boolean) as string[]);

    const conflicts: { a: string; b: string; message: string }[] = [];
    for (const m of v2s) {
      for (const i of m!.interactions ?? []) {
        if (i.withClass && presentClasses.has(i.withClass)) {
          conflicts.push({ a: m!.name, b: i.withClass, message: i.message });
        }
        if (i.withMedicationId && ctx.selected.some((s) => s.id === i.withMedicationId)) {
          conflicts.push({ a: m!.name, b: `medId:${i.withMedicationId}`, message: i.message });
        }
      }
    }

    if (conflicts.length === 0) return null;
    return {
      id: `v2-interaction-${conflicts.length}`,
      severity: "warning",
      category: "interaction",
      title: "Interação medicamentosa potencial",
      message: conflicts.map((c) => `${c.a} × ${c.b}: ${c.message}`).join(" • "),
      action: "Revise indicação conjunta ou ajuste o esquema.",
      overridable: true,
    };
  },
});
