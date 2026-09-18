INSERT INTO public.indicadores_qualidade_ps
(lote_id, codigo_indicador, nome, descricao, tipo, formula_numerador, formula_denominador, meta_pct, periodicidade, protocolo_id, fonte_id)
VALUES
('escores_intervencionista_sangramento_v1','IQ_INTERV_SANGR:1','SYNTAX calculado na população intervencionista','Percentual de SYNTAX na população intervencionista validada','processo','SYNTAX com população validada','Total de SYNTAX calculados','95','mensal',NULL,'F001'),
('escores_intervencionista_sangramento_v1','IQ_INTERV_SANGR:2','SYNTAX-II calculado na população intervencionista','Percentual de SYNTAX-II na população intervencionista validada','processo','SYNTAX-II com população validada','Total de SYNTAX-II calculados','95','mensal',NULL,'F001'),
('escores_intervencionista_sangramento_v1','IQ_INTERV_SANGR:3','EuroSCORE-II calculado na população cirúrgica cardíaca','Percentual de EuroSCORE-II na população cirúrgica cardíaca validada','processo','EuroSCORE-II com população validada','Total de EuroSCORE-II calculados','95','mensal',NULL,'F002'),
('escores_intervencionista_sangramento_v1','IQ_INTERV_SANGR:4','CRUSADE calculado na população NSTE-ACS','Percentual de CRUSADE na população NSTE-ACS validada','processo','CRUSADE com população validada','Total de CRUSADE calculados','95','mensal',NULL,'F003'),
('escores_intervencionista_sangramento_v1','IQ_INTERV_SANGR:5','HAS-BLED calculado na população FA anticoagulada','Percentual de HAS-BLED na população FA anticoagulada validada','processo','HAS-BLED com população validada','Total de HAS-BLED calculados','95','mensal',NULL,'F004'),
('escores_intervencionista_sangramento_v1','IQ_INTERV_SANGR:6','ORBIT calculado na população FA anticoagulada','Percentual de ORBIT na população FA anticoagulada validada','processo','ORBIT com população validada','Total de ORBIT calculados','95','mensal',NULL,'F005'),
('escores_intervencionista_sangramento_v1','IQ_INTERV_SANGR:7','ATRIA calculado na população FA anticoagulada','Percentual de ATRIA na população FA anticoagulada validada','processo','ATRIA com população validada','Total de ATRIA calculados','95','mensal',NULL,'F006'),
('escores_intervencionista_sangramento_v1','IQ_INTERV_SANGR:8','GRACE-Bleeding calculado na população SCA','Percentual de GRACE-Bleeding na população SCA validada','processo','GRACE-Bleeding com população validada','Total de GRACE-Bleeding calculados','95','mensal',NULL,'F007'),
('escores_intervencionista_sangramento_v1','IQ_INTERV_SANGR:9','TIMI-Bleeding calculado na população NSTE-ACS','Percentual de TIMI-Bleeding na população NSTE-ACS validada','processo','TIMI-Bleeding com população validada','Total de TIMI-Bleeding calculados','95','mensal',NULL,'F008'),
('escores_intervencionista_sangramento_v1','IQ_INTERV_SANGR:10','Sangramento maior em alto risco','Percentual de pacientes com alto risco de sangramento que tiveram sangramento maior','resultado','Pacientes com alto risco e sangramento maior','Total de pacientes com alto risco de sangramento','<10','mensal',NULL,'F004'),
('escores_intervencionista_sangramento_v1','IQ_INTERV_SANGR:11','SYNTAX >=33 com CABG','Percentual de pacientes com SYNTAX >=33 que tiveram CABG','resultado','Pacientes com SYNTAX >=33 e CABG','Total de pacientes com SYNTAX >=33','>=80','mensal',NULL,'F001'),
('escores_intervencionista_sangramento_v1','IQ_INTERV_SANGR:12','Heart Team documentado','Percentual de pacientes com SYNTAX >=23 com Heart Team documentado','processo','Pacientes com SYNTAX >=23 e Heart Team','Total de pacientes com SYNTAX >=23','>=90','mensal',NULL,'F001')
ON CONFLICT (lote_id, codigo_indicador) DO NOTHING;

CREATE OR REPLACE VIEW public.vw_escores_intervencionistas_resumo
WITH (security_invoker = true) AS
SELECT nome_escore,
  count(*) AS total_calculos,
  count(*) FILTER (WHERE populacao_validada) AS populacao_valida,
  count(*) FILTER (WHERE entradas_completas) AS entradas_completas,
  round(100.0 * count(*) FILTER (WHERE populacao_validada) / nullif(count(*), 0), 1) AS taxa_populacao_valida_pct,
  round(100.0 * count(*) FILTER (WHERE entradas_completas) / nullif(count(*), 0), 1) AS taxa_entradas_completas_pct,
  round(avg(resultado), 1) AS resultado_medio,
  round(max(resultado), 1) AS resultado_maximo
FROM public.audit_escores_clinicos
WHERE nome_escore IN ('SYNTAX','SYNTAX-II','EuroSCORE-II-Expandido','CRUSADE')
GROUP BY nome_escore
ORDER BY total_calculos DESC;

CREATE OR REPLACE VIEW public.vw_escores_sangramento_resumo
WITH (security_invoker = true) AS
SELECT nome_escore,
  count(*) AS total_calculos,
  count(*) FILTER (WHERE populacao_validada) AS populacao_valida,
  count(*) FILTER (WHERE entradas_completas) AS entradas_completas,
  round(100.0 * count(*) FILTER (WHERE populacao_validada) / nullif(count(*), 0), 1) AS taxa_populacao_valida_pct,
  round(100.0 * count(*) FILTER (WHERE entradas_completas) / nullif(count(*), 0), 1) AS taxa_entradas_completas_pct,
  round(avg(resultado), 1) AS resultado_medio,
  round(max(resultado), 1) AS resultado_maximo
FROM public.audit_escores_clinicos
WHERE nome_escore IN ('HAS-BLED','ORBIT','ATRIA','GRACE-Bleeding','TIMI-Bleeding')
GROUP BY nome_escore
ORDER BY total_calculos DESC;

CREATE OR REPLACE VIEW public.vw_escores_intervencionistas_uso_inadequado
WITH (security_invoker = true) AS
SELECT atendimento_id, nome_escore, resultado, categoria, conduta_sugerida, populacao_validada, data_hora
FROM public.audit_escores_clinicos
WHERE nome_escore IN ('SYNTAX','SYNTAX-II','EuroSCORE-II-Expandido','CRUSADE')
  AND (populacao_validada = FALSE OR entradas_completas = FALSE)
ORDER BY data_hora DESC
LIMIT 100;

CREATE OR REPLACE VIEW public.vw_escores_sangramento_uso_inadequado
WITH (security_invoker = true) AS
SELECT atendimento_id, nome_escore, resultado, categoria, conduta_sugerida, populacao_validada, data_hora
FROM public.audit_escores_clinicos
WHERE nome_escore IN ('HAS-BLED','ORBIT','ATRIA','GRACE-Bleeding','TIMI-Bleeding')
  AND (populacao_validada = FALSE OR entradas_completas = FALSE)
ORDER BY data_hora DESC
LIMIT 100;

CREATE OR REPLACE VIEW public.vw_dashboard_escores_global_final
WITH (security_invoker = true) AS
SELECT
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos WHERE nome_escore IN ('ISS','RTS','TRISS','GCS-Trauma')) AS total_trauma,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos WHERE nome_escore IN ('ASA','POSSUM','EuroSCORE-II','RCRI','APACHE-II','SAPS-II')) AS total_cirurgicos,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos WHERE nome_escore IN ('Bishop','Apgar','MEWS-OB')) AS total_obstetricos,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos WHERE nome_escore IN ('BPS','CPOT','FLACC','Wong-Baker')) AS total_dor,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos WHERE nome_escore IN ('pSOFA','PELOD-2','PRISM-IV','PIM3','GCS-Pediatrico','NIHSS-Pediatrico')) AS total_pediatricos,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos WHERE nome_escore IN ('CFS','FRAIL','4AT-Geriatrico','Hipotensao-Ortostatica','GDS-15','Lawton-Brody','Katz','TUG','Morse-Fall-Scale','Carga-Anticolinergica','Fried-Fenotipo')) AS total_geriatricos,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos WHERE nome_escore IN ('SYNTAX','SYNTAX-II','EuroSCORE-II-Expandido','CRUSADE')) AS total_intervencionistas,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos WHERE nome_escore IN ('HAS-BLED','ORBIT','ATRIA','GRACE-Bleeding','TIMI-Bleeding')) AS total_sangramento,
  (SELECT count(*) FROM public.audit_escores_clinicos WHERE populacao_validada) AS total_calculos_validos,
  (SELECT count(*) FROM public.audit_escores_clinicos WHERE NOT populacao_validada) AS total_calculos_invalidos,
  (SELECT count(*) FROM public.audit_escores_clinicos WHERE NOT entradas_completas) AS total_entradas_incompletas,
  round(100.0 * (SELECT count(*) FROM public.audit_escores_clinicos WHERE populacao_validada)
    / nullif((SELECT count(*) FROM public.audit_escores_clinicos), 0), 1) AS taxa_global_validacao_pct;

CREATE OR REPLACE FUNCTION public.fn_calcular_syntax(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'intervenção_coronariana_adulto',
  p_syntax_score NUMERIC DEFAULT NULL,
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(status TEXT, total NUMERIC, categoria TEXT, resposta TEXT, populacao_validada BOOLEAN, contexto TEXT, versao TEXT, limitacoes TEXT)
LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  v_categoria TEXT; v_resposta TEXT; v_pop_valida BOOLEAN; v_contexto TEXT; v_motivo TEXT; v_versao TEXT;
  v_limitacoes TEXT := 'SYNTAX Score avalia complexidade anatômica da doença coronariana. SYNTAX <=22: baixa complexidade, PCI ou CABG. SYNTAX 23-32: intermediário, considerar CABG. SYNTAX >=33: alta complexidade, CABG preferido. Não usar fora de contexto de intervenção coronariana. Não usar para prever risco cirúrgico (usar EuroSCORE II).';
BEGIN
  SELECT * INTO v_pop_valida, v_contexto, v_motivo, v_versao
  FROM public.fn_validar_populacao_intervencionista('SYNTAX', p_idade_anos, p_contexto);
  IF NOT COALESCE(v_pop_valida, FALSE) THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::NUMERIC, NULL::TEXT, v_motivo::TEXT, FALSE, NULL::TEXT, NULL::TEXT, v_limitacoes;
    RETURN;
  END IF;
  IF p_syntax_score IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::NUMERIC, NULL::TEXT, 'Entrada obrigatória: SYNTAX Score calculado'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF p_syntax_score < 0 OR p_syntax_score > 100 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::TEXT, NULL::NUMERIC, NULL::TEXT, 'SYNTAX Score deve ser 0-100'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF p_syntax_score <= 22 THEN
    v_categoria := 'baixa_complexidade';
    v_resposta := 'Baixa complexidade anatômica; PCI ou CABG conforme Heart Team; considerar PCI se anatomia favorável';
  ELSIF p_syntax_score BETWEEN 23 AND 32 THEN
    v_categoria := 'complexidade_intermediaria';
    v_resposta := 'Complexidade intermediária; considerar CABG; discussão Heart Team obrigatória';
  ELSE
    v_categoria := 'alta_complexidade';
    v_resposta := 'Alta complexidade anatômica; CABG preferido; discussão Heart Team obrigatória';
  END IF;
  INSERT INTO public.audit_escores_clinicos
  (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES (p_atendimento_id, 'SYNTAX', v_versao, v_pop_valida,
   jsonb_build_object('idade_anos', p_idade_anos, 'contexto', p_contexto, 'syntax_score', p_syntax_score),
   TRUE, p_syntax_score, v_categoria, v_resposta, p_profissional, 'escores_intervencionista_sangramento_v1');
  RETURN QUERY SELECT 'CALCULATED'::TEXT, p_syntax_score, v_categoria, v_resposta, v_pop_valida, v_contexto, v_versao, v_limitacoes;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_calcular_syntax2(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'intervenção_coronariana_adulto',
  p_syntax_score NUMERIC DEFAULT NULL,
  p_idade_pontos NUMERIC DEFAULT NULL,
  p_creatinina_cl NUMERIC DEFAULT NULL,
  p_feve NUMERIC DEFAULT NULL,
  p_doenca_tronco BOOLEAN DEFAULT FALSE,
  p_diabetes BOOLEAN DEFAULT FALSE,
  p_doenca_vascular_periferica BOOLEAN DEFAULT FALSE,
  p_sexo TEXT DEFAULT 'M',
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(status TEXT, pci_risco_mortalidade NUMERIC, cabg_risco_mortalidade NUMERIC, diferenca NUMERIC, categoria TEXT, resposta TEXT, populacao_validada BOOLEAN, contexto TEXT, versao TEXT, limitacoes TEXT)
LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  v_pci_risco NUMERIC; v_cabg_risco NUMERIC; v_diferenca NUMERIC; v_categoria TEXT; v_resposta TEXT;
  v_pop_valida BOOLEAN; v_contexto TEXT; v_motivo TEXT; v_versao TEXT;
  v_limitacoes TEXT := 'SYNTAX II combina SYNTAX anatômico com variáveis clínicas para estimar mortalidade a 4 anos por PCI vs CABG. Não usar fora de contexto de intervenção coronariana. Não usar como diagnóstico de SCA.';
BEGIN
  SELECT * INTO v_pop_valida, v_contexto, v_motivo, v_versao
  FROM public.fn_validar_populacao_intervencionista('SYNTAX-II', p_idade_anos, p_contexto);
  IF NOT COALESCE(v_pop_valida, FALSE) THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT, v_motivo::TEXT, FALSE, NULL::TEXT, NULL::TEXT, v_limitacoes;
    RETURN;
  END IF;
  IF p_syntax_score IS NULL OR p_idade_pontos IS NULL OR p_creatinina_cl IS NULL OR p_feve IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT,
      'Entradas obrigatórias: SYNTAX, idade pontos, creatinina clearance, FEVE'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  v_pci_risco := 0.02 + (p_syntax_score * 0.001) + (p_idade_pontos * 0.01)
               + (CASE WHEN p_creatinina_cl < 60 THEN 0.05 ELSE 0 END)
               + (CASE WHEN p_feve < 0.40 THEN 0.08 ELSE 0 END)
               + (CASE WHEN p_diabetes THEN 0.03 ELSE 0 END)
               + (CASE WHEN p_doenca_vascular_periferica THEN 0.04 ELSE 0 END)
               + (CASE WHEN p_sexo = 'F' THEN 0.02 ELSE 0 END);
  v_cabg_risco := 0.015 + (p_syntax_score * 0.0005) + (p_idade_pontos * 0.012)
               + (CASE WHEN p_creatinina_cl < 60 THEN 0.06 ELSE 0 END)
               + (CASE WHEN p_feve < 0.40 THEN 0.10 ELSE 0 END)
               + (CASE WHEN p_diabetes THEN 0.02 ELSE 0 END)
               + (CASE WHEN p_doenca_vascular_periferica THEN 0.05 ELSE 0 END)
               + (CASE WHEN p_sexo = 'F' THEN 0.03 ELSE 0 END);
  v_diferenca := v_pci_risco - v_cabg_risco;
  IF v_diferenca < -0.02 THEN
    v_categoria := 'pci_favoravel';
    v_resposta := 'PCI com risco de mortalidade menor que CABG; considerar PCI se anatomia favorável';
  ELSIF v_diferenca BETWEEN -0.02 AND 0.02 THEN
    v_categoria := 'equipe_heart_team';
    v_resposta := 'Risco similar entre PCI e CABG; discussão Heart Team obrigatória';
  ELSE
    v_categoria := 'cabg_favoravel';
    v_resposta := 'CABG com risco de mortalidade menor que PCI; considerar CABG';
  END IF;
  INSERT INTO public.audit_escores_clinicos
  (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES (p_atendimento_id, 'SYNTAX-II', v_versao, v_pop_valida,
   jsonb_build_object('idade_anos', p_idade_anos, 'contexto', p_contexto, 'syntax_score', p_syntax_score,
     'idade_pontos', p_idade_pontos, 'creatinina_cl', p_creatinina_cl, 'feve', p_feve,
     'doenca_tronco', p_doenca_tronco, 'diabetes', p_diabetes,
     'doenca_vascular_periferica', p_doenca_vascular_periferica, 'sexo', p_sexo,
     'pci_risco', v_pci_risco, 'cabg_risco', v_cabg_risco, 'diferenca', v_diferenca),
   TRUE, v_diferenca, v_categoria, v_resposta, p_profissional, 'escores_intervencionista_sangramento_v1');
  RETURN QUERY SELECT 'CALCULATED'::TEXT, v_pci_risco, v_cabg_risco, v_diferenca, v_categoria, v_resposta, v_pop_valida, v_contexto, v_versao, v_limitacoes;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_calcular_euroscore2_expandido(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'cirurgia_cardiaca_adulto',
  p_nyha INTEGER DEFAULT 1,
  p_feve NUMERIC DEFAULT NULL,
  p_creatinina_cl NUMERIC DEFAULT NULL,
  p_cirurgia_emergencia BOOLEAN DEFAULT FALSE,
  p_cirurgia_urgente BOOLEAN DEFAULT FALSE,
  p_endocardite BOOLEAN DEFAULT FALSE,
  p_operacao_previa BOOLEAN DEFAULT FALSE,
  p_peso NUMERIC DEFAULT NULL,
  p_altura NUMERIC DEFAULT NULL,
  p_sexo TEXT DEFAULT 'M',
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(status TEXT, mortalidade_prevista NUMERIC, categoria TEXT, resposta TEXT, populacao_validada BOOLEAN, contexto TEXT, versao TEXT, limitacoes TEXT)
LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  v_euroscore2 NUMERIC := 0; v_categoria TEXT; v_resposta TEXT; v_pop_valida BOOLEAN; v_contexto TEXT; v_motivo TEXT; v_versao TEXT;
  v_limitacoes TEXT := 'EuroSCORE II estima mortalidade em cirurgia cardíaca. Não usar para prever risco cirúrgico não cardíaco. Não usar em pacientes com lesões que não podem ser classificadas por EuroSCORE II.';
BEGIN
  SELECT * INTO v_pop_valida, v_contexto, v_motivo, v_versao
  FROM public.fn_validar_populacao_intervencionista('EuroSCORE-II', p_idade_anos, p_contexto);
  IF NOT COALESCE(v_pop_valida, FALSE) THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::NUMERIC, NULL::TEXT, v_motivo::TEXT, FALSE, NULL::TEXT, NULL::TEXT, v_limitacoes;
    RETURN;
  END IF;
  v_euroscore2 := 0.01 + (COALESCE(p_idade_anos,0) * 0.001)
               + (CASE WHEN p_nyha >= 3 THEN 0.05 ELSE 0 END)
               + (CASE WHEN p_feve IS NOT NULL AND p_feve < 0.30 THEN 0.08 ELSE 0 END)
               + (CASE WHEN p_creatinina_cl IS NOT NULL AND p_creatinina_cl < 30 THEN 0.06 ELSE 0 END)
               + (CASE WHEN p_cirurgia_emergencia THEN 0.10 ELSE 0 END)
               + (CASE WHEN p_cirurgia_urgente THEN 0.05 ELSE 0 END)
               + (CASE WHEN p_endocardite THEN 0.05 ELSE 0 END)
               + (CASE WHEN p_operacao_previa THEN 0.03 ELSE 0 END);
  IF v_euroscore2 < 0.02 THEN
    v_categoria := 'baixo_risco';
    v_resposta := 'Baixo risco de mortalidade; considerar cirurgia cardíaca conforme indicação';
  ELSIF v_euroscore2 BETWEEN 0.02 AND 0.05 THEN
    v_categoria := 'risco_intermediario';
    v_resposta := 'Risco intermediário; considerar otimização pré-operatória e discussão multidisciplinar';
  ELSE
    v_categoria := 'alto_risco';
    v_resposta := 'Alto risco de mortalidade; considerar apenas cirurgia de salvamento; discussão multidisciplinar';
  END IF;
  INSERT INTO public.audit_escores_clinicos
  (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES (p_atendimento_id, 'EuroSCORE-II-Expandido', v_versao, v_pop_valida,
   jsonb_build_object('idade_anos', p_idade_anos, 'contexto', p_contexto, 'nyha', p_nyha, 'feve', p_feve,
     'creatinina_cl', p_creatinina_cl, 'cirurgia_emergencia', p_cirurgia_emergencia,
     'cirurgia_urgente', p_cirurgia_urgente, 'endocardite', p_endocardite,
     'operacao_previa', p_operacao_previa, 'peso', p_peso, 'altura', p_altura, 'sexo', p_sexo),
   TRUE, v_euroscore2, v_categoria, v_resposta, p_profissional, 'escores_intervencionista_sangramento_v1');
  RETURN QUERY SELECT 'CALCULATED'::TEXT, v_euroscore2, v_categoria, v_resposta, v_pop_valida, v_contexto, v_versao, v_limitacoes;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_calcular_crusade(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'nste_acs_adulto',
  p_hematocrito NUMERIC DEFAULT NULL,
  p_creatinina_cl NUMERIC DEFAULT NULL,
  p_fc INTEGER DEFAULT NULL,
  p_pas INTEGER DEFAULT NULL,
  p_ic BOOLEAN DEFAULT FALSE,
  p_doenca_vascular_periferica BOOLEAN DEFAULT FALSE,
  p_diabetes BOOLEAN DEFAULT FALSE,
  p_sexo TEXT DEFAULT 'M',
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(status TEXT, total INTEGER, categoria TEXT, resposta TEXT, populacao_validada BOOLEAN, contexto TEXT, versao TEXT, limitacoes TEXT)
LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  v_total INTEGER := 0; v_categoria TEXT; v_resposta TEXT; v_pop_valida BOOLEAN; v_contexto TEXT; v_motivo TEXT; v_versao TEXT;
  v_limitacoes TEXT := 'CRUSADE estima risco de sangramento maior em NSTE-ACS. CRUSADE <=20: baixo risco. CRUSADE 21-30: risco intermediário. CRUSADE >=31: alto risco. Não usar para prever risco de sangramento em FA (usar HAS-BLED/ORBIT/ATRIA).';
BEGIN
  SELECT * INTO v_pop_valida, v_contexto, v_motivo, v_versao
  FROM public.fn_validar_populacao_sangramento('CRUSADE', p_idade_anos, p_contexto);
  IF NOT COALESCE(v_pop_valida, FALSE) THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::INTEGER, NULL::TEXT, v_motivo::TEXT, FALSE, NULL::TEXT, NULL::TEXT, v_limitacoes;
    RETURN;
  END IF;
  IF p_hematocrito IS NULL OR p_creatinina_cl IS NULL OR p_fc IS NULL OR p_pas IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::INTEGER, NULL::TEXT,
      'Entradas obrigatórias: hematócrito, creatinina clearance, FC, PAS'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF p_hematocrito < 31 THEN v_total := v_total + 20;
  ELSIF p_hematocrito BETWEEN 31 AND 36 THEN v_total := v_total + 10;
  ELSIF p_hematocrito BETWEEN 37 AND 42 THEN v_total := v_total + 5;
  END IF;
  IF p_creatinina_cl < 15 THEN v_total := v_total + 20;
  ELSIF p_creatinina_cl BETWEEN 15 AND 30 THEN v_total := v_total + 15;
  ELSIF p_creatinina_cl BETWEEN 31 AND 60 THEN v_total := v_total + 10;
  ELSIF p_creatinina_cl BETWEEN 61 AND 90 THEN v_total := v_total + 5;
  END IF;
  IF p_fc > 100 THEN v_total := v_total + 10; END IF;
  IF p_pas < 100 THEN v_total := v_total + 10; END IF;
  IF p_ic THEN v_total := v_total + 10; END IF;
  IF p_doenca_vascular_periferica THEN v_total := v_total + 5; END IF;
  IF p_diabetes THEN v_total := v_total + 5; END IF;
  IF p_sexo = 'F' THEN v_total := v_total + 5; END IF;
  IF v_total <= 20 THEN
    v_categoria := 'baixo_risco';
    v_resposta := 'Baixo risco de sangramento maior; monitorização padrão';
  ELSIF v_total BETWEEN 21 AND 30 THEN
    v_categoria := 'risco_intermediario';
    v_resposta := 'Risco intermediário; considerar ajuste de anticoagulação e monitorização mais frequente';
  ELSE
    v_categoria := 'alto_risco';
    v_resposta := 'Alto risco de sangramento maior; considerar ajuste de anticoagulação, monitorização intensiva e discussão multidisciplinar';
  END IF;
  INSERT INTO public.audit_escores_clinicos
  (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES (p_atendimento_id, 'CRUSADE', v_versao, v_pop_valida,
   jsonb_build_object('idade_anos', p_idade_anos, 'contexto', p_contexto, 'hematocrito', p_hematocrito,
     'creatinina_cl', p_creatinina_cl, 'fc', p_fc, 'pas', p_pas, 'ic', p_ic,
     'doenca_vascular_periferica', p_doenca_vascular_periferica, 'diabetes', p_diabetes, 'sexo', p_sexo),
   TRUE, v_total, v_categoria, v_resposta, p_profissional, 'escores_intervencionista_sangramento_v1');
  RETURN QUERY SELECT 'CALCULATED'::TEXT, v_total, v_categoria, v_resposta, v_pop_valida, v_contexto, v_versao, v_limitacoes;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_calcular_hasbled(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'fa_anticoagulada_adulto',
  p_has BOOLEAN DEFAULT FALSE,
  p_funcao_renal_anormal BOOLEAN DEFAULT FALSE,
  p_funcao_hepatica_anormal BOOLEAN DEFAULT FALSE,
  p_avc_previo BOOLEAN DEFAULT FALSE,
  p_sangramento_previo BOOLEAN DEFAULT FALSE,
  p_inr_labil BOOLEAN DEFAULT FALSE,
  p_drogas_ou_alcool BOOLEAN DEFAULT FALSE,
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(status TEXT, total INTEGER, categoria TEXT, resposta TEXT, populacao_validada BOOLEAN, contexto TEXT, versao TEXT, limitacoes TEXT)
LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  v_total INTEGER := 0; v_categoria TEXT; v_resposta TEXT; v_pop_valida BOOLEAN; v_contexto TEXT; v_motivo TEXT; v_versao TEXT;
  v_limitacoes TEXT := 'HAS-BLED estima risco de sangramento maior em FA anticoagulada. HAS-BLED 0-2: baixo risco. HAS-BLED >=3: alto risco. Não contraindica anticoagulação; apenas aumenta vigilância. Não usar para prever risco de sangramento em NSTE-ACS (usar CRUSADE).';
BEGIN
  SELECT * INTO v_pop_valida, v_contexto, v_motivo, v_versao
  FROM public.fn_validar_populacao_sangramento('HAS-BLED', p_idade_anos, p_contexto);
  IF NOT COALESCE(v_pop_valida, FALSE) THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::INTEGER, NULL::TEXT, v_motivo::TEXT, FALSE, NULL::TEXT, NULL::TEXT, v_limitacoes;
    RETURN;
  END IF;
  IF p_has IS NULL OR p_funcao_renal_anormal IS NULL OR p_funcao_hepatica_anormal IS NULL
     OR p_avc_previo IS NULL OR p_sangramento_previo IS NULL OR p_inr_labil IS NULL
     OR p_drogas_ou_alcool IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::INTEGER, NULL::TEXT,
      'Todas as entradas são obrigatórias'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF p_has THEN v_total := v_total + 1; END IF;
  IF p_funcao_renal_anormal THEN v_total := v_total + 1; END IF;
  IF p_funcao_hepatica_anormal THEN v_total := v_total + 1; END IF;
  IF p_avc_previo THEN v_total := v_total + 1; END IF;
  IF p_sangramento_previo THEN v_total := v_total + 1; END IF;
  IF p_inr_labil THEN v_total := v_total + 1; END IF;
  IF COALESCE(p_idade_anos, 0) >= 65 THEN v_total := v_total + 1; END IF;
  IF p_drogas_ou_alcool THEN v_total := v_total + 1; END IF;
  IF v_total <= 2 THEN
    v_categoria := 'baixo_risco';
    v_resposta := 'Baixo risco de sangramento maior; anticoagulação pode ser mantida com monitorização padrão';
  ELSIF v_total BETWEEN 3 AND 4 THEN
    v_categoria := 'risco_intermediario';
    v_resposta := 'Risco intermediário; considerar ajuste de anticoagulação e monitorização mais frequente';
  ELSE
    v_categoria := 'alto_risco';
    v_resposta := 'Alto risco de sangramento maior; considerar ajuste de anticoagulação, monitorização intensiva e discussão multidisciplinar';
  END IF;
  INSERT INTO public.audit_escores_clinicos
  (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES (p_atendimento_id, 'HAS-BLED', v_versao, v_pop_valida,
   jsonb_build_object('idade_anos', p_idade_anos, 'contexto', p_contexto, 'has', p_has,
     'funcao_renal_anormal', p_funcao_renal_anormal, 'funcao_hepatica_anormal', p_funcao_hepatica_anormal,
     'avc_previo', p_avc_previo, 'sangramento_previo', p_sangramento_previo,
     'inr_labil', p_inr_labil, 'drogas_ou_alcool', p_drogas_ou_alcool),
   TRUE, v_total, v_categoria, v_resposta, p_profissional, 'escores_intervencionista_sangramento_v1');
  RETURN QUERY SELECT 'CALCULATED'::TEXT, v_total, v_categoria, v_resposta, v_pop_valida, v_contexto, v_versao, v_limitacoes;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_calcular_orbit(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'fa_anticoagulada_adulto',
  p_hemoglobina INTEGER DEFAULT NULL,
  p_idade_pontos INTEGER DEFAULT NULL,
  p_doenca_renal BOOLEAN DEFAULT FALSE,
  p_sangramento_previo BOOLEAN DEFAULT FALSE,
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(status TEXT, total INTEGER, categoria TEXT, resposta TEXT, populacao_validada BOOLEAN, contexto TEXT, versao TEXT, limitacoes TEXT)
LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  v_total INTEGER := 0; v_categoria TEXT; v_resposta TEXT; v_pop_valida BOOLEAN; v_contexto TEXT; v_motivo TEXT; v_versao TEXT;
  v_limitacoes TEXT := 'ORBIT estima risco de sangramento maior em FA anticoagulada. ORBIT 0-2: baixo risco. ORBIT 3-4: risco intermediário. ORBIT >=5: alto risco. Não contraindica anticoagulação; apenas aumenta vigilância.';
BEGIN
  SELECT * INTO v_pop_valida, v_contexto, v_motivo, v_versao
  FROM public.fn_validar_populacao_sangramento('ORBIT', p_idade_anos, p_contexto);
  IF NOT COALESCE(v_pop_valida, FALSE) THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::INTEGER, NULL::TEXT, v_motivo::TEXT, FALSE, NULL::TEXT, NULL::TEXT, v_limitacoes;
    RETURN;
  END IF;
  IF p_hemoglobina IS NULL OR p_idade_pontos IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::INTEGER, NULL::TEXT,
      'Entradas obrigatórias: hemoglobina, idade pontos'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF p_hemoglobina < 12 THEN v_total := v_total + 3;
  ELSIF p_hemoglobina BETWEEN 12 AND 14 THEN v_total := v_total + 1;
  END IF;
  v_total := v_total + p_idade_pontos;
  IF p_doenca_renal THEN v_total := v_total + 2; END IF;
  IF p_sangramento_previo THEN v_total := v_total + 2; END IF;
  IF v_total <= 2 THEN
    v_categoria := 'baixo_risco';
    v_resposta := 'Baixo risco de sangramento maior; anticoagulação pode ser mantida com monitorização padrão';
  ELSIF v_total BETWEEN 3 AND 4 THEN
    v_categoria := 'risco_intermediario';
    v_resposta := 'Risco intermediário; considerar ajuste de anticoagulação e monitorização mais frequente';
  ELSE
    v_categoria := 'alto_risco';
    v_resposta := 'Alto risco de sangramento maior; considerar ajuste de anticoagulação, monitorização intensiva e discussão multidisciplinar';
  END IF;
  INSERT INTO public.audit_escores_clinicos
  (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES (p_atendimento_id, 'ORBIT', v_versao, v_pop_valida,
   jsonb_build_object('idade_anos', p_idade_anos, 'contexto', p_contexto, 'hemoglobina', p_hemoglobina,
     'idade_pontos', p_idade_pontos, 'doenca_renal', p_doenca_renal, 'sangramento_previo', p_sangramento_previo),
   TRUE, v_total, v_categoria, v_resposta, p_profissional, 'escores_intervencionista_sangramento_v1');
  RETURN QUERY SELECT 'CALCULATED'::TEXT, v_total, v_categoria, v_resposta, v_pop_valida, v_contexto, v_versao, v_limitacoes;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_calcular_atria(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'fa_anticoagulada_adulto',
  p_sangramento_previo BOOLEAN DEFAULT FALSE,
  p_anemia BOOLEAN DEFAULT FALSE,
  p_doenca_renal BOOLEAN DEFAULT FALSE,
  p_idade_pontos INTEGER DEFAULT 0,
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(status TEXT, total INTEGER, categoria TEXT, resposta TEXT, populacao_validada BOOLEAN, contexto TEXT, versao TEXT, limitacoes TEXT)
LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  v_total INTEGER := 0; v_categoria TEXT; v_resposta TEXT; v_pop_valida BOOLEAN; v_contexto TEXT; v_motivo TEXT; v_versao TEXT;
  v_limitacoes TEXT := 'ATRIA estima risco de sangramento maior em FA anticoagulada. ATRIA 0-3: baixo risco. ATRIA 4-5: risco intermediário. ATRIA >=6: alto risco. Não contraindica anticoagulação; apenas aumenta vigilância.';
BEGIN
  SELECT * INTO v_pop_valida, v_contexto, v_motivo, v_versao
  FROM public.fn_validar_populacao_sangramento('ATRIA', p_idade_anos, p_contexto);
  IF NOT COALESCE(v_pop_valida, FALSE) THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::INTEGER, NULL::TEXT, v_motivo::TEXT, FALSE, NULL::TEXT, NULL::TEXT, v_limitacoes;
    RETURN;
  END IF;
  IF p_sangramento_previo IS NULL OR p_anemia IS NULL OR p_doenca_renal IS NULL OR p_idade_pontos IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::INTEGER, NULL::TEXT,
      'Todas as entradas são obrigatórias'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF p_sangramento_previo THEN v_total := v_total + 3; END IF;
  IF p_anemia THEN v_total := v_total + 3; END IF;
  IF p_doenca_renal THEN v_total := v_total + 1; END IF;
  v_total := v_total + p_idade_pontos;
  IF v_total <= 3 THEN
    v_categoria := 'baixo_risco';
    v_resposta := 'Baixo risco de sangramento maior; anticoagulação pode ser mantida com monitorização padrão';
  ELSIF v_total BETWEEN 4 AND 5 THEN
    v_categoria := 'risco_intermediario';
    v_resposta := 'Risco intermediário; considerar ajuste de anticoagulação e monitorização mais frequente';
  ELSE
    v_categoria := 'alto_risco';
    v_resposta := 'Alto risco de sangramento maior; considerar ajuste de anticoagulação, monitorização intensiva e discussão multidisciplinar';
  END IF;
  INSERT INTO public.audit_escores_clinicos
  (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES (p_atendimento_id, 'ATRIA', v_versao, v_pop_valida,
   jsonb_build_object('idade_anos', p_idade_anos, 'contexto', p_contexto, 'sangramento_previo', p_sangramento_previo,
     'anemia', p_anemia, 'doenca_renal', p_doenca_renal, 'idade_pontos', p_idade_pontos),
   TRUE, v_total, v_categoria, v_resposta, p_profissional, 'escores_intervencionista_sangramento_v1');
  RETURN QUERY SELECT 'CALCULATED'::TEXT, v_total, v_categoria, v_resposta, v_pop_valida, v_contexto, v_versao, v_limitacoes;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_calcular_grace_bleeding(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'sca_adulto',
  p_grace_sangramento INTEGER DEFAULT NULL,
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(status TEXT, total INTEGER, categoria TEXT, resposta TEXT, populacao_validada BOOLEAN, contexto TEXT, versao TEXT, limitacoes TEXT)
LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  v_categoria TEXT; v_resposta TEXT; v_pop_valida BOOLEAN; v_contexto TEXT; v_motivo TEXT; v_versao TEXT;
  v_limitacoes TEXT := 'GRACE Bleeding estima risco de sangramento maior em SCA. GRACE Bleeding 0-2: baixo risco. GRACE Bleeding 3-4: risco intermediário. GRACE Bleeding >=5: alto risco. Não usar para prever risco de sangramento em FA (usar HAS-BLED/ORBIT/ATRIA).';
BEGIN
  SELECT * INTO v_pop_valida, v_contexto, v_motivo, v_versao
  FROM public.fn_validar_populacao_sangramento('GRACE-Bleeding', p_idade_anos, p_contexto);
  IF NOT COALESCE(v_pop_valida, FALSE) THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::INTEGER, NULL::TEXT, v_motivo::TEXT, FALSE, NULL::TEXT, NULL::TEXT, v_limitacoes;
    RETURN;
  END IF;
  IF p_grace_sangramento IS NULL THEN
    RETURN QUERY SELECT 'ENTRADAS_INCOMPLETAS'::TEXT, NULL::INTEGER, NULL::TEXT,
      'Entrada obrigatória: GRACE Bleeding calculado'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF p_grace_sangramento < 0 OR p_grace_sangramento > 100 THEN
    RETURN QUERY SELECT 'ENTRADA_INVALIDA'::TEXT, NULL::INTEGER, NULL::TEXT,
      'GRACE Bleeding deve ser 0-100'::TEXT, v_pop_valida, v_contexto, v_versao, v_limitacoes;
    RETURN;
  END IF;
  IF p_grace_sangramento <= 2 THEN
    v_categoria := 'baixo_risco';
    v_resposta := 'Baixo risco de sangramento maior; monitorização padrão';
  ELSIF p_grace_sangramento BETWEEN 3 AND 4 THEN
    v_categoria := 'risco_intermediario';
    v_resposta := 'Risco intermediário; considerar ajuste de anticoagulação e monitorização mais frequente';
  ELSE
    v_categoria := 'alto_risco';
    v_resposta := 'Alto risco de sangramento maior; considerar ajuste de anticoagulação, monitorização intensiva e discussão multidisciplinar';
  END IF;
  INSERT INTO public.audit_escores_clinicos
  (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES (p_atendimento_id, 'GRACE-Bleeding', v_versao, v_pop_valida,
   jsonb_build_object('idade_anos', p_idade_anos, 'contexto', p_contexto, 'grace_sangramento', p_grace_sangramento),
   TRUE, p_grace_sangramento, v_categoria, v_resposta, p_profissional, 'escores_intervencionista_sangramento_v1');
  RETURN QUERY SELECT 'CALCULATED'::TEXT, p_grace_sangramento, v_categoria, v_resposta, v_pop_valida, v_contexto, v_versao, v_limitacoes;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_calcular_timi_bleeding(
  p_atendimento_id TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'nste_acs_adulto',
  p_idade_pontos INTEGER DEFAULT 0,
  p_doenca_renal BOOLEAN DEFAULT FALSE,
  p_peso NUMERIC DEFAULT NULL,
  p_sexo TEXT DEFAULT 'M',
  p_desvio_st BOOLEAN DEFAULT FALSE,
  p_profissional TEXT DEFAULT NULL
)
RETURNS TABLE(status TEXT, total INTEGER, categoria TEXT, resposta TEXT, populacao_validada BOOLEAN, contexto TEXT, versao TEXT, limitacoes TEXT)
LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  v_total INTEGER := 0; v_categoria TEXT; v_resposta TEXT; v_pop_valida BOOLEAN; v_contexto TEXT; v_motivo TEXT; v_versao TEXT;
  v_limitacoes TEXT := 'TIMI Bleeding estima risco de sangramento maior em NSTE-ACS. TIMI Bleeding 0-2: baixo risco. TIMI Bleeding 3-4: risco intermediário. TIMI Bleeding >=5: alto risco. Não usar para prever risco de sangramento em FA (usar HAS-BLED/ORBIT/ATRIA).';
BEGIN
  SELECT * INTO v_pop_valida, v_contexto, v_motivo, v_versao
  FROM public.fn_validar_populacao_sangramento('TIMI-Bleeding', p_idade_anos, p_contexto);
  IF NOT COALESCE(v_pop_valida, FALSE) THEN
    RETURN QUERY SELECT 'BLOCKED'::TEXT, NULL::INTEGER, NULL::TEXT, v_motivo::TEXT, FALSE, NULL::TEXT, NULL::TEXT, v_limitacoes;
    RETURN;
  END IF;
  v_total := COALESCE(p_idade_pontos, 0);
  IF p_doenca_renal THEN v_total := v_total + 1; END IF;
  IF p_peso IS NOT NULL AND p_peso < 60 THEN v_total := v_total + 1; END IF;
  IF p_sexo = 'F' THEN v_total := v_total + 1; END IF;
  IF p_desvio_st THEN v_total := v_total + 1; END IF;
  IF v_total <= 2 THEN
    v_categoria := 'baixo_risco';
    v_resposta := 'Baixo risco de sangramento maior; monitorização padrão';
  ELSIF v_total BETWEEN 3 AND 4 THEN
    v_categoria := 'risco_intermediario';
    v_resposta := 'Risco intermediário; considerar ajuste de anticoagulação e monitorização mais frequente';
  ELSE
    v_categoria := 'alto_risco';
    v_resposta := 'Alto risco de sangramento maior; considerar ajuste de anticoagulação, monitorização intensiva e discussão multidisciplinar';
  END IF;
  INSERT INTO public.audit_escores_clinicos
  (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES (p_atendimento_id, 'TIMI-Bleeding', v_versao, v_pop_valida,
   jsonb_build_object('idade_anos', p_idade_anos, 'contexto', p_contexto, 'idade_pontos', p_idade_pontos,
     'doenca_renal', p_doenca_renal, 'peso', p_peso, 'sexo', p_sexo, 'desvio_st', p_desvio_st),
   TRUE, v_total, v_categoria, v_resposta, p_profissional, 'escores_intervencionista_sangramento_v1');
  RETURN QUERY SELECT 'CALCULATED'::TEXT, v_total, v_categoria, v_resposta, v_pop_valida, v_contexto, v_versao, v_limitacoes;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_registrar_calculo_intervencionista(
  p_atendimento_id TEXT,
  p_entradas JSONB,
  p_resultado NUMERIC,
  p_categoria TEXT,
  p_conduta_sugerida TEXT,
  p_profissional TEXT,
  p_nome_escore TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'intervenção_coronariana_adulto'
)
RETURNS BIGINT
LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  v_id BIGINT; v_pop_valida BOOLEAN; v_contexto TEXT; v_motivo TEXT; v_versao TEXT;
BEGIN
  SELECT * INTO v_pop_valida, v_contexto, v_motivo, v_versao
  FROM public.fn_validar_populacao_intervencionista(p_nome_escore, p_idade_anos, p_contexto);
  IF NOT COALESCE(v_pop_valida, FALSE) THEN
    RAISE EXCEPTION 'Escore % não validado para idade % anos e contexto %: %', p_nome_escore, p_idade_anos, p_contexto, v_motivo;
  END IF;
  INSERT INTO public.audit_escores_clinicos
  (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES (p_atendimento_id, p_nome_escore, v_versao, v_pop_valida, p_entradas, TRUE, p_resultado, p_categoria, p_conduta_sugerida, p_profissional, 'escores_intervencionista_sangramento_v1')
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_registrar_calculo_sangramento(
  p_atendimento_id TEXT,
  p_entradas JSONB,
  p_resultado NUMERIC,
  p_categoria TEXT,
  p_conduta_sugerida TEXT,
  p_profissional TEXT,
  p_nome_escore TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_contexto TEXT DEFAULT 'fa_anticoagulada_adulto'
)
RETURNS BIGINT
LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  v_id BIGINT; v_pop_valida BOOLEAN; v_contexto TEXT; v_motivo TEXT; v_versao TEXT;
BEGIN
  SELECT * INTO v_pop_valida, v_contexto, v_motivo, v_versao
  FROM public.fn_validar_populacao_sangramento(p_nome_escore, p_idade_anos, p_contexto);
  IF NOT COALESCE(v_pop_valida, FALSE) THEN
    RAISE EXCEPTION 'Escore % não validado para idade % anos e contexto %: %', p_nome_escore, p_idade_anos, p_contexto, v_motivo;
  END IF;
  INSERT INTO public.audit_escores_clinicos
  (atendimento_id, nome_escore, versao, populacao_validada, entradas, entradas_completas, resultado, categoria, conduta_sugerida, profissional, lote_id)
  VALUES (p_atendimento_id, p_nome_escore, v_versao, v_pop_valida, p_entradas, TRUE, p_resultado, p_categoria, p_conduta_sugerida, p_profissional, 'escores_intervencionista_sangramento_v1')
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_sugerir_escore_intervencionista(
  p_contexto TEXT DEFAULT 'intervenção_coronariana_adulto',
  p_idade_anos INTEGER DEFAULT NULL
)
RETURNS TABLE(escore_sugerido TEXT, motivo TEXT)
LANGUAGE plpgsql SET search_path = public AS $fn$
BEGIN
  IF p_contexto = 'intervenção_coronariana_adulto' THEN
    RETURN QUERY SELECT 'SYNTAX'::TEXT, 'SYNTAX é o escore padrão para avaliar complexidade anatômica coronariana'::TEXT;
    RETURN QUERY SELECT 'SYNTAX-II'::TEXT, 'SYNTAX II combina SYNTAX anatômico com variáveis clínicas para estimar mortalidade'::TEXT;
    RETURN QUERY SELECT 'EuroSCORE-II'::TEXT, 'EuroSCORE II estima mortalidade em cirurgia cardíaca'::TEXT;
  ELSIF p_contexto = 'nste_acs_adulto' THEN
    RETURN QUERY SELECT 'CRUSADE'::TEXT, 'CRUSADE estima risco de sangramento maior em NSTE-ACS'::TEXT;
    RETURN QUERY SELECT 'TIMI-Bleeding'::TEXT, 'TIMI Bleeding estima risco de sangramento maior em NSTE-ACS'::TEXT;
    RETURN QUERY SELECT 'GRACE-Bleeding'::TEXT, 'GRACE Bleeding estima risco de sangramento maior em SCA'::TEXT;
  ELSIF p_contexto = 'fa_anticoagulada_adulto' THEN
    RETURN QUERY SELECT 'HAS-BLED'::TEXT, 'HAS-BLED estima risco de sangramento maior em FA anticoagulada'::TEXT;
    RETURN QUERY SELECT 'ORBIT'::TEXT, 'ORBIT estima risco de sangramento maior em FA anticoagulada'::TEXT;
    RETURN QUERY SELECT 'ATRIA'::TEXT, 'ATRIA estima risco de sangramento maior em FA anticoagulada'::TEXT;
  ELSE
    RETURN QUERY SELECT 'Avaliação clínica individualizada'::TEXT, 'Contexto não mapeado: avaliar clinicamente e documentar escolha'::TEXT;
  END IF;
END;
$fn$;