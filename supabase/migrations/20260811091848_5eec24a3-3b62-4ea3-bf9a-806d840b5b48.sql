CREATE TABLE IF NOT EXISTS public.stg_faixas_validacao_trauma_cirurgico (
  id BIGSERIAL PRIMARY KEY,
  lote_id TEXT NOT NULL,
  escore_nome TEXT NOT NULL,
  contexto TEXT NOT NULL,
  idade_min_anos INTEGER,
  idade_max_anos INTEGER,
  idade_min_dias INTEGER,
  idade_max_dias INTEGER,
  populacao_validada BOOLEAN DEFAULT FALSE,
  motivo_invalidacao TEXT,
  versao_escore TEXT,
  fonte_id TEXT,
  trecho_citado TEXT,
  revisao_humana_obrigatoria BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stg_faixas_validacao_trauma_cirurgico TO authenticated;
GRANT ALL ON public.stg_faixas_validacao_trauma_cirurgico TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.stg_faixas_validacao_trauma_cirurgico_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.stg_faixas_validacao_trauma_cirurgico_id_seq TO service_role;

ALTER TABLE public.stg_faixas_validacao_trauma_cirurgico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "faixas_trauma_cir_select_auth" ON public.stg_faixas_validacao_trauma_cirurgico;
CREATE POLICY "faixas_trauma_cir_select_auth" ON public.stg_faixas_validacao_trauma_cirurgico
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "faixas_trauma_cir_admin_write" ON public.stg_faixas_validacao_trauma_cirurgico;
CREATE POLICY "faixas_trauma_cir_admin_write" ON public.stg_faixas_validacao_trauma_cirurgico
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_faixas_trauma_cir_escore ON public.stg_faixas_validacao_trauma_cirurgico (escore_nome);
CREATE INDEX IF NOT EXISTS idx_faixas_trauma_cir_contexto ON public.stg_faixas_validacao_trauma_cirurgico (contexto);
CREATE UNIQUE INDEX IF NOT EXISTS uq_faixas_trauma_cir ON public.stg_faixas_validacao_trauma_cirurgico (lote_id, escore_nome, contexto);

DROP TRIGGER IF EXISTS trg_faixas_trauma_cir_updated ON public.stg_faixas_validacao_trauma_cirurgico;
CREATE TRIGGER trg_faixas_trauma_cir_updated BEFORE UPDATE ON public.stg_faixas_validacao_trauma_cirurgico
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.stg_faixas_validacao_trauma_cirurgico
(lote_id, escore_nome, contexto, idade_min_anos, idade_max_anos, idade_min_dias, idade_max_dias, populacao_validada, versao_escore, fonte_id)
VALUES
('escores_trauma_risco_cirurgico_v1','ISS','trauma_adulto',15,NULL,NULL,NULL,TRUE,'ISS_1974','F001'),
('escores_trauma_risco_cirurgico_v1','ISS','trauma_pediatrico',NULL,NULL,0,5475,TRUE,'ISS_1974','F001'),
('escores_trauma_risco_cirurgico_v1','ISS','nao_trauma',NULL,NULL,NULL,NULL,FALSE,'ISS_1974','F001'),
('escores_trauma_risco_cirurgico_v1','RTS','trauma_adulto',15,NULL,NULL,NULL,TRUE,'RTS_1989','F002'),
('escores_trauma_risco_cirurgico_v1','RTS','trauma_pediatrico',NULL,NULL,0,5475,TRUE,'RTS_1989','F002'),
('escores_trauma_risco_cirurgico_v1','RTS','nao_trauma',NULL,NULL,NULL,NULL,FALSE,'RTS_1989','F002'),
('escores_trauma_risco_cirurgico_v1','TRISS','trauma_adulto',15,NULL,NULL,NULL,TRUE,'TRISS_1987','F003'),
('escores_trauma_risco_cirurgico_v1','TRISS','trauma_pediatrico',NULL,NULL,0,5475,TRUE,'TRISS_1987','F003'),
('escores_trauma_risco_cirurgico_v1','TRISS','nao_trauma',NULL,NULL,NULL,NULL,FALSE,'TRISS_1987','F003'),
('escores_trauma_risco_cirurgico_v1','GCS-Trauma','trauma_adulto',15,NULL,NULL,NULL,TRUE,'GCS_1974','F001'),
('escores_trauma_risco_cirurgico_v1','GCS-Trauma','trauma_pediatrico',NULL,NULL,0,5475,TRUE,'GCS_1974','F001'),
('escores_trauma_risco_cirurgico_v1','GCS-Trauma','nao_trauma',NULL,NULL,NULL,NULL,FALSE,'GCS_1974','F001'),
('escores_trauma_risco_cirurgico_v1','ASA','cirurgico_adulto',18,NULL,NULL,NULL,TRUE,'ASA_2014','F004'),
('escores_trauma_risco_cirurgico_v1','ASA','cirurgico_pediatrico',NULL,NULL,0,6570,TRUE,'ASA_2014','F004'),
('escores_trauma_risco_cirurgico_v1','ASA','nao_cirurgico',NULL,NULL,NULL,NULL,FALSE,'ASA_2014','F004'),
('escores_trauma_risco_cirurgico_v1','POSSUM','cirurgico_adulto',18,NULL,NULL,NULL,TRUE,'POSSUM_1991','F005'),
('escores_trauma_risco_cirurgico_v1','POSSUM','cirurgico_pediatrico',NULL,NULL,0,6570,FALSE,'POSSUM_1991','F005'),
('escores_trauma_risco_cirurgico_v1','POSSUM','nao_cirurgico',NULL,NULL,NULL,NULL,FALSE,'POSSUM_1991','F005'),
('escores_trauma_risco_cirurgico_v1','EuroSCORE-II','cirurgico_cardiaco_adulto',18,NULL,NULL,NULL,TRUE,'EuroSCORE-II_2012','F006'),
('escores_trauma_risco_cirurgico_v1','EuroSCORE-II','cirurgico_cardiaco_pediatrico',NULL,NULL,0,6570,FALSE,'EuroSCORE-II_2012','F006'),
('escores_trauma_risco_cirurgico_v1','EuroSCORE-II','nao_cardiaco',NULL,NULL,NULL,NULL,FALSE,'EuroSCORE-II_2012','F006'),
('escores_trauma_risco_cirurgico_v1','RCRI','cirurgico_nao_cardiaco_adulto',18,NULL,NULL,NULL,TRUE,'RCRI_Lee_1999','F007'),
('escores_trauma_risco_cirurgico_v1','RCRI','cirurgico_nao_cardiaco_pediatrico',NULL,NULL,0,6570,FALSE,'RCRI_Lee_1999','F007'),
('escores_trauma_risco_cirurgico_v1','RCRI','nao_cirurgico',NULL,NULL,NULL,NULL,FALSE,'RCRI_Lee_1999','F007'),
('escores_trauma_risco_cirurgico_v1','APACHE-II','uti_adulto',16,NULL,NULL,NULL,TRUE,'APACHE-II_1985','F008'),
('escores_trauma_risco_cirurgico_v1','APACHE-II','uti_pediatrico',NULL,NULL,0,5840,FALSE,'APACHE-II_1985','F008'),
('escores_trauma_risco_cirurgico_v1','APACHE-II','nao_uti',NULL,NULL,NULL,NULL,FALSE,'APACHE-II_1985','F008'),
('escores_trauma_risco_cirurgico_v1','SAPS-II','uti_adulto',18,NULL,NULL,NULL,TRUE,'SAPS-II_1993','F009'),
('escores_trauma_risco_cirurgico_v1','SAPS-II','uti_pediatrico',NULL,NULL,0,6570,FALSE,'SAPS-II_1993','F009'),
('escores_trauma_risco_cirurgico_v1','SAPS-II','nao_uti',NULL,NULL,NULL,NULL,FALSE,'SAPS-II_1993','F009')
ON CONFLICT (lote_id, escore_nome, contexto) DO NOTHING;

CREATE OR REPLACE FUNCTION public.fn_validar_populacao_trauma(
  p_escore_nome TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_idade_dias INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'trauma_adulto'
)
RETURNS TABLE(populacao_validada BOOLEAN, contexto TEXT, motivo TEXT, versao_escore TEXT)
LANGUAGE plpgsql STABLE SET search_path = public AS $fn$
DECLARE v_faixa RECORD;
BEGIN
  SELECT * INTO v_faixa
  FROM public.stg_faixas_validacao_trauma_cirurgico f
  WHERE f.escore_nome = p_escore_nome
    AND f.contexto = p_contexto
    AND (f.idade_min_anos IS NULL OR p_idade_anos IS NULL OR p_idade_anos >= f.idade_min_anos)
    AND (f.idade_max_anos IS NULL OR p_idade_anos IS NULL OR p_idade_anos <= f.idade_max_anos)
    AND (f.idade_min_dias IS NULL OR p_idade_dias IS NULL OR p_idade_dias >= f.idade_min_dias)
    AND (f.idade_max_dias IS NULL OR p_idade_dias IS NULL OR p_idade_dias <= f.idade_max_dias)
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

CREATE OR REPLACE FUNCTION public.fn_validar_populacao_cirurgico(
  p_escore_nome TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'cirurgico_adulto'
)
RETURNS TABLE(populacao_validada BOOLEAN, contexto TEXT, motivo TEXT, versao_escore TEXT)
LANGUAGE plpgsql STABLE SET search_path = public AS $fn$
BEGIN
  RETURN QUERY SELECT * FROM public.fn_validar_populacao_trauma(p_escore_nome, p_idade_anos, NULL, p_contexto);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_calcular_iss(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_idade_dias INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'trauma_adulto',
  p_ais_cabeca INTEGER DEFAULT 0,
  p_ais_face INTEGER DEFAULT 0,
  p_ais_torax INTEGER DEFAULT 0,
  p_ais_abdome INTEGER DEFAULT 0,
  p_ais_extremidades INTEGER DEFAULT 0,
  p_ais_externo INTEGER DEFAULT 0,
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(status TEXT, total INTEGER, categoria TEXT, resposta TEXT, populacao_validada BOOLEAN, contexto TEXT, versao TEXT, limitacoes TEXT)
LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  v_total INTEGER; v_categoria TEXT; v_resposta TEXT;
  v_pop_valida BOOLEAN; v_contexto TEXT; v_motivo TEXT; v_versao TEXT;
  v_ais INTEGER[]; v_max INTEGER;
  v_limitacoes TEXT := 'ISS soma os quadrados dos 3 maiores AIS de regiões distintas (máximo 75). AIS 6 em qualquer região resulta em ISS 75. ISS >=16 define trauma grave. Não usar antes do survey primário nem fora de contexto de trauma.';
BEGIN
  SELECT * INTO v_pop_valida, v_contexto, v_motivo, v_versao
  FROM public.fn_validar_populacao_trauma('ISS', p_idade_anos, p_idade_dias, p_contexto);
  IF NOT COALESCE(v_pop_valida, FALSE) THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::INTEGER, NULL::TEXT, v_motivo::TEXT, FALSE, NULL::TEXT, NULL::TEXT, v_limitacoes;
    RETURN;
  END IF;
  v_ais := ARRAY[COALESCE(p_ais_cabeca,0), COALESCE(p_ais_face,0), COALESCE(p_ais_torax,0),
                 COALESCE(p_ais_abdome,0), COALESCE(p_ais_extremidades,0), COALESCE(p_ais_externo,0)];
  SELECT max(x) INTO v_max FROM unnest(v_ais) AS x;
  IF v_max > 6 OR (SELECT min(x) FROM unnest(v_ais) AS x) < 0 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::TEXT, NULL::INTEGER, NULL::TEXT,
      'Cada AIS regional deve ser 0-6'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF v_max = 6 THEN
    v_total := 75;
  ELSE
    SELECT COALESCE(sum(x * x), 0) INTO v_total
    FROM (SELECT x FROM unnest(v_ais) AS x ORDER BY x DESC LIMIT 3) s;
  END IF;
  IF v_total <= 8 THEN
    v_categoria := 'trauma_leve';
    v_resposta := 'Trauma leve; avaliação e tratamento das lesões específicas';
  ELSIF v_total BETWEEN 9 AND 15 THEN
    v_categoria := 'trauma_moderado';
    v_resposta := 'Trauma moderado; observação e reavaliação seriada';
  ELSIF v_total BETWEEN 16 AND 24 THEN
    v_categoria := 'trauma_grave';
    v_resposta := 'Trauma grave (ISS >=16); acionar equipe de trauma; considerar centro de trauma e UTI';
  ELSE
    v_categoria := 'trauma_muito_grave';
    v_resposta := 'Trauma muito grave; protocolo de trauma maior; UTI e centro de trauma nível I';
  END IF;
  INSERT INTO public.audit_escores_clinicos
  (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES (p_atendimento_id, 'ISS', v_versao, v_pop_valida,
    jsonb_build_object('idade_anos', p_idade_anos, 'idade_dias', p_idade_dias, 'contexto', p_contexto,
      'ais_cabeca', p_ais_cabeca, 'ais_face', p_ais_face, 'ais_torax', p_ais_torax,
      'ais_abdome', p_ais_abdome, 'ais_extremidades', p_ais_extremidades, 'ais_externo', p_ais_externo),
    TRUE, v_total, v_categoria, v_resposta, p_profissional, 'escores_trauma_risco_cirurgico_v1');
  RETURN QUERY SELECT 'CALCULATED'::TEXT, v_total, v_categoria, v_resposta, v_pop_valida, v_contexto, v_versao, v_limitacoes;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_calcular_rts(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_idade_dias INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'trauma_adulto',
  p_gcs INTEGER DEFAULT NULL,
  p_pas INTEGER DEFAULT NULL,
  p_fr INTEGER DEFAULT NULL,
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(status TEXT, total NUMERIC, categoria TEXT, resposta TEXT, populacao_validada BOOLEAN, contexto TEXT, versao TEXT, limitacoes TEXT)
LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  v_total NUMERIC; v_gcs_c INTEGER; v_pas_c INTEGER; v_fr_c INTEGER;
  v_categoria TEXT; v_resposta TEXT; v_pop_valida BOOLEAN; v_contexto TEXT; v_motivo TEXT; v_versao TEXT;
  v_limitacoes TEXT := 'RTS ponderado = 0,9368*GCSc + 0,7326*PASc + 0,2908*FRc (0 a 7,84). RTS >=7 sugere baixo risco; <4 alto risco. Não usar antes do survey primário.';
BEGIN
  SELECT * INTO v_pop_valida, v_contexto, v_motivo, v_versao
  FROM public.fn_validar_populacao_trauma('RTS', p_idade_anos, p_idade_dias, p_contexto);
  IF NOT COALESCE(v_pop_valida, FALSE) THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::NUMERIC, NULL::TEXT, v_motivo::TEXT, FALSE, NULL::TEXT, NULL::TEXT, v_limitacoes;
    RETURN;
  END IF;
  IF p_gcs IS NULL OR p_pas IS NULL OR p_fr IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::NUMERIC, NULL::TEXT,
      'Todas as entradas são obrigatórias: GCS, PAS, FR'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF p_gcs < 3 OR p_gcs > 15 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::TEXT, NULL::NUMERIC, NULL::TEXT,
      'GCS deve ser 3-15'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF p_gcs BETWEEN 13 AND 15 THEN v_gcs_c := 4;
  ELSIF p_gcs BETWEEN 9 AND 12 THEN v_gcs_c := 3;
  ELSIF p_gcs BETWEEN 6 AND 8 THEN v_gcs_c := 2;
  ELSIF p_gcs BETWEEN 4 AND 5 THEN v_gcs_c := 1;
  ELSE v_gcs_c := 0; END IF;
  IF p_pas > 89 THEN v_pas_c := 4;
  ELSIF p_pas BETWEEN 76 AND 89 THEN v_pas_c := 3;
  ELSIF p_pas BETWEEN 50 AND 75 THEN v_pas_c := 2;
  ELSIF p_pas BETWEEN 1 AND 49 THEN v_pas_c := 1;
  ELSE v_pas_c := 0; END IF;
  IF p_fr BETWEEN 10 AND 29 THEN v_fr_c := 4;
  ELSIF p_fr > 29 THEN v_fr_c := 3;
  ELSIF p_fr BETWEEN 6 AND 9 THEN v_fr_c := 2;
  ELSIF p_fr BETWEEN 1 AND 5 THEN v_fr_c := 1;
  ELSE v_fr_c := 0; END IF;
  v_total := round((0.9368 * v_gcs_c + 0.7326 * v_pas_c + 0.2908 * v_fr_c)::NUMERIC, 4);
  IF v_total >= 7 THEN
    v_categoria := 'baixo_risco';
    v_resposta := 'Baixo risco fisiológico; tratamento conforme lesões específicas';
  ELSIF v_total >= 4 THEN
    v_categoria := 'risco_intermediario';
    v_resposta := 'Risco intermediário; reavaliação seriada; considerar UTI e centro de trauma';
  ELSE
    v_categoria := 'alto_risco';
    v_resposta := 'Alto risco de mortalidade; protocolo de trauma grave; centro de trauma nível I';
  END IF;
  INSERT INTO public.audit_escores_clinicos
  (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES (p_atendimento_id, 'RTS', v_versao, v_pop_valida,
    jsonb_build_object('idade_anos', p_idade_anos, 'idade_dias', p_idade_dias, 'contexto', p_contexto,
      'gcs', p_gcs, 'pas', p_pas, 'fr', p_fr, 'gcs_coded', v_gcs_c, 'pas_coded', v_pas_c, 'fr_coded', v_fr_c),
    TRUE, v_total, v_categoria, v_resposta, p_profissional, 'escores_trauma_risco_cirurgico_v1');
  RETURN QUERY SELECT 'CALCULATED'::TEXT, v_total, v_categoria, v_resposta, v_pop_valida, v_contexto, v_versao, v_limitacoes;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_calcular_triss(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_idade_dias INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'trauma_adulto',
  p_iss INTEGER DEFAULT NULL,
  p_rts NUMERIC DEFAULT NULL,
  p_mecanismo TEXT DEFAULT 'contuso',
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(status TEXT, probabilidade_sobrevivencia NUMERIC, categoria TEXT, resposta TEXT, populacao_validada BOOLEAN, contexto TEXT, versao TEXT, limitacoes TEXT)
LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  v_b NUMERIC; v_prob NUMERIC; v_idx INTEGER;
  v_b0 NUMERIC; v_b1 NUMERIC; v_b2 NUMERIC; v_b3 NUMERIC;
  v_categoria TEXT; v_resposta TEXT; v_pop_valida BOOLEAN; v_contexto TEXT; v_motivo TEXT; v_versao TEXT;
  v_limitacoes TEXT := 'TRISS combina RTS, ISS, idade e mecanismo (contuso/penetrante) para estimar probabilidade de sobrevivência. Coeficientes MTOS: contuso -1,2470/0,9544/-0,0768/-1,9052; penetrante -0,6029/1,1430/-0,1516/-2,6676. Índice de idade = 1 se >=55 anos. Estimativa populacional; não substitui julgamento clínico.';
BEGIN
  SELECT * INTO v_pop_valida, v_contexto, v_motivo, v_versao
  FROM public.fn_validar_populacao_trauma('TRISS', p_idade_anos, p_idade_dias, p_contexto);
  IF NOT COALESCE(v_pop_valida, FALSE) THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::NUMERIC, NULL::TEXT, v_motivo::TEXT, FALSE, NULL::TEXT, NULL::TEXT, v_limitacoes;
    RETURN;
  END IF;
  IF p_iss IS NULL OR p_rts IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::NUMERIC, NULL::TEXT,
      'Entradas obrigatórias: ISS e RTS'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF p_iss < 0 OR p_iss > 75 OR p_rts < 0 OR p_rts > 8 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::TEXT, NULL::NUMERIC, NULL::TEXT,
      'ISS deve ser 0-75 e RTS 0-7,84'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  v_idx := CASE WHEN COALESCE(p_idade_anos, 0) >= 55 THEN 1 ELSE 0 END;
  IF p_mecanismo = 'penetrante' THEN
    v_b0 := -0.6029; v_b1 := 1.1430; v_b2 := -0.1516; v_b3 := -2.6676;
  ELSE
    v_b0 := -1.2470; v_b1 := 0.9544; v_b2 := -0.0768; v_b3 := -1.9052;
  END IF;
  v_b := v_b0 + v_b1 * p_rts + v_b2 * p_iss + v_b3 * v_idx;
  v_prob := round((1 / (1 + exp(-v_b)))::NUMERIC, 4);
  IF v_prob >= 0.75 THEN
    v_categoria := 'alta_probabilidade_sobrevivencia';
    v_resposta := 'Alta probabilidade de sobrevivência; tratamento conforme lesões específicas';
  ELSIF v_prob >= 0.50 THEN
    v_categoria := 'probabilidade_intermediaria';
    v_resposta := 'Probabilidade intermediária; considerar UTI; protocolo de trauma grave';
  ELSE
    v_categoria := 'baixa_probabilidade_sobrevivencia';
    v_resposta := 'Baixa probabilidade de sobrevivência; protocolo de trauma grave; considerar centro de trauma nível I';
  END IF;
  INSERT INTO public.audit_escores_clinicos
  (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES (p_atendimento_id, 'TRISS', v_versao, v_pop_valida,
    jsonb_build_object('idade_anos', p_idade_anos, 'idade_dias', p_idade_dias, 'contexto', p_contexto,
      'iss', p_iss, 'rts', p_rts, 'mecanismo', p_mecanismo, 'indice_idade', v_idx, 'b', v_b),
    TRUE, v_prob, v_categoria, v_resposta, p_profissional, 'escores_trauma_risco_cirurgico_v1');
  RETURN QUERY SELECT 'CALCULATED'::TEXT, v_prob, v_categoria, v_resposta, v_pop_valida, v_contexto, v_versao, v_limitacoes;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_calcular_gcs_trauma(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_idade_dias INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'trauma_adulto',
  p_ocular INTEGER DEFAULT NULL,
  p_verbal INTEGER DEFAULT NULL,
  p_motora INTEGER DEFAULT NULL,
  p_intubado BOOLEAN DEFAULT FALSE,
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(status TEXT, total INTEGER, categoria TEXT, resposta TEXT, populacao_validada BOOLEAN, contexto TEXT, versao TEXT, limitacoes TEXT)
LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  v_total INTEGER; v_categoria TEXT; v_resposta TEXT;
  v_pop_valida BOOLEAN; v_contexto TEXT; v_motivo TEXT; v_versao TEXT;
  v_limitacoes TEXT := 'GCS de trauma: ocular 1-4, verbal 1-5, motor 1-6 (3 a 15). GCS <=8 TCE grave, 9-12 moderado, >=13 leve. Em paciente intubado o componente verbal não é avaliável (registrar como 1T) e o total é subestimado.';
BEGIN
  SELECT * INTO v_pop_valida, v_contexto, v_motivo, v_versao
  FROM public.fn_validar_populacao_trauma('GCS-Trauma', p_idade_anos, p_idade_dias, p_contexto);
  IF NOT COALESCE(v_pop_valida, FALSE) THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::INTEGER, NULL::TEXT, v_motivo::TEXT, FALSE, NULL::TEXT, NULL::TEXT, v_limitacoes;
    RETURN;
  END IF;
  IF p_ocular IS NULL OR p_verbal IS NULL OR p_motora IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::INTEGER, NULL::TEXT,
      'Todas as entradas são obrigatórias: ocular, verbal, motora'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF p_ocular < 1 OR p_ocular > 4 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::TEXT, NULL::INTEGER, NULL::TEXT,
      'Componente ocular deve ser 1-4'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF p_verbal < 1 OR p_verbal > 5 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::TEXT, NULL::INTEGER, NULL::TEXT,
      'Componente verbal deve ser 1-5'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF p_motora < 1 OR p_motora > 6 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::TEXT, NULL::INTEGER, NULL::TEXT,
      'Componente motor deve ser 1-6'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  v_total := p_ocular + p_verbal + p_motora;
  IF v_total <= 8 THEN
    v_categoria := 'tce_grave';
    v_resposta := 'TCE grave; via aérea definitiva, TC de crânio imediata, neurocirurgia e UTI';
  ELSIF v_total BETWEEN 9 AND 12 THEN
    v_categoria := 'tce_moderado';
    v_resposta := 'TCE moderado; TC de crânio, observação hospitalar e reavaliação neurológica seriada';
  ELSE
    v_categoria := 'tce_leve';
    v_resposta := 'TCE leve; aplicar critérios de imagem (Canadian CT Head/NEXUS) e observação conforme risco';
  END IF;
  IF p_intubado THEN
    v_categoria := v_categoria || '_intubado';
    v_resposta := v_resposta || ' Paciente intubado: componente verbal não avaliável (1T); total subestimado.';
  END IF;
  INSERT INTO public.audit_escores_clinicos
  (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES (p_atendimento_id, 'GCS-Trauma', v_versao, v_pop_valida,
    jsonb_build_object('idade_anos', p_idade_anos, 'idade_dias', p_idade_dias, 'contexto', p_contexto,
      'ocular', p_ocular, 'verbal', p_verbal, 'motora', p_motora, 'intubado', p_intubado),
    TRUE, v_total, v_categoria, v_resposta, p_profissional, 'escores_trauma_risco_cirurgico_v1');
  RETURN QUERY SELECT 'CALCULATED'::TEXT, v_total, v_categoria, v_resposta, v_pop_valida, v_contexto, v_versao, v_limitacoes;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_calcular_asa(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'cirurgico_adulto',
  p_asa_classe INTEGER DEFAULT NULL,
  p_emergencia BOOLEAN DEFAULT FALSE,
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(status TEXT, total INTEGER, categoria TEXT, resposta TEXT, populacao_validada BOOLEAN, contexto TEXT, versao TEXT, limitacoes TEXT)
LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  v_categoria TEXT; v_resposta TEXT; v_pop_valida BOOLEAN; v_contexto TEXT; v_motivo TEXT; v_versao TEXT;
  v_limitacoes TEXT := 'ASA-PS classifica o estado físico pré-anestésico (I a VI), com sufixo E para emergência. Não é um escore de risco cirúrgico isolado; deve ser combinado ao porte da cirurgia e a escores específicos (RCRI, POSSUM, EuroSCORE II).';
BEGIN
  SELECT * INTO v_pop_valida, v_contexto, v_motivo, v_versao
  FROM public.fn_validar_populacao_cirurgico('ASA', p_idade_anos, p_contexto);
  IF NOT COALESCE(v_pop_valida, FALSE) THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::INTEGER, NULL::TEXT, v_motivo::TEXT, FALSE, NULL::TEXT, NULL::TEXT, v_limitacoes;
    RETURN;
  END IF;
  IF p_asa_classe IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::INTEGER, NULL::TEXT,
      'Entrada obrigatória: classe ASA'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF p_asa_classe < 1 OR p_asa_classe > 6 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::TEXT, NULL::INTEGER, NULL::TEXT,
      'Classe ASA deve ser 1-6'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  CASE p_asa_classe
    WHEN 1 THEN v_categoria := 'asa_i'; v_resposta := 'ASA I: saudável; risco baixo; cirurgia conforme indicação';
    WHEN 2 THEN v_categoria := 'asa_ii'; v_resposta := 'ASA II: doença sistêmica leve; risco baixo-moderado; cirurgia conforme indicação';
    WHEN 3 THEN v_categoria := 'asa_iii'; v_resposta := 'ASA III: doença sistêmica grave; risco moderado-alto; considerar otimização pré-operatória';
    WHEN 4 THEN v_categoria := 'asa_iv'; v_resposta := 'ASA IV: doença sistêmica grave com ameaça à vida; risco alto; otimização e discussão multidisciplinar';
    WHEN 5 THEN v_categoria := 'asa_v'; v_resposta := 'ASA V: moribundo; risco muito alto; apenas cirurgia de salvamento';
    ELSE v_categoria := 'asa_vi'; v_resposta := 'ASA VI: morte encefálica; considerar doação de órgãos';
  END CASE;
  IF p_emergencia THEN
    v_categoria := v_categoria || '_emergencia';
    v_resposta := v_resposta || ' EMERGÊNCIA (E): risco adicional; otimização rápida.';
  END IF;
  INSERT INTO public.audit_escores_clinicos
  (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES (p_atendimento_id, 'ASA', v_versao, v_pop_valida,
    jsonb_build_object('idade_anos', p_idade_anos, 'contexto', p_contexto, 'asa_classe', p_asa_classe, 'emergencia', p_emergencia),
    TRUE, p_asa_classe, v_categoria, v_resposta, p_profissional, 'escores_trauma_risco_cirurgico_v1');
  RETURN QUERY SELECT 'CALCULATED'::TEXT, p_asa_classe, v_categoria, v_resposta, v_pop_valida, v_contexto, v_versao, v_limitacoes;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_calcular_possum(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'cirurgico_adulto',
  p_score_fisiologico INTEGER DEFAULT NULL,
  p_score_operativo INTEGER DEFAULT NULL,
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(status TEXT, mortalidade_prevista NUMERIC, morbidade_prevista NUMERIC, categoria TEXT, resposta TEXT, populacao_validada BOOLEAN, contexto TEXT, versao TEXT, limitacoes TEXT)
LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  v_z_mort NUMERIC; v_z_morb NUMERIC; v_mort NUMERIC; v_morb NUMERIC;
  v_categoria TEXT; v_resposta TEXT; v_pop_valida BOOLEAN; v_contexto TEXT; v_motivo TEXT; v_versao TEXT;
  v_limitacoes TEXT := 'POSSUM: mortalidade ln(R/(1-R)) = -7,04 + 0,13*fisiológico + 0,16*operativo; morbidade = -5,91 + 0,16*fisiológico + 0,19*operativo. Score fisiológico 12-88 e operativo 6-44. Tende a superestimar mortalidade em baixo risco (considerar P-POSSUM).';
BEGIN
  SELECT * INTO v_pop_valida, v_contexto, v_motivo, v_versao
  FROM public.fn_validar_populacao_cirurgico('POSSUM', p_idade_anos, p_contexto);
  IF NOT COALESCE(v_pop_valida, FALSE) THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT, v_motivo::TEXT, FALSE, NULL::TEXT, NULL::TEXT, v_limitacoes;
    RETURN;
  END IF;
  IF p_score_fisiologico IS NULL OR p_score_operativo IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT,
      'Entradas obrigatórias: score fisiológico e score operativo'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF p_score_fisiologico < 12 OR p_score_fisiologico > 88 OR p_score_operativo < 6 OR p_score_operativo > 44 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::TEXT, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT,
      'Score fisiológico deve ser 12-88 e operativo 6-44'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  v_z_mort := -7.04 + 0.13 * p_score_fisiologico + 0.16 * p_score_operativo;
  v_z_morb := -5.91 + 0.16 * p_score_fisiologico + 0.19 * p_score_operativo;
  v_mort := round((exp(v_z_mort) / (1 + exp(v_z_mort)))::NUMERIC, 4);
  v_morb := round((exp(v_z_morb) / (1 + exp(v_z_morb)))::NUMERIC, 4);
  IF v_mort < 0.05 THEN
    v_categoria := 'baixo_risco';
    v_resposta := 'Baixo risco previsto; cirurgia conforme indicação com cuidados habituais';
  ELSIF v_mort < 0.15 THEN
    v_categoria := 'risco_intermediario';
    v_resposta := 'Risco intermediário; otimização pré-operatória e vaga de UTI planejada';
  ELSE
    v_categoria := 'alto_risco';
    v_resposta := 'Alto risco previsto; discussão multidisciplinar, consentimento ampliado e UTI no pós-operatório';
  END IF;
  INSERT INTO public.audit_escores_clinicos
  (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES (p_atendimento_id, 'POSSUM', v_versao, v_pop_valida,
    jsonb_build_object('idade_anos', p_idade_anos, 'contexto', p_contexto,
      'score_fisiologico', p_score_fisiologico, 'score_operativo', p_score_operativo,
      'mortalidade_prevista', v_mort, 'morbidade_prevista', v_morb),
    TRUE, v_mort, v_categoria, v_resposta, p_profissional, 'escores_trauma_risco_cirurgico_v1');
  RETURN QUERY SELECT 'CALCULATED'::TEXT, v_mort, v_morb, v_categoria, v_resposta, v_pop_valida, v_contexto, v_versao, v_limitacoes;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_calcular_euroscore2(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'cirurgico_cardiaco_adulto',
  p_euroscore2 NUMERIC DEFAULT NULL,
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(status TEXT, mortalidade_prevista NUMERIC, categoria TEXT, resposta TEXT, populacao_validada BOOLEAN, contexto TEXT, versao TEXT, limitacoes TEXT)
LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  v_categoria TEXT; v_resposta TEXT; v_pop_valida BOOLEAN; v_contexto TEXT; v_motivo TEXT; v_versao TEXT;
  v_limitacoes TEXT := 'EuroSCORE II estima mortalidade hospitalar em cirurgia cardíaca (percentual). <2%: baixo risco; 2-5%: intermediário; >5%: alto. Não usar em cirurgia não cardíaca (usar RCRI/POSSUM).';
BEGIN
  SELECT * INTO v_pop_valida, v_contexto, v_motivo, v_versao
  FROM public.fn_validar_populacao_cirurgico('EuroSCORE-II', p_idade_anos, p_contexto);
  IF NOT COALESCE(v_pop_valida, FALSE) THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::NUMERIC, NULL::TEXT, v_motivo::TEXT, FALSE, NULL::TEXT, NULL::TEXT, v_limitacoes;
    RETURN;
  END IF;
  IF p_euroscore2 IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::NUMERIC, NULL::TEXT,
      'Entrada obrigatória: EuroSCORE II calculado (%)'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF p_euroscore2 < 0 OR p_euroscore2 > 100 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::TEXT, NULL::NUMERIC, NULL::TEXT,
      'EuroSCORE II deve ser 0-100'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF p_euroscore2 < 2 THEN
    v_categoria := 'baixo_risco';
    v_resposta := 'Baixo risco de mortalidade; cirurgia cardíaca conforme indicação';
  ELSIF p_euroscore2 <= 5 THEN
    v_categoria := 'risco_intermediario';
    v_resposta := 'Risco intermediário; otimização pré-operatória e discussão em Heart Team';
  ELSE
    v_categoria := 'alto_risco';
    v_resposta := 'Alto risco de mortalidade; Heart Team obrigatório; considerar alternativas percutâneas';
  END IF;
  INSERT INTO public.audit_escores_clinicos
  (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES (p_atendimento_id, 'EuroSCORE-II', v_versao, v_pop_valida,
    jsonb_build_object('idade_anos', p_idade_anos, 'contexto', p_contexto, 'euroscore2', p_euroscore2),
    TRUE, p_euroscore2, v_categoria, v_resposta, p_profissional, 'escores_trauma_risco_cirurgico_v1');
  RETURN QUERY SELECT 'CALCULATED'::TEXT, p_euroscore2, v_categoria, v_resposta, v_pop_valida, v_contexto, v_versao, v_limitacoes;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_calcular_rcri(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'cirurgico_nao_cardiaco_adulto',
  p_cardiopatia_isquemica BOOLEAN DEFAULT FALSE,
  p_insuficiencia_cardiaca BOOLEAN DEFAULT FALSE,
  p_doenca_cerebrovascular BOOLEAN DEFAULT FALSE,
  p_diabetes_insulina BOOLEAN DEFAULT FALSE,
  p_insuficiencia_renal BOOLEAN DEFAULT FALSE,
  p_cirurgia_alto_risco BOOLEAN DEFAULT FALSE,
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(status TEXT, total INTEGER, categoria TEXT, resposta TEXT, populacao_validada BOOLEAN, contexto TEXT, versao TEXT, limitacoes TEXT)
LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  v_total INTEGER := 0; v_categoria TEXT; v_resposta TEXT;
  v_pop_valida BOOLEAN; v_contexto TEXT; v_motivo TEXT; v_versao TEXT;
  v_limitacoes TEXT := 'RCRI (Lee) soma 6 preditores em cirurgia não cardíaca: 0 = baixo risco, 1 = intermediário, >=2 = alto risco de evento cardíaco maior. Não usar em cirurgia cardíaca (usar EuroSCORE II).';
BEGIN
  SELECT * INTO v_pop_valida, v_contexto, v_motivo, v_versao
  FROM public.fn_validar_populacao_cirurgico('RCRI', p_idade_anos, p_contexto);
  IF NOT COALESCE(v_pop_valida, FALSE) THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::INTEGER, NULL::TEXT, v_motivo::TEXT, FALSE, NULL::TEXT, NULL::TEXT, v_limitacoes;
    RETURN;
  END IF;
  IF p_cardiopatia_isquemica IS NULL OR p_insuficiencia_cardiaca IS NULL OR p_doenca_cerebrovascular IS NULL
     OR p_diabetes_insulina IS NULL OR p_insuficiencia_renal IS NULL OR p_cirurgia_alto_risco IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::INTEGER, NULL::TEXT,
      'Todas as entradas são obrigatórias'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF p_cardiopatia_isquemica THEN v_total := v_total + 1; END IF;
  IF p_insuficiencia_cardiaca THEN v_total := v_total + 1; END IF;
  IF p_doenca_cerebrovascular THEN v_total := v_total + 1; END IF;
  IF p_diabetes_insulina THEN v_total := v_total + 1; END IF;
  IF p_insuficiencia_renal THEN v_total := v_total + 1; END IF;
  IF p_cirurgia_alto_risco THEN v_total := v_total + 1; END IF;
  IF v_total = 0 THEN
    v_categoria := 'baixo_risco';
    v_resposta := 'Baixo risco cardíaco (~3,9%); cirurgia conforme indicação';
  ELSIF v_total = 1 THEN
    v_categoria := 'risco_intermediario';
    v_resposta := 'Risco intermediário (~6%); avaliar capacidade funcional e otimização clínica';
  ELSE
    v_categoria := 'alto_risco';
    v_resposta := 'Alto risco cardíaco (>=10%); avaliação cardiológica pré-operatória e monitorização perioperatória intensiva';
  END IF;
  INSERT INTO public.audit_escores_clinicos
  (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES (p_atendimento_id, 'RCRI', v_versao, v_pop_valida,
    jsonb_build_object('idade_anos', p_idade_anos, 'contexto', p_contexto,
      'cardiopatia_isquemica', p_cardiopatia_isquemica, 'insuficiencia_cardiaca', p_insuficiencia_cardiaca,
      'doenca_cerebrovascular', p_doenca_cerebrovascular, 'diabetes_insulina', p_diabetes_insulina,
      'insuficiencia_renal', p_insuficiencia_renal, 'cirurgia_alto_risco', p_cirurgia_alto_risco),
    TRUE, v_total, v_categoria, v_resposta, p_profissional, 'escores_trauma_risco_cirurgico_v1');
  RETURN QUERY SELECT 'CALCULATED'::TEXT, v_total, v_categoria, v_resposta, v_pop_valida, v_contexto, v_versao, v_limitacoes;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_calcular_apache2(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'uti_adulto',
  p_score_fisiologico INTEGER DEFAULT NULL,
  p_idade_pontos INTEGER DEFAULT NULL,
  p_doenca_cronica_pontos INTEGER DEFAULT NULL,
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(status TEXT, total INTEGER, categoria TEXT, resposta TEXT, populacao_validada BOOLEAN, contexto TEXT, versao TEXT, limitacoes TEXT)
LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  v_total INTEGER; v_categoria TEXT; v_resposta TEXT;
  v_pop_valida BOOLEAN; v_contexto TEXT; v_motivo TEXT; v_versao TEXT;
  v_limitacoes TEXT := 'APACHE II = APS + pontos de idade + pontos de doença crônica (0-71), com os piores valores das primeiras 24h de UTI. <=9 baixo risco, 10-20 intermediário, >=21 alto risco. Escore populacional; não decide individualmente sobre admissão ou limitação terapêutica.';
BEGIN
  SELECT * INTO v_pop_valida, v_contexto, v_motivo, v_versao
  FROM public.fn_validar_populacao_cirurgico('APACHE-II', p_idade_anos, p_contexto);
  IF NOT COALESCE(v_pop_valida, FALSE) THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::INTEGER, NULL::TEXT, v_motivo::TEXT, FALSE, NULL::TEXT, NULL::TEXT, v_limitacoes;
    RETURN;
  END IF;
  IF p_score_fisiologico IS NULL OR p_idade_pontos IS NULL OR p_doenca_cronica_pontos IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::INTEGER, NULL::TEXT,
      'Entradas obrigatórias: score fisiológico, pontos de idade e pontos de doença crônica'::TEXT,
      v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  v_total := p_score_fisiologico + p_idade_pontos + p_doenca_cronica_pontos;
  IF v_total < 0 OR v_total > 71 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::TEXT, NULL::INTEGER, NULL::TEXT,
      'APACHE II total deve ser 0-71'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF v_total <= 9 THEN
    v_categoria := 'baixo_risco';
    v_resposta := 'Baixo risco estimado; cuidado intensivo conforme necessidade clínica';
  ELSIF v_total <= 20 THEN
    v_categoria := 'risco_intermediario';
    v_resposta := 'Risco intermediário; monitorização intensiva e reavaliação diária';
  ELSE
    v_categoria := 'alto_risco';
    v_resposta := 'Alto risco de mortalidade; suporte intensivo pleno e definição de metas de cuidado com a família';
  END IF;
  INSERT INTO public.audit_escores_clinicos
  (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES (p_atendimento_id, 'APACHE-II', v_versao, v_pop_valida,
    jsonb_build_object('idade_anos', p_idade_anos, 'contexto', p_contexto,
      'score_fisiologico', p_score_fisiologico, 'idade_pontos', p_idade_pontos, 'doenca_cronica_pontos', p_doenca_cronica_pontos),
    TRUE, v_total, v_categoria, v_resposta, p_profissional, 'escores_trauma_risco_cirurgico_v1');
  RETURN QUERY SELECT 'CALCULATED'::TEXT, v_total, v_categoria, v_resposta, v_pop_valida, v_contexto, v_versao, v_limitacoes;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_calcular_saps2(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'uti_adulto',
  p_saps2_pontos INTEGER DEFAULT NULL,
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(status TEXT, total INTEGER, mortalidade_prevista NUMERIC, categoria TEXT, resposta TEXT, populacao_validada BOOLEAN, contexto TEXT, versao TEXT, limitacoes TEXT)
LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  v_logit NUMERIC; v_mort NUMERIC; v_categoria TEXT; v_resposta TEXT;
  v_pop_valida BOOLEAN; v_contexto TEXT; v_motivo TEXT; v_versao TEXT;
  v_limitacoes TEXT := 'SAPS II (0-163) usa os piores valores das primeiras 24h de UTI. Mortalidade: logit = -7,7631 + 0,0737*SAPS + 0,9971*ln(SAPS+1). <=28 baixo risco, 29-40 intermediário, >=41 alto risco. Escore populacional; não decide individualmente sobre limitação terapêutica.';
BEGIN
  SELECT * INTO v_pop_valida, v_contexto, v_motivo, v_versao
  FROM public.fn_validar_populacao_cirurgico('SAPS-II', p_idade_anos, p_contexto);
  IF NOT COALESCE(v_pop_valida, FALSE) THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::INTEGER, NULL::NUMERIC, NULL::TEXT, v_motivo::TEXT, FALSE, NULL::TEXT, NULL::TEXT, v_limitacoes;
    RETURN;
  END IF;
  IF p_saps2_pontos IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::INTEGER, NULL::NUMERIC, NULL::TEXT,
      'Entrada obrigatória: SAPS II pontos'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF p_saps2_pontos < 0 OR p_saps2_pontos > 163 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::TEXT, NULL::INTEGER, NULL::NUMERIC, NULL::TEXT,
      'SAPS II pontos deve ser 0-163'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  v_logit := -7.7631 + 0.0737 * p_saps2_pontos + 0.9971 * ln(p_saps2_pontos + 1);
  v_mort := round((exp(v_logit) / (1 + exp(v_logit)))::NUMERIC, 4);
  IF p_saps2_pontos <= 28 THEN
    v_categoria := 'baixo_risco';
    v_resposta := 'Baixo risco estimado; cuidado intensivo conforme necessidade clínica';
  ELSIF p_saps2_pontos <= 40 THEN
    v_categoria := 'risco_intermediario';
    v_resposta := 'Risco intermediário; monitorização intensiva e reavaliação diária';
  ELSE
    v_categoria := 'alto_risco';
    v_resposta := 'Alto risco de mortalidade; suporte intensivo pleno e definição de metas de cuidado com a família';
  END IF;
  INSERT INTO public.audit_escores_clinicos
  (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES (p_atendimento_id, 'SAPS-II', v_versao, v_pop_valida,
    jsonb_build_object('idade_anos', p_idade_anos, 'contexto', p_contexto,
      'saps2_pontos', p_saps2_pontos, 'mortalidade_prevista', v_mort),
    TRUE, p_saps2_pontos, v_categoria, v_resposta, p_profissional, 'escores_trauma_risco_cirurgico_v1');
  RETURN QUERY SELECT 'CALCULATED'::TEXT, p_saps2_pontos, v_mort, v_categoria, v_resposta, v_pop_valida, v_contexto, v_versao, v_limitacoes;
END;
$fn$;

INSERT INTO public.indicadores_qualidade_ps
(lote_id, codigo_indicador, nome, descricao, tipo, formula_numerador, formula_denominador, meta_pct, periodicidade, protocolo_id, fonte_id)
VALUES
('escores_trauma_risco_cirurgico_v1','IQ_TRAUMA_CIRURGICO:1','ISS calculado na população de trauma','Percentual de ISS calculado com população validada','processo','ISS com população validada','Total de ISS calculados','95','mensal',NULL,'F001'),
('escores_trauma_risco_cirurgico_v1','IQ_TRAUMA_CIRURGICO:2','RTS calculado na população de trauma','Percentual de RTS calculado com população validada','processo','RTS com população validada','Total de RTS calculados','95','mensal',NULL,'F002'),
('escores_trauma_risco_cirurgico_v1','IQ_TRAUMA_CIRURGICO:3','TRISS calculado na população de trauma','Percentual de TRISS calculado com população validada','processo','TRISS com população validada','Total de TRISS calculados','95','mensal',NULL,'F003'),
('escores_trauma_risco_cirurgico_v1','IQ_TRAUMA_CIRURGICO:4','GCS de trauma registrado','Percentual de GCS de trauma com entradas completas','processo','GCS-Trauma com entradas completas','Total de GCS-Trauma calculados','95','mensal',NULL,'F001'),
('escores_trauma_risco_cirurgico_v1','IQ_TRAUMA_CIRURGICO:5','ASA registrado na população cirúrgica','Percentual de ASA com população validada','processo','ASA com população validada','Total de ASA registrados','95','mensal',NULL,'F004'),
('escores_trauma_risco_cirurgico_v1','IQ_TRAUMA_CIRURGICO:6','POSSUM calculado na população cirúrgica','Percentual de POSSUM com população validada','processo','POSSUM com população validada','Total de POSSUM calculados','95','mensal',NULL,'F005'),
('escores_trauma_risco_cirurgico_v1','IQ_TRAUMA_CIRURGICO:7','EuroSCORE-II na população cirúrgica cardíaca','Percentual de EuroSCORE-II com população validada','processo','EuroSCORE-II com população validada','Total de EuroSCORE-II calculados','95','mensal',NULL,'F006'),
('escores_trauma_risco_cirurgico_v1','IQ_TRAUMA_CIRURGICO:8','RCRI na cirurgia não cardíaca','Percentual de RCRI com população validada','processo','RCRI com população validada','Total de RCRI calculados','95','mensal',NULL,'F007'),
('escores_trauma_risco_cirurgico_v1','IQ_TRAUMA_CIRURGICO:9','APACHE-II na população de UTI','Percentual de APACHE-II com população validada','processo','APACHE-II com população validada','Total de APACHE-II calculados','95','mensal',NULL,'F008'),
('escores_trauma_risco_cirurgico_v1','IQ_TRAUMA_CIRURGICO:10','SAPS-II na população de UTI','Percentual de SAPS-II com população validada','processo','SAPS-II com população validada','Total de SAPS-II calculados','95','mensal',NULL,'F009'),
('escores_trauma_risco_cirurgico_v1','IQ_TRAUMA_CIRURGICO:11','Trauma grave com ISS >=16','Percentual de trauma grave identificado com ISS >=16','resultado','Trauma grave com ISS >=16','Total de trauma grave','90','mensal',NULL,'F001'),
('escores_trauma_risco_cirurgico_v1','IQ_TRAUMA_CIRURGICO:12','Cirurgia de alto risco com ASA >=III','Percentual de cirurgia de alto risco com ASA >=III','resultado','Cirurgia de alto risco com ASA >=III','Total de cirurgia de alto risco','90','mensal',NULL,'F004')
ON CONFLICT (lote_id, codigo_indicador) DO NOTHING;

CREATE OR REPLACE VIEW public.vw_dashboard_escores_global_completo
WITH (security_invoker = true) AS
SELECT
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos WHERE nome_escore IN ('ISS','RTS','TRISS','GCS-Trauma')) AS total_trauma,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos WHERE nome_escore IN ('ASA','POSSUM','EuroSCORE-II','RCRI','APACHE-II','SAPS-II')) AS total_cirurgicos,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos WHERE nome_escore IN ('Bishop','Apgar','MEWS-OB')) AS total_obstetricos,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos WHERE nome_escore IN ('BPS','CPOT','FLACC','Wong-Baker')) AS total_dor,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos WHERE nome_escore IN ('pSOFA','PELOD-2','PRISM-IV','PIM3','GCS-Pediatrico','NIHSS-Pediatrico')) AS total_pediatricos,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos WHERE nome_escore IN ('CFS','FRAIL','4AT-Geriatrico','Hipotensao-Ortostatica','GDS-15','Lawton-Brody','Katz','TUG','Morse-Fall-Scale','Carga-Anticolinergica','Fried-Fenotipo')) AS total_geriatricos,
  (SELECT count(*) FROM public.audit_escores_clinicos WHERE populacao_validada) AS total_calculos_validos,
  (SELECT count(*) FROM public.audit_escores_clinicos WHERE NOT populacao_validada) AS total_calculos_invalidos,
  (SELECT count(*) FROM public.audit_escores_clinicos WHERE NOT entradas_completas) AS total_entradas_incompletas,
  round(100.0 * (SELECT count(*) FROM public.audit_escores_clinicos WHERE populacao_validada)
    / nullif((SELECT count(*) FROM public.audit_escores_clinicos), 0), 1) AS taxa_global_validacao_pct;