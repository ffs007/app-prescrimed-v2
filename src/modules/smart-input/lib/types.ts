// Etapa 19 — Tipos do módulo Entrada Inteligente.
import type { Database } from "@/integrations/supabase/types";

export type EntradaTipo = Database["public"]["Enums"]["entrada_tipo"];
export type EntradaOrigem = Database["public"]["Enums"]["entrada_origem"];
export type EntradaItemTipo = Database["public"]["Enums"]["entrada_item_tipo"];
export type EntradaStatusFinal =
  Database["public"]["Enums"]["entrada_status_final"];
export type SmartInputSettings =
  Database["public"]["Tables"]["entrada_inteligente_settings"]["Row"];

export type ConfidenceBand = "alta" | "moderada" | "baixa" | "muito_baixa";

export interface MissingField {
  campo: string;
  mensagem: string;
}

export interface ExtractedItemBase {
  id: string;
  tipo: EntradaItemTipo;
  texto_original: string;
  confianca: number; // 0-100
  campos_faltantes: MissingField[];
  campos_ambiguos: string[];
  alertas: string[];
  selecionado: boolean;
}

export interface ExtractedMedication extends ExtractedItemBase {
  tipo: "medicamento";
  principio_ativo: string | null;
  nome_comercial?: string | null;
  dose: string | null;
  unidade: string | null;
  via: string | null;
  frequencia: string | null;
  duracao: string | null;
  diluente?: string | null;
  volume_diluicao?: string | null;
  tempo_infusao?: string | null;
  velocidade?: string | null;
  condicao_uso?: string | null;
  observacoes?: string | null;
  candidatos_medicamento?: Array<{ id: string; rotulo: string }>;
}

export interface ExtractedExam extends ExtractedItemBase {
  tipo: "exame";
  nome: string;
  categoria?: string | null;
  prioridade?: string | null;
  justificativa?: string | null;
}

export interface ExtractedOrientation extends ExtractedItemBase {
  tipo: "orientacao";
  texto: string;
  sinais_alerta?: string | null;
  retorno?: string | null;
}

export interface ExtractedDocument extends ExtractedItemBase {
  tipo: "documento";
  subtipo: "atestado" | "encaminhamento" | "relatorio" | "solicitacao" | "declaracao";
  conteudo: string;
  duracao_dias?: number | null;
}

export interface ExtractedCare extends ExtractedItemBase {
  tipo: "cuidado_enfermagem";
  cuidado: string;
  frequencia?: string | null;
  observacao?: string | null;
  condicao?: string | null;
}

export interface ExtractedDiagnosis extends ExtractedItemBase {
  tipo: "diagnostico";
  hipotese?: string | null;
  cid?: string | null;
  queixa?: string | null;
  sindrome?: string | null;
}

export interface ExtractedUnknown extends ExtractedItemBase {
  tipo: "nao_reconhecido";
}

export type ExtractedItem =
  | ExtractedMedication
  | ExtractedExam
  | ExtractedOrientation
  | ExtractedDocument
  | ExtractedCare
  | ExtractedDiagnosis
  | ExtractedUnknown;

export interface SmartInputResult {
  tipo_entrada: EntradaTipo;
  texto_original: string;
  texto_transcrito_ou_extraido?: string | null;
  confianca_geral: number;
  itens: ExtractedItem[];
  alertas_ia: string[];
  origem: EntradaOrigem;
}
