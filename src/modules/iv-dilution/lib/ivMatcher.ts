import type { IVMedication } from "../IVDilutionAdminPage";

// Medicamentos cujo princípio ativo, sozinho, é ambíguo e exige escolha manual.
const HIGH_RISK_AMBIGUOUS = [
  "anfotericina",
  "potassio",
  "potássio",
  "insulina",
  "heparina",
  "noradrenalina",
];

const UNIT_TOKENS = new Set([
  "mg", "g", "mcg", "ug", "ml", "l", "ui", "u", "kg",
  "fa", "frasco", "frascoampola", "ampola", "ampolas",
  "comprimido", "comprimidos", "po", "solucao", "injetavel",
  "iv", "ev", "im", "sc", "vo",
]);

export function normalizeIV(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Remove tokens de unidade/apresentação para isolar o princípio ativo. */
export function stripUnits(text: string): string {
  const tokens = normalizeIV(text)
    .split(" ")
    .filter((t) => t && !UNIT_TOKENS.has(t) && !/^\d+([,.]\d+)?$/.test(t));
  return tokens.join(" ").trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const v0 = new Array(b.length + 1);
  const v1 = new Array(b.length + 1);
  for (let i = 0; i <= b.length; i++) v0[i] = i;
  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= b.length; j++) v0[j] = v1[j];
  }
  return v1[b.length];
}

export function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const max = Math.max(a.length, b.length);
  return 1 - levenshtein(a, b) / max;
}

export type MatchType = "exata" | "parcial" | "fuzzy" | "manual" | "nenhuma";

export type Candidate = {
  med: IVMedication;
  score: number;
  type: MatchType;
  matchedTerm?: string;
};

export type MatchResult = {
  query: string;
  normalized: string;
  best: Candidate | null;
  candidates: Candidate[];
  ambiguous: boolean;
  highRisk: boolean;
};

function termsForMed(m: IVMedication): { term: string; norm: string }[] {
  const all = [
    m.principio_ativo,
    (m as any).principio_ativo_normalizado,
    m.nome_comercial_referencia ?? "",
    ...((m as any).nomes_comerciais ?? []),
    ...((m as any).nomes_alternativos ?? []),
    ...((m as any).sinonimos ?? []),
    ...((m as any).termos_busca ?? []),
  ].filter(Boolean) as string[];
  return all.map((t) => ({ term: t, norm: normalizeIV(t) }));
}

export function matchMedication(
  query: string,
  meds: IVMedication[],
): MatchResult {
  const normalized = normalizeIV(query);
  const stripped = stripUnits(query);
  const result: MatchResult = {
    query,
    normalized,
    best: null,
    candidates: [],
    ambiguous: false,
    highRisk: false,
  };
  if (!normalized) return result;

  const active = meds.filter((m) => (m as any).ativo_para_correspondencia !== false);

  const scored: Candidate[] = [];
  for (const m of active) {
    const terms = termsForMed(m);
    let best = 0;
    let bestType: MatchType = "nenhuma";
    let bestTerm: string | undefined;

    for (const { term, norm } of terms) {
      if (!norm) continue;

      // Exata
      if (norm === normalized || norm === stripped) {
        if (100 > best) { best = 100; bestType = "exata"; bestTerm = term; }
        continue;
      }

      // Parcial (substring de palavra)
      const inQuery = new RegExp(`(^|\\s)${escapeRe(norm)}(\\s|$)`).test(normalized);
      const inStripped = new RegExp(`(^|\\s)${escapeRe(norm)}(\\s|$)`).test(stripped);
      if (inQuery || inStripped) {
        const score = norm.length >= 5 ? 92 : 86;
        if (score > best) { best = score; bestType = "parcial"; bestTerm = term; }
        continue;
      }

      // Fuzzy
      const sim = Math.max(
        similarity(norm, normalized),
        similarity(norm, stripped),
      );
      if (sim >= 0.7) {
        const score = Math.round(50 + sim * 40); // 0.7→78, 0.85→84, 1→90
        if (score > best) { best = score; bestType = "fuzzy"; bestTerm = term; }
      }
    }

    if (best > 0) scored.push({ med: m, score: best, type: bestType, matchedTerm: bestTerm });
  }

  scored.sort((a, b) => b.score - a.score);
  result.candidates = scored;
  result.best = scored[0] ?? null;

  // Alto risco
  const isHighRiskQuery = HIGH_RISK_AMBIGUOUS.some((k) =>
    normalized.includes(normalizeIV(k)),
  );
  result.highRisk = isHighRiskQuery;

  // Ambiguidade: 2+ candidatos com score >= 90, ou alto risco com >1 candidato
  const strong = scored.filter((c) => c.score >= 90);
  if (strong.length >= 2) result.ambiguous = true;
  if (isHighRiskQuery && scored.length > 1) result.ambiguous = true;

  return result;
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function shouldAutoAssociate(r: MatchResult): boolean {
  if (!r.best) return false;
  if (r.ambiguous) return false;
  return r.best.score >= 90;
}
