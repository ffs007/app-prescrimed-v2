
CREATE TABLE public.hardening_beta_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  secao TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  criticidade TEXT NOT NULL DEFAULT 'media',
  ordem INTEGER NOT NULL DEFAULT 0,
  responsavel TEXT,
  observacao TEXT,
  evidencia_url TEXT,
  atualizado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hardening_beta_itens TO authenticated;
GRANT ALL ON public.hardening_beta_itens TO service_role;

ALTER TABLE public.hardening_beta_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view hardening itens" ON public.hardening_beta_itens
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert hardening itens" ON public.hardening_beta_itens
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update hardening itens" ON public.hardening_beta_itens
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete hardening itens" ON public.hardening_beta_itens
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER hardening_beta_set_updated
  BEFORE UPDATE ON public.hardening_beta_itens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_hardening_beta_secao ON public.hardening_beta_itens(secao, ordem);
