/**
 * Classificação regulatória de medicamentos (Portaria SVS/MS 344/98).
 *
 * Estratégia:
 *   - Mapa por **princípio ativo normalizado** (lowercase, sem acento) → lista.
 *   - `classifyMedication(med)` extrai o princípio ativo do `name` ou usa
 *     o campo `prescriptionType` legado como fallback.
 *
 * Manutenção: para incluir/atualizar uma substância, basta editar
 * `ACTIVE_INGREDIENT_TO_LIST` abaixo. A UI e o motor de agrupamento
 * absorvem automaticamente.
 *
 * IMPORTANTE: esta é uma curadoria clínica de referência — sempre
 * confirmar com a Resolução RDC mais recente da Anvisa antes de uso
 * em produção real.
 */

import type { Medication } from "../types/prescription";
import {
  type RegulatoryList,
  type ReceiptFamily,
  getFamilyForList,
} from "./regulatoryTaxonomy";

/* ============================================================
 * Base de dados (princípio ativo → lista)
 * ============================================================ */

/**
 * Mapa autoritativo. Chaves devem estar normalizadas:
 *   - minúsculas
 *   - sem acentos
 *   - sem dosagem ou apresentação
 * (a função `normalize()` cuida disso na consulta).
 *
 * Cobertura: ~50 substâncias de uso clínico frequente.
 */
const ACTIVE_INGREDIENT_TO_LIST: Record<string, RegulatoryList> = {
  // ============ A1 — Entorpecentes ============
  morfina: "A1",
  fentanil: "A1",
  metadona: "A1",
  oxicodona: "A1",
  petidina: "A1",
  meperidina: "A1",
  hidromorfona: "A1",

  // ============ A2 — Entorpecentes (concentração especial) ============
  codeina: "A2",
  tramadol: "A2",
  buprenorfina: "A2",

  // ============ A3 — Psicotrópicos (anfetaminas) ============
  metilfenidato: "A3",
  ritalina: "A3",
  lisdexanfetamina: "A3",
  venvanse: "A3",
  anfepramona: "A3",
  femproporex: "A3",

  // ============ B1 — Benzodiazepínicos e psicotrópicos ============
  alprazolam: "B1",
  clonazepam: "B1",
  diazepam: "B1",
  bromazepam: "B1",
  lorazepam: "B1",
  midazolam: "B1",
  zolpidem: "B1",
  zopiclona: "B1",
  flurazepam: "B1",
  estazolam: "B1",
  cloxazolam: "B1",
  clobazam: "B1",
  fenobarbital: "B1",
  pentobarbital: "B1",

  // ============ B2 — Anorexígenos ============
  sibutramina: "B2",
  mazindol: "B2",

  // ============ C1 — Substâncias sujeitas a controle especial ============
  // Antidepressivos
  sertralina: "C1",
  fluoxetina: "C1",
  paroxetina: "C1",
  citalopram: "C1",
  escitalopram: "C1",
  amitriptilina: "C1",
  nortriptilina: "C1",
  imipramina: "C1",
  clomipramina: "C1",
  venlafaxina: "C1",
  desvenlafaxina: "C1",
  duloxetina: "C1",
  bupropiona: "C1",
  mirtazapina: "C1",
  trazodona: "C1",
  vortioxetina: "C1",
  // Antipsicóticos
  haloperidol: "C1",
  risperidona: "C1",
  olanzapina: "C1",
  quetiapina: "C1",
  clorpromazina: "C1",
  aripiprazol: "C1",
  ziprasidona: "C1",
  // Anticonvulsivantes
  carbamazepina: "C1",
  oxcarbazepina: "C1",
  topiramato: "C1",
  lamotrigina: "C1",
  gabapentina: "C1",
  pregabalina: "C1",
  fenitoina: "C1",
  "acido valproico": "C1",
  valproato: "C1",
  divalproato: "C1",
  levetiracetam: "C1",
  // Outros
  litio: "C1",
  "carbonato de litio": "C1",
  selegilina: "C1",

  // ============ C2 — Retinoides sistêmicos ============
  isotretinoina: "C2",
  acitretina: "C2",

  // ============ C5 — Anabolizantes ============
  testosterona: "C5",
  oxandrolona: "C5",
  nandrolona: "C5",
  stanozolol: "C5",

  // ============ Antimicrobianos (RDC 471/2021) ============
  amoxicilina: "antimicrobiano",
  azitromicina: "antimicrobiano",
  cefalexina: "antimicrobiano",
  ciprofloxacino: "antimicrobiano",
  metronidazol: "antimicrobiano",
  sulfametoxazol: "antimicrobiano",
  trimetoprima: "antimicrobiano",
  levofloxacino: "antimicrobiano",
  clindamicina: "antimicrobiano",
  doxiciclina: "antimicrobiano",
  norfloxacino: "antimicrobiano",
  fluconazol: "antimicrobiano",
  cefuroxima: "antimicrobiano",
  axetilcefuroxima: "antimicrobiano",
  claritromicina: "antimicrobiano",
  eritromicina: "antimicrobiano",
  cefaclor: "antimicrobiano",
  fenoximetilpenicilina: "antimicrobiano",
  cetoconazol: "antimicrobiano",
  nistatina: "antimicrobiano",
  "amoxicilina + clavulanato": "antimicrobiano",
};

/* ============================================================
 * Normalização e lookup
 * ============================================================ */

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

/**
 * Tenta extrair o princípio ativo do nome comercial/composto.
 * Estratégia: pega o primeiro token alfa, mas testa também tokens
 * compostos ("amoxicilina + clavulanato", "carbonato de litio").
 */
const extractIngredientCandidates = (name: string): string[] => {
  const n = normalize(name);
  const candidates: string[] = [];

  // Combinações conhecidas vêm primeiro
  if (n.includes("amoxicilina") && n.includes("clavulanato")) {
    candidates.push("amoxicilina + clavulanato");
  }
  if (n.includes("sulfametoxazol") && n.includes("trimetoprima")) {
    candidates.push("sulfametoxazol");
  }
  if (n.includes("carbonato") && n.includes("litio")) {
    candidates.push("carbonato de litio");
  }
  if (n.includes("acido") && n.includes("valproico")) {
    candidates.push("acido valproico");
  }

  // Tokens isolados — pega palavras de >= 4 letras
  const tokens = n.split(/[\s,+\-/().]+/).filter((t) => t.length >= 4);
  candidates.push(...tokens);

  return candidates;
};

/* ============================================================
 * API pública
 * ============================================================ */

export interface RegulatoryClassification {
  list: RegulatoryList;
  family: ReceiptFamily;
  /** Princípio ativo identificado (para auditoria/UI). */
  identifiedIngredient?: string;
  /** Origem da classificação (para depuração). */
  source: "active-ingredient" | "legacy-flag" | "default";
}

/**
 * Classifica um medicamento, retornando lista regulatória + família de receita.
 *
 * Ordem de prioridade:
 *   1. Match por princípio ativo no nome
 *   2. Campo legado `prescriptionType` (mapeamento reverso)
 *   3. Default "comum"
 */
export const classifyMedication = (med: Medication): RegulatoryClassification => {
  // 1. Tentar match por princípio ativo
  const candidates = extractIngredientCandidates(med.name);
  for (const c of candidates) {
    if (ACTIVE_INGREDIENT_TO_LIST[c]) {
      const list = ACTIVE_INGREDIENT_TO_LIST[c];
      return {
        list,
        family: getFamilyForList(list),
        identifiedIngredient: c,
        source: "active-ingredient",
      };
    }
  }

  // 2. Fallback: campo legado
  if (med.prescriptionType) {
    const legacyMap: Record<string, RegulatoryList> = {
      branca2vias: "antimicrobiano",
      amarela: "A2",
      azul: "B1",
      comum: "comum",
    };
    const list = legacyMap[med.prescriptionType] ?? "comum";
    return {
      list,
      family: getFamilyForList(list),
      source: "legacy-flag",
    };
  }

  // 3. Default
  return {
    list: "comum",
    family: getFamilyForList("comum"),
    source: "default",
  };
};

/** Versão batch: classifica vários medicamentos. */
export const classifyMedications = (
  meds: Medication[],
): Array<{ medication: Medication; classification: RegulatoryClassification }> =>
  meds.map((m) => ({ medication: m, classification: classifyMedication(m) }));

/** Total de princípios ativos cobertos (para painel de auditoria). */
export const totalIngredientsClassified = (): number =>
  Object.keys(ACTIVE_INGREDIENT_TO_LIST).length;

/** Lista todos os ativos cobertos por uma lista regulatória específica. */
export const ingredientsByList = (list: RegulatoryList): string[] =>
  Object.entries(ACTIVE_INGREDIENT_TO_LIST)
    .filter(([, l]) => l === list)
    .map(([ing]) => ing);
