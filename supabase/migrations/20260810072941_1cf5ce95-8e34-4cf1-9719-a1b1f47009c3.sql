
CREATE TABLE public.stg_protocolo_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  nome_patologia text NOT NULL,
  etapa_ordem integer NOT NULL DEFAULT 1,
  etapa_titulo text NOT NULL,
  item_tipo text NOT NULL DEFAULT 'conduta',
  item_nome text NOT NULL,
  detalhe text,
  obrigatoriedade text DEFAULT 'recomendado',
  tempo_alvo_min integer,
  observacao text,
  fonte_id text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lote_id, nome_patologia, etapa_titulo, item_nome)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stg_protocolo_checklist TO authenticated;
GRANT ALL ON public.stg_protocolo_checklist TO service_role;
ALTER TABLE public.stg_protocolo_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY stg_admin_only ON public.stg_protocolo_checklist FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_stg_protocolo_checklist_updated BEFORE UPDATE ON public.stg_protocolo_checklist
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.stg_med_posologia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  principio_ativo text NOT NULL,
  indicacao text,
  populacao text DEFAULT 'adulto',
  via text NOT NULL,
  dose_padrao text NOT NULL,
  frequencia text,
  dose_maxima text,
  diluicao_padrao text,
  ajuste_renal text,
  ajuste_hepatico text,
  ajuste_idoso text,
  ajuste_pediatrico text,
  restricoes text,
  alto_risco boolean NOT NULL DEFAULT false,
  fonte_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lote_id, principio_ativo, indicacao, via, populacao)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stg_med_posologia TO authenticated;
GRANT ALL ON public.stg_med_posologia TO service_role;
ALTER TABLE public.stg_med_posologia ENABLE ROW LEVEL SECURITY;
CREATE POLICY stg_admin_only ON public.stg_med_posologia FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_stg_med_posologia_updated BEFORE UPDATE ON public.stg_med_posologia
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.stg_med_exames_monitoramento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  principio_ativo text NOT NULL,
  nome_exame text NOT NULL,
  tipo_monitoramento text NOT NULL DEFAULT 'durante',
  obrigatoriedade text NOT NULL DEFAULT 'recomendado',
  frequencia text,
  parametro_alvo text,
  conduta_se_alterado text,
  fonte_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lote_id, principio_ativo, nome_exame, tipo_monitoramento)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stg_med_exames_monitoramento TO authenticated;
GRANT ALL ON public.stg_med_exames_monitoramento TO service_role;
ALTER TABLE public.stg_med_exames_monitoramento ENABLE ROW LEVEL SECURITY;
CREATE POLICY stg_admin_only ON public.stg_med_exames_monitoramento FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_stg_med_exames_monit_updated BEFORE UPDATE ON public.stg_med_exames_monitoramento
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_stg_protocolo_checklist_pat ON public.stg_protocolo_checklist (lote_id, nome_patologia, etapa_ordem);
CREATE INDEX idx_stg_med_posologia_pa ON public.stg_med_posologia (lote_id, principio_ativo);
CREATE INDEX idx_stg_med_exames_monit_pa ON public.stg_med_exames_monitoramento (lote_id, principio_ativo);
