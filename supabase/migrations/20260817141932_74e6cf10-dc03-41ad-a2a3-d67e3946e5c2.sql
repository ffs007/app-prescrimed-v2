-- Normaliza subtipo vazio/NAO_NA_FONTE para evitar NULLs distintos no índice único
CREATE OR REPLACE FUNCTION public.promover_stg_patologia_exames(_lote_id text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE n integer;
BEGIN
  INSERT INTO public.base_patologia_exames
    (lote_id, nome_patologia, subtipo, nome_exame, finalidade, obrigatoriedade, contextos,
     momento_solicitation, idade_min_anos, idade_max_anos, sexo_alvo, aplica_gestante,
     justificativa_padrao, interpretacao_esperada, criterio_positividade, conduta_se_alterado,
     nivel_evidencia, forca_recomendacao, repetir_em_horas, nao_solicitar_se, fonte_id, trecho_citado,
     linha_recomendacao, status)
  SELECT DISTINCT ON (btrim(s.nome_patologia), btrim(s.nome_exame),
                      COALESCE(NULLIF(NULLIF(btrim(s.subtipo),''),'NAO_NA_FONTE'),'-'))
    s.lote_id, btrim(s.nome_patologia),
    COALESCE(NULLIF(NULLIF(btrim(s.subtipo),''),'NAO_NA_FONTE'),'-'),
    btrim(s.nome_exame), s.finalidade, s.obrigatoriedade, s.contextos,
    COALESCE(NULLIF(btrim(s.momento_solicitation),''), s.momento_solicitacao),
    s.idade_min_anos, s.idade_max_anos, s.sexo_alvo, s.aplica_gestante,
    s.justificativa_padrao, s.interpretacao_esperada, s.criterio_positividade, s.conduta_se_alterado,
    s.nivel_evidencia, s.forca_recomendacao, s.repetir_em_horas, s.nao_solicitar_se, s.fonte_id,
    s.trecho_citado, s.linha_recomendacao, 'ativo'
  FROM public.stg_patologia_exames s
  WHERE s.lote_id = _lote_id AND s.nome_patologia IS NOT NULL AND s.nome_exame IS NOT NULL
    AND btrim(s.nome_patologia) <> '' AND btrim(s.nome_exame) <> ''
    AND NOT EXISTS (
      SELECT 1 FROM public.curadoria_decisoes d
      WHERE d.lote_id = _lote_id AND d.tipo = 'conflito'
        AND d.decisao = 'descartar' AND d.chave = s.id::text
    )
  ORDER BY btrim(s.nome_patologia), btrim(s.nome_exame),
           COALESCE(NULLIF(NULLIF(btrim(s.subtipo),''),'NAO_NA_FONTE'),'-'),
           s.updated_at DESC NULLS LAST
  ON CONFLICT (nome_patologia, nome_exame, subtipo) DO UPDATE SET
    finalidade = EXCLUDED.finalidade, obrigatoriedade = EXCLUDED.obrigatoriedade,
    contextos = EXCLUDED.contextos, momento_solicitation = EXCLUDED.momento_solicitation,
    idade_min_anos = EXCLUDED.idade_min_anos, idade_max_anos = EXCLUDED.idade_max_anos,
    sexo_alvo = EXCLUDED.sexo_alvo, aplica_gestante = EXCLUDED.aplica_gestante,
    justificativa_padrao = EXCLUDED.justificativa_padrao,
    interpretacao_esperada = EXCLUDED.interpretacao_esperada,
    criterio_positividade = EXCLUDED.criterio_positividade,
    conduta_se_alterado = EXCLUDED.conduta_se_alterado,
    nivel_evidencia = EXCLUDED.nivel_evidencia, forca_recomendacao = EXCLUDED.forca_recomendacao,
    repetir_em_horas = EXCLUDED.repetir_em_horas, nao_solicitar_se = EXCLUDED.nao_solicitar_se,
    fonte_id = EXCLUDED.fonte_id, trecho_citado = EXCLUDED.trecho_citado,
    linha_recomendacao = EXCLUDED.linha_recomendacao,
    lote_id = EXCLUDED.lote_id, updated_at = now();
  GET DIAGNOSTICS n = ROW_COUNT;

  UPDATE public.stg_patologia_exames SET processado = true
  WHERE lote_id = _lote_id AND nome_patologia IS NOT NULL AND nome_exame IS NOT NULL;

  RETURN n;
END $function$;

REVOKE ALL ON FUNCTION public.promover_stg_patologia_exames(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promover_stg_patologia_exames(text) TO authenticated, service_role;

-- Executa a promoção dos dois lotes
SELECT public.promover_stg_patologia_exames('endocrino_metabolico_v1');
SELECT public.promover_stg_patologia_exames('medflow_ps_v1');