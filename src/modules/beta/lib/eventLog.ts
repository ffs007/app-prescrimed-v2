import { supabase } from "@/integrations/supabase/client";

export type BetaEventType =
  | "prescricao_criada"
  | "prescricao_finalizada"
  | "alerta_critico_exibido"
  | "justificativa_registrada"
  | "documento_gerado"
  | "documento_impresso"
  | "documento_digital_gerado"
  | "link_criado"
  | "link_enviado"
  | "link_revogado"
  | "assinatura_solicitada"
  | "assinatura_concluida"
  | "teste_clinico_executado"
  | "teste_clinico_aprovado"
  | "teste_clinico_reprovado"
  | "configuracao_alterada";

/** Fire-and-forget log for beta. Failure NEVER throws. */
export async function logBetaEvent(
  tipo: BetaEventType,
  payload: Record<string, unknown> = {},
): Promise<void> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    await supabase.from("eventos_beta_log").insert({
      tipo_evento: tipo,
      payload: payload as never,
      usuario: auth.user?.id ?? null,
    });
  } catch {
    // silent
  }
}
