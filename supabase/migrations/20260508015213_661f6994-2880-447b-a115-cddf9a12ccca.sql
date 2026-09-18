-- Status enum for texts
DO $$ BEGIN
  CREATE TYPE public.iv_text_status AS ENUM ('gerado_automaticamente','aguardando_revisao','revisado','precisa_ajuste','manual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.iv_text_action AS ENUM ('gerou_texto','editou_texto','aprovou_texto','marcou_precisa_ajuste','substituiu_por_manual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.iv_medications
  ADD COLUMN IF NOT EXISTS orientacao_resumida_prescricao text,
  ADD COLUMN IF NOT EXISTS orientacao_para_impressao text,
  ADD COLUMN IF NOT EXISTS mensagem_revisao_seguranca_iv text,
  ADD COLUMN IF NOT EXISTS texto_gerado_automaticamente boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_geracao_texto timestamptz,
  ADD COLUMN IF NOT EXISTS texto_revisado_por uuid,
  ADD COLUMN IF NOT EXISTS data_revisao_texto timestamptz,
  ADD COLUMN IF NOT EXISTS status_texto public.iv_text_status;

CREATE TABLE IF NOT EXISTS public.log_textos_diluicao_iv (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_medicamento uuid,
  principio_ativo text NOT NULL,
  campo_texto_alterado text NOT NULL,
  valor_anterior text,
  valor_novo text,
  tipo_acao public.iv_text_action NOT NULL,
  usuario_responsavel uuid NOT NULL,
  data_hora timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.log_textos_diluicao_iv ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/revisor view IV text log"
  ON public.log_textos_diluicao_iv FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'revisor'));

CREATE POLICY "Users insert their own IV text log"
  ON public.log_textos_diluicao_iv FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_responsavel);

CREATE INDEX IF NOT EXISTS idx_log_textos_iv_med ON public.log_textos_diluicao_iv(id_medicamento);