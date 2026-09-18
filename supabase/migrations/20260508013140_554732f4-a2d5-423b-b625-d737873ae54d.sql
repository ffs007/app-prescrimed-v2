
CREATE TYPE public.iv_alert_severity AS ENUM ('info', 'warning', 'blocker');
CREATE TYPE public.iv_alert_action AS ENUM (
  'corrigiu_prescricao',
  'confirmou_com_justificativa',
  'ignorou_alerta_informativo',
  'bloqueado_pelo_sistema'
);

CREATE TABLE public.historico_alertas_iv (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_responsavel UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id_prescricao TEXT,
  id_paciente TEXT,
  principio_ativo TEXT NOT NULL,
  tipo_alerta TEXT NOT NULL,
  gravidade public.iv_alert_severity NOT NULL,
  mensagem_alerta TEXT NOT NULL,
  valor_prescrito TEXT,
  valor_recomendado TEXT,
  acao_usuario public.iv_alert_action NOT NULL,
  justificativa TEXT,
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hist_alertas_iv_user ON public.historico_alertas_iv (usuario_responsavel, data_hora DESC);
CREATE INDEX idx_hist_alertas_iv_principio ON public.historico_alertas_iv (principio_ativo);

ALTER TABLE public.historico_alertas_iv ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own IV alert history"
  ON public.historico_alertas_iv FOR SELECT TO authenticated
  USING (auth.uid() = usuario_responsavel);

CREATE POLICY "Admins view all IV alert history"
  ON public.historico_alertas_iv FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert their own IV alert history"
  ON public.historico_alertas_iv FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_responsavel);
