DO $$
DECLARE
  t text;
  p record;
  base_tables text[] := ARRAY[
    'base_referencias_clinicas','base_patologias_ref','base_exames','base_patologia_exames',
    'base_sinais_alarme','base_escores_clinicos','base_escore_itens','base_medicamentos_geral',
    'base_medicamentos_dose','base_medicamentos_populacao','base_medicamentos_interacoes',
    'base_medicamentos_contraindicacoes','base_iv_diluicao','base_medicamentos_regulatorio',
    'base_medicamentos_monitoramento','base_medicamentos_alerta','base_medicamentos_equivalencia'
  ];
  stg_tables text[] := ARRAY[
    'stg_patologias','stg_exames','stg_patologia_exames','stg_sinais_alarme','stg_escores',
    'stg_escore_itens','stg_med_principio','stg_med_apresentacao','stg_med_dose',
    'stg_med_populacao','stg_med_interacao','stg_med_contraindicacao','stg_med_iv','stg_med_regulatorio'
  ];
BEGIN
  FOREACH t IN ARRAY base_tables || stg_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
    END LOOP;
  END LOOP;

  FOREACH t IN ARRAY base_tables LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('CREATE POLICY "base_select_authenticated" ON public.%I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format($f$CREATE POLICY "base_write_admin_revisor" ON public.%I FOR ALL TO authenticated
      USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'revisor'))
      WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'revisor'))$f$, t);
  END LOOP;

  FOREACH t IN ARRAY stg_tables LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format($f$CREATE POLICY "stg_admin_only" ON public.%I FOR ALL TO authenticated
      USING (public.has_role(auth.uid(),'admin'))
      WITH CHECK (public.has_role(auth.uid(),'admin'))$f$, t);
  END LOOP;
END $$;