
CREATE TYPE public.entrada_tipo AS ENUM (
  'texto_livre','voz','foto','arquivo','texto_colado'
);
CREATE TYPE public.entrada_origem AS ENUM (
  'prescricao','exames','orientacoes','documentos','historico','outro'
);
CREATE TYPE public.entrada_status_final AS ENUM (
  'descartado','aplicado_parcialmente','aplicado_totalmente','apenas_visualizado','erro_extracao'
);
CREATE TYPE public.entrada_item_tipo AS ENUM (
  'medicamento','exame','orientacao','documento','cuidado_enfermagem','diagnostico','nao_reconhecido'
);
CREATE TYPE public.aprendizado_termo_status AS ENUM ('pendente','aprovado','rejeitado');

-- log_entrada_inteligente
CREATE TABLE public.log_entrada_inteligente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_atendimento text,
  id_paciente text,
  tipo_entrada entrada_tipo NOT NULL,
  origem entrada_origem NOT NULL DEFAULT 'prescricao',
  texto_original text,
  texto_transcrito_ou_extraido text,
  itens_identificados jsonb NOT NULL DEFAULT '[]'::jsonb,
  itens_adicionados jsonb NOT NULL DEFAULT '[]'::jsonb,
  itens_editados jsonb NOT NULL DEFAULT '[]'::jsonb,
  itens_descartados jsonb NOT NULL DEFAULT '[]'::jsonb,
  campos_ambiguos jsonb NOT NULL DEFAULT '[]'::jsonb,
  campos_incompletos jsonb NOT NULL DEFAULT '[]'::jsonb,
  alertas_gerados jsonb NOT NULL DEFAULT '[]'::jsonb,
  confianca_geral integer,
  status_final entrada_status_final NOT NULL DEFAULT 'apenas_visualizado',
  usuario_responsavel uuid NOT NULL,
  data_hora timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.log_entrada_inteligente (usuario_responsavel, data_hora DESC);
ALTER TABLE public.log_entrada_inteligente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner insert log_entrada_inteligente" ON public.log_entrada_inteligente
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_responsavel);
CREATE POLICY "Owner select log_entrada_inteligente" ON public.log_entrada_inteligente
  FOR SELECT TO authenticated USING (auth.uid() = usuario_responsavel);
CREATE POLICY "Admin/revisor select log_entrada_inteligente" ON public.log_entrada_inteligente
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'revisor'));

-- log_edicoes_itens_ia
CREATE TABLE public.log_edicoes_itens_ia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_entrada uuid REFERENCES public.log_entrada_inteligente(id) ON DELETE SET NULL,
  tipo_item entrada_item_tipo NOT NULL,
  texto_original_item text,
  campo_editado text NOT NULL,
  valor_extraido_ia text,
  valor_final_usuario text,
  usuario_responsavel uuid NOT NULL,
  data_hora timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.log_edicoes_itens_ia (id_entrada);
ALTER TABLE public.log_edicoes_itens_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner insert log_edicoes_ia" ON public.log_edicoes_itens_ia
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_responsavel);
CREATE POLICY "Owner select log_edicoes_ia" ON public.log_edicoes_itens_ia
  FOR SELECT TO authenticated USING (auth.uid() = usuario_responsavel);
CREATE POLICY "Admin/revisor select log_edicoes_ia" ON public.log_edicoes_itens_ia
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'revisor'));

-- termos_aprendizado_ia
CREATE TABLE public.termos_aprendizado_ia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  termo_original text NOT NULL,
  termo_corrigido text NOT NULL,
  principio_ativo_relacionado text,
  contexto text,
  status aprendizado_termo_status NOT NULL DEFAULT 'pendente',
  sugerido_por uuid NOT NULL,
  revisado_por uuid,
  observacao text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.termos_aprendizado_ia (status, criado_em DESC);
ALTER TABLE public.termos_aprendizado_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth insert termos_aprendizado" ON public.termos_aprendizado_ia
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sugerido_por);
CREATE POLICY "Owner select termos_aprendizado" ON public.termos_aprendizado_ia
  FOR SELECT TO authenticated USING (auth.uid() = sugerido_por);
CREATE POLICY "Admin/revisor select termos_aprendizado" ON public.termos_aprendizado_ia
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'revisor'));
CREATE POLICY "Admin/revisor update termos_aprendizado" ON public.termos_aprendizado_ia
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'revisor'));
CREATE POLICY "Admin delete termos_aprendizado" ON public.termos_aprendizado_ia
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_termos_aprendizado_updated
  BEFORE UPDATE ON public.termos_aprendizado_ia
  FOR EACH ROW EXECUTE FUNCTION public.templates_set_updated();

-- entrada_inteligente_settings
CREATE TABLE public.entrada_inteligente_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usar_voz boolean NOT NULL DEFAULT true,
  usar_foto boolean NOT NULL DEFAULT true,
  usar_arquivo boolean NOT NULL DEFAULT true,
  usar_texto_livre boolean NOT NULL DEFAULT true,
  exigir_revisao_todos_itens boolean NOT NULL DEFAULT true,
  permitir_preselecao_alta_confianca boolean NOT NULL DEFAULT true,
  confianca_min_preselecao integer NOT NULL DEFAULT 90,
  confianca_min_sugestao integer NOT NULL DEFAULT 70,
  salvar_logs boolean NOT NULL DEFAULT true,
  permitir_aprendizado_termos boolean NOT NULL DEFAULT true,
  aprendizado_automatico_sem_revisao boolean NOT NULL DEFAULT false,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.entrada_inteligente_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read entrada_inteligente_settings" ON public.entrada_inteligente_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert entrada_inteligente_settings" ON public.entrada_inteligente_settings
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update entrada_inteligente_settings" ON public.entrada_inteligente_settings
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_entrada_inteligente_settings_updated
  BEFORE UPDATE ON public.entrada_inteligente_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.entrada_inteligente_settings DEFAULT VALUES;
