
-- Enums
CREATE TYPE public.allergy_severity AS ENUM ('leve','moderada','grave','anafilaxia','desconhecida');
CREATE TYPE public.allergy_reaction_type AS ENUM ('rash_urticaria','angioedema','broncoespasmo','anafilaxia','nausea_intolerancia','reacao_cutanea_grave','desconhecida','outro');
CREATE TYPE public.allergy_record_type AS ENUM ('alergia_confirmada','suspeita_alergia','intolerancia','efeito_adverso','desconhecido');
CREATE TYPE public.contraindication_type AS ENUM (
  'alergia_principio_ativo','alergia_classe','gestacao','lactacao','idade',
  'comorbidade','diagnostico_cid','condicao_clinica','funcao_renal','funcao_hepatica',
  'historico_reacao_adversa','outro'
);
CREATE TYPE public.pregnancy_alert_level AS ENUM ('nao_cadastrado','permitido_com_criterio','atencao','evitar','contraindicado');
CREATE TYPE public.lactation_alert_level AS ENUM ('nao_cadastrado','compativel','usar_com_cautela','evitar','contraindicado');
CREATE TYPE public.pregnancy_trimester AS ENUM ('qualquer','primeiro','segundo','terceiro','nao_aplicavel');
CREATE TYPE public.clinical_alert_action AS ENUM ('visualizou','removeu_medicamento','substituiu_medicamento','confirmou_com_justificativa','bloqueado_pelo_sistema','ignorou_informativo');
CREATE TYPE public.clinical_alert_kind AS ENUM (
  'alergia_principio_ativo','alergia_classe','reacao_cruzada','gestacao','lactacao',
  'idade','comorbidade','cid','restricao_paciente','historico_reacao_adversa'
);

-- Base de contraindicações
CREATE TABLE public.base_contraindicacoes_medicamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  principio_ativo text,
  principio_ativo_normalizado text,
  nomes_comerciais text[] NOT NULL DEFAULT '{}',
  classe_terapeutica text,
  tipo_contraindicacao contraindication_type NOT NULL,
  condicao_clinica text,
  cid_relacionado text,
  grupo_cid text,
  gravidade interaction_severity NOT NULL DEFAULT 'moderada',
  nivel_alerta interaction_alert_level NOT NULL DEFAULT 'atencao',
  mecanismo_ou_motivo text,
  mensagem_medico text,
  mensagem_enfermagem_farmacia text,
  conduta_sugerida text,
  exige_justificativa boolean NOT NULL DEFAULT false,
  bloqueio_absoluto boolean NOT NULL DEFAULT false,
  populacoes_afetadas text[] NOT NULL DEFAULT '{}',
  idade_min numeric,
  idade_max numeric,
  fonte_referencia text,
  data_atualizacao date NOT NULL DEFAULT CURRENT_DATE,
  revisado_por uuid,
  status_revisao interaction_review_status NOT NULL DEFAULT 'aguardando_revisao',
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contra_pa ON public.base_contraindicacoes_medicamentos(principio_ativo_normalizado);
CREATE INDEX idx_contra_classe ON public.base_contraindicacoes_medicamentos(classe_terapeutica);
CREATE INDEX idx_contra_tipo ON public.base_contraindicacoes_medicamentos(tipo_contraindicacao);
CREATE INDEX idx_contra_status ON public.base_contraindicacoes_medicamentos(status_revisao);

ALTER TABLE public.base_contraindicacoes_medicamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read contraindications" ON public.base_contraindicacoes_medicamentos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/revisor insert contraindications" ON public.base_contraindicacoes_medicamentos
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'revisor'::app_role));
CREATE POLICY "Admin/revisor update contraindications" ON public.base_contraindicacoes_medicamentos
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'revisor'::app_role));
CREATE POLICY "Admin delete contraindications" ON public.base_contraindicacoes_medicamentos
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

CREATE OR REPLACE FUNCTION public.contra_set_normalized()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.principio_ativo_normalizado := public.iv_normalize_text(NEW.principio_ativo);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_contra_normalized
BEFORE INSERT OR UPDATE ON public.base_contraindicacoes_medicamentos
FOR EACH ROW EXECUTE FUNCTION public.contra_set_normalized();

-- Perfil clínico do paciente
CREATE TABLE public.pacientes_perfil_clinico (
  id_paciente text NOT NULL PRIMARY KEY,
  alergias_medicamentosas jsonb NOT NULL DEFAULT '[]',
  alergias_classes_medicamentosas text[] NOT NULL DEFAULT '{}',
  alergias_outros text[] NOT NULL DEFAULT '{}',
  gestante boolean NOT NULL DEFAULT false,
  idade_gestacional_semanas integer,
  trimestre_gestacional pregnancy_trimester,
  lactante boolean NOT NULL DEFAULT false,
  idade_anos numeric,
  sexo_biologico text,
  peso_kg numeric,
  altura_cm numeric,
  comorbidades text[] NOT NULL DEFAULT '{}',
  diagnosticos_cid text[] NOT NULL DEFAULT '{}',
  condicoes_clinicas_relevantes text[] NOT NULL DEFAULT '{}',
  historico_reacoes_adversas jsonb NOT NULL DEFAULT '[]',
  restricoes_medicamentosas text[] NOT NULL DEFAULT '{}',
  observacoes_clinicas_paciente text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pacientes_perfil_clinico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner read patient profile" ON public.pacientes_perfil_clinico
  FOR SELECT TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Admin/revisor read all patient profiles" ON public.pacientes_perfil_clinico
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'revisor'::app_role));
CREATE POLICY "Owner insert patient profile" ON public.pacientes_perfil_clinico
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owner update patient profile" ON public.pacientes_perfil_clinico
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Owner delete patient profile" ON public.pacientes_perfil_clinico
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE TRIGGER tg_perfil_updated_at
BEFORE UPDATE ON public.pacientes_perfil_clinico
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Restrições do paciente
CREATE TABLE public.restricoes_paciente (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_paciente text NOT NULL,
  tipo_restricao text,
  principio_ativo text,
  classe_terapeutica text,
  grupo_alergia text,
  texto_restricao text NOT NULL,
  gravidade interaction_severity NOT NULL DEFAULT 'moderada',
  motivo text,
  criada_por uuid NOT NULL,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_restr_paciente ON public.restricoes_paciente(id_paciente);

ALTER TABLE public.restricoes_paciente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner read restricoes" ON public.restricoes_paciente
  FOR SELECT TO authenticated USING (auth.uid() = criada_por);
CREATE POLICY "Admin/revisor read all restricoes" ON public.restricoes_paciente
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'revisor'::app_role));
CREATE POLICY "Owner insert restricoes" ON public.restricoes_paciente
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = criada_por);
CREATE POLICY "Owner update restricoes" ON public.restricoes_paciente
  FOR UPDATE TO authenticated USING (auth.uid() = criada_por);
CREATE POLICY "Owner delete restricoes" ON public.restricoes_paciente
  FOR DELETE TO authenticated USING (auth.uid() = criada_por);

-- Log de alertas
CREATE TABLE public.log_alertas_alergias_condicoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_hora timestamptz NOT NULL DEFAULT now(),
  usuario_responsavel uuid NOT NULL,
  id_prescricao text,
  id_paciente text,
  principio_ativo text,
  medicamento_prescrito text,
  tipo_alerta clinical_alert_kind NOT NULL,
  condicao_relacionada text,
  gravidade interaction_severity,
  nivel_alerta interaction_alert_level,
  mensagem_alerta text NOT NULL,
  acao_usuario clinical_alert_action,
  justificativa text
);

ALTER TABLE public.log_alertas_alergias_condicoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert their own clinical alert log" ON public.log_alertas_alergias_condicoes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_responsavel);
CREATE POLICY "Users view their own clinical alert log" ON public.log_alertas_alergias_condicoes
  FOR SELECT TO authenticated USING (auth.uid() = usuario_responsavel);
CREATE POLICY "Admin/revisor view all clinical alert log" ON public.log_alertas_alergias_condicoes
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'revisor'::app_role));

-- Settings
CREATE TABLE public.clinical_alerts_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usar_apenas_revisadas boolean NOT NULL DEFAULT true,
  bloquear_alergia_grave_pa boolean NOT NULL DEFAULT true,
  exigir_just_alergia_suspeita boolean NOT NULL DEFAULT true,
  diferenciar_intolerancia_alergia boolean NOT NULL DEFAULT true,
  exigir_just_gestacao boolean NOT NULL DEFAULT true,
  exigir_just_lactacao boolean NOT NULL DEFAULT true,
  exigir_just_comorbidade_grave boolean NOT NULL DEFAULT true,
  ocultar_sem_fonte_uso_clinico boolean NOT NULL DEFAULT true,
  permitir_restricoes_paciente boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.clinical_alerts_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read clinical alerts settings" ON public.clinical_alerts_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert clinical alerts settings" ON public.clinical_alerts_settings
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admin update clinical alerts settings" ON public.clinical_alerts_settings
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

INSERT INTO public.clinical_alerts_settings (id) VALUES (gen_random_uuid());

-- Estender iv_medications
ALTER TABLE public.iv_medications
  ADD COLUMN familia_medicamentosa text,
  ADD COLUMN grupo_alergia text,
  ADD COLUMN risco_reacao_cruzada risk_level NOT NULL DEFAULT 'desconhecido',
  ADD COLUMN observacao_reacao_cruzada text,
  ADD COLUMN fonte_reacao_cruzada text,
  ADD COLUMN status_revisao_reacao_cruzada interaction_review_status NOT NULL DEFAULT 'aguardando_revisao',
  ADD COLUMN alerta_gestacao pregnancy_alert_level NOT NULL DEFAULT 'nao_cadastrado',
  ADD COLUMN categoria_risco_gestacional text,
  ADD COLUMN trimestre_relevante pregnancy_trimester NOT NULL DEFAULT 'qualquer',
  ADD COLUMN contraindicado_gestacao boolean NOT NULL DEFAULT false,
  ADD COLUMN exige_justificativa_gestacao boolean NOT NULL DEFAULT false,
  ADD COLUMN observacao_gestacao text,
  ADD COLUMN fonte_gestacao text,
  ADD COLUMN status_revisao_gestacao interaction_review_status NOT NULL DEFAULT 'aguardando_revisao',
  ADD COLUMN alerta_lactacao lactation_alert_level NOT NULL DEFAULT 'nao_cadastrado',
  ADD COLUMN contraindicado_lactacao boolean NOT NULL DEFAULT false,
  ADD COLUMN exige_justificativa_lactacao boolean NOT NULL DEFAULT false,
  ADD COLUMN observacao_lactacao text,
  ADD COLUMN fonte_lactacao text,
  ADD COLUMN status_revisao_lactacao interaction_review_status NOT NULL DEFAULT 'aguardando_revisao',
  ADD COLUMN idade_minima numeric,
  ADD COLUMN idade_maxima numeric,
  ADD COLUMN contraindicado_abaixo_idade boolean NOT NULL DEFAULT false,
  ADD COLUMN contraindicado_acima_idade boolean NOT NULL DEFAULT false,
  ADD COLUMN observacao_idade text,
  ADD COLUMN fonte_idade text,
  ADD COLUMN status_revisao_idade interaction_review_status NOT NULL DEFAULT 'aguardando_revisao';

CREATE INDEX idx_iv_meds_grupo_alergia ON public.iv_medications(grupo_alergia);
