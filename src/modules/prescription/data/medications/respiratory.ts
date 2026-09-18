import type { MedicationV2 } from "../../types/clinical";

const META = { verifiedBy: "lovable-curation", lastReviewed: "2026-04-21" } as const;

/**
 * Salbutamol não tem entrada no banco legado — é incluído aqui como
 * referência para futura adição. Mantemos a estrutura pronta.
 *
 * IDs novos a partir de 9000 ficam reservados para o overlay v2 enquanto
 * não são promovidos ao banco legado, para evitar colisão com IDs futuros.
 */
export const respiratoryV2: MedicationV2[] = [
  // Reservado — Salbutamol será adicionado quando promovido ao banco principal.
  // {
  //   id: 9001,
  //   name: "Salbutamol 100mcg/dose (aerossol)",
  //   ...
  // },
];
export const _RESPIRATORY_RESERVED_NOTE = `
Slots reservados para salbutamol, ipratrópio, montelucaste, fluticasona.
Adicionar ao banco legado primeiro (DEFAULT_MEDICATIONS) e depois espelhar aqui.
`;
