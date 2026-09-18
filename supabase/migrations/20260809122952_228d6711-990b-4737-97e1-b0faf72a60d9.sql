CREATE TABLE IF NOT EXISTS public.stg_med_principio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  linha_origem text,
  principio_ativo text,
  principio_ativo_en text,
  sinonimos text,
  nomes_comerciais_br text,
  classe_terapeutica text,
  subclasse text,
  mecanismo_acao text,
  codigo_atc text,
  codigo_dcb text,
  na_rename text,
  categoria_clinica text,
  alto_risco_ismp text,
  lasa_confundido_com text,
  fonte_id text,
  trecho_citado text,
  importado_em timestamptz DEFAULT now(),
  processado boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.stg_med_apresentacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  linha_origem text,
  principio_ativo text,
  forma_farmaceutica text,
  via text,
  concentracao_texto text,
  concentracao_valor text,
  concentracao_unidade text,
  volume_ml text,
  concentracao_mg_ml text,
  gotas_por_ml text,
  unidades_por_embalagem text,
  requer_reconstituicao text,
  diluente_reconstituicao text,
  volume_reconstituicao_ml text,
  concentracao_pos_reconstituicao_mg_ml text,
  disponivel_sus text,
  uso_hospitalar text,
  observacoes text,
  fonte_id text,
  trecho_citado text,
  importado_em timestamptz DEFAULT now(),
  processado boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.stg_med_dose (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  linha_origem text,
  principio_ativo text,
  via text,
  indicacao text,
  populacao text,
  dose_tipo text,
  dose_min text,
  dose_max text,
  dose_unidade text,
  dose_pendente_de_fonte text,
  fonte_id text,
  trecho_citado text,
  conflito text,
  importado_em timestamptz DEFAULT now(),
  processado boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.stg_med_populacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  linha_origem text,
  principio_ativo text,
  populacao text,
  condicao text,
  ajuste text,
  nivel_evidencia text,
  forca_recomendacao text,
  fonte_id text,
  trecho_citado text,
  importado_em timestamptz DEFAULT now(),
  processado boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.stg_med_interacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  linha_origem text,
  principio_ativo_1 text,
  principio_ativo_2 text,
  classe_1 text,
  classe_2 text,
  tipo_interacao text,
  mecanismo text,
  efeito text,
  gravidade text,
  momento text,
  evidencia text,
  conduta text,
  alternativa text,
  risco text,
  monitoramento text,
  fonte_id text,
  trecho_citado text,
  conflito text,
  importado_em timestamptz DEFAULT now(),
  processado boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.stg_med_contraindicacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  linha_origem text,
  principio_ativo text,
  tipo text,
  condicao text,
  cid10_relacionado text,
  gravidade text,
  mecanismo text,
  conduta text,
  alternativa text,
  alergia_cruzada_classe text,
  fonte_id text,
  trecho_citado text,
  conflito text,
  importado_em timestamptz DEFAULT now(),
  processado boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.stg_med_iv (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  linha_origem text,
  principio_ativo text,
  diluentes_compativeis text,
  diluentes_incompativeis text,
  concentracao_maxima_mg_ml text,
  concentracao_usual_mg_ml text,
  volume_minimo_ml text,
  tempo_minimo_infusao_min text,
  tempo_usual_infusao_min text,
  velocidade_maxima text,
  bolus_permitido text,
  estabilidade_ambiente_horas text,
  estabilidade_refrigerado_horas text,
  fotoprotecao text,
  requer_filtro text,
  requer_bomba text,
  via_central_obrigatoria text,
  incompatibilidades_y text,
  risco_flebite text,
  risco_extravasamento text,
  conduta_extravasamento text,
  observacao text,
  fonte_id text,
  trecho_citado text,
  importado_em timestamptz DEFAULT now(),
  processado boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.stg_med_regulatorio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  linha_origem text,
  principio_ativo text,
  lista text,
  familia_receituario text,
  antimicrobiano_rdc471 text,
  validade_receita_dias text,
  vias_receita text,
  retencao_via text,
  limite_substancias text,
  observacao text,
  fonte_id text,
  trecho_citado text,
  importado_em timestamptz DEFAULT now(),
  processado boolean DEFAULT false
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'stg_med_principio','stg_med_apresentacao','stg_med_dose','stg_med_populacao',
    'stg_med_interacao','stg_med_contraindicacao','stg_med_iv','stg_med_regulatorio'
  ] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "admin_all_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "admin_all_%s" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(),''admin'')) WITH CHECK (public.has_role(auth.uid(),''admin''))', t, t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_lote ON public.%I (lote_id)', t, t);
  END LOOP;
END $$;