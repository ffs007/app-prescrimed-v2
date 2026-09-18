import { supabase } from "@/integrations/supabase/client";
import type { PedCalcInput, PedCalcResult } from "./pediatricCalc";

type PedCalcEvent =
  | "calculo_realizado"
  | "peso_alterado"
  | "dose_alterada"
  | "alerta_gerado"
  | "justificativa_preenchida"
  | "prescricao_finalizada";

export async function logPediatricCalc(args: {
  evento: PedCalcEvent;
  input: PedCalcInput;
  result: PedCalcResult;
  principio_ativo: string;
  id_prescricao?: string | null;
  id_paciente?: string | null;
  justificativa?: string | null;
}) {
  try {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    if (!uid) return;
    await supabase.from("log_calculos_pediatricos").insert({
      usuario_responsavel: uid,
      evento: args.evento,
      principio_ativo: args.principio_ativo,
      id_prescricao: args.id_prescricao ?? null,
      id_paciente: args.id_paciente ?? null,
      idade_anos: args.input.patient?.idade_anos ?? args.result.idade_anos_calculada ?? null,
      idade_meses: args.input.patient?.idade_meses ?? null,
      peso_kg: args.input.patient?.peso_kg ?? null,
      dose_prescrita: args.input.dose_prescrita ?? null,
      unidade_dose: args.input.unidade_prescrita ?? null,
      dose_mg_kg_calculada: args.result.dose_mg_kg ?? null,
      dose_minima_calculada: args.result.dose_minima_total ?? null,
      dose_maxima_calculada: args.result.dose_maxima_total ?? null,
      dose_diaria_calculada: args.result.dose_diaria_total ?? null,
      dose_maxima_diaria: args.input.spec?.dose_maxima_diaria ?? null,
      frequencia: args.input.frequencia_texto ?? null,
      status_calculo: args.result.status === "ok" ? "calculado" : "incompleto",
      alertas_gerados: args.result.alerts as any,
      justificativa: args.justificativa ?? null,
    });
  } catch {
    /* silencioso */
  }
}
