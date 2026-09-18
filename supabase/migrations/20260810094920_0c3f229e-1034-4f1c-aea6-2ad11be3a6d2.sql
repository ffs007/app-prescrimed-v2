CREATE OR REPLACE FUNCTION public.validar_vinculos_ps(p_lote text)
RETURNS TABLE(total_vinculos integer, sem_conduta integer, sem_fonte integer, negativos integer)
LANGUAGE plpgsql AS $fn$
BEGIN
  RETURN QUERY
  SELECT
    count(*)::integer AS total_vinculos,
    count(*) FILTER (WHERE s.conduta_se_alterado IS NULL OR s.conduta_se_alterado = '' OR s.conduta_se_alterado = 'NAO_NA_FONTE')::integer AS sem_conduta,
    count(*) FILTER (WHERE s.fonte_id IS NULL OR s.fonte_id = '')::integer AS sem_fonte,
    count(*) FILTER (WHERE s.obrigatoriedade = 'nao_recomendado')::integer AS negativos
  FROM public.stg_patologia_exames s
  WHERE s.lote_id = p_lote;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.validar_patologias_ps(p_lote text)
RETURNS TABLE(total_patologias integer, sem_vinculo integer)
LANGUAGE plpgsql AS $fn$
BEGIN
  RETURN QUERY
  SELECT
    count(*)::integer AS total_patologias,
    count(*) FILTER (WHERE NOT EXISTS (
      SELECT 1 FROM public.stg_patologia_exames pe WHERE pe.nome_patologia = p.nome_patologia
    ))::integer AS sem_vinculo
  FROM public.stg_patologias p
  WHERE p.lote_id = p_lote;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.validar_exames_ps(p_lote text)
RETURNS TABLE(total_exames integer, sem_vinculo integer)
LANGUAGE plpgsql AS $fn$
BEGIN
  RETURN QUERY
  SELECT
    count(*)::integer AS total_exames,
    count(*) FILTER (WHERE NOT EXISTS (
      SELECT 1 FROM public.stg_patologia_exames pe WHERE pe.nome_exame = e.nome_exame
    ))::integer AS sem_vinculo
  FROM public.stg_exames e
  WHERE e.lote_id = p_lote;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.validar_vinculos_ps(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validar_vinculos_ps(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.validar_patologias_ps(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validar_patologias_ps(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.validar_exames_ps(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validar_exames_ps(text) TO service_role;