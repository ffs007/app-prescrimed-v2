CREATE TABLE IF NOT EXISTS public.base_patologias_ref (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  nome_patologia text NOT NULL,
  nome_normalizado text NOT NULL,
  sinonimos text,
  cid10 text,
  cid11 text,
  categoria_clinica text,
  is_emergencia boolean DEFAULT false,
  patologia_pai uuid REFERENCES public.base_patologias_ref(id),
  subtipo text,
  contexto_predominante text,
  fonte_id uuid REFERENCES public.base_referencias_clinicas(id),
  trecho_citado text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.base_patologias_ref TO authenticated;
GRANT ALL ON public.base_patologias_ref TO service_role;

ALTER TABLE public.base_patologias_ref ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'base_patologias_ref' AND policyname = 'Patologias de referência legíveis por usuários autenticados'
  ) THEN
    CREATE POLICY "Patologias de referência legíveis por usuários autenticados"
    ON public.base_patologias_ref FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'base_patologias_ref' AND policyname = 'Apenas admins gerenciam patologias de referência'
  ) THEN
    CREATE POLICY "Apenas admins gerenciam patologias de referência"
    ON public.base_patologias_ref FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pat_ref_nome_norm
ON public.base_patologias_ref (nome_normalizado);

CREATE INDEX IF NOT EXISTS idx_pat_ref_nome_trgm
ON public.base_patologias_ref USING gin (nome_normalizado gin_trgm_ops);

CREATE TABLE IF NOT EXISTS public.base_exames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  nome_exame text NOT NULL,
  nome_normalizado text NOT NULL,
  sigla text,
  sinonimos text,
  tipo_exame text,
  categoria text,
  loinc text,
  tuss text,
  sigtap text,
  amostra_metodo text,
  preparo_paciente text,
  jejum_horas integer,
  tempo_resultado_horas integer,
  disponivel_sus boolean DEFAULT true,
  observacoes text,
  fonte_id uuid REFERENCES public.base_referencias_clinicas(id),
  trecho_citado text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.base_exames TO authenticated;
GRANT ALL ON public.base_exames TO service_role;

ALTER TABLE public.base_exames ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'base_exames' AND policyname = 'Exames legíveis por usuários autenticados'
  ) THEN
    CREATE POLICY "Exames legíveis por usuários autenticados"
    ON public.base_exames FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'base_exames' AND policyname = 'Apenas admins gerenciam exames'
  ) THEN
    CREATE POLICY "Apenas admins gerenciam exames"
    ON public.base_exames FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_exames_nome_norm
ON public.base_exames (nome_normalizado);

CREATE INDEX IF NOT EXISTS idx_exames_nome_trgm
ON public.base_exames USING gin (nome_normalizado gin_trgm_ops);

CREATE TABLE IF NOT EXISTS public.base_patologia_exames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  patologia_id uuid REFERENCES public.base_patologias_ref(id),
  exame_id uuid REFERENCES public.base_exames(id),
  nome_patologia text,
  subtipo text,
  nome_exame text,
  finalidade text,
  obrigatoriedade text,
  contextos text,
  momento_solicitacao text,
  idade_min_anos integer,
  idade_max_anos integer,
  sexo_alvo text,
  aplica_gestante text,
  justificativa_padrao text,
  interpretacao_esperada text,
  criterio_positividade text,
  conduta_se_alterado text,
  nivel_evidencia text,
  forca_recomendacao text,
  repetir_em_horas integer,
  nao_solicitar_se text,
  fonte_id uuid REFERENCES public.base_referencias_clinicas(id),
  trecho_citado text,
  conflito boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.base_patologia_exames TO authenticated;
GRANT ALL ON public.base_patologia_exames TO service_role;

ALTER TABLE public.base_patologia_exames ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'base_patologia_exames' AND policyname = 'Vínculos patologia-exame legíveis por usuários autenticados'
  ) THEN
    CREATE POLICY "Vínculos patologia-exame legíveis por usuários autenticados"
    ON public.base_patologia_exames FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'base_patologia_exames' AND policyname = 'Apenas admins gerenciam vínculos patologia-exame'
  ) THEN
    CREATE POLICY "Apenas admins gerenciam vínculos patologia-exame"
    ON public.base_patologia_exames FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_pat_exames_updated ON public.base_patologia_exames;
CREATE TRIGGER trg_pat_exames_updated
BEFORE UPDATE ON public.base_patologia_exames
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();