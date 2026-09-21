-- AdminRoute libera admin OU revisor em /admin/curadoria e /admin/promocao-base
-- (useIVPermissions: canEdit/canApprove = isAdmin || isReviewer), mas a RLS das
-- tabelas de staging/curadoria era admin-only — revisor entrava na tela e toda
-- leitura/gravação caía em 403 do PostgREST. Alinha a RLS ao mesmo padrão já
-- usado em base_patologia_exames (base_write_admin_revisor).
--
-- fn_etl_promover_etapa/fn_etl_promover_tudo (promoção final para produção)
-- continuam admin-only de propósito — não é bug, é a etapa mais sensível do
-- pipeline. Aqui só destravamos a CURADORIA (revisar conflitos, decidir,
-- promover para as tabelas base_*) e a VISIBILIDADE do log de ETL.

DROP POLICY IF EXISTS "Admins gerenciam stg_import_lotes" ON public.stg_import_lotes;
CREATE POLICY "stg_import_lotes_admin_revisor" ON public.stg_import_lotes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role));

DROP POLICY IF EXISTS "stg_admin_only" ON public.stg_exames;
CREATE POLICY "stg_exames_admin_revisor" ON public.stg_exames
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role));

DROP POLICY IF EXISTS "stg_admin_only" ON public.stg_patologias;
CREATE POLICY "stg_patologias_admin_revisor" ON public.stg_patologias
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role));

DROP POLICY IF EXISTS "stg_admin_only" ON public.stg_patologia_exames;
CREATE POLICY "stg_patologia_exames_admin_revisor" ON public.stg_patologia_exames
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role));

DROP POLICY IF EXISTS "Admins gerenciam curadoria_decisoes" ON public.curadoria_decisoes;
CREATE POLICY "curadoria_decisoes_admin_revisor" ON public.curadoria_decisoes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role));

-- Log de ETL: revisor passa a ENXERGAR o histórico de promoção (informativo).
-- Disparar a promoção continua exclusivo do admin (fn_etl_promover_etapa/tudo).
DROP POLICY IF EXISTS "etl_log_admin_select" ON public.etl_promocao_log;
CREATE POLICY "etl_log_admin_revisor_select" ON public.etl_promocao_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role));
