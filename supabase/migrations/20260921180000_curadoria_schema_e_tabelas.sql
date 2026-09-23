-- Migration A1: Schema curadoria + extensions + ENUMs + 15 tabelas mestre (catálogos estáticos)
-- Ordem de criação: instituicoes (primeiro, porque todas as outras tem FK para instituicao_id)
-- depois tipos_prescricao / monitorizacoes / classes_medicamentosas (estaticas puros)
-- depois catalogos com FKs apontam para as estaticas

BEGIN;

CREATE SCHEMA IF NOT EXISTS curadoria;

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION curadoria.atualiza_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION curadoria.nome_negocio_normalizado(p_nome text) RETURNS text AS $$
SELECT lower(unaccent(coalesce(p_nome,'')));
$$ LANGUAGE sql IMMUTABLE;

-- =========================================================================
-- 9 TIPOS ENUM (todos prefixados curadoria.*_ para não conflitar com public.* )
-- Criamos com DO+EXCEPTION para idempotente
-- =========================================================================
DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_tipo_condicao_clinica AS ENUM ('sintoma','sindrome','patologia','queixa','hipotese');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_tipo_instituicao AS ENUM ('publica','privada','filantropica','universitaria','mista');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_tipo_exame AS ENUM ('laboratorial','imagem','teste_rapido','escala_clinica','score_clinico');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_subtipo_imagem AS ENUM ('rx','tc','rm','us','angiotc','ecobeira_leito','us_poc','ressonancia','fluoroscopia','outros');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_disponibilidade_local AS ENUM ('rotina','24h','horario_comercial','unidade_referencia');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_categoria_pedido AS ENUM ('essencial','opcional','dependente_recurso','ideal_alta_tecnologia');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_impacto_conduta AS ENUM ('mudanca_imediata','definie_internacao','definie_alta','definie_transferencia','confirmatorio','descartatorio','monitoramento');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_tipo_documento_clinico AS ENUM (
    'prescricao_hospitalar','prescricao_ambulatorial','atestado_medico',
    'solicitacao_exames_lab','solicitacao_exames_img','texto_anamnese',
    'texto_exame_fisico','resumo_alta','carta_transferencia','encaminhamento',
    'apac_solicitacao','relatorio_medico','laudo_padronizado','evolucao_clinica',
    'conduta_observacao','conduta_emergencia','notificacao_obrigatoria',
    'evolucao_observacao','registro_sala_vermelha','registro_box_emergencia',
    'auditoria_interna','receita_rapida_template'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_linguagem_documento AS ENUM ('paciente','enfermagem','medico_receptor','auditoria','rede_de_saude');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_tipo_campo_documento AS ENUM ('texto_curto','texto_longo','lista_bullets','data','numerico','checkbox_multiplo','condicional','selecao_unica');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_tipo_etapa_protocolo AS ENUM (
    'triagem','avaliacao_inicial','estabilizacao','solicitacao_exames','tratamento',
    'criterios_alta','criterios_transferencia','criterios_internacao','pontos_checagem'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_eixo_linha_cuidado AS ENUM (
    'seguranca','protecao','acompanhamento','acionamento_rede','documentacao','comunicacao_formal'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_ordem_escolha AS ENUM (
    'primeira','segunda','terceira','mesma_classe_substituta','nao_farmacologica','adjuvante','resgate'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_papel_classe AS ENUM (
    'primeira_linha','segunda_linha','adjuvante','resgate','cronico_continuo','profilatico'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_probabilidade_ddx AS ENUM ('alta','media','baixa');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_tipo_ambiente_uso AS ENUM (
    'ambulatorial','hospitalar','observacao','sala_vermelha','emergencia','restrito','controlado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_setor_assistencial AS ENUM (
    'urgencia','emergencia','sala_vermelha','observacao','ambulatorio','internacao'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_perfil_assistencial AS ENUM ('basico','intermediario','avancado_terciario');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_sistema_exame_fisico AS ENUM (
    'cardiovascular','respiratorio','abdomen','neurologico','osteomuscular',
    'pele','geniturinario','otorrinolaringologico','oftalmologico','psiquiatrico',
    'cabeca_e_pescoco','vascular_periferico','linfonodos',
    'toraxilo_pelve','endocrino','hematologico'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_llm_job_status AS ENUM (
    'pendente','validando','aprovado_sem_erros','rejeitado_com_erros','aprovado_com_alertas'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_quem_executa_acao AS ENUM (
    'medico','enfermagem','assistente_social','psicologia',
    'seguranca_institucional','rede_externa','fisioterapia','fonoaudiologia','nutricao','equipe_multiprofissional'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========================================================================
-- 1) 15 TABELAS MESTRE
-- ========================================================================

-- 1.1 Instituições (multitenant leve; id=NACIONAL"
CREATE TABLE IF NOT EXISTS curadoria.instituicoes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo_instituicao text NOT NULL,
  nome text NOT NULL,
  cnpj text,
  tipo_instituicao curadoria.curadoria_tipo_instituicao,
  endereco jsonb,
  contato jsonb,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_instituicoes_codigo UNIQUE (codigo_instituicao)
);

-- 1.2 Condições clínicas unificadas
CREATE TABLE IF NOT EXISTS curadoria.condicoes_clinicas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo curadoria.curadoria_tipo_condicao_clinica NOT NULL,
  nome text NOT NULL,
  nome_normalizado text GENERATED ALWAYS AS (curadoria.nome_negocio_normalizado(nome)) STORED,
  sinonimos jsonb NOT NULL DEFAULT '{}'::jsonb,
  apresentacoes jsonb NOT NULL DEFAULT '{}'::jsonb,
  red_flags text[] NOT NULL DEFAULT '{}',
  cid10 text[] NOT NULL DEFAULT '{}',
  etiologias_possiveis jsonb NOT NULL DEFAULT '{}'::jsonb,
  faixa_etaria_prevalente numrange NOT NULL DEFAULT numrange(0,120),
  apresentacoes_tipicas_atipicas jsonb NOT NULL DEFAULT '{}'::jsonb,
  instituicao_id bigint NULL REFERENCES curadoria.instituicoes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_condicoes_clinicas_nome_negocio UNIQUE (tipo, nome_normalizado, instituicao_id)
);

-- 1.3 Tipos de prescrição (fixos estáticos (7-8 slugs fixos
CREATE TABLE IF NOT EXISTS curadoria.tipos_prescricao (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  nome text NOT NULL,
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.4 Monitorizações (10-12 slugs fixos
CREATE TABLE IF NOT EXISTS curadoria.monitorizacoes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  nome text NOT NULL,
  unidade_medida text,
  parametros_normais jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.5 Classes medicamentosas (20 classes)
CREATE TABLE IF NOT EXISTS curadoria.classes_medicamentosas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug text NOT NULL,
  nome text NOT NULL,
  descricao text,
  filtros_padrao jsonb NOT NULL DEFAULT '{}'::jsonb,
  instituicao_id bigint NULL REFERENCES curadoria.instituicoes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_classes_med_slug_instituicao UNIQUE (slug, instituicao_id)
);

-- 1.6 Exames complementares (catalogo mestre 100-150 linhas)
CREATE TABLE IF NOT EXISTS curadoria.exames_complementares (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo_exame text NOT NULL,
  nome text NOT NULL,
  descricao_abreviada text,
  tipo_exame curadoria.curadoria_tipo_exame NOT NULL,
  subtipo_imagem curadoria.curadoria_subtipo_imagem,
  codigo_situacao_tiss text,
  requisitos_preparo text[] NOT NULL DEFAULT '{}',
  tempo_processamento_medio_minutos integer,
  faixa_resultado_referencia jsonb,
  disponibilidade_local_padrao curadoria.curadoria_disponibilidade_local NOT NULL DEFAULT 'rotina',
  sinonimos_busca text[] NOT NULL DEFAULT '{}',
  instituicao_id bigint NULL REFERENCES curadoria.instituicoes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_exames_codigo_instituicao UNIQUE (codigo_exame, instituicao_id)
);

-- 1.7 Protocolos clínicos (24 protocolos)
CREATE TABLE IF NOT EXISTS curadoria.protocolos_clinicos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug text NOT NULL,
  nome text NOT NULL,
  descricao_curta text,
  cid10_relacionados text[] NOT NULL DEFAULT '{}',
  condicoes_gatilho bigint[] NOT NULL DEFAULT '{}',
  instituicao_id bigint NULL REFERENCES curadoria.instituicoes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_protocolos_slug_inst UNIQUE (slug, instituicao_id)
);

-- 1.8 Versão de protocolo (versionamento)
CREATE TABLE IF NOT EXISTS curadoria.protocolo_clinico_versao (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  protocolo_id bigint NOT NULL REFERENCES curadoria.protocolos_clinicos(id) ON DELETE CASCADE,
  versao text NOT NULL,
  data_revisao timestamptz NOT NULL DEFAULT now(),
  responsavel_revisao text,
  historico_alteracoes jsonb[] NOT NULL DEFAULT ARRAY[]::jsonb[],
  diretrizes_alinhadas text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_protocolo_versao UNIQUE (protocolo_id, versao)
);

-- 1.9 9 etapas por versão de protocolo
CREATE TABLE IF NOT EXISTS curadoria.protocolo_etapa (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  versao_id bigint NOT NULL REFERENCES curadoria.protocolo_clinico_versao(id) ON DELETE CASCADE,
  numero_etapa smallint NOT NULL CHECK (numero_etapa BETWEEN 1 AND 9),
  tipo_etapa curadoria.curadoria_tipo_etapa_protocolo NOT NULL,
  descricao_texto text,
  criterios_mensuraveis jsonb NOT NULL DEFAULT '{}'::jsonb,
  gatilhos_gravidade text[] NOT NULL DEFAULT '{}',
  decisoes_chave text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_protocolo_etapa UNIQUE (versao_id, numero_etapa)
);

-- 1.10 Linhas de cuidado (10 perfis)
CREATE TABLE IF NOT EXISTS curadoria.linhas_cuidado (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug text NOT NULL,
  nome text NOT NULL,
  descricao_curta text,
  eixos_conectados curadoria.curadoria_eixo_linha_cuidado[] NOT NULL DEFAULT ARRAY['seguranca']::curadoria.curadoria_eixo_linha_cuidado[],
  instituicao_id bigint NULL REFERENCES curadoria.instituicoes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_linhas_cuidado_slug_inst UNIQUE (slug, instituicao_id)
);

-- 1.11 Ações de linha de cuidado
CREATE TABLE IF NOT EXISTS curadoria.linha_cuidado_acoes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  linha_id bigint NOT NULL REFERENCES curadoria.linhas_cuidado(id) ON DELETE CASCADE,
  ordem smallint NOT NULL,
  titulo text NOT NULL,
  passos text[] NOT NULL DEFAULT '{}',
  quem_executa curadoria.curadoria_quem_executa_acao[] NOT NULL DEFAULT ARRAY['medico']::curadoria.curadoria_quem_executa_acao[],
  requer_notificacao_formal boolean NOT NULL DEFAULT false,
  requer_documento_id bigint NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_linha_acoes_ordem UNIQUE (linha_id, ordem)
);

-- 1.12 Modelos de documento (22 tipos)
CREATE TABLE IF NOT EXISTS curadoria.modelos_documento (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo_documento curadoria.curadoria_tipo_documento_clinico NOT NULL,
  nome_visual text NOT NULL,
  cabecalho_obriga_crm boolean NOT NULL DEFAULT true,
  assinatura_visivel boolean NOT NULL DEFAULT true,
  requer_carimbo boolean NOT NULL DEFAULT true,
  linguagem_alvo curadoria.curadoria_linguagem_documento NOT NULL DEFAULT 'medico_receptor',
  instituicao_id bigint NULL REFERENCES curadoria.instituicoes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_modelo UNIQUE (tipo_documento, instituicao_id)
);

-- 1.13 Campos dos modelos de documento
CREATE TABLE IF NOT EXISTS curadoria.modelo_documento_campos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  modelo_documento_id bigint NOT NULL REFERENCES curadoria.modelos_documento(id) ON DELETE CASCADE,
  chave_campo text NOT NULL,
  rotulo_exibicao text NOT NULL,
  conteudo_padrao text,
  tipo_campo curadoria.curadoria_tipo_campo_documento NOT NULL,
  obrigatorio boolean NOT NULL DEFAULT false,
  ordem smallint NOT NULL,
  sugestao_llm_instrucao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_modelo_campos_chave UNIQUE (modelo_documento_id, chave_campo)
);

-- 1.14 Parâmetros por instituição/unidade/setor/perfil assistencial
CREATE TABLE IF NOT EXISTS curadoria.instituicoes_config (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  instituicao_id bigint NOT NULL REFERENCES curadoria.instituicoes(id) ON DELETE CASCADE,
  unidade_nome text,
  setor curadoria.curadoria_setor_assistencial,
  perfil_assistencial curadoria.curadoria_perfil_assistencial NOT NULL DEFAULT 'basico',
  parametros_configuraveis jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_config_tem_pelo_menos_um_parametro CHECK (
    parametros_configuraveis ?| ARRAY[
      'limites_pa_min','limites_pa_max','doses_padroes_sobrepoe','exames_obrigatorios_por_condicao',
      'fluxos_internos_encaminhamentos','responsaveis_acionamento','disponibilidade_medicamentos','disponibilidade_exames'
    ]
  ),
  CONSTRAINT uk_instituicoes_config UNIQUE (instituicao_id, unidade_nome, setor, perfil_assistencial)
);

-- 1.15 Templates prescrição rápida (pessoais/institucionais)
CREATE TABLE IF NOT EXISTS curadoria.prescricao_rapida_templates (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  titulo text NOT NULL,
  owner_uuid uuid NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instituicao_id bigint NULL REFERENCES curadoria.instituicoes(id) ON DELETE SET NULL,
  tipo_ambito text NOT NULL CHECK (tipo_ambito IN ('ambulatorial','hospitalar')),
  conteudo_modelo_id bigint NULL REFERENCES curadoria.modelos_documento(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_prescricao UNIQUE (owner_uuid, titulo, instituicao_id)
);

CREATE TABLE IF NOT EXISTS curadoria.prescricao_template_item (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  template_id bigint NOT NULL REFERENCES curadoria.prescricao_rapida_templates(id) ON DELETE CASCADE,
  medicamento_id uuid NULL REFERENCES public.base_medicamentos_geral(id) ON DELETE SET NULL,
  dose_padrao text,
  unidade text,
  via text,
  frequencia text,
  duracao text,
  restricoes_populacao text[] NOT NULL DEFAULT '{}',
  observacoes text,
  ordem_item smallint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_template_item_ordem UNIQUE (template_id, ordem_item)
);

-- 1.16 Política dupla checagem medicamentos
CREATE TABLE IF NOT EXISTS curadoria.dupla_checagem_politica (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  medicamento_id uuid NOT NULL REFERENCES public.base_medicamentos_geral(id) ON DELETE CASCADE,
  ativa boolean NOT NULL DEFAULT false,
  requer_segundo_profissional_tipo text[] NOT NULL DEFAULT ARRAY['farmaceutico']::text[],
  alertas_especificos text[] NOT NULL DEFAULT '{}',
  instituicao_id bigint NULL REFERENCES curadoria.instituicoes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_dupla_checagem UNIQUE (medicamento_id, instituicao_id)
);

-- 1.17 / 1.18 LLM job (auditoria
CREATE TABLE IF NOT EXISTS curadoria.llm_job (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  prompt_input_hash text NOT NULL,
  prompt_nome text NOT NULL,
  tabela_afetada text NOT NULL,
  autor_llm text,
  status curadoria.curadoria_llm_job_status NOT NULL DEFAULT 'pendente',
  linhas_inseridas integer NOT NULL DEFAULT 0,
  linhas_atualizadas integer NOT NULL DEFAULT 0,
  linhas_rejeitadas integer NOT NULL DEFAULT 0,
  instituicao_id bigint NULL REFERENCES curadoria.instituicoes(id) ON DELETE SET NULL,
  data_execucao timestamptz NOT NULL DEFAULT now(),
  duracao_ms bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_llm_job UNIQUE (prompt_input_hash, tabela_afetada, instituicao_id)
);

CREATE TABLE IF NOT EXISTS curadoria.llm_job_detail (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  llm_job_id bigint NOT NULL REFERENCES curadoria.llm_job(id) ON DELETE CASCADE,
  raw_request jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_response jsonb,
  erros_validacao jsonb[] NOT NULL DEFAULT ARRAY[]::jsonb[],
  duracao_ms bigint,
  data_execucao timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- Triggers updated_at em TODAS tabelas com coluna updated_at
-- ================================================================
DO $$ DECLARE rec record;
BEGIN
  FOR rec IN
    SELECT tablename FROM pg_tables WHERE schemaname='curadoria' AND tablename != 'llm_job_detail'
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%I_updated_at ON curadoria.%I;
       CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON curadoria.%I
       FOR EACH ROW EXECUTE FUNCTION curadoria.atualiza_updated_at();',
      rec.tablename, rec.tablename, rec.tablename, rec.tablename
    );
  END LOOP;
END $$;

COMMIT;
