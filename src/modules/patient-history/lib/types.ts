// Etapa 18 — Tipos do módulo Histórico do Paciente.
import type { Database } from "@/integrations/supabase/types";

export type PrescriptionHistoryRow =
  Database["public"]["Tables"]["prescricoes_historico"]["Row"];
export type ContinuousMedicationRow =
  Database["public"]["Tables"]["medicacoes_uso_continuo"]["Row"];
export type HistoricoSettings =
  Database["public"]["Tables"]["historico_settings"]["Row"];

export type ItemReuseStatus =
  | "seguro_para_revisao"
  | "requer_atencao"
  | "exige_justificativa"
  | "bloqueado"
  | "dados_insuficientes"
  | "desatualizado";

export type ReuseItemKind =
  | "medicamento"
  | "exame"
  | "orientacao"
  | "cuidado_enfermagem"
  | "encaminhamento"
  | "relatorio";

export interface ReuseItem {
  id: string;
  kind: ReuseItemKind;
  titulo: string;
  principio_ativo?: string;
  dose?: string;
  via?: string;
  frequencia?: string;
  duracao?: string;
  observacoes?: string;
  // estado de revisão
  selecionado: boolean;
  editado: boolean;
  status: ItemReuseStatus;
  alertas_atuais: string[];
}

export interface PatientSnapshot {
  peso_kg?: number;
  idade_anos?: number;
  idade_meses?: number;
  creatinina?: number;
  clcr?: number;
  etfg?: number;
  gestante?: boolean;
  lactante?: boolean;
  cid?: string;
  diagnostico?: string;
  alergias?: string[];
  comorbidades?: string[];
  medicamentos_em_uso?: string[];
}

export interface ComparisonDiff {
  campo: string;
  valor_anterior: string | null;
  valor_atual: string | null;
  mensagem: string;
  severidade: "info" | "atencao" | "alta";
}
