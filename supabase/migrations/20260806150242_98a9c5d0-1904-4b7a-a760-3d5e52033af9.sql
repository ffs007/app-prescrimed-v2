GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon, service_role;
GRANT SELECT, INSERT ON public.lancamento_termos_aceites TO authenticated;
GRANT ALL ON public.lancamento_termos_aceites TO service_role;