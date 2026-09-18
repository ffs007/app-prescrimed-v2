import type { Medication } from "../types/prescription";
import { calcPediatricDose } from "./doseCalculator";

export interface PatientContext {
  isPediatric: boolean;
  weight: string;
}

/**
 * Gera o texto padronizado de um medicamento na receita,
 * aplicando cálculo pediátrico quando aplicável.
 */
export const formatMedicationText = (med: Medication, ctx: PatientContext): string => {
  if (ctx.isPediatric && med.pediatricDose && ctx.weight) {
    const weightKg = parseFloat(ctx.weight);
    if (weightKg > 0) {
      const calculatedDose = calcPediatricDose(med, weightKg);
      return `${med.name}\n${calculatedDose}\n${med.instructions}`.trim();
    }
    return `${med.name}\n${med.pediatricDose}\n${med.instructions}`.trim();
  }
  return `${med.name}\n${med.dosage} ${med.instructions}`.trim();
};
