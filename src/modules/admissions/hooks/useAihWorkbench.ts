/**
 * Estado da aba de Internações (AIH): rascunho, campos institucionais
 * adicionais, layout das seções e validação. Persistido localmente para
 * que o médico não perca o preenchimento ao trocar de tela.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AIH_SECTIONS,
  emptyAih,
  validateAih,
  type AihData,
  type AihField,
  type AihSection,
} from "../lib/aihSpec";

const DRAFT_KEY = "prescrimed-aih-draft";
const LAYOUT_KEY = "prescrimed-aih-layout";

interface Layout {
  /** Campos criados pelo serviço, por seção. */
  customFields: Record<string, AihField[]>;
  /** Seções não obrigatórias ocultadas. */
  hidden: string[];
  /** Ordem das seções (ids). */
  order: string[];
}

const EMPTY_LAYOUT: Layout = { customFields: {}, hidden: [], order: AIH_SECTIONS.map((s) => s.id) };

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
};

export const useAihWorkbench = () => {
  const [layout, setLayout] = useState<Layout>(() => read(LAYOUT_KEY, EMPTY_LAYOUT));
  const [data, setData] = useState<AihData>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? { ...emptyAih(), ...JSON.parse(raw) } : emptyAih();
    } catch {
      return emptyAih();
    }
  });

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  }, [data]);
  useEffect(() => {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
  }, [layout]);

  /** Seções efetivas: padrão + campos institucionais, na ordem escolhida. */
  const sections: AihSection[] = useMemo(() => {
    const byId = new Map(AIH_SECTIONS.map((s) => [s.id, s]));
    const ordered = [
      ...layout.order.map((id) => byId.get(id)).filter((s): s is AihSection => Boolean(s)),
      ...AIH_SECTIONS.filter((s) => !layout.order.includes(s.id)),
    ];
    return ordered
      .filter((s) => s.core || !layout.hidden.includes(s.id))
      .map((s) => ({ ...s, fields: [...s.fields, ...(layout.customFields[s.id] ?? [])] }));
  }, [layout]);

  const issues = useMemo(() => validateAih(sections, data), [sections, data]);
  const missing = issues.filter((i) => i.kind === "obrigatorio");
  const inconsistencies = issues.filter((i) => i.kind === "consistencia");

  const setField = useCallback(
    (key: string, value: string | boolean) => setData((d) => ({ ...d, [key]: value })),
    [],
  );

  const merge = useCallback((patch: AihData) => setData((d) => ({ ...d, ...patch })), []);

  const reset = useCallback(() => setData(emptyAih(sections)), [sections]);

  const addCustomField = useCallback((sectionId: string, field: AihField) => {
    setLayout((l) => ({
      ...l,
      customFields: {
        ...l.customFields,
        [sectionId]: [...(l.customFields[sectionId] ?? []), { ...field, custom: true }],
      },
    }));
  }, []);

  const removeCustomField = useCallback((sectionId: string, key: string) => {
    setLayout((l) => ({
      ...l,
      customFields: {
        ...l.customFields,
        [sectionId]: (l.customFields[sectionId] ?? []).filter((f) => f.key !== key),
      },
    }));
    setData((d) => {
      const next = { ...d };
      delete next[key];
      return next;
    });
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setLayout((l) => ({
      ...l,
      hidden: l.hidden.includes(sectionId)
        ? l.hidden.filter((id) => id !== sectionId)
        : [...l.hidden, sectionId],
    }));
  }, []);

  const moveSection = useCallback((sectionId: string, dir: -1 | 1) => {
    setLayout((l) => {
      const order = l.order.length ? [...l.order] : AIH_SECTIONS.map((s) => s.id);
      const i = order.indexOf(sectionId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= order.length) return l;
      [order[i], order[j]] = [order[j], order[i]];
      return { ...l, order };
    });
  }, []);

  const resetLayout = useCallback(() => setLayout(EMPTY_LAYOUT), []);

  return {
    data,
    sections,
    layout,
    issues,
    missing,
    inconsistencies,
    setField,
    merge,
    reset,
    addCustomField,
    removeCustomField,
    toggleSection,
    moveSection,
    resetLayout,
  };
};
