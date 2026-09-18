CREATE TABLE public.resultados_escores_trauma (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  escore text NOT NULL,
  pontuacao numeric NOT NULL,
  estrato text NOT NULL,
  rotulo text NOT NULL,
  entrada jsonb NOT NULL DEFAULT '{}'::jsonb,
  detalhes jsonb NOT NULL DEFAULT '[]'::jsonb,
  observacao text,
  share_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resultados_escores_trauma TO authenticated;
GRANT SELECT ON public.resultados_escores_trauma TO anon;
GRANT ALL ON public.resultados_escores_trauma TO service_role;

ALTER TABLE public.resultados_escores_trauma ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their trauma score results"
ON public.resultados_escores_trauma FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read shared trauma score results"
ON public.resultados_escores_trauma FOR SELECT TO anon, authenticated
USING (true);

CREATE TRIGGER trg_resultados_escores_trauma_updated
BEFORE UPDATE ON public.resultados_escores_trauma
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();