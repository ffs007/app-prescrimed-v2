CREATE TABLE IF NOT EXISTS public.base_medicamentos_dose (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  principio_ativo text NOT NULL,
  via text NOT NULL,
  indicacao text,
  populacao text,
  dose_tipo text,
  dose_min numeric,
  dose_max numeric,
  dose_unidade text,
  frequencia text,
  duracao text,
  intervalo_horas integer,
  dose_maxima_dia numeric,
  dose_maxima_dia_unidade text,
  administrar_com_alimento boolean,
  observacao_dose text,
  dose_pendente_de_fonte boolean DEFAULT false,
  revisao_farmaceutica_obrigatoria boolean DEFAULT false,
  fonte_id uuid REFERENCES public.base_referencias_clinicas(id),
  trecho_citado text,
  conflito boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.base_medicamentos_populacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  principio_ativo text NOT NULL,
  dimensao text NOT NULL,
  estrato text NOT NULL,
  conduta text,
  fator_ajuste numeric,
  dose_ajustada_texto text,
  risco text,
  categoria_risco text,
  alternativa text,
  monitorar text,
  justificativa text,
  fonte_id uuid REFERENCES public.base_referencias_clinicas(id),
  trecho_citado text,
  conflito boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.base_medicamentos_interacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  principio_ativo_a text NOT NULL,
  principio_ativo_b text NOT NULL,
  classe_a text,
  classe_b text,
  tipo_interacao text,
  mecanismo text,
  efeito_clinico text,
  gravidade text,
  inicio_efeito text,
  documentacao text,
  conduta text,
  alternativa text,
  monitorar text,
  tempo_separacao_horas integer,
  fonte_id uuid REFERENCES public.base_referencias_clinicas(id),
  trecho_citado text,
  conflito boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.base_medicamentos_contraindicacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  principio_ativo text NOT NULL,
  tipo text,
  condicao text,
  cid10_relacionado text,
  gravidade text,
  mecanismo text,
  conduta text,
  alternativa text,
  alergia_cruzada_classe text,
  fonte_id uuid REFERENCES public.base_referencias_clinicas(id),
  trecho_citado text,
  conflito boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.base_iv_diluicao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  principio_ativo text NOT NULL,
  diluentes_compativeis text,
  diluentes_incompativeis text,
  concentracao_maxima_mg_ml numeric,
  concentracao_usual_mg_ml numeric,
  volume_minimo_ml numeric,
  tempo_minimo_infusao_min integer,
  tempo_usual_infusao_min integer,
  velocidade_maxima text,
  bolus_permitido boolean DEFAULT false,
  estabilidade_ambiente_horas integer,
  estabilidade_refrigerado_horas integer,
  fotoprotecao boolean DEFAULT false,
  requer_filtro boolean DEFAULT false,
  requer_bomba boolean DEFAULT false,
  via_central_obrigatoria boolean DEFAULT false,
  incompatibilidades_y text,
  risco_flebite text,
  risco_extravasamento text,
  conduta_extravasamento text,
  observacao text,
  fonte_id uuid REFERENCES public.base_referencias_clinicas(id),
  trecho_citado text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.base_medicamentos_regulatorio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  principio_ativo text NOT NULL,
  lista_344 text,
  familia_receituario text,
  antimicrobiano_rdc471 boolean DEFAULT false,
  validade_receita_dias integer,
  vias_receita text,
  retencao_via text,
  limite_substancias_receita integer,
  limite_quantidade text,
  exige_notificacao boolean DEFAULT false,
  numeracao_obrigatoria boolean DEFAULT false,
  observacao_legal text,
  fonte_id uuid REFERENCES public.base_referencias_clinicas(id),
  trecho_citado text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.base_medicamentos_monitoramento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  principio_ativo text NOT NULL,
  nome_exame text,
  finalidade_monitoramento text,
  momento text,
  periodicidade text,
  valor_alvo text,
  valor_toxico text,
  conduta_se_alterado text,
  obrigatorio boolean DEFAULT false,
  fonte_id uuid REFERENCES public.base_referencias_clinicas(id),
  trecho_citado text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.base_medicamentos_alerta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  principio_ativo text NOT NULL,
  tipo_alerta text,
  descricao text,
  gravidade text,
  conduta text,
  fonte_id uuid REFERENCES public.base_referencias_clinicas(id),
  trecho_citado text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.base_medicamentos_equivalencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  principio_ativo text NOT NULL,
  equivalente text NOT NULL,
  fator numeric,
  tipo_equivalencia text,
  fonte_id uuid REFERENCES public.base_referencias_clinicas(id),
  trecho_citado text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'base_medicamentos_dose','base_medicamentos_populacao','base_medicamentos_interacoes',
    'base_medicamentos_contraindicacoes','base_iv_diluicao','base_medicamentos_regulatorio',
    'base_medicamentos_monitoramento','base_medicamentos_alerta','base_medicamentos_equivalencia'
  ] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth_read_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "auth_read_%s" ON public.%I FOR SELECT TO authenticated USING (true)', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "admin_manage_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "admin_manage_%s" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(),''admin'')) WITH CHECK (public.has_role(auth.uid(),''admin''))', t, t);
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_lote ON public.%I (lote_id)', t, t);
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_bmd_pa ON public.base_medicamentos_dose (principio_ativo);
CREATE INDEX IF NOT EXISTS idx_bmpop_pa ON public.base_medicamentos_populacao (principio_ativo);
CREATE INDEX IF NOT EXISTS idx_bmint_pa ON public.base_medicamentos_interacoes (principio_ativo_a, principio_ativo_b);
CREATE INDEX IF NOT EXISTS idx_bmci_pa ON public.base_medicamentos_contraindicacoes (principio_ativo);
CREATE INDEX IF NOT EXISTS idx_bivd_pa ON public.base_iv_diluicao (principio_ativo);
CREATE INDEX IF NOT EXISTS idx_bmreg_pa ON public.base_medicamentos_regulatorio (principio_ativo);
CREATE INDEX IF NOT EXISTS idx_bmmon_pa ON public.base_medicamentos_monitoramento (principio_ativo);
CREATE INDEX IF NOT EXISTS idx_bmal_pa ON public.base_medicamentos_alerta (principio_ativo);
CREATE INDEX IF NOT EXISTS idx_bmeq_pa ON public.base_medicamentos_equivalencia (principio_ativo);