-- ============================================================
-- Etapa 2 — Apresentações e doses prescritíveis
-- ============================================================

-- 1) Via canônica (as tabelas usam notações diferentes)
CREATE OR REPLACE FUNCTION public.fn_via_canonica(p_via text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_via IS NULL OR btrim(p_via) = '' THEN NULL
    WHEN public.clin_normalize(p_via) IN ('iv','ev','intravenosa','intravenoso','endovenosa','endovenoso') THEN 'IV'
    WHEN public.clin_normalize(p_via) IN ('vo','oral','via oral','peroral') THEN 'VO'
    WHEN public.clin_normalize(p_via) IN ('im','intramuscular') THEN 'IM'
    WHEN public.clin_normalize(p_via) IN ('sc','subcutanea','subcutaneo') THEN 'SC'
    WHEN public.clin_normalize(p_via) IN ('sl','sublingual') THEN 'SL'
    WHEN public.clin_normalize(p_via) IN ('in','inalatoria','inalatorio','inalacao','nebulizacao') THEN 'INAL'
    WHEN public.clin_normalize(p_via) IN ('nasal','intranasal') THEN 'NASAL'
    WHEN public.clin_normalize(p_via) IN ('retal','via retal') THEN 'RETAL'
    WHEN public.clin_normalize(p_via) IN ('topica','topico','cutanea') THEN 'TOP'
    WHEN public.clin_normalize(p_via) IN ('oftalmica','ocular','colirio') THEN 'OFT'
    WHEN public.clin_normalize(p_via) IN ('otologica','auricular') THEN 'OTO'
    ELSE upper(btrim(p_via))
  END;
$$;

-- 2) Rótulo humano da apresentação: "Losartana 50 mg — comprimido (10 mL)"
CREATE OR REPLACE FUNCTION public.fn_rotulo_apresentacao(
  p_principio text, p_concentracao text, p_forma text,
  p_volume text, p_unidade_volume text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT NULLIF(btrim(
    concat_ws(' ',
      initcap(NULLIF(btrim(coalesce(p_principio,'')), '')),
      NULLIF(btrim(coalesce(p_concentracao,'')), '')
    )
    || CASE WHEN NULLIF(btrim(coalesce(p_forma,'')), '') IS NOT NULL
            THEN ' — ' || btrim(p_forma) ELSE '' END
    || CASE WHEN NULLIF(btrim(coalesce(p_volume,'')), '') IS NOT NULL
                 AND btrim(p_volume) <> 'NAO_NA_FONTE'
            THEN ' (' || btrim(p_volume) || coalesce(' ' || NULLIF(btrim(coalesce(p_unidade_volume,'')), ''), '') || ')'
            ELSE '' END
  ), '');
$$;

-- 3) Texto de posologia pronto a partir da dose estruturada
CREATE OR REPLACE FUNCTION public.fn_posologia_texto(
  p_dose_min numeric, p_dose_max numeric, p_unidade text,
  p_via text, p_frequencia text, p_duracao text, p_intervalo_horas int
)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT NULLIF(btrim(concat_ws(' ',
    NULLIF(concat_ws('–',
      NULLIF(trim(trailing '.' from trim(trailing '0' from p_dose_min::text)), ''),
      NULLIF(NULLIF(trim(trailing '.' from trim(trailing '0' from p_dose_max::text)), ''),
             NULLIF(trim(trailing '.' from trim(trailing '0' from p_dose_min::text)), ''))
    ), ''),
    NULLIF(btrim(coalesce(p_unidade,'')), ''),
    public.fn_via_canonica(p_via),
    NULLIF(btrim(coalesce(p_frequencia,'')), ''),
    CASE WHEN p_intervalo_horas IS NOT NULL AND coalesce(p_frequencia,'') = ''
         THEN p_intervalo_horas || '/' || p_intervalo_horas || 'h' END,
    CASE WHEN NULLIF(btrim(coalesce(p_duracao,'')), '') IS NOT NULL
         THEN 'por ' || btrim(p_duracao) END
  )), '');
$$;

-- 4) Dose ligada à apresentação + posologia pronta + estado de revisão
ALTER TABLE public.base_medicamentos_dose
  ADD COLUMN IF NOT EXISTS apresentacao_id uuid REFERENCES public.base_apresentacoes_medicamentos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS posologia_texto text,
  ADD COLUMN IF NOT EXISTS status_revisao text NOT NULL DEFAULT 'aguardando_revisao';

CREATE INDEX IF NOT EXISTS idx_dose_apresentacao ON public.base_medicamentos_dose (apresentacao_id);
CREATE INDEX IF NOT EXISTS idx_dose_medicamento ON public.base_medicamentos_dose (medicamento_id);
CREATE INDEX IF NOT EXISTS idx_apres_medicamento ON public.base_apresentacoes_medicamentos (id_medicamento);

-- Mantém posologia_texto sempre coerente com a dose estruturada
CREATE OR REPLACE FUNCTION public.fn_dose_set_posologia()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.posologia_texto := coalesce(
    NULLIF(btrim(coalesce(NEW.posologia_texto, '')), ''),
    public.fn_posologia_texto(NEW.dose_min, NEW.dose_max, NEW.dose_unidade,
                              NEW.via, NEW.frequencia, NEW.duracao, NEW.intervalo_horas)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dose_set_posologia ON public.base_medicamentos_dose;
CREATE TRIGGER trg_dose_set_posologia
  BEFORE INSERT OR UPDATE ON public.base_medicamentos_dose
  FOR EACH ROW EXECUTE FUNCTION public.fn_dose_set_posologia();

-- 5) Visão de apresentações prontas para a interface
CREATE OR REPLACE VIEW public.vw_apresentacao_completa AS
SELECT
  a.id                          AS apresentacao_id,
  a.id_medicamento              AS medicamento_id,
  m.principio_ativo,
  a.forma_farmaceutica,
  a.concentracao,
  a.unidade_concentracao,
  NULLIF(a.volume, 'NAO_NA_FONTE') AS volume,
  a.unidade_volume,
  public.fn_via_canonica(a.via_administracao) AS via,
  coalesce(
    public.fn_rotulo_apresentacao(m.principio_ativo, a.concentracao, a.forma_farmaceutica, a.volume, a.unidade_volume),
    a.apresentacao_texto
  )                             AS rotulo,
  a.apresentacao_texto,
  a.uso_adulto,
  a.uso_pediatrico,
  a.ativo,
  a.status_revisao::text        AS status_revisao,
  (a.status_revisao::text IN ('aprovado','revisado'))                         AS revisada,
  (a.ativo IS NOT FALSE
    AND a.forma_farmaceutica IS NOT NULL
    AND a.concentracao IS NOT NULL
    AND a.via_administracao IS NOT NULL)                                      AS utilizavel,
  (SELECT count(*) FROM public.base_medicamentos_dose d WHERE d.apresentacao_id = a.id) AS total_doses
FROM public.base_apresentacoes_medicamentos a
JOIN public.base_medicamentos_geral m ON m.id = a.id_medicamento;

GRANT SELECT ON public.vw_apresentacao_completa TO authenticated, service_role;

-- 6) Consulta única: apresentações + posologias compatíveis de um medicamento
CREATE OR REPLACE FUNCTION public.fn_apresentacoes_medicamento(p_medicamento_id uuid)
RETURNS TABLE (
  apresentacao_id uuid,
  rotulo text,
  forma_farmaceutica text,
  concentracao text,
  volume text,
  unidade_volume text,
  via text,
  uso_adulto boolean,
  uso_pediatrico boolean,
  revisada boolean,
  utilizavel boolean,
  posologias jsonb
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    v.apresentacao_id, v.rotulo, v.forma_farmaceutica, v.concentracao, v.volume,
    v.unidade_volume, v.via, v.uso_adulto, v.uso_pediatrico, v.revisada, v.utilizavel,
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
        'revisada', (d.status_revisao IN ('aprovado','revisado')
                     AND d.dose_pendente_de_fonte IS NOT TRUE AND d.conflito IS NOT TRUE),
        'pendente', (d.dose_pendente_de_fonte IS TRUE OR d.conflito IS TRUE)
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

GRANT EXECUTE ON FUNCTION public.fn_apresentacoes_medicamento(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_via_canonica(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_rotulo_apresentacao(text,text,text,text,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_posologia_texto(numeric,numeric,text,text,text,text,int) TO authenticated, service_role;

-- 7) Visão consolidada ganha contagem de apresentações e posologia pronta
CREATE OR REPLACE VIEW public.vw_medicamento_completo AS
 SELECT m.id,
    m.principio_ativo,
    m.nome_comercial_referencia,
    m.classe_terapeutica,
    m.categoria_clinica,
    m.subclasse_terapeutica,
    m.tipo_receita,
    m.alto_risco,
    m.antimicrobiano,
    m.alerta_gestacao,
    m.ativo,
    m.status_revisao,
    m.busca_normalizada,
    COALESCE(m.apresentacao, ap.apresentacao_texto) AS apresentacao,
    COALESCE(m.concentracao, ap.concentracao) AS concentracao,
    ap.forma_farmaceutica,
    ap.unidade_concentracao,
    COALESCE(m.via_administracao, ap.via_administracao, dz.via) AS via_administracao,
    ap.total_apresentacoes,
    COALESCE(m.dose_adulto_padrao, dz.dose_adulto) AS dose_adulto,
    COALESCE(m.dose_pediatrica_padrao, dz.dose_pediatrica) AS dose_pediatrica,
    COALESCE(m.frequencia_padrao, dz.frequencia) AS frequencia,
    COALESCE(m.duracao_padrao, dz.duracao) AS duracao,
    dz.dose_maxima_dia,
    dz.observacao_dose,
    dz.total_doses,
    COALESCE(m.dose_adulto_padrao, dz.dose_adulto) IS NULL AS dose_incompleta,
    COALESCE(m.apresentacao, ap.apresentacao_texto) IS NULL AS apresentacao_incompleta,
    COALESCE(ap.total_apresentacoes, 0) AS apresentacoes_disponiveis,
    ap.apresentacao_id AS apresentacao_unica_id,
    ap.rotulo AS apresentacao_rotulo,
    (COALESCE(ap.total_apresentacoes, 0) = 1 AND ap.utilizavel) AS apresentacao_autoselecionavel,
    dz.posologia_texto,
    COALESCE(dz.total_doses, 0) > 0 AS tem_posologia
   FROM base_medicamentos_geral m
     LEFT JOIN LATERAL ( SELECT a.apresentacao_id,
            a.apresentacao_texto,
            a.rotulo,
            a.concentracao,
            a.forma_farmaceutica,
            a.unidade_concentracao,
            a.via AS via_administracao,
            a.utilizavel,
            count(*) OVER () AS total_apresentacoes
           FROM public.vw_apresentacao_completa a
          WHERE a.medicamento_id = m.id AND a.ativo IS NOT FALSE
          ORDER BY a.utilizavel DESC, a.rotulo
         LIMIT 1) ap ON true
     LEFT JOIN LATERAL ( SELECT max(public.fn_via_canonica(d.via)) FILTER (WHERE d.via IS NOT NULL) AS via,
            max(
                CASE
                    WHEN d.populacao IS NULL OR d.populacao !~~* '%pedi%'::text THEN concat_ws(' '::text, NULLIF(concat_ws('-'::text, d.dose_min::text, NULLIF(d.dose_max::text, d.dose_min::text)), ''::text), d.dose_unidade)
                    ELSE NULL::text
                END) AS dose_adulto,
            max(
                CASE
                    WHEN d.populacao ~~* '%pedi%'::text THEN concat_ws(' '::text, NULLIF(concat_ws('-'::text, d.dose_min::text, NULLIF(d.dose_max::text, d.dose_min::text)), ''::text), d.dose_unidade)
                    ELSE NULL::text
                END) AS dose_pediatrica,
            max(d.frequencia) AS frequencia,
            max(d.duracao) AS duracao,
            max(concat_ws(' '::text, d.dose_maxima_dia::text, d.dose_maxima_dia_unidade)) AS dose_maxima_dia,
            max(d.observacao_dose) AS observacao_dose,
            max(d.posologia_texto) FILTER (WHERE d.populacao IS NULL OR d.populacao !~~* '%pedi%'::text) AS posologia_texto,
            count(*) AS total_doses
           FROM base_medicamentos_dose d
          WHERE d.medicamento_id = m.id) dz ON true;

-- 8) Auditoria detalhada de apresentações e doses
CREATE OR REPLACE FUNCTION public.fn_auditoria_apresentacoes_doses()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'medicamentos_total',            (SELECT count(*) FROM public.base_medicamentos_geral WHERE ativo),
    'com_apresentacao',              (SELECT count(DISTINCT medicamento_id) FROM public.vw_apresentacao_completa WHERE ativo IS NOT FALSE),
    'sem_apresentacao',              (SELECT count(*) FROM public.base_medicamentos_geral m WHERE m.ativo
                                       AND NOT EXISTS (SELECT 1 FROM public.base_apresentacoes_medicamentos a
                                                       WHERE a.id_medicamento = m.id AND a.ativo IS NOT FALSE)),
    'apresentacoes_total',           (SELECT count(*) FROM public.base_apresentacoes_medicamentos),
    'apresentacoes_sem_vinculo',     (SELECT count(*) FROM public.base_apresentacoes_medicamentos WHERE id_medicamento IS NULL),
    'apresentacoes_incompletas',     (SELECT count(*) FROM public.vw_apresentacao_completa WHERE NOT utilizavel),
    'apresentacoes_pendentes',       (SELECT count(*) FROM public.vw_apresentacao_completa WHERE NOT revisada),
    'medicamentos_multi_apresentacao',(SELECT count(*) FROM (SELECT medicamento_id FROM public.vw_apresentacao_completa
                                        WHERE ativo IS NOT FALSE GROUP BY 1 HAVING count(*) > 1) x),
    'doses_total',                   (SELECT count(*) FROM public.base_medicamentos_dose),
    'medicamentos_com_dose',         (SELECT count(DISTINCT medicamento_id) FROM public.base_medicamentos_dose WHERE medicamento_id IS NOT NULL),
    'medicamentos_sem_dose',         (SELECT count(*) FROM public.base_medicamentos_geral m WHERE m.ativo
                                       AND NOT EXISTS (SELECT 1 FROM public.base_medicamentos_dose d WHERE d.medicamento_id = m.id)),
    'doses_sem_vinculo',             (SELECT count(*) FROM public.base_medicamentos_dose WHERE medicamento_id IS NULL),
    'doses_ligadas_apresentacao',    (SELECT count(*) FROM public.base_medicamentos_dose WHERE apresentacao_id IS NOT NULL),
    'doses_pendentes',               (SELECT count(*) FROM public.base_medicamentos_dose
                                       WHERE dose_pendente_de_fonte IS TRUE OR conflito IS TRUE OR status_revisao NOT IN ('aprovado','revisado')),
    'doses_com_posologia',           (SELECT count(*) FROM public.base_medicamentos_dose WHERE posologia_texto IS NOT NULL),
    'prontos_para_prescrever',       (SELECT count(*) FROM public.vw_medicamento_completo
                                       WHERE ativo AND NOT apresentacao_incompleta AND tem_posologia)
  );
$$;

GRANT EXECUTE ON FUNCTION public.fn_auditoria_apresentacoes_doses() TO authenticated, service_role;