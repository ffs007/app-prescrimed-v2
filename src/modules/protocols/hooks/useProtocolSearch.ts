import { useEffect, useMemo, useState } from "react";
import type { Protocolo } from "../lib/types";
import { searchProtocols } from "../lib/protocolSearch";

const RECENT_KEY = "protocolos_recentes";
const MAX_RECENT = 8;

export function getRecentProtocolIds(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}
export function pushRecentProtocol(id: string) {
  try {
    const cur = getRecentProtocolIds().filter((x) => x !== id);
    cur.unshift(id);
    localStorage.setItem(RECENT_KEY, JSON.stringify(cur.slice(0, MAX_RECENT)));
  } catch { /* noop */ }
}

export function useProtocolSearch(items: Protocolo[], query: string, debounceMs = 200) {
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), debounceMs);
    return () => clearTimeout(t);
  }, [query, debounceMs]);

  const results = useMemo(() => searchProtocols(items, debounced), [items, debounced]);
  return { results, debounced };
}
