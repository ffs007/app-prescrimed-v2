CREATE TABLE public.patologia_personalizacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  patologia_key TEXT NOT NULL,
  patologia_nome TEXT NOT NULL,
  especialidade TEXT,
  favorito BOOLEAN NOT NULL DEFAULT false,
  anamnese JSONB NOT NULL DEFAULT '[]'::jsonb,
  exames JSONB NOT NULL DEFAULT '[]'::jsonb,
  condutas JSONB NOT NULL DEFAULT '[]'::jsonb,
  prescricoes_modelo JSONB NOT NULL DEFAULT '[]'::jsonb,
  recursos JSONB NOT NULL DEFAULT '[]'::jsonb,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, patologia_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patologia_personalizacao TO authenticated;
GRANT ALL ON public.patologia_personalizacao TO service_role;

ALTER TABLE public.patologia_personalizacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own pathology customization"
ON public.patologia_personalizacao FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.set_updated_at_patologia_personalizacao()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_patologia_personalizacao_updated_at
BEFORE UPDATE ON public.patologia_personalizacao
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_patologia_personalizacao();