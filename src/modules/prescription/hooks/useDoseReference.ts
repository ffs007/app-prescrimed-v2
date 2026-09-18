/**
 * useDoseReference — doses de referência vindas de `base_medicamentos_dose`,
 * filtradas pelo perfil do paciente (adulto/pediátrico) e por busca livre.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DoseRow {
  id: string;
  principio_ativo: string;
  via: string;
  indicacao: string | null;
  populacao: string | null;
  dose_tipo: string | null;
  dose_min: number | null;
  dose_max: number | null;
  dose_unidade: string | null;
  frequencia: string | null;
  duracao: string | null;
  intervalo_horas: number | null;
  dose_maxima_dia: number | null;
  dose_maxima_dia_unidade: string | null;
  observacao_dose: string | null;
  dose_pendente_de_fonte: boolean | null;
  revisao_farmaceutica_obrigatoria: boolean | null;
}

const COLS =
  "id, principio_ativo, via, indicacao, populacao, dose_tipo, dose_min, dose_max, dose_unidade, frequencia, duracao, intervalo_horas, dose_maxima_dia, dose_maxima_dia_unidade, observacao_dose, dose_pendente_de_fonte, revisao_farmaceutica_obrigatoria";

export function useDoseReference(term: string, isPediatric: boolean) {
  const q = term.trim();

  return useQuery({
    queryKey: ["dose-reference", q.toLowerCase(), isPediatric],
    enabled: q.length >= 2,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<DoseRow[]> => {
      const { data, error } = await supabase
        .from("base_medicamentos_dose")
        .select(COLS)
        .ilike("principio_ativo", `%${q}%`)
        .order("principio_ativo")
        .limit(60);
      if (error) throw error;
      const rows = (data ?? []) as unknown as DoseRow[];
      const wanted = isPediatric ? "pedi" : "adult";
      const matching = rows.filter((r) => (r.populacao ?? "").toLowerCase().includes(wanted));
      return matching.length > 0 ? matching : rows;
    },
  });
}

export interface ComputedDose {
  /** Texto com a dose já calculada (ou a faixa fixa, quando não é por peso). */
  label: string;
  /** Alerta quando a dose calculada ultrapassa a dose máxima diária. */
  exceedsMax: boolean;
  /** Quando true, o cálculo depende do peso e ele não foi informado. */
  needsWeight: boolean;
}

const fmt = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return String(r).replace(".", ",");
};

/** Converte a linha de referência em dose calculada para o peso informado. */
export function computeDose(row: DoseRow, weightKg: number | null): ComputedDose {
  const unit = row.dose_unidade ?? "";
  const isPerWeight = /\/kg/i.test(unit) || row.dose_tipo === "peso";
  const min = row.dose_min;
  const max = row.dose_max;

  if (min == null && max == null) {
    return { label: row.frequencia ?? "Sem dose estruturada", exceedsMax: false, needsWeight: false };
  }

  const range = (a: number | null, b: number | null, suffix: string) =>
    a != null && b != null && a !== b ? `${fmt(a)}–${fmt(b)} ${suffix}` : `${fmt((a ?? b) as number)} ${suffix}`;

  if (!isPerWeight) {
    return { label: range(min, max, unit).trim(), exceedsMax: false, needsWeight: false };
  }

  if (!weightKg || weightKg <= 0) {
    return { label: range(min, max, unit).trim(), exceedsMax: false, needsWeight: true };
  }

  // "mg/kg/dose", "mg/kg/dia", "mg/kg/8h" → mantém o sufixo depois de /kg.
  const suffix = unit.replace(/^[^/]*\/kg/i, "").replace(/^\//, "") || "dose";
  const base = unit.split("/")[0] || "mg";
  const lo = min != null ? min * weightKg : null;
  const hi = max != null ? max * weightKg : null;
  const label = `${range(lo, hi, base)} por ${suffix} (${fmt(weightKg)} kg)`;

  const top = hi ?? lo ?? 0;
  const exceedsMax =
    row.dose_maxima_dia != null &&
    /dia/i.test(suffix) &&
    top > row.dose_maxima_dia;

  return { label, exceedsMax, needsWeight: false };
}
