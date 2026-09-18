ALTER TABLE public.indicadores_qualidade_ps
  DROP CONSTRAINT IF EXISTS indicadores_qualidade_ps_codigo_key;

ALTER TABLE public.indicadores_qualidade_ps
  ADD CONSTRAINT indicadores_qualidade_ps_lote_codigo_key UNIQUE (lote_id, codigo_indicador);

ALTER TABLE public.indicadores_qualidade_ps
  ADD COLUMN IF NOT EXISTS etapa_ordem integer,
  ADD COLUMN IF NOT EXISTS etapa_titulo_match text,
  ADD COLUMN IF NOT EXISTS criterio text NOT NULL DEFAULT 'dentro_prazo',
  ADD COLUMN IF NOT EXISTS limite_min integer,
  ADD COLUMN IF NOT EXISTS meta_operador text NOT NULL DEFAULT '>=';

ALTER TABLE public.indicadores_qualidade_ps
  DROP CONSTRAINT IF EXISTS indicadores_qualidade_ps_criterio_check;
ALTER TABLE public.indicadores_qualidade_ps
  ADD CONSTRAINT indicadores_qualidade_ps_criterio_check
  CHECK (criterio IN ('dentro_prazo','limite_min','executado'));

ALTER TABLE public.indicadores_qualidade_ps
  DROP CONSTRAINT IF EXISTS indicadores_qualidade_ps_meta_operador_check;
ALTER TABLE public.indicadores_qualidade_ps
  ADD CONSTRAINT indicadores_qualidade_ps_meta_operador_check
  CHECK (meta_operador IN ('>=','<='));

CREATE OR REPLACE VIEW public.vw_indicadores_ps_mensal
WITH (security_invoker = true) AS
SELECT
  i.id                                   AS indicador_id,
  i.lote_id,
  i.codigo_indicador,
  i.nome,
  i.tipo,
  i.protocolo_id,
  p.codigo_protocolo,
  p.nome                                 AS protocolo_nome,
  i.meta_pct,
  i.meta_operador,
  NULLIF(regexp_replace(coalesce(i.meta_pct,''), '[^0-9.]', '', 'g'), '')::numeric AS meta_valor,
  date_trunc('month', a.timestamp_execucao)::date AS mes,
  count(*)                               AS denominador,
  count(*) FILTER (
    WHERE (i.criterio = 'dentro_prazo' AND a.dentro_prazo IS TRUE)
       OR (i.criterio = 'limite_min' AND i.limite_min IS NOT NULL
           AND a.tempo_realizado_min IS NOT NULL AND a.tempo_realizado_min <= i.limite_min)
       OR (i.criterio = 'executado')
  )                                      AS numerador,
  round(
    100.0 * count(*) FILTER (
      WHERE (i.criterio = 'dentro_prazo' AND a.dentro_prazo IS TRUE)
         OR (i.criterio = 'limite_min' AND i.limite_min IS NOT NULL
             AND a.tempo_realizado_min IS NOT NULL AND a.tempo_realizado_min <= i.limite_min)
         OR (i.criterio = 'executado')
    ) / NULLIF(count(*), 0), 1)          AS percentual
FROM public.indicadores_qualidade_ps i
JOIN public.protocolos_ps p ON p.id::text = i.protocolo_id
JOIN public.audit_protocolo_execucao a
  ON a.protocolo_id = p.id
 AND (i.etapa_ordem IS NULL OR a.etapa_ordem = i.etapa_ordem)
 AND (i.etapa_titulo_match IS NULL OR a.etapa_titulo ILIKE '%' || i.etapa_titulo_match || '%')
WHERE i.ativo
GROUP BY i.id, i.lote_id, i.codigo_indicador, i.nome, i.tipo, i.protocolo_id,
         p.codigo_protocolo, p.nome, i.meta_pct, i.meta_operador, i.criterio,
         date_trunc('month', a.timestamp_execucao);

GRANT SELECT ON public.vw_indicadores_ps_mensal TO authenticated;