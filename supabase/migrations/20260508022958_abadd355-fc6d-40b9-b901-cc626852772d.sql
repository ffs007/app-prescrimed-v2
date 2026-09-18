
DO $$ BEGIN
  CREATE TYPE public.iv_renal_hepatic_review_status AS ENUM ('nao_cadastrado','aguardando_revisao','revisado','precisa_corrigir','inativo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.iv_medications
  ADD COLUMN IF NOT EXISTS risco_acumulo_renal boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS risco_nefrotoxicidade boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS risco_hepatotoxicidade boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS monitorar_nivel_serico boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS monitorar_creatinina boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS monitorar_transaminases boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contraindicado_renal_grave boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contraindicado_hepatico_grave boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS observacao_ajuste_renal text,
  ADD COLUMN IF NOT EXISTS observacao_ajuste_hepatico text,
  ADD COLUMN IF NOT EXISTS faixa_renal_normal text,
  ADD COLUMN IF NOT EXISTS faixa_renal_moderada text,
  ADD COLUMN IF NOT EXISTS faixa_renal_importante text,
  ADD COLUMN IF NOT EXISTS faixa_renal_grave text,
  ADD COLUMN IF NOT EXISTS faixa_dialise text,
  ADD COLUMN IF NOT EXISTS fonte_ajuste_renal text,
  ADD COLUMN IF NOT EXISTS fonte_ajuste_hepatico text,
  ADD COLUMN IF NOT EXISTS data_atualizacao_ajuste_renal_hepatico date,
  ADD COLUMN IF NOT EXISTS revisor_ajuste_renal_hepatico uuid,
  ADD COLUMN IF NOT EXISTS status_revisao_ajuste_renal_hepatico public.iv_renal_hepatic_review_status NOT NULL DEFAULT 'nao_cadastrado';

CREATE TABLE IF NOT EXISTS public.iv_renal_hepatic_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metodo_renal_padrao text NOT NULL DEFAULT 'cockcroft_gault',
  exigir_just_clcr_lt30_ajuste_renal boolean NOT NULL DEFAULT true,
  exigir_just_nefrotoxico_clcr_lt30 boolean NOT NULL DEFAULT true,
  exigir_funcao_renal_alerta_alto boolean NOT NULL DEFAULT false,
  alertar_creatinina_desatualizada boolean NOT NULL DEFAULT true,
  bloquear_contraind_renal_grave boolean NOT NULL DEFAULT false,
  bloquear_contraind_hepatico_grave boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.iv_renal_hepatic_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read IV renal-hepatic settings"
  ON public.iv_renal_hepatic_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert IV renal-hepatic settings"
  ON public.iv_renal_hepatic_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update IV renal-hepatic settings"
  ON public.iv_renal_hepatic_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'));

INSERT INTO public.iv_renal_hepatic_settings (id) VALUES (gen_random_uuid())
  ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.log_alertas_renal_hepatico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_hora timestamptz NOT NULL DEFAULT now(),
  usuario_responsavel uuid NOT NULL,
  id_prescricao text,
  id_paciente text,
  principio_ativo text NOT NULL,
  tipo_alerta text NOT NULL,
  gravidade public.alert_level NOT NULL,
  creatinina_serica numeric,
  unidade_creatinina text,
  clcr_estimado numeric,
  etfg_informada numeric,
  metodo_calculo_renal text,
  classificacao_funcao_renal text,
  dados_hepaticos_disponiveis jsonb NOT NULL DEFAULT '{}'::jsonb,
  mensagem_alerta text NOT NULL,
  acao_usuario text,
  justificativa text
);
ALTER TABLE public.log_alertas_renal_hepatico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert their own RH alert log"
  ON public.log_alertas_renal_hepatico FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_responsavel);
CREATE POLICY "Users view their own RH alert log"
  ON public.log_alertas_renal_hepatico FOR SELECT TO authenticated
  USING (auth.uid() = usuario_responsavel);
CREATE POLICY "Admin/revisor view all RH alert log"
  ON public.log_alertas_renal_hepatico FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'revisor'));
