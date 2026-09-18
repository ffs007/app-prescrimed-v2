
-- Enums
CREATE TYPE public.interaction_type AS ENUM (
  'farmacocinetica','farmacodinamica','duplicidade_terapeutica','qt_longo',
  'nefrotoxicidade_somada','hepatotoxicidade_somada','risco_hemorragico',
  'depressao_respiratoria','sedacao_somada','serotoninergico','hipercalemia',
  'hipocalemia','hipotensao','bradicardia','hipertensao','glicemia','outro'
);

CREATE TYPE public.interaction_severity AS ENUM ('leve','moderada','grave','contraindicada');
CREATE TYPE public.interaction_alert_level AS ENUM ('informativo','atencao','alto','critico');
CREATE TYPE public.interaction_review_status AS ENUM ('rascunho','aguardando_revisao','revisado','precisa_corrigir','inativo');
CREATE TYPE public.risk_level AS ENUM ('nenhum','baixo','moderado','alto','desconhecido');
CREATE TYPE public.interaction_alert_action AS ENUM (
  'visualizou','corrigiu_prescricao','removeu_medicamento','substituiu_medicamento',
  'confirmou_com_justificativa','bloqueado_pelo_sistema','ignorou_informativo'
);
CREATE TYPE public.interaction_alert_kind AS ENUM (
  'interacao_especifica','duplicidade_terapeutica','risco_acumulado','monitorizacao','bloqueio'
);

-- Base de interações
CREATE TABLE public.base_interacoes_medicamentosas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medicamento_a text,
  medicamento_b text,
  principio_ativo_a text,
  principio_ativo_b text,
  principio_ativo_a_normalizado text,
  principio_ativo_b_normalizado text,
  classe_a text,
  classe_b text,
  tipo_interacao interaction_type NOT NULL,
  mecanismo text,
  gravidade interaction_severity NOT NULL DEFAULT 'moderada',
  nivel_alerta interaction_alert_level NOT NULL DEFAULT 'atencao',
  conduta_sugerida text,
  mensagem_medico text,
  mensagem_enfermagem_farmacia text,
  exige_justificativa boolean NOT NULL DEFAULT false,
  bloqueio_absoluto boolean NOT NULL DEFAULT false,
  monitorizacao_recomendada text,
  exames_monitorar text[] NOT NULL DEFAULT '{}',
  populacoes_maior_risco text[] NOT NULL DEFAULT '{}',
  contexto_clinico_relevante text,
  fonte_referencia text,
  data_atualizacao date NOT NULL DEFAULT CURRENT_DATE,
  revisado_por uuid,
  status_revisao interaction_review_status NOT NULL DEFAULT 'aguardando_revisao',
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_base_interacoes_pa_a ON public.base_interacoes_medicamentosas(principio_ativo_a_normalizado);
CREATE INDEX idx_base_interacoes_pa_b ON public.base_interacoes_medicamentosas(principio_ativo_b_normalizado);
CREATE INDEX idx_base_interacoes_classe ON public.base_interacoes_medicamentosas(classe_a, classe_b);
CREATE INDEX idx_base_interacoes_status ON public.base_interacoes_medicamentosas(status_revisao);

ALTER TABLE public.base_interacoes_medicamentosas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read interactions base" ON public.base_interacoes_medicamentosas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/revisor insert interactions" ON public.base_interacoes_medicamentosas
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'revisor'::app_role));
CREATE POLICY "Admin/revisor update interactions" ON public.base_interacoes_medicamentosas
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'revisor'::app_role));
CREATE POLICY "Admin delete interactions" ON public.base_interacoes_medicamentosas
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER tg_base_interacoes_normalize
BEFORE INSERT OR UPDATE ON public.base_interacoes_medicamentosas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger to normalize principio_ativo_a/b
CREATE OR REPLACE FUNCTION public.interacoes_set_normalized()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.principio_ativo_a_normalizado := public.iv_normalize_text(NEW.principio_ativo_a);
  NEW.principio_ativo_b_normalizado := public.iv_normalize_text(NEW.principio_ativo_b);
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_base_interacoes_normalized
BEFORE INSERT OR UPDATE ON public.base_interacoes_medicamentosas
FOR EACH ROW EXECUTE FUNCTION public.interacoes_set_normalized();

-- Estender iv_medications com classes e riscos
ALTER TABLE public.iv_medications
  ADD COLUMN classe_terapeutica text,
  ADD COLUMN subclasse_terapeutica text,
  ADD COLUMN grupo_risco text,
  ADD COLUMN risco_qt risk_level NOT NULL DEFAULT 'desconhecido',
  ADD COLUMN risco_nefrotoxico risk_level NOT NULL DEFAULT 'desconhecido',
  ADD COLUMN risco_hepatotoxico risk_level NOT NULL DEFAULT 'desconhecido',
  ADD COLUMN risco_hemorragico risk_level NOT NULL DEFAULT 'desconhecido',
  ADD COLUMN risco_sedacao risk_level NOT NULL DEFAULT 'desconhecido',
  ADD COLUMN risco_depressao_respiratoria risk_level NOT NULL DEFAULT 'desconhecido',
  ADD COLUMN risco_serotoninergico risk_level NOT NULL DEFAULT 'desconhecido',
  ADD COLUMN risco_hipercalemia risk_level NOT NULL DEFAULT 'desconhecido',
  ADD COLUMN risco_hipocalemia risk_level NOT NULL DEFAULT 'desconhecido',
  ADD COLUMN risco_hipotensao risk_level NOT NULL DEFAULT 'desconhecido',
  ADD COLUMN risco_bradicardia risk_level NOT NULL DEFAULT 'desconhecido',
  ADD COLUMN risco_glicemia risk_level NOT NULL DEFAULT 'desconhecido',
  ADD COLUMN permite_duplicidade_mesma_classe boolean NOT NULL DEFAULT false,
  ADD COLUMN observacao_duplicidade text,
  ADD COLUMN fonte_riscos_medicamento text,
  ADD COLUMN status_revisao_riscos interaction_review_status NOT NULL DEFAULT 'aguardando_revisao';

CREATE INDEX idx_iv_meds_classe ON public.iv_medications(classe_terapeutica);
CREATE INDEX idx_iv_meds_subclasse ON public.iv_medications(subclasse_terapeutica);

-- Log
CREATE TABLE public.log_interacoes_prescricao (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_hora timestamptz NOT NULL DEFAULT now(),
  usuario_responsavel uuid NOT NULL,
  id_prescricao text,
  id_paciente text,
  medicamentos_envolvidos jsonb NOT NULL DEFAULT '[]',
  principios_ativos_envolvidos jsonb NOT NULL DEFAULT '[]',
  tipo_alerta interaction_alert_kind NOT NULL,
  tipo_interacao interaction_type,
  gravidade interaction_severity,
  nivel_alerta interaction_alert_level,
  mensagem_alerta text NOT NULL,
  acao_usuario interaction_alert_action,
  justificativa text
);

ALTER TABLE public.log_interacoes_prescricao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert their own interaction log" ON public.log_interacoes_prescricao
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_responsavel);
CREATE POLICY "Users view their own interaction log" ON public.log_interacoes_prescricao
  FOR SELECT TO authenticated USING (auth.uid() = usuario_responsavel);
CREATE POLICY "Admin/revisor view all interaction log" ON public.log_interacoes_prescricao
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'revisor'::app_role));

-- Settings singleton
CREATE TABLE public.interacoes_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usar_apenas_revisadas boolean NOT NULL DEFAULT true,
  exigir_just_interacao_grave boolean NOT NULL DEFAULT true,
  bloquear_contraindicada boolean NOT NULL DEFAULT true,
  alertar_duplicidade boolean NOT NULL DEFAULT true,
  exigir_just_duplicidade_alto_risco boolean NOT NULL DEFAULT true,
  mostrar_risco_acumulado boolean NOT NULL DEFAULT true,
  exigir_just_risco_muito_alto boolean NOT NULL DEFAULT true,
  ignorar_alertas_leves_revisao boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.interacoes_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read interacoes settings" ON public.interacoes_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert interacoes settings" ON public.interacoes_settings
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admin update interacoes settings" ON public.interacoes_settings
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

INSERT INTO public.interacoes_settings (id) VALUES (gen_random_uuid());
