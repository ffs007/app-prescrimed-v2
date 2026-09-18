
-- ============================================================
-- Etapa 22C — Fase 1: Versionamento + tabelas de vínculos,
-- modelos rápidos, histórico/log de importação e configurações
-- ============================================================

-- 1) Versionamento em base_medicamentos_geral
ALTER TABLE public.base_medicamentos_geral
  ADD COLUMN IF NOT EXISTS versao INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS versao_anterior_id UUID REFERENCES public.base_medicamentos_geral(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS motivo_alteracao TEXT,
  ADD COLUMN IF NOT EXISTS atualizado_por UUID;

-- 2) Vínculos CID/Queixa
CREATE TABLE IF NOT EXISTS public.base_vinculos_cid_queixa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_medicamento UUID NOT NULL REFERENCES public.base_medicamentos_geral(id) ON DELETE CASCADE,
  principio_ativo TEXT NOT NULL,
  cid TEXT,
  descricao_cid TEXT,
  queixa TEXT,
  sindrome TEXT,
  protocolo TEXT,
  contexto medicamento_contexto_uso,
  prioridade_sugestao TEXT CHECK (prioridade_sugestao IN ('alta','media','baixa')),
  observacao_uso TEXT,
  fonte_referencia TEXT,
  status_revisao medicamento_status_revisao NOT NULL DEFAULT 'aguardando_revisao',
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bvcq_med ON public.base_vinculos_cid_queixa(id_medicamento);
CREATE INDEX IF NOT EXISTS idx_bvcq_cid ON public.base_vinculos_cid_queixa(cid);
CREATE INDEX IF NOT EXISTS idx_bvcq_status ON public.base_vinculos_cid_queixa(status_revisao);

ALTER TABLE public.base_vinculos_cid_queixa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth read base_vinculos_cid_queixa" ON public.base_vinculos_cid_queixa;
CREATE POLICY "Auth read base_vinculos_cid_queixa"
  ON public.base_vinculos_cid_queixa FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin/revisor insert base_vinculos_cid_queixa" ON public.base_vinculos_cid_queixa;
CREATE POLICY "Admin/revisor insert base_vinculos_cid_queixa"
  ON public.base_vinculos_cid_queixa FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'revisor'::app_role));

DROP POLICY IF EXISTS "Admin/revisor update base_vinculos_cid_queixa" ON public.base_vinculos_cid_queixa;
CREATE POLICY "Admin/revisor update base_vinculos_cid_queixa"
  ON public.base_vinculos_cid_queixa FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'revisor'::app_role));

DROP POLICY IF EXISTS "Admin delete base_vinculos_cid_queixa" ON public.base_vinculos_cid_queixa;
CREATE POLICY "Admin delete base_vinculos_cid_queixa"
  ON public.base_vinculos_cid_queixa FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_bvcq_updated
  BEFORE UPDATE ON public.base_vinculos_cid_queixa
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Modelos rápidos + itens
CREATE TABLE IF NOT EXISTS public.base_modelos_rapidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_modelo TEXT NOT NULL,
  categoria_modelo TEXT,
  contexto medicamento_contexto_uso,
  observacao TEXT,
  fonte_referencia TEXT,
  status_revisao medicamento_status_revisao NOT NULL DEFAULT 'rascunho',
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_por UUID,
  revisado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.base_modelos_rapidos_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_modelo UUID NOT NULL REFERENCES public.base_modelos_rapidos(id) ON DELETE CASCADE,
  id_medicamento UUID REFERENCES public.base_medicamentos_geral(id) ON DELETE SET NULL,
  principio_ativo TEXT NOT NULL,
  apresentacao TEXT,
  dose TEXT,
  unidade_dose TEXT,
  via TEXT,
  frequencia TEXT,
  duracao TEXT,
  observacao TEXT,
  obrigatorio BOOLEAN NOT NULL DEFAULT false,
  editavel BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  fonte_referencia TEXT,
  status_revisao medicamento_status_revisao NOT NULL DEFAULT 'aguardando_revisao',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bmri_modelo ON public.base_modelos_rapidos_itens(id_modelo);
CREATE INDEX IF NOT EXISTS idx_bmri_med ON public.base_modelos_rapidos_itens(id_medicamento);

ALTER TABLE public.base_modelos_rapidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.base_modelos_rapidos_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth read base_modelos_rapidos" ON public.base_modelos_rapidos;
CREATE POLICY "Auth read base_modelos_rapidos"
  ON public.base_modelos_rapidos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin/revisor insert base_modelos_rapidos" ON public.base_modelos_rapidos;
CREATE POLICY "Admin/revisor insert base_modelos_rapidos"
  ON public.base_modelos_rapidos FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'revisor'::app_role));

DROP POLICY IF EXISTS "Admin/revisor update base_modelos_rapidos" ON public.base_modelos_rapidos;
CREATE POLICY "Admin/revisor update base_modelos_rapidos"
  ON public.base_modelos_rapidos FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'revisor'::app_role));

DROP POLICY IF EXISTS "Admin delete base_modelos_rapidos" ON public.base_modelos_rapidos;
CREATE POLICY "Admin delete base_modelos_rapidos"
  ON public.base_modelos_rapidos FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Auth read base_modelos_rapidos_itens" ON public.base_modelos_rapidos_itens;
CREATE POLICY "Auth read base_modelos_rapidos_itens"
  ON public.base_modelos_rapidos_itens FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin/revisor insert base_modelos_rapidos_itens" ON public.base_modelos_rapidos_itens;
CREATE POLICY "Admin/revisor insert base_modelos_rapidos_itens"
  ON public.base_modelos_rapidos_itens FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'revisor'::app_role));

DROP POLICY IF EXISTS "Admin/revisor update base_modelos_rapidos_itens" ON public.base_modelos_rapidos_itens;
CREATE POLICY "Admin/revisor update base_modelos_rapidos_itens"
  ON public.base_modelos_rapidos_itens FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'revisor'::app_role));

DROP POLICY IF EXISTS "Admin delete base_modelos_rapidos_itens" ON public.base_modelos_rapidos_itens;
CREATE POLICY "Admin delete base_modelos_rapidos_itens"
  ON public.base_modelos_rapidos_itens FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_bmr_updated
  BEFORE UPDATE ON public.base_modelos_rapidos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_bmri_updated
  BEFORE UPDATE ON public.base_modelos_rapidos_itens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Histórico de importações
CREATE TABLE IF NOT EXISTS public.historico_importacao_medicamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  arquivo_nome TEXT NOT NULL,
  usuario_responsavel UUID,
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_linhas INTEGER NOT NULL DEFAULT 0,
  medicamentos_importados INTEGER NOT NULL DEFAULT 0,
  apresentacoes_importadas INTEGER NOT NULL DEFAULT 0,
  vinculos_importados INTEGER NOT NULL DEFAULT 0,
  modelos_importados INTEGER NOT NULL DEFAULT 0,
  linhas_com_erro INTEGER NOT NULL DEFAULT 0,
  linhas_com_alerta INTEGER NOT NULL DEFAULT 0,
  duplicados_detectados INTEGER NOT NULL DEFAULT 0,
  registros_atualizados INTEGER NOT NULL DEFAULT 0,
  registros_ignorados INTEGER NOT NULL DEFAULT 0,
  status_importacao TEXT NOT NULL DEFAULT 'pre_validada'
    CHECK (status_importacao IN ('pre_validada','importada_parcialmente','importada_com_sucesso','cancelada','erro')),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.historico_importacao_medicamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read historico_importacao" ON public.historico_importacao_medicamentos;
CREATE POLICY "Admin read historico_importacao"
  ON public.historico_importacao_medicamentos FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'revisor'::app_role));

DROP POLICY IF EXISTS "Admin insert historico_importacao" ON public.historico_importacao_medicamentos;
CREATE POLICY "Admin insert historico_importacao"
  ON public.historico_importacao_medicamentos FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'revisor'::app_role));

DROP POLICY IF EXISTS "Admin update historico_importacao" ON public.historico_importacao_medicamentos;
CREATE POLICY "Admin update historico_importacao"
  ON public.historico_importacao_medicamentos FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 5) Log detalhado de importação
CREATE TABLE IF NOT EXISTS public.log_importacao_medicamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_importacao UUID NOT NULL REFERENCES public.historico_importacao_medicamentos(id) ON DELETE CASCADE,
  aba TEXT NOT NULL,
  linha INTEGER,
  tipo_registro TEXT,
  principio_ativo TEXT,
  acao_realizada TEXT,
  campo TEXT,
  valor_anterior TEXT,
  valor_novo TEXT,
  mensagem TEXT,
  gravidade TEXT NOT NULL DEFAULT 'info' CHECK (gravidade IN ('info','alerta','erro')),
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_log_imp_importacao ON public.log_importacao_medicamentos(id_importacao);
CREATE INDEX IF NOT EXISTS idx_log_imp_gravidade ON public.log_importacao_medicamentos(gravidade);

ALTER TABLE public.log_importacao_medicamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read log_importacao" ON public.log_importacao_medicamentos;
CREATE POLICY "Admin read log_importacao"
  ON public.log_importacao_medicamentos FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'revisor'::app_role));

DROP POLICY IF EXISTS "Admin insert log_importacao" ON public.log_importacao_medicamentos;
CREATE POLICY "Admin insert log_importacao"
  ON public.log_importacao_medicamentos FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'revisor'::app_role));

-- 6) Configurações da importação (chave/valor singleton-like)
CREATE TABLE IF NOT EXISTS public.config_importacao_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descricao TEXT,
  atualizado_por UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.config_importacao_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth read config_importacao_base" ON public.config_importacao_base;
CREATE POLICY "Auth read config_importacao_base"
  ON public.config_importacao_base FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin write config_importacao_base" ON public.config_importacao_base;
CREATE POLICY "Admin write config_importacao_base"
  ON public.config_importacao_base FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_config_importacao_base_updated
  BEFORE UPDATE ON public.config_importacao_base
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed das 7 configurações padrão (seção 26)
INSERT INTO public.config_importacao_base (chave, valor, descricao) VALUES
  ('permitir_nao_revisados_prescricao', 'permitir_com_aviso', 'Permitir uso de medicamentos não revisados na prescrição (nao_permitir|permitir_com_aviso|admin_apenas)'),
  ('mostrar_rascunhos_busca_medico', 'false', 'Mostrar rascunhos na busca do médico'),
  ('exigir_fonte_para_revisado', 'true', 'Exigir fonte_referencia para marcar registro como revisado'),
  ('criar_versao_ao_alterar_revisado', 'true', 'Criar nova versão ao alterar registro revisado'),
  ('bloquear_sobrescrita_revisado_importacao', 'true', 'Bloquear sobrescrita de registro revisado por importação'),
  ('permitir_importacao_incremental', 'true', 'Permitir importação incremental (não apaga existentes)'),
  ('status_padrao_importacao', 'rascunho', 'Status padrão de registros importados (rascunho|aguardando_revisao)')
ON CONFLICT (chave) DO NOTHING;
