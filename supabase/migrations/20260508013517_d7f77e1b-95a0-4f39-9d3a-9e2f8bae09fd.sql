
CREATE TYPE public.iv_review_status AS ENUM (
  'finalizada_sem_alertas',
  'finalizada_com_alertas_informativos',
  'finalizada_com_justificativa',
  'bloqueada_pelo_sistema',
  'retornou_para_edicao'
);

CREATE TABLE public.historico_revisao_seguranca_iv (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_responsavel UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id_prescricao TEXT,
  id_paciente TEXT,
  medicamentos_iv_revisados JSONB NOT NULL DEFAULT '[]'::jsonb,
  quantidade_alertas_altos INTEGER NOT NULL DEFAULT 0,
  quantidade_alertas_medios INTEGER NOT NULL DEFAULT 0,
  quantidade_alertas_informativos INTEGER NOT NULL DEFAULT 0,
  bloqueios_identificados INTEGER NOT NULL DEFAULT 0,
  bloqueios_corrigidos INTEGER NOT NULL DEFAULT 0,
  justificativas_registradas JSONB NOT NULL DEFAULT '[]'::jsonb,
  orientacoes_copiadas BOOLEAN NOT NULL DEFAULT false,
  status_finalizacao public.iv_review_status NOT NULL,
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hist_rev_iv_user ON public.historico_revisao_seguranca_iv (usuario_responsavel, data_hora DESC);

ALTER TABLE public.historico_revisao_seguranca_iv ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own IV review history"
  ON public.historico_revisao_seguranca_iv FOR SELECT TO authenticated
  USING (auth.uid() = usuario_responsavel);

CREATE POLICY "Admins view all IV review history"
  ON public.historico_revisao_seguranca_iv FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert their own IV review history"
  ON public.historico_revisao_seguranca_iv FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_responsavel);
