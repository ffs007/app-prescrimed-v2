-- 1) Tabelas consultadas pelo front-end que nunca foram criadas.

CREATE TABLE IF NOT EXISTS public.patologias_usuario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cid10 text,
  categoria text,
  ambientes text[] NOT NULL DEFAULT '{}',
  gravidade text,
  sinonimos text[] NOT NULL DEFAULT '{}',
  medicamentos jsonb NOT NULL DEFAULT '[]'::jsonb,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patologias_usuario_user ON public.patologias_usuario (user_id, ativo);
ALTER TABLE public.patologias_usuario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patologias_usuario_own" ON public.patologias_usuario
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_patologias_usuario_updated_at
  BEFORE UPDATE ON public.patologias_usuario
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.patologia_conteudo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_normalizado text NOT NULL,
  ambiente text,
  secao text NOT NULL,
  conteudo jsonb NOT NULL DEFAULT '{}'::jsonb,
  ordem integer NOT NULL DEFAULT 0,
  fonte text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patologia_conteudo_nome ON public.patologia_conteudo (nome_normalizado, ordem);

CREATE TABLE IF NOT EXISTS public.patologia_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_normalizado text NOT NULL,
  ambiente text,
  documento text NOT NULL,
  prioridade integer NOT NULL DEFAULT 0,
  nota text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patologia_documentos_nome ON public.patologia_documentos (nome_normalizado, prioridade DESC);

CREATE TABLE IF NOT EXISTS public.patologia_recursos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_normalizado text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('protocolo','escore','trial','guideline','link')),
  titulo text NOT NULL,
  codigo text,
  resumo text,
  url text,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patologia_recursos_nome ON public.patologia_recursos (nome_normalizado, ordem);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['patologia_conteudo','patologia_documentos','patologia_recursos'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (ativo = true)', t || '_read', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), %L::public.app_role)) WITH CHECK (public.has_role(auth.uid(), %L::public.app_role))',
      t || '_admin_write', t, 'admin', 'admin');
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', 'trg_' || t || '_updated_at', t);
  END LOOP;
END $$;

-- 2) RPCs administrativas: EXECUTE para authenticated, com checagem interna de papel admin.
-- Chamadas sem JWT de usuário (service_role, migrations, SQL editor) continuam permitidas.

CREATE OR REPLACE FUNCTION public.fn_guard_admin_or_service()
RETURNS void
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'authenticated' AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: requer perfil de administrador' USING ERRCODE = '42501';
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.fn_guard_admin_or_service() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_guard_admin_or_service() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.promover_stg_patologias(_lote_id text)
RETURNS integer LANGUAGE plpgsql SET search_path = public AS $$
DECLARE n integer;
BEGIN
  PERFORM public.fn_guard_admin_or_service();
  INSERT INTO public.base_patologias_clinicas
    (lote_id, nome_patologia, sinonimos, cid10, cid11, categoria_clinica, is_emergencia,
     patologia_pai, subtipo, contexto_predominante, fonte_id, trecho_citado)
  SELECT s.lote_id, s.nome_patologia, s.sinonimos, s.cid10, s.cid11, s.categoria_clinica, s.is_emergencia,
         s.patologia_pai, s.subtipo, s.contexto_predominante, s.fonte_id, s.trecho_citado
  FROM public.stg_patologias s
  WHERE s.lote_id = _lote_id AND s.nome_patologia IS NOT NULL
  ON CONFLICT (nome_patologia) DO UPDATE SET
    sinonimos = EXCLUDED.sinonimos, cid10 = EXCLUDED.cid10, cid11 = EXCLUDED.cid11,
    categoria_clinica = EXCLUDED.categoria_clinica, is_emergencia = EXCLUDED.is_emergencia,
    patologia_pai = EXCLUDED.patologia_pai, subtipo = EXCLUDED.subtipo,
    contexto_predominante = EXCLUDED.contexto_predominante, fonte_id = EXCLUDED.fonte_id,
    trecho_citado = EXCLUDED.trecho_citado, lote_id = EXCLUDED.lote_id, updated_at = now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.promover_stg_exames(_lote_id text)
RETURNS integer LANGUAGE plpgsql SET search_path = public AS $$
DECLARE n integer;
BEGIN
  PERFORM public.fn_guard_admin_or_service();
  INSERT INTO public.base_exames_clinicos
    (lote_id, nome_exame, sigla, sinonimos, tipo_exame, categoria, loinc, tuss, sigtap,
     amostra_metodo, preparo_paciente, jejum_horas, tempo_resultado_horas, disponivel_sus,
     observacoes, fonte_id, trecho_citado)
  SELECT DISTINCT ON (s.nome_exame)
         s.lote_id, s.nome_exame, s.sigla, s.sinonimos, s.tipo_exame, s.categoria, s.loinc, s.tuss, s.sigtap,
         s.amostra_metodo, s.preparo_paciente, s.jejum_horas, s.tempo_resultado_horas, s.disponivel_sus,
         s.observacoes, s.fonte_id, s.trecho_citado
  FROM public.stg_exames s
  WHERE s.lote_id = _lote_id AND s.nome_exame IS NOT NULL
  ORDER BY s.nome_exame, s.id
  ON CONFLICT (nome_exame) DO UPDATE SET
    sigla = EXCLUDED.sigla, sinonimos = EXCLUDED.sinonimos, tipo_exame = EXCLUDED.tipo_exame,
    categoria = EXCLUDED.categoria, loinc = EXCLUDED.loinc, tuss = EXCLUDED.tuss, sigtap = EXCLUDED.sigtap,
    amostra_metodo = EXCLUDED.amostra_metodo, preparo_paciente = EXCLUDED.preparo_paciente,
    jejum_horas = EXCLUDED.jejum_horas, tempo_resultado_horas = EXCLUDED.tempo_resultado_horas,
    disponivel_sus = EXCLUDED.disponivel_sus, observacoes = EXCLUDED.observacoes,
    fonte_id = EXCLUDED.fonte_id, trecho_citado = EXCLUDED.trecho_citado,
    lote_id = EXCLUDED.lote_id, updated_at = now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.promover_stg_patologia_exames(_lote_id text)
RETURNS integer LANGUAGE plpgsql SET search_path = public AS $$
DECLARE n integer;
BEGIN
  PERFORM public.fn_guard_admin_or_service();
  INSERT INTO public.base_patologia_exames
    (lote_id, nome_patologia, subtipo, nome_exame, finalidade, obrigatoriedade, contextos,
     momento_solicitation, idade_min_anos, idade_max_anos, sexo_alvo, aplica_gestante,
     justificativa_padrao, interpretacao_esperada, criterio_positividade, conduta_se_alterado,
     nivel_evidencia, forca_recomendacao, repetir_em_horas, nao_solicitar_se, fonte_id, trecho_citado,
     linha_recomendacao, status)
  SELECT DISTINCT ON (btrim(s.nome_patologia), btrim(s.nome_exame),
                      COALESCE(NULLIF(NULLIF(btrim(s.subtipo),''),'NAO_NA_FONTE'),'-'))
    s.lote_id, btrim(s.nome_patologia),
    COALESCE(NULLIF(NULLIF(btrim(s.subtipo),''),'NAO_NA_FONTE'),'-'),
    btrim(s.nome_exame), s.finalidade, s.obrigatoriedade, s.contextos,
    COALESCE(NULLIF(btrim(s.momento_solicitation),''), s.momento_solicitacao),
    s.idade_min_anos, s.idade_max_anos, s.sexo_alvo, s.aplica_gestante,
    s.justificativa_padrao, s.interpretacao_esperada, s.criterio_positividade, s.conduta_se_alterado,
    s.nivel_evidencia, s.forca_recomendacao, s.repetir_em_horas, s.nao_solicitar_se, s.fonte_id,
    s.trecho_citado, s.linha_recomendacao, 'ativo'
  FROM public.stg_patologia_exames s
  WHERE s.lote_id = _lote_id AND s.nome_patologia IS NOT NULL AND s.nome_exame IS NOT NULL
    AND btrim(s.nome_patologia) <> '' AND btrim(s.nome_exame) <> ''
    AND NOT EXISTS (
      SELECT 1 FROM public.curadoria_decisoes d
      WHERE d.lote_id = _lote_id AND d.tipo = 'conflito'
        AND d.decisao = 'descartar' AND d.chave = s.id::text
    )
  ORDER BY btrim(s.nome_patologia), btrim(s.nome_exame),
           COALESCE(NULLIF(NULLIF(btrim(s.subtipo),''),'NAO_NA_FONTE'),'-'),
           s.updated_at DESC NULLS LAST
  ON CONFLICT (nome_patologia, nome_exame, subtipo) DO UPDATE SET
    finalidade = EXCLUDED.finalidade, obrigatoriedade = EXCLUDED.obrigatoriedade,
    contextos = EXCLUDED.contextos, momento_solicitation = EXCLUDED.momento_solicitation,
    idade_min_anos = EXCLUDED.idade_min_anos, idade_max_anos = EXCLUDED.idade_max_anos,
    sexo_alvo = EXCLUDED.sexo_alvo, aplica_gestante = EXCLUDED.aplica_gestante,
    justificativa_padrao = EXCLUDED.justificativa_padrao,
    interpretacao_esperada = EXCLUDED.interpretacao_esperada,
    criterio_positividade = EXCLUDED.criterio_positividade,
    conduta_se_alterado = EXCLUDED.conduta_se_alterado,
    nivel_evidencia = EXCLUDED.nivel_evidencia, forca_recomendacao = EXCLUDED.forca_recomendacao,
    repetir_em_horas = EXCLUDED.repetir_em_horas, nao_solicitar_se = EXCLUDED.nao_solicitar_se,
    fonte_id = EXCLUDED.fonte_id, trecho_citado = EXCLUDED.trecho_citado,
    linha_recomendacao = EXCLUDED.linha_recomendacao,
    lote_id = EXCLUDED.lote_id, updated_at = now();
  GET DIAGNOSTICS n = ROW_COUNT;

  UPDATE public.stg_patologia_exames SET processado = true
  WHERE lote_id = _lote_id AND nome_patologia IS NOT NULL AND nome_exame IS NOT NULL;

  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.promover_stg_rastreamentos(_lote_id text)
RETURNS integer LANGUAGE plpgsql SET search_path = public AS $$
DECLARE n integer;
BEGIN
  PERFORM public.fn_guard_admin_or_service();
  INSERT INTO public.base_rastreamentos
    (lote_id, nome_rastreamento, patologia_alvo, exame_metodo, populacao_alvo, sexo_alvo,
     idade_inicio, idade_fim, intervalo_meses, condicao_de_risco, forca_recomendacao,
     nivel_evidencia, orgao_emissor, incorporado_sus, divergencia_internacional,
     acao_se_positivo, fonte_id, trecho_citado)
  SELECT s.lote_id, s.nome_rastreamento, coalesce(s.patologia_alvo,''), s.exame_metodo, s.populacao_alvo, s.sexo_alvo,
         s.idade_inicio, s.idade_fim, s.intervalo_meses, s.condicao_de_risco, s.forca_recomendacao,
         s.nivel_evidencia, s.orgao_emissor, s.incorporado_sus, s.divergencia_internacional,
         s.acao_se_positivo, s.fonte_id, s.trecho_citado
  FROM public.stg_rastreamentos s
  WHERE s.lote_id = _lote_id AND s.nome_rastreamento IS NOT NULL
  ON CONFLICT (nome_rastreamento, patologia_alvo) DO UPDATE SET
    exame_metodo = EXCLUDED.exame_metodo, populacao_alvo = EXCLUDED.populacao_alvo,
    sexo_alvo = EXCLUDED.sexo_alvo, idade_inicio = EXCLUDED.idade_inicio, idade_fim = EXCLUDED.idade_fim,
    intervalo_meses = EXCLUDED.intervalo_meses, condicao_de_risco = EXCLUDED.condicao_de_risco,
    forca_recomendacao = EXCLUDED.forca_recomendacao, nivel_evidencia = EXCLUDED.nivel_evidencia,
    orgao_emissor = EXCLUDED.orgao_emissor, incorporado_sus = EXCLUDED.incorporado_sus,
    divergencia_internacional = EXCLUDED.divergencia_internacional,
    acao_se_positivo = EXCLUDED.acao_se_positivo, fonte_id = EXCLUDED.fonte_id,
    trecho_citado = EXCLUDED.trecho_citado, lote_id = EXCLUDED.lote_id, updated_at = now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.aprovar_lote(_lote_id text)
RETURNS integer LANGUAGE plpgsql SET search_path = public AS $$
DECLARE n integer := 0; k integer;
BEGIN
  PERFORM public.fn_guard_admin_or_service();
  UPDATE public.base_patologias_clinicas SET status = 'aprovado' WHERE lote_id = _lote_id AND status <> 'aprovado';
  GET DIAGNOSTICS k = ROW_COUNT; n := n + k;
  UPDATE public.base_exames_clinicos SET status = 'aprovado' WHERE lote_id = _lote_id AND status <> 'aprovado';
  GET DIAGNOSTICS k = ROW_COUNT; n := n + k;
  UPDATE public.base_patologia_exames SET status = 'aprovado' WHERE lote_id = _lote_id AND status <> 'aprovado';
  GET DIAGNOSTICS k = ROW_COUNT; n := n + k;
  UPDATE public.base_rastreamentos SET status = 'aprovado' WHERE lote_id = _lote_id AND status <> 'aprovado';
  GET DIAGNOSTICS k = ROW_COUNT; n := n + k;
  RETURN n;
END $$;

-- fn_etl_promover_etapa / fn_etl_promover_tudo já validam has_role(auth.uid(),'admin') no corpo.
REVOKE ALL ON FUNCTION public.promover_stg_patologias(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.promover_stg_exames(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.promover_stg_patologia_exames(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.promover_stg_rastreamentos(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.aprovar_lote(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_etl_promover_etapa(text, text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_etl_promover_tudo(text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.promover_stg_patologias(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.promover_stg_exames(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.promover_stg_patologia_exames(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.promover_stg_rastreamentos(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.aprovar_lote(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_etl_promover_etapa(text, text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_etl_promover_tudo(text) TO authenticated, service_role;
