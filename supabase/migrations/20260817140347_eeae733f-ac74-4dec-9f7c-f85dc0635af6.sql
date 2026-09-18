ALTER TABLE public.base_apresentacoes_medicamentos
  ADD COLUMN IF NOT EXISTS concentracao_mg_ml NUMERIC,
  ADD COLUMN IF NOT EXISTS gotas_por_ml NUMERIC,
  ADD COLUMN IF NOT EXISTS requer_reconstituicao BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS concentracao_pos_reconstituicao_mg_ml NUMERIC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_apresentacoes_id_med_apresentacao
ON public.base_apresentacoes_medicamentos (id_medicamento, apresentacao_texto);

CREATE OR REPLACE FUNCTION public.fn_etl_med_apresentacao(p_lote_id TEXT DEFAULT NULL)
RETURNS TABLE(inseridos INTEGER, atualizados INTEGER, rejeitados INTEGER, orfaos INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_inseridos INTEGER := 0;
  v_atualizados INTEGER := 0;
  v_rejeitados INTEGER := 0;
  v_orfaos INTEGER := 0;
  v_rec RECORD;
  v_med_id UUID;
  v_apresentacao_texto TEXT;
  v_oral BOOLEAN; v_injetavel BOOLEAN; v_topico BOOLEAN; v_inalatorio BOOLEAN;
  v_uso_adulto BOOLEAN; v_uso_pediatrico BOOLEAN; v_requer_reconst BOOLEAN;
  v_conc_mg_ml NUMERIC; v_gotas NUMERIC; v_conc_reconst NUMERIC;
BEGIN
  FOR v_rec IN
    SELECT s.* FROM public.stg_med_apresentacao s
    WHERE s.processado = false
      AND (p_lote_id IS NULL OR s.lote_id = p_lote_id)
  LOOP
    BEGIN
      SELECT g.id INTO v_med_id
      FROM public.base_medicamentos_geral g
      WHERE public.med_normalizar_principio(g.principio_ativo)
          = public.med_normalizar_principio(COALESCE(v_rec.principio_ativo, ''))
      LIMIT 1;

      IF v_med_id IS NULL THEN
        v_orfaos := v_orfaos + 1;
        CONTINUE;
      END IF;

      v_apresentacao_texto :=
        COALESCE(NULLIF(v_rec.forma_farmaceutica, ''), 'NAO_NA_FONTE') || ' ' ||
        COALESCE(NULLIF(v_rec.concentracao_texto, ''), 'NAO_NA_FONTE') ||
        CASE WHEN NULLIF(v_rec.volume_ml, '') IS NOT NULL
                  AND NULLIF(v_rec.volume_ml, '') <> 'NAO_NA_FONTE'
             THEN ' ' || v_rec.volume_ml || ' mL' ELSE '' END;

      v_oral := lower(COALESCE(v_rec.via, '')) IN ('vo','oral','via oral','vo/sublingual','sublingual','sl','retal');
      v_injetavel := lower(COALESCE(v_rec.via, '')) IN ('ev','iv','im','sc','intravenosa','intramuscular','subcutânea','subcutanea','ev/im','im/ev','iv/im','ev/im/sc','intralesional','intra-articular','intratecal','epidural','intraocular');
      v_topico := lower(COALESCE(v_rec.via, '')) IN ('tópico','topico','tópica','topica','dermatológico','dermatologico','oftálmico','oftalmico','nasal','tópico/inalatório');
      v_inalatorio := lower(COALESCE(v_rec.via, '')) IN ('inalatória','inalatoria','inalação','inalacao','inalatória/ev','inalatória/ev/im');

      v_requer_reconst := lower(COALESCE(v_rec.requer_reconstituicao, 'false')) IN ('true','sim','1','yes');

      v_conc_mg_ml := CASE WHEN v_rec.concentracao_mg_ml ~ '^\d+(\.\d+)?$' THEN v_rec.concentracao_mg_ml::numeric ELSE NULL END;
      v_gotas := CASE WHEN v_rec.gotas_por_ml ~ '^\d+(\.\d+)?$' THEN v_rec.gotas_por_ml::numeric ELSE NULL END;
      v_conc_reconst := CASE WHEN v_rec.concentracao_pos_reconstituicao_mg_ml ~ '^\d+(\.\d+)?$' THEN v_rec.concentracao_pos_reconstituicao_mg_ml::numeric ELSE NULL END;

      v_uso_adulto := true;
      v_uso_pediatrico := false;

      IF EXISTS (
        SELECT 1 FROM public.base_apresentacoes_medicamentos
        WHERE id_medicamento = v_med_id AND apresentacao_texto = v_apresentacao_texto
      ) THEN
        v_atualizados := v_atualizados + 1;
        UPDATE public.stg_med_apresentacao SET processado = true WHERE id = v_rec.id;
        CONTINUE;
      END IF;

      INSERT INTO public.base_apresentacoes_medicamentos (
        id_medicamento, principio_ativo, forma_farmaceutica,
        concentracao, unidade_concentracao, volume, unidade_volume,
        apresentacao_texto, via_administracao,
        uso_adulto, uso_pediatrico, injetavel, oral, topico, inalatorio,
        status_revisao, fonte_referencia, ativo,
        concentracao_mg_ml, gotas_por_ml, requer_reconstituicao,
        concentracao_pos_reconstituicao_mg_ml
      ) VALUES (
        v_med_id,
        COALESCE(NULLIF(v_rec.principio_ativo, ''), 'NAO_NA_FONTE'),
        COALESCE(NULLIF(v_rec.forma_farmaceutica, ''), 'NAO_NA_FONTE'),
        COALESCE(NULLIF(v_rec.concentracao_texto, ''), 'NAO_NA_FONTE'),
        COALESCE(NULLIF(v_rec.concentracao_unidade, ''), 'NAO_NA_FONTE'),
        NULLIF(v_rec.volume_ml, ''),
        'mL',
        v_apresentacao_texto,
        COALESCE(NULLIF(v_rec.via, ''), 'NAO_NA_FONTE'),
        v_uso_adulto, v_uso_pediatrico, v_injetavel, v_oral, v_topico, v_inalatorio,
        'aguardando_revisao'::public.medicamento_status_revisao,
        COALESCE(NULLIF(v_rec.fonte_id, ''), 'F001'),
        true,
        v_conc_mg_ml, v_gotas, v_requer_reconst, v_conc_reconst
      );

      v_inseridos := v_inseridos + 1;
      UPDATE public.stg_med_apresentacao SET processado = true WHERE id = v_rec.id;
    EXCEPTION WHEN OTHERS THEN
      v_rejeitados := v_rejeitados + 1;
    END;
  END LOOP;

  RETURN QUERY SELECT v_inseridos, v_atualizados, v_rejeitados, v_orfaos;
END;
$fn$;

REVOKE ALL ON FUNCTION public.fn_etl_med_apresentacao(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_etl_med_apresentacao(TEXT) TO authenticated, service_role;