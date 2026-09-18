-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.teste_clinico_status AS ENUM ('pendente','aprovado','reprovado','precisa_ajuste','corrigido');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.assinatura_tipo AS ENUM (
    'sem_assinatura_digital','assinatura_digital_externa','certificado_a1','certificado_a3',
    'assinatura_eletronica_simples','integracao_api'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.assinatura_modo AS ENUM (
    'imprimir_sem_assinatura_digital','gerar_pdf_para_assinar','assinar_automaticamente','enviar_para_assinatura_externa'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.assinatura_ambiente AS ENUM ('teste','producao');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.assinatura_status_integracao AS ENUM ('nao_configurado','em_configuracao','configurado','erro','producao');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.link_publico_status AS ENUM ('ativo','expirado','revogado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.modulo_revisao_status AS ENUM ('pronto','em_ajuste','pendente','desativado_no_beta');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.checklist_status AS ENUM ('pendente','em_teste','aprovado','precisa_ajuste');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============ TESTES CLÍNICOS ============
CREATE TABLE IF NOT EXISTS public.testes_clinicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_do_teste text NOT NULL,
  descricao text,
  categoria text,
  paciente_simulado jsonb NOT NULL DEFAULT '{}'::jsonb,
  medicamentos_prescritos jsonb NOT NULL DEFAULT '[]'::jsonb,
  exames_documentos jsonb NOT NULL DEFAULT '[]'::jsonb,
  alerta_esperado jsonb NOT NULL DEFAULT '{}'::jsonb,
  resultado_obtido jsonb,
  status public.teste_clinico_status NOT NULL DEFAULT 'pendente',
  observacoes text,
  testado_por uuid,
  data_hora_execucao timestamptz,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.testes_clinicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read testes_clinicos" ON public.testes_clinicos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert testes_clinicos" ON public.testes_clinicos
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admin update testes_clinicos" ON public.testes_clinicos
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admin delete testes_clinicos" ON public.testes_clinicos
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_testes_clinicos_updated
  BEFORE UPDATE ON public.testes_clinicos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ASSINATURA DIGITAL CONFIG ============
CREATE TABLE IF NOT EXISTS public.assinatura_digital_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_assinatura public.assinatura_tipo NOT NULL DEFAULT 'sem_assinatura_digital',
  modo_assinatura public.assinatura_modo NOT NULL DEFAULT 'imprimir_sem_assinatura_digital',
  provedor_assinatura text,
  ambiente public.assinatura_ambiente NOT NULL DEFAULT 'teste',
  status_integracao public.assinatura_status_integracao NOT NULL DEFAULT 'nao_configurado',
  certificado_configurado boolean NOT NULL DEFAULT false,
  certificado_a1_url text,
  certificado_a3_dispositivo text,
  api_assinatura_url text,
  api_key_configurada boolean NOT NULL DEFAULT false,
  ultimo_teste_assinatura timestamptz,
  responsavel_configuracao uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.assinatura_digital_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read assinatura_digital_config" ON public.assinatura_digital_config
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert assinatura_digital_config" ON public.assinatura_digital_config
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admin update assinatura_digital_config" ON public.assinatura_digital_config
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_assinatura_digital_config_updated
  BEFORE UPDATE ON public.assinatura_digital_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.assinatura_digital_config (id) 
  SELECT gen_random_uuid()
  WHERE NOT EXISTS (SELECT 1 FROM public.assinatura_digital_config);

-- ============ DOCUMENTO LINKS PÚBLICOS ============
CREATE TABLE IF NOT EXISTS public.documento_links_publicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_documento uuid NOT NULL,
  token text NOT NULL UNIQUE,
  senha_hash text,
  expira_em timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  status public.link_publico_status NOT NULL DEFAULT 'ativo',
  numero_acessos integer NOT NULL DEFAULT 0,
  enviado_para text,
  canal_envio text,
  data_envio timestamptz,
  criado_por uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documento_links_publicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner select links" ON public.documento_links_publicos
  FOR SELECT TO authenticated USING (auth.uid() = criado_por OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Owner insert links" ON public.documento_links_publicos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = criado_por);
CREATE POLICY "Owner update links" ON public.documento_links_publicos
  FOR UPDATE TO authenticated USING (auth.uid() = criado_por OR has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_documento_links_publicos_updated
  BEFORE UPDATE ON public.documento_links_publicos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_doc_links_token ON public.documento_links_publicos(token);
CREATE INDEX IF NOT EXISTS idx_doc_links_doc ON public.documento_links_publicos(id_documento);

-- ============ LOG DE ACESSOS ============
CREATE TABLE IF NOT EXISTS public.link_acessos_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_link uuid NOT NULL,
  ip text,
  user_agent text,
  acessado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.link_acessos_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin select link_acessos_log" ON public.link_acessos_log
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'::app_role));
-- inserts virão da edge function via service role; nenhuma policy de insert de cliente

-- ============ BETA SETTINGS ============
CREATE TABLE IF NOT EXISTS public.beta_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modo_beta_ativo boolean NOT NULL DEFAULT true,
  entrada_voz boolean NOT NULL DEFAULT true,
  link_paciente boolean NOT NULL DEFAULT true,
  assinatura_digital boolean NOT NULL DEFAULT true,
  seguranca_iv boolean NOT NULL DEFAULT true,
  calculo_pediatrico boolean NOT NULL DEFAULT true,
  ajuste_renal boolean NOT NULL DEFAULT true,
  interacoes boolean NOT NULL DEFAULT true,
  modelos_rapidos boolean NOT NULL DEFAULT true,
  protocolos boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.beta_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read beta_settings" ON public.beta_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert beta_settings" ON public.beta_settings
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admin update beta_settings" ON public.beta_settings
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_beta_settings_updated
  BEFORE UPDATE ON public.beta_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.beta_settings (id) 
  SELECT gen_random_uuid()
  WHERE NOT EXISTS (SELECT 1 FROM public.beta_settings);

-- ============ BETA CHECKLIST ITEMS ============
CREATE TABLE IF NOT EXISTS public.beta_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL UNIQUE,
  label text NOT NULL,
  status public.checklist_status NOT NULL DEFAULT 'pendente',
  observacao text,
  ordem integer NOT NULL DEFAULT 0,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_por uuid
);
ALTER TABLE public.beta_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read beta_checklist_items" ON public.beta_checklist_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write beta_checklist_items" ON public.beta_checklist_items
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- Seed checklist
INSERT INTO public.beta_checklist_items (chave, label, ordem) VALUES
  ('login','Login funcionando',1),
  ('nova_prescricao','Nova prescrição funcionando',2),
  ('paciente_rapido','Cadastro rápido de paciente',3),
  ('busca_med','Busca de medicamentos',4),
  ('modelos','Modelos rápidos',5),
  ('favoritos','Favoritos',6),
  ('entrada_texto','Entrada por texto',7),
  ('entrada_voz','Entrada por voz',8),
  ('alergia','Alertas de alergia',9),
  ('seguranca_iv','Segurança IV',10),
  ('pediatrico','Cálculo pediátrico',11),
  ('interacao','Interação crítica',12),
  ('docs_separados','Documentos separados',13),
  ('pdf','PDF',14),
  ('impressao','Impressão',15),
  ('doc_digital','Documento digital',16),
  ('link_paciente','Link para paciente',17),
  ('historico','Histórico',18),
  ('indicadores','Indicadores',19),
  ('testes_clinicos','Testes clínicos principais',20),
  ('assinatura_digital','Assinatura digital configurável',21),
  ('logs','Logs básicos',22),
  ('mobile','Visual mobile validado',23)
ON CONFLICT (chave) DO NOTHING;

-- ============ BETA MÓDULOS REVISÃO ============
CREATE TABLE IF NOT EXISTS public.beta_modulos_revisao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL UNIQUE,
  label text NOT NULL,
  status public.modulo_revisao_status NOT NULL DEFAULT 'pendente',
  observacao text,
  ordem integer NOT NULL DEFAULT 0,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_por uuid
);
ALTER TABLE public.beta_modulos_revisao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read beta_modulos_revisao" ON public.beta_modulos_revisao
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write beta_modulos_revisao" ON public.beta_modulos_revisao
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

INSERT INTO public.beta_modulos_revisao (chave, label, ordem) VALUES
  ('nova_prescricao','Nova Prescrição',1),
  ('pacientes','Pacientes',2),
  ('medicamentos','Medicamentos',3),
  ('seguranca_iv','Segurança IV',4),
  ('pediatrico','Cálculo pediátrico',5),
  ('alergias','Alergias',6),
  ('interacoes','Interações',7),
  ('renal','Ajuste renal básico',8),
  ('modelos','Modelos rápidos',9),
  ('entrada_inteligente','Entrada inteligente',10),
  ('revisao_seguranca','Revisão rápida de segurança',11),
  ('documentos','Documentos / PDF',12),
  ('assinatura','Assinatura digital',13),
  ('link_paciente','Link para paciente',14),
  ('historico','Histórico',15),
  ('indicadores','Indicadores',16),
  ('testes_clinicos','Testes clínicos',17)
ON CONFLICT (chave) DO NOTHING;

-- ============ EVENTOS BETA LOG ============
CREATE TABLE IF NOT EXISTS public.eventos_beta_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_evento text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  usuario uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.eventos_beta_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User insert own eventos_beta_log" ON public.eventos_beta_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario OR usuario IS NULL);
CREATE POLICY "Admin select eventos_beta_log" ON public.eventos_beta_log
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Owner select own eventos_beta_log" ON public.eventos_beta_log
  FOR SELECT TO authenticated USING (auth.uid() = usuario);

CREATE INDEX IF NOT EXISTS idx_eventos_beta_log_tipo ON public.eventos_beta_log(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_beta_log_created ON public.eventos_beta_log(created_at DESC);