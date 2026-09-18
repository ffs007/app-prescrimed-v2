CREATE TABLE IF NOT EXISTS public.stg_med_monitoramento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  linha_origem text NOT NULL,
  principio_ativo text NOT NULL,
  nome_exame text NOT NULL,
  finalidade_monitoramento text,
  momento text,
  periodicidade text,
  valor_alvo text,
  valor_toxico text,
  conduta_se_alterado text,
  obrigatorio boolean DEFAULT false,
  fonte_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(lote_id, linha_origem)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stg_med_monitoramento TO authenticated;
GRANT ALL ON public.stg_med_monitoramento TO service_role;
GRANT SELECT ON public.stg_med_monitoramento TO anon;

ALTER TABLE public.stg_med_monitoramento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar stg_med_monitoramento"
ON public.stg_med_monitoramento
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários autenticados leem registros de monitoramento"
ON public.stg_med_monitoramento
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anon pode ler registros de monitoramento"
ON public.stg_med_monitoramento
FOR SELECT
TO anon
USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_stg_med_monitoramento_updated_at
BEFORE UPDATE ON public.stg_med_monitoramento
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();