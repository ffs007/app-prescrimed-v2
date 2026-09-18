/**
 * Suggestion Engine — transforma um (medicamento + paciente + receita curada)
 * em um objeto Suggestion editável que alimenta o card de sugestão.
 *
 * Pipeline
 * --------
 *   Pathology → SuggestionRecipe[] (pathologyProtocols.ts)
 *   ↓
 *   getMedicationV2(id) → presentations + adultDose + pediatricDoseStructured
 *   ↓
 *   buildSuggestion(recipe, patient) → { presentation, dose, frequency, duration, posology, ... }
 *   ↓
 *   Card UI (editável) → SelectedMed final.
 *
 * Quando não há overlay v2, caímos no Medication legado (dosage/instructions).
 * Garantia: NUNCA quebra — sempre devolve uma Suggestion utilizável.
 */

import type { Medication } from "../types/prescription";
import type { MedicationV2, Presentation } from "../types/clinical";
import { getMedicationV2 } from "../data/medications";
import type { SuggestionRecipe } from "../data/pathologyProtocols";

export interface PatientContext {
  isPediatric: boolean;
  isPregnant: boolean;
  weightKg: number | null;
  ageInYears: number | null;
  hasAllergies: boolean;
  hasRenalImpairment: boolean;
  /** Texto livre de alergias para checagem heurística. */
  allergiesText?: string;
}

/**
 * Sugestão editável renderizada no card.
 * Campos textuais são separáveis para permitir edição inline.
 */
export interface Suggestion {
  /** Chave estável para list rendering. */
  key: string;
  medicationId: number;
  medicationName: string;
  /** Apresentação principal (ex: "500 mg comprimido"). Editável. */
  presentation: string;
  /** Dose por administração (ex: "1 cp", "5 mL", "30 mg"). */
  dose: string;
  /** Frequência (ex: "de 8/8h", "1x ao dia"). */
  frequency: string;
  /** Duração (ex: "por 7 dias", "uso contínuo"). */
  duration: string;
  /** Via (ex: "VO", "IM"). */
  route: string;
  /** Linha terapêutica (1ª, alternativa, etc). Vem do protocolo. */
  line: SuggestionRecipe["line"];
  /** Observação clínica curta exibida no card. */
  note?: string;
  /** Marca destaque visual (1ª escolha do plantão). */
  highlight?: boolean;
  /** Texto pronto para exportar (calculado a partir dos campos). */
  posologyText: string;
  /** Sinalizadores de segurança (apenas display — engine de safety é separado). */
  flags: SuggestionFlag[];
}

export type SuggestionFlag =
  | { kind: "pregnancy-unsafe"; message: string }
  | { kind: "needs-weight"; message: string }
  | { kind: "renal-caution"; message: string }
  | { kind: "controlled"; message: string };

/* ============================================================
 * Builders
 * ============================================================ */

const ROUTE_LABEL: Record<string, string> = {
  oral: "VO",
  sublingual: "SL",
  intravenosa: "EV",
  intramuscular: "IM",
  subcutanea: "SC",
  topica: "tópico",
  inalatoria: "inalatório",
  nasal: "nasal",
  retal: "VR",
  ocular: "ocular",
  otologica: "otológico",
};

const formatInterval = (h?: number): string => {
  if (!h || h <= 0) return "";
  if (h >= 24) {
    const x = Math.round(h / 24);
    return x === 1 ? "1x ao dia" : `de ${24}/${24}h`;
  }
  return `de ${h}/${h}h`;
};

const formatDuration = (days?: number): string => {
  if (!days || days <= 0) return "";
  return `por ${days} dia${days > 1 ? "s" : ""}`;
};

const pickPresentation = (v2: MedicationV2 | undefined, isPediatric: boolean): Presentation | undefined => {
  if (!v2?.presentations || v2.presentations.length === 0) return undefined;
  // Pediatria: prefere suspensão/gotas/xarope quando disponível.
  if (isPediatric) {
    const liquid = v2.presentations.find((p) =>
      ["suspensao-oral", "solucao-oral", "gotas", "xarope"].includes(p.form),
    );
    if (liquid) return liquid;
  }
  return v2.presentations[0];
};

/**
 * Calcula dose pediátrica (mg) com base no peso e nas regras estruturadas.
 * Retorna null se faltar dado ou não for pediátrico.
 */
const calcPediatricDoseMg = (
  v2: MedicationV2 | undefined,
  weightKg: number | null,
): { perDoseMg: number; intervalH: number } | null => {
  if (!v2?.pediatricDoseStructured || !weightKg) return null;
  const ped = v2.pediatricDoseStructured;
  const interval = ped.intervalHours;
  if (ped.mgPerKgPerDose) {
    let perDose = ped.mgPerKgPerDose * weightKg;
    if (ped.maxPerDoseMg) perDose = Math.min(perDose, ped.maxPerDoseMg);
    return { perDoseMg: perDose, intervalH: interval };
  }
  if (ped.mgPerKgPerDay) {
    const dosesPerDay = Math.max(1, Math.round(24 / interval));
    let perDose = (ped.mgPerKgPerDay * weightKg) / dosesPerDay;
    if (ped.maxDailyMg) {
      const maxPerDose = ped.maxDailyMg / dosesPerDay;
      perDose = Math.min(perDose, maxPerDose);
    }
    return { perDoseMg: perDose, intervalH: interval };
  }
  return null;
};

/**
 * Converte dose em mg para volume (mL) quando a apresentação é líquida.
 * Ex: 250 mg em "250 mg/5 mL" → 5 mL.
 */
const mgToVolume = (doseMg: number, p: Presentation | undefined): string | null => {
  if (!p || !p.perVolumeMl) return null;
  // p.strength em mg/mL (unit `mg/mL`); p.perVolumeMl indica que strength é por p.perVolumeMl.
  // Quando unit é "mg/mL" e perVolumeMl está setado, entendemos o ratio como strength/perVolumeMl mg por mL.
  const mgPerMl = p.unit === "mg/mL" ? p.strength : p.strength / p.perVolumeMl;
  if (!mgPerMl || mgPerMl <= 0) return null;
  const ml = doseMg / mgPerMl;
  // Arredonda para 0,5 mL mais próximo
  const rounded = Math.round(ml * 2) / 2;
  return `${rounded.toString().replace(".", ",")} mL`;
};

/* ============================================================
 * Public API
 * ============================================================ */

/**
 * Constrói uma Suggestion a partir de uma receita do protocolo + medicamento + paciente.
 * Sempre retorna algo utilizável; campos faltantes vêm vazios para edição.
 */
export const buildSuggestion = (
  recipe: SuggestionRecipe,
  med: Medication | undefined,
  patient: PatientContext,
): Suggestion | null => {
  if (!med) return null;

  const v2 = getMedicationV2(recipe.medicationId);
  const presentation = pickPresentation(v2, patient.isPediatric);
  const flags: SuggestionFlag[] = [];

  // === Apresentação ===
  const presentationLabel = presentation?.label
    ?? (med.name.match(/\d+\s*(mg|g|mcg|UI|mL)/i)?.[0] ?? "");

  // === Via ===
  const route = presentation?.routes?.[0]
    ? ROUTE_LABEL[presentation.routes[0]] ?? presentation.routes[0]
    : "VO";

  // === Dose / Frequência / Duração ===
  let dose = "";
  let frequency = "";
  let duration = "";

  // Pediatria com cálculo estruturado
  const pedCalc = patient.isPediatric ? calcPediatricDoseMg(v2, patient.weightKg) : null;

  if (pedCalc) {
    const ml = mgToVolume(pedCalc.perDoseMg, presentation);
    if (ml) {
      dose = ml;
    } else {
      const rounded = Math.round(pedCalc.perDoseMg);
      dose = `${rounded} mg`;
    }
    frequency = formatInterval(pedCalc.intervalH);
    const days = recipe.overrideDurationDays ?? v2?.pediatricDoseStructured?.durationDays;
    duration = formatDuration(days);
  } else if (patient.isPediatric && v2?.requiresWeight && !patient.weightKg) {
    flags.push({ kind: "needs-weight", message: "Informe o peso para calcular a dose pediátrica." });
    dose = med.pediatricDose ?? "Calcular por peso";
    frequency = "";
    duration = formatDuration(recipe.overrideDurationDays);
  } else if (v2?.adultDose) {
    const a = v2.adultDose;
    // Para sólidos (cápsula/comprimido), expressar em "1 cp" se a apresentação bate.
    if (presentation && ["comprimido", "capsula"].includes(presentation.form) && a.amount === presentation.strength) {
      dose = presentation.form === "capsula" ? "1 cápsula" : "1 comprimido";
    } else {
      dose = `${a.amount} ${a.unit}`;
    }
    frequency = formatInterval(a.intervalHours);
    duration = formatDuration(recipe.overrideDurationDays ?? a.durationDays);
  } else {
    // Fallback: usa os textos do banco legado.
    dose = med.dosage ?? "";
    frequency = "";
    duration = recipe.overrideDurationDays ? formatDuration(recipe.overrideDurationDays) : (med.instructions ?? "");
  }

  // === Flags adicionais ===
  if (patient.isPregnant && (med.safeForPregnant === false || v2?.pregnancy?.severity === "avoid" || v2?.pregnancy?.severity === "contraindicated")) {
    flags.push({
      kind: "pregnancy-unsafe",
      message: v2?.pregnancy?.message ?? "Não recomendado na gestação.",
    });
  }
  if (patient.hasRenalImpairment && (v2?.requiresRenalReview || (v2?.renal && v2.renal.length > 0))) {
    flags.push({
      kind: "renal-caution",
      message: v2?.renal?.[0]?.message ?? "Revisar dose conforme função renal.",
    });
  }
  const ptype = recipe.overridePrescriptionType ?? med.prescriptionType;
  if (ptype && ptype !== "comum") {
    const labels: Record<string, string> = {
      branca2vias: "Receita branca 2 vias",
      amarela: "Notificação amarela (A)",
      azul: "Notificação azul (B)",
    };
    flags.push({ kind: "controlled", message: labels[ptype] ?? "Receita controlada" });
  }

  const posologyText = composePosology({ dose, route, frequency, duration });

  return {
    key: `${recipe.medicationId}-${recipe.line}`,
    medicationId: recipe.medicationId,
    medicationName: med.name.replace(/\s+\d.+$/, "").trim() || med.name,
    presentation: presentationLabel,
    dose,
    frequency,
    duration,
    route,
    line: recipe.line,
    note: recipe.note,
    highlight: recipe.highlight,
    posologyText,
    flags,
  };
};

/**
 * Compõe a posologia em texto pronto para impressão.
 * Ex: "1 comprimido VO de 8/8h por 7 dias".
 */
export const composePosology = ({
  dose,
  route,
  frequency,
  duration,
}: {
  dose: string;
  route: string;
  frequency: string;
  duration: string;
}): string => {
  const parts = [dose, route, frequency, duration].map((s) => s.trim()).filter(Boolean);
  return parts.join(" ");
};

/**
 * Compõe a string final (multilinha) que vai para SelectedMed.text.
 * Ex:
 *   Amoxicilina — 500 mg cápsula
 *   1 cápsula VO de 8/8h por 7 dias
 */
export const buildSelectedTextFromSuggestion = (s: Suggestion, patientName?: string): string => {
  const head = [s.medicationName, s.presentation].filter(Boolean).join(" — ");
  const body = composePosology({ dose: s.dose, route: s.route, frequency: s.frequency, duration: s.duration });
  return [head, body].filter(Boolean).join("\n");
};
