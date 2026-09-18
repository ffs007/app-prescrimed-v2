import type { Medication, SelectedMed } from "../types/prescription";
import type { DocumentAction } from "../components/ActionGrid";

/* ============================================================
 * Tipos do motor de segurança clínica
 * ============================================================ */

/**
 * Severidade de um alerta clínico — alinhada com a UX dos 4 estados
 * (OK / Informativo / Atenção / Crítico). "ok" não gera alert; é o
 * estado base usado apenas para o cálculo do status agregado.
 */
export type AlertSeverity = "info" | "warning" | "critical";

/**
 * Eixo clínico que originou o alerta. Usado para agrupar e priorizar
 * a UX e para futura camada de auditoria/log.
 */
export type AlertCategory =
  | "missing-data"
  | "pediatric"
  | "pregnancy"
  | "allergy"
  | "renal"
  | "duplicate"
  | "interaction"
  | "dose"
  | "consistency";

export interface ClinicalAlert {
  /** Identificador estável do alerta — usado como chave de override e log. */
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  /** Título curto (≤ 6 palavras). */
  title: string;
  /** Motivo / impacto em 1 frase. */
  message: string;
  /** Ação esperada (verbo no imperativo). */
  action?: string;
  /** IDs de medicamentos envolvidos (quando aplicável). */
  medIds?: number[];
  /** Indica que este alerta admite override clínico (com justificativa para crítico). */
  overridable: boolean;
}

/** Status agregado do documento — dirige bloqueio/confirmação na emissão. */
export type SafetyStatus =
  | "ok"
  | "info"
  | "review-required"
  | "blocked";

export interface SafetyAssessment {
  status: SafetyStatus;
  alerts: ClinicalAlert[];
  /** True quando há ao menos um alerta crítico não-overridable. */
  hardBlocked: boolean;
  /** Alertas críticos pendentes de override. */
  pendingCritical: ClinicalAlert[];
}

/* ============================================================
 * Contexto de avaliação
 * ============================================================ */

export interface SafetyPatientContext {
  patientName: string;
  isPediatric: boolean;
  isPregnant: boolean;
  weightKg: number | null;
  ageInYears: number | null;
  allergiesText: string;
  hasAllergies: boolean;
  renalFunction: "" | "normal" | "leve" | "moderada" | "grave";
  hasRenalImpairment: boolean;
}

export interface SafetyContext {
  action: DocumentAction;
  patient: SafetyPatientContext;
  selected: SelectedMed[];
  allMedications: Medication[];
}

/* ============================================================
 * Helpers internos
 * ============================================================ */

const findMed = (id: number, all: Medication[]) => all.find((m) => m.id === id);

/** Tokeniza o texto de alergias do médico em termos comparáveis. */
const parseAllergyTerms = (raw: string): string[] => {
  return raw
    .toLowerCase()
    .split(/[,;\/]|\bou\b|\be\b/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !["nega", "nenhuma", "nao", "não"].includes(t));
};

/**
 * Match textual conservador: o termo da alergia precisa aparecer como
 * substring no NOME do medicamento (sem normalizar princípio ativo).
 * Conservador de propósito — preferimos perder match a inventar conflito.
 */
const allergyMatches = (medName: string, terms: string[]): string | null => {
  const lower = medName.toLowerCase();
  for (const t of terms) {
    if (lower.includes(t)) return t;
  }
  return null;
};

/* ============================================================
 * Regras individuais (puras, testáveis)
 * ============================================================ */

/** R1 — Pediátrico sem peso, com prescrição em curso. */
const rulePediatricMissingWeight = (ctx: SafetyContext): ClinicalAlert | null => {
  if (ctx.action !== "receita") return null;
  if (!ctx.patient.isPediatric) return null;
  if (ctx.patient.weightKg !== null) return null;
  if (ctx.selected.length === 0) return null;
  return {
    id: "ped-missing-weight",
    severity: "critical",
    category: "missing-data",
    title: "Peso ausente em paciente pediátrico",
    message:
      "Não é possível conferir doses por kg sem o peso. Em pediatria isso é um risco frequente de erro de dose.",
    action: "Preencha o peso no Bloco A antes de emitir.",
    overridable: false,
  };
};

/** R2 — Gestante com medicamentos selecionados → revisão obrigatória de bula. */
const rulePregnancyAwareness = (ctx: SafetyContext): ClinicalAlert | null => {
  if (ctx.action !== "receita") return null;
  if (!ctx.patient.isPregnant) return null;
  if (ctx.selected.length === 0) return null;

  // Já existe filtro automático de meds inseguros via isMedicationSafeForPregnancy
  // no fluxo de carregar patologia. Aqui agregamos a sinalização contextual
  // para os meds que ficaram (em geral seguros, mas exigem revisão final).
  const meds = ctx.selected
    .map((s) => findMed(s.id, ctx.allMedications))
    .filter(Boolean) as Medication[];
  const riskC_D = meds.filter(
    (m) => m.pregnancyRisk === "C" || m.pregnancyRisk === "D",
  );
  if (riskC_D.length === 0) return null;

  return {
    id: "preg-review",
    severity: "warning",
    category: "pregnancy",
    title: "Gestante — revisão da prescrição",
    message: `${riskC_D.length} medicamento(s) com risco categoria C/D na gestação. Confirme que o benefício supera o risco.`,
    action: "Revise indicação e categoria de risco antes de emitir.",
    medIds: riskC_D.map((m) => m.id),
    overridable: true,
  };
};

/** R3 — Alergia declarada × medicamentos selecionados (match textual conservador). */
const ruleAllergyConflict = (ctx: SafetyContext): ClinicalAlert | null => {
  if (ctx.action !== "receita") return null;
  if (!ctx.patient.hasAllergies) return null;
  const terms = parseAllergyTerms(ctx.patient.allergiesText);
  if (terms.length === 0) return null;

  const conflicts: { med: SelectedMed; term: string }[] = [];
  for (const sel of ctx.selected) {
    const term = allergyMatches(sel.name, terms);
    if (term) conflicts.push({ med: sel, term });
  }
  if (conflicts.length === 0) return null;

  return {
    id: `allergy-${conflicts.map((c) => c.med.id).join("-")}`,
    severity: "critical",
    category: "allergy",
    title: "Alergia potencialmente incompatível",
    message: `O medicamento ${conflicts
      .map((c) => `"${c.med.name}"`)
      .join(", ")} bate com alergia informada (${conflicts
      .map((c) => c.term)
      .join(", ")}).`,
    action: "Confirme o medicamento OU remova-o da prescrição.",
    medIds: conflicts.map((c) => c.med.id),
    overridable: true,
  };
};

/** R4 — Medicamento duplicado na mesma receita. */
const ruleDuplicateMedication = (ctx: SafetyContext): ClinicalAlert | null => {
  if (ctx.action !== "receita") return null;
  const seen = new Set<number>();
  const dups: SelectedMed[] = [];
  for (const sel of ctx.selected) {
    if (seen.has(sel.id)) dups.push(sel);
    seen.add(sel.id);
  }
  if (dups.length === 0) return null;
  return {
    id: `dup-${dups.map((d) => d.id).join("-")}`,
    severity: "warning",
    category: "duplicate",
    title: "Medicamento duplicado",
    message: `${dups.map((d) => d.name).join(", ")} aparece mais de uma vez na receita.`,
    action: "Remova a duplicação ou confirme a intenção.",
    medIds: dups.map((d) => d.id),
    overridable: true,
  };
};

/** R5 — Função renal comprometida + qualquer prescrição → flag de revisão. */
const ruleRenalAwareness = (ctx: SafetyContext): ClinicalAlert | null => {
  if (ctx.action !== "receita") return null;
  if (!ctx.patient.hasRenalImpairment) return null;
  if (ctx.selected.length === 0) return null;
  return {
    id: "renal-review",
    severity: "warning",
    category: "renal",
    title: "Função renal comprometida",
    message: `Paciente com função renal ${ctx.patient.renalFunction}. Várias drogas exigem ajuste de dose.`,
    action: "Revise dose de cada medicamento conforme clearance.",
    overridable: true,
  };
};

/* ============================================================
 * Pipeline + agregador (via registry)
 * ============================================================ */

import { registerRule, evaluateAll } from "./ruleRegistry";

// Registra as 5 regras core no registry (idempotente).
registerRule({ id: "core-pediatric-missing-weight", category: "missing-data", description: "Pediátrico sem peso com prescrição em curso.", evaluate: rulePediatricMissingWeight });
registerRule({ id: "core-pregnancy-awareness", category: "pregnancy", description: "Gestante com meds risco C/D — revisão.", evaluate: rulePregnancyAwareness });
registerRule({ id: "core-allergy-conflict", category: "allergy", description: "Match textual entre alergia declarada e nome do medicamento.", evaluate: ruleAllergyConflict });
registerRule({ id: "core-duplicate-medication", category: "duplicate", description: "Medicamento duplicado na mesma receita.", evaluate: ruleDuplicateMedication });
registerRule({ id: "core-renal-awareness", category: "renal", description: "Função renal comprometida + prescrição.", evaluate: ruleRenalAwareness });

// Side-effect: registra também as regras estruturadas do banco v2.
import "./v2Rules";

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  info: 1,
  warning: 2,
  critical: 3,
};

/**
 * Avalia o documento ativo contra todas as regras seguras.
 * Puro: sem efeitos colaterais. UI decide o que fazer com o resultado.
 *
 * O `acknowledgedIds` permite "neutralizar" alertas overridable que o
 * médico já confirmou conscientemente (com ou sem justificativa).
 */
export const assessSafety = (
  ctx: SafetyContext,
  acknowledgedIds: Set<string> = new Set(),
): SafetyAssessment => {
  const raw = evaluateAll(ctx);

  // Ordena por severidade desc para UX
  raw.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);

  const pendingCritical = raw.filter(
    (a) => a.severity === "critical" && !acknowledgedIds.has(a.id),
  );
  const hardBlocked = raw.some(
    (a) => a.severity === "critical" && !a.overridable,
  );

  let status: SafetyStatus = "ok";
  if (hardBlocked) status = "blocked";
  else if (pendingCritical.length > 0) status = "blocked";
  else if (raw.some((a) => a.severity === "warning")) status = "review-required";
  else if (raw.some((a) => a.severity === "info")) status = "info";

  return { status, alerts: raw, hardBlocked, pendingCritical };
};

/** Texto humano resumido do status (para badges). */
export const statusLabel = (s: SafetyStatus): string => {
  switch (s) {
    case "ok": return "Pronto para emitir";
    case "info": return "Pronto para emitir";
    case "review-required": return "Revisão recomendada";
    case "blocked": return "Emissão bloqueada";
  }
};
