REVOKE ALL ON FUNCTION public.fn_etl_protocolos(text) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.fn_etl_lista_jsonb(text, text) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_etl_protocolos(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_etl_lista_jsonb(text, text) TO service_role;

DO $$
DECLARE r RECORD;
BEGIN
  SELECT * INTO r FROM public.fn_etl_protocolos('medflow_ps_v1');
  RAISE NOTICE 'inseridos=% atualizados=% rejeitados=%', r.inseridos, r.atualizados, r.rejeitados;
END $$;