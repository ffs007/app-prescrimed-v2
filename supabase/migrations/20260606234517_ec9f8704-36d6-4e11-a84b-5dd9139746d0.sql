DROP POLICY IF EXISTS "Auth read assinatura_digital_config" ON public.assinatura_digital_config;
CREATE POLICY "Admin read assinatura_digital_config"
  ON public.assinatura_digital_config
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Auth read uso_continuo" ON public.medicacoes_uso_continuo;
CREATE POLICY "Owner/admin read uso_continuo"
  ON public.medicacoes_uso_continuo
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = criado_por) OR has_role(auth.uid(), 'admin'::app_role));