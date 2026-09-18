-- Rockall completo
CREATE OR REPLACE FUNCTION public.fn_calcular_rockall(
  p_atendimento_id text, p_idade integer, p_fc integer, p_pas integer,
  p_comorbidade text, p_diagnostico text, p_estigmas_sangramento boolean,
  p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_total int := 0; v_cat text; v_resp text;
  v_lim text := 'Rockall completo exige endoscopia (diagnostico e estigmas). Comorbidade aceita: nenhuma, cardiopatia_ic, renal_hepatica_ou_metastatica. Diagnostico aceita: mallory_weiss_ou_sem_lesao, outros, malignidade. Rockall >=8: alto risco de ressangramento; considerar UTI e reavaliacao endoscopica.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('Rockall', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_fc IS NULL OR p_pas IS NULL OR p_comorbidade IS NULL OR p_diagnostico IS NULL
     OR p_estigmas_sangramento IS NULL OR p_idade IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: idade, FC, PAS, comorbidade, diagnostico endoscopico e estigmas de sangramento'::text,
      v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_comorbidade NOT IN ('nenhuma','cardiopatia_ic','renal_hepatica_ou_metastatica')
     OR p_diagnostico NOT IN ('mallory_weiss_ou_sem_lesao','outros','malignidade') THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::text, NULL::int, NULL::text,
      'Comorbidade ou diagnostico fora dos valores aceitos'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_idade >= 80 THEN v_total := v_total + 2;
  ELSIF p_idade >= 60 THEN v_total := v_total + 1;
  END IF;

  IF p_pas < 100 THEN v_total := v_total + 2;
  ELSIF p_fc >= 100 THEN v_total := v_total + 1;
  END IF;

  v_total := v_total + CASE p_comorbidade
    WHEN 'cardiopatia_ic' THEN 2
    WHEN 'renal_hepatica_ou_metastatica' THEN 3
    ELSE 0 END;

  v_total := v_total + CASE p_diagnostico
    WHEN 'malignidade' THEN 2
    WHEN 'outros' THEN 1
    ELSE 0 END;

  IF p_estigmas_sangramento THEN v_total := v_total + 2; END IF;

  IF v_total <= 2 THEN v_cat := 'baixo'; v_resp := 'Baixo risco de ressangramento; considerar alta precoce com seguimento';
  ELSIF v_total <= 7 THEN v_cat := 'intermediario'; v_resp := 'Risco intermediario; internacao, inibidor de bomba de protons e observacao';
  ELSE v_cat := 'alto'; v_resp := 'Alto risco de ressangramento; considerar UTI e reavaliacao endoscopica';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'Rockall', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'fc', p_fc, 'pas', p_pas, 'comorbidade', p_comorbidade,
                        'diagnostico', p_diagnostico, 'estigmas_sangramento', p_estigmas_sangramento),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;

-- AIMS65
CREATE OR REPLACE FUNCTION public.fn_calcular_aims65(
  p_atendimento_id text, p_idade integer, p_albumina numeric, p_inr numeric,
  p_alteracao_mental boolean, p_pas integer, p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_total int := 0; v_cat text; v_resp text;
  v_lim text := 'AIMS65 usa albumina <3,0 g/dL, INR >1,5, alteracao do estado mental, PAS <=90 mmHg e idade >=65 anos. AIMS65 >=2: mortalidade elevada; considerar UTI.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('AIMS65', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_albumina IS NULL OR p_inr IS NULL OR p_alteracao_mental IS NULL OR p_pas IS NULL OR p_idade IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: idade, albumina, INR, alteracao mental e PAS'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_albumina < 3.0 THEN v_total := v_total + 1; END IF;
  IF p_inr > 1.5 THEN v_total := v_total + 1; END IF;
  IF p_alteracao_mental THEN v_total := v_total + 1; END IF;
  IF p_pas <= 90 THEN v_total := v_total + 1; END IF;
  IF p_idade >= 65 THEN v_total := v_total + 1; END IF;

  IF v_total <= 1 THEN v_cat := 'baixo'; v_resp := 'Mortalidade baixa; internacao em enfermaria e endoscopia conforme protocolo';
  ELSE v_cat := 'alto'; v_resp := 'Mortalidade elevada; considerar UTI, suporte hemodinamico e endoscopia precoce';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'AIMS65', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'albumina', p_albumina, 'inr', p_inr,
                        'alteracao_mental', p_alteracao_mental, 'pas', p_pas),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;

-- SMART-COP
CREATE OR REPLACE FUNCTION public.fn_calcular_smart_cop(
  p_atendimento_id text, p_idade integer, p_pas integer, p_multilobar boolean,
  p_albumina numeric, p_fr integer, p_fc integer, p_confusao boolean,
  p_spo2 integer, p_ph numeric, p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_total int := 0; v_cat text; v_resp text;
  v_lim text := 'SMART-COP usa cortes dependentes da idade para FR e oxigenacao (<=50 anos: FR >=25 e SpO2 <=93%; >50 anos: FR >=30 e SpO2 <=90%). SMART-COP 5-6: considerar UTI; >=7: UTI praticamente mandatoria. Nao substitui avaliacao clinica.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('SMART-COP', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_pas IS NULL OR p_multilobar IS NULL OR p_albumina IS NULL OR p_fr IS NULL OR p_fc IS NULL
     OR p_confusao IS NULL OR p_spo2 IS NULL OR p_ph IS NULL OR p_idade IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: idade, PAS, acometimento multilobar, albumina, FR, FC, confusao, SpO2 e pH'::text,
      v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_pas < 90 THEN v_total := v_total + 2; END IF;
  IF p_multilobar THEN v_total := v_total + 1; END IF;
  IF p_albumina < 3.5 THEN v_total := v_total + 1; END IF;

  IF p_idade <= 50 THEN
    IF p_fr >= 25 THEN v_total := v_total + 1; END IF;
    IF p_spo2 <= 93 THEN v_total := v_total + 2; END IF;
  ELSE
    IF p_fr >= 30 THEN v_total := v_total + 1; END IF;
    IF p_spo2 <= 90 THEN v_total := v_total + 2; END IF;
  END IF;

  IF p_fc >= 125 THEN v_total := v_total + 1; END IF;
  IF p_confusao THEN v_total := v_total + 1; END IF;
  IF p_ph < 7.35 THEN v_total := v_total + 2; END IF;

  IF v_total <= 2 THEN v_cat := 'baixo'; v_resp := 'Baixo risco de suporte intensivo; tratamento em enfermaria ou ambulatorial conforme contexto';
  ELSIF v_total <= 4 THEN v_cat := 'moderado'; v_resp := 'Risco moderado; internacao com monitorizacao';
  ELSIF v_total <= 6 THEN v_cat := 'alto'; v_resp := 'Risco alto; considerar UTI e suporte ventilatorio ou vasopressor';
  ELSE v_cat := 'muito_alto'; v_resp := 'Risco muito alto; UTI praticamente mandatoria';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'SMART-COP', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'pas', p_pas, 'multilobar', p_multilobar, 'albumina', p_albumina,
                        'fr', p_fr, 'fc', p_fc, 'confusao', p_confusao, 'spo2', p_spo2, 'ph', p_ph),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;

-- CRB-65
CREATE OR REPLACE FUNCTION public.fn_calcular_crb65(
  p_atendimento_id text, p_idade integer, p_confusao boolean, p_fr integer,
  p_pas integer, p_pad integer, p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_total int := 0; v_cat text; v_resp text;
  v_lim text := 'CRB-65 dispensa exame laboratorial e e util na atencao primaria. Nao validado em imunossuprimidos nem em pneumonia hospitalar.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('CRB-65', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_confusao IS NULL OR p_fr IS NULL OR p_pas IS NULL OR p_pad IS NULL OR p_idade IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: idade, confusao, FR, PAS e PAD'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_confusao THEN v_total := v_total + 1; END IF;
  IF p_fr >= 30 THEN v_total := v_total + 1; END IF;
  IF p_pas < 90 OR p_pad <= 60 THEN v_total := v_total + 1; END IF;
  IF p_idade >= 65 THEN v_total := v_total + 1; END IF;

  IF v_total = 0 THEN v_cat := 'baixo'; v_resp := 'Tratamento ambulatorial; orientar sinais de alarme';
  ELSIF v_total <= 2 THEN v_cat := 'intermediario'; v_resp := 'Considerar internacao; avaliar comorbidades e suporte social';
  ELSE v_cat := 'alto'; v_resp := 'Internacao; considerar UTI';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'CRB-65', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'confusao', p_confusao, 'fr', p_fr, 'pas', p_pas, 'pad', p_pad),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;

-- SIRS
CREATE OR REPLACE FUNCTION public.fn_calcular_sirs(
  p_atendimento_id text, p_idade integer, p_temperatura numeric, p_fc integer, p_fr integer,
  p_paco2 numeric DEFAULT NULL, p_leucocitos integer DEFAULT NULL, p_bastoes_pct numeric DEFAULT NULL,
  p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_total int := 0; v_cat text; v_resp text;
  v_lim text := 'SIRS >=2 com infeccao suspeita sugere sepse pela definicao antiga; o Sepsis-3 usa o SOFA. Alta sensibilidade e baixa especificidade. Criterio laboratorial exige leucograma; se ausente, o calculo usa apenas os criterios clinicos.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('SIRS', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_temperatura IS NULL OR p_fc IS NULL OR p_fr IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: temperatura, FC e FR'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_temperatura > 38 OR p_temperatura < 36 THEN v_total := v_total + 1; END IF;
  IF p_fc > 90 THEN v_total := v_total + 1; END IF;
  IF p_fr > 20 OR (p_paco2 IS NOT NULL AND p_paco2 < 32) THEN v_total := v_total + 1; END IF;

  IF p_leucocitos IS NOT NULL THEN
    IF p_leucocitos > 12000 OR p_leucocitos < 4000
       OR (p_bastoes_pct IS NOT NULL AND p_bastoes_pct > 10) THEN
      v_total := v_total + 1;
    END IF;
  END IF;

  IF v_total <= 1 THEN v_cat := 'baixo'; v_resp := 'Criterios de SIRS nao preenchidos; reavaliar conforme evolucao';
  ELSE v_cat := 'alto'; v_resp := 'SIRS presente: se houver infeccao suspeita, iniciar pacote de sepse e calcular qSOFA/SOFA';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'SIRS', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'temperatura', p_temperatura, 'fc', p_fc, 'fr', p_fr,
                        'paco2', p_paco2, 'leucocitos', p_leucocitos, 'bastoes_pct', p_bastoes_pct),
     (p_leucocitos IS NOT NULL), v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;

-- AIR (Appendicitis Inflammatory Response)
CREATE OR REPLACE FUNCTION public.fn_calcular_air(
  p_atendimento_id text, p_idade integer, p_vomito boolean, p_dor_fid boolean,
  p_defesa text, p_temperatura numeric, p_pmn_pct numeric, p_leucocitos numeric, p_pcr numeric,
  p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_total int := 0; v_cat text; v_resp text;
  v_lim text := 'AIR usa leucocitos em 10^3/mm3 e PCR em mg/L; defesa aceita: ausente, leve, moderada, intensa. AIR <=4: apendicite improvavel. AIR 5-8: imagem (US ou TC). AIR >=9: alta probabilidade, considerar cirurgia. Nao substitui avaliacao cirurgica.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('AIR', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_vomito IS NULL OR p_dor_fid IS NULL OR p_defesa IS NULL OR p_temperatura IS NULL
     OR p_pmn_pct IS NULL OR p_leucocitos IS NULL OR p_pcr IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: vomito, dor em fossa iliaca direita, defesa, temperatura, PMN, leucocitos e PCR'::text,
      v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_defesa NOT IN ('ausente','leve','moderada','intensa') THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::text, NULL::int, NULL::text,
      'Defesa deve ser ausente, leve, moderada ou intensa'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_vomito THEN v_total := v_total + 1; END IF;
  IF p_dor_fid THEN v_total := v_total + 1; END IF;
  v_total := v_total + CASE p_defesa WHEN 'leve' THEN 1 WHEN 'moderada' THEN 2 WHEN 'intensa' THEN 3 ELSE 0 END;
  IF p_temperatura >= 38.5 THEN v_total := v_total + 1; END IF;

  IF p_pmn_pct >= 85 THEN v_total := v_total + 2;
  ELSIF p_pmn_pct >= 70 THEN v_total := v_total + 1;
  END IF;

  IF p_leucocitos >= 15 THEN v_total := v_total + 2;
  ELSIF p_leucocitos >= 10 THEN v_total := v_total + 1;
  END IF;

  IF p_pcr >= 50 THEN v_total := v_total + 2;
  ELSIF p_pcr >= 10 THEN v_total := v_total + 1;
  END IF;

  IF v_total <= 4 THEN v_cat := 'baixo'; v_resp := 'Apendicite improvavel; observacao clinica e reavaliacao';
  ELSIF v_total <= 8 THEN v_cat := 'intermediario'; v_resp := 'Probabilidade intermediaria; imagem (ultrassom ou tomografia) e reavaliacao cirurgica';
  ELSE v_cat := 'alto'; v_resp := 'Alta probabilidade de apendicite; avaliacao cirurgica e considerar cirurgia sem imagem adicional';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'AIR', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'vomito', p_vomito, 'dor_fid', p_dor_fid, 'defesa', p_defesa,
                        'temperatura', p_temperatura, 'pmn_pct', p_pmn_pct, 'leucocitos', p_leucocitos, 'pcr', p_pcr),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;

-- SINS (Spinal Instability Neoplastic Score)
CREATE OR REPLACE FUNCTION public.fn_calcular_sins(
  p_atendimento_id text, p_idade integer, p_localizacao integer, p_dor integer,
  p_lesao_ossea integer, p_alinhamento integer, p_colapso integer, p_posterolateral integer,
  p_profissional text DEFAULT NULL)
RETURNS TABLE(status text, total integer, categoria text, resposta text, populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
DECLARE
  v_pop boolean; v_motivo text; v_versao text; v_total int; v_cat text; v_resp text;
  v_lim text := 'SINS avalia instabilidade de coluna por lesao neoplasica (0-18). Componentes: localizacao 0-3, dor 0-3, lesao ossea 0-2, alinhamento 0-4, colapso vertebral 0-3, envolvimento posterolateral 0-3. SINS 7-12 ou 13-18: avaliacao cirurgica. Nao avalia risco neurologico, que deve ser julgado clinicamente.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('SINS', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_localizacao IS NULL OR p_dor IS NULL OR p_lesao_ossea IS NULL
     OR p_alinhamento IS NULL OR p_colapso IS NULL OR p_posterolateral IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Os 6 componentes do SINS sao obrigatorios'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_localizacao < 0 OR p_localizacao > 3 OR p_dor < 0 OR p_dor > 3
     OR p_lesao_ossea < 0 OR p_lesao_ossea > 2 OR p_alinhamento < 0 OR p_alinhamento > 4
     OR p_colapso < 0 OR p_colapso > 3 OR p_posterolateral < 0 OR p_posterolateral > 3 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::text, NULL::int, NULL::text,
      'Componente do SINS fora da faixa permitida'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  v_total := p_localizacao + p_dor + p_lesao_ossea + p_alinhamento + p_colapso + p_posterolateral;

  IF v_total <= 6 THEN v_cat := 'estavel'; v_resp := 'Coluna estavel; seguimento oncologico e radioterapia conforme indicacao';
  ELSIF v_total <= 12 THEN v_cat := 'indeterminado'; v_resp := 'Instabilidade indeterminada; avaliacao com cirurgia de coluna';
  ELSE v_cat := 'instavel'; v_resp := 'Coluna instavel; avaliacao cirurgica urgente e imobilizacao';
  END IF;

  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas,
     resultado, categoria, conduta_sugerida, profissional, lote_id, red_flag_override)
  VALUES (p_atendimento_id, 'SINS', v_versao, v_pop,
     jsonb_build_object('idade', p_idade, 'localizacao', p_localizacao, 'dor', p_dor, 'lesao_ossea', p_lesao_ossea,
                        'alinhamento', p_alinhamento, 'colapso', p_colapso, 'posterolateral', p_posterolateral),
     true, v_total, v_cat, v_resp, p_profissional, 'funcoes_calculo_escores_v2', false);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_cat, v_resp, v_pop, v_versao, v_lim;
END; $fn$;