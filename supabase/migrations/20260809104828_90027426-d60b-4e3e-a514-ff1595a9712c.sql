ALTER TABLE public.stg_patologias ADD COLUMN IF NOT EXISTS linha_bruta text;
ALTER TABLE public.stg_exames ADD COLUMN IF NOT EXISTS linha_bruta text;
ALTER TABLE public.stg_patologia_exames ADD COLUMN IF NOT EXISTS linha_bruta text;
ALTER TABLE public.stg_rastreamentos ADD COLUMN IF NOT EXISTS linha_bruta text;

CREATE TABLE IF NOT EXISTS public.stg_import_lotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  destino text NOT NULL,
  formato text NOT NULL,
  linhas_aceitas integer NOT NULL DEFAULT 0,
  linhas_rejeitadas integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stg_import_lotes TO authenticated;
GRANT ALL ON public.stg_import_lotes TO service_role;

ALTER TABLE public.stg_import_lotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam stg_import_lotes"
ON public.stg_import_lotes FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_stg_import_lotes_updated
BEFORE UPDATE ON public.stg_import_lotes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();