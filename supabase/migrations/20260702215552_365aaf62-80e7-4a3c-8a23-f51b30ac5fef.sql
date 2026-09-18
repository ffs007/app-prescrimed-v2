
-- 1) Checklist final
CREATE TABLE public.lancamento_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  secao TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  criticidade TEXT NOT NULL DEFAULT 'media',
  bloqueante BOOLEAN NOT NULL DEFAULT false,
  ordem INTEGER NOT NULL DEFAULT 0,
  responsavel TEXT,
  observacao TEXT,
  atualizado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamento_checklist TO authenticated;
GRANT ALL ON public.lancamento_checklist TO service_role;
ALTER TABLE public.lancamento_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin view checklist" ON public.lancamento_checklist FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage checklist" ON public.lancamento_checklist FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER lancamento_checklist_updated BEFORE UPDATE ON public.lancamento_checklist FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Versões
CREATE TABLE public.lancamento_versoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  versao TEXT NOT NULL UNIQUE,
  data_lancamento TIMESTAMPTZ,
  changelog TEXT,
  melhorias TEXT,
  correcoes TEXT,
  pendencias_conhecidas TEXT,
  observacoes TEXT,
  status_versao TEXT NOT NULL DEFAULT 'em_preparacao',
  liberado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamento_versoes TO authenticated;
GRANT ALL ON public.lancamento_versoes TO service_role;
ALTER TABLE public.lancamento_versoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage versoes" ON public.lancamento_versoes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER lancamento_versoes_updated BEFORE UPDATE ON public.lancamento_versoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Bugs conhecidos
CREATE TABLE public.lancamento_bugs_conhecidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  versao_id UUID REFERENCES public.lancamento_versoes(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  gravidade TEXT NOT NULL DEFAULT 'media',
  modulo_afetado TEXT,
  solucao_temporaria TEXT,
  status TEXT NOT NULL DEFAULT 'aberto',
  previsao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamento_bugs_conhecidos TO authenticated;
GRANT ALL ON public.lancamento_bugs_conhecidos TO service_role;
ALTER TABLE public.lancamento_bugs_conhecidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage bugs" ON public.lancamento_bugs_conhecidos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER lancamento_bugs_updated BEFORE UPDATE ON public.lancamento_bugs_conhecidos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Termos beta (versionados)
CREATE TABLE public.lancamento_termos_beta (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  versao_termo TEXT NOT NULL UNIQUE,
  conteudo TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lancamento_termos_beta TO authenticated;
GRANT ALL ON public.lancamento_termos_beta TO service_role;
ALTER TABLE public.lancamento_termos_beta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Any auth read termos" ON public.lancamento_termos_beta FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage termos" ON public.lancamento_termos_beta FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER lancamento_termos_updated BEFORE UPDATE ON public.lancamento_termos_beta FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5) Aceite de termos
CREATE TABLE public.lancamento_termos_aceites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  versao_termo TEXT NOT NULL,
  aceito_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, versao_termo)
);
GRANT SELECT, INSERT ON public.lancamento_termos_aceites TO authenticated;
GRANT ALL ON public.lancamento_termos_aceites TO service_role;
ALTER TABLE public.lancamento_termos_aceites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User read own aceite" ON public.lancamento_termos_aceites FOR SELECT TO authenticated USING (auth.uid() = usuario_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "User insert own aceite" ON public.lancamento_termos_aceites FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);

-- 6) Feedback geral
CREATE TABLE public.lancamento_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL,
  gravidade TEXT NOT NULL DEFAULT 'media',
  tela TEXT,
  descricao TEXT NOT NULL,
  dados_tecnicos JSONB,
  anexo_url TEXT,
  status TEXT NOT NULL DEFAULT 'novo',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.lancamento_feedback TO authenticated;
GRANT ALL ON public.lancamento_feedback TO service_role;
ALTER TABLE public.lancamento_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User insert feedback" ON public.lancamento_feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "User read own feedback" ON public.lancamento_feedback FOR SELECT TO authenticated USING (auth.uid() = usuario_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update feedback" ON public.lancamento_feedback FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER lancamento_feedback_updated BEFORE UPDATE ON public.lancamento_feedback FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7) Feedback específico de medicamento
CREATE TABLE public.lancamento_feedback_medicamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  medicamento_ref TEXT,
  medicamento_nome TEXT,
  motivo TEXT NOT NULL,
  descricao TEXT,
  gravidade TEXT NOT NULL DEFAULT 'media',
  status TEXT NOT NULL DEFAULT 'novo',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.lancamento_feedback_medicamento TO authenticated;
GRANT ALL ON public.lancamento_feedback_medicamento TO service_role;
ALTER TABLE public.lancamento_feedback_medicamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User insert med feedback" ON public.lancamento_feedback_medicamento FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "User read own med feedback" ON public.lancamento_feedback_medicamento FOR SELECT TO authenticated USING (auth.uid() = usuario_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update med feedback" ON public.lancamento_feedback_medicamento FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER lancamento_med_feedback_updated BEFORE UPDATE ON public.lancamento_feedback_medicamento FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8) Testadores beta
CREATE TABLE public.lancamento_testadores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  perfil_uso TEXT,
  local_contexto TEXT,
  data_inicio DATE,
  status_convite TEXT NOT NULL DEFAULT 'convidado',
  status_testador TEXT NOT NULL DEFAULT 'aguardando_inicio',
  prescricoes_feitas INTEGER NOT NULL DEFAULT 0,
  feedbacks_enviados INTEGER NOT NULL DEFAULT 0,
  problemas_criticos INTEGER NOT NULL DEFAULT 0,
  observacoes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamento_testadores TO authenticated;
GRANT ALL ON public.lancamento_testadores TO service_role;
ALTER TABLE public.lancamento_testadores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage testadores" ON public.lancamento_testadores FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER lancamento_testadores_updated BEFORE UPDATE ON public.lancamento_testadores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9) Metas do beta
CREATE TABLE public.lancamento_metas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  meta_valor TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativa BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lancamento_metas TO authenticated;
GRANT ALL ON public.lancamento_metas TO service_role;
ALTER TABLE public.lancamento_metas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Any auth read metas" ON public.lancamento_metas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage metas" ON public.lancamento_metas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER lancamento_metas_updated BEFORE UPDATE ON public.lancamento_metas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 10) Log administrativo
CREATE TABLE public.lancamento_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  acao TEXT NOT NULL,
  versao_beta TEXT,
  status_anterior TEXT,
  status_novo TEXT,
  usuario_responsavel UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  motivo TEXT,
  observacao TEXT,
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.lancamento_log TO authenticated;
GRANT ALL ON public.lancamento_log TO service_role;
ALTER TABLE public.lancamento_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read log" ON public.lancamento_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin insert log" ON public.lancamento_log FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_lancamento_checklist_secao ON public.lancamento_checklist(secao, ordem);
CREATE INDEX idx_lancamento_log_data ON public.lancamento_log(data_hora DESC);
CREATE INDEX idx_lancamento_feedback_data ON public.lancamento_feedback(criado_em DESC);
