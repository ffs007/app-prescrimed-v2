
CREATE TABLE public.ia_credenciais_usuario (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  perplexity_key TEXT,
  openrouter_key TEXT,
  modelo_preferido TEXT NOT NULL DEFAULT 'anthropic/claude-sonnet-4',
  atualizacoes_automaticas BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ia_credenciais_usuario TO authenticated;
GRANT ALL ON public.ia_credenciais_usuario TO service_role;
ALTER TABLE public.ia_credenciais_usuario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ia credentials" ON public.ia_credenciais_usuario FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_ia_cred_updated BEFORE UPDATE ON public.ia_credenciais_usuario
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE TABLE public.ia_atualizacoes_pendentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  patologia TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'protocolo',
  titulo TEXT NOT NULL,
  resumo TEXT,
  conteudo_novo TEXT,
  conteudo_anterior TEXT,
  fonte TEXT,
  referencia TEXT,
  url TEXT,
  provedor TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  revisado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ia_atualizacoes_pendentes TO authenticated;
GRANT ALL ON public.ia_atualizacoes_pendentes TO service_role;
ALTER TABLE public.ia_atualizacoes_pendentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ia updates" ON public.ia_atualizacoes_pendentes FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_ia_atual_user_status ON public.ia_atualizacoes_pendentes (user_id, status, created_at DESC);
CREATE TRIGGER trg_ia_atual_updated BEFORE UPDATE ON public.ia_atualizacoes_pendentes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE TABLE public.protocolo_versoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  patologia TEXT NOT NULL,
  protocolo TEXT NOT NULL,
  versao INTEGER NOT NULL DEFAULT 1,
  conteudo TEXT NOT NULL DEFAULT '',
  origem TEXT NOT NULL DEFAULT 'manual',
  referencia TEXT,
  url TEXT,
  atualizacao_id UUID REFERENCES public.ia_atualizacoes_pendentes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.protocolo_versoes TO authenticated;
GRANT ALL ON public.protocolo_versoes TO service_role;
ALTER TABLE public.protocolo_versoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own protocol versions" ON public.protocolo_versoes FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_protocolo_versoes_user ON public.protocolo_versoes (user_id, protocolo, versao DESC);

CREATE TABLE public.ia_interacoes_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  modulo TEXT NOT NULL,
  provedor TEXT,
  modelo TEXT,
  assunto TEXT,
  referencias TEXT[] NOT NULL DEFAULT '{}',
  aceito BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ia_interacoes_log TO authenticated;
GRANT ALL ON public.ia_interacoes_log TO service_role;
ALTER TABLE public.ia_interacoes_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ia log read" ON public.ia_interacoes_log FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "own ia log insert" ON public.ia_interacoes_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_ia_log_user ON public.ia_interacoes_log (user_id, created_at DESC);
