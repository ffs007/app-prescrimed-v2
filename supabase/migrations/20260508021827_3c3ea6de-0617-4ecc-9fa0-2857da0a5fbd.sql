
-- Enum status revisão pediátrica
DO $$ BEGIN
  CREATE TYPE public.iv_pediatric_review_status AS ENUM ('nao_cadastrado','aguardando_revisao','revisado','precisa_corrigir','inativo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Campos pediátricos em iv_medications
ALTER TABLE public.iv_medications
  ADD COLUMN IF NOT EXISTS dose_pediatrica_min numeric,
  ADD COLUMN IF NOT EXISTS dose_pediatrica_max numeric,
  ADD COLUMN IF NOT EXISTS unidade_dose_pediatrica text,
  ADD COLUMN IF NOT EXISTS intervalo_dose_pediatrica text,
  ADD COLUMN IF NOT EXISTS dose_maxima_por_administracao numeric,
  ADD COLUMN IF NOT EXISTS dose_maxima_diaria numeric,
  ADD COLUMN IF NOT EXISTS unidade_dose_maxima text,
  ADD COLUMN IF NOT EXISTS faixa_etaria_min numeric,
  ADD COLUMN IF NOT EXISTS faixa_etaria_max numeric,
  ADD COLUMN IF NOT EXISTS peso_minimo_kg numeric,
  ADD COLUMN IF NOT EXISTS peso_maximo_kg numeric,
  ADD COLUMN IF NOT EXISTS uso_neonatal boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS restricao_idade text,
  ADD COLUMN IF NOT EXISTS observacao_pediatrica text,
  ADD COLUMN IF NOT EXISTS exige_ajuste_funcao_renal boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS exige_ajuste_funcao_hepatica boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fonte_dose_pediatrica text,
  ADD COLUMN IF NOT EXISTS data_atualizacao_dose_pediatrica date,
  ADD COLUMN IF NOT EXISTS revisor_dose_pediatrica uuid,
  ADD COLUMN IF NOT EXISTS status_revisao_dose_pediatrica public.iv_pediatric_review_status NOT NULL DEFAULT 'nao_cadastrado';

-- Configurações pediátricas (singleton)
CREATE TABLE IF NOT EXISTS public.iv_pediatric_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exigir_peso_pediatrico boolean NOT NULL DEFAULT true,
  exigir_just_dose_acima_faixa boolean NOT NULL DEFAULT true,
  bloquear_dose_2x_maxima boolean NOT NULL DEFAULT true,
  alertar_volume_abaixo_05ml boolean NOT NULL DEFAULT true,
  bloquear_volume_abaixo_01ml boolean NOT NULL DEFAULT true,
  mostrar_calc_sempre_menor_18 boolean NOT NULL DEFAULT true,
  permitir_calc_pediatrico_adulto boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.iv_pediatric_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read IV pediatric settings"
  ON public.iv_pediatric_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert IV pediatric settings"
  ON public.iv_pediatric_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update IV pediatric settings"
  ON public.iv_pediatric_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'));

INSERT INTO public.iv_pediatric_settings (id) VALUES (gen_random_uuid())
  ON CONFLICT DO NOTHING;

-- Log de cálculos pediátricos
CREATE TABLE IF NOT EXISTS public.log_calculos_pediatricos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_hora timestamptz NOT NULL DEFAULT now(),
  usuario_responsavel uuid NOT NULL,
  id_prescricao text,
  id_paciente text,
  idade_anos numeric,
  idade_meses numeric,
  peso_kg numeric,
  principio_ativo text NOT NULL,
  dose_prescrita numeric,
  unidade_dose text,
  dose_mg_kg_calculada numeric,
  dose_minima_calculada numeric,
  dose_maxima_calculada numeric,
  dose_diaria_calculada numeric,
  dose_maxima_diaria numeric,
  frequencia text,
  status_calculo public.iv_calc_status NOT NULL,
  alertas_gerados jsonb NOT NULL DEFAULT '[]'::jsonb,
  justificativa text,
  evento text
);
ALTER TABLE public.log_calculos_pediatricos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert their own pediatric calc log"
  ON public.log_calculos_pediatricos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_responsavel);
CREATE POLICY "Users view their own pediatric calc log"
  ON public.log_calculos_pediatricos FOR SELECT TO authenticated
  USING (auth.uid() = usuario_responsavel);
CREATE POLICY "Admin/revisor view all pediatric calc log"
  ON public.log_calculos_pediatricos FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'revisor'));
