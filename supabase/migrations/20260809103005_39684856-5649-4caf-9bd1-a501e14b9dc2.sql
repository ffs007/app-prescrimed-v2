CREATE TABLE public.stg_patologia_exames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text,
  linha_origem text,
  nome_patologia text,
  subtipo text,
  nome_exame text,
  finalidade text,
  obrigatoriedade text,
  contextos text,
  momento_solicitation text,
  idade_min_anos text,
  idade_max_anos text,
  sexo_alvo text,
  aplica_gestante text,
  justificativa_padrao text,
  interpretacao_esperada text,
  criterio_positividade text,
  conduta_se_alterado text,
  nivel_evidencia text,
  forca_recomendacao text,
  repetir_em_horas text,
  nao_solicitar_se text,
  fonte_id text,
  trecho_citado text,
  conflito text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stg_patologia_exames TO authenticated;
GRANT ALL ON public.stg_patologia_exames TO service_role;

ALTER TABLE public.stg_patologia_exames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam stg_patologia_exames"
ON public.stg_patologia_exames FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_stg_patologia_exames_updated
BEFORE UPDATE ON public.stg_patologia_exames
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_stg_patologia_exames_lote ON public.stg_patologia_exames (lote_id);