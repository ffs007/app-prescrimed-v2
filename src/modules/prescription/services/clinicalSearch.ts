/**
 * Busca clínica unificada — Etapa 7.
 *
 * Indexa medicamentos, patologias, exames, procedimentos, especialidades
 * e orientações em um único índice Fuse.js, com tolerância a typos,
 * suporte a sinônimos e ranking por relevância.
 *
 * Uso:
 *   const { search } = useClinicalSearch();
 *   const results = search("amox");
 *   results.filter(r => r.kind === "medication");
 */

import Fuse from "fuse.js";
import { useMemo } from "react";
import { DEFAULT_MEDICATIONS, DEFAULT_PATHOLOGIES } from "@/data/medications";
import { ORIENTATIONS_LIBRARY } from "../data/orientations";
import { EXAMS_LIBRARY } from "../data/exams";
import { PROCEDURES_LIBRARY } from "../data/procedures";
import { SPECIALTIES_LIBRARY } from "../data/specialties";

export type SearchKind =
  | "medication"
  | "pathology"
  | "exam"
  | "procedure"
  | "specialty"
  | "orientation";

export interface SearchEntry {
  /** Identificador composto kind:id para chave estável em UI. */
  key: string;
  kind: SearchKind;
  id: string | number;
  title: string;
  subtitle?: string;
  category?: string;
  /** Termos auxiliares (sinônimos, princípio ativo, classe). */
  aliases?: string[];
  /** Referência ao item original para lookup direto sem refetch. */
  raw: unknown;
}

export interface SearchResult extends SearchEntry {
  score: number;
}

/* -------- Construção do índice (memoizada por módulo) -------- */

const buildEntries = (): SearchEntry[] => {
  const out: SearchEntry[] = [];

  for (const m of DEFAULT_MEDICATIONS) {
    out.push({
      key: `medication:${m.id}`,
      kind: "medication",
      id: m.id,
      title: m.name,
      subtitle: m.dosage,
      category: m.category,
      aliases: [m.category, m.subCategory ?? ""].filter(Boolean),
      raw: m,
    });
  }

  for (const p of DEFAULT_PATHOLOGIES) {
    out.push({
      key: `pathology:${p.id}`,
      kind: "pathology",
      id: p.id,
      title: p.name,
      subtitle: p.cid ? `CID ${p.cid}` : undefined,
      category: p.category,
      raw: p,
    });
  }

  for (const e of EXAMS_LIBRARY) {
    out.push({
      key: `exam:${e.id}`,
      kind: "exam",
      id: e.id,
      title: e.name,
      category: e.category,
      aliases: e.synonyms,
      raw: e,
    });
  }

  for (const p of PROCEDURES_LIBRARY) {
    out.push({
      key: `procedure:${p.id}`,
      kind: "procedure",
      id: p.id,
      title: p.name,
      category: p.category,
      aliases: p.synonyms,
      raw: p,
    });
  }

  for (const s of SPECIALTIES_LIBRARY) {
    out.push({
      key: `specialty:${s.id}`,
      kind: "specialty",
      id: s.id,
      title: s.name,
      raw: s,
    });
  }

  for (const o of ORIENTATIONS_LIBRARY) {
    out.push({
      key: `orientation:${o.id}`,
      kind: "orientation",
      id: o.id,
      title: o.title,
      category: o.category,
      aliases: o.synonyms,
      raw: o,
    });
  }

  return out;
};

let _entries: SearchEntry[] | null = null;
let _fuse: Fuse<SearchEntry> | null = null;

const getFuse = (): Fuse<SearchEntry> => {
  if (_fuse) return _fuse;
  _entries = buildEntries();
  _fuse = new Fuse(_entries, {
    keys: [
      { name: "title", weight: 0.6 },
      { name: "category", weight: 0.15 },
      { name: "aliases", weight: 0.25 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: 2,
  });
  return _fuse;
};

/* -------- API pública -------- */

export interface ClinicalSearchAPI {
  search: (query: string, opts?: { limit?: number; kinds?: SearchKind[] }) => SearchResult[];
  /** Retorna todas as entradas indexadas (para listagem/governança). */
  all: () => ReadonlyArray<SearchEntry>;
}

export const useClinicalSearch = (): ClinicalSearchAPI => {
  return useMemo<ClinicalSearchAPI>(() => {
    const fuse = getFuse();
    return {
      all: () => _entries ?? [],
      search: (query, opts = {}) => {
        const q = query.trim();
        if (q.length < 2) return [];
        const raw = fuse.search(q, { limit: opts.limit ?? 20 });
        const filtered = opts.kinds?.length
          ? raw.filter((r) => opts.kinds!.includes(r.item.kind))
          : raw;
        return filtered.map((r) => ({
          ...r.item,
          score: r.score ?? 1,
        }));
      },
    };
  }, []);
};
