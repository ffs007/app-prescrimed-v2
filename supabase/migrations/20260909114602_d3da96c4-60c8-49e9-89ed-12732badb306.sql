CREATE OR REPLACE FUNCTION public.fn_auditoria_base_clinica()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'medicamentos_total',        (SELECT count(*) FROM public.base_medicamentos_geral),
    'medicamentos_ativos',       (SELECT count(*) FROM public.base_medicamentos_geral WHERE ativo AND status_revisao <> 'inativo'),
    'com_apresentacao',          (SELECT count(*) FROM public.vw_medicamento_completo WHERE NOT apresentacao_incompleta),
    'com_dose',                  (SELECT count(*) FROM public.vw_medicamento_completo WHERE NOT dose_incompleta),
    'sem_dose',                  (SELECT count(*) FROM public.vw_medicamento_completo WHERE dose_incompleta),
    'sem_apresentacao',          (SELECT count(*) FROM public.vw_medicamento_completo WHERE apresentacao_incompleta),
    'vinculados_a_quadros',      (SELECT count(DISTINCT medicamento_id) FROM public.patologia_medicamento WHERE medicamento_id IS NOT NULL),
    'medicamentos_orfaos',       (SELECT count(*) FROM public.base_medicamentos_geral m
                                   WHERE NOT EXISTS (SELECT 1 FROM public.patologia_medicamento p WHERE p.medicamento_id = m.id)
                                     AND NOT EXISTS (SELECT 1 FROM public.sindrome_medicamento s WHERE s.medicamento_id = m.id)),
    'apresentacoes_orfas',       (SELECT count(*) FROM public.base_apresentacoes_medicamentos a
                                   LEFT JOIN public.base_medicamentos_geral m ON m.id = a.id_medicamento WHERE m.id IS NULL),
    'doses_sem_medicamento',     (SELECT count(*) FROM public.base_medicamentos_dose WHERE medicamento_id IS NULL),
    'vinculos_patologia_total',  (SELECT count(*) FROM public.patologia_medicamento),
    'vinculos_patologia_ativos', (SELECT count(*) FROM public.patologia_medicamento WHERE status_revisao = 'aprovado'),
    'vinculos_sindrome_total',   (SELECT count(*) FROM public.sindrome_medicamento),
    'vinculos_sindrome_ativos',  (SELECT count(*) FROM public.sindrome_medicamento WHERE status_revisao = 'aprovado'),
    'vinculos_quebrados',        (SELECT count(*) FROM public.patologia_medicamento p
                                   LEFT JOIN public.base_medicamentos_geral m ON m.id = p.medicamento_id WHERE m.id IS NULL),
    'condicoes_com_sugestao',    (SELECT count(DISTINCT patologia_normalizada) FROM public.patologia_medicamento WHERE status_revisao = 'aprovado'),
    'condicoes_sem_sugestao',    (SELECT count(*) FROM public.base_patologias_clinicas c
                                   WHERE NOT EXISTS (SELECT 1 FROM public.patologia_medicamento p
                                                     WHERE p.patologia_normalizada = public.clin_normalize(c.nome_patologia)
                                                       AND p.status_revisao = 'aprovado')),
    'duplicidades_medicamento',  (SELECT count(*) FROM (SELECT public.clin_normalize(principio_ativo) n
                                   FROM public.base_medicamentos_geral GROUP BY 1 HAVING count(*) > 1) x),
    'lacunas_registradas',       (SELECT count(*) FROM public.auditoria_sugestoes_lacunas)
  );
$$;

GRANT EXECUTE ON FUNCTION public.fn_auditoria_base_clinica() TO authenticated, service_role;

-- Lista de quadros clínicos sem conduta revisada (para o painel admin)
CREATE OR REPLACE FUNCTION public.fn_auditoria_condicoes_sem_sugestao(p_limit int DEFAULT 200)
RETURNS TABLE (nome text, sistema text)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT c.nome_patologia::text, c.categoria_clinica::text
  FROM public.base_patologias_clinicas c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.patologia_medicamento p
    WHERE p.patologia_normalizada = public.clin_normalize(c.nome_patologia)
      AND p.status_revisao = 'aprovado'
  )
  ORDER BY c.nome_patologia
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.fn_auditoria_condicoes_sem_sugestao(int) TO authenticated, service_role;