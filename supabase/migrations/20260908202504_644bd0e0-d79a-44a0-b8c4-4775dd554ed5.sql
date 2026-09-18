CREATE TABLE public.notificacoes_compulsorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  agravo_id text NOT NULL,
  agravo text NOT NULL,
  paciente_nome text,
  cid text,
  classificacao text,
  imediata boolean NOT NULL DEFAULT false,
  prazo_horas integer,
  data_sintomas date,
  status text NOT NULL DEFAULT 'pendente',
  enviado_em timestamptz,
  protocolo_vigilancia text,
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  texto text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notificacoes_compulsorias TO authenticated;
GRANT ALL ON public.notificacoes_compulsorias TO service_role;

ALTER TABLE public.notificacoes_compulsorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own notificacoes select" ON public.notificacoes_compulsorias
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own notificacoes insert" ON public.notificacoes_compulsorias
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own notificacoes update" ON public.notificacoes_compulsorias
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own notificacoes delete" ON public.notificacoes_compulsorias
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX idx_notificacoes_user_created ON public.notificacoes_compulsorias (user_id, created_at DESC);
CREATE INDEX idx_notificacoes_status ON public.notificacoes_compulsorias (user_id, status);

CREATE TRIGGER trg_notificacoes_updated_at
  BEFORE UPDATE ON public.notificacoes_compulsorias
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();