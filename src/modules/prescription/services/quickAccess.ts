/**
 * Etapa 4 — atalhos do médico: favoritos e usados recentemente.
 *
 * Complementam as sugestões clínicas, nunca as substituem: relevância clínica
 * continua vindo do vínculo revisado do quadro.
 */

import { supabase } from "@/integrations/supabase/client";

export interface QuickMedication {
  /** Id do medicamento na base geral, quando conhecido. */
  medicationId: string | null;
  name: string;
  activeIngredient: string | null;
  presentation: string | null;
  route: string | null;
  dose: string | null;
  frequency: string | null;
  duration: string | null;
  notes: string | null;
}

/* ----------------------------- Favoritos ----------------------------- */

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getFavoriteMedications(): Promise<QuickMedication[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return [];

  const { data, error } = await supabase
    .from("favoritos_medicamentos" as any)
    .select(
      "id, principio_ativo, nome_medicamento, apresentacao, via, dose_padrao, unidade_dose, frequencia_padrao, duracao_padrao, observacoes_padrao, ativo",
    )
    .eq("id_usuario", auth.user.id)
    .neq("ativo", false)
    .order("nome_medicamento", { ascending: true })
    .limit(60);
  if (error) throw error;

  return (((data as any) ?? []) as Array<Record<string, any>>).map((r) => ({
    medicationId: null,
    name: r.nome_medicamento ?? r.principio_ativo ?? "—",
    activeIngredient: r.principio_ativo ?? null,
    presentation: r.apresentacao ?? null,
    route: r.via ?? null,
    dose: [r.dose_padrao, r.unidade_dose].filter(Boolean).join(" ") || null,
    frequency: r.frequencia_padrao ?? null,
    duration: r.duracao_padrao ?? null,
    notes: r.observacoes_padrao ?? null,
  }));
}

/* ------------------------------ Recentes ------------------------------ */

const RECENTS_KEY = "prescrimed:medicamentos-recentes";
const RECENTS_MAX = 12;

export function getRecentMedications(): QuickMedication[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QuickMedication[]).slice(0, RECENTS_MAX) : [];
  } catch {
    return [];
  }
}

export function pushRecentMedication(item: QuickMedication): QuickMedication[] {
  try {
    const current = getRecentMedications().filter(
      (m) => m.name.toLowerCase() !== item.name.toLowerCase(),
    );
    const next = [item, ...current].slice(0, RECENTS_MAX);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

/** Mantém apenas os atalhos pertinentes ao quadro selecionado. */
export function filterRelevant(items: QuickMedication[], suggestionNames: string[]): QuickMedication[] {
  if (suggestionNames.length === 0) return items;
  const set = new Set(suggestionNames.map((n) => n.toLowerCase()));
  const relevant = items.filter((i) => set.has(i.name.toLowerCase()));
  return relevant.length > 0 ? relevant : items;
}
