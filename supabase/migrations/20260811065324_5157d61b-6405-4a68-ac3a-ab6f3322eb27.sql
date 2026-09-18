-- CHA2DS2-VASc
CREATE OR REPLACE FUNCTION public.fn_calcular_cha2ds2_vasc(
  p_atendimento_id text, p_idade integer, p_sexo text, p_ic boolean, p_has boolean, p_dm boolean,
  p_avc_previo boolean, p_doenca_vascular boolean, p_fa_valvar boolean DEFAULT false,
  p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text, red_flag_override boolean)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_total int := 0; v_cat text; v_resp text;
  v_override boolean := false;
  v_lim text := 'CHA2DS2-VASc nao se aplica a FA valvar (protese mecanica ou estenose mitral moderada a grave): nesses casos indica-se varfarina independentemente do escore.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('CHA2DS2-VASc', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_sexo IS NULL OR p_ic IS NULL OR p_has IS NULL OR p_dm IS NULL
     OR p_avc_previo IS NULL OR p_doenca_vascular IS NULL OR p_idade IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: idade, sexo, IC, HAS, DM, AVC previo e doenca vascular'::text, v_pop, v_versao, v_lim, false; RETURN;
  END IF;

  IF upper(p_sexo) NOT IN ('M','F') THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::text, NULL::int, NULL::text,
      'Sexo deve ser M ou F'::text, v_pop, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_ic THEN v_total := v_total + 1; END IF;
  IF p_has THEN v_total := v_total + 1; END IF;
  IF p_idade >= 75 THEN v_total := v_total + 2;
  ELSIF p_idade >= 65 THEN v_total := v_total + 1;
  END IF;
  IF p_dm THEN v_total := v_total + 1; END IF;
  IF p_avc_previo THEN v_total := v_total + 2; END IF;
  IF p_doenca_vascular THEN v_total := v_total + 1; END IF;
  IF upper(p_sexo) = 'F' THEN v_total := v_total + 1; END IF;

  IF upper(p_sexo) = 'M' THEN
    IF v_total = 0 THEN v_cat := 'baixo'; v_resp := 'Sem anticoagulacao; controle de fatores de risco';
    ELSIF v_total = 1 THEN v_cat := 'intermediario'; v_resp := 'Considerar anticoagulacao; decisao compartilhada';
    ELSE v_cat := 'alto'; v_resp := 'Anticoagulacao com DOAC ou varfarina';
    END IF;
  ELSE
    IF v_total <= 1 THEN v_cat := 'baixo'; v_resp := 'Sem anticoagulacao; controle de fatores de risco';
    ELSIF v_total = 2 THEN v_cat := 'intermediario'; v_resp := 'Considerar anticoagulacao; decisao compartilhada';
    ELSE v_cat := 'alto'; v_resp := 'Anticoagulacao com DOAC ou varfarina';
    END IF;
  END IF;

  IF coalesce(p_fa_valvar, false) THEN
    v_override := true;
    v_cat := 'nao_aplicavel_fa_valvar';
    v_resp := 'FA valvar: anticoagulacao com varfarina independentemente do CHA2DS2-VASc; DOAC contraindicado';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override, motivo_override)
  VALUES (p_atendimento_id, 'CHA2DS2-VASc', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'sexo', p_sexo, 'ic', p_ic, 'has', p_has, 'dm', p_dm,
                        'avc_previo', p_avc_previo, 'doenca_vascular', p_doenca_vascular, 'fa_valvar', p_fa_valvar),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', v_override,
     CASE WHEN v_override THEN 'FA valvar: escore nao aplicavel' ELSE NULL END);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_pop, v_versao, v_lim, v_override;
END; $fn$;

-- HAS-BLED
CREATE OR REPLACE FUNCTION public.fn_calcular_has_bled(
  p_atendimento_id text, p_idade integer, p_has_nao_controlada boolean, p_funcao_renal_alterada boolean,
  p_funcao_hepatica_alterada boolean, p_avc_previo boolean, p_sangramento_previo boolean,
  p_inr_labil boolean, p_drogas_antiplaquetarias boolean, p_alcool boolean,
  p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_total int := 0; v_cat text; v_resp text;
  v_lim text := 'HAS-BLED alto (>=3) NAO contraindica anticoagulacao isoladamente: indica corrigir fatores modificaveis e reavaliar com mais frequencia.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('HAS-BLED', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_has_nao_controlada IS NULL OR p_funcao_renal_alterada IS NULL OR p_funcao_hepatica_alterada IS NULL
     OR p_avc_previo IS NULL OR p_sangramento_previo IS NULL OR p_inr_labil IS NULL
     OR p_drogas_antiplaquetarias IS NULL OR p_alcool IS NULL OR p_idade IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Todas as entradas do HAS-BLED sao obrigatorias'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_has_nao_controlada THEN v_total := v_total + 1; END IF;
  IF p_funcao_renal_alterada THEN v_total := v_total + 1; END IF;
  IF p_funcao_hepatica_alterada THEN v_total := v_total + 1; END IF;
  IF p_avc_previo THEN v_total := v_total + 1; END IF;
  IF p_sangramento_previo THEN v_total := v_total + 1; END IF;
  IF p_inr_labil THEN v_total := v_total + 1; END IF;
  IF p_idade > 65 THEN v_total := v_total + 1; END IF;
  IF p_drogas_antiplaquetarias THEN v_total := v_total + 1; END IF;
  IF p_alcool THEN v_total := v_total + 1; END IF;

  IF v_total <= 2 THEN v_cat := 'baixo'; v_resp := 'Risco de sangramento baixo; anticoagulacao conforme indicacao';
  ELSE v_cat := 'alto'; v_resp := 'Risco de sangramento alto; corrigir fatores modificaveis e reavaliar com mais frequencia, sem suspender a anticoagulacao apenas pelo escore';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'HAS-BLED', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'has_nao_controlada', p_has_nao_controlada,
                        'funcao_renal_alterada', p_funcao_renal_alterada,
                        'funcao_hepatica_alterada', p_funcao_hepatica_alterada, 'avc_previo', p_avc_previo,
                        'sangramento_previo', p_sangramento_previo, 'inr_labil', p_inr_labil,
                        'drogas_antiplaquetarias', p_drogas_antiplaquetarias, 'alcool', p_alcool),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;

-- GRACE
CREATE OR REPLACE FUNCTION public.fn_calcular_grace(
  p_atendimento_id text, p_idade integer, p_fc integer, p_pas integer, p_creatinina numeric,
  p_killip integer, p_parada_cardiaca boolean, p_desvio_st boolean, p_biomarcador_elevado boolean,
  p_choque boolean DEFAULT false, p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text, red_flag_override boolean)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_total int := 0; v_cat text; v_resp text;
  v_override boolean := false;
  v_lim text := 'GRACE 1.0 na admissao, creatinina em mg/dL. GRACE >140: forte indicacao de angiografia precoce (em ate 24h). Choque cardiogenico ou instabilidade hemodinamica indicam estrategia invasiva imediata, independentemente do escore.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('GRACE', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_fc IS NULL OR p_pas IS NULL OR p_creatinina IS NULL OR p_killip IS NULL
     OR p_parada_cardiaca IS NULL OR p_desvio_st IS NULL OR p_biomarcador_elevado IS NULL OR p_idade IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: idade, FC, PAS, creatinina, classe Killip, parada cardiaca, desvio de ST e biomarcador'::text,
      v_pop, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_killip < 1 OR p_killip > 4 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::text, NULL::int, NULL::text,
      'Classe Killip deve estar entre 1 e 4'::text, v_pop, v_versao, v_lim, false; RETURN;
  END IF;

  -- Idade
  IF p_idade < 30 THEN v_total := v_total + 0;
  ELSIF p_idade <= 39 THEN v_total := v_total + 8;
  ELSIF p_idade <= 49 THEN v_total := v_total + 25;
  ELSIF p_idade <= 59 THEN v_total := v_total + 41;
  ELSIF p_idade <= 69 THEN v_total := v_total + 58;
  ELSIF p_idade <= 79 THEN v_total := v_total + 75;
  ELSIF p_idade <= 89 THEN v_total := v_total + 91;
  ELSE v_total := v_total + 100;
  END IF;

  -- Frequencia cardiaca
  IF p_fc < 50 THEN v_total := v_total + 0;
  ELSIF p_fc <= 69 THEN v_total := v_total + 3;
  ELSIF p_fc <= 89 THEN v_total := v_total + 9;
  ELSIF p_fc <= 109 THEN v_total := v_total + 15;
  ELSIF p_fc <= 149 THEN v_total := v_total + 24;
  ELSIF p_fc <= 199 THEN v_total := v_total + 38;
  ELSE v_total := v_total + 46;
  END IF;

  -- Pressao arterial sistolica
  IF p_pas < 80 THEN v_total := v_total + 58;
  ELSIF p_pas <= 99 THEN v_total := v_total + 53;
  ELSIF p_pas <= 119 THEN v_total := v_total + 43;
  ELSIF p_pas <= 139 THEN v_total := v_total + 34;
  ELSIF p_pas <= 159 THEN v_total := v_total + 24;
  ELSIF p_pas <= 199 THEN v_total := v_total + 10;
  ELSE v_total := v_total + 0;
  END IF;

  -- Creatinina (mg/dL)
  IF p_creatinina < 0.40 THEN v_total := v_total + 1;
  ELSIF p_creatinina < 0.80 THEN v_total := v_total + 4;
  ELSIF p_creatinina < 1.20 THEN v_total := v_total + 7;
  ELSIF p_creatinina < 1.60 THEN v_total := v_total + 10;
  ELSIF p_creatinina < 2.00 THEN v_total := v_total + 13;
  ELSIF p_creatinina < 4.00 THEN v_total := v_total + 21;
  ELSE v_total := v_total + 28;
  END IF;

  -- Killip
  v_total := v_total + CASE p_killip WHEN 1 THEN 0 WHEN 2 THEN 20 WHEN 3 THEN 39 ELSE 59 END;

  IF p_parada_cardiaca THEN v_total := v_total + 39; END IF;
  IF p_desvio_st THEN v_total := v_total + 28; END IF;
  IF p_biomarcador_elevado THEN v_total := v_total + 14; END IF;

  IF v_total <= 108 THEN v_cat := 'baixo'; v_resp := 'Risco baixo; estrategia invasiva seletiva conforme evolucao clinica';
  ELSIF v_total <= 140 THEN v_cat := 'intermediario'; v_resp := 'Risco intermediario; angiografia em ate 72h';
  ELSE v_cat := 'alto'; v_resp := 'Risco alto; angiografia precoce em ate 24h e terapia antitrombotica plena';
  END IF;

  IF coalesce(p_choque, false) THEN
    v_override := true;
    v_cat := 'alto_red_flag';
    v_resp := 'Choque cardiogenico: estrategia invasiva imediata e suporte hemodinamico, independentemente do GRACE';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override, motivo_override)
  VALUES (p_atendimento_id, 'GRACE', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'fc', p_fc, 'pas', p_pas, 'creatinina', p_creatinina,
                        'killip', p_killip, 'parada_cardiaca', p_parada_cardiaca, 'desvio_st', p_desvio_st,
                        'biomarcador_elevado', p_biomarcador_elevado, 'choque', p_choque),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', v_override,
     CASE WHEN v_override THEN 'Choque cardiogenico' ELSE NULL END);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_pop, v_versao, v_lim, v_override;
END; $fn$;

-- TIMI (SCA sem supra de ST)
CREATE OR REPLACE FUNCTION public.fn_calcular_timi(
  p_atendimento_id text, p_idade integer, p_3_fatores_risco boolean, p_dac_conhecida boolean,
  p_aas_7dias boolean, p_2_angina_24h boolean, p_desvio_st boolean, p_biomarcador_elevado boolean,
  p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_total int := 0; v_cat text; v_resp text;
  v_lim text := 'TIMI para angina instavel e IAM sem supra de ST. Nao usar em IAM com supra de ST (usar TIMI-STEMI). TIMI >=5: estrategia invasiva precoce.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('TIMI-SCA-SST', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_3_fatores_risco IS NULL OR p_dac_conhecida IS NULL OR p_aas_7dias IS NULL
     OR p_2_angina_24h IS NULL OR p_desvio_st IS NULL OR p_biomarcador_elevado IS NULL OR p_idade IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Todas as entradas do TIMI sao obrigatorias'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_idade >= 65 THEN v_total := v_total + 1; END IF;
  IF p_3_fatores_risco THEN v_total := v_total + 1; END IF;
  IF p_dac_conhecida THEN v_total := v_total + 1; END IF;
  IF p_aas_7dias THEN v_total := v_total + 1; END IF;
  IF p_2_angina_24h THEN v_total := v_total + 1; END IF;
  IF p_desvio_st THEN v_total := v_total + 1; END IF;
  IF p_biomarcador_elevado THEN v_total := v_total + 1; END IF;

  IF v_total <= 2 THEN v_cat := 'baixo'; v_resp := 'Risco baixo; estrategia conservadora com estratificacao nao invasiva';
  ELSIF v_total <= 4 THEN v_cat := 'intermediario'; v_resp := 'Risco intermediario; internacao e considerar estrategia invasiva';
  ELSE v_cat := 'alto'; v_resp := 'Risco alto; estrategia invasiva precoce e terapia antitrombotica plena';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'TIMI-SCA-SST', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'tres_fatores_risco', p_3_fatores_risco, 'dac_conhecida', p_dac_conhecida,
                        'aas_7dias', p_aas_7dias, 'duas_anginas_24h', p_2_angina_24h, 'desvio_st', p_desvio_st,
                        'biomarcador_elevado', p_biomarcador_elevado),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;

-- YEARS
CREATE OR REPLACE FUNCTION public.fn_calcular_years(
  p_atendimento_id text, p_idade integer, p_sinais_tvp boolean, p_hemoptise boolean,
  p_tep_mais_provavel boolean, p_dimero numeric, p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, tep_excluida boolean, criterios integer, limiar_dimero integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_crit int := 0; v_limiar int; v_excluida boolean;
  v_cat text; v_resp text;
  v_lim text := 'YEARS usa D-dimero em ng/mL FEU. Limiar de 1000 ng/mL quando nenhum criterio YEARS esta presente e de 500 ng/mL quando ha ao menos um criterio. Algoritmo especifico para gestantes tem etapa adicional de ultrassom de membros inferiores.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('YEARS', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::boolean, NULL::int, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_sinais_tvp IS NULL OR p_hemoptise IS NULL OR p_tep_mais_provavel IS NULL OR p_dimero IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::boolean, NULL::int, NULL::int, NULL::text,
      'Entradas obrigatorias: sinais de TVP, hemoptise, TEP como diagnostico mais provavel e D-dimero'::text,
      v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_sinais_tvp THEN v_crit := v_crit + 1; END IF;
  IF p_hemoptise THEN v_crit := v_crit + 1; END IF;
  IF p_tep_mais_provavel THEN v_crit := v_crit + 1; END IF;

  v_limiar := CASE WHEN v_crit = 0 THEN 1000 ELSE 500 END;
  v_excluida := p_dimero < v_limiar;

  IF v_excluida THEN
    v_cat := 'tep_excluida';
    v_resp := format('D-dimero %s ng/mL abaixo do limiar %s: TEP excluida, angiotomografia nao indicada', p_dimero, v_limiar);
  ELSE
    v_cat := 'ctpa_indicada';
    v_resp := format('D-dimero %s ng/mL maior ou igual ao limiar %s: angiotomografia de torax indicada', p_dimero, v_limiar);
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'YEARS', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'sinais_tvp', p_sinais_tvp, 'hemoptise', p_hemoptise,
                        'tep_mais_provavel', p_tep_mais_provavel, 'dimero', p_dimero,
                        'criterios_years', v_crit, 'limiar_dimero', v_limiar),
     true, v_crit, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_excluida, v_crit, v_limiar, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;