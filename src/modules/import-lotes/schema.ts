export type StgTable =
  | "stg_patologias"
  | "stg_exames"
  | "stg_patologia_exames"
  | "stg_rastreamentos";

export interface ColumnDef {
  name: string;
  required?: boolean;
  domain?: string[];
}

export interface TableDef {
  table: StgTable;
  label: string;
  columns: ColumnDef[];
}

const SIM_NAO = ["sim", "nao", "não", "true", "false", "1", "0"];

export const TABLE_DEFS: Record<StgTable, TableDef> = {
  stg_patologias: {
    table: "stg_patologias",
    label: "Patologias",
    columns: [
      { name: "nome_patologia", required: true },
      { name: "sinonimos" },
      { name: "cid10" },
      { name: "cid11" },
      { name: "categoria_clinica" },
      { name: "is_emergencia", domain: SIM_NAO },
      { name: "patologia_pai" },
      { name: "subtipo" },
      { name: "contexto_predominante" },
      { name: "fonte_id" },
      { name: "trecho_citado" },
    ],
  },
  stg_exames: {
    table: "stg_exames",
    label: "Exames",
    columns: [
      { name: "nome_exame", required: true },
      { name: "sigla" },
      { name: "sinonimos" },
      { name: "tipo_exame" },
      { name: "categoria" },
      { name: "loinc" },
      { name: "tuss" },
      { name: "sigtap" },
      { name: "amostra_metodo" },
      { name: "preparo_paciente" },
      { name: "jejum_horas" },
      { name: "tempo_resultado_horas" },
      { name: "disponivel_sus", domain: SIM_NAO },
      { name: "observacoes" },
      { name: "fonte_id" },
      { name: "trecho_citado" },
    ],
  },
  stg_patologia_exames: {
    table: "stg_patologia_exames",
    label: "Exames por patologia",
    columns: [
      { name: "nome_patologia", required: true },
      { name: "subtipo" },
      { name: "nome_exame", required: true },
      { name: "finalidade" },
      {
        name: "obrigatoriedade",
        domain: ["obrigatorio", "obrigatório", "recomendado", "opcional", "condicional"],
      },
      { name: "contextos" },
      { name: "momento_solicitation" },
      { name: "idade_min_anos" },
      { name: "idade_max_anos" },
      { name: "sexo_alvo", domain: ["ambos", "masculino", "feminino", "m", "f"] },
      { name: "aplica_gestante", domain: SIM_NAO },
      { name: "justificativa_padrao" },
      { name: "interpretacao_esperada" },
      { name: "criterio_positividade" },
      { name: "conduta_se_alterado" },
      { name: "nivel_evidencia" },
      { name: "forca_recomendacao" },
      { name: "repetir_em_horas" },
      { name: "nao_solicitar_se" },
      { name: "fonte_id" },
      { name: "trecho_citado" },
      { name: "conflito" },
    ],
  },
  stg_rastreamentos: {
    table: "stg_rastreamentos",
    label: "Rastreamentos",
    columns: [
      { name: "nome_rastreamento", required: true },
      { name: "patologia_alvo" },
      { name: "exame_metodo" },
      { name: "populacao_alvo" },
      { name: "sexo_alvo", domain: ["ambos", "masculino", "feminino", "m", "f"] },
      { name: "idade_inicio" },
      { name: "idade_fim" },
      { name: "intervalo_meses" },
      { name: "condicao_de_risco" },
      { name: "forca_recomendacao" },
      { name: "nivel_evidencia" },
      { name: "orgao_emissor" },
      { name: "incorporado_sus", domain: SIM_NAO },
      { name: "divergencia_internacional" },
      { name: "acao_se_positivo" },
      { name: "fonte_id" },
      { name: "trecho_citado" },
      { name: "conflito" },
    ],
  },
};

export const STG_TABLES = Object.values(TABLE_DEFS);

export const NEUTRO = "NAO_NA_FONTE";
