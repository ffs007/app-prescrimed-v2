CREATE TABLE IF NOT EXISTS public.stg_sugestoes_escore_contexto (
  id BIGSERIAL PRIMARY KEY,
  lote_id TEXT NOT NULL,
  contexto TEXT NOT NULL,
  sindrome TEXT,
  escore_nome TEXT NOT NULL,
  prioridade INTEGER DEFAULT 5,
  tipo_sugestao TEXT NOT NULL,
  motivo TEXT,
  populacao_validada TEXT,
  versao_escore TEXT,
  fonte_id TEXT,
  trecho_citado TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stg_sugestoes_escore_contexto TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.stg_sugestoes_escore_contexto TO authenticated;
GRANT ALL ON public.stg_sugestoes_escore_contexto TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.stg_sugestoes_escore_contexto_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.stg_sugestoes_escore_contexto_id_seq TO service_role;

ALTER TABLE public.stg_sugestoes_escore_contexto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sugestoes_escore_select_auth" ON public.stg_sugestoes_escore_contexto
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sugestoes_escore_admin_write" ON public.stg_sugestoes_escore_contexto
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_sugestoes_escore_updated
  BEFORE UPDATE ON public.stg_sugestoes_escore_contexto
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_sugestoes_contexto ON public.stg_sugestoes_escore_contexto (contexto);
CREATE INDEX IF NOT EXISTS idx_sugestoes_sindrome ON public.stg_sugestoes_escore_contexto (sindrome);
CREATE INDEX IF NOT EXISTS idx_sugestoes_escore ON public.stg_sugestoes_escore_contexto (escore_nome);

INSERT INTO public.stg_sugestoes_escore_contexto
(lote_id, contexto, sindrome, escore_nome, prioridade, tipo_sugestao, motivo, populacao_validada, versao_escore, fonte_id, ativo)
VALUES
('escores_intervencionista_sangramento_v1','PS','dor_toracica','GRACE',1,'hard_gate','Estratificação de risco de mortalidade em SCA; orienta tempo de angiografia.','adulto_sca','GRACE_2.0','F001',TRUE),
('escores_intervencionista_sangramento_v1','PS','dor_toracica','TIMI-Bleeding',2,'hard_gate','Risco de sangramento maior em NSTE-ACS; modula intensidade de anticoagulação.','adulto_nste_acs','TIMI-Bleeding_2006','F008',TRUE),
('escores_intervencionista_sangramento_v1','PS','dor_toracica','CRUSADE',3,'hard_gate','Risco de sangramento maior em NSTE-ACS; modula intensidade de anticoagulação.','adulto_nste_acs','CRUSADE_2009','F003',TRUE),
('escores_intervencionista_sangramento_v1','PS','dor_toracica','GRACE-Bleeding',4,'hard_gate','Risco de sangramento maior em SCA; modula intensidade de anticoagulação.','adulto_sca','GRACE-Bleeding_2010','F007',TRUE),
('escores_intervencionista_sangramento_v1','PS','dor_toracica','HEART',5,'hard_gate','Estratificação de risco em dor torácica indiferenciada; orienta alta precoce.','adulto_dor_toracica','HEART_2008','F001',TRUE),
('escores_intervencionista_sangramento_v1','PS','fa_anticoagulada','HAS-BLED',1,'hard_gate','Risco de sangramento maior em FA anticoagulada; modula intensidade de anticoagulação.','adulto_fa','HAS-BLED_2010','F004',TRUE),
('escores_intervencionista_sangramento_v1','PS','fa_anticoagulada','ORBIT',2,'hard_gate','Risco de sangramento maior em FA anticoagulada; modula intensidade de anticoagulação.','adulto_fa','ORBIT_2016','F005',TRUE),
('escores_intervencionista_sangramento_v1','PS','fa_anticoagulada','ATRIA',3,'hard_gate','Risco de sangramento maior em FA anticoagulada; modula intensidade de anticoagulação.','adulto_fa','ATRIA_2011','F006',TRUE),
('escores_intervencionista_sangramento_v1','cirurgia_cardiaca','cirurgia_cardiaca','EuroSCORE-II',1,'hard_gate','Estima mortalidade em cirurgia cardíaca; orienta decisão cirúrgica.','adulto_cirurgia_cardiaca','EuroSCORE-II_2012','F002',TRUE),
('escores_intervencionista_sangramento_v1','intervenção_coronariana','doenca_coronariana','SYNTAX',1,'hard_gate','Complexidade anatômica coronariana; orienta PCI vs CABG.','adulto_intervencao','SYNTAX_2005','F001',TRUE),
('escores_intervencionista_sangramento_v1','intervenção_coronariana','doenca_coronariana','SYNTAX-II',2,'hard_gate','Combina SYNTAX anatômico com variáveis clínicas; estima mortalidade PCI vs CABG.','adulto_intervencao','SYNTAX-II_2013','F001',TRUE),
('escores_intervencionista_sangramento_v1','intervenção_coronariana','doenca_coronariana','EuroSCORE-II',3,'hard_gate','Estima mortalidade em cirurgia cardíaca; orienta decisão cirúrgica.','adulto_cirurgia_cardiaca','EuroSCORE-II_2012','F002',TRUE),
('escores_intervencionista_sangramento_v1','UTI','sepse','APACHE-II',1,'hard_gate','Estima mortalidade em UTI; orienta intensidade de cuidado.','adulto_uti','APACHE-II_1985','F008',TRUE),
('escores_intervencionista_sangramento_v1','UTI','sepse','SAPS-II',2,'hard_gate','Estima mortalidade em UTI; orienta intensidade de cuidado.','adulto_uti','SAPS-II_1993','F009',TRUE),
('escores_intervencionista_sangramento_v1','UTI','sepse','SOFA',3,'hard_gate','Disfunção orgânica em sepse; orienta intensidade de suporte.','adulto_uti','SOFA_Sepsis3_2016','F007',TRUE);

-- Helpers de validação de população (não existiam ainda)
CREATE OR REPLACE FUNCTION public.fn_validar_populacao_intervencionista(
  p_escore_nome TEXT,
  p_idade_anos INTEGER,
  p_populacao_validada TEXT
)
RETURNS TABLE(populacao_valida BOOLEAN, contexto_validacao TEXT, motivo_invalidacao TEXT, versao_escore TEXT)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $fn$
BEGIN
  IF p_idade_anos IS NOT NULL AND p_idade_anos < 18 THEN
    RETURN QUERY SELECT FALSE, p_populacao_validada,
      format('%s validado apenas em adultos (>= 18 anos); idade informada: %s anos.', p_escore_nome, p_idade_anos)::TEXT,
      NULL::TEXT;
    RETURN;
  END IF;
  RETURN QUERY SELECT TRUE, p_populacao_validada, NULL::TEXT, NULL::TEXT;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_validar_populacao_sangramento(
  p_escore_nome TEXT,
  p_idade_anos INTEGER,
  p_populacao_validada TEXT
)
RETURNS TABLE(populacao_valida BOOLEAN, contexto_validacao TEXT, motivo_invalidacao TEXT, versao_escore TEXT)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $fn$
BEGIN
  IF p_idade_anos IS NOT NULL AND p_idade_anos < 18 THEN
    RETURN QUERY SELECT FALSE, p_populacao_validada,
      format('%s de risco de sangramento validado apenas em adultos (>= 18 anos); idade informada: %s anos.', p_escore_nome, p_idade_anos)::TEXT,
      NULL::TEXT;
    RETURN;
  END IF;
  RETURN QUERY SELECT TRUE, p_populacao_validada, NULL::TEXT, NULL::TEXT;
END;
$fn$;

-- Função principal de sugestão por contexto
CREATE OR REPLACE FUNCTION public.fn_sugerir_escore_por_contexto(
  p_contexto TEXT,
  p_sindrome TEXT DEFAULT NULL,
  p_idade_anos INTEGER DEFAULT NULL
)
RETURNS TABLE(
  escore_nome TEXT,
  prioridade INTEGER,
  tipo_sugestao TEXT,
  motivo TEXT,
  populacao_validada BOOLEAN,
  versao_escore TEXT,
  fonte_id TEXT
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $fn$
DECLARE
  v_sugestao RECORD;
  v_pop_valida BOOLEAN;
  v_contexto_validacao TEXT;
  v_motivo_invalidacao TEXT;
  v_versao TEXT;
BEGIN
  FOR v_sugestao IN
    SELECT s.escore_nome, s.prioridade, s.tipo_sugestao, s.motivo,
           s.populacao_validada, s.versao_escore, s.fonte_id
    FROM public.stg_sugestoes_escore_contexto s
    WHERE s.contexto = p_contexto
      AND (p_sindrome IS NULL OR s.sindrome = p_sindrome)
      AND s.ativo = TRUE
    ORDER BY s.prioridade ASC
  LOOP
    v_pop_valida := TRUE;
    v_contexto_validacao := NULL;
    v_motivo_invalidacao := NULL;
    v_versao := v_sugestao.versao_escore;

    IF p_idade_anos IS NOT NULL THEN
      CASE
        WHEN v_sugestao.escore_nome IN ('SYNTAX','SYNTAX-II','EuroSCORE-II') THEN
          SELECT * INTO v_pop_valida, v_contexto_validacao, v_motivo_invalidacao, v_versao
          FROM public.fn_validar_populacao_intervencionista(v_sugestao.escore_nome, p_idade_anos, v_sugestao.populacao_validada);
        WHEN v_sugestao.escore_nome IN ('HAS-BLED','ORBIT','ATRIA','GRACE-Bleeding','TIMI-Bleeding','CRUSADE') THEN
          SELECT * INTO v_pop_valida, v_contexto_validacao, v_motivo_invalidacao, v_versao
          FROM public.fn_validar_populacao_sangramento(v_sugestao.escore_nome, p_idade_anos, v_sugestao.populacao_validada);
        ELSE
          v_pop_valida := TRUE;
      END CASE;
    END IF;

    RETURN QUERY SELECT
      v_sugestao.escore_nome,
      v_sugestao.prioridade,
      v_sugestao.tipo_sugestao,
      CASE WHEN v_pop_valida THEN v_sugestao.motivo
           ELSE 'BLOQUEADO: ' || COALESCE(v_motivo_invalidacao, 'População fora da validação') END,
      v_pop_valida,
      COALESCE(v_versao, v_sugestao.versao_escore),
      v_sugestao.fonte_id;
  END LOOP;
END;
$fn$;

-- Função de sugestão por gravidade
CREATE OR REPLACE FUNCTION public.fn_sugerir_escore_por_gravidade(
  p_contexto TEXT,
  p_sindrome TEXT DEFAULT NULL,
  p_gravidade TEXT DEFAULT NULL,
  p_idade_anos INTEGER DEFAULT NULL
)
RETURNS TABLE(
  escore_nome TEXT,
  prioridade INTEGER,
  tipo_sugestao TEXT,
  motivo TEXT,
  populacao_validada BOOLEAN,
  versao_escore TEXT,
  fonte_id TEXT
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $fn$
BEGIN
  RETURN QUERY
  SELECT s.escore_nome, s.prioridade, s.tipo_sugestao, s.motivo,
         TRUE AS populacao_validada, s.versao_escore, s.fonte_id
  FROM public.stg_sugestoes_escore_contexto s
  WHERE s.contexto = p_contexto
    AND (p_sindrome IS NULL OR s.sindrome = p_sindrome)
    AND (p_gravidade IS NULL OR s.tipo_sugestao = p_gravidade)
    AND s.ativo = TRUE
  ORDER BY s.prioridade ASC;
END;
$fn$;

-- Validação cruzada: escore aplicável ao paciente?
CREATE OR REPLACE FUNCTION public.fn_escore_aplicavel(
  p_escore_nome TEXT,
  p_contexto TEXT,
  p_idade_anos INTEGER DEFAULT NULL
)
RETURNS TABLE(
  aplicavel BOOLEAN,
  motivo TEXT,
  versao_escore TEXT
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $fn$
DECLARE
  v_sugestao RECORD;
  v_pop_valida BOOLEAN := TRUE;
  v_contexto_validacao TEXT;
  v_motivo_invalidacao TEXT;
  v_versao TEXT;
BEGIN
  SELECT s.* INTO v_sugestao
  FROM public.stg_sugestoes_escore_contexto s
  WHERE s.escore_nome = p_escore_nome
    AND s.contexto = p_contexto
    AND s.ativo = TRUE
  LIMIT 1;

  IF v_sugestao IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Escore não mapeado para este contexto'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  v_versao := v_sugestao.versao_escore;

  IF p_idade_anos IS NOT NULL THEN
    CASE
      WHEN p_escore_nome IN ('SYNTAX','SYNTAX-II','EuroSCORE-II') THEN
        SELECT * INTO v_pop_valida, v_contexto_validacao, v_motivo_invalidacao, v_versao
        FROM public.fn_validar_populacao_intervencionista(p_escore_nome, p_idade_anos, v_sugestao.populacao_validada);
      WHEN p_escore_nome IN ('HAS-BLED','ORBIT','ATRIA','GRACE-Bleeding','TIMI-Bleeding','CRUSADE') THEN
        SELECT * INTO v_pop_valida, v_contexto_validacao, v_motivo_invalidacao, v_versao
        FROM public.fn_validar_populacao_sangramento(p_escore_nome, p_idade_anos, v_sugestao.populacao_validada);
      ELSE
        v_pop_valida := TRUE;
    END CASE;
  END IF;

  RETURN QUERY SELECT v_pop_valida,
    CASE WHEN v_pop_valida THEN 'Escore aplicável'::TEXT
         ELSE COALESCE(v_motivo_invalidacao, 'População fora da validação') END,
    COALESCE(v_versao, v_sugestao.versao_escore);
END;
$fn$;