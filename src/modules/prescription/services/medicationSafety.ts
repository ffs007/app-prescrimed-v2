import type { Medication, PrescriptionType, SelectedMed } from "../types/prescription";

/**
 * Retorna `true` se o medicamento é seguro (ou não marcado) para gestantes.
 */
export const isMedicationSafeForPregnancy = (med: Medication): boolean => {
  return med.safeForPregnant !== false;
};

/**
 * Tipo de receita exigido por um medicamento. Default: "comum".
 */
export const getRequiredPrescriptionType = (med: Medication): PrescriptionType => {
  return med.prescriptionType ?? "comum";
};

/**
 * Agrupa medicamentos selecionados por tipo de receita exigido.
 *
 * Regra de unificação: quando há medicamentos comuns adicionados juntos
 * com itens de Receita de Controle Especial (branca2vias), os comuns são
 * mesclados nesse mesmo receituário — eles podem (e devem, por praticidade)
 * ser impressos na mesma receita controlada. Notificações A/B continuam
 * separadas por exigência de talonário oficial.
 */
export const groupSelectedByPrescriptionType = (
  selected: SelectedMed[],
  allMedications: Medication[],
): Record<PrescriptionType, SelectedMed[]> => {
  const groups = {} as Record<PrescriptionType, SelectedMed[]>;
  for (const sel of selected) {
    const med = allMedications.find((m) => m.id === sel.id);
    const type = getRequiredPrescriptionType(med ?? ({} as Medication));
    if (!groups[type]) groups[type] = [];
    groups[type].push(sel);
  }
  // Mescla comuns na Receita de Controle Especial quando ambas existem.
  if (groups.comum?.length && groups.branca2vias?.length) {
    groups.branca2vias = [...groups.branca2vias, ...groups.comum];
    delete groups.comum;
  }
  return groups;
};

/**
 * Indica se há ao menos um medicamento que exige receita especial (não comum).
 */
export const hasSpecialPrescription = (
  selected: SelectedMed[],
  allMedications: Medication[],
): boolean => {
  return selected.some((s) => {
    const med = allMedications.find((m) => m.id === s.id);
    return med?.prescriptionType && med.prescriptionType !== "comum";
  });
};
