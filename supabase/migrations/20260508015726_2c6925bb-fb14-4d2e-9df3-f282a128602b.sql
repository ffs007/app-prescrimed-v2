-- Add roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'enfermagem';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'farmacia';

-- Profile preference
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pref_iv_pdf text NOT NULL DEFAULT 'perguntar';

-- View/usage log
CREATE TABLE IF NOT EXISTS public.log_visualizacao_orientacoes_iv (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_prescricao text,
  id_paciente text,
  principio_ativo text NOT NULL,
  tipo_visualizacao text NOT NULL,
  perfil_usuario text,
  usuario_responsavel uuid NOT NULL,
  acao_realizada text NOT NULL,
  data_hora timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.log_visualizacao_orientacoes_iv ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin view all IV orientation log"
  ON public.log_visualizacao_orientacoes_iv FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'));

CREATE POLICY "Users view their own IV orientation log"
  ON public.log_visualizacao_orientacoes_iv FOR SELECT TO authenticated
  USING (auth.uid() = usuario_responsavel);

CREATE POLICY "Users insert their own IV orientation log"
  ON public.log_visualizacao_orientacoes_iv FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_responsavel);

CREATE INDEX IF NOT EXISTS idx_log_iv_orient_user ON public.log_visualizacao_orientacoes_iv(usuario_responsavel, data_hora DESC);