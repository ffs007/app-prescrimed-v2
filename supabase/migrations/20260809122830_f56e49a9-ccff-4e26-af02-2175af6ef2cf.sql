CREATE TABLE IF NOT EXISTS public.stg_sinais_alarme (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  linha_origem text,
  sistema text,
  descricao_sinal_medico text,
  descricao_sinal_paciente text,
  gravidade text,
  conduta text,
  tempo_maximo_acao_horas text,
  fonte_id text,
  trecho_citado text,
  importado_em timestamptz DEFAULT now(),
  processado boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.stg_escores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  linha_origem text,
  nome_escore text,
  sigla text,
  tipo text,
  dominio text,
  populacao text,
  faixa_etaria text,
  n_itens text,
  tempo_aplicacao_min text,
  validacao_ptbr text,
  referencia_validacao text,
  pontos_corte text,
  desempenho text,
  evidencia text,
  fonte_id text,
  trecho_citado text,
  importado_em timestamptz DEFAULT now(),
  processado boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.stg_escore_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  linha_origem text,
  escore_nome text,
  ordem text,
  descricao text,
  pontuacao text,
  observacao text,
  importado_em timestamptz DEFAULT now(),
  processado boolean DEFAULT false
);

ALTER TABLE public.stg_patologias
  ADD COLUMN IF NOT EXISTS importado_em timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS processado boolean DEFAULT false;

ALTER TABLE public.stg_exames
  ADD COLUMN IF NOT EXISTS importado_em timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS processado boolean DEFAULT false;

ALTER TABLE public.stg_patologia_exames
  ADD COLUMN IF NOT EXISTS momento_solicitacao text,
  ADD COLUMN IF NOT EXISTS importado_em timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS processado boolean DEFAULT false;

UPDATE public.stg_patologia_exames
  SET momento_solicitacao = momento_solicitation
  WHERE momento_solicitacao IS NULL AND momento_solicitation IS NOT NULL;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['stg_sinais_alarme','stg_escores','stg_escore_itens'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "admin_all_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "admin_all_%s" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(),''admin'')) WITH CHECK (public.has_role(auth.uid(),''admin''))', t, t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_lote ON public.%I (lote_id)', t, t);
  END LOOP;
END $$;