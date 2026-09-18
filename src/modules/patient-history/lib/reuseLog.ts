// Etapa 18 — Wrappers de log de reaproveitamento e visualização.
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ReuseAction =
  Database["public"]["Enums"]["reaproveitamento_acao"];
type ViewType =
  Database["public"]["Enums"]["historico_tipo_visualizado"];

export interface ReuseLogPayload {
  id_atendimento_atual?: string | null;
  id_paciente: string;
  id_prescricao_origem?: string | null;
  data_prescricao_origem?: string | null;
  acao: ReuseAction;
  itens_visualizados?: unknown[];
  itens_reaproveitados?: unknown[];
  itens_editados?: unknown[];
  itens_removidos?: unknown[];
  alertas_gerados?: unknown[];
  comparacoes_relevantes?: unknown[];
  justificativas?: unknown[];
}

export async function logReuseAction(payload: ReuseLogPayload) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("log_reaproveitamento_prescricao").insert({
      ...payload,
      itens_visualizados: (payload.itens_visualizados ?? []) as never,
      itens_reaproveitados: (payload.itens_reaproveitados ?? []) as never,
      itens_editados: (payload.itens_editados ?? []) as never,
      itens_removidos: (payload.itens_removidos ?? []) as never,
      alertas_gerados: (payload.alertas_gerados ?? []) as never,
      comparacoes_relevantes: (payload.comparacoes_relevantes ?? []) as never,
      justificativas: (payload.justificativas ?? []) as never,
      usuario_responsavel: user.id,
    });
    if (error) console.error("[reuseLog] falha ao gravar log de reaproveitamento:", error);
  } catch (error) {
    console.error("[reuseLog] falha ao gravar log de reaproveitamento:", error);
  }
}

export async function logHistoryView(params: {
  id_paciente: string;
  id_atendimento?: string | null;
  tipo: ViewType;
  item_visualizado?: string | null;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("log_visualizacao_historico_paciente").insert({
      id_paciente: params.id_paciente,
      id_atendimento: params.id_atendimento ?? null,
      tipo_historico_visualizado: params.tipo,
      item_visualizado: params.item_visualizado ?? null,
      usuario_responsavel: user.id,
    });
    if (error) console.error("[reuseLog] falha ao gravar log de visualização:", error);
  } catch (error) {
    console.error("[reuseLog] falha ao gravar log de visualização:", error);
  }
}
