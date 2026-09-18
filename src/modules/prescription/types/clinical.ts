/**
 * Tipos clínicos extendidos — Etapa 7 (base farmacológica/clínica v2)
 *
 * Princípios:
 * - Tudo opcional para coexistir com o Medication legado durante a migração.
 * - Estruturas modulares: presentation, dose, restriction, interaction, rule.
 * - Sem dependência de runtime — tipos puros.
 */

import type { Medication, PregnancyRiskCategory } from "./prescription";

/* ============================================================
 * Apresentação farmacêutica
 * ============================================================ */

export type PharmaceuticalForm =
  | "comprimido"
  | "capsula"
  | "suspensao-oral"
  | "solucao-oral"
  | "gotas"
  | "xarope"
  | "sache"
  | "po-para-suspensao"
  | "solucao-injetavel"
  | "pomada"
  | "creme"
  | "gel"
  | "spray"
  | "aerossol"
  | "nebulizacao"
  | "supositorio"
  | "colirio"
  | "otologica";

export type AdministrationRoute =
  | "oral"
  | "sublingual"
  | "intravenosa"
  | "intramuscular"
  | "subcutanea"
  | "topica"
  | "inalatoria"
  | "nasal"
  | "retal"
  | "ocular"
  | "otologica";

export type ConcentrationUnit =
  | "mg"
  | "g"
  | "mcg"
  | "UI"
  | "mg/mL"
  | "mg/g"
  | "mcg/dose"
  | "%"
  | "UI/mL";

export interface Presentation {
  /** Identificador estável dentro do medicamento (slug). */
  id: string;
  form: PharmaceuticalForm;
  /** Valor numérico da concentração (ex: 500, 250, 100). */
  strength: number;
  unit: ConcentrationUnit;
  /** Volume de referência para suspensões/soluções (ex: 5 para "mg/5mL"). */
  perVolumeMl?: number;
  /** Vias permitidas para esta apresentação. */
  routes: AdministrationRoute[];
  /** Texto humano curto para UI (ex: "500 mg comp", "250 mg/5 mL susp"). */
  label: string;
  /** Marca / referência opcional. */
  brand?: string;
}

/* ============================================================
 * Dose estruturada
 * ============================================================ */

export interface AdultDose {
  /** Dose por administração (ex: 500). Combinada com `unit`. */
  amount: number;
  unit: "mg" | "g" | "mcg" | "UI" | "mL";
  /** Intervalo em horas entre doses (ex: 8 = 8/8h). */
  intervalHours: number;
  /** Duração usual em dias. */
  durationDays?: number;
  /** Dose máxima diária (segurança). */
  maxDailyAmount?: number;
  notes?: string;
}

export interface PediatricDose {
  /** mg/kg/dia (preferido) — calculado e dividido por intervalo. */
  mgPerKgPerDay?: number;
  /** mg/kg/dose (alternativa quando aplicável). */
  mgPerKgPerDose?: number;
  intervalHours: number;
  /** Dose máxima por administração (em mg, salvo notação contrária). */
  maxPerDoseMg?: number;
  /** Dose máxima diária (em mg). */
  maxDailyMg?: number;
  /** Idade mínima recomendada em anos. */
  minAgeYears?: number;
  /** Duração usual em dias. */
  durationDays?: number;
  notes?: string;
}

/* ============================================================
 * Restrições e interações
 * ============================================================ */

export type RestrictionSeverity = "info" | "caution" | "avoid" | "contraindicated";

export interface PregnancyRestriction {
  category: PregnancyRiskCategory;
  severity: RestrictionSeverity;
  message: string;
}

export interface RenalRestriction {
  /** Severidade mínima da disfunção em que a restrição passa a valer. */
  fromSeverity: "leve" | "moderada" | "grave";
  severity: RestrictionSeverity;
  message: string;
  /** Ajuste textual sugerido (placeholder até termos clearance numérico). */
  adjustment?: string;
}

export interface MedicationInteraction {
  /** ID do outro medicamento (ou string para classe terapêutica). */
  withMedicationId?: number;
  withClass?: string;
  severity: RestrictionSeverity;
  message: string;
}

/* ============================================================
 * Medication v2 — superset opcional do Medication atual
 * ============================================================ */

export interface MedicationV2 extends Medication {
  /** Nome técnico (DCI/INN). Ex: "amoxicillin". */
  activeIngredient?: string;
  /** Classe terapêutica padronizada (ex: "antibiotico-betalactamico"). */
  therapeuticClass?: string;
  /** Código ATC quando aplicável. */
  atcCode?: string;
  presentations?: Presentation[];
  adultDose?: AdultDose;
  pediatricDoseStructured?: PediatricDose;
  pregnancy?: PregnancyRestriction;
  renal?: RenalRestriction[];
  interactions?: MedicationInteraction[];
  /** Indica que requer peso para emissão segura em pediatria. */
  requiresWeight?: boolean;
  /** Sinaliza necessidade de revisão de função renal. */
  requiresRenalReview?: boolean;
  /** Curadoria/governança. */
  verifiedBy?: string;
  lastReviewed?: string; // ISO date
  sources?: string[];
}

/* ============================================================
 * Motor de regras — registry
 * ============================================================ */

export type RuleCategory =
  | "missing-data"
  | "pediatric"
  | "pregnancy"
  | "allergy"
  | "renal"
  | "duplicate"
  | "interaction"
  | "dose"
  | "consistency";

export interface RuleMetadata {
  id: string;
  category: RuleCategory;
  /** Apenas para documentação interna. */
  description: string;
  /** Habilitada? Default true. Permite desligar regras sem remover. */
  enabled?: boolean;
}

/* ============================================================
 * Bibliotecas clínicas auxiliares
 * ============================================================ */

export interface ExamItem {
  id: string;
  name: string;
  category: string;
  /** Justificativa padrão sugerida. */
  defaultJustification?: string;
  synonyms?: string[];
}

export interface ProcedureItem {
  id: string;
  name: string;
  category: string;
  defaultJustification?: string;
  synonyms?: string[];
}

export interface OrientationItem {
  id: string;
  title: string;
  category: string;
  body: string;
  /** Sinais de alarme — bloco separado para destacar na emissão. */
  redFlags?: string[];
  returnPlan?: string;
  synonyms?: string[];
}

export interface SpecialtyItem {
  id: string;
  name: string;
  /** Razões frequentes para encaminhamento. */
  commonReasons?: string[];
}

export interface ProtocolTemplate {
  id: string;
  name: string;
  specialty?: string;
  /** Medicamentos sugeridos por id do banco. */
  medicationIds: number[];
  orientations?: string[];
  examIds?: string[];
  notes?: string;
}
