
ALTER TABLE public.audit_escores_clinicos ADD COLUMN IF NOT EXISTS entradas jsonb;
CREATE INDEX IF NOT EXISTS idx_audit_escores_populacao ON public.audit_escores_clinicos (populacao_validada);
CREATE INDEX IF NOT EXISTS idx_audit_escores_lote ON public.audit_escores_clinicos (lote_id);

-- =========================================================
-- VALIDACAO DE POPULACAO
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_validar_populacao_escore(
  p_escore_nome text,
  p_idade integer DEFAULT NULL,
  p_contexto text DEFAULT NULL
)
RETURNS TABLE(populacao_validada boolean, motivo text, versao_escore text)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $fn$
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
    WHEN 'NEWS2' THEN 16
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
$fn$;

-- =========================================================
-- REGISTRO MANUAL DE CALCULO
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_registrar_calculo_escore(
  p_atendimento_id text,
  p_nome_escore text,
  p_versao text,
  p_populacao_validada boolean,
  p_entradas jsonb,
  p_entradas_completas boolean,
  p_resultado numeric,
  p_categoria text,
  p_conduta_sugerida text,
  p_red_flag_override boolean DEFAULT false,
  p_conduta_real text DEFAULT NULL,
  p_divergencia boolean DEFAULT false,
  p_motivo_override text DEFAULT NULL,
  p_profissional text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SET search_path TO 'public'
AS $fn$
DECLARE v_id bigint;
BEGIN
  INSERT INTO public.audit_escores_clinicos
    (atendimento_id, nome_escore, versao, versao_escore, populacao_validada, entradas,
     entradas_completas, resultado, valor_total, categoria, red_flag_override,
     conduta_sugerida, conduta_real, divergencia, motivo_override, profissional, lote_id, fonte_id)
  VALUES
    (p_atendimento_id, p_nome_escore, p_versao, p_versao, p_populacao_validada, p_entradas,
     p_entradas_completas, p_resultado, p_resultado, p_categoria, p_red_flag_override,
     p_conduta_sugerida, p_conduta_real, p_divergencia, p_motivo_override, p_profissional,
     'funcoes_calculo_escores_v1', 'F001')
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$fn$;

-- =========================================================
-- NEWS2
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_calcular_news2(
  p_atendimento_id text,
  p_idade integer,
  p_fr integer,
  p_spo2 integer,
  p_suplemento boolean,
  p_temperatura numeric,
  p_pas integer,
  p_fc integer,
  p_consciencia text,
  p_escala integer DEFAULT 1,
  p_red_flag text DEFAULT NULL,
  p_profissional text DEFAULT NULL
)
RETURNS TABLE(status text, total integer, categoria text, resposta text,
              populacao_validada boolean, versao text, limitacoes text, red_flag_override boolean)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $fn$
DECLARE
  v_fr int := 0; v_spo2 int := 0; v_supl int := 0; v_temp int := 0;
  v_pas int := 0; v_fc int := 0; v_consc int := 0; v_total int := 0;
  v_categoria text; v_resposta text;
  v_pop boolean; v_motivo text; v_versao text;
  v_lim text := 'NEWS2 nao substitui julgamento clinico. Escala 2 apenas para risco de insuficiencia respiratoria hipercapnica. Nao validado em pediatria, gestantes ou lesao medular.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('NEWS2', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_fr IS NULL OR p_spo2 IS NULL OR p_suplemento IS NULL OR p_temperatura IS NULL
     OR p_pas IS NULL OR p_fc IS NULL OR p_consciencia IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: FR, SpO2, suplemento de oxigenio, temperatura, PAS, FC e nivel de consciencia'::text,
      v_pop, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_red_flag IN ('parada_cardiaca','obstrucao_via_aerea') THEN
    RETURN QUERY SELECT 'OVERRIDE'::text, NULL::int, NULL::text,
      'Red flag presente: resposta emergencial imediata independentemente do NEWS2'::text,
      v_pop, v_versao, v_lim, true; RETURN;
  END IF;

  IF p_fr BETWEEN 12 AND 20 THEN v_fr := 0;
  ELSIF p_fr BETWEEN 9 AND 11 THEN v_fr := 1;
  ELSIF p_fr BETWEEN 21 AND 24 THEN v_fr := 2;
  ELSE v_fr := 3; END IF;

  IF coalesce(p_escala,1) = 2 THEN
    IF p_suplemento AND p_spo2 >= 97 THEN v_spo2 := 3;
    ELSIF p_suplemento AND p_spo2 BETWEEN 95 AND 96 THEN v_spo2 := 2;
    ELSIF p_suplemento AND p_spo2 BETWEEN 93 AND 94 THEN v_spo2 := 1;
    ELSIF p_spo2 BETWEEN 88 AND 92 THEN v_spo2 := 0;
    ELSIF p_spo2 BETWEEN 86 AND 87 THEN v_spo2 := 1;
    ELSIF p_spo2 BETWEEN 84 AND 85 THEN v_spo2 := 2;
    ELSIF p_spo2 <= 83 THEN v_spo2 := 3;
    ELSE v_spo2 := 0; END IF;
  ELSE
    IF p_spo2 >= 96 THEN v_spo2 := 0;
    ELSIF p_spo2 BETWEEN 94 AND 95 THEN v_spo2 := 1;
    ELSIF p_spo2 BETWEEN 92 AND 93 THEN v_spo2 := 2;
    ELSE v_spo2 := 3; END IF;
  END IF;

  IF p_suplemento THEN v_supl := 2; END IF;

  IF p_temperatura BETWEEN 36.1 AND 38.0 THEN v_temp := 0;
  ELSIF p_temperatura BETWEEN 35.1 AND 36.0 OR p_temperatura BETWEEN 38.1 AND 39.0 THEN v_temp := 1;
  ELSIF p_temperatura >= 39.1 THEN v_temp := 2;
  ELSE v_temp := 3; END IF;

  IF p_pas BETWEEN 111 AND 219 THEN v_pas := 0;
  ELSIF p_pas BETWEEN 101 AND 110 THEN v_pas := 1;
  ELSIF p_pas BETWEEN 91 AND 100 THEN v_pas := 2;
  ELSE v_pas := 3; END IF;

  IF p_fc BETWEEN 51 AND 90 THEN v_fc := 0;
  ELSIF p_fc BETWEEN 41 AND 50 OR p_fc BETWEEN 91 AND 110 THEN v_fc := 1;
  ELSIF p_fc BETWEEN 111 AND 130 THEN v_fc := 2;
  ELSE v_fc := 3; END IF;

  IF upper(p_consciencia) = 'A' THEN v_consc := 0; ELSE v_consc := 3; END IF;

  v_total := v_fr + v_spo2 + v_supl + v_temp + v_pas + v_fc + v_consc;

  IF v_total = 0 THEN
    v_categoria := 'baixo'; v_resposta := 'Monitorizacao de rotina a cada 12 horas';
  ELSIF v_total >= 7 THEN
    v_categoria := 'alto'; v_resposta := 'Resposta emergencial: acionar time de resposta rapida e considerar UTI';
  ELSIF v_total BETWEEN 5 AND 6 THEN
    v_categoria := 'medio'; v_resposta := 'Resposta urgente em 30 minutos e monitorizacao horaria';
  ELSIF greatest(v_fr, v_spo2, v_temp, v_pas, v_fc, v_consc) = 3 THEN
    v_categoria := 'urgente_parametro_isolado';
    v_resposta := 'Avaliacao medica urgente: parametro isolado com pontuacao 3';
  ELSE
    v_categoria := 'baixo_moderado'; v_resposta := 'Avaliacao de enfermagem e monitorizacao a cada 4 a 6 horas';
  END IF;

  PERFORM public.fn_registrar_calculo_escore(
    p_atendimento_id, 'NEWS2', v_versao, v_pop,
    jsonb_build_object('fr',p_fr,'spo2',p_spo2,'suplemento',p_suplemento,'temperatura',p_temperatura,
                       'pas',p_pas,'fc',p_fc,'consciencia',p_consciencia,'escala',coalesce(p_escala,1)),
    true, v_total, v_categoria, v_resposta, false, NULL, false, NULL, p_profissional);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_categoria, v_resposta, v_pop, v_versao, v_lim, false;
END;
$fn$;

-- =========================================================
-- qSOFA
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_calcular_qsofa(
  p_atendimento_id text,
  p_idade integer,
  p_fr integer,
  p_pas integer,
  p_consciencia_alterada boolean,
  p_red_flag text DEFAULT NULL,
  p_profissional text DEFAULT NULL
)
RETURNS TABLE(status text, total integer, categoria text, resposta text,
              populacao_validada boolean, versao text, limitacoes text, red_flag_override boolean)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $fn$
DECLARE
  v_total int := 0; v_categoria text; v_resposta text;
  v_pop boolean; v_motivo text; v_versao text;
  v_lim text := 'qSOFA nao exclui sepse (sensibilidade limitada). Nao usar em pediatria. qSOFA 0-1 com alta suspeita clinica exige vigilancia.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('qSOFA', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_fr IS NULL OR p_pas IS NULL OR p_consciencia_alterada IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: FR, PAS e alteracao do nivel de consciencia'::text,
      v_pop, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_red_flag = 'choque_confirmado' THEN
    RETURN QUERY SELECT 'OVERRIDE'::text, NULL::int, NULL::text,
      'Choque confirmado: ativar protocolo de sepse imediatamente, independentemente do qSOFA'::text,
      v_pop, v_versao, v_lim, true; RETURN;
  END IF;

  IF p_fr >= 22 THEN v_total := v_total + 1; END IF;
  IF p_pas <= 100 THEN v_total := v_total + 1; END IF;
  IF p_consciencia_alterada THEN v_total := v_total + 1; END IF;

  IF v_total >= 2 THEN
    v_categoria := 'risco_elevado';
    v_resposta := 'Ativar protocolo de sepse: lactato, hemoculturas, antibiotico e imagem do foco';
  ELSE
    v_categoria := 'risco_menor';
    v_resposta := 'Risco menor; manter vigilancia e reavaliar se alta suspeita clinica';
  END IF;

  PERFORM public.fn_registrar_calculo_escore(
    p_atendimento_id, 'qSOFA', v_versao, v_pop,
    jsonb_build_object('fr',p_fr,'pas',p_pas,'consciencia_alterada',p_consciencia_alterada),
    true, v_total, v_categoria, v_resposta, false, NULL, false, NULL, p_profissional);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_categoria, v_resposta, v_pop, v_versao, v_lim, false;
END;
$fn$;

-- =========================================================
-- SOFA
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_calcular_sofa(
  p_atendimento_id text,
  p_idade integer,
  p_pao2_fio2 numeric DEFAULT NULL,
  p_plaquetas integer DEFAULT NULL,
  p_bilirrubina numeric DEFAULT NULL,
  p_pam numeric DEFAULT NULL,
  p_vasopressor text DEFAULT NULL,
  p_dose_vasopressor numeric DEFAULT NULL,
  p_gcs integer DEFAULT NULL,
  p_creatinina numeric DEFAULT NULL,
  p_diurese_ml_dia integer DEFAULT NULL,
  p_profissional text DEFAULT NULL
)
RETURNS TABLE(status text, total integer, categoria text, resposta text,
              populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $fn$
DECLARE
  v_resp int := 0; v_coag int := 0; v_hep int := 0; v_card int := 0;
  v_neuro int := 0; v_renal int := 0; v_total int := 0;
  v_categoria text; v_resposta text;
  v_pop boolean; v_motivo text; v_versao text;
  v_completo boolean;
  v_lim text := 'SOFA avalia 6 sistemas. Aumento de 2 pontos em contexto de infeccao define sepse. Bilirrubina em mg/dL e creatinina em mg/dL. Nao usar em pediatria (usar pSOFA).';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('SOFA', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_pao2_fio2 IS NULL AND p_plaquetas IS NULL AND p_bilirrubina IS NULL
     AND p_pam IS NULL AND p_gcs IS NULL AND p_creatinina IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Pelo menos um parametro e necessario para calcular o SOFA'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  v_completo := (p_pao2_fio2 IS NOT NULL AND p_plaquetas IS NOT NULL AND p_bilirrubina IS NOT NULL
                 AND p_pam IS NOT NULL AND p_gcs IS NOT NULL AND p_creatinina IS NOT NULL);

  IF p_pao2_fio2 IS NOT NULL THEN
    IF p_pao2_fio2 >= 400 THEN v_resp := 0;
    ELSIF p_pao2_fio2 >= 300 THEN v_resp := 1;
    ELSIF p_pao2_fio2 >= 200 THEN v_resp := 2;
    ELSIF p_pao2_fio2 >= 100 THEN v_resp := 3;
    ELSE v_resp := 4; END IF;
  END IF;

  IF p_plaquetas IS NOT NULL THEN
    IF p_plaquetas >= 150 THEN v_coag := 0;
    ELSIF p_plaquetas >= 100 THEN v_coag := 1;
    ELSIF p_plaquetas >= 50 THEN v_coag := 2;
    ELSIF p_plaquetas >= 20 THEN v_coag := 3;
    ELSE v_coag := 4; END IF;
  END IF;

  IF p_bilirrubina IS NOT NULL THEN
    IF p_bilirrubina < 1.2 THEN v_hep := 0;
    ELSIF p_bilirrubina < 2.0 THEN v_hep := 1;
    ELSIF p_bilirrubina < 6.0 THEN v_hep := 2;
    ELSIF p_bilirrubina < 12.0 THEN v_hep := 3;
    ELSE v_hep := 4; END IF;
  END IF;

  IF p_vasopressor IS NOT NULL THEN
    IF lower(p_vasopressor) IN ('noradrenalina','adrenalina') THEN
      IF coalesce(p_dose_vasopressor,0) > 0.1 THEN v_card := 4; ELSE v_card := 3; END IF;
    ELSIF lower(p_vasopressor) = 'dopamina' THEN
      IF coalesce(p_dose_vasopressor,0) > 15 THEN v_card := 4;
      ELSIF coalesce(p_dose_vasopressor,0) > 5 THEN v_card := 3;
      ELSE v_card := 2; END IF;
    ELSIF lower(p_vasopressor) = 'dobutamina' THEN v_card := 2;
    ELSE v_card := 2; END IF;
  ELSIF p_pam IS NOT NULL THEN
    IF p_pam >= 70 THEN v_card := 0; ELSE v_card := 1; END IF;
  END IF;

  IF p_gcs IS NOT NULL THEN
    IF p_gcs = 15 THEN v_neuro := 0;
    ELSIF p_gcs >= 13 THEN v_neuro := 1;
    ELSIF p_gcs >= 10 THEN v_neuro := 2;
    ELSIF p_gcs >= 6 THEN v_neuro := 3;
    ELSE v_neuro := 4; END IF;
  END IF;

  IF p_creatinina IS NOT NULL OR p_diurese_ml_dia IS NOT NULL THEN
    IF (p_diurese_ml_dia IS NOT NULL AND p_diurese_ml_dia < 200) OR coalesce(p_creatinina,0) >= 5.0 THEN v_renal := 4;
    ELSIF (p_diurese_ml_dia IS NOT NULL AND p_diurese_ml_dia < 500) OR coalesce(p_creatinina,0) >= 3.5 THEN v_renal := 3;
    ELSIF coalesce(p_creatinina,0) >= 2.0 THEN v_renal := 2;
    ELSIF coalesce(p_creatinina,0) >= 1.2 THEN v_renal := 1;
    ELSE v_renal := 0; END IF;
  END IF;

  v_total := v_resp + v_coag + v_hep + v_card + v_neuro + v_renal;

  IF v_total >= 12 THEN
    v_categoria := 'disfuncao_grave';
    v_resposta := 'Disfuncao organica grave: UTI com suporte de multiplos orgaos';
  ELSIF v_total >= 6 THEN
    v_categoria := 'disfuncao_moderada';
    v_resposta := 'Disfuncao organica moderada: leito monitorizado e reavaliacao em 24 horas';
  ELSIF v_total >= 2 THEN
    v_categoria := 'disfuncao_inicial';
    v_resposta := 'Disfuncao organica inicial: em contexto de infeccao, considerar sepse e iniciar pacote';
  ELSE
    v_categoria := 'sem_disfuncao';
    v_resposta := 'Sem disfuncao organica significativa; reavaliar em 24 horas';
  END IF;

  PERFORM public.fn_registrar_calculo_escore(
    p_atendimento_id, 'SOFA', v_versao, v_pop,
    jsonb_build_object('pao2_fio2',p_pao2_fio2,'plaquetas',p_plaquetas,'bilirrubina',p_bilirrubina,
                       'pam',p_pam,'vasopressor',p_vasopressor,'dose_vasopressor',p_dose_vasopressor,
                       'gcs',p_gcs,'creatinina',p_creatinina,'diurese_ml_dia',p_diurese_ml_dia,
                       'componentes', jsonb_build_object('respiratorio',v_resp,'coagulacao',v_coag,
                         'hepatico',v_hep,'cardiovascular',v_card,'neurologico',v_neuro,'renal',v_renal)),
    v_completo, v_total, v_categoria, v_resposta, false, NULL, false, NULL, p_profissional);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_categoria, v_resposta, v_pop, v_versao, v_lim;
END;
$fn$;

-- =========================================================
-- GLASGOW
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_calcular_gcs(
  p_atendimento_id text,
  p_idade integer,
  p_ocular integer,
  p_verbal integer,
  p_motora integer,
  p_red_flag text DEFAULT NULL,
  p_profissional text DEFAULT NULL
)
RETURNS TABLE(status text, total integer, categoria text, resposta text,
              populacao_validada boolean, versao text, limitacoes text, red_flag_override boolean)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $fn$
DECLARE
  v_total int; v_categoria text; v_resposta text;
  v_pop boolean; v_motivo text; v_versao text;
  v_lim text := 'GCS perde acuracia em paciente sedado, intubado, afasico ou intoxicado. Registrar sempre os tres componentes separadamente.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('Glasgow', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_ocular IS NULL OR p_verbal IS NULL OR p_motora IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: abertura ocular, resposta verbal e resposta motora'::text,
      v_pop, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_ocular < 1 OR p_ocular > 4 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::text, NULL::int, NULL::text,
      'Componente ocular deve estar entre 1 e 4'::text, v_pop, v_versao, v_lim, false; RETURN;
  END IF;
  IF p_verbal < 1 OR p_verbal > 5 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::text, NULL::int, NULL::text,
      'Componente verbal deve estar entre 1 e 5'::text, v_pop, v_versao, v_lim, false; RETURN;
  END IF;
  IF p_motora < 1 OR p_motora > 6 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::text, NULL::int, NULL::text,
      'Componente motor deve estar entre 1 e 6'::text, v_pop, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_red_flag = 'parada_cardiaca' THEN
    RETURN QUERY SELECT 'OVERRIDE'::text, NULL::int, NULL::text,
      'Parada cardiaca: ACLS imediato independentemente do GCS'::text,
      v_pop, v_versao, v_lim, true; RETURN;
  END IF;

  v_total := p_ocular + p_verbal + p_motora;

  IF v_total <= 8 THEN
    v_categoria := 'grave'; v_resposta := 'TCE grave: via aerea definitiva, tomografia de cranio e neurocirurgia';
  ELSIF v_total <= 12 THEN
    v_categoria := 'moderado'; v_resposta := 'TCE moderado: tomografia de cranio e observacao monitorizada';
  ELSE
    v_categoria := 'leve'; v_resposta := 'TCE leve: aplicar Canadian CT Head e observar sinais de alarme';
  END IF;

  PERFORM public.fn_registrar_calculo_escore(
    p_atendimento_id, 'Glasgow', v_versao, v_pop,
    jsonb_build_object('ocular',p_ocular,'verbal',p_verbal,'motora',p_motora),
    true, v_total, v_categoria, v_resposta, false, NULL, false, NULL, p_profissional);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_categoria, v_resposta, v_pop, v_versao, v_lim, false;
END;
$fn$;

-- =========================================================
-- 4AT
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_calcular_4at(
  p_atendimento_id text,
  p_idade integer,
  p_alerta integer,
  p_amt4 integer,
  p_atencao integer,
  p_curso_agudo integer,
  p_profissional text DEFAULT NULL
)
RETURNS TABLE(status text, total integer, categoria text, resposta text,
              populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $fn$
DECLARE
  v_total int; v_categoria text; v_resposta text;
  v_pop boolean; v_motivo text; v_versao text;
  v_lim text := '4AT e ferramenta de rastreio, nao diagnostica delirium. Alerta 0 ou 4; AMT4 0, 1 ou 2; atencao 0, 1 ou 2; curso agudo 0 ou 4.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('4AT', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_alerta IS NULL OR p_amt4 IS NULL OR p_atencao IS NULL OR p_curso_agudo IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: alerta, AMT4, atencao e curso agudo ou flutuante'::text,
      v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_alerta NOT IN (0,4) OR p_amt4 NOT IN (0,1,2) OR p_atencao NOT IN (0,1,2) OR p_curso_agudo NOT IN (0,4) THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::text, NULL::int, NULL::text,
      'Pontuacoes validas: alerta 0 ou 4; AMT4 0 a 2; atencao 0 a 2; curso agudo 0 ou 4'::text,
      v_pop, v_versao, v_lim; RETURN;
  END IF;

  v_total := p_alerta + p_amt4 + p_atencao + p_curso_agudo;

  IF v_total >= 4 THEN
    v_categoria := 'possivel_delirium';
    v_resposta := 'Possivel delirium: ativar protocolo, revisar farmacos e investigar causa organica';
  ELSIF v_total >= 1 THEN
    v_categoria := 'possivel_comprometimento_cognitivo';
    v_resposta := 'Possivel comprometimento cognitivo: avaliacao cognitiva adicional';
  ELSE
    v_categoria := 'improvavel';
    v_resposta := 'Delirium e comprometimento cognitivo improvaveis; reavaliar se mudanca clinica';
  END IF;

  PERFORM public.fn_registrar_calculo_escore(
    p_atendimento_id, '4AT', v_versao, v_pop,
    jsonb_build_object('alerta',p_alerta,'amt4',p_amt4,'atencao',p_atencao,'curso_agudo',p_curso_agudo),
    true, v_total, v_categoria, v_resposta, false, NULL, false, NULL, p_profissional);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_categoria, v_resposta, v_pop, v_versao, v_lim;
END;
$fn$;

-- =========================================================
-- CURB-65
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_calcular_curb65(
  p_atendimento_id text,
  p_idade integer,
  p_confusao boolean,
  p_ureia numeric,
  p_fr integer,
  p_pas integer,
  p_pad integer,
  p_profissional text DEFAULT NULL
)
RETURNS TABLE(status text, total integer, categoria text, resposta text,
              populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $fn$
DECLARE
  v_total int := 0; v_categoria text; v_resposta text;
  v_pop boolean; v_motivo text; v_versao text;
  v_lim text := 'CURB-65 usa ureia em mg/dL (corte >42 mg/dL, equivalente a 7 mmol/L). Nao validado em imunossuprimidos nem em pneumonia hospitalar.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('CURB-65', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_confusao IS NULL OR p_ureia IS NULL OR p_fr IS NULL OR p_pas IS NULL OR p_pad IS NULL OR p_idade IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: confusao, ureia, FR, PAS, PAD e idade'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_confusao THEN v_total := v_total + 1; END IF;
  IF p_ureia > 42 THEN v_total := v_total + 1; END IF;
  IF p_fr >= 30 THEN v_total := v_total + 1; END IF;
  IF p_pas < 90 OR p_pad <= 60 THEN v_total := v_total + 1; END IF;
  IF p_idade >= 65 THEN v_total := v_total + 1; END IF;

  IF v_total = 0 THEN
    v_categoria := 'baixo'; v_resposta := 'Tratamento ambulatorial com orientacao de sinais de alarme';
  ELSIF v_total = 1 THEN
    v_categoria := 'baixo_moderado'; v_resposta := 'Considerar internacao conforme comorbidades e suporte social';
  ELSIF v_total = 2 THEN
    v_categoria := 'intermediario'; v_resposta := 'Internacao hospitalar';
  ELSE
    v_categoria := 'alto'; v_resposta := 'Internacao com avaliacao de UTI e suporte ventilatorio';
  END IF;

  PERFORM public.fn_registrar_calculo_escore(
    p_atendimento_id, 'CURB-65', v_versao, v_pop,
    jsonb_build_object('confusao',p_confusao,'ureia_mg_dl',p_ureia,'fr',p_fr,'pas',p_pas,'pad',p_pad,'idade',p_idade),
    true, v_total, v_categoria, v_resposta, false, NULL, false, NULL, p_profissional);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_categoria, v_resposta, v_pop, v_versao, v_lim;
END;
$fn$;

-- =========================================================
-- HEART
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_calcular_heart(
  p_atendimento_id text,
  p_idade integer,
  p_historia integer,
  p_ecg integer,
  p_fatores_risco integer,
  p_troponina integer,
  p_red_flag text DEFAULT NULL,
  p_profissional text DEFAULT NULL
)
RETURNS TABLE(status text, total integer, categoria text, resposta text,
              populacao_validada boolean, versao text, limitacoes text, red_flag_override boolean)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $fn$
DECLARE
  v_total int; v_idade_pontos int; v_categoria text; v_resposta text;
  v_pop boolean; v_motivo text; v_versao text;
  v_lim text := 'HEART nao se aplica a IAMCSST com ECG diagnostico. Nao dar alta com troponina unica: repetir conforme protocolo.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('HEART', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_historia IS NULL OR p_ecg IS NULL OR p_fatores_risco IS NULL OR p_troponina IS NULL OR p_idade IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: historia, ECG, fatores de risco, troponina e idade'::text,
      v_pop, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_historia NOT BETWEEN 0 AND 2 OR p_ecg NOT BETWEEN 0 AND 2
     OR p_fatores_risco NOT BETWEEN 0 AND 2 OR p_troponina NOT BETWEEN 0 AND 2 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::text, NULL::int, NULL::text,
      'Historia, ECG, fatores de risco e troponina devem estar entre 0 e 2'::text,
      v_pop, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_red_flag = 'supra_ST' THEN
    RETURN QUERY SELECT 'OVERRIDE'::text, NULL::int, NULL::text,
      'IAMCSST com ECG diagnostico: protocolo de reperfusao imediato; nao aplicar HEART'::text,
      v_pop, v_versao, v_lim, true; RETURN;
  END IF;

  IF p_idade < 45 THEN v_idade_pontos := 0;
  ELSIF p_idade <= 64 THEN v_idade_pontos := 1;
  ELSE v_idade_pontos := 2; END IF;

  v_total := p_historia + p_ecg + v_idade_pontos + p_fatores_risco + p_troponina;

  IF v_total <= 3 THEN
    v_categoria := 'baixo';
    v_resposta := 'Baixo risco: alta possivel apos troponina seriada negativa, com reavaliacao ambulatorial';
  ELSIF v_total <= 6 THEN
    v_categoria := 'moderado';
    v_resposta := 'Risco moderado: observacao com troponina seriada e teste funcional antes da alta';
  ELSE
    v_categoria := 'alto';
    v_resposta := 'Alto risco: internacao e estrategia invasiva com angiografia';
  END IF;

  PERFORM public.fn_registrar_calculo_escore(
    p_atendimento_id, 'HEART', v_versao, v_pop,
    jsonb_build_object('historia',p_historia,'ecg',p_ecg,'idade',p_idade,'idade_pontos',v_idade_pontos,
                       'fatores_risco',p_fatores_risco,'troponina',p_troponina),
    true, v_total, v_categoria, v_resposta, false, NULL, false, NULL, p_profissional);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_categoria, v_resposta, v_pop, v_versao, v_lim, false;
END;
$fn$;

-- =========================================================
-- WELLS TEP
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_calcular_wells_tep(
  p_atendimento_id text,
  p_idade integer,
  p_sinais_tvp boolean,
  p_dx_alternativo_menos_provavel boolean,
  p_fc integer,
  p_imobilizacao_cirurgia boolean,
  p_tep_previa boolean,
  p_hemoptise boolean,
  p_cancer boolean,
  p_red_flag text DEFAULT NULL,
  p_profissional text DEFAULT NULL
)
RETURNS TABLE(status text, total numeric, categoria text, resposta text,
              populacao_validada boolean, versao text, limitacoes text, red_flag_override boolean)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $fn$
DECLARE
  v_total numeric := 0; v_categoria text; v_resposta text;
  v_pop boolean; v_motivo text; v_versao text;
  v_lim text := 'Wells nao se aplica a paciente instavel: instabilidade indica imagem imediata. Validacao limitada em gestantes.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('Wells-TEP', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::numeric, NULL::text, v_motivo, false, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_sinais_tvp IS NULL OR p_dx_alternativo_menos_provavel IS NULL OR p_fc IS NULL
     OR p_imobilizacao_cirurgia IS NULL OR p_tep_previa IS NULL OR p_hemoptise IS NULL OR p_cancer IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::numeric, NULL::text,
      'Todas as sete entradas do Wells sao obrigatorias'::text, v_pop, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_red_flag = 'instabilidade_hemodinamica' THEN
    RETURN QUERY SELECT 'OVERRIDE'::text, NULL::numeric, NULL::text,
      'Instabilidade hemodinamica: imagem imediata e considerar tromboliticos; nao aguardar Wells'::text,
      v_pop, v_versao, v_lim, true; RETURN;
  END IF;

  IF p_sinais_tvp THEN v_total := v_total + 3; END IF;
  IF p_dx_alternativo_menos_provavel THEN v_total := v_total + 3; END IF;
  IF p_fc > 100 THEN v_total := v_total + 1.5; END IF;
  IF p_imobilizacao_cirurgia THEN v_total := v_total + 1.5; END IF;
  IF p_tep_previa THEN v_total := v_total + 1.5; END IF;
  IF p_hemoptise THEN v_total := v_total + 1; END IF;
  IF p_cancer THEN v_total := v_total + 1; END IF;

  IF v_total <= 4 THEN
    v_categoria := 'tep_improvavel';
    v_resposta := 'TEP improvavel: solicitar D-dimero; se negativo, TEP excluida';
  ELSE
    v_categoria := 'tep_provavel';
    v_resposta := 'TEP provavel: angiotomografia de torax; considerar anticoagulacao empirica';
  END IF;

  PERFORM public.fn_registrar_calculo_escore(
    p_atendimento_id, 'Wells-TEP', v_versao, v_pop,
    jsonb_build_object('sinais_tvp',p_sinais_tvp,'dx_alternativo_menos_provavel',p_dx_alternativo_menos_provavel,
                       'fc',p_fc,'imobilizacao_cirurgia',p_imobilizacao_cirurgia,'tep_previa',p_tep_previa,
                       'hemoptise',p_hemoptise,'cancer',p_cancer),
    true, v_total, v_categoria, v_resposta, false, NULL, false, NULL, p_profissional);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_categoria, v_resposta, v_pop, v_versao, v_lim, false;
END;
$fn$;

-- =========================================================
-- PERC
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_calcular_perc(
  p_atendimento_id text,
  p_idade integer,
  p_fc integer,
  p_spo2 integer,
  p_hemoptise boolean,
  p_estrogenio boolean,
  p_cirurgia_trauma boolean,
  p_tep_previa boolean,
  p_edema_unilateral boolean,
  p_probabilidade_pre_teste text,
  p_profissional text DEFAULT NULL
)
RETURNS TABLE(status text, todos_negativos boolean, resposta text,
              populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $fn$
DECLARE
  v_neg boolean := true;
  v_resposta text;
  v_pop boolean; v_motivo text; v_versao text;
  v_lim text := 'PERC so se aplica com probabilidade pre-teste baixa (menor que 15 por cento). Os oito criterios sao idade, FC, SpO2, hemoptise, estrogenio, cirurgia ou trauma recente, TVP ou TEP previa e edema unilateral de membro.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('PERC', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::boolean, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_probabilidade_pre_teste IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::boolean,
      'Probabilidade pre-teste e obrigatoria para aplicar o PERC'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF lower(p_probabilidade_pre_teste) IN ('alta','intermediaria','moderada') THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::boolean,
      'PERC nao aplicavel com probabilidade pre-teste igual ou superior a 15 por cento; usar Wells ou Genebra'::text,
      v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_fc IS NULL OR p_spo2 IS NULL OR p_hemoptise IS NULL OR p_estrogenio IS NULL
     OR p_cirurgia_trauma IS NULL OR p_tep_previa IS NULL OR p_edema_unilateral IS NULL OR p_idade IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::boolean,
      'Os oito criterios do PERC sao obrigatorios'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_idade >= 50 THEN v_neg := false; END IF;
  IF p_fc >= 100 THEN v_neg := false; END IF;
  IF p_spo2 < 95 THEN v_neg := false; END IF;
  IF p_hemoptise THEN v_neg := false; END IF;
  IF p_estrogenio THEN v_neg := false; END IF;
  IF p_cirurgia_trauma THEN v_neg := false; END IF;
  IF p_tep_previa THEN v_neg := false; END IF;
  IF p_edema_unilateral THEN v_neg := false; END IF;

  IF v_neg THEN
    v_resposta := 'PERC totalmente negativo com baixa probabilidade pre-teste: TEP excluida sem D-dimero';
  ELSE
    v_resposta := 'PERC positivo: solicitar D-dimero; nao excluir TEP sem investigacao';
  END IF;

  PERFORM public.fn_registrar_calculo_escore(
    p_atendimento_id, 'PERC', v_versao, v_pop,
    jsonb_build_object('idade',p_idade,'fc',p_fc,'spo2',p_spo2,'hemoptise',p_hemoptise,
                       'estrogenio',p_estrogenio,'cirurgia_trauma',p_cirurgia_trauma,
                       'tep_previa',p_tep_previa,'edema_unilateral',p_edema_unilateral,
                       'probabilidade_pre_teste',p_probabilidade_pre_teste),
    true, CASE WHEN v_neg THEN 0 ELSE 1 END,
    CASE WHEN v_neg THEN 'todos_negativos' ELSE 'qualquer_positivo' END,
    v_resposta, false, NULL, false, NULL, p_profissional);

  RETURN QUERY SELECT 'CALCULATED'::text, v_neg, v_resposta, v_pop, v_versao, v_lim;
END;
$fn$;

-- =========================================================
-- GLASGOW-BLATCHFORD
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_calcular_gbs(
  p_atendimento_id text,
  p_idade integer,
  p_ureia_mmol numeric,
  p_hemoglobina numeric,
  p_sexo text,
  p_pas integer,
  p_pulso integer,
  p_melena boolean,
  p_sincope boolean,
  p_hepatopatia boolean,
  p_ic boolean,
  p_red_flag text DEFAULT NULL,
  p_profissional text DEFAULT NULL
)
RETURNS TABLE(status text, total integer, categoria text, resposta text,
              populacao_validada boolean, versao text, limitacoes text, red_flag_override boolean)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $fn$
DECLARE
  v_total int := 0; v_categoria text; v_resposta text;
  v_pop boolean; v_motivo text; v_versao text;
  v_lim text := 'GBS e pre-endoscopico e usa ureia em mmol/L (mg/dL dividido por 6). Sangramento ativo indica internacao independentemente do escore.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('GBS', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_ureia_mmol IS NULL OR p_hemoglobina IS NULL OR p_sexo IS NULL OR p_pas IS NULL
     OR p_pulso IS NULL OR p_melena IS NULL OR p_sincope IS NULL OR p_hepatopatia IS NULL OR p_ic IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Todas as entradas do GBS sao obrigatorias'::text, v_pop, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_red_flag = 'sangramento_ativo' THEN
    RETURN QUERY SELECT 'OVERRIDE'::text, NULL::int, NULL::text,
      'Sangramento ativo: internacao e endoscopia urgente independentemente do GBS'::text,
      v_pop, v_versao, v_lim, true; RETURN;
  END IF;

  IF p_ureia_mmol >= 25 THEN v_total := v_total + 6;
  ELSIF p_ureia_mmol >= 10 THEN v_total := v_total + 4;
  ELSIF p_ureia_mmol >= 8 THEN v_total := v_total + 3;
  ELSIF p_ureia_mmol >= 6.5 THEN v_total := v_total + 2; END IF;

  IF upper(p_sexo) IN ('M','MASCULINO') THEN
    IF p_hemoglobina < 10 THEN v_total := v_total + 6;
    ELSIF p_hemoglobina < 12 THEN v_total := v_total + 3;
    ELSIF p_hemoglobina < 13 THEN v_total := v_total + 1; END IF;
  ELSE
    IF p_hemoglobina < 10 THEN v_total := v_total + 6;
    ELSIF p_hemoglobina < 12 THEN v_total := v_total + 1; END IF;
  END IF;

  IF p_pas < 90 THEN v_total := v_total + 3;
  ELSIF p_pas < 100 THEN v_total := v_total + 2;
  ELSIF p_pas < 110 THEN v_total := v_total + 1; END IF;

  IF p_pulso >= 100 THEN v_total := v_total + 1; END IF;
  IF p_melena THEN v_total := v_total + 1; END IF;
  IF p_sincope THEN v_total := v_total + 2; END IF;
  IF p_hepatopatia THEN v_total := v_total + 2; END IF;
  IF p_ic THEN v_total := v_total + 2; END IF;

  IF v_total <= 1 THEN
    v_categoria := 'baixo';
    v_resposta := 'Baixo risco: alta com endoscopia ambulatorial em ate 72 horas';
  ELSIF v_total <= 6 THEN
    v_categoria := 'intermediario';
    v_resposta := 'Risco intermediario: internacao com endoscopia precoce';
  ELSE
    v_categoria := 'alto';
    v_resposta := 'Alto risco: internacao, reserva de hemocomponentes e endoscopia em ate 24 horas';
  END IF;

  PERFORM public.fn_registrar_calculo_escore(
    p_atendimento_id, 'GBS', v_versao, v_pop,
    jsonb_build_object('ureia_mmol',p_ureia_mmol,'hemoglobina',p_hemoglobina,'sexo',p_sexo,'pas',p_pas,
                       'pulso',p_pulso,'melena',p_melena,'sincope',p_sincope,
                       'hepatopatia',p_hepatopatia,'insuficiencia_cardiaca',p_ic),
    true, v_total, v_categoria, v_resposta, false, NULL, false, NULL, p_profissional);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_categoria, v_resposta, v_pop, v_versao, v_lim, false;
END;
$fn$;

-- =========================================================
-- MASCC
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_calcular_mascc(
  p_atendimento_id text,
  p_idade integer,
  p_burden integer,
  p_sem_hipotensao boolean,
  p_sem_dpoc boolean,
  p_tumor_solido boolean,
  p_sem_desidratacao boolean,
  p_ambulatorial boolean,
  p_instabilidade boolean DEFAULT false,
  p_profissional text DEFAULT NULL
)
RETURNS TABLE(status text, total integer, categoria text, resposta text,
              populacao_validada boolean, versao text, limitacoes text, red_flag_override boolean)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $fn$
DECLARE
  v_total int := 0; v_categoria text; v_resposta text;
  v_pop boolean; v_motivo text; v_versao text;
  v_lim text := 'Burden de sintomas: 5 pontos se ausente ou leve, 3 se moderado, 0 se grave (maximo de 5 nesse item). Instabilidade indica internacao independentemente do MASCC. Nao validado em pediatria.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('MASCC', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_burden IS NULL OR p_sem_hipotensao IS NULL OR p_sem_dpoc IS NULL
     OR p_tumor_solido IS NULL OR p_sem_desidratacao IS NULL OR p_ambulatorial IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Todas as entradas do MASCC sao obrigatorias'::text, v_pop, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_burden NOT IN (0,3,5) THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::text, NULL::int, NULL::text,
      'Burden de sintomas deve ser 5 (ausente ou leve), 3 (moderado) ou 0 (grave)'::text,
      v_pop, v_versao, v_lim, false; RETURN;
  END IF;

  IF p_instabilidade THEN
    RETURN QUERY SELECT 'OVERRIDE'::text, NULL::int, NULL::text,
      'Instabilidade clinica: internacao com antibiotico intravenoso independentemente do MASCC'::text,
      v_pop, v_versao, v_lim, true; RETURN;
  END IF;

  v_total := p_burden;
  IF p_sem_hipotensao THEN v_total := v_total + 5; END IF;
  IF p_sem_dpoc THEN v_total := v_total + 4; END IF;
  IF p_tumor_solido THEN v_total := v_total + 4; END IF;
  IF p_sem_desidratacao THEN v_total := v_total + 3; END IF;
  IF p_ambulatorial THEN v_total := v_total + 3; END IF;
  IF p_idade IS NOT NULL AND p_idade < 60 THEN v_total := v_total + 2; END IF;

  IF v_total >= 21 THEN
    v_categoria := 'baixo_risco';
    v_resposta := 'Baixo risco: antibiotico oral e seguimento em 24 a 48 horas, se houver suporte adequado';
  ELSE
    v_categoria := 'alto_risco';
    v_resposta := 'Alto risco: internacao com antibiotico intravenoso em ate 1 hora e monitorizacao';
  END IF;

  PERFORM public.fn_registrar_calculo_escore(
    p_atendimento_id, 'MASCC', v_versao, v_pop,
    jsonb_build_object('burden',p_burden,'sem_hipotensao',p_sem_hipotensao,'sem_dpoc',p_sem_dpoc,
                       'tumor_solido',p_tumor_solido,'sem_desidratacao',p_sem_desidratacao,
                       'ambulatorial',p_ambulatorial,'idade',p_idade),
    true, v_total, v_categoria, v_resposta, false, NULL, false, NULL, p_profissional);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_categoria, v_resposta, v_pop, v_versao, v_lim, false;
END;
$fn$;

-- =========================================================
-- ALVARADO
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_calcular_alvarado(
  p_atendimento_id text,
  p_idade integer,
  p_migracao boolean,
  p_anorexia boolean,
  p_nausea_vomito boolean,
  p_dor_fid boolean,
  p_rebound boolean,
  p_febre boolean,
  p_leucocitose boolean,
  p_desvio_esquerda boolean,
  p_profissional text DEFAULT NULL
)
RETURNS TABLE(status text, total integer, categoria text, resposta text,
              populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $fn$
DECLARE
  v_total int := 0; v_categoria text; v_resposta text;
  v_pop boolean; v_motivo text; v_versao text;
  v_lim text := 'Alvarado nao validado em pediatria sem modificacao; usar com cautela em gestantes e idosos. Escore baixo nao exclui apendicite quando ha alta suspeita clinica.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('Alvarado', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_migracao IS NULL OR p_anorexia IS NULL OR p_nausea_vomito IS NULL OR p_dor_fid IS NULL
     OR p_rebound IS NULL OR p_febre IS NULL OR p_leucocitose IS NULL OR p_desvio_esquerda IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Todas as oito entradas do Alvarado sao obrigatorias'::text, v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_migracao THEN v_total := v_total + 1; END IF;
  IF p_anorexia THEN v_total := v_total + 1; END IF;
  IF p_nausea_vomito THEN v_total := v_total + 1; END IF;
  IF p_dor_fid THEN v_total := v_total + 2; END IF;
  IF p_rebound THEN v_total := v_total + 1; END IF;
  IF p_febre THEN v_total := v_total + 1; END IF;
  IF p_leucocitose THEN v_total := v_total + 2; END IF;
  IF p_desvio_esquerda THEN v_total := v_total + 1; END IF;

  IF v_total >= 7 THEN
    v_categoria := 'alta_probabilidade';
    v_resposta := 'Alta probabilidade: avaliacao cirurgica e imagem pre-operatoria conforme protocolo';
  ELSIF v_total >= 5 THEN
    v_categoria := 'probabilidade_intermediaria';
    v_resposta := 'Probabilidade intermediaria: ultrassom ou tomografia; cirurgia se imagem positiva';
  ELSE
    v_categoria := 'baixa_probabilidade';
    v_resposta := 'Baixa probabilidade: observar, considerar ultrassom e reavaliar em 6 a 12 horas';
  END IF;

  PERFORM public.fn_registrar_calculo_escore(
    p_atendimento_id, 'Alvarado', v_versao, v_pop,
    jsonb_build_object('migracao',p_migracao,'anorexia',p_anorexia,'nausea_vomito',p_nausea_vomito,
                       'dor_fid',p_dor_fid,'rebound',p_rebound,'febre',p_febre,
                       'leucocitose',p_leucocitose,'desvio_esquerda',p_desvio_esquerda),
    true, v_total, v_categoria, v_resposta, false, NULL, false, NULL, p_profissional);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_categoria, v_resposta, v_pop, v_versao, v_lim;
END;
$fn$;

-- =========================================================
-- CHILD-PUGH
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_calcular_child_pugh(
  p_atendimento_id text,
  p_idade integer,
  p_bilirrubina numeric,
  p_albumina numeric,
  p_inr numeric,
  p_ascite text,
  p_encefalopatia text,
  p_profissional text DEFAULT NULL
)
RETURNS TABLE(status text, total integer, categoria text, resposta text,
              populacao_validada boolean, versao text, limitacoes text)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $fn$
DECLARE
  v_total int := 0; v_categoria text; v_resposta text;
  v_pop boolean; v_motivo text; v_versao text;
  v_lim text := 'Child-Pugh e para cirrose, nao para hepatopatia aguda. Bilirrubina em mg/dL. Ascite: ausente, leve ou moderada_grave. Encefalopatia: ausente, grau_I_II ou grau_III_IV.';
BEGIN
  SELECT * INTO v_pop, v_motivo, v_versao FROM public.fn_validar_populacao_escore('Child-Pugh', p_idade);
  IF NOT v_pop THEN
    RETURN QUERY SELECT 'BLOCKED'::text, NULL::int, NULL::text, v_motivo, false, v_versao, v_lim; RETURN;
  END IF;

  IF p_bilirrubina IS NULL OR p_albumina IS NULL OR p_inr IS NULL
     OR p_ascite IS NULL OR p_encefalopatia IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::text, NULL::int, NULL::text,
      'Entradas obrigatorias: bilirrubina, albumina, INR, ascite e encefalopatia'::text,
      v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_ascite NOT IN ('ausente','leve','moderada_grave')
     OR p_encefalopatia NOT IN ('ausente','grau_I_II','grau_III_IV') THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::text, NULL::int, NULL::text,
      'Ascite deve ser ausente, leve ou moderada_grave; encefalopatia deve ser ausente, grau_I_II ou grau_III_IV'::text,
      v_pop, v_versao, v_lim; RETURN;
  END IF;

  IF p_bilirrubina < 2 THEN v_total := v_total + 1;
  ELSIF p_bilirrubina <= 3 THEN v_total := v_total + 2;
  ELSE v_total := v_total + 3; END IF;

  IF p_albumina > 3.5 THEN v_total := v_total + 1;
  ELSIF p_albumina >= 2.8 THEN v_total := v_total + 2;
  ELSE v_total := v_total + 3; END IF;

  IF p_inr < 1.7 THEN v_total := v_total + 1;
  ELSIF p_inr <= 2.3 THEN v_total := v_total + 2;
  ELSE v_total := v_total + 3; END IF;

  IF p_ascite = 'ausente' THEN v_total := v_total + 1;
  ELSIF p_ascite = 'leve' THEN v_total := v_total + 2;
  ELSE v_total := v_total + 3; END IF;

  IF p_encefalopatia = 'ausente' THEN v_total := v_total + 1;
  ELSIF p_encefalopatia = 'grau_I_II' THEN v_total := v_total + 2;
  ELSE v_total := v_total + 3; END IF;

  IF v_total <= 6 THEN
    v_categoria := 'classe_A';
    v_resposta := 'Cirrose compensada: acompanhamento ambulatorial e tratamento da causa base';
  ELSIF v_total <= 9 THEN
    v_categoria := 'classe_B';
    v_resposta := 'Cirrose com descompensacao intermediaria: avaliar transplante e monitorar complicacoes';
  ELSE
    v_categoria := 'classe_C';
    v_resposta := 'Cirrose descompensada: contraindicar cirurgia eletiva, tratar complicacoes e avaliar transplante';
  END IF;

  PERFORM public.fn_registrar_calculo_escore(
    p_atendimento_id, 'Child-Pugh', v_versao, v_pop,
    jsonb_build_object('bilirrubina',p_bilirrubina,'albumina',p_albumina,'inr',p_inr,
                       'ascite',p_ascite,'encefalopatia',p_encefalopatia),
    true, v_total, v_categoria, v_resposta, false, NULL, false, NULL, p_profissional);

  RETURN QUERY SELECT 'CALCULATED'::text, v_total, v_categoria, v_resposta, v_pop, v_versao, v_lim;
END;
$fn$;

-- =========================================================
-- VIEWS DE AUDITORIA
-- =========================================================
CREATE OR REPLACE VIEW public.vw_calculo_escores_populacao_invalida
WITH (security_invoker = true) AS
SELECT nome_escore,
       count(*) AS total_calculos,
       count(*) FILTER (WHERE NOT populacao_validada) AS populacao_invalida,
       round(100.0 * count(*) FILTER (WHERE NOT populacao_validada) / nullif(count(*),0), 1) AS taxa_invalida_pct
FROM public.audit_escores_clinicos
GROUP BY nome_escore
ORDER BY 4 DESC NULLS LAST;

CREATE OR REPLACE VIEW public.vw_calculo_escores_entradas_incompletas
WITH (security_invoker = true) AS
SELECT nome_escore,
       count(*) AS total_calculos,
       count(*) FILTER (WHERE NOT entradas_completas) AS entradas_incompletas,
       round(100.0 * count(*) FILTER (WHERE NOT entradas_completas) / nullif(count(*),0), 1) AS taxa_incompleta_pct
FROM public.audit_escores_clinicos
GROUP BY nome_escore
ORDER BY 4 DESC NULLS LAST;

CREATE OR REPLACE VIEW public.vw_calculo_escores_overrides
WITH (security_invoker = true) AS
SELECT nome_escore,
       count(*) AS total_calculos,
       count(*) FILTER (WHERE red_flag_override) AS overrides,
       round(100.0 * count(*) FILTER (WHERE red_flag_override) / nullif(count(*),0), 1) AS taxa_override_pct
FROM public.audit_escores_clinicos
GROUP BY nome_escore
ORDER BY 4 DESC NULLS LAST;

CREATE OR REPLACE VIEW public.vw_calculo_escores_divergencias
WITH (security_invoker = true) AS
SELECT atendimento_id, nome_escore, resultado, categoria,
       conduta_sugerida, conduta_real, divergencia, motivo_override, data_hora
FROM public.audit_escores_clinicos
WHERE divergencia
ORDER BY data_hora DESC;
