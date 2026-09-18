DROP POLICY IF EXISTS "indicadores_ps_select_auth" ON public.indicadores_qualidade_ps;
CREATE POLICY "indicadores_ps_select_authenticated"
ON public.indicadores_qualidade_ps FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);
REVOKE ALL ON public.indicadores_qualidade_ps FROM anon;

DROP POLICY IF EXISTS "override_red_flag_select_auth" ON public.stg_regras_override_red_flag;
CREATE POLICY "override_red_flag_select_authenticated"
ON public.stg_regras_override_red_flag FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);
REVOKE ALL ON public.stg_regras_override_red_flag FROM anon;

DROP POLICY IF EXISTS "Auth read beta_settings" ON public.beta_settings;
CREATE POLICY "beta_settings_select_authenticated"
ON public.beta_settings FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);
REVOKE ALL ON public.beta_settings FROM anon;