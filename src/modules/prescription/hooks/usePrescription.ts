import { useCallback, useState } from "react";
import type { Medication, SelectedMed } from "../types/prescription";
import { isMedicationSafeForPregnancy } from "../services/medicationSafety";

/**
 * Erro lançado quando se tenta adicionar um medicamento contraindicado.
 * Use `instanceof MedicationContraindicatedError` para tratar na UI.
 */
export class MedicationContraindicatedError extends Error {
  constructor(public medication: Medication, public reason: "pregnancy") {
    super(`${medication.name} é contraindicado (${reason})`);
    this.name = "MedicationContraindicatedError";
  }
}

export interface AddMedicationContext {
  isPregnant: boolean;
  /** Função que produz o texto formatado do medicamento (com dose pediátrica, etc). */
  getMedText: (med: Medication) => string;
}

/**
 * Hook puro de estado da receita em construção.
 * Sem efeitos colaterais (sem toasts, sem I/O). A orquestração de feedback
 * fica a cargo do componente que consome.
 */
export const usePrescription = () => {
  const [selected, setSelected] = useState<SelectedMed[]>([]);

  const addMedication = useCallback((med: Medication, ctx: AddMedicationContext) => {
    if (ctx.isPregnant && !isMedicationSafeForPregnancy(med)) {
      throw new MedicationContraindicatedError(med, "pregnancy");
    }
    setSelected((prev) => {
      if (prev.find((s) => s.id === med.id)) return prev;
      return [...prev, { id: med.id, name: med.name, text: ctx.getMedText(med) }];
    });
  }, []);

  const removeMedication = useCallback((id: number) => {
    setSelected((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateMedText = useCallback((id: number, text: string) => {
    setSelected((prev) => prev.map((s) => (s.id === id ? { ...s, text } : s)));
  }, []);

  const setMeds = useCallback((meds: SelectedMed[]) => setSelected(meds), []);
  const clear = useCallback(() => setSelected([]), []);

  return {
    selected,
    setSelected,
    setMeds,
    clear,
    addMedication,
    removeMedication,
    updateMedText,
  };
};
