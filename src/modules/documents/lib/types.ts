// Etapa 20 — Tipos do módulo de Documentos Clínicos.
import type { Database } from "@/integrations/supabase/types";

export type DocumentoTipo = Database["public"]["Enums"]["documento_tipo"];
export type DocumentoStatus = Database["public"]["Enums"]["documento_status"];
export type DocumentoOrigem = Database["public"]["Enums"]["documento_origem"];
export type DocumentoAcaoLog = Database["public"]["Enums"]["documento_acao_log"];
export type TipoReceitaLegal = Database["public"]["Enums"]["tipo_receita_legal"];
export type AnexoIVModo = Database["public"]["Enums"]["anexo_iv_modo"];
export type CidAtestadoModo = Database["public"]["Enums"]["cid_atestado_modo"];

export type DocumentosSettings =
  Database["public"]["Tables"]["documentos_settings"]["Row"];
export type DocumentoGerado =
  Database["public"]["Tables"]["documentos_gerados"]["Row"];
export type AssinaturaPerfil =
  Database["public"]["Tables"]["assinatura_perfis"]["Row"];

// Itens do atendimento que serão classificados em documentos.
export interface ItemMedicamento {
  kind: "medicamento";
  id: string;
  principio_ativo: string;
  nome_comercial?: string | null;
  apresentacao?: string | null;
  dose?: string | null;
  unidade?: string | null;
  via?: string | null;
  frequencia?: string | null;
  duracao?: string | null;
  quantidade?: string | null;
  orientacoes?: string | null;
  // Regra legal (da base iv_medications)
  tipo_receita?: TipoReceitaLegal | null;
  controlado?: boolean;
  exige_receita_especial?: boolean;
  // Antimicrobiano: o motor decide pela classe / flag explícita
  antimicrobiano?: boolean;
  // Hospitalar/IV
  hospitalar?: boolean;
  via_iv?: boolean;
  diluicao_iv?: {
    diluente?: string | null;
    volume?: string | null;
    tempo_infusao?: string | null;
    velocidade?: string | null;
    concentracao_maxima?: string | null;
    incompatibilidades?: string[];
    estabilidade?: string | null;
    fotoprotecao?: boolean;
    filtro?: boolean;
    ph?: string | null;
    fonte?: string | null;
  } | null;
}

export interface ItemExame {
  kind: "exame";
  id: string;
  nome: string;
  categoria?: string | null;
  prioridade?: string | null;
  justificativa?: string | null;
  observacao?: string | null;
}

export interface ItemOrientacao {
  kind: "orientacao";
  id: string;
  texto: string;
  bloco?: "uso_medicamentos" | "cuidados_casa" | "sinais_alerta" | "quando_procurar" | "retorno" | "observacoes";
}

export interface ItemAtestado {
  kind: "atestado";
  id: string;
  dias: number;
  data_inicio: string; // ISO date
  data_retorno?: string | null;
  cid?: string | null;
  texto: string;
}

export interface ItemDeclaracao {
  kind: "declaracao";
  id: string;
  texto: string;
  horario_inicio?: string | null;
  horario_fim?: string | null;
}

export interface ItemEncaminhamento {
  kind: "encaminhamento";
  id: string;
  destino: string;
  motivo: string;
  resumo_clinico?: string | null;
  cid?: string | null;
  exames_relevantes?: string | null;
  prioridade?: string | null;
  orientacoes?: string | null;
}

export interface ItemRelatorio {
  kind: "relatorio";
  id: string;
  resumo: string;
  antecedentes?: string | null;
  exames?: string | null;
  diagnostico?: string | null;
  conduta?: string | null;
  evolucao?: string | null;
  recomendacao?: string | null;
}

export interface ItemCuidadoEnfermagem {
  kind: "cuidado_enfermagem";
  id: string;
  cuidado: string;
  frequencia?: string | null;
  observacao?: string | null;
}

export type AtendimentoItem =
  | ItemMedicamento
  | ItemExame
  | ItemOrientacao
  | ItemAtestado
  | ItemDeclaracao
  | ItemEncaminhamento
  | ItemRelatorio
  | ItemCuidadoEnfermagem;

export interface PacienteInfo {
  id?: string | null;
  nome: string;
  data_nascimento?: string | null;
  idade?: string | number | null;
  documento?: string | null;
  endereco?: string | null;
  numero_atendimento?: string | null;
}

export interface ContextoAtendimento {
  hospitalar?: boolean;
  cidade?: string;
  data?: string; // ISO
}

export interface DocumentBundle {
  tipo: DocumentoTipo;
  titulo: string;
  itens: AtendimentoItem[];
  alertas?: string[];
  pendencias?: string[];
  incluir: boolean; // marcado pelo usuário na tela
  observacoesExtra?: string;
  /** Para atestado: indica se CID será incluído. */
  incluirCid?: boolean;
}

export interface RenderedDocument {
  tipo: DocumentoTipo;
  titulo: string;
  html: string;
  conteudo_resumido: string;
  conteudo_json: Record<string, unknown>;
}
