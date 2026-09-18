import { useCallback } from "react";
import type { Medication } from "../types/prescription";
import { formatMedicationText } from "../services/prescriptionFormatter";

export interface PediatricContext {
  isPediatric: boolean;
  weight: string;
}

/**
 * Retorna uma função estável que formata o texto do medicamento
 * já considerando o contexto pediátrico do paciente.
 */
export const usePediatricDose = (ctx: PediatricContext) => {
  const getMedText = useCallback(
    (med: Medication): string => formatMedicationText(med, ctx),
    [ctx.isPediatric, ctx.weight],
  );

  return { getMedText };
};
