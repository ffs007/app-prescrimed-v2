-- 1) Remove anon SELECT on stg_med_monitoramento
DROP POLICY IF EXISTS "Anon pode ler registros de monitoramento" ON public.stg_med_monitoramento;
REVOKE ALL ON public.stg_med_monitoramento FROM anon;

-- 2) Lock down SECURITY DEFINER ETL functions: no anon execute, admin-only in-function check
REVOKE ALL ON FUNCTION public.fn_etl_promover_etapa(text, text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_etl_promover_tudo(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_etl_promover_etapa(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_etl_promover_tudo(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.fn_etl_assert_admin()
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado: requer perfil de administrador';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.fn_etl_assert_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_etl_assert_admin() TO authenticated;

-- 3) Public token lookup stays anon-callable but validates input format
CREATE OR REPLACE FUNCTION public.get_resultado_escore_trauma(_token text)
RETURNS TABLE (
  escore text,
  pontuacao numeric,
  estrato text,
  rotulo text,
  entrada jsonb,
  detalhes jsonb,
  observacao text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _token IS NULL OR length(_token) < 16 OR length(_token) > 128 THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT r.escore, r.pontuacao, r.estrato, r.rotulo, r.entrada, r.detalhes, r.observacao, r.created_at
  FROM public.resultados_escores_trauma r
  WHERE r.share_token = _token
  LIMIT 1;
END;
$$;