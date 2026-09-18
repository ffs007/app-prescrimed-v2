import { supabase } from "@/integrations/supabase/client";
import type { IVCalcInput, IVCalcResult } from "./ivCalc";
import type { IVMedication } from "../IVDilutionAdminPage";

export async function logIVCalc(params: {
  med: IVMedication;
  input: IVCalcInput;
  result: IVCalcResult;
  evento: "alterou_dose" | "alterou_volume" | "alterou_tempo" | "alterou_peso" | "gerou_alerta" | "finalizou";
  prescricaoId?: string | null;
  pacienteId?: string | null;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("log_calculos_iv").insert({
      usuario_responsavel: user.id,
      id_prescricao: params.prescricaoId ?? null,
      id_paciente: params.pacienteId ?? null,
      principio_ativo: params.med.principio_ativo,
      dose_original: params.input.dose_value ?? null,
      unidade_dose_original: params.input.dose_unit ?? null,
      dose_convertida: params.result.dose_total_mg ?? null,
      volume_diluicao: params.result.volume_total_ml ?? null,
      tempo_infusao: params.result.tempo_total_minutos ?? null,
      concentracao_calculada: params.result.concentracao_calculada ?? null,
      concentracao_maxima: params.result.concentracao_maxima ?? null,
      velocidade_calculada_ml_h: params.result.velocidade_ml_h ?? null,
      velocidade_calculada_mg_min: params.result.velocidade_mg_min ?? null,
      velocidade_maxima: params.result.velocidade_maxima_mg_min ?? null,
      peso_paciente_kg: params.input.weight_kg ?? null,
      status_calculo: params.result.status,
      alertas_gerados: params.result.alerts as any,
      evento: params.evento,
    } as any);
  } catch {
    // silencioso
  }
}
