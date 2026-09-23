/**
 * Etapa 4 — administração dos vínculos clínicos (quadro ↔ medicamento).
 *
 * Nada aqui cria vínculos por semelhança de nome. Toda associação é criada ou
 * aprovada por uma pessoa e fica registrada no histórico.
 */

import { supabase } from "@/integrations/supabase/client";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

export type LinkRole =
  | "primeira_linha"
  | "alternativa"
  | "adjuvante"
  | "sintomatico"
  | "resgate"
  | "hospitalar"
  | "situacao_especifica";

export const LINK_ROLE_LABEL: Record<LinkRole, string> = {
  primeira_linha: "Primeira linha",
  alternativa: "Alternativa",
  adjuvante: "Adjuvante",
  sintomatico: "Sintomático",
  resgate: "Resgate / urgência",
  hospitalar: "Hospitalar",
  situacao_especifica: "Situação específica",
};

export type LinkStatus = "pending_review" | "reviewed" | "needs_correction" | "inactive";

export const LINK_STATUS_LABEL: Record<LinkStatus, string> = {
  pending_review: "Pendente de revisão",
  reviewed: "Revisado",
  needs_correction: "Precisa corrigir",
  inactive: "Inativo",
};

export type LinkContext = "ambulatorial" | "urgencia" | "emergencia" | "hospitalar" | "qualquer";

export const LINK_CONTEXT_LABEL: Record<LinkContext, string> = {
  ambulatorial: "Ambulatorial",
  urgencia: "Urgências / PS",
  emergencia: "Emergências / SV",
  hospitalar: "Hospitalar",
  qualquer: "Qualquer contexto",
};

export const GROUP_LABEL: Record<string, string> = {
  A: "A · provável vínculo com quadro existente",
  B: "B · sintomático / adjuvante",
  C: "C · urgência",
  D: "D · hospitalar",
  E: "E · depende do contexto",
  F: "F · sem informação suficiente",
};

export interface ConditionLink {
  id: string;
  conditionName: string;
  medicationId: string;
  activeIngredient: string | null;
  therapeuticClass: string | null;
  role: LinkRole;
  priority: number;
  careContext: LinkContext;
  population: string | null;
  status: LinkStatus;
  notes: string | null;
  sourceReference: string | null;
  version: number;
  reviewedAt: string | null;
  medicationReleased: boolean;
  presentation: string | null;
}

export interface MedicationLink {
  id: string;
  conditionType: "patologia" | "sindrome";
  conditionName: string;
  role: LinkRole;
  priority: number;
  careContext: LinkContext;
  status: LinkStatus;
  notes: string | null;
  version: number;
}

export interface UnlinkedMedication {
  medicationId: string;
  activeIngredient: string;
  therapeuticClass: string | null;
  group: string;
  groupReason: string | null;
  workPriority: number;
  hasPresentation: boolean;
  hasDose: boolean;
}

export interface LinkSummary {
  medicamentos_total: number;
  medicamentos_com_vinculo: number;
  medicamentos_sem_vinculo: number;
  vinculos_total: number;
  vinculos_revisados: number;
  vinculos_pendentes: number;
  vinculos_com_problema: number;
  vinculos_inativos: number;
  quadros_com_vinculo: number;
  quadros_prontos: number;
  grupos: Record<string, number>;
}

function toConditionLink(r: Row): ConditionLink {
  return {
    id: String(r.id),
    conditionName: r.condicao_nome ?? "—",
    medicationId: String(r.medicamento_id),
    activeIngredient: r.principio_ativo ?? null,
    therapeuticClass: r.classe_terapeutica ?? null,
    role: (r.papel ?? "alternativa") as LinkRole,
    priority: Number(r.prioridade ?? 50),
    careContext: (r.care_context ?? "qualquer") as LinkContext,
    population: r.populacao ?? null,
    status: (r.review_status ?? "pending_review") as LinkStatus,
    notes: r.notes ?? null,
    sourceReference: r.source_reference ?? null,
    version: Number(r.versao ?? 1),
    reviewedAt: r.revisado_em ?? null,
    medicationReleased: !!r.medicamento_liberado,
    presentation: r.apresentacao ?? null,
  };
}

export async function getLinksByCondition(
  type: "patologia" | "sindrome",
  condition: string,
): Promise<ConditionLink[]> {
  if (!condition.trim()) return [];
  const { data, error } = await supabase.rpc("fn_vinculos_por_condicao" as any, {
    p_tipo: type,
    p_condicao: condition.trim(),
  });
  if (error) throw error;
  return (((data as any) ?? []) as Row[]).map(toConditionLink);
}

export async function getLinksByMedication(medicationId: string): Promise<MedicationLink[]> {
  if (!medicationId) return [];
  const { data, error } = await supabase.rpc("fn_vinculos_por_medicamento" as any, {
    p_medicamento_id: medicationId,
  });
  if (error) throw error;
  return (((data as any) ?? []) as Row[]).map((r) => ({
    id: String(r.id),
    conditionType: r.condicao_tipo === "sindrome" ? "sindrome" : "patologia",
    conditionName: r.condicao_nome ?? "—",
    role: (r.papel ?? "alternativa") as LinkRole,
    priority: Number(r.prioridade ?? 50),
    careContext: (r.care_context ?? "qualquer") as LinkContext,
    status: (r.review_status ?? "pending_review") as LinkStatus,
    notes: r.notes ?? null,
    version: Number(r.versao ?? 1),
  }));
}

export async function getUnlinkedMedications(): Promise<UnlinkedMedication[]> {
  const { data, error } = await supabase.rpc("fn_medicamentos_sem_vinculo" as any);
  if (error) throw error;
  return (((data as any) ?? []) as Row[]).map((r) => ({
    medicationId: String(r.medicamento_id),
    activeIngredient: r.principio_ativo ?? "—",
    therapeuticClass: r.classe_terapeutica ?? null,
    group: r.grupo ?? "F",
    groupReason: r.grupo_motivo ?? null,
    workPriority: Number(r.prioridade_trabalho ?? 90),
    hasPresentation: !!r.tem_apresentacao,
    hasDose: !!r.tem_dose,
  }));
}

export async function getLinkSummary(): Promise<LinkSummary> {
  const { data, error } = await supabase.rpc("fn_resumo_vinculos_clinicos" as any);
  if (error) throw error;
  return (data ?? {}) as unknown as LinkSummary;
}

export interface ReadyCondition {
  conditionType: string;
  conditionName: string;
  options: number;
}

export async function getReadyConditions(): Promise<ReadyCondition[]> {
  const { data, error } = await supabase.rpc("fn_quadros_prontos_fluxo_rapido" as any);
  if (!error) {
    return (((data as any) ?? []) as Row[]).map((r) => ({
      conditionType: r.condicao_tipo,
      conditionName: r.condicao_nome,
      options: Number(r.opcoes ?? 0),
    }));
  }
  if (error.code !== "PGRST202") throw error;

  const [links, released] = await Promise.all([
    supabase
      .from("clinical_condition_medication")
      .select("condicao_tipo, condicao_nome, condicao_normalizada, medicamento_id")
      .eq("review_status", "reviewed")
      .limit(5000),
    supabase
      .from("vw_medicamento_completo")
      .select("id")
      .eq("ativo", true)
      .eq("status_revisao", "revisado")
      .eq("dose_incompleta", false)
      .eq("apresentacao_incompleta", false)
      .limit(5000),
  ]);
  if (links.error) throw links.error;
  if (released.error) throw released.error;

  const releasedIds = new Set((released.data ?? []).map((item) => item.id).filter(Boolean));
  const grouped = new Map<string, ReadyCondition>();
  for (const item of links.data ?? []) {
    if (!releasedIds.has(item.medicamento_id)) continue;
    const key = `${item.condicao_tipo}|${item.condicao_normalizada}`;
    const current = grouped.get(key);
    if (current) current.options += 1;
    else {
      grouped.set(key, {
        conditionType: item.condicao_tipo,
        conditionName: item.condicao_nome,
        options: 1,
      });
    }
  }
  return [...grouped.values()].sort((a, b) => b.options - a.options);
}

export interface UpsertLinkInput {
  id?: string | null;
  conditionType: "patologia" | "sindrome";
  conditionId?: string | null;
  conditionName: string;
  medicationId: string;
  role: LinkRole;
  priority: number;
  careContext: LinkContext;
  population?: string | null;
  notes?: string | null;
  source?: string | null;
}

export async function upsertLink(input: UpsertLinkInput): Promise<string> {
  const { data, error } = await supabase.rpc("fn_vinculo_upsert" as any, {
    p_id: input.id ?? null,
    p_condicao_tipo: input.conditionType,
    p_condicao_nome: input.conditionName,
    p_medicamento_id: input.medicationId,
    p_papel: input.role,
    p_prioridade: input.priority,
    p_care_context: input.careContext,
    p_populacao: input.population ?? null,
    p_notes: input.notes ?? null,
    p_source: input.source ?? null,
    p_apresentacao_id: null,
    p_condicao_id: input.conditionId ?? null,
  });
  if (error) throw error;
  return String(data);
}

export type LinkAction = "aprovar" | "corrigir" | "pendente" | "inativar" | "remover";

export async function applyLinkAction(id: string, action: LinkAction, note?: string | null): Promise<void> {
  if (action === "remover") {
    const { error } = await supabase.from("clinical_condition_medication").delete().eq("id", id);
    if (error) throw error;
    return;
  }

  const status: Record<Exclude<LinkAction, "remover">, LinkStatus> = {
    aprovar: "reviewed",
    corrigir: "needs_correction",
    pendente: "pending_review",
    inativar: "inactive",
  };
  const patch: Row = { review_status: status[action] };
  if (note) patch.notes = note;
  if (action === "aprovar") {
    const { data: auth } = await supabase.auth.getUser();
    patch.revisado_por = auth.user?.id ?? null;
    patch.revisado_em = new Date().toISOString();
  }
  const { error } = await supabase.from("clinical_condition_medication").update(patch as never).eq("id", id);
  if (error) throw error;
}
