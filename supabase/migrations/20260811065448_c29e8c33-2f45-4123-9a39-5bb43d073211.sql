-- C-SSRS (triagem)
CREATE OR REPLACE FUNCTION public.fn_calcular_cssrs(
  p_atendimento_id text, p_idade integer,
  p_desejo_morte boolean, p_pensamentos_ativos boolean, p_metodo boolean,
  p_intencao boolean, p_plano boolean, p_comportamento_suicida boolean,
  p_comportamento_3meses boolean DEFAULT false, p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text, red_flag_override boolean)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_total int := 0; v_cat text; v_resp text;
  v_override boolean := false;
  v_lim text := 'Versao de triagem do C-SSRS. Qualquer comportamento suicida nos ultimos 3 meses ou ideacao com plano e intencao exige avaliacao psiquiatrica imediata e vigilancia continua, independentemente da contagem de itens.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('C-SSRS', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_desejo_morte IS NULL OR p_pensamentos_ativos IS NULL OR p_metodo IS NULL
     OR p_intencao IS NULL OR p_plano IS NULL OR p_comportamento_suicida IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Todos os itens de triagem do C-SSRS sao obrigatorios'::text, v_pop, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_desejo_morte THEN v_total := v_total + 1; END IF;
  IF p_pensamentos_ativos THEN v_total := v_total + 1; END IF;
  IF p_metodo THEN v_total := v_total + 1; END IF;
  IF p_intencao THEN v_total := v_total + 1; END IF;
  IF p_plano THEN v_total := v_total + 1; END IF;
  IF p_comportamento_suicida THEN v_total := v_total + 1; END IF;

  IF p_comportamento_suicida OR (p_plano AND p_intencao) THEN
    v_cat := 'alto';
    v_resp := 'Risco alto: avaliacao psiquiatrica imediata, vigilancia continua e retirada de meios letais';
  ELSIF p_intencao OR p_plano OR p_metodo THEN
    v_cat := 'moderado';
    v_resp := 'Risco moderado: avaliacao em saude mental na mesma visita, plano de seguranca e envolvimento da rede de apoio';
  ELSIF p_pensamentos_ativos OR p_desejo_morte THEN
    v_cat := 'baixo';
    v_resp := 'Risco baixo: plano de seguranca, orientacao e encaminhamento ambulatorial em saude mental';
  ELSE
    v_cat := 'sem_risco_identificado';
    v_resp := 'Triagem negativa; reavaliar se houver mudanca clinica';
  END IF;

  IF coalesce(p_comportamento_3meses, false) THEN
    v_override := true;
    v_cat := 'alto_red_flag';
    v_resp := 'Comportamento suicida nos ultimos 3 meses: avaliacao psiquiatrica imediata e vigilancia continua';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override, motivo_override)
  VALUES (p_atendimento_id, 'C-SSRS', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'desejo_morte', p_desejo_morte, 'pensamentos_ativos', p_pensamentos_ativos,
                        'metodo', p_metodo, 'intencao', p_intencao, 'plano', p_plano,
                        'comportamento_suicida', p_comportamento_suicida, 'comportamento_3meses', p_comportamento_3meses),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', v_override,
     CASE WHEN v_override THEN 'Comportamento suicida nos ultimos 3 meses' ELSE NULL END);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_pop, v_versao, v_lim, v_override;
END; $fn$;

-- PHQ-9
CREATE OR REPLACE FUNCTION public.fn_calcular_phq9(
  p_atendimento_id text, p_idade integer,
  p_item1 integer, p_item2 integer, p_item3 integer, p_item4 integer, p_item5 integer,
  p_item6 integer, p_item7 integer, p_item8 integer, p_item9 integer,
  p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, item9_positivo boolean, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_total int; v_cat text; v_resp text; v_item9 boolean;
  v_lim text := 'PHQ-9 e instrumento de rastreio e graduacao, nao de diagnostico. Cada item varia de 0 a 3. PHQ-9 >=10: considerar tratamento. Item 9 positivo: aplicar C-SSRS e avaliar risco de suicidio.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('PHQ-9', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, NULL::boolean, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_item1 IS NULL OR p_item2 IS NULL OR p_item3 IS NULL OR p_item4 IS NULL OR p_item5 IS NULL
     OR p_item6 IS NULL OR p_item7 IS NULL OR p_item8 IS NULL OR p_item9 IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Os 9 itens do PHQ-9 sao obrigatorios'::text, NULL::boolean, v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF least(p_item1,p_item2,p_item3,p_item4,p_item5,p_item6,p_item7,p_item8,p_item9) < 0
     OR greatest(p_item1,p_item2,p_item3,p_item4,p_item5,p_item6,p_item7,p_item8,p_item9) > 3 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::text, NULL::int, NULL::text,
      'Cada item do PHQ-9 deve estar entre 0 e 3'::text, NULL::boolean, v_pop, v_versao, v_lim; RETURN;
  END IF;

  v_total := p_item1 + p_item2 + p_item3 + p_item4 + p_item5 + p_item6 + p_item7 + p_item8 + p_item9;
  v_item9 := p_item9 > 0;

  IF v_total <= 4 THEN v_cat := 'minimo'; v_resp := 'Sintomas minimos; orientacao e reavaliacao conforme necessidade';
  ELSIF v_total <= 9 THEN v_cat := 'leve'; v_resp := 'Depressao leve; monitorizacao e psicoeducacao';
  ELSIF v_total <= 14 THEN v_cat := 'moderado'; v_resp := 'Depressao moderada; considerar psicoterapia ou farmacoterapia';
  ELSIF v_total <= 19 THEN v_cat := 'moderadamente_grave'; v_resp := 'Depressao moderadamente grave; iniciar tratamento e acompanhamento proximo';
  ELSE v_cat := 'grave'; v_resp := 'Depressao grave; tratamento imediato e avaliacao especializada';
  END IF;

  IF v_item9 THEN
    v_resp := v_resp || '. Item 9 positivo: aplicar C-SSRS e avaliar risco de suicidio antes da alta';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override, motivo_override)
  VALUES (p_atendimento_id, 'PHQ-9', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'itens', jsonb_build_array(p_item1,p_item2,p_item3,p_item4,p_item5,p_item6,p_item7,p_item8,p_item9),
                        'item9_positivo', v_item9),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', v_item9,
     CASE WHEN v_item9 THEN 'Item 9 positivo: ideacao suicida' ELSE NULL END);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_item9, v_pop, v_versao, v_lim;
END; $fn$;

-- AUDIT
CREATE OR REPLACE FUNCTION public.fn_calcular_audit(
  p_atendimento_id text, p_idade integer, p_itens integer[], p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_total int; v_cat text; v_resp text; v_i int;
  v_lim text := 'AUDIT tem 10 itens, cada um de 0 a 4 (total 0-40). AUDIT >=20: dependencia provavel. Nao usar em adolescentes sem versao adaptada.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('AUDIT', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_itens IS NULL OR array_length(p_itens, 1) IS DISTINCT FROM 10 THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Informe exatamente 10 itens do AUDIT'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  FOREACH v_i IN ARRAY p_itens LOOP
    IF v_i IS NULL OR v_i < 0 OR v_i > 4 THEN
      RETURN QUERY SELECT 'ENTRADA_INVALIDA'::text, NULL::int, NULL::text,
        'Cada item do AUDIT deve estar entre 0 e 4'::text, v_pop, v_versao, v_lim; RETURN;
    END IF;
  END LOOP;

  SELECT sum(x) INTO v_total FROM unnest(p_itens) AS x;

  IF v_total <= 7 THEN v_cat := 'baixo_risco'; v_resp := 'Uso de baixo risco; orientacao geral';
  ELSIF v_total <= 15 THEN v_cat := 'uso_de_risco'; v_resp := 'Uso de risco; intervencao breve e orientacao de reducao de consumo';
  ELSIF v_total <= 19 THEN v_cat := 'uso_nocivo'; v_resp := 'Uso nocivo; intervencao breve, monitorizacao e encaminhamento';
  ELSE v_cat := 'provavel_dependencia'; v_resp := 'Provavel dependencia; avaliacao especializada e manejo de abstinencia';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'AUDIT', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'itens', to_jsonb(p_itens)),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;

-- CIWA-Ar
CREATE OR REPLACE FUNCTION public.fn_calcular_ciwa_ar(
  p_atendimento_id text, p_idade integer, p_dominios integer[], p_orientacao integer,
  p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_total int; v_cat text; v_resp text; v_i int;
  v_lim text := 'CIWA-Ar exige 9 dominios de 0 a 7 (nausea, tremor, sudorese, ansiedade, agitacao, alteracoes tateis, auditivas, visuais e cefaleia) e orientacao de 0 a 4. Nao usar em paciente sedado, incapaz de comunicar-se ou com delirium de outra causa.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('CIWA-Ar', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_dominios IS NULL OR array_length(p_dominios, 1) IS DISTINCT FROM 9 OR p_orientacao IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Informe os 9 dominios (0-7) e a orientacao (0-4)'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_orientacao < 0 OR p_orientacao > 4 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::text, NULL::int, NULL::text,
      'Orientacao deve estar entre 0 e 4'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  FOREACH v_i IN ARRAY p_dominios LOOP
    IF v_i IS NULL OR v_i < 0 OR v_i > 7 THEN
      RETURN QUERY SELECT 'ENTRADA_INVALIDA'::text, NULL::int, NULL::text,
        'Cada dominio do CIWA-Ar deve estar entre 0 e 7'::text, v_pop, v_versao, v_lim; RETURN;
    END IF;
  END LOOP;

  SELECT sum(x) + p_orientacao INTO v_total FROM unnest(p_dominios) AS x;

  IF v_total <= 8 THEN v_cat := 'leve'; v_resp := 'Abstinencia leve; observacao e reavaliacao a cada 4 a 8 horas';
  ELSIF v_total <= 14 THEN v_cat := 'moderada'; v_resp := 'Abstinencia moderada; benzodiazepinico sintomatico e reavaliacao a cada 1 a 2 horas';
  ELSE v_cat := 'grave'; v_resp := 'Abstinencia grave; benzodiazepinico, tiamina, monitorizacao intensiva e considerar UTI';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'CIWA-Ar', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'dominios', to_jsonb(p_dominios), 'orientacao', p_orientacao),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;