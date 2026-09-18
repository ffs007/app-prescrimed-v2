CREATE TABLE public.stg_patologias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text,
  linha_origem text,
  nome_patologia text,
  sinonimos text,
  cid10 text,
  cid11 text,
  categoria_clinica text,
  is_emergencia text,
  patologia_pai text,
  subtipo text,
  contexto_predominante text,
  fonte_id text,
  trecho_citado text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stg_patologias TO authenticated;
GRANT ALL ON public.stg_patologias TO service_role;

ALTER TABLE public.stg_patologias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam stg_patologias"
ON public.stg_patologias FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_stg_patologias_updated
BEFORE UPDATE ON public.stg_patologias
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_stg_patologias_lote ON public.stg_patologias (lote_id);