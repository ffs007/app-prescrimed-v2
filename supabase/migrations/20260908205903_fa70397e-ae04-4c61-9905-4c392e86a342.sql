-- 1. Trilha de auditoria imutável
CREATE TABLE public.audit_log_critico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  acao text NOT NULL,
  modulo text NOT NULL,
  entidade text,
  entidade_id text,
  severidade text NOT NULL DEFAULT 'info',
  ip text,
  user_agent text,
  detalhes jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_critico_user ON public.audit_log_critico (user_id, criado_em DESC);
CREATE INDEX idx_audit_log_critico_modulo ON public.audit_log_critico (modulo, criado_em DESC);

GRANT SELECT, INSERT ON public.audit_log_critico TO authenticated;
GRANT ALL ON public.audit_log_critico TO service_role;
ALTER TABLE public.audit_log_critico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_insert_self" ON public.audit_log_critico
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "audit_select_self" ON public.audit_log_critico
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "audit_select_admin" ON public.audit_log_critico
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Bloqueia edição/remoção mesmo para donos de tabela via trigger
CREATE OR REPLACE FUNCTION public.audit_log_imutavel()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Registros de auditoria são imutáveis';
END;
$$;
CREATE TRIGGER trg_audit_log_imutavel
  BEFORE UPDATE OR DELETE ON public.audit_log_critico
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_imutavel();

-- 2. Consentimentos (termos de uso / política de privacidade)
CREATE TABLE public.lgpd_consentimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  documento text NOT NULL,
  versao text NOT NULL,
  aceito boolean NOT NULL DEFAULT true,
  ip text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, documento, versao)
);
GRANT SELECT, INSERT ON public.lgpd_consentimentos TO authenticated;
GRANT ALL ON public.lgpd_consentimentos TO service_role;
ALTER TABLE public.lgpd_consentimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consent_self_select" ON public.lgpd_consentimentos
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "consent_self_insert" ON public.lgpd_consentimentos
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "consent_admin_select" ON public.lgpd_consentimentos
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3. Solicitações do titular de dados
CREATE TABLE public.lgpd_solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  descricao text,
  resposta text,
  prazo_legal timestamptz NOT NULL DEFAULT (now() + interval '15 days'),
  concluido_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.lgpd_solicitacoes TO authenticated;
GRANT ALL ON public.lgpd_solicitacoes TO service_role;
ALTER TABLE public.lgpd_solicitacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lgpd_self_select" ON public.lgpd_solicitacoes
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "lgpd_self_insert" ON public.lgpd_solicitacoes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "lgpd_admin_select" ON public.lgpd_solicitacoes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "lgpd_admin_update" ON public.lgpd_solicitacoes
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_lgpd_solicitacoes_updated
  BEFORE UPDATE ON public.lgpd_solicitacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

-- 4. Políticas de retenção por módulo
CREATE TABLE public.lgpd_politicas_retencao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo text NOT NULL UNIQUE,
  descricao text NOT NULL,
  meses_retencao integer NOT NULL,
  base_legal text NOT NULL,
  anonimizar_ao_expirar boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lgpd_politicas_retencao TO authenticated;
GRANT ALL ON public.lgpd_politicas_retencao TO service_role;
ALTER TABLE public.lgpd_politicas_retencao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "retencao_select" ON public.lgpd_politicas_retencao
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "retencao_admin_all" ON public.lgpd_politicas_retencao
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_retencao_updated
  BEFORE UPDATE ON public.lgpd_politicas_retencao
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

INSERT INTO public.lgpd_politicas_retencao (modulo, descricao, meses_retencao, base_legal, anonimizar_ao_expirar) VALUES
  ('documentos_emitidos', 'Prescrições, atestados, relatórios e laudos emitidos', 240, 'Resolução CFM 1.821/2007 — guarda de prontuário por 20 anos', false),
  ('internacoes_aih', 'Autorizações de internação hospitalar', 240, 'Normativa SUS e guarda de prontuário', false),
  ('notificacoes_compulsorias', 'Fichas de notificação compulsória', 120, 'Portaria de notificação compulsória do Ministério da Saúde', false),
  ('auditoria', 'Trilha de auditoria de ações críticas', 60, 'LGPD art. 37 — registro das operações de tratamento', false),
  ('logs_ia', 'Registros de uso de assistentes de IA', 12, 'LGPD art. 6º — necessidade e minimização', true),
  ('dados_paciente', 'Dados identificáveis de paciente no aplicativo', 60, 'LGPD art. 16 — eliminação após finalidade', true);