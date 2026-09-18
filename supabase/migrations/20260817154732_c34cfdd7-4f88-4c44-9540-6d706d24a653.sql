CREATE OR REPLACE FUNCTION public.promover_stg_exames(_lote_id text)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE n integer;
BEGIN
  INSERT INTO public.base_exames_clinicos
    (lote_id, nome_exame, sigla, sinonimos, tipo_exame, categoria, loinc, tuss, sigtap,
     amostra_metodo, preparo_paciente, jejum_horas, tempo_resultado_horas, disponivel_sus,
     observacoes, fonte_id, trecho_citado)
  SELECT DISTINCT ON (s.nome_exame)
         s.lote_id, s.nome_exame, s.sigla, s.sinonimos, s.tipo_exame, s.categoria, s.loinc, s.tuss, s.sigtap,
         s.amostra_metodo, s.preparo_paciente, s.jejum_horas, s.tempo_resultado_horas, s.disponivel_sus,
         s.observacoes, s.fonte_id, s.trecho_citado
  FROM public.stg_exames s
  WHERE s.lote_id = _lote_id AND s.nome_exame IS NOT NULL
  ORDER BY s.nome_exame, s.id
  ON CONFLICT (nome_exame) DO UPDATE SET
    sigla = EXCLUDED.sigla, sinonimos = EXCLUDED.sinonimos, tipo_exame = EXCLUDED.tipo_exame,
    categoria = EXCLUDED.categoria, loinc = EXCLUDED.loinc, tuss = EXCLUDED.tuss, sigtap = EXCLUDED.sigtap,
    amostra_metodo = EXCLUDED.amostra_metodo, preparo_paciente = EXCLUDED.preparo_paciente,
    jejum_horas = EXCLUDED.jejum_horas, tempo_resultado_horas = EXCLUDED.tempo_resultado_horas,
    disponivel_sus = EXCLUDED.disponivel_sus, observacoes = EXCLUDED.observacoes,
    fonte_id = EXCLUDED.fonte_id, trecho_citado = EXCLUDED.trecho_citado,
    lote_id = EXCLUDED.lote_id, updated_at = now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $function$;

REVOKE EXECUTE ON FUNCTION public.promover_stg_exames(text) FROM anon, authenticated;