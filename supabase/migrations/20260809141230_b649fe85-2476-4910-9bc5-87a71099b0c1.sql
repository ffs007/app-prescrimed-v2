CREATE TABLE IF NOT EXISTS public.audit_medflow_ps (
  id BIGSERIAL PRIMARY KEY,
  atendimento_id TEXT NOT NULL,
  data_hora TIMESTAMP DEFAULT now(),
  patologia TEXT,
  escore_aplicado TEXT,
  valor_escore NUMERIC,
  medicamento_prescrito TEXT,
  dose_prescrita TEXT,
  via_administracao TEXT,
  diluicao_correta BOOLEAN,
  velocidade_correta BOOLEAN,
  interacao_detectada TEXT,
  sinal_alarme_presente BOOLEAN,
  conduta_executada TEXT,
  tempo_ate_conduta_min INTEGER,
  override BOOLEAN DEFAULT false,
  motivo_override TEXT,
  profissional_id TEXT,
  revisor TEXT,
  created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_medflow_ps TO authenticated;
GRANT ALL ON public.audit_medflow_ps TO service_role;

ALTER TABLE public.audit_medflow_ps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_medflow_ps_select_authenticated"
ON public.audit_medflow_ps
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "audit_medflow_ps_write_admin_revisor"
ON public.audit_medflow_ps
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'revisor'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'revisor'));

CREATE INDEX IF NOT EXISTS idx_audit_medflow_ps_atendimento_id ON public.audit_medflow_ps(atendimento_id);
CREATE INDEX IF NOT EXISTS idx_audit_medflow_ps_profissional_id ON public.audit_medflow_ps(profissional_id);
CREATE INDEX IF NOT EXISTS idx_audit_medflow_ps_data_hora ON public.audit_medflow_ps(data_hora DESC);