/**
 * Motor de agrupamento regulatório.
 *
 * Substitui `groupSelectedByPrescriptionType` por uma camada que:
 *   - classifica cada item via `classifyMedication`
 *   - agrupa por **família** de receituário
 *   - aplica regras por família (ex: máx 3 substâncias C1)
 *   - quando a regra é violada, **divide o grupo** em múltiplos sub-documentos
 *   - gera mensagem inteligente quando a prescrição é fragmentada
 */

import type { Medication, SelectedMed } from "../types/prescription";
import {
  type ReceiptFamily,
  type ReceiptRules,
  RECEIPT_RULES,
  FAMILY_DISPLAY_ORDER,
} from "./regulatoryTaxonomy";
import {
  classifyMedication,
  type RegulatoryClassification,
} from "./regulatoryClassification";

export interface GroupedItem {
  selected: SelectedMed;
  medication: Medication;
  classification: RegulatoryClassification;
}

export interface RegulatoryGroup {
  /** Identificador único (família + index, para múltiplos sub-grupos). */
  id: string;
  family: ReceiptFamily;
  rules: ReceiptRules;
  items: GroupedItem[];
  /** Índice (1-based) quando há múltiplos sub-documentos da mesma família. */
  subIndex?: number;
  /** Total de sub-documentos da mesma família (para "1 de 2"). */
  subTotal?: number;
  /** Mensagens de regras aplicadas (ex: "Dividido em 2 receitas: limite de 3 substâncias"). */
  notes: string[];
}

export interface RegulatoryGroupingResult {
  groups: RegulatoryGroup[];
  /** Total de documentos finais que serão emitidos. */
  totalDocuments: number;
  /** Quantas famílias regulatórias distintas estão presentes. */
  distinctFamilies: number;
  /** Mensagem amigável explicando a divisão (vazia se 1 documento único). */
  splitMessage?: string;
  /** True quando a prescrição teve que ser fragmentada por regra. */
  wasSplit: boolean;
}

/* ============================================================
 * Pipeline
 * ============================================================ */

/** Conta princípios ativos distintos em um conjunto de itens. */
const countDistinctIngredients = (items: GroupedItem[]): number => {
  const set = new Set<string>();
  for (const it of items) {
    set.add(it.classification.identifiedIngredient ?? it.medication.name.toLowerCase());
  }
  return set.size;
};

/** Divide um conjunto de itens em chunks que respeitem `maxDistinctSubstances`. */
const splitByMaxSubstances = (
  items: GroupedItem[],
  max: number,
): GroupedItem[][] => {
  const chunks: GroupedItem[][] = [];
  let current: GroupedItem[] = [];
  const currentIngredients = new Set<string>();

  for (const it of items) {
    const ing = it.classification.identifiedIngredient ?? it.medication.name.toLowerCase();
    // Se o ingrediente já está no chunk, agrega sem aumentar a contagem
    if (currentIngredients.has(ing)) {
      current.push(it);
      continue;
    }
    // Se adicionar excederia o limite, fecha o chunk e começa um novo
    if (currentIngredients.size >= max) {
      chunks.push(current);
      current = [];
      currentIngredients.clear();
    }
    current.push(it);
    currentIngredients.add(ing);
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
};

/**
 * Função principal: recebe medicamentos selecionados + base, devolve
 * documentos finais já fragmentados conforme regras regulatórias.
 */
export const buildRegulatoryGroups = (
  selected: SelectedMed[],
  allMedications: Medication[],
): RegulatoryGroupingResult => {
  // 1. Classifica cada item
  const itemsWithClass: GroupedItem[] = [];
  for (const sel of selected) {
    const med = allMedications.find((m) => m.id === sel.id);
    if (!med) continue;
    const classification = classifyMedication(med);
    itemsWithClass.push({ selected: sel, medication: med, classification });
  }

  // 2. Agrupa por família
  const byFamily = new Map<ReceiptFamily, GroupedItem[]>();
  for (const item of itemsWithClass) {
    const f = item.classification.family;
    if (!byFamily.has(f)) byFamily.set(f, []);
    byFamily.get(f)!.push(item);
  }

  // 2.1 Regra de unificação: se houver QUALQUER item de Controle Especial
  // ou Antimicrobiano, todos os comuns são mesclados nesse mesmo documento.
  // Notificações A/B continuam separadas (exigência de talonário oficial).
  const commonItems = byFamily.get("comum") ?? [];
  const ceItems = byFamily.get("controle-especial") ?? [];
  const amItems = byFamily.get("antimicrobiano") ?? [];

  if (commonItems.length > 0 && (ceItems.length > 0 || amItems.length > 0)) {
    // Prioridade: Controle Especial absorve. Se não houver CE mas houver
    // antimicrobiano, antimicrobiano absorve.
    const targetFamily: ReceiptFamily = ceItems.length > 0 ? "controle-especial" : "antimicrobiano";
    const merged = [...(byFamily.get(targetFamily) ?? []), ...commonItems];
    byFamily.set(targetFamily, merged);
    byFamily.delete("comum");
  }

  // 3. Para cada família, gera o(s) documento(s).
  // Limite de princípios ativos foi removido conforme decisão de produto:
  // tudo o que cair em Controle Especial sai em 1 documento único.
  const groups: RegulatoryGroup[] = [];

  for (const family of FAMILY_DISPLAY_ORDER) {
    const items = byFamily.get(family);
    if (!items || items.length === 0) continue;

    const rules = RECEIPT_RULES[family];
    groups.push({
      id: family,
      family,
      rules,
      items,
      notes: [],
    });
  }

  // 4. Mensagem inteligente
  const distinctFamilies = byFamily.size;
  const totalDocuments = groups.length;
  let splitMessage: string | undefined;

  if (totalDocuments > 1) {
    splitMessage = `A prescrição foi separada em ${totalDocuments} documentos para respeitar o talonário oficial exigido por cada notificação especial.`;
  }

  return {
    groups,
    totalDocuments,
    distinctFamilies,
    splitMessage,
    wasSplit: false,
  };
};

/** Compatibilidade: retorna se há ao menos um grupo não-comum. */
export const hasControlledMedication = (result: RegulatoryGroupingResult): boolean =>
  result.groups.some((g) => g.family !== "comum");

/** Resumo curto para chips/badges: "3 documentos · 2 tipos". */
export const summarizeGrouping = (result: RegulatoryGroupingResult): string => {
  if (result.totalDocuments === 0) return "Nenhum item";
  if (result.totalDocuments === 1) return "1 documento";
  return `${result.totalDocuments} documentos · ${result.distinctFamilies} tipos`;
};
