CREATE TABLE public.patologia_medicamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patologia_nome text NOT NULL,
  patologia_normalizada text NOT NULL,
  patologia_id uuid,
  medicamento_id uuid REFERENCES public.base_medicamentos_geral(id) ON DELETE SET NULL,
  medicamento_nome text NOT NULL,
  ambiente text NOT NULL CHECK (ambiente IN ('ambulatorial','urgencia','emergencia')),
  linha text NOT NULL DEFAULT 'primeira' CHECK (linha IN ('primeira','alternativa','sintomatico','suporte')),
  via text,
  dose_adulto text,
  dose_pediatrica text,
  duracao text,
  observacao text,
  publico text NOT NULL DEFAULT 'ambos' CHECK (publico IN ('adulto','pediatrico','ambos')),
  evitar_gestante boolean NOT NULL DEFAULT false,
  ajuste_renal boolean NOT NULL DEFAULT false,
  ajuste_hepatico boolean NOT NULL DEFAULT false,
  prioridade integer NOT NULL DEFAULT 100,
  fonte text,
  status_revisao text NOT NULL DEFAULT 'aprovado',
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX patologia_medicamento_unico
  ON public.patologia_medicamento (patologia_normalizada, medicamento_nome, ambiente, linha);
CREATE INDEX patologia_medicamento_busca
  ON public.patologia_medicamento (patologia_normalizada, ambiente, prioridade);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patologia_medicamento TO authenticated;
GRANT ALL ON public.patologia_medicamento TO service_role;

ALTER TABLE public.patologia_medicamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura autenticada de vinculos patologia-medicamento"
  ON public.patologia_medicamento FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins gerenciam vinculos patologia-medicamento"
  ON public.patologia_medicamento FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.sindrome_medicamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sindrome_nome text NOT NULL,
  sindrome_normalizada text NOT NULL,
  sindrome_id uuid,
  medicamento_id uuid REFERENCES public.base_medicamentos_geral(id) ON DELETE SET NULL,
  medicamento_nome text NOT NULL,
  ambiente text NOT NULL CHECK (ambiente IN ('ambulatorial','urgencia','emergencia')),
  linha text NOT NULL DEFAULT 'primeira' CHECK (linha IN ('primeira','alternativa','sintomatico','suporte')),
  via text,
  dose_adulto text,
  dose_pediatrica text,
  duracao text,
  observacao text,
  publico text NOT NULL DEFAULT 'ambos' CHECK (publico IN ('adulto','pediatrico','ambos')),
  evitar_gestante boolean NOT NULL DEFAULT false,
  ajuste_renal boolean NOT NULL DEFAULT false,
  ajuste_hepatico boolean NOT NULL DEFAULT false,
  prioridade integer NOT NULL DEFAULT 100,
  fonte text,
  status_revisao text NOT NULL DEFAULT 'aprovado',
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX sindrome_medicamento_unico
  ON public.sindrome_medicamento (sindrome_normalizada, medicamento_nome, ambiente, linha);
CREATE INDEX sindrome_medicamento_busca
  ON public.sindrome_medicamento (sindrome_normalizada, ambiente, prioridade);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sindrome_medicamento TO authenticated;
GRANT ALL ON public.sindrome_medicamento TO service_role;

ALTER TABLE public.sindrome_medicamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura autenticada de vinculos sindrome-medicamento"
  ON public.sindrome_medicamento FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins gerenciam vinculos sindrome-medicamento"
  ON public.sindrome_medicamento FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER patologia_medicamento_updated
  BEFORE UPDATE ON public.patologia_medicamento
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE TRIGGER sindrome_medicamento_updated
  BEFORE UPDATE ON public.sindrome_medicamento
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();