
DO $$ BEGIN
  CREATE TYPE public.iv_calc_status AS ENUM ('calculado','incompleto','erro_unidade','exige_peso','exige_volume','exige_tempo','nao_aplicavel');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.log_calculos_iv (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_hora timestamptz NOT NULL DEFAULT now(),
  usuario_responsavel uuid NOT NULL,
  id_prescricao text,
  id_paciente text,
  principio_ativo text NOT NULL,
  dose_original numeric,
  unidade_dose_original text,
  dose_convertida numeric,
  volume_diluicao numeric,
  tempo_infusao numeric,
  concentracao_calculada numeric,
  concentracao_maxima numeric,
  velocidade_calculada_ml_h numeric,
  velocidade_calculada_mg_min numeric,
  velocidade_maxima numeric,
  peso_paciente_kg numeric,
  status_calculo public.iv_calc_status NOT NULL,
  alertas_gerados jsonb NOT NULL DEFAULT '[]'::jsonb,
  evento text
);

ALTER TABLE public.log_calculos_iv ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert their own IV calc log"
ON public.log_calculos_iv FOR INSERT TO authenticated
WITH CHECK (auth.uid() = usuario_responsavel);

CREATE POLICY "Users view their own IV calc log"
ON public.log_calculos_iv FOR SELECT TO authenticated
USING (auth.uid() = usuario_responsavel);

CREATE POLICY "Admin/revisor view all IV calc log"
ON public.log_calculos_iv FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'revisor'::app_role));

CREATE INDEX IF NOT EXISTS idx_iv_calc_log_data ON public.log_calculos_iv (data_hora DESC);

-- Configurações administrativas (linha única)
CREATE TABLE IF NOT EXISTS public.iv_calc_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bloquear_concentracao_2x boolean NOT NULL DEFAULT true,
  exigir_just_velocidade boolean NOT NULL DEFAULT true,
  exigir_just_tempo boolean NOT NULL DEFAULT true,
  permitir_calculo_incompleto boolean NOT NULL DEFAULT true,
  exigir_peso_vasoativos boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.iv_calc_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read IV calc settings"
ON public.iv_calc_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin insert IV calc settings"
ON public.iv_calc_settings FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin update IV calc settings"
ON public.iv_calc_settings FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_iv_calc_settings_updated
BEFORE UPDATE ON public.iv_calc_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.iv_calc_settings (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;
