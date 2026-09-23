import { supabase } from "@/integrations/supabase/client";
import { reportError } from "@/lib/reportError";

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
    const { error: writeError } = await supabase.from("eventos_beta_log").insert({
      tipo_evento: tipo,
      payload: payload as never,
      usuario: auth.user?.id ?? null,
    });
    if (writeError) throw writeError;
  } catch (error) {
    reportError("modules/beta/lib/eventLog", error);
  }
}
