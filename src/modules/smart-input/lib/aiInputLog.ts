// Etapa 19 — Wrappers de log para entrada inteligente.
import { supabase } from "@/integrations/supabase/client";
import { reportError } from "@/lib/reportError";
import type {
  EntradaTipo,
  EntradaOrigem,
  EntradaItemTipo,
  EntradaStatusFinal,
  ExtractedItem,
} from "./types";

export interface SmartInputLogPayload {
  id_atendimento?: string | null;
  id_paciente?: string | null;
  tipo_entrada: EntradaTipo;
  origem: EntradaOrigem;
  texto_original: string | null;
  texto_transcrito_ou_extraido?: string | null;
  itens_identificados: ExtractedItem[];
  itens_adicionados?: ExtractedItem[];
  itens_editados?: ExtractedItem[];
  itens_descartados?: ExtractedItem[];
  campos_ambiguos?: unknown[];
  campos_incompletos?: unknown[];
  alertas_gerados?: string[];
  confianca_geral?: number | null;
  status_final: EntradaStatusFinal;
}

export async function logSmartInput(p: SmartInputLogPayload): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("log_entrada_inteligente")
    .insert({
      id_atendimento: p.id_atendimento ?? null,
      id_paciente: p.id_paciente ?? null,
      tipo_entrada: p.tipo_entrada,
      origem: p.origem,
      texto_original: p.texto_original,
      texto_transcrito_ou_extraido: p.texto_transcrito_ou_extraido ?? null,
      itens_identificados: p.itens_identificados as never,
      itens_adicionados: (p.itens_adicionados ?? []) as never,
      itens_editados: (p.itens_editados ?? []) as never,
      itens_descartados: (p.itens_descartados ?? []) as never,
      campos_ambiguos: (p.campos_ambiguos ?? []) as never,
      campos_incompletos: (p.campos_incompletos ?? []) as never,
      alertas_gerados: (p.alertas_gerados ?? []) as never,
      confianca_geral: p.confianca_geral ?? null,
      status_final: p.status_final,
      usuario_responsavel: user.id,
    })
    .select("id")
    .maybeSingle();
  if (error) return null;
  return data?.id ?? null;
}

export interface ItemEditLogPayload {
  id_entrada: string | null;
  tipo_item: EntradaItemTipo;
  texto_original_item: string | null;
  campo_editado: string;
  valor_extraido_ia: string | null;
  valor_final_usuario: string | null;
}

export async function logItemEdit(p: ItemEditLogPayload) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from("log_edicoes_itens_ia").insert({
    id_entrada: p.id_entrada,
    tipo_item: p.tipo_item,
    texto_original_item: p.texto_original_item,
    campo_editado: p.campo_editado,
    valor_extraido_ia: p.valor_extraido_ia,
    valor_final_usuario: p.valor_final_usuario,
    usuario_responsavel: user.id,
  });
  if (error) reportError("aiInputLog.logItemEdit", error);
}

export async function suggestLearningTerm(p: {
  termo_original: string;
  termo_corrigido: string;
  principio_ativo_relacionado?: string | null;
  contexto?: string | null;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from("termos_aprendizado_ia").insert({
    termo_original: p.termo_original,
    termo_corrigido: p.termo_corrigido,
    principio_ativo_relacionado: p.principio_ativo_relacionado ?? null,
    contexto: p.contexto ?? null,
    sugerido_por: user.id,
  });
  if (error) reportError("aiInputLog.suggestLearningTerm", error);
}
