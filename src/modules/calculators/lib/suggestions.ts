/**
 * Sensibilidade clínica das calculadoras.
 *
 * A partir do contexto do atendimento (patologia, ambiente, perfil do paciente
 * e medicamentos já selecionados) devolve quais calculadoras fazem sentido
 * agora — com a justificativa mostrada ao médico.
 */

import type { ClinicalEnvironment } from "@/modules/prescription/types/prescription";
import type { PatientProfile } from "@/modules/prescription/data/pathologyKnowledge";
import { CALCULATORS, type CalculatorDef } from "./calculators";

export interface CalculatorSuggestion {
  calculator: CalculatorDef;
  reason: string;
  /** Quanto menor, mais no topo. */
  weight: number;
}

export interface SuggestionContext {
  pathologyName?: string | null;
  environment?: ClinicalEnvironment | null;
  profiles: PatientProfile[];
  medications: string[];
  isPediatric?: boolean;
  isPregnant?: boolean;
  hasRenalImpairment?: boolean;
  ageInYears?: number | null;
}

const norm = (s: string) =>
  (s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const ANTICOAGULANTS = [
  "varfarina",
  "warfarina",
  "rivaroxabana",
  "apixabana",
  "edoxabana",
  "dabigatrana",
  "enoxaparina",
  "heparina",
  "fondaparinux",
];

const DIURETICS = ["furosemida", "hidroclorotiazida", "espironolactona", "clortalidona", "indapamida"];

const NEPHROTOXIC = ["vancomicina", "gentamicina", "amicacina", "colistina", "aciclovir", "metformina", "aine"];

const CHEMO = ["carboplatina", "cisplatina", "doxorrubicina", "ciclofosfamida", "paclitaxel", "metotrexato"];

const has = (list: string[], hay: string[]) =>
  hay.some((m) => list.some((t) => norm(m).includes(t)));

/** Regras de correlação contexto → calculadora. */
export function suggestCalculators(ctx: SuggestionContext): CalculatorSuggestion[] {
  const out: CalculatorSuggestion[] = [];
  const path = norm(ctx.pathologyName ?? "");
  const meds = ctx.medications ?? [];
  const push = (id: string, reason: string, weight: number) => {
    const calculator = CALCULATORS.find((c) => c.id === id);
    if (!calculator) return;
    const existing = out.find((s) => s.calculator.id === id);
    if (existing) {
      if (weight < existing.weight) {
        existing.weight = weight;
        existing.reason = reason;
      }
      return;
    }
    out.push({ calculator, reason, weight });
  };

  const isAF = /fibrila|flutter|\bfa\b/.test(path);
  const anticoag = has(ANTICOAGULANTS, meds);

  if (isAF && anticoag) {
    push("crcl", "Anticoagulante em fibrilação atrial — a dose depende do clearance de creatinina.", 0);
    push("chads-vasc", "Fibrilação atrial: estratifique o risco tromboembólico antes de manter o anticoagulante.", 1);
    push("hasbled", "Balanceie o risco de sangramento da anticoagulação.", 2);
  } else if (isAF) {
    push("chads-vasc", "Fibrilação atrial — estratificação de risco tromboembólico indicada.", 1);
  } else if (anticoag) {
    push("crcl", "Anticoagulante prescrito — confirme a função renal antes da dose.", 1);
  }

  if (/insufici[eê]ncia card|\bic\b descompensada|edema agudo|congest/.test(path)) {
    push(
      "diuretico-ic",
      "Insuficiência cardíaca descompensada — ajuste do diurético por peso, função renal e resposta prévia.",
      0,
    );
    push("crcl", "Função renal orienta a intensidade da diurese.", 2);
  } else if (has(DIURETICS, meds)) {
    push("diuretico-ic", "Diurético prescrito — verifique a dose frente à função renal e à resposta prévia.", 3);
  }

  if (ctx.hasRenalImpairment || ctx.profiles.includes("nefropata")) {
    push("crcl", "Paciente nefropata — estime o clearance antes de qualquer dose.", 1);
    push("renal-dose", "Ajuste as doses dos fármacos de eliminação renal.", 2);
    push("ckdepi", "Estadiamento da doença renal crônica.", 4);
  }

  if (has(NEPHROTOXIC, meds)) {
    push("crcl", "Fármaco de eliminação/toxicidade renal prescrito.", 2);
    push("renal-dose", "Fármaco que costuma exigir ajuste por clearance.", 3);
  }

  if (ctx.profiles.includes("hepatopata") || /cirros|hepatite|hep[aá]tic/.test(path)) {
    push("child-pugh", "Hepatopatia — a reserva hepática define as doses seguras.", 1);
  }

  if (ctx.profiles.includes("cardiopata") || /coronarian|angina|infarto|sca/.test(path)) {
    push("rcri", "Cardiopatia — útil na avaliação de risco cirúrgico.", 5);
  }

  if (/pr[eé][- ]?operat|cirurg/.test(path)) {
    push("rcri", "Avaliação pré-operatória — índice de risco cardíaco revisado.", 0);
  }

  if (ctx.profiles.includes("oncologico") || has(CHEMO, meds)) {
    push("bsa-dose", "Quimioterapia — doses calculadas por área de superfície corporal.", 1);
    push("carboplatina-auc", "Carboplatina é dosada por AUC (Calvert).", 3);
  }

  if (ctx.isPediatric || ctx.profiles.includes("pediatrico")) {
    push("dose-peso", "Paciente pediátrico — doses por peso com teto diário.", 0);
  }

  if (ctx.isPregnant || ctx.profiles.includes("obstetrico")) {
    push("peso-ideal", "Gestante — prefira o peso pré-gestacional/ideal no cálculo de dose.", 2);
  }

  if (ctx.profiles.includes("geriatrico") || (ctx.ageInYears ?? 0) >= 65) {
    push("crcl", "Idoso — creatinina normal pode mascarar queda importante do clearance.", 2);
  }

  if (ctx.environment === "emergencia" && out.length === 0) {
    push("crcl", "Ambiente de emergência — função renal orienta doses de resgate.", 5);
  }

  return out.sort((a, b) => a.weight - b.weight);
}
