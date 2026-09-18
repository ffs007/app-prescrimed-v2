CREATE TABLE IF NOT EXISTS public.stg_faixas_validacao_intervencionista_sangramento (
  id BIGSERIAL PRIMARY KEY,
  lote_id TEXT NOT NULL,
  escore_nome TEXT NOT NULL,
  contexto TEXT NOT NULL,
  idade_min_anos INTEGER,
  idade_max_anos INTEGER,
  populacao_validada BOOLEAN DEFAULT FALSE,
  motivo_invalidacao TEXT,
  versao_escore TEXT,
  fonte_id TEXT,
  trecho_citado TEXT,
  revisao_humana_obrigatoria BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stg_faixas_validacao_intervencionista_sangramento TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.stg_faixas_validacao_intervencionista_sangramento TO authenticated;
GRANT ALL ON public.stg_faixas_validacao_intervencionista_sangramento TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.stg_faixas_validacao_intervencionista_sangramento_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.stg_faixas_validacao_intervencionista_sangramento_id_seq TO service_role;

ALTER TABLE public.stg_faixas_validacao_intervencionista_sangramento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "faixas_interv_sangr_select_auth" ON public.stg_faixas_validacao_intervencionista_sangramento;
CREATE POLICY "faixas_interv_sangr_select_auth"
ON public.stg_faixas_validacao_intervencionista_sangramento
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "faixas_interv_sangr_admin_write" ON public.stg_faixas_validacao_intervencionista_sangramento;
CREATE POLICY "faixas_interv_sangr_admin_write"
ON public.stg_faixas_validacao_intervencionista_sangramento
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_faixas_interv_sangr_escore ON public.stg_faixas_validacao_intervencionista_sangramento (escore_nome);
CREATE INDEX IF NOT EXISTS idx_faixas_interv_sangr_contexto ON public.stg_faixas_validacao_intervencionista_sangramento (contexto);
CREATE UNIQUE INDEX IF NOT EXISTS uq_faixas_interv_sangr ON public.stg_faixas_validacao_intervencionista_sangramento (lote_id, escore_nome, contexto);

DROP TRIGGER IF EXISTS trg_faixas_interv_sangr_updated ON public.stg_faixas_validacao_intervencionista_sangramento;
CREATE TRIGGER trg_faixas_interv_sangr_updated
BEFORE UPDATE ON public.stg_faixas_validacao_intervencionista_sangramento
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.stg_faixas_validacao_intervencionista_sangramento
(lote_id, escore_nome, contexto, idade_min_anos, idade_max_anos, populacao_validada, versao_escore, fonte_id)
VALUES
('escores_intervencionista_sangramento_v1','SYNTAX','intervenção_coronariana_adulto',18,NULL,TRUE,'SYNTAX_2005','F001'),
('escores_intervencionista_sangramento_v1','SYNTAX','nao_intervencao',NULL,NULL,FALSE,'SYNTAX_2005','F001'),
('escores_intervencionista_sangramento_v1','SYNTAX-II','intervenção_coronariana_adulto',18,NULL,TRUE,'SYNTAX-II_2013','F001'),
('escores_intervencionista_sangramento_v1','SYNTAX-II','nao_intervencao',NULL,NULL,FALSE,'SYNTAX-II_2013','F001'),
('escores_intervencionista_sangramento_v1','EuroSCORE-II','cirurgia_cardiaca_adulto',18,NULL,TRUE,'EuroSCORE-II_2012','F002'),
('escores_intervencionista_sangramento_v1','EuroSCORE-II','nao_cardiaco',NULL,NULL,FALSE,'EuroSCORE-II_2012','F002'),
('escores_intervencionista_sangramento_v1','CRUSADE','nste_acs_adulto',18,NULL,TRUE,'CRUSADE_2009','F003'),
('escores_intervencionista_sangramento_v1','CRUSADE','nao_sca',NULL,NULL,FALSE,'CRUSADE_2009','F003'),
('escores_intervencionista_sangramento_v1','HAS-BLED','fa_anticoagulada_adulto',18,NULL,TRUE,'HAS-BLED_2010','F004'),
('escores_intervencionista_sangramento_v1','HAS-BLED','nao_fa',NULL,NULL,FALSE,'HAS-BLED_2010','F004'),
('escores_intervencionista_sangramento_v1','ORBIT','fa_anticoagulada_adulto',18,NULL,TRUE,'ORBIT_2016','F005'),
('escores_intervencionista_sangramento_v1','ORBIT','nao_fa',NULL,NULL,FALSE,'ORBIT_2016','F005'),
('escores_intervencionista_sangramento_v1','ATRIA','fa_anticoagulada_adulto',18,NULL,TRUE,'ATRIA_2011','F006'),
('escores_intervencionista_sangramento_v1','ATRIA','nao_fa',NULL,NULL,FALSE,'ATRIA_2011','F006'),
('escores_intervencionista_sangramento_v1','GRACE-Bleeding','sca_adulto',18,NULL,TRUE,'GRACE-Bleeding_2010','F007'),
('escores_intervencionista_sangramento_v1','GRACE-Bleeding','nao_sca',NULL,NULL,FALSE,'GRACE-Bleeding_2010','F007'),
('escores_intervencionista_sangramento_v1','TIMI-Bleeding','nste_acs_adulto',18,NULL,TRUE,'TIMI-Bleeding_2006','F008'),
('escores_intervencionista_sangramento_v1','TIMI-Bleeding','nao_sca',NULL,NULL,FALSE,'TIMI-Bleeding_2006','F008')
ON CONFLICT (lote_id, escore_nome, contexto) DO NOTHING;

DROP FUNCTION IF EXISTS public.fn_validar_populacao_intervencionista(TEXT, INTEGER, TEXT);
CREATE FUNCTION public.fn_validar_populacao_intervencionista(
  p_escore_nome TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'intervenção_coronariana_adulto'
)
RETURNS TABLE(populacao_validada BOOLEAN, contexto TEXT, motivo TEXT, versao_escore TEXT)
LANGUAGE plpgsql STABLE SET search_path = public AS $fn$
DECLARE
  v_faixa RECORD;
BEGIN
  SELECT * INTO v_faixa
  FROM public.stg_faixas_validacao_intervencionista_sangramento f
  WHERE f.escore_nome = p_escore_nome
    AND f.contexto = p_contexto
    AND (f.idade_min_anos IS NULL OR p_idade_anos IS NULL OR p_idade_anos >= f.idade_min_anos)
    AND (f.idade_max_anos IS NULL OR p_idade_anos IS NULL OR p_idade_anos <= f.idade_max_anos)
  LIMIT 1;
  IF v_faixa IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, 'População fora da faixa de validação do escore'::TEXT, NULL::TEXT;
    RETURN;
  END IF;
  IF NOT v_faixa.populacao_validada THEN
    RETURN QUERY SELECT FALSE, v_faixa.contexto,
      COALESCE(v_faixa.motivo_invalidacao, 'Escore não validado nesta população')::TEXT, v_faixa.versao_escore;
    RETURN;
  END IF;
  RETURN QUERY SELECT TRUE, v_faixa.contexto, 'População validada'::TEXT, v_faixa.versao_escore;
END;
$fn$;

DROP FUNCTION IF EXISTS public.fn_validar_populacao_sangramento(TEXT, INTEGER, TEXT);
CREATE FUNCTION public.fn_validar_populacao_sangramento(
  p_escore_nome TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'fa_anticoagulada_adulto'
)
RETURNS TABLE(populacao_validada BOOLEAN, contexto TEXT, motivo TEXT, versao_escore TEXT)
LANGUAGE plpgsql STABLE SET search_path = public AS $fn$
DECLARE
  v_faixa RECORD;
BEGIN
  SELECT * INTO v_faixa
  FROM public.stg_faixas_validacao_intervencionista_sangramento f
  WHERE f.escore_nome = p_escore_nome
    AND f.contexto = p_contexto
    AND (f.idade_min_anos IS NULL OR p_idade_anos IS NULL OR p_idade_anos >= f.idade_min_anos)
    AND (f.idade_max_anos IS NULL OR p_idade_anos IS NULL OR p_idade_anos <= f.idade_max_anos)
  LIMIT 1;
  IF v_faixa IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, 'População fora da faixa de validação do escore'::TEXT, NULL::TEXT;
    RETURN;
  END IF;
  IF NOT v_faixa.populacao_validada THEN
    RETURN QUERY SELECT FALSE, v_faixa.contexto,
      COALESCE(v_faixa.motivo_invalidacao, 'Escore não validado nesta população')::TEXT, v_faixa.versao_escore;
    RETURN;
  END IF;
  RETURN QUERY SELECT TRUE, v_faixa.contexto, 'População validada'::TEXT, v_faixa.versao_escore;
END;
$fn$;