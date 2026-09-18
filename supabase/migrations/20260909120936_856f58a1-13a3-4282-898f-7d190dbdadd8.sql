CREATE OR REPLACE FUNCTION public.fn_auditoria_qualidade_farmacologica()
RETURNS jsonb LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT jsonb_build_object(
    'medicamentos_total',        (SELECT count(*) FROM vw_medicamento_qualidade),
    'completos',                 (SELECT count(*) FROM vw_medicamento_qualidade WHERE status_funcional='completo'),
    'parciais',                  (SELECT count(*) FROM vw_medicamento_qualidade WHERE status_funcional='parcial'),
    'pendentes',                 (SELECT count(*) FROM vw_medicamento_qualidade WHERE status_funcional='pendente'),
    'funcionalmente_prontos',    (SELECT count(*) FROM vw_medicamento_qualidade
                                   WHERE apresentacoes_utilizaveis>0 AND doses_com_posologia>0 AND alertas_qualidade=0),
    'com_dose',                  (SELECT count(*) FROM vw_medicamento_qualidade WHERE doses>0),
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
          WHEN 'funcionalmente_prontos' THEN q.apresentacoes_utilizaveis > 0 AND q.doses_com_posologia > 0 AND q.alertas_qualidade = 0
          WHEN 'multiplas_apresentacoes' THEN q.apresentacoes > 1
          WHEN 'erro_unidade'      THEN q.tipos_alerta && ARRAY['dose_em_volume_forma_solida','valor_alto_para_gramas','valor_baixo_para_mg','volume_sem_concentracao']
          WHEN 'erro_concentracao' THEN q.tipos_alerta && ARRAY['concentracao_sem_unidade','concentracoes_muito_divergentes']
          WHEN 'alertas'           THEN q.alertas_qualidade > 0
          ELSE true
        END
  ORDER BY q.principio_ativo
  LIMIT greatest(1, least(p_limit, 1000));
$$;