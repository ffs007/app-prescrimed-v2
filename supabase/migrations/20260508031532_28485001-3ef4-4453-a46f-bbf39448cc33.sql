
-- Enums
CREATE TYPE public.template_visibility AS ENUM ('pessoal','equipe','institucional');
CREATE TYPE public.template_review_status AS ENUM ('rascunho','aguardando_revisao','revisado','precisa_corrigir','inativo');
CREATE TYPE public.template_type AS ENUM ('prescricao','exames','orientacoes','cuidados_enfermagem','misto','protocolo_rapido','alta','internacao','urgencia','pediatrico');
CREATE TYPE public.template_context AS ENUM ('urgencia','enfermaria','ambulatorio','pronto_atendimento','telemedicina','hospitalar','pediatria','obstetricia','geral');
CREATE TYPE public.quickset_category AS ENUM ('medicamentos','exames','orientacoes','cuidados','misto');
CREATE TYPE public.template_log_action AS ENUM ('aberto','aplicado','item_editado','item_removido','alerta_gerado','justificativa_registrada','salvo_de_prescricao');

-- favoritos_medicamentos
CREATE TABLE public.favoritos_medicamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID NOT NULL,
  principio_ativo TEXT NOT NULL,
  nome_medicamento TEXT,
  apresentacao TEXT,
  via TEXT,
  dose_padrao TEXT,
  unidade_dose TEXT,
  frequencia_padrao TEXT,
  duracao_padrao TEXT,
  observacoes_padrao TEXT,
  contexto_uso TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.favoritos_medicamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner select favoritos" ON public.favoritos_medicamentos FOR SELECT TO authenticated USING (auth.uid() = id_usuario);
CREATE POLICY "Owner insert favoritos" ON public.favoritos_medicamentos FOR INSERT TO authenticated WITH CHECK (auth.uid() = id_usuario);
CREATE POLICY "Owner update favoritos" ON public.favoritos_medicamentos FOR UPDATE TO authenticated USING (auth.uid() = id_usuario);
CREATE POLICY "Owner delete favoritos" ON public.favoritos_medicamentos FOR DELETE TO authenticated USING (auth.uid() = id_usuario);

-- conjuntos_rapidos
CREATE TABLE public.conjuntos_rapidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_conjunto TEXT NOT NULL,
  descricao TEXT,
  categoria public.quickset_category NOT NULL DEFAULT 'misto',
  contexto_atendimento public.template_context NOT NULL DEFAULT 'geral',
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  criado_por UUID,
  visibilidade public.template_visibility NOT NULL DEFAULT 'pessoal',
  status_revisao public.template_review_status NOT NULL DEFAULT 'rascunho',
  fonte_referencia TEXT,
  data_atualizacao DATE NOT NULL DEFAULT CURRENT_DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.conjuntos_rapidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read conjuntos" ON public.conjuntos_rapidos FOR SELECT TO authenticated
  USING (visibilidade <> 'pessoal' OR auth.uid() = criado_por);
CREATE POLICY "Insert conjuntos" ON public.conjuntos_rapidos FOR INSERT TO authenticated
  WITH CHECK (
    (visibilidade = 'pessoal' AND auth.uid() = criado_por)
    OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'revisor'::app_role)
  );
CREATE POLICY "Update conjuntos" ON public.conjuntos_rapidos FOR UPDATE TO authenticated
  USING (
    (visibilidade = 'pessoal' AND auth.uid() = criado_por)
    OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'revisor'::app_role)
  );
CREATE POLICY "Delete conjuntos" ON public.conjuntos_rapidos FOR DELETE TO authenticated
  USING (
    (visibilidade = 'pessoal' AND auth.uid() = criado_por)
    OR has_role(auth.uid(),'admin'::app_role)
  );

-- modelos_prescricao
CREATE TABLE public.modelos_prescricao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_modelo TEXT NOT NULL,
  descricao TEXT,
  tipo_modelo public.template_type NOT NULL DEFAULT 'prescricao',
  contexto_atendimento public.template_context NOT NULL DEFAULT 'geral',
  area_clinica TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  itens_prescricao JSONB NOT NULL DEFAULT '[]'::jsonb,
  exames_sugeridos JSONB NOT NULL DEFAULT '[]'::jsonb,
  orientacoes_paciente JSONB NOT NULL DEFAULT '[]'::jsonb,
  cuidados_enfermagem JSONB NOT NULL DEFAULT '[]'::jsonb,
  criterios_uso TEXT,
  criterios_nao_uso TEXT,
  alertas_padrao TEXT[] NOT NULL DEFAULT '{}',
  criado_por UUID,
  visibilidade public.template_visibility NOT NULL DEFAULT 'pessoal',
  status_revisao public.template_review_status NOT NULL DEFAULT 'rascunho',
  fonte_referencia TEXT,
  data_atualizacao DATE NOT NULL DEFAULT CURRENT_DATE,
  revisado_por UUID,
  revisado_em TIMESTAMPTZ,
  versao_modelo INT NOT NULL DEFAULT 1,
  modelo_origem UUID,
  motivo_alteracao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.modelos_prescricao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read modelos" ON public.modelos_prescricao FOR SELECT TO authenticated
  USING (visibilidade <> 'pessoal' OR auth.uid() = criado_por);
CREATE POLICY "Insert modelos" ON public.modelos_prescricao FOR INSERT TO authenticated
  WITH CHECK (
    (visibilidade = 'pessoal' AND auth.uid() = criado_por)
    OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'revisor'::app_role)
  );
CREATE POLICY "Update modelos" ON public.modelos_prescricao FOR UPDATE TO authenticated
  USING (
    (visibilidade = 'pessoal' AND auth.uid() = criado_por)
    OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'revisor'::app_role)
  );
CREATE POLICY "Delete modelos" ON public.modelos_prescricao FOR DELETE TO authenticated
  USING (
    (visibilidade = 'pessoal' AND auth.uid() = criado_por)
    OR has_role(auth.uid(),'admin'::app_role)
  );

-- kits_rapidos
CREATE TABLE public.kits_rapidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT,
  contexto public.template_context NOT NULL DEFAULT 'geral',
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  alertas TEXT[] NOT NULL DEFAULT '{}',
  fonte TEXT,
  status_revisao public.template_review_status NOT NULL DEFAULT 'rascunho',
  visibilidade public.template_visibility NOT NULL DEFAULT 'pessoal',
  criado_por UUID,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.kits_rapidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read kits" ON public.kits_rapidos FOR SELECT TO authenticated
  USING (visibilidade <> 'pessoal' OR auth.uid() = criado_por);
CREATE POLICY "Insert kits" ON public.kits_rapidos FOR INSERT TO authenticated
  WITH CHECK (
    (visibilidade = 'pessoal' AND auth.uid() = criado_por)
    OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'revisor'::app_role)
  );
CREATE POLICY "Update kits" ON public.kits_rapidos FOR UPDATE TO authenticated
  USING (
    (visibilidade = 'pessoal' AND auth.uid() = criado_por)
    OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'revisor'::app_role)
  );
CREATE POLICY "Delete kits" ON public.kits_rapidos FOR DELETE TO authenticated
  USING (
    (visibilidade = 'pessoal' AND auth.uid() = criado_por)
    OR has_role(auth.uid(),'admin'::app_role)
  );

-- log_uso_modelos_prescricao
CREATE TABLE public.log_uso_modelos_prescricao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_atendimento TEXT,
  id_paciente TEXT,
  id_modelo UUID,
  nome_modelo TEXT,
  versao_modelo INT,
  tipo_modelo public.template_type,
  usuario_responsavel UUID NOT NULL,
  itens_visualizados JSONB NOT NULL DEFAULT '[]'::jsonb,
  itens_adicionados JSONB NOT NULL DEFAULT '[]'::jsonb,
  itens_editados JSONB NOT NULL DEFAULT '[]'::jsonb,
  itens_removidos JSONB NOT NULL DEFAULT '[]'::jsonb,
  alertas_gerados JSONB NOT NULL DEFAULT '[]'::jsonb,
  justificativas JSONB NOT NULL DEFAULT '[]'::jsonb,
  acao public.template_log_action NOT NULL,
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.log_uso_modelos_prescricao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner insert tpl log" ON public.log_uso_modelos_prescricao FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_responsavel);
CREATE POLICY "Owner select tpl log" ON public.log_uso_modelos_prescricao FOR SELECT TO authenticated USING (auth.uid() = usuario_responsavel);
CREATE POLICY "Admin/revisor select tpl log" ON public.log_uso_modelos_prescricao FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'revisor'::app_role));

-- templates_settings (singleton)
CREATE TABLE public.templates_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permitir_modelos_pessoais BOOLEAN NOT NULL DEFAULT true,
  permitir_modelos_institucionais BOOLEAN NOT NULL DEFAULT true,
  exigir_revisao_modelos_institucionais BOOLEAN NOT NULL DEFAULT true,
  cruzar_seguranca_antes_aplicar BOOLEAN NOT NULL DEFAULT true,
  exigir_just_alerta_alto BOOLEAN NOT NULL DEFAULT true,
  bloquear_alerta_critico BOOLEAN NOT NULL DEFAULT true,
  permitir_salvar_prescricao_como_modelo BOOLEAN NOT NULL DEFAULT true,
  remover_dados_paciente_auto BOOLEAN NOT NULL DEFAULT true,
  alertar_modelo_sem_revisao_12m BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);
ALTER TABLE public.templates_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read templates settings" ON public.templates_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert templates settings" ON public.templates_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admin update templates settings" ON public.templates_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

INSERT INTO public.templates_settings DEFAULT VALUES;

-- Triggers atualizado_em
CREATE OR REPLACE FUNCTION public.templates_set_updated()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_favoritos_med_upd BEFORE UPDATE ON public.favoritos_medicamentos
  FOR EACH ROW EXECUTE FUNCTION public.templates_set_updated();
CREATE TRIGGER trg_conjuntos_upd BEFORE UPDATE ON public.conjuntos_rapidos
  FOR EACH ROW EXECUTE FUNCTION public.templates_set_updated();
CREATE TRIGGER trg_modelos_upd BEFORE UPDATE ON public.modelos_prescricao
  FOR EACH ROW EXECUTE FUNCTION public.templates_set_updated();
CREATE TRIGGER trg_kits_upd BEFORE UPDATE ON public.kits_rapidos
  FOR EACH ROW EXECUTE FUNCTION public.templates_set_updated();

CREATE INDEX idx_favoritos_user ON public.favoritos_medicamentos(id_usuario, ativo);
CREATE INDEX idx_modelos_visibilidade ON public.modelos_prescricao(visibilidade, ativo);
CREATE INDEX idx_modelos_criador ON public.modelos_prescricao(criado_por);
CREATE INDEX idx_conjuntos_visibilidade ON public.conjuntos_rapidos(visibilidade, ativo);
CREATE INDEX idx_kits_visibilidade ON public.kits_rapidos(visibilidade, ativo);
CREATE INDEX idx_log_modelos_user ON public.log_uso_modelos_prescricao(usuario_responsavel, data_hora DESC);
