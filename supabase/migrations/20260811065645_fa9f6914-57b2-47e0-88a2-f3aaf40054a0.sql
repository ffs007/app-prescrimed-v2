-- Ottawa tornozelo e pe
CREATE OR REPLACE FUNCTION public.fn_calcular_ottawa_tornozelo(
  p_atendimento_id text, p_idade integer,
  p_dor_maleolar boolean, p_dor_mediopé boolean,
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

  IF p_dor_maleolar IS NULL OR p_dor_mediopé IS NULL OR p_dor_maleolo_lateral IS NULL
     OR p_dor_maleolo_medial IS NULL OR p_dor_base_5mt IS NULL OR p_dor_navicular IS NULL
     OR p_incapaz_apoiar IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::boolean, NULL::text,
      'Todas as entradas da regra de Ottawa sao obrigatorias'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  v_rx := (p_dor_maleolar AND (p_dor_maleolo_lateral OR p_dor_maleolo_medial OR p_incapaz_apoiar))
       OR (p_dor_mediopé AND (p_dor_base_5mt OR p_dor_navicular OR p_incapaz_apoiar));

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
     jsonb_build_object('idade', p_idade, 'dor_maleolar', p_dor_maleolar, 'dor_mediope', p_dor_mediopé,
                        'dor_maleolo_lateral', p_dor_maleolo_lateral, 'dor_maleolo_medial', p_dor_maleolo_medial,
                        'dor_base_5mt', p_dor_base_5mt, 'dor_navicular', p_dor_navicular,
                        'incapaz_apoiar', p_incapaz_apoiar),
     true, CASE WHEN v_rx THEN 1 ELSE 0 END, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_rx, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;

-- Ottawa joelho
CREATE OR REPLACE FUNCTION public.fn_calcular_ottawa_joelho(
  p_atendimento_id text, p_idade integer, p_dor_cabeca_fibula boolean, p_dor_patela_isolada boolean,
  p_incapaz_flexao_90 boolean, p_incapaz_apoiar boolean, p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, rx_indicado boolean, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_rx boolean; v_cat text; v_resp text;
  v_lim text := 'Regra de Ottawa para joelho: aplicavel a partir de 2 anos em trauma agudo. Nao aplicar em trauma com mais de 7 dias, reavaliacao de lesao ja radiografada, intoxicacao ou deficit sensitivo. Regra negativa: radiografia nao indicada.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('Ottawa-Knee', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::boolean, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_dor_cabeca_fibula IS NULL OR p_dor_patela_isolada IS NULL
     OR p_incapaz_flexao_90 IS NULL OR p_incapaz_apoiar IS NULL OR p_idade IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::boolean, NULL::text,
      'Todas as entradas da regra de Ottawa do joelho sao obrigatorias'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  v_rx := (p_idade >= 55) OR p_dor_cabeca_fibula OR p_dor_patela_isolada
          OR p_incapaz_flexao_90 OR p_incapaz_apoiar;

  IF v_rx THEN
    v_cat := 'rx_indicado';
    v_resp := 'Radiografia de joelho indicada';
  ELSE
    v_cat := 'rx_nao_indicado';
    v_resp := 'Radiografia nao indicada; tratamento conservador, analgesia e retorno se piora';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'Ottawa-Knee', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'dor_cabeca_fibula', p_dor_cabeca_fibula,
                        'dor_patela_isolada', p_dor_patela_isolada, 'incapaz_flexao_90', p_incapaz_flexao_90,
                        'incapaz_apoiar', p_incapaz_apoiar),
     true, CASE WHEN v_rx THEN 1 ELSE 0 END, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_rx, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;

-- NEXUS
CREATE OR REPLACE FUNCTION public.fn_calcular_nexus(
  p_atendimento_id text, p_idade integer, p_dor_linha_media boolean, p_deficit_focal boolean,
  p_nivel_consciencia_alterado boolean, p_intoxicacao boolean, p_lesao_distratora boolean,
  p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, imagem_indicada boolean, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_img boolean; v_cat text; v_resp text;
  v_lim text := 'NEXUS: se os 5 criterios forem negativos, imagem cervical nao e indicada. Cautela em criancas menores de 2 anos e em idosos, nos quais a regra tem menor sensibilidade.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('NEXUS', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::boolean, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_dor_linha_media IS NULL OR p_deficit_focal IS NULL OR p_nivel_consciencia_alterado IS NULL
     OR p_intoxicacao IS NULL OR p_lesao_distratora IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::boolean, NULL::text,
      'Os 5 criterios NEXUS sao obrigatorios'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  v_img := p_dor_linha_media OR p_deficit_focal OR p_nivel_consciencia_alterado
        OR p_intoxicacao OR p_lesao_distratora;

  IF v_img THEN
    v_cat := 'imagem_indicada';
    v_resp := 'Ao menos um criterio NEXUS positivo: imagem cervical indicada e manter imobilizacao';
  ELSE
    v_cat := 'imagem_nao_indicada';
    v_resp := 'NEXUS negativo: imagem cervical nao indicada; liberar colar cervical';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'NEXUS', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'dor_linha_media', p_dor_linha_media, 'deficit_focal', p_deficit_focal,
                        'nivel_consciencia_alterado', p_nivel_consciencia_alterado, 'intoxicacao', p_intoxicacao,
                        'lesao_distratora', p_lesao_distratora),
     true, CASE WHEN v_img THEN 1 ELSE 0 END, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_img, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;

-- Canadian C-Spine
CREATE OR REPLACE FUNCTION public.fn_calcular_canadian_cspine(
  p_atendimento_id text, p_idade integer, p_mecanismo_perigoso boolean, p_parestesias boolean,
  p_fator_baixo_risco boolean, p_rotacao_45_graus boolean, p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, imagem_indicada boolean, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_img boolean; v_cat text; v_resp text;
  v_lim text := 'Canadian C-Spine aplica-se a pacientes alertas (Glasgow 15) e estaveis, a partir de 16 anos. Nao usar em trauma penetrante, deficit neurologico conhecido, doenca vertebral previa ou gestantes.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('Canadian-C-Spine', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::boolean, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_mecanismo_perigoso IS NULL OR p_parestesias IS NULL OR p_fator_baixo_risco IS NULL
     OR p_rotacao_45_graus IS NULL OR p_idade IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::boolean, NULL::text,
      'Entradas obrigatorias: idade, mecanismo perigoso, parestesias, fator de baixo risco e rotacao de 45 graus'::text,
      v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF (p_idade >= 65) OR p_mecanismo_perigoso OR p_parestesias THEN
    v_img := true;
    v_cat := 'imagem_indicada';
    v_resp := 'Fator de alto risco presente: imagem cervical indicada e manter imobilizacao';
  ELSIF NOT p_fator_baixo_risco THEN
    v_img := true;
    v_cat := 'imagem_indicada';
    v_resp := 'Sem fator de baixo risco que permita avaliar a mobilidade: imagem cervical indicada';
  ELSIF NOT p_rotacao_45_graus THEN
    v_img := true;
    v_cat := 'imagem_indicada';
    v_resp := 'Incapaz de rodar o pescoco 45 graus para ambos os lados: imagem cervical indicada';
  ELSE
    v_img := false;
    v_cat := 'imagem_nao_indicada';
    v_resp := 'Regra negativa: imagem cervical nao indicada; liberar colar cervical';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'Canadian-C-Spine', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'mecanismo_perigoso', p_mecanismo_perigoso, 'parestesias', p_parestesias,
                        'fator_baixo_risco', p_fator_baixo_risco, 'rotacao_45_graus', p_rotacao_45_graus),
     true, CASE WHEN v_img THEN 1 ELSE 0 END, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_img, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;

-- ABCD2
CREATE OR REPLACE FUNCTION public.fn_calcular_abcd2(
  p_atendimento_id text, p_idade integer, p_pas integer, p_pad integer,
  p_fraqueza_unilateral boolean, p_fala_sem_fraqueza boolean, p_duracao_min integer,
  p_diabetes boolean, p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_total int := 0; v_cat text; v_resp text;
  v_lim text := 'ABCD2 aplica-se a ataque isquemico transitorio, nao a AVC estabelecido. ABCD2 >=6: internacao e investigacao imediata. Escore baixo nao exclui necessidade de investigacao em alta suspeita.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('ABCD2', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_pas IS NULL OR p_pad IS NULL OR p_fraqueza_unilateral IS NULL OR p_fala_sem_fraqueza IS NULL
     OR p_duracao_min IS NULL OR p_diabetes IS NULL OR p_idade IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: idade, PAS, PAD, fraqueza unilateral, alteracao de fala, duracao e diabetes'::text,
      v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_idade >= 60 THEN v_total := v_total + 1; END IF;
  IF p_pas >= 140 OR p_pad >= 90 THEN v_total := v_total + 1; END IF;

  IF p_fraqueza_unilateral THEN v_total := v_total + 2;
  ELSIF p_fala_sem_fraqueza THEN v_total := v_total + 1;
  END IF;

  IF p_duracao_min >= 60 THEN v_total := v_total + 2;
  ELSIF p_duracao_min >= 10 THEN v_total := v_total + 1;
  END IF;

  IF p_diabetes THEN v_total := v_total + 1; END IF;

  IF v_total <= 3 THEN v_cat := 'baixo'; v_resp := 'Risco baixo; investigacao ambulatorial precoce e antiagregacao';
  ELSIF v_total <= 5 THEN v_cat := 'moderado'; v_resp := 'Risco moderado; investigacao em ate 24 a 48h, considerar observacao hospitalar';
  ELSE v_cat := 'alto'; v_resp := 'Risco alto; internacao e investigacao imediata (imagem vascular e cardiaca)';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'ABCD2', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'pas', p_pas, 'pad', p_pad, 'fraqueza_unilateral', p_fraqueza_unilateral,
                        'fala_sem_fraqueza', p_fala_sem_fraqueza, 'duracao_min', p_duracao_min, 'diabetes', p_diabetes),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;

-- Hunt-Hess
CREATE OR REPLACE FUNCTION public.fn_calcular_hunt_hess(
  p_atendimento_id text, p_idade integer, p_grau integer, p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, grau integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_cat text; v_resp text;
  v_lim text := 'Hunt-Hess e graduacao clinica da hemorragia subaracnoidea aneurismatica, com menor reprodutibilidade que o WFNS. Nao usar em HSA traumatica.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('Hunt-Hess', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_grau IS NULL OR p_grau < 1 OR p_grau > 5 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::text, NULL::int, NULL::text,
      'Grau de Hunt-Hess deve estar entre 1 e 5'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_grau = 1 THEN v_cat := 'leve'; v_resp := 'Intervencao precoce; melhor prognostico';
  ELSIF p_grau = 2 THEN v_cat := 'moderado'; v_resp := 'Intervencao precoce; prognostico bom';
  ELSIF p_grau = 3 THEN v_cat := 'grave'; v_resp := 'UTI e monitorizacao; prognostico intermediario';
  ELSIF p_grau = 4 THEN v_cat := 'muito_grave'; v_resp := 'UTI; considerar intervencao precoce; prognostico reservado';
  ELSE v_cat := 'moribundo'; v_resp := 'UTI; intervencao precoce se indicada; prognostico muito reservado';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'Hunt-Hess', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'grau', p_grau),
     true, p_grau, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, p_grau, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;

-- WFNS
CREATE OR REPLACE FUNCTION public.fn_calcular_wfns(
  p_atendimento_id text, p_idade integer, p_gcs integer, p_deficit_motor boolean,
  p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, grau integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_grau int; v_cat text; v_resp text;
  v_lim text := 'WFNS e mais reprodutivel que Hunt-Hess. Graus 4 e 5: UTI, intervencao precoce e monitorizacao neurologica continua. Nao usar em HSA traumatica.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('WFNS', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_gcs IS NULL OR p_deficit_motor IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: Glasgow e presenca de deficit motor'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_gcs < 3 OR p_gcs > 15 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::text, NULL::int, NULL::text,
      'Glasgow deve estar entre 3 e 15'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_gcs = 15 AND NOT p_deficit_motor THEN v_grau := 1;
  ELSIF p_gcs >= 13 AND NOT p_deficit_motor THEN v_grau := 2;
  ELSIF p_gcs >= 13 AND p_deficit_motor THEN v_grau := 3;
  ELSIF p_gcs >= 7 THEN v_grau := 4;
  ELSE v_grau := 5;
  END IF;

  IF v_grau <= 2 THEN v_cat := 'leve'; v_resp := 'Intervencao precoce do aneurisma; bom prognostico';
  ELSIF v_grau = 3 THEN v_cat := 'moderado'; v_resp := 'UTI, monitorizacao neurologica e intervencao precoce';
  ELSIF v_grau = 4 THEN v_cat := 'grave'; v_resp := 'UTI, monitorizacao continua e intervencao precoce se indicada';
  ELSE v_cat := 'muito_grave'; v_resp := 'UTI, suporte neurointensivo; prognostico muito reservado';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'WFNS', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'gcs', p_gcs, 'deficit_motor', p_deficit_motor),
     true, v_grau, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_grau, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;