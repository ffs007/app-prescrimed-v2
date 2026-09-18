-- Ampliar validacao de populacao para novos escores
CREATE OR REPLACE FUNCTION public.fn_validar_populacao_escore(p_escore_nome text, p_idade integer DEFAULT NULL::integer, p_contexto text DEFAULT NULL::text)
 RETURNS TABLE(populacao_validada boolean, motivo text, versao_escore text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_escore RECORD;
  v_idade_min integer;
BEGIN
  SELECT nome_escore, populacao_alvo, versao
    INTO v_escore
  FROM public.stg_escores_clinicos
  WHERE nome_escore = p_escore_nome
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_escore IS NULL THEN
    RETURN QUERY SELECT false, 'Escore nao cadastrado na base'::text, NULL::text;
    RETURN;
  END IF;

  v_idade_min := CASE p_escore_nome
    WHEN 'Glasgow' THEN 0
    WHEN 'NEXUS' THEN 0
    WHEN 'Ottawa-Tornozelo' THEN 2
    WHEN 'Ottawa-Knee' THEN 2
    WHEN 'AIR' THEN 2
    WHEN 'SIRS' THEN 0
    WHEN 'Canadian-C-Spine' THEN 16
    WHEN 'NEWS2' THEN 16
    WHEN 'PHQ-9' THEN 12
    WHEN '4AT' THEN 18
    ELSE 18
  END;

  IF p_idade IS NULL THEN
    RETURN QUERY SELECT true,
      'Idade nao informada; confirmar manualmente se o paciente pertence a populacao validada'::text,
      v_escore.versao;
    RETURN;
  END IF;

  IF p_idade < v_idade_min THEN
    RETURN QUERY SELECT false,
      format('%s validado apenas a partir de %s anos; idade informada: %s anos (populacao validada: %s)',
             p_escore_nome, v_idade_min, p_idade, coalesce(v_escore.populacao_alvo, 'nao especificada'))::text,
      v_escore.versao;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'Populacao validada'::text, v_escore.versao;
END;
$function$;

-- MELD
CREATE OR REPLACE FUNCTION public.fn_calcular_meld(
  p_atendimento_id text, p_idade integer, p_bilirrubina numeric, p_inr numeric,
  p_creatinina numeric, p_dialise boolean DEFAULT false, p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text;
  v_bili numeric; v_inr numeric; v_crea numeric; v_score numeric; v_total int;
  v_cat text; v_resp text;
  v_lim text := 'MELD nao validado em hepatite aguda sem cirrose nem em pediatria (usar PELD). Valores minimos de 1.0; em dialise a creatinina e fixada em 4.0 e a creatinina e limitada a 4.0.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('MELD', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_bilirrubina IS NULL OR p_inr IS NULL OR p_creatinina IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: bilirrubina, INR e creatinina'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  v_bili := greatest(p_bilirrubina, 1.0);
  v_inr  := greatest(p_inr, 1.0);
  v_crea := greatest(p_creatinina, 1.0);
  IF coalesce(p_dialise, false) THEN v_crea := 4.0; END IF;
  v_crea := least(v_crea, 4.0);

  v_score := 3.78 * ln(v_bili) + 11.2 * ln(v_inr) + 9.57 * ln(v_crea) + 6.43;
  v_total := least(40, greatest(6, round(v_score)::int));

  IF v_total < 10 THEN v_cat := 'baixo'; v_resp := 'Mortalidade baixa em 3 meses; seguimento ambulatorial em hepatologia';
  ELSIF v_total <= 19 THEN v_cat := 'intermediario'; v_resp := 'Avaliacao hepatologica; considerar encaminhamento para transplante';
  ELSIF v_total <= 29 THEN v_cat := 'alto'; v_resp := 'Alto risco; internacao e avaliacao para transplante hepatico';
  ELSE v_cat := 'muito_alto'; v_resp := 'Mortalidade muito elevada; UTI e priorizacao para transplante';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'MELD', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'bilirrubina', p_bilirrubina, 'inr', p_inr, 'creatinina', p_creatinina, 'dialise', p_dialise),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;

-- MELD-Na
CREATE OR REPLACE FUNCTION public.fn_calcular_meld_na(
  p_atendimento_id text, p_idade integer, p_bilirrubina numeric, p_inr numeric,
  p_creatinina numeric, p_sodio numeric, p_dialise boolean DEFAULT false, p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text;
  v_bili numeric; v_inr numeric; v_crea numeric; v_na numeric; v_meld numeric; v_score numeric; v_total int;
  v_cat text; v_resp text;
  v_lim text := 'MELD-Na aplica o ajuste de sodio apenas quando o MELD e maior que 11. Sodio limitado a faixa 125-137 mEq/L. Nao validado em pediatria.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('MELD-Na', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_bilirrubina IS NULL OR p_inr IS NULL OR p_creatinina IS NULL OR p_sodio IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: bilirrubina, INR, creatinina e sodio'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  v_bili := greatest(p_bilirrubina, 1.0);
  v_inr  := greatest(p_inr, 1.0);
  v_crea := greatest(p_creatinina, 1.0);
  IF coalesce(p_dialise, false) THEN v_crea := 4.0; END IF;
  v_crea := least(v_crea, 4.0);
  v_na := least(137, greatest(125, p_sodio));

  v_meld := least(40, greatest(6, round(3.78 * ln(v_bili) + 11.2 * ln(v_inr) + 9.57 * ln(v_crea) + 6.43)));
  IF v_meld > 11 THEN
    v_score := v_meld + 1.32 * (137 - v_na) - 0.033 * v_meld * (137 - v_na);
  ELSE
    v_score := v_meld;
  END IF;
  v_total := least(40, greatest(6, round(v_score)::int));

  IF v_total < 10 THEN v_cat := 'baixo'; v_resp := 'Mortalidade baixa em 3 meses; seguimento ambulatorial em hepatologia';
  ELSIF v_total <= 19 THEN v_cat := 'intermediario'; v_resp := 'Avaliacao hepatologica; considerar encaminhamento para transplante';
  ELSIF v_total <= 29 THEN v_cat := 'alto'; v_resp := 'Alto risco; internacao e avaliacao para transplante hepatico';
  ELSE v_cat := 'muito_alto'; v_resp := 'Mortalidade muito elevada; UTI e priorizacao para transplante';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'MELD-Na', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'bilirrubina', p_bilirrubina, 'inr', p_inr,
                        'creatinina', p_creatinina, 'sodio', p_sodio, 'dialise', p_dialise, 'meld_base', v_meld),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;

-- Ranson (admissao, pancreatite nao biliar)
CREATE OR REPLACE FUNCTION public.fn_calcular_ranson(
  p_atendimento_id text, p_idade integer, p_leucocitos integer, p_glicose numeric,
  p_ldh numeric, p_ast numeric, p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_total int := 0; v_cat text; v_resp text;
  v_lim text := 'Criterios de admissao apenas (pancreatite nao biliar): idade >55, leucocitos >16.000/mm3, glicose >200 mg/dL, LDH >350 U/L e AST >250 U/L. O escore completo exige os criterios de 48h, que nao estao incluidos neste calculo.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('Ranson', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_leucocitos IS NULL OR p_glicose IS NULL OR p_ldh IS NULL OR p_ast IS NULL OR p_idade IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: idade, leucocitos, glicose, LDH e AST'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_idade > 55 THEN v_total := v_total + 1; END IF;
  IF p_leucocitos > 16000 THEN v_total := v_total + 1; END IF;
  IF p_glicose > 200 THEN v_total := v_total + 1; END IF;
  IF p_ldh > 350 THEN v_total := v_total + 1; END IF;
  IF p_ast > 250 THEN v_total := v_total + 1; END IF;

  IF v_total <= 2 THEN v_cat := 'baixo'; v_resp := 'Pancreatite provavelmente leve; internacao em enfermaria e reavaliacao em 48h';
  ELSIF v_total = 3 THEN v_cat := 'intermediario'; v_resp := 'Risco intermediario; monitorizacao rigorosa e completar criterios de 48h';
  ELSE v_cat := 'alto'; v_resp := 'Pancreatite grave provavel; considerar UTI e completar criterios de 48h';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'Ranson', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'leucocitos', p_leucocitos, 'glicose', p_glicose, 'ldh', p_ldh, 'ast', p_ast, 'janela', 'admissao'),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;

-- BISAP
CREATE OR REPLACE FUNCTION public.fn_calcular_bisap(
  p_atendimento_id text, p_idade integer, p_ureia numeric, p_comprometimento_mental boolean,
  p_sirs_criterios integer, p_derrame_pleural boolean, p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_total int := 0; v_cat text; v_resp text;
  v_lim text := 'BISAP usa ureia (BUN) >25 mg/dL, comprometimento mental, SIRS >=2, idade >60 anos e derrame pleural. BISAP >=3: considerar UTI. Nao substitui reavaliacao clinica seriada.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('BISAP', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_ureia IS NULL OR p_comprometimento_mental IS NULL OR p_sirs_criterios IS NULL OR p_derrame_pleural IS NULL OR p_idade IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: idade, ureia, comprometimento mental, criterios SIRS e derrame pleural'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_ureia > 25 THEN v_total := v_total + 1; END IF;
  IF p_comprometimento_mental THEN v_total := v_total + 1; END IF;
  IF p_sirs_criterios >= 2 THEN v_total := v_total + 1; END IF;
  IF p_idade > 60 THEN v_total := v_total + 1; END IF;
  IF p_derrame_pleural THEN v_total := v_total + 1; END IF;

  IF v_total <= 2 THEN v_cat := 'baixo'; v_resp := 'Mortalidade baixa; enfermaria com hidratacao e reavaliacao';
  ELSE v_cat := 'alto'; v_resp := 'Pancreatite grave; considerar UTI, monitorizacao e suporte hemodinamico';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'BISAP', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'ureia', p_ureia, 'comprometimento_mental', p_comprometimento_mental,
                        'sirs_criterios', p_sirs_criterios, 'derrame_pleural', p_derrame_pleural),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;

-- LRINEC
CREATE OR REPLACE FUNCTION public.fn_calcular_lrinec(
  p_atendimento_id text, p_idade integer, p_pcr numeric, p_leucocitos numeric,
  p_hemoglobina numeric, p_sodio numeric, p_creatinina numeric, p_glicose numeric,
  p_dor_desproporcional boolean DEFAULT NULL, p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text, red_flag_override boolean)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_total int := 0; v_cat text; v_resp text;
  v_override boolean := false;
  v_lim text := 'LRINEC usa leucocitos em 10^3/mm3, PCR em mg/L, creatinina em mg/dL e glicose em mg/dL. LRINEC baixo NAO exclui fasciite necrotizante: dor desproporcional ao exame, crepitacao ou toxemia indicam exploracao cirurgica independentemente do escore.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('LRINEC', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_pcr IS NULL OR p_leucocitos IS NULL OR p_hemoglobina IS NULL OR p_sodio IS NULL
     OR p_creatinina IS NULL OR p_glicose IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: PCR, leucocitos, hemoglobina, sodio, creatinina e glicose'::text, v_pop, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_pcr >= 150 THEN v_total := v_total + 4; END IF;

  IF p_leucocitos > 25 THEN v_total := v_total + 2;
  ELSIF p_leucocitos >= 15 THEN v_total := v_total + 1;
  END IF;

  IF p_hemoglobina < 11 THEN v_total := v_total + 2;
  ELSIF p_hemoglobina <= 13.5 THEN v_total := v_total + 1;
  END IF;

  IF p_sodio < 135 THEN v_total := v_total + 2; END IF;
  IF p_creatinina > 1.6 THEN v_total := v_total + 2; END IF;
  IF p_glicose > 180 THEN v_total := v_total + 1; END IF;

  IF v_total <= 5 THEN v_cat := 'baixo'; v_resp := 'Risco baixo de fasciite necrotizante; manter vigilancia e reavaliacao seriada';
  ELSIF v_total <= 7 THEN v_cat := 'intermediario'; v_resp := 'Risco intermediario; avaliacao cirurgica e imagem urgentes';
  ELSE v_cat := 'alto'; v_resp := 'Risco alto; exploracao cirurgica imediata e antibioticoterapia de amplo espectro';
  END IF;

  IF coalesce(p_dor_desproporcional, false) AND v_total <= 5 THEN
    v_override := true;
    v_cat := 'alto_red_flag';
    v_resp := 'Dor desproporcional ao exame: avaliacao cirurgica imediata independentemente do LRINEC';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override, motivo_override)
  VALUES (p_atendimento_id, 'LRINEC', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'pcr', p_pcr, 'leucocitos', p_leucocitos, 'hemoglobina', p_hemoglobina,
                        'sodio', p_sodio, 'creatinina', p_creatinina, 'glicose', p_glicose,
                        'dor_desproporcional', p_dor_desproporcional),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', v_override,
     CASE WHEN v_override THEN 'Dor desproporcional ao exame fisico' ELSE NULL END);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_pop, v_versao, v_lim, v_override;
END; $fn$;

-- SCORTEN
CREATE OR REPLACE FUNCTION public.fn_calcular_scorten(
  p_atendimento_id text, p_idade integer, p_malignidade boolean, p_fc integer,
  p_scq_pct numeric, p_ureia numeric, p_glicose numeric, p_bicarbonato numeric,
  p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, mortalidade_estimada text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_total int := 0; v_cat text; v_resp text; v_mort text;
  v_lim text := 'SCORTEN usa ureia e glicose em mmol/L e bicarbonato em mEq/L. Calculo validado nas primeiras 24h de internacao (idealmente repetido no dia 3). SCORTEN >=3: UTI ou centro de queimados.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('SCORTEN', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, NULL::text, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_malignidade IS NULL OR p_fc IS NULL OR p_scq_pct IS NULL OR p_ureia IS NULL
     OR p_glicose IS NULL OR p_bicarbonato IS NULL OR p_idade IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: idade, malignidade, FC, area corporal descolada, ureia, glicose e bicarbonato'::text,
      NULL::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_idade > 40 THEN v_total := v_total + 1; END IF;
  IF p_malignidade THEN v_total := v_total + 1; END IF;
  IF p_fc > 120 THEN v_total := v_total + 1; END IF;
  IF p_scq_pct > 10 THEN v_total := v_total + 1; END IF;
  IF p_ureia > 10 THEN v_total := v_total + 1; END IF;
  IF p_glicose > 14 THEN v_total := v_total + 1; END IF;
  IF p_bicarbonato < 20 THEN v_total := v_total + 1; END IF;

  IF v_total <= 1 THEN v_cat := 'baixo'; v_mort := '3,2%'; v_resp := 'Internacao em unidade especializada; cuidados de suporte e suspensao do farmaco suspeito';
  ELSIF v_total = 2 THEN v_cat := 'intermediario'; v_mort := '12,1%'; v_resp := 'Internacao em centro de queimados ou UTI; suporte hidroeletrolitico';
  ELSIF v_total = 3 THEN v_cat := 'alto'; v_mort := '35,3%'; v_resp := 'UTI ou centro de queimados; suporte intensivo multidisciplinar';
  ELSIF v_total = 4 THEN v_cat := 'muito_alto'; v_mort := '58,3%'; v_resp := 'UTI ou centro de queimados; suporte intensivo e cuidados com a familia';
  ELSE v_cat := 'critico'; v_mort := 'maior que 90%'; v_resp := 'UTI ou centro de queimados; suporte intensivo maximo e discussao de prognostico';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'SCORTEN', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'malignidade', p_malignidade, 'fc', p_fc, 'scq_pct', p_scq_pct,
                        'ureia', p_ureia, 'glicose', p_glicose, 'bicarbonato', p_bicarbonato),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_mort, v_pop, v_versao, v_lim;
END; $fn$;

-- RegiSCAR (DRESS)
CREATE OR REPLACE FUNCTION public.fn_calcular_regiscar(
  p_atendimento_id text, p_idade integer, p_febre boolean, p_linfonodomegalia boolean,
  p_eosinofilia numeric, p_rash_extenso boolean, p_orgao_interno boolean,
  p_exclusao_investigada boolean, p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_total int := 0; v_cat text; v_resp text;
  v_lim text := 'Versao simplificada do RegiSCAR para triagem de DRESS; eosinofilos em celulas/mm3. RegiSCAR >=4: suspender o farmaco suspeito e investigar acometimento de orgaos. Nao usar para excluir DRESS antes de avaliar funcao hepatica e renal.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('RegiSCAR', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_febre IS NULL OR p_linfonodomegalia IS NULL OR p_eosinofilia IS NULL
     OR p_rash_extenso IS NULL OR p_orgao_interno IS NULL OR p_exclusao_investigada IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Todas as entradas sao obrigatorias'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_febre THEN v_total := v_total + 1; END IF;
  IF p_linfonodomegalia THEN v_total := v_total + 1; END IF;

  IF p_eosinofilia >= 1500 THEN v_total := v_total + 2;
  ELSIF p_eosinofilia >= 700 THEN v_total := v_total + 1;
  END IF;

  IF p_rash_extenso THEN v_total := v_total + 1; END IF;
  IF p_orgao_interno THEN v_total := v_total + 1; END IF;
  IF p_exclusao_investigada THEN v_total := v_total + 1; END IF;

  IF v_total <= 1 THEN v_cat := 'improvavel'; v_resp := 'DRESS improvavel; reavaliar diagnostico diferencial';
  ELSIF v_total <= 3 THEN v_cat := 'possivel'; v_resp := 'DRESS possivel; suspender farmaco suspeito e monitorar funcao hepatica e renal';
  ELSIF v_total <= 5 THEN v_cat := 'provavel'; v_resp := 'DRESS provavel; suspender farmaco, internar e avaliar acometimento de orgaos';
  ELSE v_cat := 'definido'; v_resp := 'DRESS definido; internacao, suporte e avaliacao dermatologica especializada';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'RegiSCAR', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'febre', p_febre, 'linfonodomegalia', p_linfonodomegalia,
                        'eosinofilia', p_eosinofilia, 'rash_extenso', p_rash_extenso,
                        'orgao_interno', p_orgao_interno, 'exclusao_investigada', p_exclusao_investigada),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;