-- Migration A2: 8 tabelas pivô many-to-many (junções) + 1 self-join refinamentos.
-- Todas com created_at, updated_at, instituicao_id FK + UNIQUE composto + colunas semânticas
-- (não são tabelas só de id,id).

BEGIN;

-- Base template para colunas comuns
-- (copiamos o padrão de colunas; não há herança para colunas em CREATE TABLE, então cada tabela declara explicitamente)

-- 2.1 Condição ↔ Exames complementares
CREATE TABLE IF NOT EXISTS curadoria.condicao_exames (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  condicao_id bigint NOT NULL REFERENCES curadoria.condicoes_clinicas(id) ON DELETE CASCADE,
  exame_id bigint NOT NULL REFERENCES curadoria.exames_complementares(id) ON DELETE CASCADE,
  categoria_pedido curadoria.curadoria_categoria_pedido NOT NULL DEFAULT 'essencial',
  justificativa text NOT NULL,
  impacto_conduta curadoria.curadoria_impacto_conduta,
  sequencia_solicitacao smallint NOT NULL DEFAULT 1,
  disponibilidade_local curadoria.curadoria_disponibilidade_local NOT NULL DEFAULT 'rotina',
  perfis_risco_requeridos text[] NOT NULL DEFAULT '{}',
  parametros_medicao text[] NOT NULL DEFAULT '{}',
  instituicao_id bigint NULL REFERENCES curadoria.instituicoes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_condicao_exames UNIQUE (condicao_id, exame_id, instituicao_id, categoria_pedido)
);

-- 2.2 Condição ↔ Medicamentos alternativos
CREATE TABLE IF NOT EXISTS curadoria.condicao_medicamentos_alternativos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  condicao_id bigint NOT NULL REFERENCES curadoria.condicoes_clinicas(id) ON DELETE CASCADE,
  medicamento_id uuid NOT NULL REFERENCES public.base_medicamentos_geral(id) ON DELETE CASCADE,
  ordem_escolha curadoria.curadoria_ordem_escolha NOT NULL,
  via_administracao_aceita text NOT NULL DEFAULT 'oral',
  faixa_etaria_permitida numrange NOT NULL DEFAULT numrange(0,120),
  restricoes_comorbidades text[] NOT NULL DEFAULT '{}',
  eh_off_label boolean NOT NULL DEFAULT false,
  off_label_justificativa text,
  justificativas_escolha jsonb NOT NULL DEFAULT '{}'::jsonb,
  ambiente_uso curadoria.curadoria_tipo_ambiente_uso[] NOT NULL DEFAULT ARRAY['ambulatorial','emergencia']::curadoria.curadoria_tipo_ambiente_uso[],
  eh_medicamento_alto_risco boolean NOT NULL DEFAULT false,
  monitorizacoes_requeridas bigint[] NOT NULL DEFAULT '{}',
  tipo_prescricao_sugerido bigint[] NOT NULL DEFAULT '{}',
  instituicao_id bigint NULL REFERENCES curadoria.instituicoes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_offlabel_tem_justificativa CHECK (
    (eh_off_label = false) OR (off_label_justificativa IS NOT NULL AND char_length(off_label_justificativa) > 30)
  ),
  CONSTRAINT uk_condicao_med_alt UNIQUE (condicao_id, medicamento_id, instituicao_id, ordem_escolha)
);

-- 2.3 Condição ↔ Classes medicamentosas
CREATE TABLE IF NOT EXISTS curadoria.condicao_classes_medicamentosas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  condicao_id bigint NOT NULL REFERENCES curadoria.condicoes_clinicas(id) ON DELETE CASCADE,
  classe_medicamentosa_id bigint NOT NULL REFERENCES curadoria.classes_medicamentosas(id) ON DELETE CASCADE,
  papel_classe curadoria.curadoria_papel_classe NOT NULL,
  observacoes text,
  instituicao_id bigint NULL REFERENCES curadoria.instituicoes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_condicao_classe UNIQUE (condicao_id, classe_medicamentosa_id, instituicao_id)
);

-- 2.4 Condição ↔ Exame físico direcionado
CREATE TABLE IF NOT EXISTS curadoria.condicao_exame_fisico (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  condicao_id bigint NOT NULL REFERENCES curadoria.condicoes_clinicas(id) ON DELETE CASCADE,
  sistemas_envolvidos curadoria.curadoria_sistema_exame_fisico[] NOT NULL DEFAULT ARRAY['cardiovascular']::curadoria.curadoria_sistema_exame_fisico[],
  manobras_obrigatorias text[] NOT NULL DEFAULT '{}',
  achados_sugestivos text[] NOT NULL DEFAULT '{}',
  red_flags_exame_fisico text[] NOT NULL DEFAULT '{}',
  ordem_inspecao smallint NOT NULL DEFAULT 1,
  observacoes text,
  instituicao_id bigint NULL REFERENCES curadoria.instituicoes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_condicao_exame_fisico UNIQUE (condicao_id, instituicao_id)
);

-- 2.5 Condição ↔ Modelos Documento
CREATE TABLE IF NOT EXISTS curadoria.condicao_modelos_documento (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  condicao_id bigint NOT NULL REFERENCES curadoria.condicoes_clinicas(id) ON DELETE CASCADE,
  modelo_documento_id bigint NOT NULL REFERENCES curadoria.modelos_documento(id) ON DELETE CASCADE,
  preenchimento_automatico boolean NOT NULL DEFAULT true,
  ordem_apresentacao smallint NOT NULL DEFAULT 1,
  instituicao_id bigint NULL REFERENCES curadoria.instituicoes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_condicao_modelo UNIQUE (condicao_id, modelo_documento_id, instituicao_id)
);

-- 2.6 Condição ↔ Protocolos clínicos
CREATE TABLE IF NOT EXISTS curadoria.condicao_protocolo_clinico (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  condicao_id bigint NOT NULL REFERENCES curadoria.condicoes_clinicas(id) ON DELETE CASCADE,
  protocolo_clinico_id bigint NOT NULL REFERENCES curadoria.protocolos_clinicos(id) ON DELETE CASCADE,
  gatilho_entrada text NOT NULL,
  instituicao_id bigint NULL REFERENCES curadoria.instituicoes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_condicao_protocolo UNIQUE (condicao_id, protocolo_clinico_id, instituicao_id)
);

-- 2.7 Condição ↔ Linhas de cuidado
CREATE TABLE IF NOT EXISTS curadoria.condicao_linha_cuidado (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  condicao_id bigint NOT NULL REFERENCES curadoria.condicoes_clinicas(id) ON DELETE CASCADE,
  linha_cuidado_id bigint NOT NULL REFERENCES curadoria.linhas_cuidado(id) ON DELETE CASCADE,
  conexao text[] NOT NULL DEFAULT ARRAY['seguranca']::text[],
  instituicao_id bigint NULL REFERENCES curadoria.instituicoes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_condicao_linha UNIQUE (condicao_id, linha_cuidado_id, instituicao_id),
  CONSTRAINT chk_conexao_validos CHECK (
    cardinality(conexao) > 0 AND
    conexao <@ ARRAY['seguranca','protecao','acompanhamento','acionamento_rede','documentacao','comunicacao_formal']::text[]
  )
);

-- 2.8 Condição ↔ Condição (Diagnóstico diferencial)
CREATE TABLE IF NOT EXISTS curadoria.condicao_ddx (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  origem_id bigint NOT NULL REFERENCES curadoria.condicoes_clinicas(id) ON DELETE CASCADE,
  ddx_id bigint NOT NULL REFERENCES curadoria.condicoes_clinicas(id) ON DELETE CASCADE,
  probabilidade curadoria.curadoria_probabilidade_ddx NOT NULL DEFAULT 'media',
  pontos_chave_distincao text[] NOT NULL DEFAULT '{}',
  ordem smallint NOT NULL DEFAULT 1,
  instituicao_id bigint NULL REFERENCES curadoria.instituicoes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_condicao_ddx UNIQUE (origem_id, ddx_id, instituicao_id),
  CONSTRAINT chk_ddx_not_self CHECK (origem_id <> ddx_id)
);

-- 2.9 Condição ↔ Condição (Refinamento)
CREATE TABLE IF NOT EXISTS curadoria.condicao_refinamentos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  de_condicao_id bigint NOT NULL REFERENCES curadoria.condicoes_clinicas(id) ON DELETE CASCADE,
  para_condicao_id bigint NOT NULL REFERENCES curadoria.condicoes_clinicas(id) ON DELETE CASCADE,
  gatilhos_refinar text[] NOT NULL DEFAULT '{}',
  criterios jsonb NOT NULL DEFAULT '{}'::jsonb,
  instituicao_id bigint NULL REFERENCES curadoria.instituicoes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_condicao_refinamentos UNIQUE (de_condicao_id, para_condicao_id, instituicao_id),
  CONSTRAINT chk_refinamento_not_self CHECK (de_condicao_id <> para_condicao_id)
);

-- Triggers updated_at
DO $$ DECLARE rec record;
BEGIN
  FOR rec IN SELECT tablename FROM pg_tables WHERE schemaname='curadoria' AND tablename IN (
    'condicao_exames','condicao_medicamentos_alternativos','condicao_classes_medicamentosas',
    'condicao_exame_fisico','condicao_modelos_documento','condicao_protocolo_clinico',
    'condicao_linha_cuidado','condicao_ddx','condicao_refinamentos'
  ) LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%I_updated_at ON curadoria.%I;
       CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON curadoria.%I
       FOR EACH ROW EXECUTE FUNCTION curadoria.atualiza_updated_at();',
      rec.tablename, rec.tablename, rec.tablename, rec.tablename
    );
  END LOOP;
END $$;

COMMIT;
