-- 1) Tabelas definitivas
CREATE TABLE IF NOT EXISTS public.base_patologias_clinicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text,
  nome_patologia text NOT NULL,
  nome_normalizado text GENERATED ALWAYS AS (public.iv_normalize_text(nome_patologia)) STORED,
  sinonimos text,
  cid10 text,
  cid11 text,
  categoria_clinica text,
  is_emergencia text,
  patologia_pai text,
  subtipo text,
  contexto_predominante text,
  fonte_id text,
  trecho_citado text,
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (nome_patologia)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.base_patologias_clinicas TO authenticated;
GRANT ALL ON public.base_patologias_clinicas TO service_role;
ALTER TABLE public.base_patologias_clinicas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins gerenciam base_patologias_clinicas" ON public.base_patologias_clinicas
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Autenticados leem patologias aprovadas" ON public.base_patologias_clinicas
  FOR SELECT TO authenticated USING (status = 'aprovado');
CREATE TRIGGER trg_bpc_updated BEFORE UPDATE ON public.base_patologias_clinicas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.base_exames_clinicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text,
  nome_exame text NOT NULL,
  nome_normalizado text GENERATED ALWAYS AS (public.iv_normalize_text(nome_exame)) STORED,
  sigla text,
  sinonimos text,
  tipo_exame text,
  categoria text,
  loinc text,
  tuss text,
  sigtap text,
  amostra_metodo text,
  preparo_paciente text,
  jejum_horas text,
  tempo_resultado_horas text,
  disponivel_sus text,
  observacoes text,
  fonte_id text,
  trecho_citado text,
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (nome_exame)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.base_exames_clinicos TO authenticated;
GRANT ALL ON public.base_exames_clinicos TO service_role;
ALTER TABLE public.base_exames_clinicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins gerenciam base_exames_clinicos" ON public.base_exames_clinicos
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Autenticados leem exames aprovados" ON public.base_exames_clinicos
  FOR SELECT TO authenticated USING (status = 'aprovado');
CREATE TRIGGER trg_bec_updated BEFORE UPDATE ON public.base_exames_clinicos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.base_patologia_exames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text,
  nome_patologia text NOT NULL,
  subtipo text,
  nome_exame text NOT NULL,
  finalidade text,
  obrigatoriedade text,
  contextos text,
  momento_solicitation text,
  idade_min_anos text,
  idade_max_anos text,
  sexo_alvo text,
  aplica_gestante text,
  justificativa_padrao text,
  interpretacao_esperada text,
  criterio_positividade text,
  conduta_se_alterado text,
  nivel_evidencia text,
  forca_recomendacao text,
  repetir_em_horas text,
  nao_solicitar_se text,
  fonte_id text,
  trecho_citado text,
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (nome_patologia, nome_exame, subtipo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.base_patologia_exames TO authenticated;
GRANT ALL ON public.base_patologia_exames TO service_role;
ALTER TABLE public.base_patologia_exames ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins gerenciam base_patologia_exames" ON public.base_patologia_exames
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Autenticados leem vinculos aprovados" ON public.base_patologia_exames
  FOR SELECT TO authenticated USING (status = 'aprovado');
CREATE TRIGGER trg_bpe_updated BEFORE UPDATE ON public.base_patologia_exames
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.base_rastreamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text,
  nome_rastreamento text NOT NULL,
  patologia_alvo text,
  exame_metodo text,
  populacao_alvo text,
  sexo_alvo text,
  idade_inicio text,
  idade_fim text,
  intervalo_meses text,
  condicao_de_risco text,
  forca_recomendacao text,
  nivel_evidencia text,
  orgao_emissor text,
  incorporado_sus text,
  divergencia_internacional text,
  acao_se_positivo text,
  fonte_id text,
  trecho_citado text,
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (nome_rastreamento, patologia_alvo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.base_rastreamentos TO authenticated;
GRANT ALL ON public.base_rastreamentos TO service_role;
ALTER TABLE public.base_rastreamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins gerenciam base_rastreamentos" ON public.base_rastreamentos
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Autenticados leem rastreamentos aprovados" ON public.base_rastreamentos
  FOR SELECT TO authenticated USING (status = 'aprovado');
CREATE TRIGGER trg_brast_updated BEFORE UPDATE ON public.base_rastreamentos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Decisoes de curadoria
CREATE TABLE IF NOT EXISTS public.curadoria_decisoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  tipo text NOT NULL,
  chave text NOT NULL,
  decisao text NOT NULL,
  detalhe text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lote_id, tipo, chave)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.curadoria_decisoes TO authenticated;
GRANT ALL ON public.curadoria_decisoes TO service_role;
ALTER TABLE public.curadoria_decisoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins gerenciam curadoria_decisoes" ON public.curadoria_decisoes
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_curadoria_updated BEFORE UPDATE ON public.curadoria_decisoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Visoes de curadoria
CREATE OR REPLACE VIEW public.vw_stg_orfaos
WITH (security_invoker = on) AS
SELECT
  pe.id,
  pe.lote_id,
  pe.nome_patologia,
  pe.nome_exame,
  pe.linha_bruta,
  (NOT EXISTS (
    SELECT 1 FROM public.stg_patologias p
    WHERE public.iv_normalize_text(p.nome_patologia) = public.iv_normalize_text(pe.nome_patologia)
  ) AND NOT EXISTS (
    SELECT 1 FROM public.base_patologias_clinicas bp
    WHERE bp.nome_normalizado = public.iv_normalize_text(pe.nome_patologia)
  )) AS patologia_orfa,
  (NOT EXISTS (
    SELECT 1 FROM public.stg_exames e
    WHERE public.iv_normalize_text(e.nome_exame) = public.iv_normalize_text(pe.nome_exame)
  ) AND NOT EXISTS (
    SELECT 1 FROM public.base_exames_clinicos be
    WHERE be.nome_normalizado = public.iv_normalize_text(pe.nome_exame)
  )) AS exame_orfao
FROM public.stg_patologia_exames pe;

CREATE OR REPLACE VIEW public.vw_stg_conflitos
WITH (security_invoker = on) AS
SELECT
  a.lote_id,
  a.nome_patologia,
  a.nome_exame,
  a.id AS id_a,
  a.obrigatoriedade AS obrigatoriedade_a,
  a.nivel_evidencia AS nivel_evidencia_a,
  a.conduta_se_alterado AS conduta_a,
  a.fonte_id AS fonte_a,
  a.created_at AS data_a,
  b.id AS id_b,
  b.obrigatoriedade AS obrigatoriedade_b,
  b.nivel_evidencia AS nivel_evidencia_b,
  b.conduta_se_alterado AS conduta_b,
  b.fonte_id AS fonte_b,
  b.created_at AS data_b
FROM public.stg_patologia_exames a
JOIN public.stg_patologia_exames b
  ON a.id < b.id
 AND public.iv_normalize_text(a.nome_patologia) = public.iv_normalize_text(b.nome_patologia)
 AND public.iv_normalize_text(a.nome_exame) = public.iv_normalize_text(b.nome_exame)
WHERE coalesce(a.obrigatoriedade,'') IS DISTINCT FROM coalesce(b.obrigatoriedade,'')
   OR coalesce(a.nivel_evidencia,'') IS DISTINCT FROM coalesce(b.nivel_evidencia,'')
   OR coalesce(a.conduta_se_alterado,'') IS DISTINCT FROM coalesce(b.conduta_se_alterado,'');

CREATE OR REPLACE VIEW public.vw_exames_quase_duplicados
WITH (security_invoker = on) AS
SELECT
  a.lote_id,
  a.id AS id_a,
  a.nome_exame AS nome_a,
  a.sigla AS sigla_a,
  b.id AS id_b,
  b.nome_exame AS nome_b,
  b.sigla AS sigla_b
FROM public.stg_exames a
JOIN public.stg_exames b
  ON a.id < b.id
WHERE public.iv_normalize_text(a.nome_exame) <> public.iv_normalize_text(b.nome_exame)
  AND (
    replace(public.iv_normalize_text(a.nome_exame),' ','') = replace(public.iv_normalize_text(b.nome_exame),' ','')
    OR public.iv_normalize_text(a.nome_exame) LIKE public.iv_normalize_text(b.nome_exame) || '%'
    OR public.iv_normalize_text(b.nome_exame) LIKE public.iv_normalize_text(a.nome_exame) || '%'
    OR (a.sigla IS NOT NULL AND b.sigla IS NOT NULL AND public.iv_normalize_text(a.sigla) = public.iv_normalize_text(b.sigla))
  );

-- 4) Funcoes de promocao
CREATE OR REPLACE FUNCTION public.promover_stg_patologias(_lote_id text)
RETURNS integer LANGUAGE plpgsql SET search_path = public AS $$
DECLARE n integer;
BEGIN
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
  INSERT INTO public.base_exames_clinicos
    (lote_id, nome_exame, sigla, sinonimos, tipo_exame, categoria, loinc, tuss, sigtap,
     amostra_metodo, preparo_paciente, jejum_horas, tempo_resultado_horas, disponivel_sus,
     observacoes, fonte_id, trecho_citado)
  SELECT s.lote_id, s.nome_exame, s.sigla, s.sinonimos, s.tipo_exame, s.categoria, s.loinc, s.tuss, s.sigtap,
         s.amostra_metodo, s.preparo_paciente, s.jejum_horas, s.tempo_resultado_horas, s.disponivel_sus,
         s.observacoes, s.fonte_id, s.trecho_citado
  FROM public.stg_exames s
  WHERE s.lote_id = _lote_id AND s.nome_exame IS NOT NULL
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
  INSERT INTO public.base_patologia_exames
    (lote_id, nome_patologia, subtipo, nome_exame, finalidade, obrigatoriedade, contextos,
     momento_solicitation, idade_min_anos, idade_max_anos, sexo_alvo, aplica_gestante,
     justificativa_padrao, interpretacao_esperada, criterio_positividade, conduta_se_alterado,
     nivel_evidencia, forca_recomendacao, repetir_em_horas, nao_solicitar_se, fonte_id, trecho_citado)
  SELECT s.lote_id, s.nome_patologia, coalesce(s.subtipo,''), s.nome_exame, s.finalidade, s.obrigatoriedade, s.contextos,
         s.momento_solicitation, s.idade_min_anos, s.idade_max_anos, s.sexo_alvo, s.aplica_gestante,
         s.justificativa_padrao, s.interpretacao_esperada, s.criterio_positividade, s.conduta_se_alterado,
         s.nivel_evidencia, s.forca_recomendacao, s.repetir_em_horas, s.nao_solicitar_se, s.fonte_id, s.trecho_citado
  FROM public.stg_patologia_exames s
  WHERE s.lote_id = _lote_id AND s.nome_patologia IS NOT NULL AND s.nome_exame IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.curadoria_decisoes d
      WHERE d.lote_id = _lote_id AND d.tipo = 'conflito'
        AND d.decisao = 'descartar' AND d.chave = s.id::text
    )
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
    lote_id = EXCLUDED.lote_id, updated_at = now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.promover_stg_rastreamentos(_lote_id text)
RETURNS integer LANGUAGE plpgsql SET search_path = public AS $$
DECLARE n integer;
BEGIN
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