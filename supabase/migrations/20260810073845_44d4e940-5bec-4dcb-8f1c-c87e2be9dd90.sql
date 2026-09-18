-- 1. Restrições clínicas das doses
CREATE TABLE IF NOT EXISTS public.stg_med_restricoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  linha_origem text,
  principio_ativo text NOT NULL,
  via text,
  populacao text,
  tipo_restricao text NOT NULL DEFAULT 'cautela', -- contraindicacao | cautela | limite_maximo
  descricao text NOT NULL,
  gravidade text DEFAULT 'moderada',
  limite_maximo_valor numeric,
  limite_maximo_unidade text,
  limite_periodo text,
  conduta text,
  fonte_id text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stg_med_restricoes TO authenticated;
GRANT ALL ON public.stg_med_restricoes TO service_role;
ALTER TABLE public.stg_med_restricoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stg_med_restricoes_select_auth" ON public.stg_med_restricoes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "stg_med_restricoes_admin_all" ON public.stg_med_restricoes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_stg_med_restricoes_updated
  BEFORE UPDATE ON public.stg_med_restricoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_stg_med_restricoes_lote_pa
  ON public.stg_med_restricoes (lote_id, principio_ativo);

-- 2. Versionamento em stg_med_dose
ALTER TABLE public.stg_med_dose
  ADD COLUMN IF NOT EXISTS versao integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS revisado_por uuid,
  ADD COLUMN IF NOT EXISTS revisado_em timestamptz,
  ADD COLUMN IF NOT EXISTS status_revisao text NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_stg_med_dose_updated ON public.stg_med_dose;
CREATE TRIGGER trg_stg_med_dose_updated
  BEFORE UPDATE ON public.stg_med_dose
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Histórico de alterações de dose
CREATE TABLE IF NOT EXISTS public.stg_med_dose_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dose_id uuid NOT NULL REFERENCES public.stg_med_dose(id) ON DELETE CASCADE,
  lote_id text NOT NULL,
  versao_anterior integer,
  versao_nova integer,
  alterado_por uuid,
  motivo text,
  dados_anteriores jsonb,
  dados_novos jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.stg_med_dose_historico TO authenticated;
GRANT ALL ON public.stg_med_dose_historico TO service_role;
ALTER TABLE public.stg_med_dose_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stg_med_dose_historico_select_auth" ON public.stg_med_dose_historico
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "stg_med_dose_historico_insert_admin" ON public.stg_med_dose_historico
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_stg_med_dose_historico_dose
  ON public.stg_med_dose_historico (dose_id, created_at DESC);