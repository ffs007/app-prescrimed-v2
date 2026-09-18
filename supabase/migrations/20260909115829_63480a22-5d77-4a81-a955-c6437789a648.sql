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
    COALESCE(m.dose_adulto_padrao, dz.dose_adulto, dz.posologia_adulto) AS dose_adulto,
    COALESCE(m.dose_pediatrica_padrao, dz.dose_pediatrica, dz.posologia_pediatrica) AS dose_pediatrica,
    COALESCE(m.frequencia_padrao, dz.frequencia) AS frequencia,
    COALESCE(m.duracao_padrao, dz.duracao) AS duracao,
    dz.dose_maxima_dia,
    dz.observacao_dose,
    dz.total_doses,
    COALESCE(m.dose_adulto_padrao, dz.dose_adulto, dz.posologia_adulto) IS NULL AS dose_incompleta,
    COALESCE(m.apresentacao, ap.apresentacao_texto) IS NULL AS apresentacao_incompleta,
    COALESCE(ap.total_apresentacoes, 0) AS apresentacoes_disponiveis,
    ap.apresentacao_id AS apresentacao_unica_id,
    ap.rotulo AS apresentacao_rotulo,
    (COALESCE(ap.total_apresentacoes, 0) = 1 AND ap.utilizavel) AS apresentacao_autoselecionavel,
    dz.posologia_adulto AS posologia_texto,
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
            max(CASE WHEN d.populacao IS NULL OR d.populacao !~~* '%pedi%'
                     THEN NULLIF(concat_ws(' ', NULLIF(concat_ws('-', d.dose_min::text, NULLIF(d.dose_max::text, d.dose_min::text)), ''), d.dose_unidade), '')
                END) AS dose_adulto,
            max(CASE WHEN d.populacao ~~* '%pedi%'
                     THEN NULLIF(concat_ws(' ', NULLIF(concat_ws('-', d.dose_min::text, NULLIF(d.dose_max::text, d.dose_min::text)), ''), d.dose_unidade), '')
                END) AS dose_pediatrica,
            max(d.posologia_texto) FILTER (WHERE d.populacao IS NULL OR d.populacao !~~* '%pedi%') AS posologia_adulto,
            max(d.posologia_texto) FILTER (WHERE d.populacao ~~* '%pedi%') AS posologia_pediatrica,
            max(d.frequencia) AS frequencia,
            max(d.duracao) AS duracao,
            max(concat_ws(' ', d.dose_maxima_dia::text, d.dose_maxima_dia_unidade)) AS dose_maxima_dia,
            max(d.observacao_dose) AS observacao_dose,
            count(*) AS total_doses
           FROM base_medicamentos_dose d
          WHERE d.medicamento_id = m.id) dz ON true;

ALTER VIEW public.vw_medicamento_completo SET (security_invoker = on);