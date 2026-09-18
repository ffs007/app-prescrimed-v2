CREATE TABLE IF NOT EXISTS public.stg_escores_clinicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  linha_origem text,
  nome_escore text NOT NULL,
  sinonimos text,
  especialidade text,
  populacao_alvo text,
  finalidade text,
  entradas jsonb,
  calculo_formula text,
  faixas_interpretacao jsonb,
  conduta_associada text,
  nao_usar_para text,
  versao text,
  fonte_id text,
  trecho_citado text,
  processado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stg_escores_clinicos TO authenticated;
GRANT ALL ON public.stg_escores_clinicos TO service_role;
ALTER TABLE public.stg_escores_clinicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins gerenciam stg_escores_clinicos"
  ON public.stg_escores_clinicos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_stg_escores_clinicos_updated
  BEFORE UPDATE ON public.stg_escores_clinicos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS idx_stg_escores_clinicos_lote ON public.stg_escores_clinicos (lote_id);
CREATE INDEX IF NOT EXISTS idx_stg_escores_clinicos_nome ON public.stg_escores_clinicos (nome_escore);

CREATE TABLE IF NOT EXISTS public.stg_escore_gatilhos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  linha_origem text,
  escore_nome text NOT NULL,
  faixa text,
  gatilho text,
  conduta text,
  nivel_gate text,
  prazo text,
  fonte_id text,
  trecho_citado text,
  processado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stg_escore_gatilhos TO authenticated;
GRANT ALL ON public.stg_escore_gatilhos TO service_role;
ALTER TABLE public.stg_escore_gatilhos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins gerenciam stg_escore_gatilhos"
  ON public.stg_escore_gatilhos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_stg_escore_gatilhos_updated
  BEFORE UPDATE ON public.stg_escore_gatilhos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS idx_stg_escore_gatilhos_lote ON public.stg_escore_gatilhos (lote_id);
CREATE INDEX IF NOT EXISTS idx_stg_escore_gatilhos_escore ON public.stg_escore_gatilhos (escore_nome);

ALTER TABLE public.audit_escores_clinicos
  ADD COLUMN IF NOT EXISTS versao text,
  ADD COLUMN IF NOT EXISTS resultado numeric,
  ADD COLUMN IF NOT EXISTS red_flag_override boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS conduta_real text,
  ADD COLUMN IF NOT EXISTS divergencia boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS motivo_override text,
  ADD COLUMN IF NOT EXISTS profissional text,
  ADD COLUMN IF NOT EXISTS revisao_humana boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS lote_id text;

CREATE INDEX IF NOT EXISTS idx_audit_escores_atendimento ON public.audit_escores_clinicos (atendimento_id);
CREATE INDEX IF NOT EXISTS idx_audit_escores_nome ON public.audit_escores_clinicos (nome_escore);
CREATE INDEX IF NOT EXISTS idx_audit_escores_data ON public.audit_escores_clinicos (data_hora);

CREATE OR REPLACE VIEW public.vw_escores_taxa_populacao_correta
WITH (security_invoker = true) AS
SELECT
  nome_escore,
  count(*) AS total_calculos,
  count(*) FILTER (WHERE populacao_validada) AS populacao_valida,
  count(*) FILTER (WHERE NOT populacao_validada) AS populacao_invalida,
  round(100.0 * count(*) FILTER (WHERE populacao_validada) / nullif(count(*), 0), 1) AS taxa_validacao_pct
FROM public.audit_escores_clinicos
GROUP BY nome_escore
ORDER BY 5 ASC;

CREATE OR REPLACE VIEW public.vw_escores_overrides
WITH (security_invoker = true) AS
SELECT
  nome_escore,
  count(*) AS total_calculos,
  count(*) FILTER (WHERE red_flag_override) AS overrides,
  round(100.0 * count(*) FILTER (WHERE red_flag_override) / nullif(count(*), 0), 1) AS taxa_override_pct
FROM public.audit_escores_clinicos
GROUP BY nome_escore
ORDER BY 4 DESC;

CREATE OR REPLACE VIEW public.vw_escores_divergencias
WITH (security_invoker = true) AS
SELECT
  atendimento_id,
  nome_escore,
  resultado,
  categoria,
  conduta_sugerida,
  conduta_real,
  motivo_override,
  data_hora
FROM public.audit_escores_clinicos
WHERE divergencia = true
ORDER BY data_hora DESC;

CREATE OR REPLACE VIEW public.vw_escores_resumo_global
WITH (security_invoker = true) AS
SELECT
  count(DISTINCT e.nome_escore) AS total_escores_catalogados,
  count(DISTINCT i.id) AS total_itens,
  count(DISTINCT g.id) AS total_gatilhos,
  count(DISTINCT a.atendimento_id) AS total_atendimentos_auditados,
  count(DISTINCT a.atendimento_id) FILTER (WHERE a.red_flag_override) AS atendimentos_com_override,
  count(DISTINCT a.atendimento_id) FILTER (WHERE a.divergencia) AS atendimentos_com_divergencia
FROM public.stg_escores_clinicos e
LEFT JOIN public.stg_escore_itens i ON i.escore_nome = e.nome_escore AND i.lote_id = e.lote_id
LEFT JOIN public.stg_escore_gatilhos g ON g.escore_nome = e.nome_escore AND g.lote_id = e.lote_id
LEFT JOIN public.audit_escores_clinicos a ON a.nome_escore = e.nome_escore;