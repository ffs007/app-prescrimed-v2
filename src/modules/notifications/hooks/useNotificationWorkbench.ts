/**
 * Estado da ficha de notificação compulsória: agravo escolhido, rascunho,
 * campos internos da instituição e validação. Persistido localmente para o
 * médico não perder o preenchimento ao trocar de tela.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  agravoById,
  buildNotifSections,
  emptyNotif,
  NOTIF_SECTIONS,
  validateNotif,
  type NotifData,
  type NotifField,
} from "../lib/notificationSpec";

const DRAFT_KEY = "prescrimed-notificacao-draft";
const AGRAVO_KEY = "prescrimed-notificacao-agravo";
const LAYOUT_KEY = "prescrimed-notificacao-layout";
const DEFAULTS_KEY = "prescrimed-notificacao-defaults";

interface Layout {
  customFields: Record<string, NotifField[]>;
  hidden: string[];
}

const EMPTY_LAYOUT: Layout = { customFields: {}, hidden: [] };

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
};

/** Campos fixos do serviço e do notificante, reaproveitados entre fichas. */
const DEFAULT_KEYS = [
  "unidadeNome",
  "unidadeCnes",
  "unidadeMunicipio",
  "unidadeUf",
  "notificanteNome",
  "notificanteRegistro",
  "notificanteFuncao",
  "notificanteContato",
  "vigilanciaDestino",
];

export const saveNotifDefaults = (data: NotifData) => {
  const out: NotifData = {};
  for (const k of DEFAULT_KEYS) if (data[k]) out[k] = data[k];
  localStorage.setItem(DEFAULTS_KEY, JSON.stringify(out));
};

export const readNotifDefaults = (): NotifData => read<NotifData>(DEFAULTS_KEY, {});

export const useNotificationWorkbench = () => {
  const [agravoId, setAgravoIdState] = useState<string>(
    () => localStorage.getItem(AGRAVO_KEY) ?? "",
  );
  const [layout, setLayout] = useState<Layout>(() => read(LAYOUT_KEY, EMPTY_LAYOUT));
  const [data, setData] = useState<NotifData>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      const base = { ...emptyNotif(), ...readNotifDefaults() };
      return raw ? { ...base, ...JSON.parse(raw) } : base;
    } catch {
      return emptyNotif();
    }
  });

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  }, [data]);
  useEffect(() => {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
  }, [layout]);
  useEffect(() => {
    localStorage.setItem(AGRAVO_KEY, agravoId);
  }, [agravoId]);

  const agravo = useMemo(() => agravoById(agravoId), [agravoId]);

  const sections = useMemo(
    () => buildNotifSections(agravo, layout.customFields, layout.hidden),
    [agravo, layout],
  );

  const issues = useMemo(() => validateNotif(sections, data, agravo), [sections, data, agravo]);
  const missing = issues.filter((i) => i.kind === "obrigatorio");
  const inconsistencies = issues.filter((i) => i.kind === "consistencia");

  const setField = useCallback(
    (key: string, value: string | boolean) => setData((d) => ({ ...d, [key]: value })),
    [],
  );

  const merge = useCallback((patch: NotifData) => setData((d) => ({ ...d, ...patch })), []);

  const setAgravoId = useCallback((id: string) => {
    setAgravoIdState(id);
    const spec = agravoById(id);
    if (!spec) return;
    setData((d) => {
      const next = { ...d };
      for (const fd of spec.campos) {
        if (next[fd.key] === undefined) {
          next[fd.key] = fd.type === "checkbox" ? false : fd.type === "select" ? (fd.options?.[0]?.value ?? "") : "";
        }
      }
      if (spec.cid && !String(next.cid ?? "").trim()) next.cid = spec.cid;
      if (!String(next.vigilanciaDestino ?? "").trim()) next.vigilanciaDestino = spec.destino;
      if (!String(next.dataNotificacao ?? "").trim()) {
        next.dataNotificacao = new Date().toISOString().slice(0, 10);
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setData({ ...emptyNotif(sections), ...readNotifDefaults() });
  }, [sections]);

  const addCustomField = useCallback((sectionId: string, field: NotifField) => {
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
        [sectionId]: (l.customFields[sectionId] ?? []).filter((fd) => fd.key !== key),
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

  const hiddenSections = useMemo(
    () => NOTIF_SECTIONS.filter((s) => !s.core && layout.hidden.includes(s.id)),
    [layout.hidden],
  );

  return {
    agravoId,
    agravo,
    setAgravoId,
    data,
    sections,
    layout,
    hiddenSections,
    issues,
    missing,
    inconsistencies,
    setField,
    merge,
    reset,
    addCustomField,
    removeCustomField,
    toggleSection,
  };
};
