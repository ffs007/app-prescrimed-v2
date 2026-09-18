DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'stg_patologias','stg_exames','stg_patologia_exames','stg_sinais_alarme',
    'base_patologias_clinicas','base_patologias_ref','base_exames_clinicos',
    'base_patologia_exames','base_sinais_alarme','base_referencias_clinicas',
    'etl_promocao_log'
  ] LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, public', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND (p.proname LIKE 'fn\_etl%' OR p.proname LIKE 'promover\_stg%' OR p.proname='aprovar_lote')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM public, anon, authenticated', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
  END LOOP;
END $$;