import { supabase } from "@/integrations/supabase/client";
import type { PatientRH, RHAlert, RHResult } from "./renalHepaticCalc";
import { reportError } from "@/lib/reportError";

export async function logRHAlert(args: {
  alert: RHAlert;
  patient: PatientRH;
  result: RHResult;
  principio_ativo: string;
  id_prescricao?: string | null;
  id_paciente?: string | null;
  acao_usuario?: string | null;
  justificativa?: string | null;
}) {
  try {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    if (!uid) return;
    const { error: writeError } = await supabase.from("log_alertas_renal_hepatico").insert({
      usuario_responsavel: uid,
      principio_ativo: args.principio_ativo,
      id_prescricao: args.id_prescricao ?? null,
      id_paciente: args.id_paciente ?? null,
      tipo_alerta: args.alert.tipo,
      gravidade: (args.alert.gravidade === "alto" ? "alto" : args.alert.gravidade === "medio" ? "medio" : "baixo") as any,
      creatinina_serica: args.patient.creatinina_serica ?? null,
      unidade_creatinina: args.patient.unidade_creatinina ?? null,
      clcr_estimado: args.result.clcr ?? null,
      etfg_informada: args.patient.etfg ?? null,
      metodo_calculo_renal: args.result.metodo ?? null,
      classificacao_funcao_renal: args.result.classificacao,
      dados_hepaticos_disponiveis: {
        ast: args.patient.ast ?? null, alt: args.patient.alt ?? null,
        bilirrubina_total: args.patient.bilirrubina_total ?? null,
        albumina: args.patient.albumina ?? null, inr: args.patient.inr ?? null,
        child_pugh: args.patient.child_pugh ?? null,
      } as any,
      mensagem_alerta: args.alert.mensagem,
      acao_usuario: args.acao_usuario ?? "visualizou",
      justificativa: args.justificativa ?? null,
    });
    if (writeError) throw writeError;
  } catch (error) {
    reportError("modules/iv-dilution/lib/renalHepaticLog", error);
  }
}
