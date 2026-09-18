UPDATE public.stg_med_apresentacao s SET principio_ativo = g.principio_ativo
FROM public.base_medicamentos_geral g
WHERE public.med_normalizar_principio(g.principio_ativo) = 'dipirona'
  AND public.med_normalizar_principio(s.principio_ativo) = 'dipirona monoidratada'
  AND s.processado = false;

UPDATE public.stg_med_apresentacao s SET principio_ativo = g.principio_ativo
FROM public.base_medicamentos_geral g
WHERE public.med_normalizar_principio(g.principio_ativo) = 'enoxaparina'
  AND public.med_normalizar_principio(s.principio_ativo) = 'enoxaparina sodica'
  AND s.processado = false;

UPDATE public.stg_med_apresentacao s SET principio_ativo = g.principio_ativo
FROM public.base_medicamentos_geral g
WHERE public.med_normalizar_principio(g.principio_ativo) = 'fentanil'
  AND public.med_normalizar_principio(s.principio_ativo) = 'fentanila'
  AND s.processado = false;

UPDATE public.stg_med_apresentacao s SET principio_ativo = g.principio_ativo
FROM public.base_medicamentos_geral g
WHERE public.med_normalizar_principio(g.principio_ativo) = 'heparina nao fracionada'
  AND public.med_normalizar_principio(s.principio_ativo) IN ('heparina sodica','heparina')
  AND s.processado = false;

INSERT INTO public.base_medicamentos_geral (
  principio_ativo, principio_ativo_en, classe_terapeutica, subclasse_terapeutica,
  categoria_clinica, forma_farmaceutica, via_administracao, exige_peso, exige_ajuste_renal,
  alerta_gestacao, alerta_lactacao, status_revisao, fonte_referencia, ativo, lote_id, alto_risco
)
SELECT v.principio_ativo, v.principio_ativo_en, v.classe_terapeutica, v.subclasse_terapeutica,
  v.categoria_clinica::medicamento_categoria_clinica, v.forma_farmaceutica, v.via_administracao,
  v.exige_peso, v.exige_ajuste_renal,
  v.alerta_gestacao::medicamento_alerta_gest_lact, v.alerta_lactacao::medicamento_alerta_gest_lact,
  'aguardando_revisao', 'ANVISA/Bulário', true, 'med_apresentacao_v1', v.alto_risco
FROM (VALUES
  ('albumina humana','human albumin','colóide','solução colóide','hidratacao_eletrolitos','solução injetável','intravenosa',true,false,'sem_dados','sem_dados',false),
  ('manitol','mannitol','diurético osmótico','diurético osmótico','hidratacao_eletrolitos','solução injetável','intravenosa',true,true,'sem_dados','sem_dados',false)
) AS v(principio_ativo, principio_ativo_en, classe_terapeutica, subclasse_terapeutica,
       categoria_clinica, forma_farmaceutica, via_administracao, exige_peso, exige_ajuste_renal,
       alerta_gestacao, alerta_lactacao, alto_risco)
WHERE NOT EXISTS (
  SELECT 1 FROM public.base_medicamentos_geral g
  WHERE public.med_normalizar_principio(g.principio_ativo) = public.med_normalizar_principio(v.principio_ativo)
);