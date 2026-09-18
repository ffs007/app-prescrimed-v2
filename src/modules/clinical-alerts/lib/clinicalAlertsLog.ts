import { supabase } from "@/integrations/supabase/client";
import type { ClinicalAlertKind, AlertLevel, Severity } from "./clinicalAlertsCalc";

export type ClinicalAlertAction =
  | "visualizou" | "removeu_medicamento" | "substituiu_medicamento"
  | "confirmou_com_justificativa" | "bloqueado_pelo_sistema" | "ignorou_informativo";

export interface ClinicalLogEntry {
  id_prescricao?: string | null;
  id_paciente?: string | null;
  principio_ativo?: string | null;
  medicamento_prescrito?: string | null;
  tipo_alerta: ClinicalAlertKind;
  condicao_relacionada?: string | null;
  gravidade?: Severity | null;
  nivel_alerta?: AlertLevel | null;
  mensagem_alerta: string;
  acao_usuario?: ClinicalAlertAction | null;
  justificativa?: string | null;
}

const queue: ClinicalLogEntry[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  timer = null;
  if (!queue.length) return;
  const batch = queue.splice(0, queue.length);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const rows = batch.map((e) => ({ ...e, usuario_responsavel: user.id }));
    const { error } = await supabase.from("log_alertas_alergias_condicoes").insert(rows as never);
    if (error) console.error("[clinicalAlertsLog] falha ao gravar log:", error);
  } catch (error) {
    console.error("[clinicalAlertsLog] falha ao gravar log:", error);
  }
}

export function logClinicalAlert(entry: ClinicalLogEntry) {
  queue.push(entry);
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, 1000);
}
