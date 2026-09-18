-- ============ Tabelas de apoio ausentes ============
CREATE TABLE IF NOT EXISTS public.audit_escores_clinicos (
  id BIGSERIAL PRIMARY KEY,
  atendimento_id TEXT,
  profissional_id UUID DEFAULT auth.uid(),
  nome_escore TEXT NOT NULL,
  categoria TEXT,
  contexto TEXT,
  valor_total NUMERIC,
  conduta_sugerida TEXT,
  populacao_validada BOOLEAN NOT NULL DEFAULT TRUE,
  entradas_completas BOOLEAN NOT NULL DEFAULT TRUE,
  versao_escore TEXT,
  fonte_id TEXT,
  observacoes TEXT,
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.audit_escores_clinicos TO authenticated;
GRANT ALL ON public.audit_escores_clinicos TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.audit_escores_clinicos_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.audit_escores_clinicos_id_seq TO service_role;

ALTER TABLE public.audit_escores_clinicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_escores_select_own_or_admin" ON public.audit_escores_clinicos
  FOR SELECT TO authenticated
  USING (profissional_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "audit_escores_insert_own" ON public.audit_escores_clinicos
  FOR INSERT TO authenticated
  WITH CHECK (profissional_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_audit_escores_atendimento ON public.audit_escores_clinicos (atendimento_id);
CREATE INDEX IF NOT EXISTS idx_audit_escores_nome ON public.audit_escores_clinicos (nome_escore);

CREATE TABLE IF NOT EXISTS public.indicadores_qualidade_ps (
  id BIGSERIAL PRIMARY KEY,
  lote_id TEXT NOT NULL,
  codigo_indicador TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT,
  formula_numerador TEXT,
  formula_denominador TEXT,
  meta_pct TEXT,
  periodicidade TEXT,
  protocolo_id TEXT,
  fonte_id TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.indicadores_qualidade_ps TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.indicadores_qualidade_ps TO authenticated;
GRANT ALL ON public.indicadores_qualidade_ps TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.indicadores_qualidade_ps_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.indicadores_qualidade_ps_id_seq TO service_role;

ALTER TABLE public.indicadores_qualidade_ps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indicadores_ps_select_auth" ON public.indicadores_qualidade_ps
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "indicadores_ps_admin_write" ON public.indicadores_qualidade_ps
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_indicadores_qualidade_ps_updated
  BEFORE UPDATE ON public.indicadores_qualidade_ps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Regras de override por red flag ============
CREATE TABLE IF NOT EXISTS public.stg_regras_override_red_flag (
  id BIGSERIAL PRIMARY KEY,
  lote_id TEXT NOT NULL,
  regra_id TEXT NOT NULL,
  contexto TEXT NOT NULL,
  escore_nome TEXT NOT NULL,
  red_flag TEXT NOT NULL,
  red_flag_descricao TEXT,
  acao_override TEXT NOT NULL,
  escore_nao_pode TEXT NOT NULL,
  nivel_gate TEXT NOT NULL,
  prioridade INTEGER DEFAULT 1,
  fonte_id TEXT,
  trecho_citado TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stg_regras_override_red_flag TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.stg_regras_override_red_flag TO authenticated;
GRANT ALL ON public.stg_regras_override_red_flag TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.stg_regras_override_red_flag_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.stg_regras_override_red_flag_id_seq TO service_role;

ALTER TABLE public.stg_regras_override_red_flag ENABLE ROW LEVEL SECURITY;

CREATE POLICY "override_red_flag_select_auth" ON public.stg_regras_override_red_flag
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "override_red_flag_admin_write" ON public.stg_regras_override_red_flag
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_override_red_flag_updated
  BEFORE UPDATE ON public.stg_regras_override_red_flag
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_override_contexto ON public.stg_regras_override_red_flag (contexto);
CREATE INDEX IF NOT EXISTS idx_override_escore ON public.stg_regras_override_red_flag (escore_nome);
CREATE INDEX IF NOT EXISTS idx_override_red_flag ON public.stg_regras_override_red_flag (red_flag);

INSERT INTO public.stg_regras_override_red_flag
(lote_id, regra_id, contexto, escore_nome, red_flag, red_flag_descricao, acao_override, escore_nao_pode, nivel_gate, prioridade, fonte_id, ativo)
VALUES
('escores_intervencionista_sangramento_v1','OVR-001','PS','GRACE','sca_muito_alto_risco','SCA muito alto risco: choque cardiogênico, arritmia maligna, instabilidade hemodinâmica','Angiografia imediata; não adiar por escore','Não adiar angiografia imediata por GRACE baixo','hard_gate',1,'F001',TRUE),
('escores_intervencionista_sangramento_v1','OVR-002','PS','GRACE','grace_uso_diagnostico','Tentativa de usar GRACE para diagnóstico de SCA','GRACE é prognóstico, não diagnóstico','Não diagnosticar SCA nem adiar angiografia por GRACE','hard_gate',1,'F004',TRUE),
('escores_intervencionista_sangramento_v1','OVR-003','PS','C-SSRS','c_ssrs_alta_inadequada','Tentativa de alta com C-SSRS baixo em paciente com plano/intenção/acesso','Observação contínua; retirada de meios letais; avaliação psiquiátrica','Não usar pontuação baixa isolada para alta','hard_gate',1,'F006',TRUE),
('escores_intervencionista_sangramento_v1','OVR-004','PS','MASCC','mascc_instabilidade','Instabilidade, falência orgânica ou suporte inadequado','Internação; não usar MASCC para manejo ambulatorial','Não usar MASCC para alta se instabilidade presente','hard_gate',1,'F006',TRUE),
('escores_intervencionista_sangramento_v1','OVR-005','PS','4AT','4at_positivo_sem_investigacao','4AT positivo sem investigação de causa médica','Investigar causa médica; não usar 4AT como diagnóstico etiológico','Não usar 4AT positivo como diagnóstico etiológico','hard_gate',1,'F001',TRUE),
('escores_intervencionista_sangramento_v1','OVR-006','PS','HAS-BLED','has_bled_contraindicacao_inadequada','Tentativa de contraindicar anticoagulação por HAS-BLED alto','Ajustar anticoagulação, corrigir fatores de risco, monitorizar','Não contraindicar anticoagulação apenas por HAS-BLED alto','hard_gate',1,'F004',TRUE),
('escores_intervencionista_sangramento_v1','OVR-007','PS','ORBIT','orbit_contraindicacao_inadequada','Tentativa de contraindicar anticoagulação por ORBIT alto','Ajustar anticoagulação, corrigir fatores de risco, monitorizar','Não contraindicar anticoagulação apenas por ORBIT alto','hard_gate',1,'F005',TRUE),
('escores_intervencionista_sangramento_v1','OVR-008','PS','ATRIA','atria_contraindicacao_inadequada','Tentativa de contraindicar anticoagulação por ATRIA alto','Ajustar anticoagulação, corrigir fatores de risco, monitorizar','Não contraindicar anticoagulação apenas por ATRIA alto','hard_gate',1,'F006',TRUE),
('escores_intervencionista_sangramento_v1','OVR-009','PS','CRUSADE','crusade_contraindicacao_inadequada','Tentativa de contraindicar anticoagulação por CRUSADE alto','Ajustar anticoagulação, corrigir fatores de risco, monitorizar','Não contraindicar anticoagulação apenas por CRUSADE alto','hard_gate',1,'F003',TRUE),
('escores_intervencionista_sangramento_v1','OVR-010','intervenção_coronariana','SYNTAX','syntax_pci_inadequada','Tentativa de PCI automática com SYNTAX >=33 sem Heart Team','CABG preferido; discussão Heart Team obrigatória','Não realizar PCI automática com SYNTAX >=33 sem Heart Team','hard_gate',1,'F001',TRUE),
('escores_intervencionista_sangramento_v1','OVR-011','intervenção_coronariana','SYNTAX-II','syntax_ii_pci_sem_heart_team','Tentativa de PCI com SYNTAX-II CABG-favorável sem Heart Team documentado','Discussão Heart Team obrigatória antes de PCI','Não realizar PCI com SYNTAX-II CABG-favorável sem Heart Team','hard_gate',1,'F001',TRUE),
('escores_intervencionista_sangramento_v1','OVR-012','cirurgia_cardiaca','EuroSCORE-II','euroscore_cirurgia_inadequada','Tentativa de cirurgia cardíaca com EuroSCORE-II alto sem Heart Team documentado','Discussão Heart Team obrigatória antes de cirurgia de alto risco','Não realizar cirurgia cardíaca de alto risco sem Heart Team','hard_gate',1,'F002',TRUE),
('escores_intervencionista_sangramento_v1','OVR-013','UTI','APACHE-II','apache_ii_uti_inadequada','Tentativa de negar UTI por APACHE-II alto','UTI se indicação clínica; escore não substitui julgamento clínico','Não negar UTI apenas por APACHE-II alto','hard_gate',1,'F008',TRUE),
('escores_intervencionista_sangramento_v1','OVR-014','UTI','SAPS-II','saps_ii_uti_inadequada','Tentativa de negar UTI por SAPS-II alto','UTI se indicação clínica; escore não substitui julgamento clínico','Não negar UTI apenas por SAPS-II alto','hard_gate',1,'F009',TRUE);

-- ============ Funções ============
CREATE OR REPLACE FUNCTION public.fn_verificar_override_red_flag(
  p_contexto TEXT,
  p_escore_nome TEXT,
  p_red_flags TEXT[]
)
RETURNS TABLE(
  override_aplicado BOOLEAN,
  regra_id TEXT,
  red_flag TEXT,
  acao_override TEXT,
  escore_nao_pode TEXT,
  nivel_gate TEXT,
  prioridade INTEGER
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $fn$
DECLARE
  v_regra RECORD;
  v_flag TEXT;
  v_override_encontrado BOOLEAN := FALSE;
BEGIN
  FOR v_regra IN
    SELECT r.regra_id, r.red_flag, r.acao_override, r.escore_nao_pode,
           r.nivel_gate, r.prioridade
    FROM public.stg_regras_override_red_flag r
    WHERE r.contexto = p_contexto
      AND r.escore_nome = p_escore_nome
      AND r.ativo = TRUE
    ORDER BY r.prioridade ASC
  LOOP
    IF p_red_flags IS NOT NULL THEN
      FOREACH v_flag IN ARRAY p_red_flags LOOP
        IF v_flag = v_regra.red_flag THEN
          v_override_encontrado := TRUE;
          RETURN QUERY SELECT
            TRUE, v_regra.regra_id, v_regra.red_flag, v_regra.acao_override,
            v_regra.escore_nao_pode, v_regra.nivel_gate, v_regra.prioridade;
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  IF NOT v_override_encontrado THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::INTEGER;
  END IF;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.fn_bloquear_uso_inadequado_escore(
  p_atendimento_id TEXT,
  p_contexto TEXT,
  p_escore_nome TEXT,
  p_idade_anos INTEGER DEFAULT NULL,
  p_red_flags TEXT[] DEFAULT '{}'
)
RETURNS TABLE(
  status TEXT,
  motivo TEXT,
  acao_sugerida TEXT,
  populacao_validada BOOLEAN,
  override_aplicado BOOLEAN,
  versao_escore TEXT
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $fn$
DECLARE
  v_aplicavel RECORD;
  v_override RECORD;
BEGIN
  SELECT * INTO v_aplicavel
  FROM public.fn_escore_aplicavel(p_escore_nome, p_contexto, p_idade_anos);

  IF v_aplicavel IS NULL OR NOT v_aplicavel.aplicavel THEN
    RETURN QUERY SELECT 'BLOQUEADO'::TEXT,
      COALESCE(v_aplicavel.motivo, 'Escore não mapeado para este contexto')::TEXT,
      'Escore não aplicável neste contexto/população'::TEXT,
      FALSE, FALSE, v_aplicavel.versao_escore;
    RETURN;
  END IF;

  IF array_length(p_red_flags, 1) > 0 THEN
    FOR v_override IN
      SELECT * FROM public.fn_verificar_override_red_flag(p_contexto, p_escore_nome, p_red_flags)
    LOOP
      IF v_override.override_aplicado THEN
        RETURN QUERY SELECT 'OVERRIDE'::TEXT,
          v_override.red_flag,
          v_override.acao_override,
          TRUE, TRUE, v_aplicavel.versao_escore;
        RETURN;
      END IF;
    END LOOP;
  END IF;

  RETURN QUERY SELECT 'APLICAVEL'::TEXT,
    'Escore aplicável'::TEXT,
    'Calcular escore conforme protocolo'::TEXT,
    TRUE, FALSE, v_aplicavel.versao_escore;
END;
$fn$;

-- ============ Views ============
CREATE OR REPLACE VIEW public.vw_overrides_aplicados
WITH (security_invoker = true) AS
SELECT a.atendimento_id, a.nome_escore, a.categoria, a.conduta_sugerida, a.populacao_validada, a.data_hora
FROM public.audit_escores_clinicos a
WHERE a.categoria LIKE '%OVERRIDE%' OR a.conduta_sugerida LIKE '%OVERRIDE%'
ORDER BY a.data_hora DESC;

CREATE OR REPLACE VIEW public.vw_escores_bloqueados
WITH (security_invoker = true) AS
SELECT a.atendimento_id, a.nome_escore, a.categoria, a.conduta_sugerida, a.populacao_validada, a.data_hora
FROM public.audit_escores_clinicos a
WHERE a.categoria LIKE '%BLOQUEADO%' OR a.conduta_sugerida LIKE '%BLOQUEADO%'
ORDER BY a.data_hora DESC;

CREATE OR REPLACE VIEW public.vw_regras_override_ativas
WITH (security_invoker = true) AS
SELECT regra_id, contexto, escore_nome, red_flag, red_flag_descricao,
       acao_override, escore_nao_pode, nivel_gate, prioridade
FROM public.stg_regras_override_red_flag
WHERE ativo = TRUE
ORDER BY contexto, prioridade ASC;

CREATE OR REPLACE VIEW public.vw_dashboard_global_final
WITH (security_invoker = true) AS
SELECT
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos
   WHERE nome_escore IN ('pSOFA','PELOD-2','PRISM-IV','PIM3','GCS-Pediatrico','NIHSS-Pediatrico')) AS total_pediatricos,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos
   WHERE nome_escore IN ('CFS','FRAIL','4AT-Geriatrico','Hipotensao-Ortostatica','GDS-15','Lawton-Brody','Katz','TUG','Morse-Fall-Scale','Carga-Anticolinergica','Fried-Fenotipo')) AS total_geriatricos,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos
   WHERE nome_escore IN ('Bishop','Apgar','MEWS-OB')) AS total_obstetricos,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos
   WHERE nome_escore IN ('BPS','CPOT','FLACC','Wong-Baker')) AS total_dor,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos
   WHERE nome_escore IN ('ISS','RTS','TRISS','GCS-Trauma')) AS total_trauma,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos
   WHERE nome_escore IN ('ASA','POSSUM','EuroSCORE-II','RCRI','APACHE-II','SAPS-II')) AS total_cirurgicos,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos
   WHERE nome_escore IN ('SYNTAX','SYNTAX-II','EuroSCORE-II-Expandido','CRUSADE')) AS total_intervencionistas,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos
   WHERE nome_escore IN ('HAS-BLED','ORBIT','ATRIA','GRACE-Bleeding','TIMI-Bleeding')) AS total_sangramento,
  (SELECT count(*) FROM public.audit_escores_clinicos WHERE populacao_validada) AS total_calculos_validos,
  (SELECT count(*) FROM public.audit_escores_clinicos WHERE NOT populacao_validada) AS total_calculos_invalidos,
  (SELECT count(*) FROM public.audit_escores_clinicos WHERE NOT entradas_completas) AS total_entradas_incompletas,
  (SELECT count(*) FROM public.audit_escores_clinicos
   WHERE categoria LIKE '%OVERRIDE%' OR conduta_sugerida LIKE '%OVERRIDE%') AS total_overrides,
  (SELECT count(*) FROM public.audit_escores_clinicos
   WHERE categoria LIKE '%BLOQUEADO%' OR conduta_sugerida LIKE '%BLOQUEADO%') AS total_bloqueados,
  (SELECT count(*) FROM public.stg_regras_override_red_flag WHERE ativo = TRUE) AS total_regras_override,
  (SELECT count(*) FROM public.stg_sugestoes_escore_contexto WHERE ativo = TRUE) AS total_sugestoes,
  round(100.0 * (SELECT count(*) FROM public.audit_escores_clinicos WHERE populacao_validada)
    / nullif((SELECT count(*) FROM public.audit_escores_clinicos), 0), 1) AS taxa_global_validacao_pct,
  round(100.0 * (SELECT count(*) FROM public.audit_escores_clinicos WHERE entradas_completas)
    / nullif((SELECT count(*) FROM public.audit_escores_clinicos), 0), 1) AS taxa_global_entradas_completas_pct;

-- ============ Indicadores finais ============
INSERT INTO public.indicadores_qualidade_ps
(lote_id, codigo_indicador, nome, descricao, tipo, formula_numerador, formula_denominador, meta_pct, periodicidade, protocolo_id, fonte_id)
VALUES
('escores_intervencionista_sangramento_v1','IQ_FINAL:1','Overrides aplicados corretamente','Percentual de red flags que geraram override adequado','seguranca','Red flags com override adequado','Total de red flags','>=90','mensal',NULL,'F001'),
('escores_intervencionista_sangramento_v1','IQ_FINAL:2','Escores bloqueados corretamente','Percentual de escores bloqueados corretamente','seguranca','Escores bloqueados corretamente','Total de escores bloqueados','>=95','mensal',NULL,'F001'),
('escores_intervencionista_sangramento_v1','IQ_FINAL:3','Sugestões aplicáveis','Percentual de sugestões com população validada','processo','Sugestões com população validada','Total de sugestões','>=95','mensal',NULL,'F001'),
('escores_intervencionista_sangramento_v1','IQ_FINAL:4','Anticoagulação mantida em HAS-BLED alto','Percentual de pacientes com HAS-BLED alto que mantiveram anticoagulação','resultado','Pacientes com HAS-BLED alto e anticoagulação mantida','Total de pacientes com HAS-BLED alto','>=80','mensal',NULL,'F004'),
('escores_intervencionista_sangramento_v1','IQ_FINAL:5','CABG em SYNTAX >=33','Percentual de pacientes com SYNTAX >=33 que tiveram CABG','resultado','Pacientes com SYNTAX >=33 e CABG','Total de pacientes com SYNTAX >=33','>=80','mensal',NULL,'F001'),
('escores_intervencionista_sangramento_v1','IQ_FINAL:6','Heart Team documentado em SYNTAX >=23','Percentual de pacientes com SYNTAX >=23 com Heart Team documentado','processo','Pacientes com SYNTAX >=23 e Heart Team','Total de pacientes com SYNTAX >=23','>=90','mensal',NULL,'F001'),
('escores_intervencionista_sangramento_v1','IQ_FINAL:7','C-SSRS sem alta inadequada','Percentual de pacientes com C-SSRS baixo sem alta inadequada','seguranca','Pacientes com C-SSRS baixo sem alta inadequada','Total de pacientes com C-SSRS baixo','>=95','mensal',NULL,'F006'),
('escores_intervencionista_sangramento_v1','IQ_FINAL:8','MASCC sem alta em instabilidade','Percentual de pacientes com MASCC baixo sem alta em instabilidade','seguranca','Pacientes com MASCC baixo sem alta em instabilidade','Total de pacientes com MASCC baixo','>=95','mensal',NULL,'F006'),
('escores_intervencionista_sangramento_v1','IQ_FINAL:9','4AT positivo com investigação','Percentual de pacientes com 4AT positivo com investigação de causa médica','processo','Pacientes com 4AT positivo e investigação','Total de pacientes com 4AT positivo','>=90','mensal',NULL,'F001'),
('escores_intervencionista_sangramento_v1','IQ_FINAL:10','Taxa global de validação','Percentual global de cálculos com população validada','resultado','Cálculos com população validada','Total de cálculos','>=95','mensal',NULL,'F001'),
('escores_intervencionista_sangramento_v1','IQ_FINAL:11','Taxa global de entradas completas','Percentual global de cálculos com entradas completas','resultado','Cálculos com entradas completas','Total de cálculos','>=95','mensal',NULL,'F001'),
('escores_intervencionista_sangramento_v1','IQ_FINAL:12','Regras de override ativas','Número de regras de override ativas','estrutura','Regras de override ativas','Total de regras de override','>=14','mensal',NULL,'F001');