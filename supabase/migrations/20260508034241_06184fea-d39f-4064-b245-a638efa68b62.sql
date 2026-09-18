
-- Enums
CREATE TYPE public.historico_tipo_visualizado AS ENUM (
  'prescricao','medicamento','exame','documento','alerta','uso_continuo'
);

CREATE TYPE public.reaproveitamento_acao AS ENUM (
  'prescricao_aberta','reaproveitar_clicado','item_selecionado','item_editado',
  'item_removido','item_bloqueado','item_adicionado','justificativa_preenchida'
);

CREATE TYPE public.item_reuso_status AS ENUM (
  'seguro_para_revisao','requer_atencao','exige_justificativa','bloqueado',
  'dados_insuficientes','desatualizado'
);

CREATE TYPE public.uso_continuo_status AS ENUM ('ativo','suspenso','finalizado');

-- prescricoes_historico
CREATE TABLE public.prescricoes_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_paciente text NOT NULL,
  id_atendimento text,
  profissional_id uuid NOT NULL,
  profissional_nome text,
  contexto_atendimento text,
  cid text,
  diagnostico text,
  dados_paciente_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  itens jsonb NOT NULL DEFAULT '[]'::jsonb,
  alertas_registrados jsonb NOT NULL DEFAULT '[]'::jsonb,
  justificativas jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'emitida',
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.prescricoes_historico (id_paciente, criado_em DESC);
CREATE INDEX ON public.prescricoes_historico (profissional_id);
ALTER TABLE public.prescricoes_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner insert prescricoes_historico" ON public.prescricoes_historico
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = profissional_id);
CREATE POLICY "Owner select prescricoes_historico" ON public.prescricoes_historico
  FOR SELECT TO authenticated USING (auth.uid() = profissional_id);
CREATE POLICY "Admin/revisor select prescricoes_historico" ON public.prescricoes_historico
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'revisor'));
CREATE POLICY "Owner update prescricoes_historico" ON public.prescricoes_historico
  FOR UPDATE TO authenticated USING (auth.uid() = profissional_id);

CREATE TRIGGER trg_prescricoes_historico_updated
  BEFORE UPDATE ON public.prescricoes_historico
  FOR EACH ROW EXECUTE FUNCTION public.templates_set_updated();

-- medicacoes_uso_continuo
CREATE TABLE public.medicacoes_uso_continuo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_paciente text NOT NULL,
  principio_ativo text NOT NULL,
  nome_medicamento text,
  dose text,
  via text,
  frequencia text,
  inicio date,
  prescrito_por uuid,
  paciente_refere_uso boolean NOT NULL DEFAULT false,
  confirmado boolean NOT NULL DEFAULT false,
  status uso_continuo_status NOT NULL DEFAULT 'ativo',
  observacoes text,
  criado_por uuid,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.medicacoes_uso_continuo (id_paciente, status);
ALTER TABLE public.medicacoes_uso_continuo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read uso_continuo" ON public.medicacoes_uso_continuo
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert uso_continuo" ON public.medicacoes_uso_continuo
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = criado_por);
CREATE POLICY "Owner/admin update uso_continuo" ON public.medicacoes_uso_continuo
  FOR UPDATE TO authenticated
  USING (auth.uid() = criado_por OR has_role(auth.uid(),'admin'));
CREATE POLICY "Owner/admin delete uso_continuo" ON public.medicacoes_uso_continuo
  FOR DELETE TO authenticated
  USING (auth.uid() = criado_por OR has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_uso_continuo_updated
  BEFORE UPDATE ON public.medicacoes_uso_continuo
  FOR EACH ROW EXECUTE FUNCTION public.templates_set_updated();

-- log_reaproveitamento_prescricao
CREATE TABLE public.log_reaproveitamento_prescricao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_atendimento_atual text,
  id_paciente text NOT NULL,
  id_prescricao_origem uuid,
  data_prescricao_origem timestamptz,
  acao reaproveitamento_acao NOT NULL,
  itens_visualizados jsonb NOT NULL DEFAULT '[]'::jsonb,
  itens_reaproveitados jsonb NOT NULL DEFAULT '[]'::jsonb,
  itens_editados jsonb NOT NULL DEFAULT '[]'::jsonb,
  itens_removidos jsonb NOT NULL DEFAULT '[]'::jsonb,
  alertas_gerados jsonb NOT NULL DEFAULT '[]'::jsonb,
  comparacoes_relevantes jsonb NOT NULL DEFAULT '[]'::jsonb,
  justificativas jsonb NOT NULL DEFAULT '[]'::jsonb,
  usuario_responsavel uuid NOT NULL,
  data_hora timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.log_reaproveitamento_prescricao (id_paciente, data_hora DESC);
ALTER TABLE public.log_reaproveitamento_prescricao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner insert log_reaproveitamento" ON public.log_reaproveitamento_prescricao
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_responsavel);
CREATE POLICY "Owner select log_reaproveitamento" ON public.log_reaproveitamento_prescricao
  FOR SELECT TO authenticated USING (auth.uid() = usuario_responsavel);
CREATE POLICY "Admin/revisor select log_reaproveitamento" ON public.log_reaproveitamento_prescricao
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'revisor'));

-- log_visualizacao_historico_paciente
CREATE TABLE public.log_visualizacao_historico_paciente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_paciente text NOT NULL,
  id_atendimento text,
  tipo_historico_visualizado historico_tipo_visualizado NOT NULL,
  item_visualizado text,
  usuario_responsavel uuid NOT NULL,
  data_hora timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.log_visualizacao_historico_paciente (id_paciente, data_hora DESC);
ALTER TABLE public.log_visualizacao_historico_paciente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner insert log_view_historico" ON public.log_visualizacao_historico_paciente
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_responsavel);
CREATE POLICY "Owner select log_view_historico" ON public.log_visualizacao_historico_paciente
  FOR SELECT TO authenticated USING (auth.uid() = usuario_responsavel);
CREATE POLICY "Admin/revisor select log_view_historico" ON public.log_visualizacao_historico_paciente
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'revisor'));

-- historico_settings
CREATE TABLE public.historico_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permitir_reaproveitar boolean NOT NULL DEFAULT true,
  exigir_revisao_antes_reaproveitar boolean NOT NULL DEFAULT true,
  permitir_repetir_medicamento_isolado boolean NOT NULL DEFAULT true,
  cruzar_com_seguranca_atual boolean NOT NULL DEFAULT true,
  bloquear_item_alerta_critico boolean NOT NULL DEFAULT true,
  exigir_just_dados_mudaram boolean NOT NULL DEFAULT true,
  mostrar_medicamentos_recorrentes boolean NOT NULL DEFAULT true,
  permitir_uso_continuo boolean NOT NULL DEFAULT true,
  registrar_logs boolean NOT NULL DEFAULT true,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.historico_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read historico_settings" ON public.historico_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert historico_settings" ON public.historico_settings
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update historico_settings" ON public.historico_settings
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_historico_settings_updated
  BEFORE UPDATE ON public.historico_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.historico_settings DEFAULT VALUES;
