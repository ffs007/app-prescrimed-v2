CREATE TABLE IF NOT EXISTS public.base_sindromes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nome text NOT NULL,
  sinonimos text[] NOT NULL DEFAULT '{}',
  ambientes text[] NOT NULL DEFAULT '{}',
  cid_sugerido text,
  gravidade_tipica text,
  categoria text,
  medicamentos_ambulatoriais jsonb NOT NULL DEFAULT '[]'::jsonb,
  medicamentos_hospitalares jsonb NOT NULL DEFAULT '[]'::jsonb,
  exames_comuns jsonb NOT NULL DEFAULT '[]'::jsonb,
  exames_apac jsonb NOT NULL DEFAULT '[]'::jsonb,
  orientacoes text[] NOT NULL DEFAULT '{}',
  atestado_padrao text,
  encaminhamentos text[] NOT NULL DEFAULT '{}',
  relatorio_padrao text,
  adaptacao_pediatrica text,
  adaptacao_gestante text,
  adaptacao_lactante text,
  adaptacao_geriatrica text,
  sinais_alerta text[] NOT NULL DEFAULT '{}',
  contraindicacoes text[] NOT NULL DEFAULT '{}',
  documentos_relacionados text[] NOT NULL DEFAULT '{}',
  versao integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'publicado',
  fonte text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.base_sindromes TO authenticated;
GRANT ALL ON public.base_sindromes TO service_role;

ALTER TABLE public.base_sindromes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sindromes_select_authenticated"
  ON public.base_sindromes FOR SELECT TO authenticated USING (true);

CREATE POLICY "sindromes_admin_write"
  ON public.base_sindromes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.tg_base_sindromes_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_base_sindromes_updated_at
  BEFORE UPDATE ON public.base_sindromes
  FOR EACH ROW EXECUTE FUNCTION public.tg_base_sindromes_touch();