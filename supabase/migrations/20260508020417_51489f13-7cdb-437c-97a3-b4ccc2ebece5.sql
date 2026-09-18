
-- Enums
DO $$ BEGIN
  CREATE TYPE public.iv_match_type AS ENUM ('exata','parcial','fuzzy','manual','nenhuma');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.iv_match_action AS ENUM ('associado_automaticamente','confirmado_pelo_usuario','escolhido_manual','ignorado','sem_correspondencia');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.iv_suggested_term_status AS ENUM ('pendente','aprovado','rejeitado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Novos campos em iv_medications
ALTER TABLE public.iv_medications
  ADD COLUMN IF NOT EXISTS nomes_alternativos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS nomes_comerciais text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sinonimos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS termos_busca text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS principio_ativo_normalizado text,
  ADD COLUMN IF NOT EXISTS grupo_medicamento text,
  ADD COLUMN IF NOT EXISTS codigo_interno_medicamento text,
  ADD COLUMN IF NOT EXISTS forma_farmaceutica text,
  ADD COLUMN IF NOT EXISTS concentracao_apresentacao text,
  ADD COLUMN IF NOT EXISTS equivalencias_nome jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ativo_para_correspondencia boolean NOT NULL DEFAULT true;

-- Função de normalização (lower + sem acentos + sem pontuação + espaços únicos)
CREATE OR REPLACE FUNCTION public.iv_normalize_text(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT NULLIF(
    btrim(
      regexp_replace(
        regexp_replace(
          lower(translate(coalesce(input,''),
            'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇñÑ',
            'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUCnN')),
          '[^a-z0-9 ]+', ' ', 'g'
        ),
        '\s+', ' ', 'g'
      )
    ), ''
  );
$$;

-- Trigger para preencher principio_ativo_normalizado
CREATE OR REPLACE FUNCTION public.iv_set_normalized()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.principio_ativo_normalizado := public.iv_normalize_text(NEW.principio_ativo);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_iv_set_normalized ON public.iv_medications;
CREATE TRIGGER trg_iv_set_normalized
BEFORE INSERT OR UPDATE OF principio_ativo ON public.iv_medications
FOR EACH ROW EXECUTE FUNCTION public.iv_set_normalized();

UPDATE public.iv_medications
SET principio_ativo_normalizado = public.iv_normalize_text(principio_ativo)
WHERE principio_ativo_normalizado IS NULL;

-- Índices
CREATE INDEX IF NOT EXISTS idx_iv_meds_normalized ON public.iv_medications (principio_ativo_normalizado);
CREATE INDEX IF NOT EXISTS idx_iv_meds_comerciais ON public.iv_medications USING GIN (nomes_comerciais);
CREATE INDEX IF NOT EXISTS idx_iv_meds_sinonimos ON public.iv_medications USING GIN (sinonimos);
CREATE INDEX IF NOT EXISTS idx_iv_meds_termos ON public.iv_medications USING GIN (termos_busca);
CREATE INDEX IF NOT EXISTS idx_iv_meds_alternativos ON public.iv_medications USING GIN (nomes_alternativos);

-- Tabela de log de correspondências
CREATE TABLE IF NOT EXISTS public.log_correspondencia_medicamentos_iv (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_hora timestamptz NOT NULL DEFAULT now(),
  usuario_responsavel uuid NOT NULL,
  id_prescricao text,
  id_medicamento_prescrito text,
  texto_digitado text NOT NULL,
  texto_normalizado text,
  medicamento_correspondente text,
  id_base_diluicao_iv uuid,
  tipo_correspondencia public.iv_match_type NOT NULL,
  score_confianca integer NOT NULL DEFAULT 0,
  acao_usuario public.iv_match_action NOT NULL
);

ALTER TABLE public.log_correspondencia_medicamentos_iv ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert their own IV match log"
ON public.log_correspondencia_medicamentos_iv
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = usuario_responsavel);

CREATE POLICY "Users view their own IV match log"
ON public.log_correspondencia_medicamentos_iv
FOR SELECT TO authenticated
USING (auth.uid() = usuario_responsavel);

CREATE POLICY "Admin/revisor view all IV match log"
ON public.log_correspondencia_medicamentos_iv
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'revisor'::app_role));

CREATE INDEX IF NOT EXISTS idx_iv_match_log_data ON public.log_correspondencia_medicamentos_iv (data_hora DESC);

-- Tabela de termos sugeridos
CREATE TABLE IF NOT EXISTS public.iv_termos_sugeridos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  id_medicamento uuid REFERENCES public.iv_medications(id) ON DELETE CASCADE,
  principio_ativo text NOT NULL,
  termo_sugerido text NOT NULL,
  termo_normalizado text,
  vezes_confirmado integer NOT NULL DEFAULT 1,
  ultimo_usuario uuid,
  status public.iv_suggested_term_status NOT NULL DEFAULT 'pendente',
  revisado_por uuid,
  data_revisao timestamptz,
  observacao text
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_iv_termo_sugerido
  ON public.iv_termos_sugeridos (id_medicamento, termo_normalizado);

ALTER TABLE public.iv_termos_sugeridos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated insert suggested terms"
ON public.iv_termos_sugeridos
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = ultimo_usuario);

CREATE POLICY "Admin/revisor view suggested terms"
ON public.iv_termos_sugeridos
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'revisor'::app_role));

CREATE POLICY "Admin/revisor update suggested terms"
ON public.iv_termos_sugeridos
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'revisor'::app_role));

CREATE POLICY "Admin/revisor delete suggested terms"
ON public.iv_termos_sugeridos
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'revisor'::app_role));

CREATE TRIGGER trg_iv_termos_sugeridos_updated
BEFORE UPDATE ON public.iv_termos_sugeridos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.iv_set_termo_normalized()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.termo_normalizado := public.iv_normalize_text(NEW.termo_sugerido);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_iv_termos_sug_norm
BEFORE INSERT OR UPDATE OF termo_sugerido ON public.iv_termos_sugeridos
FOR EACH ROW EXECUTE FUNCTION public.iv_set_termo_normalized();
