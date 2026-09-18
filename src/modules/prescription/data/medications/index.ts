/**
 * Banco farmacológico v2 — entrada modular.
 *
 * Estratégia de migração:
 * - O banco "legado" continua em src/data/medications.ts (DEFAULT_MEDICATIONS)
 *   e segue alimentando todos os fluxos como hoje.
 * - Aqui mantemos o overlay v2: para um subconjunto curado de medicamentos,
 *   adicionamos princípio ativo, apresentações, dose estruturada, gestação,
 *   função renal e interações. O motor de regras consulta este overlay via
 *   `getMedicationV2(id)` e cai no legado quando não houver entrada v2.
 *
 * Vantagens:
 * - Zero quebra de compatibilidade.
 * - Migração incremental (adicionar arquivos por classe terapêutica).
 * - Curadoria rastreável (verifiedBy / lastReviewed por item).
 */

import type { MedicationV2 } from "../../types/clinical";
import { antibioticsV2 } from "./antibiotics";
import { analgesicsAntipyreticsV2 } from "./analgesics-antipyretics";
import { antiInflammatoriesV2 } from "./anti-inflammatories";
import { corticosteroidsV2 } from "./corticosteroids";
import { respiratoryV2 } from "./respiratory";
import { gastroV2 } from "./gastro";
import { antiallergicsV2 } from "./antiallergics";
import { cardiovascularV2 } from "./cardiovascular";
import { antidiabeticsV2 } from "./antidiabetics";
import { statinsV2 } from "./statins";

/** Overlay completo v2 (indexado por id do medicamento legado). */
const V2_OVERLAY: Record<number, MedicationV2> = Object.fromEntries(
  [
    ...antibioticsV2,
    ...analgesicsAntipyreticsV2,
    ...antiInflammatoriesV2,
    ...corticosteroidsV2,
    ...respiratoryV2,
    ...gastroV2,
    ...antiallergicsV2,
    ...cardiovascularV2,
    ...antidiabeticsV2,
    ...statinsV2,
  ].map((m) => [m.id, m]),
);

/** Recupera a versão v2 de um medicamento — undefined se ainda não migrado. */
export const getMedicationV2 = (id: number): MedicationV2 | undefined =>
  V2_OVERLAY[id];

/** Lista todos os medicamentos com cobertura v2 (para auditoria/UI). */
export const listV2Medications = (): MedicationV2[] => Object.values(V2_OVERLAY);

/** True quando o medicamento já tem dose pediátrica estruturada validável. */
export const hasStructuredPediatricDose = (id: number): boolean => {
  const m = V2_OVERLAY[id];
  return !!(m?.pediatricDoseStructured?.mgPerKgPerDay || m?.pediatricDoseStructured?.mgPerKgPerDose);
};

/** Estatística de cobertura por classe — útil para painel de auditoria. */
export const v2CoverageByClass = (): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const m of Object.values(V2_OVERLAY)) {
    const k = m.therapeuticClass ?? "outros";
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return counts;
};
