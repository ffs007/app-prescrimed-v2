import { supabase } from "@/integrations/supabase/client";

export type IVViewType = "card_medico" | "revisao_seguranca_iv" | "orientacao_enfermagem_farmacia" | "pdf" | "anexo_tecnico";
export type IVViewAction = "visualizou" | "expandiu_detalhes" | "copiou_orientacao" | "incluiu_no_pdf" | "removeu_do_pdf";

export async function logIVView(args: {
  principio_ativo: string;
  tipo_visualizacao: IVViewType;
  acao_realizada: IVViewAction;
  perfil_usuario?: string | null;
  id_prescricao?: string | null;
  id_paciente?: string | null;
}) {
  try {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await (supabase as any).from("log_visualizacao_orientacoes_iv").insert({
      ...args,
      usuario_responsavel: u.user.id,
    });
  } catch (e) {
    // silencioso — log não bloqueia UI
    console.warn("logIVView failed", e);
  }
}
