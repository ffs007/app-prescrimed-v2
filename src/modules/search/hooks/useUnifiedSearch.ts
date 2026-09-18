import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useClinicalLibrary } from "@/modules/library/hooks/useClinicalLibrary";
import {
  NAV_ENTRIES,
  buildPathologyEntries,
  libraryEntries,
  scoreEntries,
  type ScoredEntry,
  type SearchEntry,
} from "../lib/searchIndex";

const RECENT_KEY = "prescrimed:search:recent";
const CONTEXT_KEY = "prescrimed:search:context-pathology";

const readList = (key: string): string[] => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

/** Sugestões conforme a tela em que o usuário está. */
const ROUTE_HINTS: { match: string; terms: string[] }[] = [
  { match: "/app/internacoes", terms: ["AIH", "CID", "procedimento", "internação"] },
  { match: "/app/notificacoes", terms: ["dengue", "sífilis", "tuberculose", "notificação"] },
  { match: "/app/prescricao", terms: ["dose", "interação", "escore", "exames"] },
  { match: "/app/medicamentos", terms: ["dose", "diluição", "interação"] },
  { match: "/app/protocolos-escores", terms: ["sepse", "SCA", "AVC", "qSOFA"] },
  { match: "/app/patologias", terms: ["favoritos", "anamnese", "conduta"] },
  { match: "/app/documentos", terms: ["atestado", "relatório", "encaminhamento"] },
];

export function useUnifiedSearch(query: string) {
  const { pathname } = useLocation();
  const { items: library } = useClinicalLibrary();
  const [recent, setRecent] = useState<string[]>(() => readList(RECENT_KEY));
  const [contextPathology, setContextPathology] = useState<string | null>(
    () => localStorage.getItem(CONTEXT_KEY),
  );

  useEffect(() => {
    const onStorage = () => setContextPathology(localStorage.getItem(CONTEXT_KEY));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const entries: SearchEntry[] = useMemo(
    () => [...NAV_ENTRIES, ...buildPathologyEntries(), ...libraryEntries(library ?? [])],
    [library],
  );

  const contextTerms = useMemo(() => {
    const hint = ROUTE_HINTS.find((h) => pathname.startsWith(h.match));
    return [...(contextPathology ? [contextPathology] : []), ...(hint?.terms ?? [])];
  }, [pathname, contextPathology]);

  const results: ScoredEntry[] = useMemo(
    () => scoreEntries(entries, query, contextTerms).slice(0, 40),
    [entries, query, contextTerms],
  );

  const suggestions = useMemo(() => {
    const hint = ROUTE_HINTS.find((h) => pathname.startsWith(h.match));
    return Array.from(new Set([...(contextPathology ? [contextPathology] : []), ...recent, ...(hint?.terms ?? [])])).slice(0, 8);
  }, [pathname, recent, contextPathology]);

  const rememberQuery = useCallback((q: string) => {
    const value = q.trim();
    if (!value) return;
    setRecent((prev) => {
      const next = [value, ...prev.filter((r) => r !== value)].slice(0, 6);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignora */
      }
      return next;
    });
  }, []);

  const rememberPathology = useCallback((label: string) => {
    setContextPathology(label);
    try {
      localStorage.setItem(CONTEXT_KEY, label);
    } catch {
      /* ignora */
    }
  }, []);

  return { results, suggestions, contextPathology, rememberQuery, rememberPathology };
}
