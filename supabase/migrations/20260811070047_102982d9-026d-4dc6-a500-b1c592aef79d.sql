DROP FUNCTION IF EXISTS public.fn_calcular_ottawa_tornozelo(text,integer,boolean,boolean,boolean,boolean,boolean,boolean,boolean,text);

CREATE OR REPLACE FUNCTION public.fn_calcular_ottawa_tornozelo(
  p_atendimento_id text, p_idade integer,
  p_dor_maleolar boolean, p_dor_mediope boolean,
  p_dor_maleolo_lateral boolean, p_dor_maleolo_medial boolean,
  p_dor_base_5mt boolean, p_dor_navicular boolean,
  p_incapaz_apoiar boolean, p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, rx_indicado boolean, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_rx boolean; v_cat text; v_resp text;
  v_lim text := 'Regra de Ottawa para tornozelo e pe: aplicavel a partir de 2 anos, em trauma de ate 10 dias, sem intoxicacao, sem deficit sensitivo e sem outras lesoes que distraiam. Regra negativa: radiografia nao indicada e tratamento conservador.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('Ottawa-Tornozelo', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::boolean, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_dor_maleolar IS NULL OR p_dor_mediope IS NULL OR p_dor_maleolo_lateral IS NULL
     OR p_dor_maleolo_medial IS NULL OR p_dor_base_5mt IS NULL OR p_dor_navicular IS NULL
     OR p_incapaz_apoiar IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::boolean, NULL::text,
      'Todas as entradas da regra de Ottawa sao obrigatorias'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  v_rx := (p_dor_maleolar AND (p_dor_maleolo_lateral OR p_dor_maleolo_medial OR p_incapaz_apoiar))
       OR (p_dor_mediope AND (p_dor_base_5mt OR p_dor_navicular OR p_incapaz_apoiar));

  IF v_rx THEN
    v_cat := 'rx_indicado';
    v_resp := 'Radiografia de tornozelo e/ou pe indicada conforme a zona acometida';
  ELSE
    v_cat := 'rx_nao_indicado';
    v_resp := 'Radiografia nao indicada; tratamento conservador, analgesia e retorno se piora';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'Ottawa-Tornozelo', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'dor_maleolar', p_dor_maleolar, 'dor_mediope', p_dor_mediope,
                        'dor_maleolo_lateral', p_dor_maleolo_lateral, 'dor_maleolo_medial', p_dor_maleolo_medial,
                        'dor_base_5mt', p_dor_base_5mt, 'dor_navicular', p_dor_navicular,
                        'incapaz_apoiar', p_incapaz_apoiar),
     true, CASE WHEN v_rx THEN 1 ELSE 0 END, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_rx, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;