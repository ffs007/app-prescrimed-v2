import { supabase } from "@/integrations/supabase/client";
import type {
  InteractionAlertLevel, InteractionSeverity, InteractionType,
} from "./interactionsCalc";

export type AlertKind =
  | "interacao_especifica" | "duplicidade_terapeutica" | "risco_acumulado" | "monitorizacao" | "bloqueio";
export type AlertAction =
  | "visualizou" | "corrigiu_prescricao" | "removeu_medicamento" | "substituiu_medicamento"
  | "confirmou_com_justificativa" | "bloqueado_pelo_sistema" | "ignorou_informativo";

export interface InteractionLogEntry {
  id_prescricao?: string | null;
  id_paciente?: string | null;
  medicamentos_envolvidos: string[];
  principios_ativos_envolvidos: string[];
  tipo_alerta: AlertKind;
  tipo_interacao?: InteractionType | null;
  gravidade?: InteractionSeverity | null;
  nivel_alerta?: InteractionAlertLevel | null;
  mensagem_alerta: string;
  acao_usuario?: AlertAction | null;
  justificativa?: string | null;
}

const queue: InteractionLogEntry[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  timer = null;
  if (!queue.length) return;
  const batch = queue.splice(0, queue.length);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const rows = batch.map((e) => ({
      ...e,
      medicamentos_envolvidos: e.medicamentos_envolvidos as unknown as object,
      principios_ativos_envolvidos: e.principios_ativos_envolvidos as unknown as object,
      usuario_responsavel: user.id,
    }));
    const { error } = await supabase.from("log_interacoes_prescricao").insert(rows as never);
    if (error) console.error("[interactionsLog] falha ao gravar log:", error);
  } catch (error) {
    console.error("[interactionsLog] falha ao gravar log:", error);
  }
}

export function logInteractionAlert(entry: InteractionLogEntry) {
  queue.push(entry);
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, 1000);
}
