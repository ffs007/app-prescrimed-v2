CREATE TABLE IF NOT EXISTS public.stg_faixas_validacao_obstetrica_dor (
  id BIGSERIAL PRIMARY KEY,
  lote_id TEXT NOT NULL,
  escore_nome TEXT NOT NULL,
  populacao TEXT NOT NULL,
  idade_min_anos NUMERIC,
  idade_max_anos NUMERIC,
  idade_min_dias INTEGER,
  idade_max_dias INTEGER,
  contexto_gestacional TEXT,
  populacao_validada BOOLEAN DEFAULT FALSE,
  motivo_invalidacao TEXT,
  versao_escore TEXT,
  fonte_id TEXT,
  trecho_citado TEXT,
  revisao_humana_obrigatoria BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stg_faixas_validacao_obstetrica_dor TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.stg_faixas_validacao_obstetrica_dor_id_seq TO authenticated;
GRANT ALL ON public.stg_faixas_validacao_obstetrica_dor TO service_role;
GRANT ALL ON SEQUENCE public.stg_faixas_validacao_obstetrica_dor_id_seq TO service_role;

ALTER TABLE public.stg_faixas_validacao_obstetrica_dor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faixas_obst_dor_select_auth" ON public.stg_faixas_validacao_obstetrica_dor
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "faixas_obst_dor_admin_write" ON public.stg_faixas_validacao_obstetrica_dor
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_faixas_obst_dor_updated BEFORE UPDATE ON public.stg_faixas_validacao_obstetrica_dor
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_faixas_obst_dor_populacao ON public.stg_faixas_validacao_obstetrica_dor (populacao);
CREATE INDEX IF NOT EXISTS idx_faixas_obst_dor_escore ON public.stg_faixas_validacao_obstetrica_dor (escore_nome, contexto_gestacional);

INSERT INTO public.stg_faixas_validacao_obstetrica_dor
(lote_id, escore_nome, populacao, idade_min_anos, idade_max_anos, idade_min_dias, idade_max_dias, contexto_gestacional, populacao_validada, versao_escore, fonte_id)
VALUES
('escores_obstetricos_dor_v1','Bishop','gestante_trabalho_parto',18,50,NULL,NULL,'gestacao_37_42_semanas',TRUE,'Bishop_1964','F001'),
('escores_obstetricos_dor_v1','Bishop','gestante_pretermo',18,50,NULL,NULL,'gestacao_24_36_semanas',FALSE,'Bishop_1964','F001'),
('escores_obstetricos_dor_v1','Bishop','puerpera',18,50,NULL,NULL,'puerperio',FALSE,'Bishop_1964','F001'),
('escores_obstetricos_dor_v1','Bishop','nao_gestante',18,50,NULL,NULL,'nao_gestante',FALSE,'Bishop_1964','F001'),
('escores_obstetricos_dor_v1','Apgar','neonato_1min',NULL,NULL,0,0,'parto_1min',TRUE,'Apgar_1952','F002'),
('escores_obstetricos_dor_v1','Apgar','neonato_5min',NULL,NULL,0,0,'parto_5min',TRUE,'Apgar_1952','F002'),
('escores_obstetricos_dor_v1','Apgar','neonato_10min',NULL,NULL,0,0,'parto_10min',TRUE,'Apgar_1952','F002'),
('escores_obstetricos_dor_v1','Apgar','neonato_pos_10min',NULL,NULL,11,NULL,'pos_10min',FALSE,'Apgar_1952','F002'),
('escores_obstetricos_dor_v1','Apgar','adulto',18,NULL,NULL,NULL,'nao_aplicavel',FALSE,'Apgar_1952','F002'),
('escores_obstetricos_dor_v1','MEWS-OB','gestante_internada',18,50,NULL,NULL,'gestacao_qualquer',TRUE,'MEWS-OB_2018','F003'),
('escores_obstetricos_dor_v1','MEWS-OB','puerpera_internada',18,50,NULL,NULL,'puerperio_0_42_dias',TRUE,'MEWS-OB_2018','F003'),
('escores_obstetricos_dor_v1','MEWS-OB','nao_gestante',18,NULL,NULL,NULL,'nao_aplicavel',FALSE,'MEWS-OB_2018','F003'),
('escores_obstetricos_dor_v1','MEWS-OB','adulto_geral',18,NULL,NULL,NULL,'nao_aplicavel',FALSE,'MEWS-OB_2018','F003'),
('escores_obstetricos_dor_v1','BPS','adulto_intubado',18,NULL,NULL,NULL,'uti_intubado',TRUE,'BPS_2002','F004'),
('escores_obstetricos_dor_v1','BPS','adulto_sedado',18,NULL,NULL,NULL,'uti_sedado',TRUE,'BPS_2002','F004'),
('escores_obstetricos_dor_v1','BPS','adulto_acordado',18,NULL,NULL,NULL,'acordado',FALSE,'BPS_2002','F004'),
('escores_obstetricos_dor_v1','BPS','pediatrico',NULL,NULL,0,6570,'nao_aplicavel',FALSE,'BPS_2002','F004'),
('escores_obstetricos_dor_v1','CPOT','adulto_intubado',18,NULL,NULL,NULL,'uti_intubado',TRUE,'CPOT_2006','F005'),
('escores_obstetricos_dor_v1','CPOT','adulto_nao_intubado',18,NULL,NULL,NULL,'uti_nao_intubado',TRUE,'CPOT_2006','F005'),
('escores_obstetricos_dor_v1','CPOT','adulto_acordado',18,NULL,NULL,NULL,'acordado',FALSE,'CPOT_2006','F005'),
('escores_obstetricos_dor_v1','CPOT','pediatrico',NULL,NULL,0,6570,'nao_aplicavel',FALSE,'CPOT_2006','F005'),
('escores_obstetricos_dor_v1','FLACC','crianca_2m_7a',NULL,NULL,60,2555,'nao_aplicavel',TRUE,'FLACC_1997','F006'),
('escores_obstetricos_dor_v1','FLACC','neonato',NULL,NULL,0,59,'nao_aplicavel',FALSE,'FLACC_1997','F006'),
('escores_obstetricos_dor_v1','FLACC','adulto',18,NULL,NULL,NULL,'nao_aplicavel',FALSE,'FLACC_1997','F006'),
('escores_obstetricos_dor_v1','Wong-Baker','crianca_3a_18a',NULL,NULL,1095,6570,'nao_aplicavel',TRUE,'Wong-Baker_1988','F006'),
('escores_obstetricos_dor_v1','Wong-Baker','adulto_adaptado',18,NULL,NULL,NULL,'adulto_com_dificuldade_comunicacao',TRUE,'Wong-Baker_1988','F006'),
('escores_obstetricos_dor_v1','Wong-Baker','crianca_menor_3a',NULL,NULL,0,1094,'nao_aplicavel',FALSE,'Wong-Baker_1988','F006');

CREATE OR REPLACE FUNCTION public.fn_validar_populacao_obstetrica(
  p_escore_nome TEXT,
  p_idade_anos INTEGER,
  p_contexto_gestacional TEXT DEFAULT 'nao_gestante'
)
RETURNS TABLE(
  populacao_validada BOOLEAN,
  populacao TEXT,
  motivo TEXT,
  versao_escore TEXT
)
LANGUAGE plpgsql
SET search_path = public
AS $fn$
DECLARE
  v_faixa RECORD;
BEGIN
  SELECT * INTO v_faixa
  FROM public.stg_faixas_validacao_obstetrica_dor
  WHERE escore_nome = p_escore_nome
    AND contexto_gestacional = p_contexto_gestacional
    AND (idade_min_anos IS NULL OR p_idade_anos >= idade_min_anos)
    AND (idade_max_anos IS NULL OR p_idade_anos <= idade_max_anos)
  LIMIT 1;

  IF FOUND THEN
      RETURN QUERY SELECT v_faixa.populacao_validada, v_faixa.populacao, v_faixa.motivo_invalidacao, v_faixa.versao_escore;
  ELSE
      RETURN QUERY SELECT FALSE, 'Nao classificado'::TEXT, 'Idade ou contexto fora das faixas mapeadas'::TEXT, NULL::TEXT;
  END IF;
END;
$fn$;

CREATE OR REPLACE VIEW public.vw_escores_obstetricos_resumo
WITH (security_invoker = true) AS
SELECT
  nome_escore,
  count(*) AS total_calculos,
  count(*) FILTER (WHERE populacao_validada) AS populacao_valida,
  count(*) FILTER (WHERE entradas_completas) AS entradas_completas,
  round(100.0 * count(*) FILTER (WHERE populacao_validada) / nullif(count(*), 0), 1) AS taxa_populacao_valida_pct,
  round(100.0 * count(*) FILTER (WHERE entradas_completas) / nullif(count(*), 0), 1) AS taxa_entradas_completas_pct
FROM public.audit_escores_clinicos
WHERE nome_escore IN ('Bishop','Apgar','MEWS-OB')
GROUP BY nome_escore
ORDER BY total_calculos DESC;

CREATE OR REPLACE VIEW public.vw_escores_dor_resumo
WITH (security_invoker = true) AS
SELECT
  nome_escore,
  count(*) AS total_calculos,
  count(*) FILTER (WHERE populacao_validada) AS populacao_valida,
  count(*) FILTER (WHERE entradas_completas) AS entradas_completas,
  round(100.0 * count(*) FILTER (WHERE populacao_validada) / nullif(count(*), 0), 1) AS taxa_populacao_valida_pct,
  round(100.0 * count(*) FILTER (WHERE entradas_completas) / nullif(count(*), 0), 1) AS taxa_entradas_completas_pct,
  round(avg(resultado), 1) AS resultado_medio,
  round(max(resultado), 1) AS resultado_maximo
FROM public.audit_escores_clinicos
WHERE nome_escore IN ('BPS','CPOT','FLACC','Wong-Baker')
GROUP BY nome_escore
ORDER BY total_calculos DESC;

CREATE OR REPLACE VIEW public.vw_dashboard_escores_global
WITH (security_invoker = true) AS
SELECT
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos WHERE nome_escore IN ('pSOFA','PELOD-2','PRISM-IV','PIM3','GCS-Pediatrico','NIHSS-Pediatrico')) AS total_pediatricos,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos WHERE nome_escore IN ('CFS','FRAIL','4AT-Geriatrico','Hipotensao-Ortostatica','GDS-15','Lawton-Brody','Katz','TUG','Morse-Fall-Scale','Carga-Anticolinergica','Fried-Fenotipo')) AS total_geriatricos,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos WHERE nome_escore IN ('Bishop','Apgar','MEWS-OB')) AS total_obstetricos,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos WHERE nome_escore IN ('BPS','CPOT','FLACC','Wong-Baker')) AS total_dor,
  (SELECT count(*) FROM public.audit_escores_clinicos) AS total_calculos,
  (SELECT count(*) FROM public.audit_escores_clinicos WHERE populacao_validada) AS total_calculos_validos,
  (SELECT count(*) FROM public.audit_escores_clinicos WHERE NOT populacao_validada) AS total_calculos_invalidos,
  (SELECT count(*) FROM public.audit_escores_clinicos WHERE NOT entradas_completas) AS total_entradas_incompletas,
  (SELECT count(*) FROM public.audit_escores_clinicos WHERE red_flag_override) AS total_overrides,
  (SELECT count(*) FROM public.audit_escores_clinicos WHERE divergencia) AS total_divergencias;

INSERT INTO public.indicadores_qualidade_ps
(lote_id, codigo_indicador, nome, descricao, tipo, formula_numerador, formula_denominador, meta_pct, periodicidade, protocolo_id, fonte_id)
VALUES
('escores_obstetricos_dor_v1','IQOBST_DOR:1','Bishop calculado na populacao obstetrica','Percentual de Bishop na populacao obstetrica validada','processo','Bishop com populacao validada','Total de Bishop calculados','95','mensal',NULL,'F001'),
('escores_obstetricos_dor_v1','IQOBST_DOR:2','Apgar calculado no tempo correto','Percentual de Apgar calculado em 1 e 5 minutos','processo','Apgar em tempo correto','Total de Apgar calculados','95','mensal',NULL,'F002'),
('escores_obstetricos_dor_v1','IQOBST_DOR:3','MEWS-OB calculado na populacao obstetrica','Percentual de MEWS-OB na populacao obstetrica validada','processo','MEWS-OB com populacao validada','Total de MEWS-OB calculados','95','mensal',NULL,'F003')
ON CONFLICT (lote_id, codigo_indicador) DO NOTHING;

-- 1. APGAR
CREATE OR REPLACE FUNCTION public.fn_calcular_apgar(
  p_atendimento_id TEXT,
  p_idade_dias INTEGER,
  p_tempo_min INTEGER,
  p_frequencia_cardiaca_pts INTEGER,
  p_esforco_respiratorio_pts INTEGER,
  p_reflexo_pts INTEGER,
  p_tonus_muscular_pts INTEGER,
  p_cor_pts INTEGER,
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(
  status TEXT, total INTEGER, categoria TEXT, resposta TEXT,
  populacao_validada BOOLEAN, populacao TEXT, versao TEXT, limitacoes TEXT
)
LANGUAGE plpgsql
SET search_path = public
AS $fn$
DECLARE
  v_total INTEGER;
  v_categoria TEXT;
  v_resposta TEXT;
  v_pop_valida BOOLEAN;
  v_populacao TEXT;
  v_motivo TEXT;
  v_versao TEXT;
  v_contexto TEXT;
  v_limitacoes TEXT := 'Apgar é avaliado em 1 e 5 minutos de vida (e a cada 5 min adicionais se < 7). Não prediz desfecho neurológico de longo prazo isoladamente.';
BEGIN
  IF p_tempo_min = 1 THEN v_contexto := 'parto_1min';
  ELSIF p_tempo_min = 5 THEN v_contexto := 'parto_5min';
  ELSIF p_tempo_min = 10 THEN v_contexto := 'parto_10min';
  ELSE v_contexto := 'pos_10min';
  END IF;

  SELECT f.populacao_validada, f.populacao, f.motivo, f.versao_escore
  INTO v_pop_valida, v_populacao, v_motivo, v_versao
  FROM public.fn_validar_populacao_obstetrica('Apgar', 0, v_contexto) f;

  IF NOT v_pop_valida THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::INTEGER, NULL::TEXT, v_motivo::TEXT, FALSE, v_populacao, v_versao, v_limitacoes;
    RETURN;
  END IF;

  IF p_frequencia_cardiaca_pts IS NULL OR p_esforco_respiratorio_pts IS NULL OR p_reflexo_pts IS NULL OR p_tonus_muscular_pts IS NULL OR p_cor_pts IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::INTEGER, NULL::TEXT, 'Todas as 5 entradas (0-2 pontos) são obrigatórias.'::TEXT, v_pop_valida, v_populacao, v_versao, v_limitacoes;
    RETURN;
  END IF;

  IF p_frequencia_cardiaca_pts > 2 OR p_esforco_respiratorio_pts > 2 OR p_reflexo_pts > 2 OR p_tonus_muscular_pts > 2 OR p_cor_pts > 2 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::TEXT, NULL::INTEGER, NULL::TEXT, 'Os componentes do Apgar devem ser pontuados de 0 a 2.'::TEXT, v_pop_valida, v_populacao, v_versao, v_limitacoes;
    RETURN;
  END IF;

  v_total := p_frequencia_cardiaca_pts + p_esforco_respiratorio_pts + p_reflexo_pts + p_tonus_muscular_pts + p_cor_pts;

  IF v_total >= 7 THEN
    v_categoria := 'boa_vitalidade';
    v_resposta := 'Boa vitalidade; rotina de cuidados com o recém-nascido.';
  ELSIF v_total >= 4 AND v_total <= 6 THEN
    v_categoria := 'asfixia_moderada';
    v_resposta := 'Asfixia moderada; requer estimulação, oxigênio e reavaliação estrita.';
  ELSE
    v_categoria := 'asfixia_grave';
    v_resposta := 'Asfixia grave; iniciar protocolo de reanimação neonatal imediatamente.';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES
    (p_atendimento_id, 'Apgar', v_versao, v_pop_valida, TRUE, v_total, v_categoria, v_resposta, p_profissional, 'escores_obstetricos_dor_v1');

  RETURN QUERY SELECT 'CALCULATED'::TEXT, v_total, v_categoria, v_resposta, v_pop_valida, v_populacao, v_versao, v_limitacoes;
END;
$fn$;

-- 2. MEWS-OB
CREATE OR REPLACE FUNCTION public.fn_calcular_mews_ob(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER,
  p_contexto TEXT,
  p_pas NUMERIC,
  p_fc INTEGER,
  p_fr INTEGER,
  p_temperatura NUMERIC,
  p_consciencia TEXT,
  p_diurese_ml_h NUMERIC DEFAULT NULL,
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(
  status TEXT, total INTEGER, categoria TEXT, resposta TEXT,
  populacao_validada BOOLEAN, populacao TEXT, versao TEXT, limitacoes TEXT
)
LANGUAGE plpgsql
SET search_path = public
AS $fn$
DECLARE
  v_total INTEGER;
  v_pas_pts INTEGER := 0;
  v_fc_pts INTEGER := 0;
  v_fr_pts INTEGER := 0;
  v_temp_pts INTEGER := 0;
  v_consc_pts INTEGER := 0;
  v_diurese_pts INTEGER := 0;
  v_categoria TEXT;
  v_resposta TEXT;
  v_pop_valida BOOLEAN;
  v_populacao TEXT;
  v_motivo TEXT;
  v_versao TEXT;
  v_limitacoes TEXT := 'Valores fisiológicos mudam na gestação (PAS normal pode ser menor, FC pode ser maior). MEWS não substitui julgamento clínico.';
BEGIN
  SELECT f.populacao_validada, f.populacao, f.motivo, f.versao_escore
  INTO v_pop_valida, v_populacao, v_motivo, v_versao
  FROM public.fn_validar_populacao_obstetrica('MEWS-OB', p_idade_anos, p_contexto) f;

  IF NOT v_pop_valida THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::INTEGER, NULL::TEXT, v_motivo::TEXT, FALSE, v_populacao, v_versao, v_limitacoes;
    RETURN;
  END IF;

  IF p_pas IS NULL OR p_fc IS NULL OR p_fr IS NULL OR p_temperatura IS NULL OR p_consciencia IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::INTEGER, NULL::TEXT, 'PAS, FC, FR, Temperatura e Consciência são obrigatórios.'::TEXT, v_pop_valida, v_populacao, v_versao, v_limitacoes;
    RETURN;
  END IF;

  IF p_pas >= 111 THEN v_pas_pts := 0;
  ELSIF p_pas >= 101 AND p_pas <= 110 THEN v_pas_pts := 1;
  ELSIF p_pas >= 91 AND p_pas <= 100 THEN v_pas_pts := 2;
  ELSIF p_pas >= 81 AND p_pas <= 90 THEN v_pas_pts := 3;
  ELSE v_pas_pts := 4;
  END IF;

  IF p_fc >= 50 AND p_fc <= 100 THEN v_fc_pts := 0;
  ELSIF p_fc >= 101 AND p_fc <= 110 THEN v_fc_pts := 1;
  ELSIF p_fc >= 111 AND p_fc <= 130 THEN v_fc_pts := 2;
  ELSIF p_fc >= 131 AND p_fc <= 140 THEN v_fc_pts := 3;
  ELSE v_fc_pts := 4;
  END IF;

  IF p_fr >= 12 AND p_fr <= 20 THEN v_fr_pts := 0;
  ELSIF p_fr >= 21 AND p_fr <= 24 THEN v_fr_pts := 1;
  ELSIF p_fr >= 25 AND p_fr <= 29 THEN v_fr_pts := 2;
  ELSE v_fr_pts := 3;
  END IF;

  IF p_temperatura >= 35.1 AND p_temperatura <= 38.0 THEN v_temp_pts := 0;
  ELSIF p_temperatura >= 38.1 AND p_temperatura <= 38.5 THEN v_temp_pts := 1;
  ELSIF p_temperatura >= 38.6 AND p_temperatura <= 39.0 THEN v_temp_pts := 2;
  ELSE v_temp_pts := 3;
  END IF;

  IF p_consciencia = 'alerta' THEN v_consc_pts := 0;
  ELSE v_consc_pts := 3;
  END IF;

  IF p_diurese_ml_h IS NOT NULL THEN
    IF p_diurese_ml_h >= 30 THEN v_diurese_pts := 0;
    ELSIF p_diurese_ml_h >= 15 AND p_diurese_ml_h < 30 THEN v_diurese_pts := 2;
    ELSE v_diurese_pts := 3;
    END IF;
  END IF;

  v_total := v_pas_pts + v_fc_pts + v_fr_pts + v_temp_pts + v_consc_pts + v_diurese_pts;

  IF v_total >= 5 THEN
    v_categoria := 'resposta_emergencial';
    v_resposta := 'Risco elevado. Acionar equipe obstétrica de emergência imediatamente.';
  ELSIF v_total >= 3 AND v_total <= 4 THEN
    v_categoria := 'resposta_urgente';
    v_resposta := 'Risco moderado. Avaliação médica urgente necessária.';
  ELSIF v_total >= 1 AND v_total <= 2 THEN
    v_categoria := 'monitorizacao_alterada';
    v_resposta := 'Alteração leve. Aumentar frequência de monitorização vital.';
  ELSE
    v_categoria := 'normal';
    v_resposta := 'Parâmetros fisiológicos normais. Monitorização de rotina.';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES
    (p_atendimento_id, 'MEWS-OB', v_versao, v_pop_valida, TRUE, v_total, v_categoria, v_resposta, p_profissional, 'escores_obstetricos_dor_v1');

  RETURN QUERY SELECT 'CALCULATED'::TEXT, v_total, v_categoria, v_resposta, v_pop_valida, v_populacao, v_versao, v_limitacoes;
END;
$fn$;

-- 3. BPS
CREATE OR REPLACE FUNCTION public.fn_calcular_bps(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER,
  p_intubado BOOLEAN,
  p_expressao_facial INTEGER,
  p_movimento_membros INTEGER,
  p_conformidade_ventilador INTEGER,
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(
  status TEXT, total INTEGER, categoria TEXT, resposta TEXT,
  populacao_validada BOOLEAN, populacao TEXT, versao TEXT, limitacoes TEXT
)
LANGUAGE plpgsql
SET search_path = public
AS $fn$
DECLARE
  v_total INTEGER;
  v_categoria TEXT;
  v_resposta TEXT;
  v_pop_valida BOOLEAN;
  v_populacao TEXT;
  v_motivo TEXT;
  v_versao TEXT;
  v_limitacoes TEXT := 'Não usar em pacientes acordados que conseguem autorrelatar dor (usar EVA/EN). Não validado em pediatria.';
BEGIN
  SELECT f.populacao_validada, f.populacao, f.motivo, f.versao_escore
  INTO v_pop_valida, v_populacao, v_motivo, v_versao
  FROM public.fn_validar_populacao_obstetrica('BPS', p_idade_anos, CASE WHEN p_intubado THEN 'uti_intubado' ELSE 'acordado' END) f;

  IF NOT v_pop_valida THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::INTEGER, NULL::TEXT, COALESCE(v_motivo, 'BPS não validado para esta população.')::TEXT, FALSE, v_populacao, v_versao, v_limitacoes;
    RETURN;
  END IF;

  IF p_expressao_facial IS NULL OR p_movimento_membros IS NULL OR p_conformidade_ventilador IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::INTEGER, NULL::TEXT, 'Todas as entradas (1-4) são obrigatórias.'::TEXT, v_pop_valida, v_populacao, v_versao, v_limitacoes;
    RETURN;
  END IF;

  IF p_expressao_facial < 1 OR p_expressao_facial > 4 OR p_movimento_membros < 1 OR p_movimento_membros > 4 OR p_conformidade_ventilador < 1 OR p_conformidade_ventilador > 4 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::TEXT, NULL::INTEGER, NULL::TEXT, 'Cada componente do BPS deve receber de 1 a 4 pontos.'::TEXT, v_pop_valida, v_populacao, v_versao, v_limitacoes;
    RETURN;
  END IF;

  v_total := p_expressao_facial + p_movimento_membros + p_conformidade_ventilador;

  IF v_total > 5 THEN
    v_categoria := 'dor_significativa';
    v_resposta := 'Dor significativa (>5). Considerar intervenção analgésica e reavaliar resposta.';
  ELSE
    v_categoria := 'dor_controlada';
    v_resposta := 'Dor controlada ou ausente (<=5). Manter monitoramento regular.';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES
    (p_atendimento_id, 'BPS', v_versao, v_pop_valida, TRUE, v_total, v_categoria, v_resposta, p_profissional, 'escores_obstetricos_dor_v1');

  RETURN QUERY SELECT 'CALCULATED'::TEXT, v_total, v_categoria, v_resposta, v_pop_valida, v_populacao, v_versao, v_limitacoes;
END;
$fn$;

-- 4. CPOT
CREATE OR REPLACE FUNCTION public.fn_calcular_cpot(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER,
  p_intubado BOOLEAN,
  p_expressao_facial INTEGER,
  p_movimentos_corporais INTEGER,
  p_tensao_muscular INTEGER,
  p_conformidade_ventilador INTEGER DEFAULT NULL,
  p_vocalizacao INTEGER DEFAULT NULL,
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(
  status TEXT, total INTEGER, categoria TEXT, resposta TEXT,
  populacao_validada BOOLEAN, populacao TEXT, versao TEXT, limitacoes TEXT
)
LANGUAGE plpgsql
SET search_path = public
AS $fn$
DECLARE
  v_total INTEGER;
  v_categoria TEXT;
  v_resposta TEXT;
  v_pop_valida BOOLEAN;
  v_populacao TEXT;
  v_motivo TEXT;
  v_versao TEXT;
  v_limitacoes TEXT := 'Não usar em pacientes que podem autorrelatar dor. Validado para adultos em UTI (intubados ou não).';
BEGIN
  SELECT f.populacao_validada, f.populacao, f.motivo, f.versao_escore
  INTO v_pop_valida, v_populacao, v_motivo, v_versao
  FROM public.fn_validar_populacao_obstetrica('CPOT', p_idade_anos, CASE WHEN p_intubado THEN 'uti_intubado' ELSE 'uti_nao_intubado' END) f;

  IF NOT v_pop_valida THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::INTEGER, NULL::TEXT, COALESCE(v_motivo, 'CPOT não validado para esta população.')::TEXT, FALSE, v_populacao, v_versao, v_limitacoes;
    RETURN;
  END IF;

  IF p_expressao_facial IS NULL OR p_movimentos_corporais IS NULL OR p_tensao_muscular IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::INTEGER, NULL::TEXT, 'Expressão facial, movimentos e tensão muscular são obrigatórios (0-2).'::TEXT, v_pop_valida, v_populacao, v_versao, v_limitacoes;
    RETURN;
  END IF;

  IF p_intubado AND p_conformidade_ventilador IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::INTEGER, NULL::TEXT, 'Em paciente intubado, a conformidade com o ventilador (0-2) é obrigatória.'::TEXT, v_pop_valida, v_populacao, v_versao, v_limitacoes;
    RETURN;
  END IF;

  IF NOT p_intubado AND p_vocalizacao IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::INTEGER, NULL::TEXT, 'Em paciente não intubado, a vocalização (0-2) é obrigatória.'::TEXT, v_pop_valida, v_populacao, v_versao, v_limitacoes;
    RETURN;
  END IF;

  v_total := p_expressao_facial + p_movimentos_corporais + p_tensao_muscular;

  IF p_intubado THEN
    v_total := v_total + p_conformidade_ventilador;
  ELSE
    v_total := v_total + p_vocalizacao;
  END IF;

  IF v_total > 2 THEN
    v_categoria := 'dor_significativa';
    v_resposta := 'Dor significativa (>2). Intervir com analgesia e reavaliar conforme protocolo.';
  ELSE
    v_categoria := 'dor_ausente_leve';
    v_resposta := 'Dor ausente ou leve (<=2). Manter vigilância e conforto.';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES
    (p_atendimento_id, 'CPOT', v_versao, v_pop_valida, TRUE, v_total, v_categoria, v_resposta, p_profissional, 'escores_obstetricos_dor_v1');

  RETURN QUERY SELECT 'CALCULATED'::TEXT, v_total, v_categoria, v_resposta, v_pop_valida, v_populacao, v_versao, v_limitacoes;
END;
$fn$;