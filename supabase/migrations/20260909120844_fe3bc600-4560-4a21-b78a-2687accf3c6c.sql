-- Número inicial de um texto de concentração/dose ("500 mg/mL" -> 500)
CREATE OR REPLACE FUNCTION public.fn_num_inicial(p_txt text)
RETURNS numeric LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT NULLIF(replace((regexp_match(coalesce(p_txt,''), '([0-9]+(?:[.,][0-9]+)?)'))[1], ',', '.'), '')::numeric;
$$;

-- Possíveis inconsistências de unidade/concentração. Apenas sinaliza.
CREATE OR REPLACE VIEW public.vw_alertas_qualidade_medicamento AS
  -- 1. Dose em volume para forma sólida
  SELECT d.medicamento_id, 'dose_em_volume_forma_solida'::text AS tipo,
         concat_ws(' | ', a.forma_farmaceutica, d.dose_unidade) AS detalhe
  FROM base_medicamentos_dose d
  JOIN base_apresentacoes_medicamentos a ON a.id = d.apresentacao_id
  WHERE a.forma_farmaceutica ~* 'comprimido|c[áa]psula|dr[áa]gea'
    AND d.dose_unidade ~* '^(ml|gota)'
UNION ALL
  -- 2. Valor muito alto declarado em gramas (possível confusão com mg)
  SELECT d.medicamento_id, 'valor_alto_para_gramas',
         concat_ws(' ', d.dose_min::text, d.dose_unidade)
  FROM base_medicamentos_dose d
  WHERE d.dose_unidade ~* '^g(\s|/|$)' AND d.dose_min >= 100
UNION ALL
  -- 3. Valor muito baixo em mg (possível número truncado)
  SELECT d.medicamento_id, 'valor_baixo_para_mg',
         concat_ws(' ', d.dose_min::text, d.dose_unidade)
  FROM base_medicamentos_dose d
  WHERE d.dose_unidade ~* '^mg' AND d.dose_min > 0 AND d.dose_min < 0.01
UNION ALL
  -- 4. Concentração sem unidade declarada
  SELECT a.id_medicamento, 'concentracao_sem_unidade', a.concentracao
  FROM base_apresentacoes_medicamentos a
  WHERE coalesce(a.concentracao,'') <> '' AND a.concentracao !~ '[A-Za-z]'
UNION ALL
  -- 5. Concentrações da mesma medicação divergindo mais de 100x
  SELECT x.id_medicamento, 'concentracoes_muito_divergentes',
         concat_ws(' vs ', min(x.txt), max(x.txt))
  FROM (
    SELECT a.id_medicamento, a.concentracao AS txt, public.fn_num_inicial(a.concentracao) AS v,
           lower(regexp_replace(coalesce(a.concentracao,''), '[0-9.,\s]', '', 'g')) AS un
    FROM base_apresentacoes_medicamentos a
    WHERE public.fn_num_inicial(a.concentracao) IS NOT NULL
  ) x
  GROUP BY x.id_medicamento, x.un
  HAVING max(x.v) > 100 * NULLIF(min(x.v), 0)
UNION ALL
  -- 6. Dose em volume sem concentração conhecida da apresentação
  SELECT d.medicamento_id, 'volume_sem_concentracao', d.dose_unidade
  FROM base_medicamentos_dose d
  JOIN base_apresentacoes_medicamentos a ON a.id = d.apresentacao_id
  WHERE d.dose_unidade ~* '^(ml|gota)'
    AND a.concentracao_mg_ml IS NULL
    AND public.fn_num_inicial(a.concentracao) IS NULL;

ALTER VIEW public.vw_alertas_qualidade_medicamento SET (security_invoker = on);

-- Status funcional por medicamento
CREATE OR REPLACE VIEW public.vw_medicamento_qualidade AS
WITH ap AS (
  SELECT id_medicamento AS med,
         count(*) AS total,
         count(*) FILTER (WHERE ativo IS NOT FALSE
                            AND coalesce(forma_farmaceutica,'') <> ''
                            AND coalesce(concentracao,'') <> '') AS utilizaveis,
         count(*) FILTER (WHERE status_revisao = 'revisado') AS revisadas
  FROM base_apresentacoes_medicamentos GROUP BY 1
), dz AS (
  SELECT medicamento_id AS med,
         count(*) AS total,
         count(*) FILTER (WHERE posologia_texto IS NOT NULL) AS com_texto,
         count(*) FILTER (WHERE status_revisao IN ('aprovado','revisado')
                            AND coalesce(dose_pendente_de_fonte,false) = false
                            AND posologia_texto IS NOT NULL) AS revisadas
  FROM base_medicamentos_dose GROUP BY 1
), al AS (
  SELECT medicamento_id AS med, count(*) AS alertas,
         array_agg(DISTINCT tipo) AS tipos
  FROM public.vw_alertas_qualidade_medicamento GROUP BY 1
)
SELECT m.id,
       m.principio_ativo,
       m.classe_terapeutica,
       m.ativo,
       coalesce(ap.total, 0)       AS apresentacoes,
       coalesce(ap.utilizaveis, 0) AS apresentacoes_utilizaveis,
       coalesce(ap.revisadas, 0)   AS apresentacoes_revisadas,
       coalesce(dz.total, 0)       AS doses,
       coalesce(dz.com_texto, 0)   AS doses_com_posologia,
       coalesce(dz.revisadas, 0)   AS doses_revisadas,
       coalesce(al.alertas, 0)     AS alertas_qualidade,
       coalesce(al.tipos, ARRAY[]::text[]) AS tipos_alerta,
       CASE
         WHEN coalesce(ap.utilizaveis,0) > 0 AND coalesce(ap.revisadas,0) > 0
              AND coalesce(dz.revisadas,0) > 0 AND coalesce(al.alertas,0) = 0 THEN 'completo'
         WHEN coalesce(ap.total,0) > 0 OR coalesce(dz.com_texto,0) > 0 THEN 'parcial'
         ELSE 'pendente'
       END AS status_funcional
FROM base_medicamentos_geral m
LEFT JOIN ap ON ap.med = m.id
LEFT JOIN dz ON dz.med = m.id
LEFT JOIN al ON al.med = m.id;

ALTER VIEW public.vw_medicamento_qualidade SET (security_invoker = on);

-- Resumo para o painel administrativo
CREATE OR REPLACE FUNCTION public.fn_auditoria_qualidade_farmacologica()
RETURNS jsonb LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT jsonb_build_object(
    'medicamentos_total',        (SELECT count(*) FROM vw_medicamento_qualidade),
    'completos',                 (SELECT count(*) FROM vw_medicamento_qualidade WHERE status_funcional='completo'),
    'parciais',                  (SELECT count(*) FROM vw_medicamento_qualidade WHERE status_funcional='parcial'),
    'pendentes',                 (SELECT count(*) FROM vw_medicamento_qualidade WHERE status_funcional='pendente'),
    'com_dose_revisada',         (SELECT count(*) FROM vw_medicamento_qualidade WHERE doses_revisadas>0),
    'sem_dose',                  (SELECT count(*) FROM vw_medicamento_qualidade WHERE doses=0),
    'com_apresentacao',          (SELECT count(*) FROM vw_medicamento_qualidade WHERE apresentacoes>0),
    'com_apresentacao_utilizavel',(SELECT count(*) FROM vw_medicamento_qualidade WHERE apresentacoes_utilizaveis>0),
    'sem_apresentacao',          (SELECT count(*) FROM vw_medicamento_qualidade WHERE apresentacoes=0),
    'multiplas_apresentacoes',   (SELECT count(*) FROM vw_medicamento_qualidade WHERE apresentacoes>1),
    'apresentacoes_pendentes',   (SELECT count(*) FROM base_apresentacoes_medicamentos WHERE status_revisao <> 'revisado'),
    'possiveis_erros_unidade',   (SELECT count(DISTINCT medicamento_id) FROM vw_alertas_qualidade_medicamento
                                   WHERE tipo IN ('dose_em_volume_forma_solida','valor_alto_para_gramas','valor_baixo_para_mg','volume_sem_concentracao')),
    'possiveis_erros_concentracao',(SELECT count(DISTINCT medicamento_id) FROM vw_alertas_qualidade_medicamento
                                   WHERE tipo IN ('concentracao_sem_unidade','concentracoes_muito_divergentes')),
    'precisam_revisao_clinica',  (SELECT count(*) FROM vw_medicamento_qualidade WHERE status_funcional<>'completo')
  );
$$;

-- Lista de pendências filtrável (admin)
CREATE OR REPLACE FUNCTION public.fn_pendencias_medicamentos(p_tipo text, p_limit int DEFAULT 300)
RETURNS TABLE (id uuid, principio_ativo text, classe_terapeutica text, status_funcional text, detalhe text)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT q.id, q.principio_ativo, q.classe_terapeutica, q.status_funcional,
         CASE
           WHEN p_tipo IN ('erro_unidade','erro_concentracao','alertas')
             THEN array_to_string(q.tipos_alerta, ', ')
           ELSE concat_ws(' · ',
                  q.apresentacoes || ' apresentação(ões)',
                  q.doses || ' dose(s)',
                  NULLIF(array_to_string(q.tipos_alerta, ', '), ''))
         END
  FROM vw_medicamento_qualidade q
  WHERE CASE p_tipo
          WHEN 'sem_dose'          THEN q.doses = 0
          WHEN 'sem_apresentacao'  THEN q.apresentacoes = 0
          WHEN 'parcial'           THEN q.status_funcional = 'parcial'
          WHEN 'pendente'          THEN q.status_funcional = 'pendente'
          WHEN 'completo'          THEN q.status_funcional = 'completo'
          WHEN 'multiplas_apresentacoes' THEN q.apresentacoes > 1
          WHEN 'erro_unidade'      THEN q.tipos_alerta && ARRAY['dose_em_volume_forma_solida','valor_alto_para_gramas','valor_baixo_para_mg','volume_sem_concentracao']
          WHEN 'erro_concentracao' THEN q.tipos_alerta && ARRAY['concentracao_sem_unidade','concentracoes_muito_divergentes']
          WHEN 'alertas'           THEN q.alertas_qualidade > 0
          ELSE true
        END
  ORDER BY q.principio_ativo
  LIMIT greatest(1, least(p_limit, 1000));
$$;

GRANT SELECT ON public.vw_medicamento_qualidade TO authenticated;
GRANT SELECT ON public.vw_alertas_qualidade_medicamento TO authenticated;