
CREATE TABLE public.base_beta_pacote_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bloco_slug text NOT NULL,
  bloco_nome text NOT NULL,
  principio_ativo text NOT NULL,
  principio_ativo_normalizado text,
  obrigatoriedade text NOT NULL CHECK (obrigatoriedade IN ('obrigatorio','desejavel')),
  alto_risco boolean NOT NULL DEFAULT false,
  observacao text,
  ordem int NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.base_beta_pacote_itens TO authenticated;
GRANT ALL ON public.base_beta_pacote_itens TO service_role;

ALTER TABLE public.base_beta_pacote_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beta_pacote_read_auth" ON public.base_beta_pacote_itens
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "beta_pacote_admin_write" ON public.base_beta_pacote_itens
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.beta_pacote_set_normalized()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.principio_ativo_normalizado := public.iv_normalize_text(NEW.principio_ativo);
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_beta_pacote_normalized
  BEFORE INSERT OR UPDATE ON public.base_beta_pacote_itens
  FOR EACH ROW EXECUTE FUNCTION public.beta_pacote_set_normalized();

CREATE INDEX idx_beta_pacote_norm ON public.base_beta_pacote_itens(principio_ativo_normalizado);
CREATE INDEX idx_beta_pacote_bloco ON public.base_beta_pacote_itens(bloco_slug);
