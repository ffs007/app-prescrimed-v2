CREATE TABLE IF NOT EXISTS public.audit_protocolo_execucao (
  id BIGSERIAL PRIMARY KEY,
  protocolo_id uuid REFERENCES public.protocolos_ps(id),
  atendimento_id text NOT NULL,
  etapa_ordem integer NOT NULL,
  etapa_titulo text,
  tempo_previsto_min integer,
  tempo_realizado_min integer,
  dentro_prazo boolean,
  override boolean DEFAULT false,
  motivo_override text,
  profissional_id text,
  timestamp_execucao timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_protocolo_execucao TO authenticated;
GRANT ALL ON public.audit_protocolo_execucao TO service_role;

ALTER TABLE public.audit_protocolo_execucao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auditoria de protocolo legível por usuários autenticados" 
ON public.audit_protocolo_execucao FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem inserir auditoria de protocolo" 
ON public.audit_protocolo_execucao FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar próprios registros de auditoria" 
ON public.audit_protocolo_execucao FOR UPDATE TO authenticated USING (profissional_id = auth.uid()::text) WITH CHECK (profissional_id = auth.uid()::text);

CREATE POLICY "Service role pode gerenciar auditoria de protocolo" 
ON public.audit_protocolo_execucao FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_audit_prot_atendimento
ON public.audit_protocolo_execucao (atendimento_id);

CREATE INDEX IF NOT EXISTS idx_audit_prot_protocolo
ON public.audit_protocolo_execucao (protocolo_id);