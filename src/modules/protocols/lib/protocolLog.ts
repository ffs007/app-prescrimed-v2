import { supabase } from "@/integrations/supabase/client";
import type { ProtocolContext } from "./types";

export type ProtocolLogAction = "aberto"|"item_adicionado"|"item_editado"|"item_ignorado"|"plano_montado"|"alerta_gerado"|"aplicado_parcial";

export interface ProtocolLogEntry {
  id_atendimento?: string;
  id_paciente?: string;
  id_protocolo?: string;
  nome_protocolo?: string;
  versao_protocolo?: number;
  contexto_atendimento?: ProtocolContext;
  acao: ProtocolLogAction;
  itens_visualizados?: unknown[];
  itens_adicionados?: unknown[];
  itens_editados?: unknown[];
  itens_ignorados?: unknown[];
  justificativas?: unknown[];
  alertas_gerados?: unknown[];
}

export async function logProtocolUse(entry: ProtocolLogEntry) {
  try {
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) return;
    await (supabase.from("log_uso_protocolos") as any).insert({
      ...entry,
      usuario_responsavel: uid,
    });
  } catch (e) {
    console.warn("logProtocolUse falhou", e);
  }
}
