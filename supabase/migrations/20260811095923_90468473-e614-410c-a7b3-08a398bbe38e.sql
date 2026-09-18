-- =========================================================
-- ETAPA: medicamentos (princípios)
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_etl_med_principio(p_lote text)
RETURNS TABLE(lidos integer, inseridos integer, atualizados integer, rejeitados integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lidos int; v_rej int;
BEGIN
  SELECT count(*) INTO v_lidos FROM public.stg_med_principio s WHERE s.lote_id = p_lote;
  SELECT count(*) INTO v_rej FROM public.stg_med_principio s
    WHERE s.lote_id = p_lote AND public.etl_txt(s.principio_ativo) IS NULL;

  RETURN QUERY
  WITH src AS (
    SELECT DISTINCT ON (public.clin_normalize(s.principio_ativo)) s.*
    FROM public.stg_med_principio s
    WHERE s.lote_id = p_lote AND public.etl_txt(s.principio_ativo) IS NOT NULL
    ORDER BY public.clin_normalize(s.principio_ativo), s.importado_em NULLS LAST, s.id
  ), ins AS (
    INSERT INTO public.base_medicamentos_geral AS b (
      principio_ativo, principio_ativo_normalizado, nome_normalizado,
      principio_ativo_en, sinonimos, nomes_comerciais_br, classe_terapeutica,
      subclasse, mecanismo_acao, codigo_atc, codigo_dcb, na_rename, alto_risco,
      categoria_clinica, lote_id, fonte_referencia, observacoes, termos_busca, data_atualizacao
    )
    SELECT
      public.etl_txt(s.principio_ativo),
      public.clin_normalize(s.principio_ativo),
      public.clin_normalize(s.principio_ativo),
      public.etl_txt(s.principio_ativo_en),
      public.etl_arr(s.sinonimos),
      public.etl_txt(s.nomes_comerciais_br),
      public.etl_txt(s.classe_terapeutica),
      public.etl_txt(s.subclasse),
      public.etl_txt(s.mecanismo_acao),
      public.etl_txt(s.codigo_atc),
      public.etl_txt(s.codigo_dcb),
      COALESCE(public.etl_bool(s.na_rename), false),
      COALESCE(public.etl_bool(s.alto_risco_ismp), false),
      CASE
        WHEN lower(coalesce(public.etl_txt(s.categoria_clinica),'')) IN (
          SELECT e.enumlabel::text FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'medicamento_categoria_clinica')
        THEN lower(public.etl_txt(s.categoria_clinica))::medicamento_categoria_clinica
        ELSE 'dor_febre'::medicamento_categoria_clinica
      END,
      p_lote,
      public.etl_txt(s.fonte_id),
      public.etl_txt(s.trecho_citado),
      public.etl_arr(s.sinonimos) || ARRAY[public.clin_normalize(s.principio_ativo)],
      CURRENT_DATE
    FROM src s
    ON CONFLICT (principio_ativo_normalizado) DO UPDATE SET
      principio_ativo_en  = COALESCE(EXCLUDED.principio_ativo_en, b.principio_ativo_en),
      nomes_comerciais_br = COALESCE(EXCLUDED.nomes_comerciais_br, b.nomes_comerciais_br),
      classe_terapeutica  = COALESCE(EXCLUDED.classe_terapeutica, b.classe_terapeutica),
      subclasse           = COALESCE(EXCLUDED.subclasse, b.subclasse),
      mecanismo_acao      = COALESCE(EXCLUDED.mecanismo_acao, b.mecanismo_acao),
      codigo_atc          = COALESCE(EXCLUDED.codigo_atc, b.codigo_atc),
      codigo_dcb          = COALESCE(EXCLUDED.codigo_dcb, b.codigo_dcb),
      na_rename           = EXCLUDED.na_rename OR b.na_rename,
      alto_risco          = EXCLUDED.alto_risco OR b.alto_risco,
      sinonimos           = CASE WHEN array_length(EXCLUDED.sinonimos,1) IS NULL THEN b.sinonimos ELSE EXCLUDED.sinonimos END,
      fonte_referencia    = COALESCE(EXCLUDED.fonte_referencia, b.fonte_referencia),
      observacoes         = COALESCE(EXCLUDED.observacoes, b.observacoes),
      updated_at          = now()
    RETURNING (xmax = 0) AS foi_insert
  )
  SELECT v_lidos,
         COALESCE(count(*) FILTER (WHERE foi_insert), 0)::int,
         COALESCE(count(*) FILTER (WHERE NOT foi_insert), 0)::int,
         v_rej
  FROM ins;
END; $$;

-- =========================================================
-- ETAPA: doses
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_etl_med_dose(p_lote text)
RETURNS TABLE(lidos integer, inseridos integer, atualizados integer, rejeitados integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lidos int; v_rej int;
BEGIN
  SELECT count(*) INTO v_lidos FROM public.stg_med_dose s WHERE s.lote_id = p_lote;
  SELECT count(*) INTO v_rej FROM public.stg_med_dose s
    WHERE s.lote_id = p_lote
      AND (public.etl_txt(s.principio_ativo) IS NULL OR public.etl_txt(s.via) IS NULL);

  RETURN QUERY
  WITH src AS (
    SELECT DISTINCT ON (
      public.etl_txt(s.principio_ativo), public.etl_txt(s.via),
      coalesce(public.etl_txt(s.indicacao),''), coalesce(public.etl_txt(s.populacao),''),
      coalesce(public.etl_txt(s.dose_tipo),'')) s.*
    FROM public.stg_med_dose s
    WHERE s.lote_id = p_lote
      AND public.etl_txt(s.principio_ativo) IS NOT NULL
      AND public.etl_txt(s.via) IS NOT NULL
    ORDER BY public.etl_txt(s.principio_ativo), public.etl_txt(s.via),
             coalesce(public.etl_txt(s.indicacao),''), coalesce(public.etl_txt(s.populacao),''),
             coalesce(public.etl_txt(s.dose_tipo),''), s.importado_em NULLS LAST, s.id
  ), ins AS (
    INSERT INTO public.base_medicamentos_dose AS b (
      lote_id, principio_ativo, via, indicacao, populacao, dose_tipo,
      dose_min, dose_max, dose_unidade, dose_pendente_de_fonte,
      fonte_id, trecho_citado, conflito
    )
    SELECT p_lote,
      public.etl_txt(s.principio_ativo), public.etl_txt(s.via),
      public.etl_txt(s.indicacao), public.etl_txt(s.populacao), public.etl_txt(s.dose_tipo),
      public.etl_num(s.dose_min), public.etl_num(s.dose_max), public.etl_txt(s.dose_unidade),
      COALESCE(public.etl_bool(s.dose_pendente_de_fonte), false),
      public.etl_fonte_uuid(s.fonte_id), public.etl_txt(s.trecho_citado),
      COALESCE(public.etl_bool(s.conflito), false)
    FROM src s
    ON CONFLICT (lote_id, principio_ativo, via, coalesce(indicacao,''), coalesce(populacao,''), coalesce(dose_tipo,''))
    DO UPDATE SET
      dose_min = COALESCE(EXCLUDED.dose_min, b.dose_min),
      dose_max = COALESCE(EXCLUDED.dose_max, b.dose_max),
      dose_unidade = COALESCE(EXCLUDED.dose_unidade, b.dose_unidade),
      dose_pendente_de_fonte = EXCLUDED.dose_pendente_de_fonte,
      fonte_id = COALESCE(EXCLUDED.fonte_id, b.fonte_id),
      trecho_citado = COALESCE(EXCLUDED.trecho_citado, b.trecho_citado),
      conflito = EXCLUDED.conflito,
      updated_at = now()
    RETURNING (xmax = 0) AS foi_insert
  )
  SELECT v_lidos,
         COALESCE(count(*) FILTER (WHERE foi_insert),0)::int,
         COALESCE(count(*) FILTER (WHERE NOT foi_insert),0)::int,
         v_rej
  FROM ins;
END; $$;

-- =========================================================
-- ETAPA: diluição IV
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_etl_med_iv(p_lote text)
RETURNS TABLE(lidos integer, inseridos integer, atualizados integer, rejeitados integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lidos int; v_rej int;
BEGIN
  SELECT count(*) INTO v_lidos FROM public.stg_med_iv s WHERE s.lote_id = p_lote;
  SELECT count(*) INTO v_rej FROM public.stg_med_iv s
    WHERE s.lote_id = p_lote AND public.etl_txt(s.principio_ativo) IS NULL;

  RETURN QUERY
  WITH src AS (
    SELECT DISTINCT ON (public.etl_txt(s.principio_ativo)) s.*
    FROM public.stg_med_iv s
    WHERE s.lote_id = p_lote AND public.etl_txt(s.principio_ativo) IS NOT NULL
    ORDER BY public.etl_txt(s.principio_ativo), s.importado_em NULLS LAST, s.id
  ), ins AS (
    INSERT INTO public.base_iv_diluicao AS b (
      lote_id, principio_ativo, diluentes_compativeis, diluentes_incompativeis,
      concentracao_maxima_mg_ml, concentracao_usual_mg_ml, volume_minimo_ml,
      tempo_minimo_infusao_min, tempo_usual_infusao_min, velocidade_maxima,
      bolus_permitido, estabilidade_ambiente_horas, estabilidade_refrigerado_horas,
      fotoprotecao, requer_filtro, requer_bomba, via_central_obrigatoria,
      incompatibilidades_y, risco_flebite, risco_extravasamento,
      conduta_extravasamento, observacao, fonte_id, trecho_citado
    )
    SELECT p_lote,
      public.etl_txt(s.principio_ativo),
      public.etl_txt(s.diluentes_compativeis), public.etl_txt(s.diluentes_incompativeis),
      public.etl_num(s.concentracao_maxima_mg_ml), public.etl_num(s.concentracao_usual_mg_ml),
      public.etl_num(s.volume_minimo_ml),
      public.etl_int(s.tempo_minimo_infusao_min), public.etl_int(s.tempo_usual_infusao_min),
      public.etl_txt(s.velocidade_maxima),
      COALESCE(public.etl_bool(s.bolus_permitido), false),
      public.etl_int(s.estabilidade_ambiente_horas), public.etl_int(s.estabilidade_refrigerado_horas),
      COALESCE(public.etl_bool(s.fotoprotecao), false),
      COALESCE(public.etl_bool(s.requer_filtro), false),
      COALESCE(public.etl_bool(s.requer_bomba), false),
      COALESCE(public.etl_bool(s.via_central_obrigatoria), false),
      public.etl_txt(s.incompatibilidades_y), public.etl_txt(s.risco_flebite),
      public.etl_txt(s.risco_extravasamento), public.etl_txt(s.conduta_extravasamento),
      public.etl_txt(s.observacao), public.etl_fonte_uuid(s.fonte_id), public.etl_txt(s.trecho_citado)
    FROM src s
    ON CONFLICT (lote_id, principio_ativo) DO UPDATE SET
      diluentes_compativeis = COALESCE(EXCLUDED.diluentes_compativeis, b.diluentes_compativeis),
      diluentes_incompativeis = COALESCE(EXCLUDED.diluentes_incompativeis, b.diluentes_incompativeis),
      concentracao_maxima_mg_ml = COALESCE(EXCLUDED.concentracao_maxima_mg_ml, b.concentracao_maxima_mg_ml),
      concentracao_usual_mg_ml = COALESCE(EXCLUDED.concentracao_usual_mg_ml, b.concentracao_usual_mg_ml),
      volume_minimo_ml = COALESCE(EXCLUDED.volume_minimo_ml, b.volume_minimo_ml),
      tempo_minimo_infusao_min = COALESCE(EXCLUDED.tempo_minimo_infusao_min, b.tempo_minimo_infusao_min),
      tempo_usual_infusao_min = COALESCE(EXCLUDED.tempo_usual_infusao_min, b.tempo_usual_infusao_min),
      velocidade_maxima = COALESCE(EXCLUDED.velocidade_maxima, b.velocidade_maxima),
      bolus_permitido = EXCLUDED.bolus_permitido,
      estabilidade_ambiente_horas = COALESCE(EXCLUDED.estabilidade_ambiente_horas, b.estabilidade_ambiente_horas),
      estabilidade_refrigerado_horas = COALESCE(EXCLUDED.estabilidade_refrigerado_horas, b.estabilidade_refrigerado_horas),
      fotoprotecao = EXCLUDED.fotoprotecao,
      requer_filtro = EXCLUDED.requer_filtro,
      requer_bomba = EXCLUDED.requer_bomba,
      via_central_obrigatoria = EXCLUDED.via_central_obrigatoria,
      incompatibilidades_y = COALESCE(EXCLUDED.incompatibilidades_y, b.incompatibilidades_y),
      risco_flebite = COALESCE(EXCLUDED.risco_flebite, b.risco_flebite),
      risco_extravasamento = COALESCE(EXCLUDED.risco_extravasamento, b.risco_extravasamento),
      conduta_extravasamento = COALESCE(EXCLUDED.conduta_extravasamento, b.conduta_extravasamento),
      observacao = COALESCE(EXCLUDED.observacao, b.observacao),
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

-- =========================================================
-- ETAPA: interações
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_etl_med_interacao(p_lote text)
RETURNS TABLE(lidos integer, inseridos integer, atualizados integer, rejeitados integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lidos int; v_rej int;
BEGIN
  SELECT count(*) INTO v_lidos FROM public.stg_med_interacao s WHERE s.lote_id = p_lote;
  SELECT count(*) INTO v_rej FROM public.stg_med_interacao s
    WHERE s.lote_id = p_lote
      AND (public.etl_txt(s.principio_ativo_1) IS NULL OR public.etl_txt(s.principio_ativo_2) IS NULL);

  RETURN QUERY
  WITH norm AS (
    SELECT s.*,
      LEAST(public.etl_txt(s.principio_ativo_1), public.etl_txt(s.principio_ativo_2)) AS pa,
      GREATEST(public.etl_txt(s.principio_ativo_1), public.etl_txt(s.principio_ativo_2)) AS pb
    FROM public.stg_med_interacao s
    WHERE s.lote_id = p_lote
      AND public.etl_txt(s.principio_ativo_1) IS NOT NULL
      AND public.etl_txt(s.principio_ativo_2) IS NOT NULL
  ), src AS (
    SELECT DISTINCT ON (pa, pb) * FROM norm
    ORDER BY pa, pb, importado_em NULLS LAST, id
  ), ins AS (
    INSERT INTO public.base_medicamentos_interacoes AS b (
      lote_id, principio_ativo_a, principio_ativo_b, classe_a, classe_b,
      tipo_interacao, mecanismo, efeito_clinico, gravidade, inicio_efeito,
      documentacao, conduta, alternativa, monitorar, fonte_id, trecho_citado, conflito
    )
    SELECT p_lote, s.pa, s.pb,
      public.etl_txt(s.classe_1), public.etl_txt(s.classe_2),
      public.etl_txt(s.tipo_interacao), public.etl_txt(s.mecanismo), public.etl_txt(s.efeito),
      public.etl_txt(s.gravidade), public.etl_txt(s.momento), public.etl_txt(s.evidencia),
      public.etl_txt(s.conduta), public.etl_txt(s.alternativa), public.etl_txt(s.monitoramento),
      public.etl_fonte_uuid(s.fonte_id), public.etl_txt(s.trecho_citado),
      COALESCE(public.etl_bool(s.conflito), false)
    FROM src s
    ON CONFLICT (lote_id, principio_ativo_a, principio_ativo_b) DO UPDATE SET
      classe_a = COALESCE(EXCLUDED.classe_a, b.classe_a),
      classe_b = COALESCE(EXCLUDED.classe_b, b.classe_b),
      tipo_interacao = COALESCE(EXCLUDED.tipo_interacao, b.tipo_interacao),
      mecanismo = COALESCE(EXCLUDED.mecanismo, b.mecanismo),
      efeito_clinico = COALESCE(EXCLUDED.efeito_clinico, b.efeito_clinico),
      gravidade = COALESCE(EXCLUDED.gravidade, b.gravidade),
      inicio_efeito = COALESCE(EXCLUDED.inicio_efeito, b.inicio_efeito),
      documentacao = COALESCE(EXCLUDED.documentacao, b.documentacao),
      conduta = COALESCE(EXCLUDED.conduta, b.conduta),
      alternativa = COALESCE(EXCLUDED.alternativa, b.alternativa),
      monitorar = COALESCE(EXCLUDED.monitorar, b.monitorar),
      fonte_id = COALESCE(EXCLUDED.fonte_id, b.fonte_id),
      trecho_citado = COALESCE(EXCLUDED.trecho_citado, b.trecho_citado),
      conflito = EXCLUDED.conflito,
      updated_at = now()
    RETURNING (xmax = 0) AS foi_insert
  )
  SELECT v_lidos,
         COALESCE(count(*) FILTER (WHERE foi_insert),0)::int,
         COALESCE(count(*) FILTER (WHERE NOT foi_insert),0)::int,
         v_rej
  FROM ins;
END; $$;

-- =========================================================
-- ETAPA: contraindicações
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_etl_med_contraindicacao(p_lote text)
RETURNS TABLE(lidos integer, inseridos integer, atualizados integer, rejeitados integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lidos int; v_rej int;
BEGIN
  SELECT count(*) INTO v_lidos FROM public.stg_med_contraindicacao s WHERE s.lote_id = p_lote;
  SELECT count(*) INTO v_rej FROM public.stg_med_contraindicacao s
    WHERE s.lote_id = p_lote AND public.etl_txt(s.principio_ativo) IS NULL;

  RETURN QUERY
  WITH src AS (
    SELECT DISTINCT ON (public.etl_txt(s.principio_ativo),
                        coalesce(public.etl_txt(s.condicao),''),
                        coalesce(public.etl_txt(s.tipo),'')) s.*
    FROM public.stg_med_contraindicacao s
    WHERE s.lote_id = p_lote AND public.etl_txt(s.principio_ativo) IS NOT NULL
    ORDER BY public.etl_txt(s.principio_ativo), coalesce(public.etl_txt(s.condicao),''),
             coalesce(public.etl_txt(s.tipo),''), s.importado_em NULLS LAST, s.id
  ), ins AS (
    INSERT INTO public.base_medicamentos_contraindicacoes AS b (
      lote_id, principio_ativo, tipo, condicao, cid10_relacionado, gravidade,
      mecanismo, conduta, alternativa, alergia_cruzada_classe, fonte_id, trecho_citado, conflito
    )
    SELECT p_lote,
      public.etl_txt(s.principio_ativo), public.etl_txt(s.tipo), public.etl_txt(s.condicao),
      public.etl_txt(s.cid10_relacionado), public.etl_txt(s.gravidade), public.etl_txt(s.mecanismo),
      public.etl_txt(s.conduta), public.etl_txt(s.alternativa), public.etl_txt(s.alergia_cruzada_classe),
      public.etl_fonte_uuid(s.fonte_id), public.etl_txt(s.trecho_citado),
      COALESCE(public.etl_bool(s.conflito), false)
    FROM src s
    ON CONFLICT (lote_id, principio_ativo, coalesce(condicao,''), coalesce(tipo,'')) DO UPDATE SET
      cid10_relacionado = COALESCE(EXCLUDED.cid10_relacionado, b.cid10_relacionado),
      gravidade = COALESCE(EXCLUDED.gravidade, b.gravidade),
      mecanismo = COALESCE(EXCLUDED.mecanismo, b.mecanismo),
      conduta = COALESCE(EXCLUDED.conduta, b.conduta),
      alternativa = COALESCE(EXCLUDED.alternativa, b.alternativa),
      alergia_cruzada_classe = COALESCE(EXCLUDED.alergia_cruzada_classe, b.alergia_cruzada_classe),
      fonte_id = COALESCE(EXCLUDED.fonte_id, b.fonte_id),
      trecho_citado = COALESCE(EXCLUDED.trecho_citado, b.trecho_citado),
      conflito = EXCLUDED.conflito,
      updated_at = now()
    RETURNING (xmax = 0) AS foi_insert
  )
  SELECT v_lidos,
         COALESCE(count(*) FILTER (WHERE foi_insert),0)::int,
         COALESCE(count(*) FILTER (WHERE NOT foi_insert),0)::int,
         v_rej
  FROM ins;
END; $$;

-- =========================================================
-- ETAPA: monitoramento
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_etl_med_monitoramento(p_lote text)
RETURNS TABLE(lidos integer, inseridos integer, atualizados integer, rejeitados integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lidos int; v_rej int;
BEGIN
  SELECT count(*) INTO v_lidos FROM public.stg_med_monitoramento s WHERE s.lote_id = p_lote;
  SELECT count(*) INTO v_rej FROM public.stg_med_monitoramento s
    WHERE s.lote_id = p_lote AND public.etl_txt(s.principio_ativo) IS NULL;

  RETURN QUERY
  WITH src AS (
    SELECT DISTINCT ON (public.etl_txt(s.principio_ativo), coalesce(public.etl_txt(s.nome_exame),'')) s.*
    FROM public.stg_med_monitoramento s
    WHERE s.lote_id = p_lote AND public.etl_txt(s.principio_ativo) IS NOT NULL
    ORDER BY public.etl_txt(s.principio_ativo), coalesce(public.etl_txt(s.nome_exame),''), s.created_at NULLS LAST, s.id
  ), ins AS (
    INSERT INTO public.base_medicamentos_monitoramento AS b (
      lote_id, principio_ativo, nome_exame, finalidade_monitoramento, momento,
      periodicidade, valor_alvo, valor_toxico, conduta_se_alterado, obrigatorio, fonte_id
    )
    SELECT p_lote,
      public.etl_txt(s.principio_ativo), public.etl_txt(s.nome_exame),
      public.etl_txt(s.finalidade_monitoramento), public.etl_txt(s.momento),
      public.etl_txt(s.periodicidade), public.etl_txt(s.valor_alvo), public.etl_txt(s.valor_toxico),
      public.etl_txt(s.conduta_se_alterado), COALESCE(s.obrigatorio, false),
      public.etl_fonte_uuid(s.fonte_id)
    FROM src s
    ON CONFLICT (lote_id, principio_ativo, coalesce(nome_exame,'')) DO UPDATE SET
      finalidade_monitoramento = COALESCE(EXCLUDED.finalidade_monitoramento, b.finalidade_monitoramento),
      momento = COALESCE(EXCLUDED.momento, b.momento),
      periodicidade = COALESCE(EXCLUDED.periodicidade, b.periodicidade),
      valor_alvo = COALESCE(EXCLUDED.valor_alvo, b.valor_alvo),
      valor_toxico = COALESCE(EXCLUDED.valor_toxico, b.valor_toxico),
      conduta_se_alterado = COALESCE(EXCLUDED.conduta_se_alterado, b.conduta_se_alterado),
      obrigatorio = EXCLUDED.obrigatorio,
      fonte_id = COALESCE(EXCLUDED.fonte_id, b.fonte_id),
      updated_at = now()
    RETURNING (xmax = 0) AS foi_insert
  )
  SELECT v_lidos,
         COALESCE(count(*) FILTER (WHERE foi_insert),0)::int,
         COALESCE(count(*) FILTER (WHERE NOT foi_insert),0)::int,
         v_rej
  FROM ins;
END; $$;

-- =========================================================
-- ETAPA: equivalências
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_etl_med_equivalencia(p_lote text)
RETURNS TABLE(lidos integer, inseridos integer, atualizados integer, rejeitados integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lidos int; v_rej int;
BEGIN
  SELECT count(*) INTO v_lidos FROM public.stg_med_equivalencia s WHERE s.lote_id = p_lote;
  SELECT count(*) INTO v_rej FROM public.stg_med_equivalencia s
    WHERE s.lote_id = p_lote
      AND (public.etl_txt(s.principio_ativo) IS NULL OR public.etl_txt(s.equivalente) IS NULL);

  RETURN QUERY
  WITH src AS (
    SELECT DISTINCT ON (public.etl_txt(s.principio_ativo), public.etl_txt(s.equivalente)) s.*
    FROM public.stg_med_equivalencia s
    WHERE s.lote_id = p_lote
      AND public.etl_txt(s.principio_ativo) IS NOT NULL
      AND public.etl_txt(s.equivalente) IS NOT NULL
    ORDER BY public.etl_txt(s.principio_ativo), public.etl_txt(s.equivalente), s.created_at NULLS LAST, s.id
  ), ins AS (
    INSERT INTO public.base_medicamentos_equivalencia AS b (
      lote_id, principio_ativo, equivalente, fator, tipo_equivalencia, fonte_id, trecho_citado
    )
    SELECT p_lote, public.etl_txt(s.principio_ativo), public.etl_txt(s.equivalente),
      public.etl_num(s.fator), public.etl_txt(s.tipo_equivalencia),
      public.etl_fonte_uuid(s.fonte_id), public.etl_txt(s.trecho_citado)
    FROM src s
    ON CONFLICT (lote_id, principio_ativo, equivalente) DO UPDATE SET
      fator = COALESCE(EXCLUDED.fator, b.fator),
      tipo_equivalencia = COALESCE(EXCLUDED.tipo_equivalencia, b.tipo_equivalencia),
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

-- =========================================================
-- ETAPA: patologias
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_etl_patologias(p_lote text)
RETURNS TABLE(lidos integer, inseridos integer, atualizados integer, rejeitados integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lidos int; v_rej int; v_ins int; v_upd int;
BEGIN
  SELECT count(*) INTO v_lidos FROM public.stg_patologias s WHERE s.lote_id = p_lote;
  SELECT count(*) INTO v_rej FROM public.stg_patologias s
    WHERE s.lote_id = p_lote AND public.etl_txt(s.nome_patologia) IS NULL;

  WITH src AS (
    SELECT DISTINCT ON (public.clin_normalize(s.nome_patologia)) s.*
    FROM public.stg_patologias s
    WHERE s.lote_id = p_lote AND public.etl_txt(s.nome_patologia) IS NOT NULL
    ORDER BY public.clin_normalize(s.nome_patologia), s.importado_em NULLS LAST, s.id
  ), ins AS (
    INSERT INTO public.base_patologias_ref AS b (
      lote_id, nome_patologia, nome_normalizado, sinonimos, cid10, cid11,
      categoria_clinica, is_emergencia, subtipo, contexto_predominante, fonte_id, trecho_citado
    )
    SELECT p_lote,
      public.etl_txt(s.nome_patologia), public.clin_normalize(s.nome_patologia),
      public.etl_txt(s.sinonimos), public.etl_txt(s.cid10), public.etl_txt(s.cid11),
      public.etl_txt(s.categoria_clinica), COALESCE(public.etl_bool(s.is_emergencia), false),
      public.etl_txt(s.subtipo), public.etl_txt(s.contexto_predominante),
      public.etl_fonte_uuid(s.fonte_id), public.etl_txt(s.trecho_citado)
    FROM src s
    ON CONFLICT (nome_normalizado) DO UPDATE SET
      sinonimos = COALESCE(EXCLUDED.sinonimos, b.sinonimos),
      cid10 = COALESCE(EXCLUDED.cid10, b.cid10),
      cid11 = COALESCE(EXCLUDED.cid11, b.cid11),
      categoria_clinica = COALESCE(EXCLUDED.categoria_clinica, b.categoria_clinica),
      is_emergencia = EXCLUDED.is_emergencia,
      subtipo = COALESCE(EXCLUDED.subtipo, b.subtipo),
      contexto_predominante = COALESCE(EXCLUDED.contexto_predominante, b.contexto_predominante),
      fonte_id = COALESCE(EXCLUDED.fonte_id, b.fonte_id),
      trecho_citado = COALESCE(EXCLUDED.trecho_citado, b.trecho_citado),
      updated_at = now()
    RETURNING (xmax = 0) AS foi_insert
  )
  SELECT COALESCE(count(*) FILTER (WHERE foi_insert),0)::int,
         COALESCE(count(*) FILTER (WHERE NOT foi_insert),0)::int
  INTO v_ins, v_upd
  FROM ins;

  -- 2ª passada: resolve hierarquia (patologia_pai por nome)
  UPDATE public.base_patologias_ref b
  SET patologia_pai = pai.id, updated_at = now()
  FROM public.stg_patologias s
  JOIN public.base_patologias_ref pai
    ON pai.nome_normalizado = public.clin_normalize(s.patologia_pai)
  WHERE s.lote_id = p_lote
    AND public.etl_txt(s.patologia_pai) IS NOT NULL
    AND b.nome_normalizado = public.clin_normalize(s.nome_patologia)
    AND (b.patologia_pai IS DISTINCT FROM pai.id);

  RETURN QUERY SELECT v_lidos, v_ins, v_upd, v_rej;
END; $$;

-- =========================================================
-- Orquestração: etapa isolada e execução completa
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_etl_promover_etapa(
  p_etapa text, p_lote text, p_execucao uuid DEFAULT gen_random_uuid())
RETURNS TABLE(etapa text, status text, lidos integer, inseridos integer,
              atualizados integer, rejeitados integer, duracao_ms integer, erro text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_map jsonb := jsonb_build_object(
    'med_principio',      jsonb_build_array('fn_etl_med_principio','stg_med_principio','base_medicamentos_geral'),
    'med_dose',           jsonb_build_array('fn_etl_med_dose','stg_med_dose','base_medicamentos_dose'),
    'med_iv',             jsonb_build_array('fn_etl_med_iv','stg_med_iv','base_iv_diluicao'),
    'med_interacao',      jsonb_build_array('fn_etl_med_interacao','stg_med_interacao','base_medicamentos_interacoes'),
    'med_contraindicacao',jsonb_build_array('fn_etl_med_contraindicacao','stg_med_contraindicacao','base_medicamentos_contraindicacoes'),
    'med_monitoramento',  jsonb_build_array('fn_etl_med_monitoramento','stg_med_monitoramento','base_medicamentos_monitoramento'),
    'med_equivalencia',   jsonb_build_array('fn_etl_med_equivalencia','stg_med_equivalencia','base_medicamentos_equivalencia'),
    'patologias',         jsonb_build_array('fn_etl_patologias','stg_patologias','base_patologias_ref')
  );
  v_cfg jsonb; v_t0 timestamptz := clock_timestamp();
  v_l int := 0; v_i int := 0; v_u int := 0; v_r int := 0;
  v_status text := 'sucesso'; v_erro text; v_dur int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem executar a promoção de dados';
  END IF;

  v_cfg := v_map -> p_etapa;
  IF v_cfg IS NULL THEN
    RAISE EXCEPTION 'Etapa desconhecida: %', p_etapa;
  END IF;

  BEGIN
    EXECUTE format('SELECT lidos, inseridos, atualizados, rejeitados FROM public.%I($1)', v_cfg->>0)
      INTO v_l, v_i, v_u, v_r USING p_lote;
  EXCEPTION WHEN OTHERS THEN
    v_status := 'erro'; v_erro := SQLERRM;
    v_l := 0; v_i := 0; v_u := 0; v_r := 0;
  END;

  v_dur := (EXTRACT(EPOCH FROM (clock_timestamp() - v_t0)) * 1000)::int;

  INSERT INTO public.etl_promocao_log(
    execucao_id, lote_id, etapa, tabela_origem, tabela_destino,
    lidos, inseridos, atualizados, rejeitados, status, erro, duracao_ms, executado_por)
  VALUES (p_execucao, p_lote, p_etapa, v_cfg->>1, v_cfg->>2,
          v_l, v_i, v_u, v_r, v_status, v_erro, v_dur, auth.uid());

  RETURN QUERY SELECT p_etapa, v_status, v_l, v_i, v_u, v_r, v_dur, v_erro;
END; $$;

CREATE OR REPLACE FUNCTION public.fn_etl_promover_tudo(p_lote text DEFAULT 'medflow_ps_v1')
RETURNS TABLE(etapa text, status text, lidos integer, inseridos integer,
              atualizados integer, rejeitados integer, duracao_ms integer, erro text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_exec uuid := gen_random_uuid();
  v_etapas text[] := ARRAY['med_principio','med_dose','med_iv','med_interacao',
                           'med_contraindicacao','med_monitoramento','med_equivalencia','patologias'];
  v_e text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem executar a promoção de dados';
  END IF;

  FOREACH v_e IN ARRAY v_etapas LOOP
    RETURN QUERY SELECT * FROM public.fn_etl_promover_etapa(v_e, p_lote, v_exec);
  END LOOP;
END; $$;

REVOKE ALL ON FUNCTION public.fn_etl_med_principio(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_etl_med_dose(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_etl_med_iv(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_etl_med_interacao(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_etl_med_contraindicacao(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_etl_med_monitoramento(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_etl_med_equivalencia(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_etl_patologias(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_etl_promover_etapa(text, text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_etl_promover_tudo(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_etl_promover_etapa(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_etl_promover_tudo(text) TO authenticated;