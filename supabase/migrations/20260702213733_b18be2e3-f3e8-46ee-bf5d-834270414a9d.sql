
-- Etapa 22F: Qualidade da Base Medicamentosa

-- 1. Configurações (singleton por instalação)
CREATE TABLE public.qualidade_base_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton BOOLEAN NOT NULL DEFAULT true UNIQUE,
  revisao_ao_importar BOOLEAN NOT NULL DEFAULT true,
  revisao_ao_editar BOOLEAN NOT NULL DEFAULT true,
  bloquear_beta_com_erro_critico BOOLEAN NOT NULL DEFAULT true,
  bloquear_revisado_sem_fonte BOOLEAN NOT NULL DEFAULT true,
  permitir_ignorar_com_justificativa BOOLEAN NOT NULL DEFAULT true,
  sugerir_termos_busca BOOLEAN NOT NULL DEFAULT true,
  criar_tarefa_para_critico BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.qualidade_base_configs TO authenticated;
GRANT ALL ON public.qualidade_base_configs TO service_role;

ALTER TABLE public.qualidade_base_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam configs qualidade base"
  ON public.qualidade_base_configs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Autenticados leem configs qualidade base"
  ON public.qualidade_base_configs FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER trg_qualidade_configs_updated
  BEFORE UPDATE ON public.qualidade_base_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Semente da linha única
INSERT INTO public.qualidade_base_configs (singleton) VALUES (true)
  ON CONFLICT (singleton) DO NOTHING;

-- 2. Ignorados com justificativa
CREATE TABLE public.qualidade_base_ignoradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_key TEXT NOT NULL UNIQUE,
  medicamento_id UUID REFERENCES public.base_medicamentos_geral(id) ON DELETE CASCADE,
  rule_code TEXT NOT NULL,
  ref_id TEXT,
  justificativa TEXT NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.qualidade_base_ignoradas TO authenticated;
GRANT ALL ON public.qualidade_base_ignoradas TO service_role;

ALTER TABLE public.qualidade_base_ignoradas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem ignoradas"
  ON public.qualidade_base_ignoradas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins gravam ignoradas"
  ON public.qualidade_base_ignoradas FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins editam ignoradas"
  ON public.qualidade_base_ignoradas FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins removem ignoradas"
  ON public.qualidade_base_ignoradas FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_qualidade_ignoradas_med ON public.qualidade_base_ignoradas(medicamento_id);
CREATE INDEX idx_qualidade_ignoradas_rule ON public.qualidade_base_ignoradas(rule_code);

CREATE TRIGGER trg_qualidade_ignoradas_updated
  BEFORE UPDATE ON public.qualidade_base_ignoradas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Log de ações de qualidade
CREATE TABLE public.log_qualidade_base_medicamentosa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicamento_id UUID REFERENCES public.base_medicamentos_geral(id) ON DELETE SET NULL,
  principio_ativo TEXT,
  rule_code TEXT NOT NULL,
  tipo_problema TEXT,
  gravidade TEXT NOT NULL CHECK (gravidade IN ('critico','alto','medio','leve','sugestao','info')),
  mensagem TEXT,
  acao TEXT NOT NULL CHECK (acao IN (
    'detectado','corrigido','ignorado_com_justificativa','enviado_para_revisao',
    'marcado_precisa_corrigir','mesclado','inativado','exportado','sugestao_termo_criada'
  )),
  justificativa TEXT,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.log_qualidade_base_medicamentosa TO authenticated;
GRANT ALL ON public.log_qualidade_base_medicamentosa TO service_role;

ALTER TABLE public.log_qualidade_base_medicamentosa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins leem log qualidade"
  ON public.log_qualidade_base_medicamentosa FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Autenticados gravam log qualidade"
  ON public.log_qualidade_base_medicamentosa FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_log_qualidade_med ON public.log_qualidade_base_medicamentosa(medicamento_id);
CREATE INDEX idx_log_qualidade_created ON public.log_qualidade_base_medicamentosa(created_at DESC);
