CREATE TABLE IF NOT EXISTS public.stg_med_equivalencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  linha_origem text,
  principio_ativo text NOT NULL,
  equivalente text NOT NULL,
  fator text,
  tipo_equivalencia text,
  fonte_id text,
  trecho_citado text,
  conflito boolean NOT NULL DEFAULT false,
  processado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stg_med_equivalencia TO authenticated;
GRANT ALL ON public.stg_med_equivalencia TO service_role;

ALTER TABLE public.stg_med_equivalencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read equivalencias"
ON public.stg_med_equivalencia FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage equivalencias"
ON public.stg_med_equivalencia FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.set_updated_at_generic()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_stg_med_equivalencia_updated_at
BEFORE UPDATE ON public.stg_med_equivalencia
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE OR REPLACE VIEW public.vw_med_total_por_classe
WITH (security_invoker = true) AS
SELECT classe_terapeutica,
       count(*) AS total_farmacos,
       count(*) FILTER (WHERE alto_risco_ismp = 'true') AS alto_risco
FROM public.stg_med_principio
WHERE lote_id = 'medflow_ps_v1'
GROUP BY classe_terapeutica
ORDER BY total_farmacos DESC;

CREATE OR REPLACE VIEW public.vw_med_sem_dose
WITH (security_invoker = true) AS
SELECT p.principio_ativo, p.classe_terapeutica
FROM public.stg_med_principio p
WHERE NOT EXISTS (
  SELECT 1 FROM public.stg_med_dose d WHERE d.principio_ativo = p.principio_ativo
)
ORDER BY p.principio_ativo;

CREATE OR REPLACE VIEW public.vw_med_sem_iv
WITH (security_invoker = true) AS
SELECT p.principio_ativo, p.classe_terapeutica
FROM public.stg_med_principio p
WHERE NOT EXISTS (
  SELECT 1 FROM public.stg_med_iv iv WHERE iv.principio_ativo = p.principio_ativo
)
ORDER BY p.principio_ativo;

CREATE OR REPLACE VIEW public.vw_med_interacoes_criticas
WITH (security_invoker = true) AS
SELECT i.principio_ativo_1, i.principio_ativo_2, i.mecanismo, i.efeito, i.gravidade, i.conduta
FROM public.stg_med_interacao i
WHERE i.gravidade IN ('contraindicada','critica')
ORDER BY i.gravidade, i.principio_ativo_1;