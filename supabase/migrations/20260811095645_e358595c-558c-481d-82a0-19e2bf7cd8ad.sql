-- =========================================================
-- ETL: helpers de limpeza
-- =========================================================
CREATE OR REPLACE FUNCTION public.etl_num(t text)
RETURNS numeric LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT (substring(replace(btrim(coalesce(t,'')), ',', '.') from '-?[0-9]+(?:\.[0-9]+)?'))::numeric
$$;

CREATE OR REPLACE FUNCTION public.etl_int(t text)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT round(public.etl_num(t))::integer
$$;

CREATE OR REPLACE FUNCTION public.etl_bool(t text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN t IS NULL THEN NULL
    WHEN lower(btrim(t)) IN ('sim','s','true','t','1','yes','y','obrigatorio','obrigatório') THEN true
    WHEN lower(btrim(t)) IN ('nao','não','n','false','f','0','no') THEN false
    ELSE NULL
  END
$$;

CREATE OR REPLACE FUNCTION public.etl_txt(t text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT nullif(btrim(regexp_replace(coalesce(t,''), '\s+', ' ', 'g')), '')
$$;

CREATE OR REPLACE FUNCTION public.etl_fonte_uuid(codigo text)
RETURNS uuid LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT r.id FROM public.base_referencias_clinicas r
  WHERE upper(btrim(r.codigo_fonte)) = upper(btrim(coalesce(codigo,'')))
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.etl_arr(t text)
RETURNS text[] LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT array_agg(x) FROM (
       SELECT btrim(u) AS x
       FROM unnest(string_to_array(replace(coalesce(t,''), ';', ','), ',')) AS u
       WHERE btrim(u) <> ''
     ) s),
    '{}'::text[])
$$;

-- =========================================================
-- Log de execuções do ETL
-- =========================================================
CREATE TABLE IF NOT EXISTS public.etl_promocao_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execucao_id uuid NOT NULL DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  etapa text NOT NULL,
  tabela_origem text NOT NULL,
  tabela_destino text NOT NULL,
  lidos integer NOT NULL DEFAULT 0,
  inseridos integer NOT NULL DEFAULT 0,
  atualizados integer NOT NULL DEFAULT 0,
  rejeitados integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'sucesso',
  erro text,
  duracao_ms integer NOT NULL DEFAULT 0,
  executado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.etl_promocao_log TO authenticated;
GRANT ALL ON public.etl_promocao_log TO service_role;
ALTER TABLE public.etl_promocao_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "etl_log_admin_select" ON public.etl_promocao_log;
CREATE POLICY "etl_log_admin_select" ON public.etl_promocao_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "etl_log_admin_all" ON public.etl_promocao_log;
CREATE POLICY "etl_log_admin_all" ON public.etl_promocao_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_etl_log_execucao ON public.etl_promocao_log(execucao_id);
CREATE INDEX IF NOT EXISTS idx_etl_log_created ON public.etl_promocao_log(created_at DESC);

-- =========================================================
-- Deduplicação prévia + chaves únicas nas tabelas base
-- =========================================================
UPDATE public.base_medicamentos_geral
SET principio_ativo_normalizado = public.clin_normalize(principio_ativo)
WHERE principio_ativo_normalizado IS NULL OR btrim(principio_ativo_normalizado) = '';

DELETE FROM public.base_medicamentos_geral a
USING public.base_medicamentos_geral b
WHERE a.principio_ativo_normalizado = b.principio_ativo_normalizado
  AND a.created_at > b.created_at;

DELETE FROM public.base_medicamentos_geral a
USING public.base_medicamentos_geral b
WHERE a.principio_ativo_normalizado = b.principio_ativo_normalizado
  AND a.created_at = b.created_at AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS ux_bmg_principio_norm
  ON public.base_medicamentos_geral (principio_ativo_normalizado);

CREATE UNIQUE INDEX IF NOT EXISTS ux_bmd_dose
  ON public.base_medicamentos_dose
  (lote_id, principio_ativo, via, coalesce(indicacao,''), coalesce(populacao,''), coalesce(dose_tipo,''));

CREATE UNIQUE INDEX IF NOT EXISTS ux_biv_diluicao
  ON public.base_iv_diluicao (lote_id, principio_ativo);

CREATE UNIQUE INDEX IF NOT EXISTS ux_bmi_interacao
  ON public.base_medicamentos_interacoes (lote_id, principio_ativo_a, principio_ativo_b);

CREATE UNIQUE INDEX IF NOT EXISTS ux_bmc_contra
  ON public.base_medicamentos_contraindicacoes
  (lote_id, principio_ativo, coalesce(condicao,''), coalesce(tipo,''));

CREATE UNIQUE INDEX IF NOT EXISTS ux_bmm_monit
  ON public.base_medicamentos_monitoramento
  (lote_id, principio_ativo, coalesce(nome_exame,''));

CREATE UNIQUE INDEX IF NOT EXISTS ux_bme_equiv
  ON public.base_medicamentos_equivalencia (lote_id, principio_ativo, equivalente);

CREATE UNIQUE INDEX IF NOT EXISTS ux_bpr_patologia
  ON public.base_patologias_ref (nome_normalizado);

-- =========================================================
-- View de consistência staging x base
-- =========================================================
CREATE OR REPLACE VIEW public.vw_etl_consistencia
WITH (security_invoker = true) AS
WITH pares AS (
  SELECT 'stg_med_principio'::text AS tabela_origem, 'base_medicamentos_geral'::text AS tabela_destino,
         (SELECT count(*) FROM public.stg_med_principio) AS total_staging,
         (SELECT count(*) FROM public.base_medicamentos_geral) AS total_base
  UNION ALL SELECT 'stg_med_dose','base_medicamentos_dose',
         (SELECT count(*) FROM public.stg_med_dose),(SELECT count(*) FROM public.base_medicamentos_dose)
  UNION ALL SELECT 'stg_med_iv','base_iv_diluicao',
         (SELECT count(*) FROM public.stg_med_iv),(SELECT count(*) FROM public.base_iv_diluicao)
  UNION ALL SELECT 'stg_med_interacao','base_medicamentos_interacoes',
         (SELECT count(*) FROM public.stg_med_interacao),(SELECT count(*) FROM public.base_medicamentos_interacoes)
  UNION ALL SELECT 'stg_med_contraindicacao','base_medicamentos_contraindicacoes',
         (SELECT count(*) FROM public.stg_med_contraindicacao),(SELECT count(*) FROM public.base_medicamentos_contraindicacoes)
  UNION ALL SELECT 'stg_med_monitoramento','base_medicamentos_monitoramento',
         (SELECT count(*) FROM public.stg_med_monitoramento),(SELECT count(*) FROM public.base_medicamentos_monitoramento)
  UNION ALL SELECT 'stg_med_equivalencia','base_medicamentos_equivalencia',
         (SELECT count(*) FROM public.stg_med_equivalencia),(SELECT count(*) FROM public.base_medicamentos_equivalencia)
  UNION ALL SELECT 'stg_med_apresentacao','base_apresentacoes_medicamentos',
         (SELECT count(*) FROM public.stg_med_apresentacao),(SELECT count(*) FROM public.base_apresentacoes_medicamentos)
  UNION ALL SELECT 'stg_med_populacao','base_medicamentos_populacao',
         (SELECT count(*) FROM public.stg_med_populacao),(SELECT count(*) FROM public.base_medicamentos_populacao)
  UNION ALL SELECT 'stg_med_regulatorio','base_medicamentos_regulatorio',
         (SELECT count(*) FROM public.stg_med_regulatorio),(SELECT count(*) FROM public.base_medicamentos_regulatorio)
  UNION ALL SELECT 'stg_patologias','base_patologias_ref',
         (SELECT count(*) FROM public.stg_patologias),(SELECT count(*) FROM public.base_patologias_ref)
  UNION ALL SELECT 'stg_exames','base_exames',
         (SELECT count(*) FROM public.stg_exames),(SELECT count(*) FROM public.base_exames)
  UNION ALL SELECT 'stg_patologia_exames','base_patologia_exames',
         (SELECT count(*) FROM public.stg_patologia_exames),(SELECT count(*) FROM public.base_patologia_exames)
  UNION ALL SELECT 'stg_sinais_alarme','base_sinais_alarme',
         (SELECT count(*) FROM public.stg_sinais_alarme),(SELECT count(*) FROM public.base_sinais_alarme)
  UNION ALL SELECT 'stg_rastreamentos','base_rastreamentos',
         (SELECT count(*) FROM public.stg_rastreamentos),(SELECT count(*) FROM public.base_rastreamentos)
  UNION ALL SELECT 'stg_escores_clinicos','base_escores_clinicos',
         (SELECT count(*) FROM public.stg_escores_clinicos),(SELECT count(*) FROM public.base_escores_clinicos)
  UNION ALL SELECT 'stg_escore_itens','base_escore_itens',
         (SELECT count(*) FROM public.stg_escore_itens),(SELECT count(*) FROM public.base_escore_itens)
  UNION ALL SELECT 'stg_protocolos','base_protocolos_clinicos',
         (SELECT count(*) FROM public.stg_protocolos),(SELECT count(*) FROM public.base_protocolos_clinicos)
)
SELECT
  tabela_origem,
  tabela_destino,
  total_staging,
  total_base,
  total_staging - total_base AS diferenca,
  CASE WHEN total_staging = 0 THEN NULL
       ELSE round((total_base::numeric / total_staging::numeric) * 100, 1) END AS pct_promovido,
  CASE
    WHEN total_staging = 0 AND total_base = 0 THEN 'vazio'
    WHEN total_base = 0 THEN 'nao_promovido'
    WHEN total_base >= total_staging THEN 'ok'
    ELSE 'parcial'
  END AS status
FROM pares;