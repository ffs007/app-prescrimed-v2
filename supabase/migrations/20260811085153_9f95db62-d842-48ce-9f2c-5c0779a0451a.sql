DROP FUNCTION IF EXISTS public.fn_escore_versao_atual(text);
DROP FUNCTION IF EXISTS public.fn_registrar_conduta_real(bigint, text, text, boolean);

CREATE OR REPLACE FUNCTION public.fn_registrar_conduta_real(
  p_auditoria_id BIGINT,
  p_conduta_real TEXT,
  p_motivo_divergencia TEXT DEFAULT NULL,
  p_profissional TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path = public
AS $fn$
DECLARE
  v_conduta_sugerida TEXT;
  v_divergencia BOOLEAN := FALSE;
BEGIN
  SELECT conduta_sugerida INTO v_conduta_sugerida
  FROM public.audit_escores_clinicos
  WHERE id = p_auditoria_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF p_conduta_real IS DISTINCT FROM v_conduta_sugerida THEN
    v_divergencia := TRUE;
  END IF;

  UPDATE public.audit_escores_clinicos
  SET conduta_real = p_conduta_real,
      divergencia = v_divergencia,
      motivo_override = p_motivo_divergencia,
      profissional = COALESCE(p_profissional, profissional)
  WHERE id = p_auditoria_id;

  RETURN TRUE;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_escore_versao_atual(
  p_nome_escore TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $fn$
DECLARE
  v_versao TEXT;
BEGIN
  SELECT versao_escore INTO v_versao
  FROM public.stg_faixas_validacao_obstetrica_dor
  WHERE escore_nome = p_nome_escore
  LIMIT 1;

  RETURN COALESCE(v_versao, 'Nao_Mapeada');
END;
$fn$;

-- 1. FLACC
CREATE OR REPLACE FUNCTION public.fn_calcular_flacc(
  p_atendimento_id TEXT,
  p_idade_dias INTEGER,
  p_face INTEGER,
  p_pernas INTEGER,
  p_atividade INTEGER,
  p_choro INTEGER,
  p_consolabilidade INTEGER,
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
  v_limitacoes TEXT := 'Validado para 2 meses a 7 anos. Não usar em neonatos ou adultos. Observar a criança por 1-5 minutos.';
BEGIN
  SELECT f.populacao_validada, f.populacao, f.motivo_invalidacao, f.versao_escore
  INTO v_pop_valida, v_populacao, v_motivo, v_versao
  FROM public.stg_faixas_validacao_obstetrica_dor f
  WHERE f.escore_nome = 'FLACC'
    AND f.idade_min_dias IS NOT NULL
    AND p_idade_dias >= f.idade_min_dias
    AND (f.idade_max_dias IS NULL OR p_idade_dias <= f.idade_max_dias)
  ORDER BY f.populacao_validada DESC
  LIMIT 1;

  v_pop_valida := COALESCE(v_pop_valida, FALSE);

  IF NOT v_pop_valida THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::INTEGER, NULL::TEXT, 'Idade fora da faixa validada (2m a 7a)'::TEXT, FALSE, v_populacao, v_versao, v_limitacoes;
    RETURN;
  END IF;

  IF p_face IS NULL OR p_pernas IS NULL OR p_atividade IS NULL OR p_choro IS NULL OR p_consolabilidade IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::INTEGER, NULL::TEXT, 'Todas as 5 entradas (0-2) são obrigatórias'::TEXT, v_pop_valida, v_populacao, v_versao, v_limitacoes;
    RETURN;
  END IF;

  IF p_face > 2 OR p_pernas > 2 OR p_atividade > 2 OR p_choro > 2 OR p_consolabilidade > 2 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::TEXT, NULL::INTEGER, NULL::TEXT, 'Cada componente deve ser 0 a 2'::TEXT, v_pop_valida, v_populacao, v_versao, v_limitacoes;
    RETURN;
  END IF;

  v_total := p_face + p_pernas + p_atividade + p_choro + p_consolabilidade;

  IF v_total = 0 THEN
    v_categoria := 'sem_dor'; v_resposta := 'Confortável, sem dor aparente.';
  ELSIF v_total >= 1 AND v_total <= 3 THEN
    v_categoria := 'dor_leve'; v_resposta := 'Dor leve ou desconforto passageiro.';
  ELSIF v_total >= 4 AND v_total <= 7 THEN
    v_categoria := 'dor_moderada'; v_resposta := 'Dor moderada. Considerar analgesia farmacológica e medidas de conforto.';
  ELSE
    v_categoria := 'dor_intensa'; v_resposta := 'Dor intensa. Analgesia imediata recomendada.';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES
    (p_atendimento_id, 'FLACC', v_versao, v_pop_valida, TRUE, v_total, v_categoria, v_resposta, p_profissional, 'escores_obstetricos_dor_v1');

  RETURN QUERY SELECT 'CALCULATED'::TEXT, v_total, v_categoria, v_resposta, v_pop_valida, v_populacao, v_versao, v_limitacoes;
END;
$fn$;

-- 2. Wong-Baker FACES
CREATE OR REPLACE FUNCTION public.fn_calcular_wong_baker(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER,
  p_faces INTEGER,
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
  v_categoria TEXT;
  v_resposta TEXT;
  v_pop_valida BOOLEAN;
  v_populacao TEXT;
  v_motivo TEXT;
  v_versao TEXT;
  v_limitacoes TEXT := 'Validado para crianças >= 3 anos. Paciente deve ter capacidade cognitiva de apontar a face que representa sua dor.';
BEGIN
  IF p_idade_anos < 3 THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::INTEGER, NULL::TEXT, 'Criança < 3 anos. Utilize escala FLACC.'::TEXT, FALSE, NULL::TEXT, NULL::TEXT, v_limitacoes;
    RETURN;
  END IF;

  v_pop_valida := TRUE; v_versao := 'Wong-Baker_1988'; v_populacao := 'crianca_acima_3a_ou_adulto';

  IF p_faces IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::INTEGER, NULL::TEXT, 'Obrigatório selecionar uma Face.'::TEXT, v_pop_valida, v_populacao, v_versao, v_limitacoes;
    RETURN;
  END IF;

  IF p_faces NOT IN (0, 2, 4, 6, 8, 10) THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::TEXT, NULL::INTEGER, NULL::TEXT, 'O valor deve ser 0, 2, 4, 6, 8 ou 10.'::TEXT, v_pop_valida, v_populacao, v_versao, v_limitacoes;
    RETURN;
  END IF;

  IF p_faces = 0 THEN
    v_categoria := 'sem_dor'; v_resposta := 'Nenhuma dor.';
  ELSIF p_faces = 2 THEN
    v_categoria := 'dor_leve'; v_resposta := 'Dói só um pouco.';
  ELSIF p_faces = 4 THEN
    v_categoria := 'dor_leve_moderada'; v_resposta := 'Dói um pouco mais.';
  ELSIF p_faces = 6 THEN
    v_categoria := 'dor_moderada'; v_resposta := 'Dói ainda mais. Avaliar analgesia.';
  ELSIF p_faces = 8 THEN
    v_categoria := 'dor_intensa'; v_resposta := 'Dói muito. Analgesia necessária.';
  ELSE
    v_categoria := 'dor_maxima'; v_resposta := 'Dói o máximo possível. Intervenção imediata.';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES
    (p_atendimento_id, 'Wong-Baker', v_versao, v_pop_valida, TRUE, p_faces, v_categoria, v_resposta, p_profissional, 'escores_obstetricos_dor_v1');

  RETURN QUERY SELECT 'CALCULATED'::TEXT, p_faces, v_categoria, v_resposta, v_pop_valida, v_populacao, v_versao, v_limitacoes;
END;
$fn$;