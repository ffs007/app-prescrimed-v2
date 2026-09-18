CREATE UNIQUE INDEX IF NOT EXISTS base_sinais_alarme_uk
  ON public.base_sinais_alarme (sistema, descricao_sinal_medico);

CREATE OR REPLACE FUNCTION public.fn_etl_sinais_alarme(p_lote text DEFAULT NULL)
RETURNS TABLE(lidos integer, inseridos integer, atualizados integer, rejeitados integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_lidos int; v_rej int;
BEGIN
  SELECT count(*) INTO v_lidos FROM public.stg_sinais_alarme s
    WHERE (p_lote IS NULL OR s.lote_id = p_lote);
  SELECT count(*) INTO v_rej FROM public.stg_sinais_alarme s
    WHERE (p_lote IS NULL OR s.lote_id = p_lote)
      AND (public.etl_txt(s.sistema) IS NULL OR public.etl_txt(s.descricao_sinal_medico) IS NULL);

  RETURN QUERY
  WITH src AS (
    SELECT DISTINCT ON (public.etl_txt(s.sistema), public.etl_txt(s.descricao_sinal_medico)) s.*
    FROM public.stg_sinais_alarme s
    WHERE (p_lote IS NULL OR s.lote_id = p_lote)
      AND public.etl_txt(s.sistema) IS NOT NULL
      AND public.etl_txt(s.descricao_sinal_medico) IS NOT NULL
    ORDER BY public.etl_txt(s.sistema), public.etl_txt(s.descricao_sinal_medico), s.importado_em NULLS LAST, s.id
  ), ins AS (
    INSERT INTO public.base_sinais_alarme AS b (
      lote_id, sistema, descricao_sinal_medico, descricao_sinal_paciente,
      gravidade, conduta, tempo_maximo_acao_horas, fonte_id, trecho_citado
    )
    SELECT COALESCE(p_lote, s.lote_id),
      public.etl_txt(s.sistema),
      public.etl_txt(s.descricao_sinal_medico),
      public.etl_txt(s.descricao_sinal_paciente),
      public.etl_txt(s.gravidade),
      public.etl_txt(s.conduta),
      public.etl_int(s.tempo_maximo_acao_horas),
      public.etl_fonte_uuid(s.fonte_id),
      public.etl_txt(s.trecho_citado)
    FROM src s
    ON CONFLICT (sistema, descricao_sinal_medico) DO UPDATE SET
      descricao_sinal_paciente = COALESCE(EXCLUDED.descricao_sinal_paciente, b.descricao_sinal_paciente),
      gravidade = COALESCE(EXCLUDED.gravidade, b.gravidade),
      conduta = COALESCE(EXCLUDED.conduta, b.conduta),
      tempo_maximo_acao_horas = COALESCE(EXCLUDED.tempo_maximo_acao_horas, b.tempo_maximo_acao_horas),
      fonte_id = COALESCE(EXCLUDED.fonte_id, b.fonte_id),
      trecho_citado = COALESCE(EXCLUDED.trecho_citado, b.trecho_citado),
      updated_at = now()
    RETURNING (xmax = 0) AS foi_insert
  )
  SELECT v_lidos,
         COALESCE(count(*) FILTER (WHERE foi_insert),0)::int,
         COALESCE(count(*) FILTER (WHERE NOT foi_insert),0)::int,
         v_rej
  FROM ins;
END; $$;

REVOKE ALL ON FUNCTION public.fn_etl_sinais_alarme(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_etl_sinais_alarme(text) TO authenticated, service_role;

ALTER TABLE public.base_medicamentos_geral
  ADD COLUMN IF NOT EXISTS lasa_confundido_com TEXT;