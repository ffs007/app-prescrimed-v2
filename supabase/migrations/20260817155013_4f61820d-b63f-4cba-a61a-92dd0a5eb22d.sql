DO $$
DECLARE r record;
BEGIN
  PERFORM public.promover_stg_patologias('negligenciadas_v1');
  PERFORM public.promover_stg_exames('negligenciadas_v1');
  PERFORM public.promover_stg_patologia_exames('negligenciadas_v1');
  PERFORM public.fn_etl_sinais_alarme('negligenciadas_v1');
END $$;