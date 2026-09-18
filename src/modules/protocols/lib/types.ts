export type ProtocolType = "queixa"|"sindrome"|"cid"|"diagnostico"|"emergencia"|"ambulatorial"|"hospitalar"|"pediatrico"|"obstetrico"|"outro";
export type ProtocolContext = "urgencia"|"enfermaria"|"ambulatorio"|"pronto_atendimento"|"telemedicina"|"hospitalar"|"pediatria"|"obstetricia"|"geral";
export type ProtocolReviewStatus = "rascunho"|"aguardando_revisao"|"revisado"|"precisa_corrigir"|"inativo";
export type ProtocolPriority = "imediata"|"alta"|"moderada"|"baixa";
export type ProtocolRecommendationLevel = "forte"|"moderada"|"condicional"|"baixa";

export interface SinalGravidade { titulo: string; descricao?: string }
export interface CondutaInicial { titulo: string; descricao?: string; prioridade?: ProtocolPriority; contexto?: string; obrigatoria?: boolean; fonte?: string }
export interface ExameSugerido { nome_exame: string; categoria?: "laboratorio"|"imagem"|"ecg"|"microbiologia"|"procedimento"|"outro"; indicacao?: string; prioridade?: ProtocolPriority; obrigatorio?: boolean; condicao_para_sugerir?: string; observacao?: string; fonte?: string }
export interface MedicamentoSugerido { principio_ativo: string; nome_sugestao?: string; indicacao_no_protocolo?: string; dose_sugerida?: string; unidade_dose?: string; via?: string; frequencia?: string; duracao?: string; observacao?: string; nivel_recomendacao?: ProtocolRecommendationLevel; exige_revisao?: boolean; fonte?: string; status_revisao?: ProtocolReviewStatus }
export interface CuidadoEnfermagem { descricao: string; frequencia?: string; condicao_uso?: string; prioridade?: ProtocolPriority; observacao?: string }
export interface CriterioChecklist { titulo: string; descricao?: string }

export interface Protocolo {
  id: string;
  nome_protocolo: string;
  tipo_protocolo: ProtocolType;
  area_clinica: string | null;
  contexto_atendimento: ProtocolContext;
  queixas_relacionadas: string[];
  sindromes_relacionadas: string[];
  cids_relacionados: string[];
  palavras_chave: string[];
  populacao_alvo: string | null;
  faixa_etaria_min: number | null;
  faixa_etaria_max: number | null;
  sinais_gravidade: SinalGravidade[];
  diagnosticos_diferenciais: string[];
  condutas_iniciais: CondutaInicial[];
  exames_sugeridos: ExameSugerido[];
  medicamentos_sugeridos: MedicamentoSugerido[];
  medidas_nao_farmacologicas: { descricao: string }[];
  cuidados_enfermagem: CuidadoEnfermagem[];
  criterios_encaminhamento: CriterioChecklist[];
  criterios_internacao: CriterioChecklist[];
  sinais_retorno_imediato: CriterioChecklist[];
  orientacoes_paciente: string | null;
  alertas_seguranca: string[];
  contraindicacoes_relevantes: string[];
  fonte_referencia: string | null;
  data_atualizacao: string;
  revisado_por: string | null;
  revisado_em: string | null;
  status_revisao: ProtocolReviewStatus;
  versao_protocolo: number;
  protocolo_origem: string | null;
  motivo_alteracao: string | null;
  ativo: boolean;
  criado_por: string | null;
  criado_em: string;
  atualizado_por: string | null;
  atualizado_em: string;
}
