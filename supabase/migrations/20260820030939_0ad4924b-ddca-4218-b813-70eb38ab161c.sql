REVOKE EXECUTE ON FUNCTION public.fn_etl_promover_tudo(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_etl_sinais_alarme(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_etl_med_apresentacao(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_etl_promover_etapa(text,text,uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_resultado_escore_trauma(text) FROM PUBLIC, anon;