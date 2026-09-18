CREATE OR REPLACE VIEW public.vw_dashboard_indicadores
WITH (security_invoker = true) AS
SELECT
  iq.codigo_indicador,
  iq.nome,
  iq.tipo,
  iq.meta_pct,
  iq.periodicidade,
  p.nome AS protocolo_nome,
  p.codigo_protocolo
FROM public.indicadores_qualidade_ps iq
LEFT JOIN public.protocolos_ps p ON p.id = iq.protocolo_id::uuid
ORDER BY iq.tipo, iq.codigo_indicador;

GRANT SELECT ON public.vw_dashboard_indicadores TO authenticated;
GRANT SELECT ON public.vw_dashboard_indicadores TO service_role;