
DO $$ BEGIN
  CREATE TYPE iv_review_status_med AS ENUM ('rascunho','aguardando_revisao','revisado','precisa_corrigir','inativo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE iv_log_action AS ENUM ('criou','editou','importou','aprovou','solicitou_correcao','inativou','reativou');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.iv_medications
  ADD COLUMN IF NOT EXISTS status_revisao iv_review_status_med NOT NULL DEFAULT 'aguardando_revisao',
  ADD COLUMN IF NOT EXISTS criado_por uuid,
  ADD COLUMN IF NOT EXISTS revisado_por uuid,
  ADD COLUMN IF NOT EXISTS data_revisao timestamptz,
  ADD COLUMN IF NOT EXISTS observacao_revisao text;

DROP POLICY IF EXISTS "Revisors can update IV meds" ON public.iv_medications;
CREATE POLICY "Revisors can update IV meds" ON public.iv_medications
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'revisor'));

CREATE TABLE IF NOT EXISTS public.log_base_diluicao_iv (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_medicamento uuid,
  principio_ativo text NOT NULL,
  campo_alterado text,
  valor_anterior text,
  valor_novo text,
  usuario_responsavel uuid NOT NULL,
  data_hora timestamptz NOT NULL DEFAULT now(),
  tipo_acao iv_log_action NOT NULL
);

ALTER TABLE public.log_base_diluicao_iv ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin/revisor view IV log" ON public.log_base_diluicao_iv;
CREATE POLICY "Admin/revisor view IV log" ON public.log_base_diluicao_iv
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'revisor'));

DROP POLICY IF EXISTS "Users insert their own IV log" ON public.log_base_diluicao_iv;
CREATE POLICY "Users insert their own IV log" ON public.log_base_diluicao_iv
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_responsavel);

CREATE INDEX IF NOT EXISTS idx_log_iv_med ON public.log_base_diluicao_iv(id_medicamento);
CREATE INDEX IF NOT EXISTS idx_log_iv_data ON public.log_base_diluicao_iv(data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_iv_meds_status ON public.iv_medications(status_revisao);
