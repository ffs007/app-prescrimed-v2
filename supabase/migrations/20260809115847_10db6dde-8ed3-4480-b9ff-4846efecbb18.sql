CREATE TABLE IF NOT EXISTS public.base_referencias_clinicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  codigo_fonte text NOT NULL,
  orgao_emissor text,
  titulo text NOT NULL,
  tipo_documento text,
  ano_publicacao integer,
  ano_atualizacao integer,
  url text,
  doi text,
  vigente boolean DEFAULT true,
  verificacao_pendente boolean DEFAULT false,
  confiabilidade smallint DEFAULT 2,
  escopo text,
  observacao text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.base_referencias_clinicas TO authenticated;
GRANT ALL ON public.base_referencias_clinicas TO service_role;

ALTER TABLE public.base_referencias_clinicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referências vigentes são legíveis por usuários autenticados"
ON public.base_referencias_clinicas
FOR SELECT
TO authenticated
USING (vigente = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins gerenciam referências clínicas"
ON public.base_referencias_clinicas
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_ref_clin_lote_codigo
ON public.base_referencias_clinicas (lote_id, codigo_fonte);

CREATE TRIGGER trg_ref_clin_updated
BEFORE UPDATE ON public.base_referencias_clinicas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();