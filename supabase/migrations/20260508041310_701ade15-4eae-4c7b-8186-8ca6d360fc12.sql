
-- Etapa 20: Documentos Clínicos

-- Enums
CREATE TYPE public.documento_tipo AS ENUM (
  'receita_comum','receita_controle_especial','receita_antimicrobiano',
  'receita_controlado_especifico','solicitacao_exames','atestado',
  'encaminhamento','relatorio','declaracao','orientacoes_paciente',
  'prescricao_hospitalar','orientacoes_enfermagem_farmacia',
  'anexo_tecnico_iv','plano_terapeutico','resumo_atendimento'
);
CREATE TYPE public.documento_status AS ENUM (
  'rascunho','gerado','impresso','enviado','cancelado','substituido'
);
CREATE TYPE public.documento_origem AS ENUM (
  'atendimento_atual','historico','modelo','protocolo','entrada_inteligente','manual'
);
CREATE TYPE public.documento_acao_log AS ENUM (
  'visualizou_previa','gerou_pdf','imprimiu','baixou',
  'enviou_email','enviou_whatsapp','copiou_link','cancelou','substituiu'
);
CREATE TYPE public.tipo_receita_legal AS ENUM (
  'comum','controle_especial','antimicrobiano','azul','amarela','branca_duas_vias','outro'
);
CREATE TYPE public.anexo_iv_modo AS ENUM (
  'nunca','apenas_alerta_medio_alto','perguntar_sempre','sempre_hospitalar'
);
CREATE TYPE public.cid_atestado_modo AS ENUM (
  'nunca','perguntar_sempre','se_medico_marcar'
);
CREATE TYPE public.regra_legal_review_status AS ENUM (
  'aguardando_revisao','revisado','rejeitado'
);

-- Colunas de regra legal em iv_medications
ALTER TABLE public.iv_medications
  ADD COLUMN tipo_receita tipo_receita_legal,
  ADD COLUMN controlado boolean NOT NULL DEFAULT false,
  ADD COLUMN categoria_controle text,
  ADD COLUMN exige_receita_especial boolean NOT NULL DEFAULT false,
  ADD COLUMN exige_duas_vias boolean NOT NULL DEFAULT false,
  ADD COLUMN exige_retencao_receita boolean NOT NULL DEFAULT false,
  ADD COLUMN validade_receita_dias integer,
  ADD COLUMN observacao_legal text,
  ADD COLUMN fonte_regra_legal text,
  ADD COLUMN status_revisao_regra_legal regra_legal_review_status NOT NULL DEFAULT 'aguardando_revisao';

-- documentos_gerados
CREATE TABLE public.documentos_gerados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_atendimento text,
  id_paciente text,
  tipo documento_tipo NOT NULL,
  titulo text NOT NULL,
  conteudo_resumido text,
  conteudo_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  arquivo_pdf_url text,
  status documento_status NOT NULL DEFAULT 'rascunho',
  gerado_por uuid NOT NULL,
  data_hora timestamptz NOT NULL DEFAULT now(),
  versao integer NOT NULL DEFAULT 1,
  origem documento_origem NOT NULL DEFAULT 'atendimento_atual',
  codigo_validacao text,
  hash_documento text,
  documento_original uuid REFERENCES public.documentos_gerados(id) ON DELETE SET NULL,
  motivo_substituicao text,
  motivo_cancelamento text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.documentos_gerados (gerado_por, data_hora DESC);
CREATE INDEX ON public.documentos_gerados (id_atendimento);
CREATE INDEX ON public.documentos_gerados (id_paciente);
ALTER TABLE public.documentos_gerados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner select documentos_gerados" ON public.documentos_gerados
  FOR SELECT TO authenticated USING (auth.uid() = gerado_por);
CREATE POLICY "Admin select documentos_gerados" ON public.documentos_gerados
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Owner insert documentos_gerados" ON public.documentos_gerados
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = gerado_por);
CREATE POLICY "Owner update documentos_gerados" ON public.documentos_gerados
  FOR UPDATE TO authenticated USING (auth.uid() = gerado_por);
CREATE POLICY "Admin update documentos_gerados" ON public.documentos_gerados
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_documentos_gerados_updated
  BEFORE UPDATE ON public.documentos_gerados
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- log_documentos_clinicos
CREATE TABLE public.log_documentos_clinicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_documento uuid REFERENCES public.documentos_gerados(id) ON DELETE SET NULL,
  id_atendimento text,
  id_paciente text,
  tipo_documento documento_tipo,
  acao documento_acao_log NOT NULL,
  usuario_responsavel uuid NOT NULL,
  destino_envio text,
  motivo_cancelamento text,
  data_hora timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.log_documentos_clinicos (usuario_responsavel, data_hora DESC);
CREATE INDEX ON public.log_documentos_clinicos (id_documento);
ALTER TABLE public.log_documentos_clinicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner insert log_documentos_clinicos" ON public.log_documentos_clinicos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_responsavel);
CREATE POLICY "Owner select log_documentos_clinicos" ON public.log_documentos_clinicos
  FOR SELECT TO authenticated USING (auth.uid() = usuario_responsavel);
CREATE POLICY "Admin/revisor select log_documentos_clinicos" ON public.log_documentos_clinicos
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'revisor'));

-- documentos_settings (singleton)
CREATE TABLE public.documentos_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  separar_antimicrobianos boolean NOT NULL DEFAULT true,
  anexo_iv_modo anexo_iv_modo NOT NULL DEFAULT 'perguntar_sempre',
  cid_atestado_modo cid_atestado_modo NOT NULL DEFAULT 'perguntar_sempre',
  gerar_pdfs_separados_padrao boolean NOT NULL DEFAULT true,
  salvar_copia_historico boolean NOT NULL DEFAULT true,
  previa_obrigatoria boolean NOT NULL DEFAULT true,
  usar_qrcode_validacao boolean NOT NULL DEFAULT false,
  mostrar_logo boolean NOT NULL DEFAULT true,
  mostrar_endereco boolean NOT NULL DEFAULT true,
  mostrar_telefone boolean NOT NULL DEFAULT true,
  gerar_duas_vias_controle_especial boolean NOT NULL DEFAULT true,
  exigir_dados_completos_controle_especial boolean NOT NULL DEFAULT true,
  formato_pagina text NOT NULL DEFAULT 'A4',
  bloquear_pdf_se_alerta_critico boolean NOT NULL DEFAULT true,
  exigir_revisao_final_concluida boolean NOT NULL DEFAULT true,
  numerar_paginas boolean NOT NULL DEFAULT true,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documentos_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read documentos_settings" ON public.documentos_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert documentos_settings" ON public.documentos_settings
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update documentos_settings" ON public.documentos_settings
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_documentos_settings_updated
  BEFORE UPDATE ON public.documentos_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.documentos_settings DEFAULT VALUES;

-- assinatura_perfis
CREATE TABLE public.assinatura_perfis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario uuid NOT NULL,
  perfil_nome text NOT NULL,
  nome_profissional text NOT NULL,
  registro text,
  registro_uf text,
  especialidade text,
  rqe text,
  telefone text,
  endereco text,
  email text,
  logo_url text,
  assinatura_url text,
  cidade_padrao text,
  ativo boolean NOT NULL DEFAULT true,
  padrao boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.assinatura_perfis (id_usuario);
ALTER TABLE public.assinatura_perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner select assinatura_perfis" ON public.assinatura_perfis
  FOR SELECT TO authenticated USING (auth.uid() = id_usuario);
CREATE POLICY "Owner insert assinatura_perfis" ON public.assinatura_perfis
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id_usuario);
CREATE POLICY "Owner update assinatura_perfis" ON public.assinatura_perfis
  FOR UPDATE TO authenticated USING (auth.uid() = id_usuario);
CREATE POLICY "Owner delete assinatura_perfis" ON public.assinatura_perfis
  FOR DELETE TO authenticated USING (auth.uid() = id_usuario);

CREATE TRIGGER trg_assinatura_perfis_updated
  BEFORE UPDATE ON public.assinatura_perfis
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
