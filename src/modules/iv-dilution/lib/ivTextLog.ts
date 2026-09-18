import { supabase } from "@/integrations/supabase/client";

type Action = "gerou_texto" | "editou_texto" | "aprovou_texto" | "marcou_precisa_ajuste" | "substituiu_por_manual";

export async function logIVTextChange(args: {
  id_medicamento: string;
  principio_ativo: string;
  campo_texto_alterado: string;
  valor_anterior?: string | null;
  valor_novo?: string | null;
  tipo_acao: Action;
}) {
  try {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await (supabase as any).from("log_textos_diluicao_iv").insert({
      ...args,
      usuario_responsavel: u.user.id,
    });
    if (error) console.error("[ivTextLog] falha ao gravar log:", error);
  } catch (error) {
    console.error("[ivTextLog] falha ao gravar log:", error);
  }
}
