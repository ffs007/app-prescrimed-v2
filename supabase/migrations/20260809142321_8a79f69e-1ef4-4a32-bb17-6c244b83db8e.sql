CREATE OR REPLACE VIEW public.vw_ps_prescricoes_calculaveis
WITH (security_invoker = true) AS
SELECT
  d.principio_ativo,
  d.via,
  d.indicacao,
  d.populacao,
  d.dose_min,
  d.dose_max,
  d.dose_unidade,
  CASE
    WHEN d.dose_min IS NOT NULL AND d.dose_max IS NOT NULL
         AND d.dose_unidade IS NOT NULL
         AND (d.dose_pendente_de_fonte IS NULL OR d.dose_pendente_de_fonte = false)
    THEN true ELSE false
  END AS calculavel,
  d.fonte_id
FROM public.base_medicamentos_dose d;

CREATE OR REPLACE VIEW public.vw_ps_interacoes_criticas
WITH (security_invoker = true) AS
SELECT
  i.principio_ativo_a,
  i.principio_ativo_b,
  i.mecanismo,
  i.efeito_clinico,
  i.gravidade,
  i.conduta,
  i.fonte_id
FROM public.base_medicamentos_interacoes i
WHERE i.gravidade IN ('maior', 'critica');

CREATE OR REPLACE VIEW public.vw_ps_sinais_alarme_criticos
WITH (security_invoker = true) AS
SELECT
  s.sistema,
  s.descricao_sinal_medico,
  s.descricao_sinal_paciente,
  s.gravidade,
  s.conduta,
  s.tempo_maximo_acao_horas
FROM public.base_sinais_alarme s
WHERE s.gravidade = 'critico';