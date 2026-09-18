-- Remove regras antigas e permissivas da auditoria de protocolo (duplicadas)
DROP POLICY IF EXISTS "Auditoria de protocolo legível por usuários autenticados" ON public.audit_protocolo_execucao;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir auditoria de protocolo" ON public.audit_protocolo_execucao;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar próprios registros de auditoria" ON public.audit_protocolo_execucao;

-- Configurações globais: leitura apenas para usuários logados (nunca visitantes anônimos)
DROP POLICY IF EXISTS "Auth read documentos_settings" ON public.documentos_settings;
CREATE POLICY "documentos_settings_select_authenticated"
ON public.documentos_settings FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);
REVOKE ALL ON public.documentos_settings FROM anon;

DROP POLICY IF EXISTS "Auth read entrada_inteligente_settings" ON public.entrada_inteligente_settings;
CREATE POLICY "entrada_inteligente_settings_select_authenticated"
ON public.entrada_inteligente_settings FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);
REVOKE ALL ON public.entrada_inteligente_settings FROM anon;