CREATE TABLE public.stg_exames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text,
  linha_origem text,
  nome_exame text,
  sigla text,
  sinonimos text,
  tipo_exame text,
  categoria text,
  loinc text,
  tuss text,
  sigtap text,
  amostra_metodo text,
  preparo_paciente text,
  jejum_horas text,
  tempo_resultado_horas text,
  disponivel_sus text,
  observacoes text,
  fonte_id text,
  trecho_citado text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stg_exames TO authenticated;
GRANT ALL ON public.stg_exames TO service_role;

ALTER TABLE public.stg_exames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam stg_exames"
ON public.stg_exames FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_stg_exames_updated
BEFORE UPDATE ON public.stg_exames
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_stg_exames_lote ON public.stg_exames (lote_id);