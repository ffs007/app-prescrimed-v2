ALTER TABLE public.patologia_ambiente DROP CONSTRAINT IF EXISTS patologia_ambiente_nome_unico;
ALTER TABLE public.patologia_ambiente ADD COLUMN IF NOT EXISTS sistema text;
ALTER TABLE public.patologia_ambiente ADD COLUMN IF NOT EXISTS frequencia integer NOT NULL DEFAULT 50;
ALTER TABLE public.patologia_ambiente ADD COLUMN IF NOT EXISTS apresentacao text;
CREATE UNIQUE INDEX IF NOT EXISTS patologia_ambiente_nome_amb_unico ON public.patologia_ambiente (nome_normalizado, ambiente);
CREATE INDEX IF NOT EXISTS patologia_ambiente_sistema_idx ON public.patologia_ambiente (sistema);

CREATE TABLE IF NOT EXISTS public.sindrome_patologia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sindrome_codigo text NOT NULL,
  nome_patologia text NOT NULL,
  nome_normalizado text NOT NULL,
  prioridade integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sindrome_patologia TO authenticated;
GRANT ALL ON public.sindrome_patologia TO service_role;
ALTER TABLE public.sindrome_patologia ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS sindrome_patologia_unico ON public.sindrome_patologia (sindrome_codigo, nome_normalizado);
CREATE INDEX IF NOT EXISTS sindrome_patologia_cod_idx ON public.sindrome_patologia (sindrome_codigo);

DROP POLICY IF EXISTS "sindrome_patologia_select" ON public.sindrome_patologia;
CREATE POLICY "sindrome_patologia_select" ON public.sindrome_patologia
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "sindrome_patologia_admin" ON public.sindrome_patologia;
CREATE POLICY "sindrome_patologia_admin" ON public.sindrome_patologia
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS set_updated_at_sindrome_patologia ON public.sindrome_patologia;
CREATE TRIGGER set_updated_at_sindrome_patologia
  BEFORE UPDATE ON public.sindrome_patologia
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();