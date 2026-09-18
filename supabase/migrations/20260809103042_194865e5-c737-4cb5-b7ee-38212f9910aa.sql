CREATE TABLE public.stg_rastreamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text,
  linha_origem text,
  nome_rastreamento text,
  patologia_alvo text,
  exame_metodo text,
  populacao_alvo text,
  sexo_alvo text,
  idade_inicio text,
  idade_fim text,
  intervalo_meses text,
  condicao_de_risco text,
  forca_recomendacao text,
  nivel_evidencia text,
  orgao_emissor text,
  incorporado_sus text,
  divergencia_internacional text,
  acao_se_positivo text,
  fonte_id text,
  trecho_citado text,
  conflito text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stg_rastreamentos TO authenticated;
GRANT ALL ON public.stg_rastreamentos TO service_role;

ALTER TABLE public.stg_rastreamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam stg_rastreamentos"
ON public.stg_rastreamentos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_stg_rastreamentos_updated
BEFORE UPDATE ON public.stg_rastreamentos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_stg_rastreamentos_lote ON public.stg_rastreamentos (lote_id);

-- Helper imutável: conta campos vazios/NAO_NA_FONTE em uma linha serializada em jsonb
CREATE OR REPLACE FUNCTION public.stg_conta_vazios(row_data jsonb)
RETURNS TABLE (vazios bigint, total bigint)
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT
    count(*) FILTER (WHERE v.value IS NULL OR btrim(v.value) = '' OR btrim(v.value) = 'NAO_NA_FONTE'),
    count(*)
  FROM jsonb_each_text(row_data - 'id' - 'created_at' - 'updated_at') AS v(key, value);
$$;

CREATE VIEW public.vw_qualidade_base_clinica
WITH (security_invoker = true) AS
WITH base AS (
  SELECT 'stg_patologias'::text AS tabela, lote_id, linha_origem, categoria_clinica,
         to_jsonb(t) AS row_data
  FROM public.stg_patologias t
  UNION ALL
  SELECT 'stg_exames', lote_id, linha_origem, NULL::text, to_jsonb(t)
  FROM public.stg_exames t
  UNION ALL
  SELECT 'stg_patologia_exames', lote_id, linha_origem, NULL::text, to_jsonb(t)
  FROM public.stg_patologia_exames t
  UNION ALL
  SELECT 'stg_rastreamentos', lote_id, linha_origem, NULL::text, to_jsonb(t)
  FROM public.stg_rastreamentos t
),
contagens AS (
  SELECT b.tabela, b.lote_id, b.linha_origem, b.categoria_clinica, c.vazios, c.total
  FROM base b, LATERAL public.stg_conta_vazios(b.row_data) c
),
duplicadas AS (
  SELECT tabela, lote_id, sum(qtd) AS linhas_conflito
  FROM (
    SELECT tabela, lote_id, linha_origem, count(*) AS qtd
    FROM base
    GROUP BY 1, 2, 3
    HAVING count(*) > 1
  ) d
  GROUP BY 1, 2
),
categorias AS (
  SELECT tabela, lote_id, jsonb_object_agg(categoria_clinica, qtd) AS categorias
  FROM (
    SELECT tabela, lote_id, coalesce(categoria_clinica, 'SEM_CATEGORIA') AS categoria_clinica, count(*) AS qtd
    FROM base
    WHERE categoria_clinica IS NOT NULL
    GROUP BY 1, 2, 3
  ) c
  GROUP BY 1, 2
)
SELECT
  ct.tabela,
  ct.lote_id,
  count(*)::bigint AS total_registros,
  sum(ct.vazios)::bigint AS campos_vazios,
  sum(ct.total)::bigint AS campos_total,
  CASE WHEN sum(ct.total) > 0
       THEN round((sum(ct.vazios)::numeric * 100) / sum(ct.total), 2)
       ELSE 0 END AS pct_campos_vazios,
  coalesce(d.linhas_conflito, 0)::bigint AS linhas_conflito,
  cat.categorias
FROM contagens ct
LEFT JOIN duplicadas d ON d.tabela = ct.tabela AND d.lote_id IS NOT DISTINCT FROM ct.lote_id
LEFT JOIN categorias cat ON cat.tabela = ct.tabela AND cat.lote_id IS NOT DISTINCT FROM ct.lote_id
GROUP BY ct.tabela, ct.lote_id, d.linhas_conflito, cat.categorias;

GRANT SELECT ON public.vw_qualidade_base_clinica TO authenticated;
GRANT SELECT ON public.vw_qualidade_base_clinica TO service_role;