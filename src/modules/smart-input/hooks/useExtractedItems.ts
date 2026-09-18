// Etapa 19 — Hook que gerencia o estado dos itens na tela de revisão.
import { useEffect, useState, useCallback, useMemo } from "react";
import type { ExtractedItem, SmartInputSettings } from "../lib/types";
import { shouldPreselect } from "../lib/confidenceBands";

export function useExtractedItems(initial: ExtractedItem[], settings: SmartInputSettings | null) {
  const [items, setItems] = useState<ExtractedItem[]>([]);

  useEffect(() => {
    setItems(
      initial.map((it) => ({
        ...it,
        selecionado: shouldPreselect(it.confianca, settings) && it.campos_faltantes.length === 0,
      })),
    );
  }, [initial, settings]);

  const toggle = useCallback((id: string) => {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, selecionado: !i.selecionado } : i)));
  }, []);
  const edit = useCallback((id: string, patch: Partial<ExtractedItem>) => {
    setItems((p) => p.map((i) => (i.id === id ? ({ ...i, ...patch } as ExtractedItem) : i)));
  }, []);
  const remove = useCallback((id: string) => {
    setItems((p) => p.filter((i) => i.id !== id));
  }, []);

  const selecionados = useMemo(() => items.filter((i) => i.selecionado), [items]);

  return { items, toggle, edit, remove, selecionados };
}
