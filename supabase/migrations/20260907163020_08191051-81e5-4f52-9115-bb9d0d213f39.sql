-- audit_medflow_ps: leitura restrita a admin/revisor ou ao próprio profissional
DROP POLICY IF EXISTS "audit_medflow_ps_select_authenticated" ON public.audit_medflow_ps;
CREATE POLICY "audit_medflow_ps_select_own_or_admin"
ON public.audit_medflow_ps
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'revisor')
  OR profissional_id = auth.uid()::text
);

-- audit_protocolo_execucao: leitura e escrita vinculadas ao profissional
DROP POLICY IF EXISTS "audit_protocolo_execucao_select_authenticated" ON public.audit_protocolo_execucao;
DROP POLICY IF EXISTS "audit_protocolo_execucao_insert_authenticated" ON public.audit_protocolo_execucao;
DROP POLICY IF EXISTS "audit_protocolo_execucao_update_authenticated" ON public.audit_protocolo_execucao;

CREATE POLICY "audit_protocolo_execucao_select_own_or_admin"
ON public.audit_protocolo_execucao
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'revisor')
  OR profissional_id = auth.uid()::text
);

CREATE POLICY "audit_protocolo_execucao_insert_own"
ON public.audit_protocolo_execucao
FOR INSERT
TO authenticated
WITH CHECK (
  profissional_id = auth.uid()::text
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'revisor')
);

CREATE POLICY "audit_protocolo_execucao_update_own_or_admin"
ON public.audit_protocolo_execucao
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'revisor')
  OR profissional_id = auth.uid()::text
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'revisor')
  OR profissional_id = auth.uid()::text
);