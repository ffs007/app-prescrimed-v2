/**
 * @deprecated Use `useMedications` (src/modules/prescription/hooks/useMedications.ts).
 * Mantido como shim de compatibilidade para os consumidores existentes.
 */
import type { Medication } from "@/types/prescription";
import { useMedications } from "./useMedications";

export function useMedicationsCatalog(customMedications: Medication[] = []) {
  return useMedications(customMedications);
}

export { useMedicationsQuery as useBaseMedicamentosAprovados } from "./useMedications";
