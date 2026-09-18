ALTER TABLE public.base_medicamentos_geral
  ADD COLUMN IF NOT EXISTS lote_id text NOT NULL DEFAULT 'legado_22A',
  ADD COLUMN IF NOT EXISTS principio_ativo_normalizado text,
  ADD COLUMN IF NOT EXISTS principio_ativo_en text,
  ADD COLUMN IF NOT EXISTS nomes_comerciais_br text,
  ADD COLUMN IF NOT EXISTS subclasse text,
  ADD COLUMN IF NOT EXISTS mecanismo_acao text,
  ADD COLUMN IF NOT EXISTS codigo_atc text,
  ADD COLUMN IF NOT EXISTS codigo_dcb text,
  ADD COLUMN IF NOT EXISTS na_rename boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS alto_risco boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS observacoes text;

UPDATE public.base_medicamentos_geral
SET principio_ativo_normalizado = COALESCE(principio_ativo_normalizado, nome_normalizado, public.iv_normalize_text(principio_ativo)),
    codigo_dcb = COALESCE(codigo_dcb, principio_ativo_dcb),
    subclasse = COALESCE(subclasse, subclasse_terapeutica),
    nomes_comerciais_br = COALESCE(nomes_comerciais_br, NULLIF(array_to_string(nomes_comerciais, ', '), ''));

CREATE OR REPLACE FUNCTION public.bmg_set_normalized()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.nome_normalizado := public.iv_normalize_text(NEW.principio_ativo);
  NEW.principio_ativo_normalizado := NEW.nome_normalizado;
  NEW.updated_at := now();
  RETURN NEW;
END $function$;

CREATE INDEX IF NOT EXISTS idx_med_geral_principio_norm
  ON public.base_medicamentos_geral (principio_ativo_normalizado);

CREATE INDEX IF NOT EXISTS idx_med_geral_principio_trgm
  ON public.base_medicamentos_geral USING gin (principio_ativo_normalizado extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_med_geral_atc
  ON public.base_medicamentos_geral (codigo_atc);

CREATE INDEX IF NOT EXISTS idx_med_geral_lote
  ON public.base_medicamentos_geral (lote_id);