
-- Etapa 22G: Testes Clínicos
CREATE TABLE public.testes_clinicos_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome_teste TEXT NOT NULL,
  categoria_teste TEXT NOT NULL,
  descricao TEXT,
  critico BOOLEAN NOT NULL DEFAULT false,
  ordem INT NOT NULL DEFAULT 0,
  dados_paciente_simulado JSONB DEFAULT '{}'::jsonb,
  medicamentos_simulados JSONB DEFAULT '[]'::jsonb,
  exames_simulados JSONB DEFAULT '[]'::jsonb,
  documentos_simulados JSONB DEFAULT '[]'::jsonb,
  entrada_inteligente_simulada TEXT,
  alerta_esperado TEXT,
  comportamento_esperado TEXT,
  resultado_obtido TEXT,
  status_teste TEXT NOT NULL DEFAULT 'pendente',
  observacao TEXT,
  justificativa_ignorar TEXT,
  testado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_hora_teste TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testes_clinicos_v2 TO authenticated;
GRANT ALL ON public.testes_clinicos_v2 TO service_role;
ALTER TABLE public.testes_clinicos_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins gerenciam testes_clinicos_v2"
  ON public.testes_clinicos_v2 FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Autenticados leem testes_clinicos_v2"
  ON public.testes_clinicos_v2 FOR SELECT TO authenticated
  USING (true);

CREATE TRIGGER tg_testes_clinicos_v2_updated
  BEFORE UPDATE ON public.testes_clinicos_v2
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.log_testes_clinicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teste_id UUID REFERENCES public.testes_clinicos_v2(id) ON DELETE CASCADE,
  codigo_teste TEXT,
  nome_teste TEXT,
  categoria_teste TEXT,
  acao TEXT NOT NULL,
  status_anterior TEXT,
  status_novo TEXT,
  resultado_esperado TEXT,
  resultado_obtido TEXT,
  observacao TEXT,
  usuario_responsavel UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.log_testes_clinicos TO authenticated;
GRANT ALL ON public.log_testes_clinicos TO service_role;
ALTER TABLE public.log_testes_clinicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins leem log_testes_clinicos"
  ON public.log_testes_clinicos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Autenticados inserem log_testes_clinicos"
  ON public.log_testes_clinicos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_responsavel OR usuario_responsavel IS NULL);

CREATE TABLE public.testes_clinicos_configs (
  id INT PRIMARY KEY DEFAULT 1,
  exigir_criticos_aprovados BOOLEAN NOT NULL DEFAULT true,
  permitir_ignorar_com_justificativa BOOLEAN NOT NULL DEFAULT true,
  gerar_log_execucao BOOLEAN NOT NULL DEFAULT true,
  mostrar_no_menu_lateral BOOLEAN NOT NULL DEFAULT true,
  mostrar_resumo_prontidao_beta BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT testes_clinicos_configs_singleton CHECK (id = 1)
);
GRANT SELECT, INSERT, UPDATE ON public.testes_clinicos_configs TO authenticated;
GRANT ALL ON public.testes_clinicos_configs TO service_role;
ALTER TABLE public.testes_clinicos_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem testes_clinicos_configs"
  ON public.testes_clinicos_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins gerenciam testes_clinicos_configs"
  ON public.testes_clinicos_configs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.testes_clinicos_configs (id) VALUES (1) ON CONFLICT DO NOTHING;
