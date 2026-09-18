CREATE UNIQUE INDEX IF NOT EXISTS idx_protocolos_clinicos_nome
ON public.base_protocolos_clinicos (nome_protocolo);

CREATE OR REPLACE FUNCTION public.fn_etl_lista_jsonb(p_texto text, p_chave text)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(p_chave, btrim(t))), '[]'::jsonb)
  FROM unnest(string_to_array(COALESCE(p_texto, ''), ';')) AS t
  WHERE btrim(t) <> '' AND btrim(t) <> 'NAO_NA_FONTE';
$$;

CREATE OR REPLACE FUNCTION public.fn_etl_protocolos(p_lote_id TEXT DEFAULT NULL)
RETURNS TABLE(inseridos INTEGER, atualizados INTEGER, rejeitados INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_inseridos INTEGER := 0;
  v_atualizados INTEGER := 0;
  v_rejeitados INTEGER := 0;
  v_rec RECORD;
  v_tipo protocol_type;
  v_contexto protocol_context;
  v_nome TEXT;
BEGIN
  FOR v_rec IN
    SELECT s.* FROM public.stg_protocolos s
    WHERE s.processado = false
      AND (p_lote_id IS NULL OR s.lote_id = p_lote_id)
  LOOP
    BEGIN
      v_nome := COALESCE(NULLIF(btrim(v_rec.nome_protocolo), ''), 'Sem nome');

      v_tipo := CASE lower(COALESCE(v_rec.tipo_protocolo, 'queixa'))
        WHEN 'queixa' THEN 'queixa'::protocol_type
        WHEN 'sindrome' THEN 'sindrome'::protocol_type
        WHEN 'cid' THEN 'cid'::protocol_type
        WHEN 'diagnostico' THEN 'diagnostico'::protocol_type
        WHEN 'emergencia' THEN 'emergencia'::protocol_type
        WHEN 'ambulatorial' THEN 'ambulatorial'::protocol_type
        WHEN 'hospitalar' THEN 'hospitalar'::protocol_type
        WHEN 'pediatrico' THEN 'pediatrico'::protocol_type
        WHEN 'obstetrico' THEN 'obstetrico'::protocol_type
        ELSE 'outro'::protocol_type
      END;

      v_contexto := CASE lower(COALESCE(v_rec.contexto_atendimento, 'geral'))
        WHEN 'urgencia' THEN 'urgencia'::protocol_context
        WHEN 'emergencia' THEN 'urgencia'::protocol_context
        WHEN 'enfermaria' THEN 'enfermaria'::protocol_context
        WHEN 'ambulatorio' THEN 'ambulatorio'::protocol_context
        WHEN 'pronto_atendimento' THEN 'pronto_atendimento'::protocol_context
        WHEN 'telemedicina' THEN 'telemedicina'::protocol_context
        WHEN 'internacao' THEN 'hospitalar'::protocol_context
        WHEN 'uti' THEN 'hospitalar'::protocol_context
        WHEN 'hospitalar' THEN 'hospitalar'::protocol_context
        WHEN 'pediatria' THEN 'pediatria'::protocol_context
        WHEN 'obstetricia' THEN 'obstetricia'::protocol_context
        ELSE 'geral'::protocol_context
      END;

      IF EXISTS (SELECT 1 FROM public.base_protocolos_clinicos WHERE nome_protocolo = v_nome) THEN
        v_atualizados := v_atualizados + 1;
        UPDATE public.stg_protocolos SET processado = true WHERE id = v_rec.id;
        CONTINUE;
      END IF;

      INSERT INTO public.base_protocolos_clinicos (
        nome_protocolo, tipo_protocolo, area_clinica, contexto_atendimento,
        queixas_relacionadas, sindromes_relacionadas, cids_relacionados, palavras_chave,
        populacao_alvo, sinais_gravidade, diagnosticos_diferenciais, condutas_iniciais,
        exames_sugeridos, medicamentos_sugeridos, medidas_nao_farmacologicas,
        cuidados_enfermagem, criterios_internacao, criterios_encaminhamento,
        sinais_retorno_imediato, orientacoes_paciente, alertas_seguranca,
        contraindicacoes_relevantes, fonte_referencia, status_revisao, ativo
      ) VALUES (
        v_nome, v_tipo, NULLIF(btrim(COALESCE(v_rec.area_clinica,'')), ''), v_contexto,
        COALESCE(string_to_array(NULLIF(btrim(COALESCE(v_rec.nome_patologia,'')), ''), '; '), '{}'),
        COALESCE(string_to_array(NULLIF(btrim(COALESCE(v_rec.nome_patologia,'')), ''), '; '), '{}'),
        COALESCE(string_to_array(NULLIF(btrim(COALESCE(v_rec.cid10,'')), ''), '; '), '{}'),
        COALESCE(string_to_array(NULLIF(btrim(COALESCE(v_rec.nome_patologia,'')), ''), '; '), '{}'),
        NULLIF(btrim(COALESCE(v_rec.populacao_alvo,'')), ''),
        public.fn_etl_lista_jsonb(v_rec.sinais_gravidade, 'titulo'),
        COALESCE(string_to_array(NULLIF(btrim(COALESCE(v_rec.diagnosticos_diferenciais,'')), ''), '; '), '{}'),
        public.fn_etl_lista_jsonb(v_rec.condutas_iniciais, 'titulo'),
        public.fn_etl_lista_jsonb(v_rec.exames_sugeridos, 'nome_exame'),
        public.fn_etl_lista_jsonb(v_rec.medicamentos_sugeridos, 'principio_ativo'),
        public.fn_etl_lista_jsonb(v_rec.medidas_nao_farmacologicas, 'descricao'),
        public.fn_etl_lista_jsonb(v_rec.cuidados_enfermagem, 'descricao'),
        public.fn_etl_lista_jsonb(v_rec.criterios_internacao, 'titulo'),
        public.fn_etl_lista_jsonb(v_rec.criterios_encaminhamento, 'titulo'),
        public.fn_etl_lista_jsonb(v_rec.sinais_retorno_imediato, 'titulo'),
        NULLIF(btrim(COALESCE(v_rec.orientacoes_paciente,'')), ''),
        COALESCE(string_to_array(NULLIF(btrim(COALESCE(v_rec.alertas_seguranca,'')), ''), '; '), '{}'),
        COALESCE(string_to_array(NULLIF(btrim(COALESCE(v_rec.contraindicacoes_relevantes,'')), ''), '; '), '{}'),
        COALESCE(NULLIF(v_rec.fonte_id, ''), 'F005'),
        'aguardando_revisao'::protocol_review_status,
        true
      );

      v_inseridos := v_inseridos + 1;
      UPDATE public.stg_protocolos SET processado = true WHERE id = v_rec.id;

    EXCEPTION WHEN OTHERS THEN
      v_rejeitados := v_rejeitados + 1;
    END;
  END LOOP;

  RETURN QUERY SELECT v_inseridos, v_atualizados, v_rejeitados;
END;
$fn$;