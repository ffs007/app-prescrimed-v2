/**
 * Etapa 3 — Camada de revisão clínica.
 *
 * Separa dois conceitos que não podem se confundir:
 *   - completude técnica  → os dados existem no banco;
 *   - revisão clínica     → os dados foram conferidos e liberados para o fluxo rápido.
 *
 * Nada aqui corrige farmacologia por inferência. As ações apenas registram
 * decisões humanas, sempre com rastreabilidade.
 */

import { supabase } from "@/integrations/supabase/client";

export type ReviewStatus = "pending_review" | "reviewed" | "needs_correction" | "inactive";

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  pending_review: "Pendente de revisão",
  reviewed: "Revisado",
  needs_correction: "Precisa corrigir",
  inactive: "Inativo",
};

export type ReviewFilter =
  | "prontos"
  | "pendentes"
  | "revisados"
  | "precisam_corrigir"
  | "inativos"
  | "inconsistencias"
  | "todos";

export const REVIEW_FILTER_LABEL: Record<ReviewFilter, string> = {
  prontos: "Tecnicamente completos aguardando revisão",
  pendentes: "Pendentes",
  revisados: "Revisados",
  precisam_corrigir: "Precisam correção",
  inativos: "Inativos",
  inconsistencias: "Inconsistências (revisar primeiro)",
  todos: "Todos",
};

export interface ReviewQueueItem {
  medicamentoId: string;
  apresentacaoId: string | null;
  doseId: string | null;
  principioAtivo: string;
  classeTerapeutica: string | null;
  categoriaClinica: string | null;
  usoUrgencia: boolean;
  usoEmergencia: boolean;
  apresentacaoTexto: string | null;
  formaFarmaceutica: string | null;
  concentracao: string | null;
  unidadeConcentracao: string | null;
  volume: string | null;
  unidadeVolume: string | null;
  via: string | null;
  usoAdulto: boolean;
  usoPediatrico: boolean;
  populacao: string | null;
  doseMin: number | null;
  doseMax: number | null;
  doseUnidade: string | null;
  frequencia: string | null;
  duracao: string | null;
  posologiaTexto: string | null;
  observacaoDose: string | null;
  doseMaximaDia: string | null;
  apresentacaoUtilizavel: boolean;
  doseUtilizavel: boolean;
  alertas: number;
  tiposAlerta: string[];
  status: ReviewStatus;
  versao: number | null;
  revisadoEm: string | null;
  fonte: string | null;
  observacao: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

function toItem(row: Row): ReviewQueueItem {
  return {
    medicamentoId: String(row.medicamento_id),
    apresentacaoId: row.apresentacao_id ?? null,
    doseId: row.dose_id ?? null,
    principioAtivo: row.principio_ativo ?? "—",
    classeTerapeutica: row.classe_terapeutica ?? null,
    categoriaClinica: row.categoria_clinica ?? null,
    usoUrgencia: !!row.uso_em_urgencia,
    usoEmergencia: !!row.uso_emergencia,
    apresentacaoTexto: row.apresentacao_texto ?? null,
    formaFarmaceutica: row.forma_farmaceutica ?? null,
    concentracao: row.concentracao ?? null,
    unidadeConcentracao: row.unidade_concentracao ?? null,
    volume: row.volume != null ? String(row.volume) : null,
    unidadeVolume: row.unidade_volume ?? null,
    via: row.via ?? null,
    usoAdulto: row.uso_adulto !== false,
    usoPediatrico: !!row.uso_pediatrico,
    populacao: row.populacao ?? null,
    doseMin: row.dose_min ?? null,
    doseMax: row.dose_max ?? null,
    doseUnidade: row.dose_unidade ?? null,
    frequencia: row.frequencia ?? null,
    duracao: row.duracao ?? null,
    posologiaTexto: row.posologia_texto ?? null,
    observacaoDose: row.observacao_dose ?? null,
    doseMaximaDia: row.dose_maxima_dia || null,
    apresentacaoUtilizavel: !!row.apresentacao_utilizavel,
    doseUtilizavel: !!row.dose_utilizavel,
    alertas: Number(row.alertas_qualidade ?? 0),
    tiposAlerta: Array.isArray(row.tipos_alerta) ? row.tipos_alerta : [],
    status: (row.status_revisao_clinica ?? "pending_review") as ReviewStatus,
    versao: row.versao ?? null,
    revisadoEm: row.revisado_em ?? null,
    fonte: row.fonte ?? null,
    observacao: row.observacao ?? null,
  };
}

/** Fila priorizada: inconsistências → tecnicamente completos → emergência → urgência. */
export async function getReviewQueue(filter: ReviewFilter, limit = 120): Promise<ReviewQueueItem[]> {
  const { data, error } = await supabase.rpc("fn_fila_revisao_clinica" as any, {
    p_filtro: filter,
    p_limit: limit,
  });
  if (error) throw error;
  return (((data as any) ?? []) as Row[]).map(toItem);
}

export interface ReviewSummary {
  pendentes: number;
  revisados: number;
  precisam_corrigir: number;
  inativos: number;
  completos_aguardando: number;
  inconsistencias: number;
  liberados_medicamentos: number;
  liberados_itens: number;
  apresentacoes_total: number;
  medicamentos_com_apresentacao: number;
}

export async function getReviewSummary(): Promise<ReviewSummary> {
  const { data, error } = await supabase.rpc("fn_resumo_revisao_clinica" as any);
  if (error) throw error;
  return (data ?? {}) as unknown as ReviewSummary;
}

export type ReviewAction = "aprovar" | "corrigir" | "pendente" | "inativar";

/** Registra a decisão do revisor. Aprovação é recusada pelo banco quando há inconsistência aberta. */
export async function applyReviewAction(input: {
  item: ReviewQueueItem;
  action: ReviewAction;
  observacao?: string | null;
  fonte?: string | null;
  proximaRevisao?: string | null;
}): Promise<void> {
  const { error } = await supabase.rpc("fn_revisao_clinica_acao" as any, {
    p_medicamento_id: input.item.medicamentoId,
    p_apresentacao_id: input.item.apresentacaoId,
    p_dose_id: input.item.doseId,
    p_acao: input.action,
    p_observacao: input.observacao ?? null,
    p_fonte: input.fonte ?? null,
    p_proxima_revisao: input.proximaRevisao ?? null,
  });
  if (error) throw error;
}

/** Campos que o revisor pode corrigir manualmente. Nenhuma conversão automática de unidade. */
export interface DosePatch {
  via?: string;
  populacao?: string;
  dose_min?: string;
  dose_max?: string;
  dose_unidade?: string;
  frequencia?: string;
  duracao?: string;
  posologia_texto?: string;
  observacao_dose?: string;
}

export async function correctDose(doseId: string, patch: DosePatch): Promise<void> {
  const clean = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined && String(v).trim() !== ""),
  );
  if (Object.keys(clean).length === 0) return;
  const { error } = await supabase.rpc("fn_revisao_clinica_corrigir_dose" as any, {
    p_dose_id: doseId,
    p_patch: clean,
  });
  if (error) throw error;
}

/** Rótulo curto da apresentação para a tela de revisão. */
export function presentationLabel(item: ReviewQueueItem): string {
  if (item.apresentacaoTexto) return item.apresentacaoTexto;
  const parts = [item.formaFarmaceutica, item.concentracao].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Apresentação não cadastrada";
}

export function posologyLabel(item: ReviewQueueItem): string {
  if (item.posologiaTexto) return item.posologiaTexto;
  const dose = [item.doseMin, item.doseMax].filter((v) => v != null).join("–");
  const parts = [dose ? `${dose} ${item.doseUnidade ?? ""}`.trim() : null, item.frequencia, item.duracao].filter(
    Boolean,
  );
  return parts.length > 0 ? parts.join(" · ") : "Dose pendente de revisão clínica";
}
