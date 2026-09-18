/**
 * Taxonomia regulatória — Portaria SVS/MS 344/98 e atualizações.
 *
 * Modelo (camadas):
 *   1. Lista regulatória da substância (A1/A2/A3/B1/B2/C1/C2/C5/comum)
 *   2. Tipo de receituário exigido (mapeado a partir da lista)
 *   3. Regras operacionais por tipo (validade, retenção, máx. substâncias, vias)
 *
 * Por que separar de `prescriptionType`?
 *   `PrescriptionType` (comum/branca2vias/amarela/azul) é o *suporte* (papel).
 *   `RegulatoryList` é o *fato regulatório* da substância. Vários princípios
 *   ativos com listas diferentes (C1 vs C5) podem compartilhar o mesmo papel
 *   (Receita de Controle Especial), mas cada um pode ter regras distintas
 *   (ex: limite de 3 substâncias por receita C1).
 *
 * Esta arquitetura permite atualizar a base regulatória (Anvisa publica
 * resoluções com frequência) sem mexer na UI nem na impressão.
 */
import type { PrescriptionType } from "../types/prescription";

/* ============================================================
 * Listas regulatórias (Portaria SVS/MS 344/98 — Anexo I)
 * ============================================================ */

export type RegulatoryList =
  | "A1"   // entorpecentes (ex: morfina, metadona, fentanil)
  | "A2"   // entorpecentes — concentração especial (ex: codeína, tramadol em algumas formas)
  | "A3"   // psicotrópicos — anfetaminas, metilfenidato
  | "B1"   // psicotrópicos — benzodiazepínicos (alprazolam, clonazepam, diazepam)
  | "B2"   // psicotrópicos anorexígenos (sibutramina, mazindol)
  | "C1"   // outras substâncias sujeitas a controle especial (sertralina, fluoxetina, anticonvulsivantes)
  | "C2"   // retinoides de uso sistêmico (isotretinoína)
  | "C5"   // anabolizantes (testosterona, oxandrolona)
  | "antimicrobiano" // RDC 471/2021 — antibióticos (receita branca, retenção 1ª via)
  | "comum"; // sem enquadramento controlado

/** Família de receituário em papel (suporte físico/legal). */
export type ReceiptFamily =
  | "comum"        // Receita simples branca (1 via)
  | "controle-especial" // Receita de Controle Especial (branca, 2 vias) — C1, C2, C5
  | "antimicrobiano"    // Receita branca para antimicrobianos (2 vias) — RDC 471/2021
  | "notificacao-A"     // Notificação de Receita "A" (amarela) — A1, A2, A3
  | "notificacao-B"     // Notificação de Receita "B" (azul) — B1, B2
  | "notificacao-especial"; // Notificação especial (ex: talidomida) — futuro

/* ============================================================
 * Mapeamento Lista → Família
 * ============================================================ */

export const LIST_TO_FAMILY: Record<RegulatoryList, ReceiptFamily> = {
  A1: "notificacao-A",
  A2: "notificacao-A",
  A3: "notificacao-A",
  B1: "notificacao-B",
  B2: "notificacao-B",
  C1: "controle-especial",
  C2: "controle-especial",
  C5: "controle-especial",
  antimicrobiano: "antimicrobiano",
  comum: "comum",
};

/** Mapeamento Família → tipo de impressão usado pelo PrintArea atual. */
export const FAMILY_TO_PRINT_TYPE: Record<ReceiptFamily, PrescriptionType> = {
  comum: "comum",
  "controle-especial": "branca2vias",
  antimicrobiano: "branca2vias",
  "notificacao-A": "amarela",
  "notificacao-B": "azul",
  "notificacao-especial": "branca2vias",
};

/* ============================================================
 * Regras operacionais por família (validade, retenção, limites)
 * ============================================================ */

export interface ReceiptRules {
  family: ReceiptFamily;
  /** Rótulo curto exibido no UI ("Receita comum", "Controle Especial" etc). */
  label: string;
  /** Descrição curta para o painel de revisão. */
  description: string;
  /** Validade da receita em dias a partir da emissão. */
  validityDays: number;
  /** Número de vias que devem ser emitidas. */
  copies: number;
  /** Texto explicativo de quem fica com cada via. */
  retentionPolicy: string;
  /** Máximo de substâncias (princípios ativos distintos) por receita. */
  maxDistinctSubstances?: number;
  /** Cor base do badge (token semântico). */
  toneToken: "neutral" | "info" | "warning" | "destructive" | "amber" | "sky";
  /** Flag visual: precisa de papel timbrado especial fornecido pela vigilância. */
  requiresOfficialPaper: boolean;
  /** Mensagem curta de orientação ao médico. */
  guidance: string;
}

export const RECEIPT_RULES: Record<ReceiptFamily, ReceiptRules> = {
  comum: {
    family: "comum",
    label: "Receita comum",
    description: "Receita simples para medicamentos sem controle especial.",
    validityDays: 30,
    copies: 1,
    retentionPolicy: "Não exige retenção. Permanece com o paciente.",
    toneToken: "neutral",
    requiresOfficialPaper: false,
    guidance: "Pode ser dispensada sem retenção da via na farmácia.",
  },
  antimicrobiano: {
    family: "antimicrobiano",
    label: "Receita de antimicrobiano",
    description: "Receita branca em 2 vias — RDC 471/2021. 1ª via retida na farmácia.",
    validityDays: 10,
    copies: 2,
    retentionPolicy: "1ª via retida na farmácia · 2ª via fica com o paciente.",
    toneToken: "info",
    requiresOfficialPaper: false,
    guidance: "Validade curta (10 dias). Identifique o paciente com cuidado.",
  },
  "controle-especial": {
    family: "controle-especial",
    label: "Receita de Controle Especial",
    description: "Receita branca em 2 vias — substâncias C1/C2/C5. 1ª via retida na farmácia.",
    validityDays: 30,
    copies: 2,
    retentionPolicy: "1ª via retida na farmácia · 2ª via fica com o paciente.",
    maxDistinctSubstances: 3, // C1: até 3 substâncias por receita
    toneToken: "info",
    requiresOfficialPaper: false,
    guidance: "Limite recomendado de 3 substâncias por receita (C1). Letra legível.",
  },
  "notificacao-A": {
    family: "notificacao-A",
    label: "Notificação de Receita A (amarela)",
    description: "Talonário amarelo — entorpecentes (A1/A2) e anfetaminas (A3).",
    validityDays: 30,
    copies: 1,
    retentionPolicy: "Notificação retida na farmácia · receita fica com o paciente.",
    maxDistinctSubstances: 1, // 1 substância por notificação
    toneToken: "amber",
    requiresOfficialPaper: true,
    guidance: "Exige talonário oficial amarelo numerado, fornecido pela vigilância sanitária.",
  },
  "notificacao-B": {
    family: "notificacao-B",
    label: "Notificação de Receita B (azul)",
    description: "Talonário azul — psicotrópicos (B1: benzodiazepínicos / B2: anorexígenos).",
    validityDays: 30,
    copies: 1,
    retentionPolicy: "Notificação retida na farmácia · receita fica com o paciente.",
    maxDistinctSubstances: 1, // 1 substância por notificação
    toneToken: "sky",
    requiresOfficialPaper: true,
    guidance: "Exige talonário oficial azul numerado. Validade restrita à UF emissora.",
  },
  "notificacao-especial": {
    family: "notificacao-especial",
    label: "Notificação especial",
    description: "Substâncias com regras adicionais (ex: talidomida).",
    validityDays: 20,
    copies: 2,
    retentionPolicy: "Conforme regulamento específico da substância.",
    maxDistinctSubstances: 1,
    toneToken: "destructive",
    requiresOfficialPaper: true,
    guidance: "Verifique exigências específicas da substância (termo de consentimento, etc).",
  },
};

/* ============================================================
 * Helpers
 * ============================================================ */

export const getFamilyForList = (list: RegulatoryList): ReceiptFamily =>
  LIST_TO_FAMILY[list];

export const getRulesForList = (list: RegulatoryList): ReceiptRules =>
  RECEIPT_RULES[getFamilyForList(list)];

export const getPrintTypeForFamily = (family: ReceiptFamily): PrescriptionType =>
  FAMILY_TO_PRINT_TYPE[family];

/** Ordem canônica de exibição (mais restritivo primeiro). */
export const FAMILY_DISPLAY_ORDER: ReceiptFamily[] = [
  "notificacao-especial",
  "notificacao-A",
  "notificacao-B",
  "controle-especial",
  "antimicrobiano",
  "comum",
];
