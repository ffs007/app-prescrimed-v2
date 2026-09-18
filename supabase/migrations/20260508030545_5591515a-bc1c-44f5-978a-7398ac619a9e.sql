
-- Enums
DO $$ BEGIN
  CREATE TYPE protocol_type AS ENUM ('queixa','sindrome','cid','diagnostico','emergencia','ambulatorial','hospitalar','pediatrico','obstetrico','outro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE protocol_context AS ENUM ('urgencia','enfermaria','ambulatorio','pronto_atendimento','telemedicina','hospitalar','pediatria','obstetricia','geral');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE protocol_review_status AS ENUM ('rascunho','aguardando_revisao','revisado','precisa_corrigir','inativo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE protocol_priority AS ENUM ('imediata','alta','moderada','baixa');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE protocol_recommendation_level AS ENUM ('forte','moderada','condicional','baixa');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE protocol_log_action AS ENUM ('aberto','item_adicionado','item_editado','item_ignorado','plano_montado','alerta_gerado','aplicado_parcial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Base de protocolos
CREATE TABLE IF NOT EXISTS public.base_protocolos_clinicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_protocolo text NOT NULL,
  tipo_protocolo protocol_type NOT NULL DEFAULT 'queixa',
  area_clinica text,
  contexto_atendimento protocol_context NOT NULL DEFAULT 'geral',
  queixas_relacionadas text[] NOT NULL DEFAULT '{}',
  sindromes_relacionadas text[] NOT NULL DEFAULT '{}',
  cids_relacionados text[] NOT NULL DEFAULT '{}',
  palavras_chave text[] NOT NULL DEFAULT '{}',
  populacao_alvo text,
  faixa_etaria_min numeric,
  faixa_etaria_max numeric,
  sinais_gravidade jsonb NOT NULL DEFAULT '[]'::jsonb,
  diagnosticos_diferenciais text[] NOT NULL DEFAULT '{}',
  condutas_iniciais jsonb NOT NULL DEFAULT '[]'::jsonb,
  exames_sugeridos jsonb NOT NULL DEFAULT '[]'::jsonb,
  medicamentos_sugeridos jsonb NOT NULL DEFAULT '[]'::jsonb,
  medidas_nao_farmacologicas jsonb NOT NULL DEFAULT '[]'::jsonb,
  cuidados_enfermagem jsonb NOT NULL DEFAULT '[]'::jsonb,
  criterios_encaminhamento jsonb NOT NULL DEFAULT '[]'::jsonb,
  criterios_internacao jsonb NOT NULL DEFAULT '[]'::jsonb,
  sinais_retorno_imediato jsonb NOT NULL DEFAULT '[]'::jsonb,
  orientacoes_paciente text,
  alertas_seguranca text[] NOT NULL DEFAULT '{}',
  contraindicacoes_relevantes text[] NOT NULL DEFAULT '{}',
  fonte_referencia text,
  data_atualizacao date NOT NULL DEFAULT CURRENT_DATE,
  revisado_por uuid,
  revisado_em timestamptz,
  status_revisao protocol_review_status NOT NULL DEFAULT 'aguardando_revisao',
  versao_protocolo integer NOT NULL DEFAULT 1,
  protocolo_origem uuid,
  motivo_alteracao text,
  ativo boolean NOT NULL DEFAULT true,
  criado_por uuid,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_por uuid,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_protocolos_status ON public.base_protocolos_clinicos(status_revisao);
CREATE INDEX IF NOT EXISTS idx_protocolos_tipo ON public.base_protocolos_clinicos(tipo_protocolo);
CREATE INDEX IF NOT EXISTS idx_protocolos_contexto ON public.base_protocolos_clinicos(contexto_atendimento);

ALTER TABLE public.base_protocolos_clinicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read protocolos" ON public.base_protocolos_clinicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/revisor insert protocolos" ON public.base_protocolos_clinicos FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'revisor'::app_role));
CREATE POLICY "Admin/revisor update protocolos" ON public.base_protocolos_clinicos FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'revisor'::app_role));
CREATE POLICY "Admin delete protocolos" ON public.base_protocolos_clinicos FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.protocolos_set_updated()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_protocolos_set_updated ON public.base_protocolos_clinicos;
CREATE TRIGGER trg_protocolos_set_updated BEFORE UPDATE ON public.base_protocolos_clinicos
FOR EACH ROW EXECUTE FUNCTION public.protocolos_set_updated();

-- Favoritos
CREATE TABLE IF NOT EXISTS public.protocolos_favoritos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  id_protocolo uuid NOT NULL REFERENCES public.base_protocolos_clinicos(id) ON DELETE CASCADE,
  favoritado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, id_protocolo)
);
ALTER TABLE public.protocolos_favoritos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner read favoritos" ON public.protocolos_favoritos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner insert favoritos" ON public.protocolos_favoritos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner delete favoritos" ON public.protocolos_favoritos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Log de uso
CREATE TABLE IF NOT EXISTS public.log_uso_protocolos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_atendimento text,
  id_paciente text,
  id_protocolo uuid,
  nome_protocolo text,
  versao_protocolo integer,
  usuario_responsavel uuid NOT NULL,
  contexto_atendimento protocol_context,
  acao protocol_log_action NOT NULL,
  itens_visualizados jsonb NOT NULL DEFAULT '[]'::jsonb,
  itens_adicionados jsonb NOT NULL DEFAULT '[]'::jsonb,
  itens_editados jsonb NOT NULL DEFAULT '[]'::jsonb,
  itens_ignorados jsonb NOT NULL DEFAULT '[]'::jsonb,
  justificativas jsonb NOT NULL DEFAULT '[]'::jsonb,
  alertas_gerados jsonb NOT NULL DEFAULT '[]'::jsonb,
  data_hora timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.log_uso_protocolos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert protocolo log" ON public.log_uso_protocolos FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_responsavel);
CREATE POLICY "Users view own protocolo log" ON public.log_uso_protocolos FOR SELECT TO authenticated USING (auth.uid() = usuario_responsavel);
CREATE POLICY "Admin/revisor view all protocolo log" ON public.log_uso_protocolos FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'revisor'::app_role));

-- Settings
CREATE TABLE IF NOT EXISTS public.protocolos_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usar_apenas_revisados boolean NOT NULL DEFAULT true,
  mostrar_rascunho_admin boolean NOT NULL DEFAULT true,
  permitir_montar_plano boolean NOT NULL DEFAULT true,
  exigir_revisao_med_sugerido boolean NOT NULL DEFAULT true,
  cruzar_seguranca_med_sugerido boolean NOT NULL DEFAULT true,
  mostrar_gravidade_topo boolean NOT NULL DEFAULT true,
  alertar_sem_revisao_12m boolean NOT NULL DEFAULT true,
  permitir_favoritos boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.protocolos_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read protocolos settings" ON public.protocolos_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert protocolos settings" ON public.protocolos_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admin update protocolos settings" ON public.protocolos_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

INSERT INTO public.protocolos_settings (id) SELECT gen_random_uuid() WHERE NOT EXISTS (SELECT 1 FROM public.protocolos_settings);
