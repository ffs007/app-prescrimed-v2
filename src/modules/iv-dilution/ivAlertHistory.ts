import { supabase } from "@/integrations/supabase/client";
import type { IVAlert } from "./ivSafetyEngine";

export type IVAlertAction =
  | "corrigiu_prescricao"
  | "confirmou_com_justificativa"
  | "ignorou_alerta_informativo"
  | "bloqueado_pelo_sistema";

export interface LogIVAlertInput {
  alert: IVAlert;
  principio_ativo: string;
  acao: IVAlertAction;
  justificativa?: string;
  id_prescricao?: string;
  id_paciente?: string;
}

export async function logIVAlert(input: LogIVAlertInput) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase.from("historico_alertas_iv").insert({
      usuario_responsavel: session.user.id,
      principio_ativo: input.principio_ativo,
      tipo_alerta: input.alert.type,
      gravidade: input.alert.severity,
      mensagem_alerta: input.alert.message,
      valor_prescrito: input.alert.prescribedValue ?? null,
      valor_recomendado: input.alert.recommendedValue ?? null,
      acao_usuario: input.acao,
      justificativa: input.justificativa ?? null,
      id_prescricao: input.id_prescricao ?? null,
      id_paciente: input.id_paciente ?? null,
    });
    if (error) console.error("[ivAlertHistory] falha ao gravar log:", error);
  } catch (error) {
    console.error("[ivAlertHistory] falha ao gravar log:", error);
  }
}
