/**
 * Schemas Zod para TODAS as tabelas do schema curadoria.
 * USO:
 *   - CLI validar-chunk.ts: valida estrutura + tipos offline
 *   - CLI sync-batch-upsert.ts: valida antes de enviar para Supabase
 *   - (futuro) backend server-side: re-valida chunk recebido via LLM
 *
 * Todos os schemas são estritos (z.object().strict()) para impedir
 * a LLM de inventar colunas novas sem autorização.
 */

import { z } from 'zod';

// ==========================================================================
// ENUMS (replicam exatamente os valores dos ENUMs curadoria_* criados no SQL)
// ==========================================================================
const TIPO_CONDICAO_CLINICA = z.enum(['sintoma','sindrome','patologia','queixa','hipotese']);
const TIPO_INSTITUICAO     = z.enum(['publica','privada','filantropica','universitaria','mista']);
const TIPO_EXAME           = z.enum(['laboratorial','imagem','teste_rapido','escala_clinica','score_clinico']);
const SUBTIPO_IMAGEM       = z.enum(['rx','tc','rm','us','angiotc','ecobeira_leito','us_poc','ressonancia','fluoroscopia','outros']);
const DISPONIBILIDADE_LOCAL= z.enum(['rotina','24h','horario_comercial','unidade_referencia']);
const CATEGORIA_PEDIDO     = z.enum(['essencial','opcional','dependente_recurso','ideal_alta_tecnologia']);
const IMPACTO_CONDUTA      = z.enum(['mudanca_imediata','definie_internacao','definie_alta','definie_transferencia','confirmatorio','descartatorio','monitoramento']);
const TIPO_DOCUMENTO       = z.enum([
  'prescricao_hospitalar','prescricao_ambulatorial','atestado_medico',
  'solicitacao_exames_lab','solicitacao_exames_img','texto_anamnese',
  'texto_exame_fisico','resumo_alta','carta_transferencia','encaminhamento',
  'apac_solicitacao','relatorio_medico','laudo_padronizado','evolucao_clinica',
  'conduta_observacao','conduta_emergencia','notificacao_obrigatoria',
  'evolucao_observacao','registro_sala_vermelha','registro_box_emergencia',
  'auditoria_interna','receita_rapida_template'
]);
const LINGUAGEM_DOCUMENTO  = z.enum(['paciente','enfermagem','medico_receptor','auditoria','rede_de_saude']);
const TIPO_CAMPO_DOCUMENTO= z.enum(['texto_curto','texto_longo','lista_bullets','data','numerico','checkbox_multiplo','condicional','selecao_unica']);
const TIPO_ETAPA_PROTOCOLO= z.enum([
  'triagem','avaliacao_inicial','estabilizacao','solicitacao_exames','tratamento',
  'criterios_alta','criterios_transferencia','criterios_internacao','pontos_checagem'
]);
const EIXO_LINHA_CUIDADO   = z.enum(['seguranca','protecao','acompanhamento','acionamento_rede','documentacao','comunicacao_formal']);
const ORDEM_ESCOLHA        = z.enum(['primeira','segunda','terceira','mesma_classe_substituta','nao_farmacologica','adjuvante','resgate']);
const PAPEL_CLASSE         = z.enum(['primeira_linha','segunda_linha','adjuvante','resgate','cronico_continuo','profilatico']);
const PROBABILIDADE_DDX    = z.enum(['alta','media','baixa']);
const TIPO_AMBIENTE_USO    = z.enum(['ambulatorial','hospitalar','observacao','sala_vermelha','emergencia','restrito','controlado']);
const SETOR_ASSISTENCIAL   = z.enum(['urgencia','emergencia','sala_vermelha','observacao','ambulatorio','internacao']);
const PERFIL_ASSISTENCIAL  = z.enum(['basico','intermediario','avancado_terciario']);
const SISTEMA_EXAME_FISICO = z.enum([
  'cardiovascular','respiratorio','abdomen','neurologico','osteomuscular',
  'pele','geniturinario','otorrinolaringologico','oftalmologico','psiquiatrico',
  'cabeca_e_pescoco','vascular_periferico','linfonodos',
  'toraxilo_pelve','endocrino','hematologico'
]);
const LLM_JOB_STATUS       = z.enum(['pendente','validando','aprovado_sem_erros','rejeitado_com_erros','aprovado_com_alertas']);
const QUEM_EXECUTA_ACAO    = z.enum([
  'medico','enfermagem','assistente_social','psicologia',
  'seguranca_institucional','rede_externa','fisioterapia','fonoaudiologia','nutricao','equipe_multiprofissional'
]);

// ==========================================================================
// COLUNAS COMUNS / REUTILIZÁVEIS
// ==========================================================================
const bigintId = z.union([z.number().int().nonnegative(), z.bigint().transform(v => Number(v))]).optional();
const fkBigint = z.number().int().positive();
const fkUuid   = z.string().uuid();
const textoObrigatorio = z.string().min(2).max(1200);
const textoOpcional    = z.string().min(0).max(4000).optional().nullable();
const arrayTexto       = z.array(z.string().max(240)).default([]);
const jsonGenerico      = z.record(z.unknown()).default({});
const dataDefaultNow    = z.string().datetime().optional();

// ==========================================================================
// 1. 15 TABELAS MESTRE (Migration A1, ordem)
// ==========================================================================
export const instituicoes = z.object({
  id: bigintId,
  codigo_instituicao: z.string().min(3).max(60),
  nome: z.string().min(2).max(240),
  cnpj: z.string().max(20).optional().nullable(),
  tipo_instituicao: TIPO_INSTITUICAO.optional().nullable(),
  endereco: jsonGenerico.optional(),
  contato:  jsonGenerico.optional(),
  ativa: z.boolean().default(true),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const condicoes_clinicas = z.object({
  id: bigintId,
  tipo: TIPO_CONDICAO_CLINICA,
  nome: z.string().min(2).max(240),
  sinonimos: jsonGenerico.optional(),
  apresentacoes: jsonGenerico.optional(),
  red_flags: arrayTexto,
  cid10: arrayTexto,
  etiologias_possiveis: jsonGenerico.optional(),
  faixa_etaria_prevalente: z.tuple([z.number(), z.number()]).optional().transform(a => a ? `[${a[0]},${a[1]})` : undefined),
  apresentacoes_tipicas_atipicas: jsonGenerico.optional(),
  instituicao_id: fkBigint.optional().nullable(),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const tipos_prescricao = z.object({
  id: bigintId,
  slug: z.string().min(2).max(60),
  nome: z.string().min(2).max(160),
  descricao: textoOpcional,
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const monitorizacoes = z.object({
  id: bigintId,
  slug: z.string().min(2).max(60),
  nome: z.string().min(2).max(160),
  unidade_medida: z.string().max(60).optional().nullable(),
  parametros_normais: jsonGenerico.optional(),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const classes_medicamentosas = z.object({
  id: bigintId,
  slug: z.string().min(2).max(60),
  nome: z.string().min(2).max(160),
  descricao: textoOpcional,
  filtros_padrao: jsonGenerico.optional(),
  instituicao_id: fkBigint.optional().nullable(),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const exames_complementares = z.object({
  id: bigintId,
  codigo_exame: z.string().min(3).max(60),
  nome: z.string().min(2).max(240),
  descricao_abreviada: z.string().max(400).optional().nullable(),
  tipo_exame: TIPO_EXAME,
  subtipo_imagem: SUBTIPO_IMAGEM.optional().nullable(),
  codigo_situacao_tiss: z.string().max(40).optional().nullable(),
  requisitos_preparo: arrayTexto,
  tempo_processamento_medio_minutos: z.number().int().nonnegative().optional().nullable(),
  faixa_resultado_referencia: jsonGenerico.optional(),
  disponibilidade_local_padrao: DISPONIBILIDADE_LOCAL.default('rotina'),
  sinonimos_busca: arrayTexto,
  instituicao_id: fkBigint.optional().nullable(),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const protocolos_clinicos = z.object({
  id: bigintId,
  slug: z.string().min(3).max(80),
  nome: z.string().min(2).max(240),
  descricao_curta: z.string().max(600).optional().nullable(),
  cid10_relacionados: arrayTexto,
  condicoes_gatilho: z.array(fkBigint).default([]),
  instituicao_id: fkBigint.optional().nullable(),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const protocolo_clinico_versao = z.object({
  id: bigintId,
  protocolo_id: fkBigint,
  versao: z.string().min(2).max(40),
  data_revisao: z.string().datetime().optional(),
  responsavel_revisao: z.string().max(180).optional().nullable(),
  historico_alteracoes: z.array(jsonGenerico).default([]),
  diretrizes_alinhadas: arrayTexto,
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const protocolo_etapa = z.object({
  id: bigintId,
  versao_id: fkBigint,
  numero_etapa: z.number().int().min(1).max(9),
  tipo_etapa: TIPO_ETAPA_PROTOCOLO,
  descricao_texto: textoOpcional,
  criterios_mensuraveis: jsonGenerico.optional(),
  gatilhos_gravidade: arrayTexto,
  decisoes_chave: arrayTexto,
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const linhas_cuidado = z.object({
  id: bigintId,
  slug: z.string().min(3).max(80),
  nome: z.string().min(2).max(240),
  descricao_curta: z.string().max(600).optional().nullable(),
  eixos_conectados: z.array(EIXO_LINHA_CUIDADO).default(['seguranca']),
  instituicao_id: fkBigint.optional().nullable(),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const linha_cuidado_acoes = z.object({
  id: bigintId,
  linha_id: fkBigint,
  ordem: z.number().int().min(1),
  titulo: z.string().min(2).max(240),
  passos: arrayTexto,
  quem_executa: z.array(QUEM_EXECUTA_ACAO).default(['medico']),
  requer_notificacao_formal: z.boolean().default(false),
  requer_documento_id: fkBigint.optional().nullable(),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const modelos_documento = z.object({
  id: bigintId,
  tipo_documento: TIPO_DOCUMENTO,
  nome_visual: z.string().min(2).max(240),
  cabecalho_obriga_crm: z.boolean().default(true),
  assinatura_visivel: z.boolean().default(true),
  requer_carimbo: z.boolean().default(true),
  linguagem_alvo: LINGUAGEM_DOCUMENTO.default('medico_receptor'),
  instituicao_id: fkBigint.optional().nullable(),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const modelo_documento_campos = z.object({
  id: bigintId,
  modelo_documento_id: fkBigint,
  chave_campo: z.string().min(2).max(80),
  rotulo_exibicao: z.string().min(2).max(240),
  conteudo_padrao: textoOpcional,
  tipo_campo: TIPO_CAMPO_DOCUMENTO,
  obrigatorio: z.boolean().default(false),
  ordem: z.number().int().min(1),
  sugestao_llm_instrucao: z.string().max(1200).optional().nullable(),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const instituicoes_config = z.object({
  id: bigintId,
  instituicao_id: fkBigint,
  unidade_nome: z.string().max(180).optional().nullable(),
  setor: SETOR_ASSISTENCIAL.optional().nullable(),
  perfil_assistencial: PERFIL_ASSISTENCIAL.default('basico'),
  parametros_configuraveis: jsonGenerico.refine(obj => {
    const chavesMinimas = ['limites_pa_min','limites_pa_max','doses_padroes_sobrepoe','exames_obrigatorios_por_condicao',
      'fluxos_internos_encaminhamentos','responsaveis_acionamento','disponibilidade_medicamentos','disponibilidade_exames'];
    return chavesMinimas.some(k => Object.hasOwn(obj, k));
  }, 'parametros_configuraveis precisa conter ao menos 1 das 8 chaves obrigatórias'),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const prescricao_rapida_templates = z.object({
  id: bigintId,
  titulo: z.string().min(2).max(240),
  owner_uuid: z.string().uuid().optional().nullable(),
  instituicao_id: fkBigint.optional().nullable(),
  tipo_ambito: z.enum(['ambulatorial','hospitalar']),
  conteudo_modelo_id: fkBigint.optional().nullable(),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const prescricao_template_item = z.object({
  id: bigintId,
  template_id: fkBigint,
  medicamento_id: fkUuid.optional().nullable(),
  dose_padrao: z.string().max(120).optional().nullable(),
  unidade: z.string().max(40).optional().nullable(),
  via: z.string().max(40).optional().nullable(),
  frequencia: z.string().max(80).optional().nullable(),
  duracao: z.string().max(80).optional().nullable(),
  restricoes_populacao: arrayTexto,
  observacoes: textoOpcional,
  ordem_item: z.number().int().min(1).default(1),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const dupla_checagem_politica = z.object({
  id: bigintId,
  medicamento_id: fkUuid,
  ativa: z.boolean().default(false),
  requer_segundo_profissional_tipo: arrayTexto,
  alertas_especificos: arrayTexto,
  instituicao_id: fkBigint.optional().nullable(),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const llm_job = z.object({
  id: bigintId,
  prompt_input_hash: z.string().min(8).max(128),
  prompt_nome: z.string().min(2).max(180),
  tabela_afetada: z.string().min(2).max(120),
  autor_llm: z.string().max(180).optional().nullable(),
  status: LLM_JOB_STATUS.default('pendente'),
  linhas_inseridas: z.number().int().nonnegative().default(0),
  linhas_atualizadas: z.number().int().nonnegative().default(0),
  linhas_rejeitadas: z.number().int().nonnegative().default(0),
  instituicao_id: fkBigint.optional().nullable(),
  data_execucao: z.string().datetime().optional(),
  duracao_ms: z.number().int().nonnegative().optional().nullable(),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const llm_job_detail = z.object({
  id: bigintId,
  llm_job_id: fkBigint,
  raw_request: jsonGenerico.optional(),
  raw_response: jsonGenerico.optional().nullable(),
  erros_validacao: z.array(jsonGenerico).default([]),
  duracao_ms: z.number().int().nonnegative().optional().nullable(),
  data_execucao: z.string().datetime().optional()
}).strict();

// ==========================================================================
// 2. 9 TABELAS JUNÇÃO (Migration A2)
// ==========================================================================
export const condicao_exames = z.object({
  id: bigintId,
  condicao_id: fkBigint,
  exame_id: fkBigint,
  categoria_pedido: CATEGORIA_PEDIDO.default('essencial'),
  justificativa: z.string().min(10).max(1600),
  impacto_conduta: IMPACTO_CONDUTA.optional().nullable(),
  sequencia_solicitacao: z.number().int().min(1).default(1),
  disponibilidade_local: DISPONIBILIDADE_LOCAL.default('rotina'),
  perfis_risco_requeridos: arrayTexto,
  parametros_medicao: arrayTexto,
  instituicao_id: fkBigint.optional().nullable(),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const condicao_medicamentos_alternativos = z.object({
  id: bigintId,
  condicao_id: fkBigint,
  medicamento_id: fkUuid,
  ordem_escolha: ORDEM_ESCOLHA,
  via_administracao_aceita: z.string().min(3).max(120).default('oral'),
  faixa_etaria_permitida: z.tuple([z.number(), z.number()]).optional().transform(a => a ? `[${a[0]},${a[1]})` : undefined),
  restricoes_comorbidades: arrayTexto,
  eh_off_label: z.boolean().default(false),
  off_label_justificativa: z.string().min(0).max(1600).optional().nullable(),
  justificativas_escolha: jsonGenerico.optional(),
  ambiente_uso: z.array(TIPO_AMBIENTE_USO).default(['ambulatorial','emergencia']),
  eh_medicamento_alto_risco: z.boolean().default(false),
  monitorizacoes_requeridas: z.array(fkBigint).default([]),
  tipo_prescricao_sugerido: z.array(fkBigint).default([]),
  instituicao_id: fkBigint.optional().nullable(),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict().superRefine((v, ctx) => {
  if (v.eh_off_label && (!v.off_label_justificativa || v.off_label_justificativa.length < 30)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom,
      message: 'off_label_justificativa precisa ter >=30 caracteres quando eh_off_label=true' });
  }
});

export const condicao_classes_medicamentosas = z.object({
  id: bigintId,
  condicao_id: fkBigint,
  classe_medicamentosa_id: fkBigint,
  papel_classe: PAPEL_CLASSE,
  observacoes: textoOpcional,
  instituicao_id: fkBigint.optional().nullable(),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const condicao_exame_fisico = z.object({
  id: bigintId,
  condicao_id: fkBigint,
  sistemas_envolvidos: z.array(SISTEMA_EXAME_FISICO).default(['cardiovascular']),
  manobras_obrigatorias: arrayTexto,
  achados_sugestivos: arrayTexto,
  red_flags_exame_fisico: arrayTexto,
  ordem_inspecao: z.number().int().min(1).default(1),
  observacoes: textoOpcional,
  instituicao_id: fkBigint.optional().nullable(),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const condicao_modelos_documento = z.object({
  id: bigintId,
  condicao_id: fkBigint,
  modelo_documento_id: fkBigint,
  preenchimento_automatico: z.boolean().default(true),
  ordem_apresentacao: z.number().int().min(1).default(1),
  instituicao_id: fkBigint.optional().nullable(),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

export const condicao_protocolo_clinico = z.object({
  id: bigintId,
  condicao_id: fkBigint,
  protocolo_clinico_id: fkBigint,
  gatilho_entrada: z.string().min(10).max(1600),
  instituicao_id: fkBigint.optional().nullable(),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict();

const CONEXAO_VALIDOS = new Set(['seguranca','protecao','acompanhamento','acionamento_rede','documentacao','comunicacao_formal']);
export const condicao_linha_cuidado = z.object({
  id: bigintId,
  condicao_id: fkBigint,
  linha_cuidado_id: fkBigint,
  conexao: z.array(z.string().min(2)).default(['seguranca']),
  instituicao_id: fkBigint.optional().nullable(),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict().superRefine((v, ctx) => {
  if (v.conexao.length === 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'conexao precisa ter pelo menos 1 item' });
  for (const c of v.conexao) {
    if (!CONEXAO_VALIDOS.has(c)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `conexao valor inválido: "${c}". Válidos: ${[...CONEXAO_VALIDOS].join(', ')}` });
    }
  }
});

export const condicao_ddx = z.object({
  id: bigintId,
  origem_id: fkBigint,
  ddx_id: fkBigint,
  probabilidade: PROBABILIDADE_DDX.default('media'),
  pontos_chave_distincao: arrayTexto,
  ordem: z.number().int().min(1).default(1),
  instituicao_id: fkBigint.optional().nullable(),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict().superRefine((v, ctx) => {
  if (v.origem_id === v.ddx_id) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'origem_id nao pode ser igual a ddx_id' });
});

export const condicao_refinamentos = z.object({
  id: bigintId,
  de_condicao_id: fkBigint,
  para_condicao_id: fkBigint,
  gatilhos_refinar: arrayTexto,
  criterios: jsonGenerico.optional(),
  instituicao_id: fkBigint.optional().nullable(),
  created_at: dataDefaultNow,
  updated_at: dataDefaultNow
}).strict().superRefine((v, ctx) => {
  if (v.de_condicao_id === v.para_condicao_id) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'de_condicao_id nao pode ser igual a para_condicao_id' });
});

// ==========================================================================
// 3. MAPA: nome_tabela -> schema Zod
// ==========================================================================
export const CURADORIA_SCHEMAS: Record<string, z.ZodObject<z.ZodRawShape>> = {
  // mestre
  instituicoes, condicoes_clinicas, tipos_prescricao, monitorizacoes,
  classes_medicamentosas, exames_complementares, protocolos_clinicos,
  protocolo_clinico_versao, protocolo_etapa, linhas_cuidado, linha_cuidado_acoes,
  modelos_documento, modelo_documento_campos, instituicoes_config,
  prescricao_rapida_templates, prescricao_template_item, dupla_checagem_politica,
  llm_job, llm_job_detail,
  // juncoes
  condicao_exames, condicao_medicamentos_alternativos, condicao_classes_medicamentosas,
  condicao_exame_fisico, condicao_modelos_documento, condicao_protocolo_clinico,
  condicao_linha_cuidado, condicao_ddx, condicao_refinamentos
};

/** Schema wrapper do arquivo chunk JSON (chunk_NN.json) */
export const chunkArquivoSchema = z.object({
  $schemaChunkCuradoria: z.literal(1),
  chunkNumero: z.number().int().min(1).max(8),
  promptNome: z.string().min(2).max(180),
  promptInputHash: z.string().max(128).default(''),
  instituicaoId: z.number().int().nonnegative().nullable().default(null),
  dadosGerais: z.object({
    dataCriacao: z.string().datetime(),
    autorResponsavel: z.string().max(240).nullable(),
    observacoes: z.string().max(4000).optional()
  }).strict(),
  tabelas: z.record(z.string().min(2), z.array(z.unknown())).refine(
    rec => Object.keys(rec).every(k => Object.hasOwn(CURADORIA_SCHEMAS, k)),
    { message: 'tabelas.* deve conter apenas tabelas válidas do schema curadoria (ver topological-sort.ts)' }
  )
}).strict();
