ALTER TABLE public.stg_patologia_exames ADD COLUMN IF NOT EXISTS linha_recomendacao text;
ALTER TABLE public.base_patologia_exames ADD COLUMN IF NOT EXISTS linha_recomendacao text;
CREATE INDEX IF NOT EXISTS idx_stg_pat_exames_patologia ON public.stg_patologia_exames (nome_patologia);
CREATE INDEX IF NOT EXISTS idx_base_pat_exames_patologia ON public.base_patologia_exames (nome_patologia);