// Etapa 18 — Hooks do módulo Histórico do Paciente.
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  PrescriptionHistoryRow,
  ContinuousMedicationRow,
  HistoricoSettings,
} from "../lib/types";

export type TimeFilter = "7d" | "30d" | "90d" | "1y" | "all";

const cutoffISO = (f: TimeFilter): string | null => {
  const now = Date.now();
  const map: Record<TimeFilter, number | null> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
    all: null,
  };
  const days = map[f];
  if (!days) return null;
  return new Date(now - days * 86400000).toISOString();
};

export function usePatientHistory(idPaciente: string | null, filter: TimeFilter = "30d") {
  const [rows, setRows] = useState<PrescriptionHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!idPaciente) { setRows([]); return; }
    setLoading(true);
    let q = supabase
      .from("prescricoes_historico")
      .select("*")
      .eq("id_paciente", idPaciente)
      .order("criado_em", { ascending: false });
    const cutoff = cutoffISO(filter);
    if (cutoff) q = q.gte("criado_em", cutoff);
    const { data } = await q;
    setRows(data ?? []);
    setLoading(false);
  }, [idPaciente, filter]);

  useEffect(() => { load(); }, [load]);
  return { rows, loading, reload: load };
}

export function usePreviousPrescription(id: string | null) {
  const [row, setRow] = useState<PrescriptionHistoryRow | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!id) { setRow(null); return; }
    setLoading(true);
    supabase
      .from("prescricoes_historico")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => { setRow(data); setLoading(false); });
  }, [id]);
  return { row, loading };
}

export interface RecurrentMed {
  principio_ativo: string;
  count: number;
  ultima_data: string;
  ultima_dose?: string;
  ultima_via?: string;
  ultima_frequencia?: string;
}

export function useRecurrentMedications(idPaciente: string | null) {
  const { rows } = usePatientHistory(idPaciente, "1y");
  const recurrent = useMemo<RecurrentMed[]>(() => {
    const map = new Map<string, RecurrentMed>();
    for (const p of rows) {
      const itens = (p.itens as unknown as Array<Record<string, unknown>>) ?? [];
      for (const it of itens) {
        if (it.kind !== "medicamento") continue;
        const pa = String(it.principio_ativo ?? it.titulo ?? "").trim();
        if (!pa) continue;
        const cur = map.get(pa.toLowerCase());
        if (cur) {
          cur.count += 1;
        } else {
          map.set(pa.toLowerCase(), {
            principio_ativo: pa,
            count: 1,
            ultima_data: p.criado_em,
            ultima_dose: it.dose as string | undefined,
            ultima_via: it.via as string | undefined,
            ultima_frequencia: it.frequencia as string | undefined,
          });
        }
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [rows]);
  return recurrent;
}

export function useContinuousMedications(idPaciente: string | null) {
  const [rows, setRows] = useState<ContinuousMedicationRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!idPaciente) { setRows([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("medicacoes_uso_continuo")
      .select("*")
      .eq("id_paciente", idPaciente)
      .order("criado_em", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  }, [idPaciente]);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (
    payload: Omit<ContinuousMedicationRow, "id" | "criado_em" | "atualizado_em" | "criado_por">,
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("not-authenticated");
    const { error } = await supabase.from("medicacoes_uso_continuo").insert({
      ...payload,
      criado_por: user.id,
    });
    if (error) throw error;
    await load();
  }, [load]);

  const update = useCallback(async (id: string, patch: Partial<ContinuousMedicationRow>) => {
    const { error } = await supabase
      .from("medicacoes_uso_continuo")
      .update(patch)
      .eq("id", id);
    if (error) throw error;
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    await supabase.from("medicacoes_uso_continuo").delete().eq("id", id);
    await load();
  }, [load]);

  return { rows, loading, add, update, remove, reload: load };
}

export function useHistoricoSettings() {
  const [settings, setSettings] = useState<HistoricoSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("historico_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    setSettings(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = useCallback(async (patch: Partial<HistoricoSettings>) => {
    if (!settings) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("historico_settings")
      .update({ ...patch, updated_by: user?.id ?? null })
      .eq("id", settings.id);
    if (error) throw error;
    await load();
  }, [settings, load]);

  return { settings, loading, update, reload: load };
}
