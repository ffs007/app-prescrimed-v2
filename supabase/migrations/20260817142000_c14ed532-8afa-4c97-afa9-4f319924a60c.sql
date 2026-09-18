ALTER FUNCTION public.promover_stg_patologia_exames(text) SECURITY INVOKER;
REVOKE ALL ON FUNCTION public.promover_stg_patologia_exames(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promover_stg_patologia_exames(text) TO authenticated, service_role;