-- ============ Enum de revisão clínica ============
DO $$ BEGIN
  CREATE TYPE public.revisao_clinica_status AS ENUM ('pending_review','reviewed','needs_correction','inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ Registro de revisão ============
CREATE TABLE IF NOT EXISTS public.medicamento_revisao_clinica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicamento_id uuid NOT NULL REFERENCES public.base_medicamentos_geral(id) ON DELETE CASCADE,
  apresentacao_id uuid REFERENCES public.base_apresentacoes_medicamentos(id) ON DELETE CASCADE,
  dose_id uuid REFERENCES public.base_medicamentos_dose(id) ON DELETE CASCADE,
  status public.revisao_clinica_status NOT NULL DEFAULT 'pending_review',
  conteudo_hash text,
  versao integer NOT NULL DEFAULT 1,
  fonte text,
  observacao text,
  revisor_id uuid,
  revisado_em timestamptz,
  proxima_revisao_em date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.medicamento_revisao_clinica TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.medicamento_revisao_clinica TO authenticated;
GRANT ALL ON public.medicamento_revisao_clinica TO service_role;
ALTER TABLE public.medicamento_revisao_clinica ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "revisao_clinica_leitura" ON public.medicamento_revisao_clinica;
CREATE POLICY "revisao_clinica_leitura" ON public.medicamento_revisao_clinica
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "revisao_clinica_admin" ON public.medicamento_revisao_clinica;
CREATE POLICY "revisao_clinica_admin" ON public.medicamento_revisao_clinica
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE UNIQUE INDEX IF NOT EXISTS ux_revisao_clinica_alvo
  ON public.medicamento_revisao_clinica (
    medicamento_id,
    COALESCE(apresentacao_id,'00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(dose_id,'00000000-0000-0000-0000-000000000000'::uuid)
  );
CREATE INDEX IF NOT EXISTS ix_revisao_clinica_dose ON public.medicamento_revisao_clinica (dose_id);
CREATE INDEX IF NOT EXISTS ix_revisao_clinica_apres ON public.medicamento_revisao_clinica (apresentacao_id);

DROP TRIGGER IF EXISTS trg_revisao_clinica_updated ON public.medicamento_revisao_clinica;
CREATE TRIGGER trg_revisao_clinica_updated BEFORE UPDATE ON public.medicamento_revisao_clinica
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

-- ============ Log append-only ============
CREATE TABLE IF NOT EXISTS public.medicamento_revisao_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_id uuid,
  medicamento_id uuid,
  apresentacao_id uuid,
  dose_id uuid,
  acao text NOT NULL,
  status_anterior text,
  status_novo text,
  versao integer,
  alteracoes jsonb,
  snapshot jsonb,
  observacao text,
  revisor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.medicamento_revisao_log TO authenticated;
GRANT ALL ON public.medicamento_revisao_log TO service_role;
ALTER TABLE public.medicamento_revisao_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "revisao_log_leitura_admin" ON public.medicamento_revisao_log;
CREATE POLICY "revisao_log_leitura_admin" ON public.medicamento_revisao_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "revisao_log_insere_admin" ON public.medicamento_revisao_log;
CREATE POLICY "revisao_log_insere_admin" ON public.medicamento_revisao_log
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ Hash do conteúdo revisado ============
CREATE OR REPLACE FUNCTION public.fn_revisao_conteudo_hash(p_apresentacao_id uuid, p_dose_id uuid)
RETURNS text LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT md5(concat_ws('|',
    (SELECT concat_ws('~', a.forma_farmaceutica, a.concentracao, a.unidade_concentracao,
                            a.volume, a.unidade_volume, a.via_administracao)
       FROM base_apresentacoes_medicamentos a WHERE a.id = p_apresentacao_id),
    (SELECT concat_ws('~', d.via, d.populacao, d.dose_min::text, d.dose_max::text, d.dose_unidade,
                            d.frequencia, d.duracao, d.posologia_texto,
                            d.dose_maxima_dia::text, d.dose_maxima_dia_unidade)
       FROM base_medicamentos_dose d WHERE d.id = p_dose_id)
  ));
$$;

-- ============ Reabertura automática quando o dado muda ============
CREATE OR REPLACE FUNCTION public.fn_revisao_reabrir()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT * FROM medicamento_revisao_clinica
     WHERE (TG_TABLE_NAME = 'base_medicamentos_dose' AND dose_id = NEW.id)
        OR (TG_TABLE_NAME = 'base_apresentacoes_medicamentos' AND apresentacao_id = NEW.id)
  LOOP
    IF r.conteudo_hash IS DISTINCT FROM fn_revisao_conteudo_hash(r.apresentacao_id, r.dose_id) THEN
      UPDATE medicamento_revisao_clinica
         SET status = 'needs_correction', versao = r.versao + 1, updated_at = now()
       WHERE id = r.id AND status <> 'inactive';
      INSERT INTO medicamento_revisao_log (registro_id, medicamento_id, apresentacao_id, dose_id,
             acao, status_anterior, status_novo, versao, observacao, revisor_id)
      VALUES (r.id, r.medicamento_id, r.apresentacao_id, r.dose_id, 'conteudo_alterado',
              r.status::text, 'needs_correction', r.versao + 1,
              'Conteúdo alterado após revisão — revisão necessária.', auth.uid());
    END IF;
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_revisao_reabrir_dose ON public.base_medicamentos_dose;
CREATE TRIGGER trg_revisao_reabrir_dose AFTER UPDATE ON public.base_medicamentos_dose
  FOR EACH ROW EXECUTE FUNCTION public.fn_revisao_reabrir();
DROP TRIGGER IF EXISTS trg_revisao_reabrir_apres ON public.base_apresentacoes_medicamentos;
CREATE TRIGGER trg_revisao_reabrir_apres AFTER UPDATE ON public.base_apresentacoes_medicamentos
  FOR EACH ROW EXECUTE FUNCTION public.fn_revisao_reabrir();

-- ============ Itens candidatos à revisão ============
CREATE OR REPLACE VIEW public.vw_revisao_clinica_itens AS
SELECT
  m.id                             AS medicamento_id,
  m.principio_ativo,
  m.classe_terapeutica,
  m.categoria_clinica::text        AS categoria_clinica,
  coalesce(m.uso_em_urgencia,false) AS uso_em_urgencia,
  coalesce(m.uso_emergencia,false)  AS uso_emergencia,
  a.id                             AS apresentacao_id,
  a.apresentacao_texto,
  a.forma_farmaceutica,
  a.concentracao,
  a.unidade_concentracao,
  a.volume,
  a.unidade_volume,
  coalesce(public.fn_via_canonica(a.via_administracao), public.fn_via_canonica(d.via)) AS via,
  a.uso_adulto,
  a.uso_pediatrico,
  d.id                             AS dose_id,
  d.populacao,
  d.dose_min, d.dose_max, d.dose_unidade,
  d.frequencia, d.duracao, d.posologia_texto, d.observacao_dose,
  concat_ws(' ', d.dose_maxima_dia::text, d.dose_maxima_dia_unidade) AS dose_maxima_dia,
  (a.id IS NOT NULL AND coalesce(a.forma_farmaceutica,'') <> '' AND coalesce(a.concentracao,'') <> '') AS apresentacao_utilizavel,
  (d.posologia_texto IS NOT NULL) AS dose_utilizavel,
  coalesce(q.alertas_qualidade,0) AS alertas_qualidade,
  coalesce(q.tipos_alerta, ARRAY[]::text[]) AS tipos_alerta,
  coalesce(r.status::text,'pending_review') AS status_revisao_clinica,
  r.id AS registro_id, r.versao, r.revisado_em, r.revisor_id, r.fonte, r.observacao
FROM base_medicamentos_geral m
LEFT JOIN base_apresentacoes_medicamentos a ON a.id_medicamento = m.id AND a.ativo IS NOT FALSE
LEFT JOIN base_medicamentos_dose d ON d.medicamento_id = m.id
     AND (d.apresentacao_id = a.id OR d.apresentacao_id IS NULL)
LEFT JOIN vw_medicamento_qualidade q ON q.id = m.id
LEFT JOIN medicamento_revisao_clinica r ON r.medicamento_id = m.id
     AND coalesce(r.apresentacao_id,'00000000-0000-0000-0000-000000000000'::uuid) = coalesce(a.id,'00000000-0000-0000-0000-000000000000'::uuid)
     AND coalesce(r.dose_id,'00000000-0000-0000-0000-000000000000'::uuid) = coalesce(d.id,'00000000-0000-0000-0000-000000000000'::uuid)
WHERE m.ativo IS NOT FALSE;

GRANT SELECT ON public.vw_revisao_clinica_itens TO authenticated;

-- ============ Fila priorizada ============
CREATE OR REPLACE FUNCTION public.fn_fila_revisao_clinica(p_filtro text DEFAULT 'pendentes', p_limit int DEFAULT 100)
RETURNS SETOF public.vw_revisao_clinica_itens
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT *
  FROM vw_revisao_clinica_itens v
  WHERE CASE p_filtro
          WHEN 'pendentes'        THEN v.status_revisao_clinica = 'pending_review'
          WHEN 'revisados'        THEN v.status_revisao_clinica = 'reviewed'
          WHEN 'precisam_corrigir'THEN v.status_revisao_clinica = 'needs_correction'
          WHEN 'inativos'         THEN v.status_revisao_clinica = 'inactive'
          WHEN 'inconsistencias'  THEN v.alertas_qualidade > 0
          WHEN 'prontos'          THEN v.apresentacao_utilizavel AND v.dose_utilizavel
                                        AND v.status_revisao_clinica = 'pending_review'
          ELSE true
        END
  ORDER BY
    (v.alertas_qualidade > 0) DESC,
    (v.apresentacao_utilizavel AND v.dose_utilizavel) DESC,
    v.uso_emergencia DESC,
    v.uso_em_urgencia DESC,
    v.principio_ativo,
    v.apresentacao_texto NULLS LAST
  LIMIT greatest(1, least(p_limit, 500));
$$;

-- ============ Ações do revisor ============
CREATE OR REPLACE FUNCTION public.fn_revisao_clinica_acao(
  p_medicamento_id uuid,
  p_apresentacao_id uuid,
  p_dose_id uuid,
  p_acao text,
  p_observacao text DEFAULT NULL,
  p_fonte text DEFAULT NULL,
  p_proxima_revisao date DEFAULT NULL
) RETURNS public.medicamento_revisao_clinica
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_status public.revisao_clinica_status;
  v_ant text;
  v_alertas int;
  v_reg public.medicamento_revisao_clinica;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Somente administradores podem revisar a base farmacológica.';
  END IF;

  v_status := CASE p_acao
    WHEN 'aprovar'  THEN 'reviewed'
    WHEN 'corrigir' THEN 'needs_correction'
    WHEN 'pendente' THEN 'pending_review'
    WHEN 'inativar' THEN 'inactive'
    ELSE NULL END::public.revisao_clinica_status;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Ação inválida: %', p_acao;
  END IF;

  IF v_status = 'reviewed' THEN
    SELECT coalesce(alertas_qualidade,0) INTO v_alertas FROM vw_medicamento_qualidade WHERE id = p_medicamento_id;
    IF coalesce(v_alertas,0) > 0 THEN
      RAISE EXCEPTION 'Item bloqueado: há inconsistência de unidade/concentração em aberto. Corrija antes de aprovar.';
    END IF;
    IF p_apresentacao_id IS NULL OR p_dose_id IS NULL THEN
      RAISE EXCEPTION 'Só é possível aprovar quando existem apresentação e dose cadastradas.';
    END IF;
  END IF;

  SELECT status::text INTO v_ant FROM medicamento_revisao_clinica
   WHERE medicamento_id = p_medicamento_id
     AND coalesce(apresentacao_id,'00000000-0000-0000-0000-000000000000'::uuid) = coalesce(p_apresentacao_id,'00000000-0000-0000-0000-000000000000'::uuid)
     AND coalesce(dose_id,'00000000-0000-0000-0000-000000000000'::uuid) = coalesce(p_dose_id,'00000000-0000-0000-0000-000000000000'::uuid);

  INSERT INTO medicamento_revisao_clinica AS r
    (medicamento_id, apresentacao_id, dose_id, status, conteudo_hash, fonte, observacao,
     revisor_id, revisado_em, proxima_revisao_em)
  VALUES (p_medicamento_id, p_apresentacao_id, p_dose_id, v_status,
          fn_revisao_conteudo_hash(p_apresentacao_id, p_dose_id), p_fonte, p_observacao,
          auth.uid(), CASE WHEN v_status = 'reviewed' THEN now() END, p_proxima_revisao)
  ON CONFLICT (medicamento_id,
               COALESCE(apresentacao_id,'00000000-0000-0000-0000-000000000000'::uuid),
               COALESCE(dose_id,'00000000-0000-0000-0000-000000000000'::uuid))
  DO UPDATE SET
    status = EXCLUDED.status,
    conteudo_hash = EXCLUDED.conteudo_hash,
    fonte = coalesce(EXCLUDED.fonte, r.fonte),
    observacao = EXCLUDED.observacao,
    revisor_id = auth.uid(),
    revisado_em = CASE WHEN EXCLUDED.status = 'reviewed' THEN now() ELSE r.revisado_em END,
    proxima_revisao_em = coalesce(EXCLUDED.proxima_revisao_em, r.proxima_revisao_em),
    versao = r.versao + 1,
    updated_at = now()
  RETURNING * INTO v_reg;

  INSERT INTO medicamento_revisao_log (registro_id, medicamento_id, apresentacao_id, dose_id, acao,
         status_anterior, status_novo, versao, observacao, revisor_id, snapshot)
  VALUES (v_reg.id, p_medicamento_id, p_apresentacao_id, p_dose_id, p_acao,
          v_ant, v_status::text, v_reg.versao, p_observacao, auth.uid(),
          to_jsonb((SELECT x FROM vw_revisao_clinica_itens x
                     WHERE x.medicamento_id = p_medicamento_id
                       AND coalesce(x.apresentacao_id,'00000000-0000-0000-0000-000000000000'::uuid) = coalesce(p_apresentacao_id,'00000000-0000-0000-0000-000000000000'::uuid)
                       AND coalesce(x.dose_id,'00000000-0000-0000-0000-000000000000'::uuid) = coalesce(p_dose_id,'00000000-0000-0000-0000-000000000000'::uuid)
                     LIMIT 1)));
  RETURN v_reg;
END $$;

-- ============ Correção de dose pelo revisor ============
CREATE OR REPLACE FUNCTION public.fn_revisao_clinica_corrigir_dose(p_dose_id uuid, p_patch jsonb)
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_antes jsonb; v_med uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Somente administradores podem corrigir a base farmacológica.';
  END IF;

  SELECT to_jsonb(d), d.medicamento_id INTO v_antes, v_med FROM base_medicamentos_dose d WHERE d.id = p_dose_id;
  IF v_antes IS NULL THEN RAISE EXCEPTION 'Dose não encontrada.'; END IF;

  UPDATE base_medicamentos_dose SET
    via             = coalesce(p_patch->>'via', via),
    populacao       = coalesce(p_patch->>'populacao', populacao),
    dose_min        = coalesce((p_patch->>'dose_min')::numeric, dose_min),
    dose_max        = coalesce((p_patch->>'dose_max')::numeric, dose_max),
    dose_unidade    = coalesce(p_patch->>'dose_unidade', dose_unidade),
    frequencia      = coalesce(p_patch->>'frequencia', frequencia),
    duracao         = coalesce(p_patch->>'duracao', duracao),
    posologia_texto = coalesce(p_patch->>'posologia_texto', posologia_texto),
    observacao_dose = coalesce(p_patch->>'observacao_dose', observacao_dose)
  WHERE id = p_dose_id;

  INSERT INTO medicamento_revisao_log (medicamento_id, dose_id, acao, alteracoes, snapshot, revisor_id, observacao)
  VALUES (v_med, p_dose_id, 'correcao_dose', p_patch, v_antes, auth.uid(),
          'Correção manual do revisor. Nenhum valor foi convertido automaticamente.');
END $$;

-- ============ Liberados para prescrição rápida ============
CREATE OR REPLACE VIEW public.vw_medicamento_liberado AS
SELECT DISTINCT r.medicamento_id, r.apresentacao_id, r.dose_id
FROM medicamento_revisao_clinica r
JOIN vw_revisao_clinica_itens v
  ON v.medicamento_id = r.medicamento_id
 AND v.apresentacao_id IS NOT DISTINCT FROM r.apresentacao_id
 AND v.dose_id IS NOT DISTINCT FROM r.dose_id
WHERE r.status = 'reviewed'
  AND v.apresentacao_utilizavel AND v.dose_utilizavel
  AND v.alertas_qualidade = 0;

GRANT SELECT ON public.vw_medicamento_liberado TO authenticated;

-- ============ Resumo do painel ============
CREATE OR REPLACE FUNCTION public.fn_resumo_revisao_clinica()
RETURNS jsonb LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT jsonb_build_object(
    'pendentes',            (SELECT count(*) FROM vw_revisao_clinica_itens WHERE status_revisao_clinica='pending_review'),
    'revisados',            (SELECT count(*) FROM vw_revisao_clinica_itens WHERE status_revisao_clinica='reviewed'),
    'precisam_corrigir',    (SELECT count(*) FROM vw_revisao_clinica_itens WHERE status_revisao_clinica='needs_correction'),
    'inativos',             (SELECT count(*) FROM vw_revisao_clinica_itens WHERE status_revisao_clinica='inactive'),
    'completos_aguardando', (SELECT count(*) FROM vw_revisao_clinica_itens
                              WHERE apresentacao_utilizavel AND dose_utilizavel
                                AND status_revisao_clinica='pending_review' AND alertas_qualidade=0),
    'inconsistencias',      (SELECT count(*) FROM vw_revisao_clinica_itens WHERE alertas_qualidade>0),
    'liberados_medicamentos',(SELECT count(DISTINCT medicamento_id) FROM vw_medicamento_liberado),
    'liberados_itens',      (SELECT count(*) FROM vw_medicamento_liberado),
    'apresentacoes_total',  (SELECT count(*) FROM base_apresentacoes_medicamentos WHERE ativo IS NOT FALSE),
    'medicamentos_com_apresentacao', (SELECT count(DISTINCT id_medicamento) FROM base_apresentacoes_medicamentos WHERE ativo IS NOT FALSE)
  );
$$;

-- ============ Apresentações: 'revisada' passa a significar revisão clínica ============
CREATE OR REPLACE FUNCTION public.fn_apresentacoes_medicamento(p_medicamento_id uuid)
RETURNS TABLE(apresentacao_id uuid, rotulo text, forma_farmaceutica text, concentracao text, volume text,
              unidade_volume text, via text, uso_adulto boolean, uso_pediatrico boolean, revisada boolean,
              utilizavel boolean, posologias jsonb)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT
    v.apresentacao_id, v.rotulo, v.forma_farmaceutica, v.concentracao, v.volume,
    v.unidade_volume, v.via, v.uso_adulto, v.uso_pediatrico,
    EXISTS (SELECT 1 FROM medicamento_revisao_clinica r
             WHERE r.medicamento_id = v.medicamento_id AND r.apresentacao_id = v.apresentacao_id
               AND r.status = 'reviewed') AS revisada,
    v.utilizavel,
    coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'dose_id', d.id,
        'populacao', d.populacao,
        'via', public.fn_via_canonica(d.via),
        'dose_min', d.dose_min,
        'dose_max', d.dose_max,
        'unidade', d.dose_unidade,
        'frequencia', d.frequencia,
        'duracao', d.duracao,
        'dose_maxima_dia', concat_ws(' ', d.dose_maxima_dia::text, d.dose_maxima_dia_unidade),
        'posologia', d.posologia_texto,
        'observacao', d.observacao_dose,
        'revisada', EXISTS (SELECT 1 FROM medicamento_revisao_clinica r
                             WHERE r.dose_id = d.id AND r.status = 'reviewed'),
        'pendente', (d.dose_pendente_de_fonte IS TRUE OR d.conflito IS TRUE
                     OR NOT EXISTS (SELECT 1 FROM medicamento_revisao_clinica r
                                     WHERE r.dose_id = d.id AND r.status = 'reviewed'))
      ) ORDER BY d.populacao NULLS FIRST, d.dose_min)
      FROM public.base_medicamentos_dose d
      WHERE d.medicamento_id = v.medicamento_id
        AND (d.apresentacao_id = v.apresentacao_id
             OR (d.apresentacao_id IS NULL
                 AND (public.fn_via_canonica(d.via) IS NULL OR public.fn_via_canonica(d.via) = v.via)))
    ), '[]'::jsonb) AS posologias
  FROM public.vw_apresentacao_completa v
  WHERE v.medicamento_id = p_medicamento_id AND v.ativo IS NOT FALSE
  ORDER BY v.utilizavel DESC, v.rotulo;
$$;