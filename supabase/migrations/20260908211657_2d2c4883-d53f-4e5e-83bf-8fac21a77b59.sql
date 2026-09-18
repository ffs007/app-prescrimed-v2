CREATE TABLE public.patologia_ambiente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_patologia text NOT NULL,
  nome_normalizado text NOT NULL,
  ambiente text NOT NULL CHECK (ambiente IN ('ambulatorial', 'urgencia', 'emergencia')),
  gravidade text NOT NULL DEFAULT 'leve' CHECK (gravidade IN ('leve', 'moderada', 'grave', 'critica')),
  especialidade text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT patologia_ambiente_nome_unico UNIQUE (nome_normalizado)
);

GRANT SELECT ON public.patologia_ambiente TO authenticated;
GRANT ALL ON public.patologia_ambiente TO service_role;

ALTER TABLE public.patologia_ambiente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pathology environments"
ON public.patologia_ambiente
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can create pathology environments"
ON public.patologia_ambiente
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pathology environments"
ON public.patologia_ambiente
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete pathology environments"
ON public.patologia_ambiente
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX patologia_ambiente_ambiente_idx ON public.patologia_ambiente (ambiente);
CREATE INDEX patologia_ambiente_especialidade_idx ON public.patologia_ambiente (especialidade);

CREATE OR REPLACE FUNCTION public.set_patologia_ambiente_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_patologia_ambiente_updated_at
BEFORE UPDATE ON public.patologia_ambiente
FOR EACH ROW EXECUTE FUNCTION public.set_patologia_ambiente_updated_at();