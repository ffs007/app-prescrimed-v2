-- ============ Etapa 4 — Vínculo clínico e motor de sugestões ============

CREATE TYPE public.vinculo_papel AS ENUM (
  'primeira_linha','alternativa','adjuvante','sintomatico','resgate','hospitalar','situacao_especifica'
);
CREATE TYPE public.vinculo_status AS ENUM ('pending_review','reviewed','needs_correction','inactive');
CREATE TYPE public.vinculo_contexto AS ENUM ('ambulatorial','urgencia','emergencia','hospitalar','qualquer');

CREATE TABLE public.clinical_condition_medication (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condicao_tipo text NOT NULL CHECK (condicao_tipo IN ('patologia','sindrome')),
  condicao_id uuid,
  condicao_nome text NOT NULL,
  condicao_normalizada text NOT NULL,
  medicamento_id uuid NOT NULL REFERENCES public.base_medicamentos_geral(id) ON DELETE CASCADE,
  apresentacao_id uuid REFERENCES public.base_apresentacoes_medicamentos(id) ON DELETE SET NULL,
  papel public.vinculo_papel NOT NULL DEFAULT 'alternativa',
  prioridade integer NOT NULL DEFAULT 50,
  care_context public.vinculo_contexto NOT NULL DEFAULT 'qualquer',
  populacao text,
  review_status public.vinculo_status NOT NULL DEFAULT 'pending_review',
  notes text,
  source_reference text,
  versao integer NOT NULL DEFAULT 1,
  criado_por uuid,
  revisado_por uuid,
  revisado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (condicao_tipo, condicao_normalizada, medicamento_id, care_context, papel)
);

GRANT SELECT ON public.clinical_condition_medication TO authenticated;
GRANT ALL ON public.clinical_condition_medication TO service_role;
ALTER TABLE public.clinical_condition_medication ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vinculo_leitura_autenticado" ON public.clinical_condition_medication
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "vinculo_admin_escrita" ON public.clinical_condition_medication
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ccm_condicao ON public.clinical_condition_medication (condicao_tipo, condicao_normalizada, care_context);
CREATE INDEX idx_ccm_medicamento ON public.clinical_condition_medication (medicamento_id);
CREATE INDEX idx_ccm_status ON public.clinical_condition_medication (review_status);

-- ---------------- Histórico append-only ----------------
CREATE TABLE public.clinical_condition_medication_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vinculo_id uuid,
  acao text NOT NULL,
  snapshot jsonb,
  alterado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clinical_condition_medication_log TO authenticated;
GRANT ALL ON public.clinical_condition_medication_log TO service_role;
ALTER TABLE public.clinical_condition_medication_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vinculo_log_admin" ON public.clinical_condition_medication_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ---------------- Classificação de trabalho (grupos A–F) ----------------
CREATE TABLE public.medicamento_grupo_vinculo (
  medicamento_id uuid PRIMARY KEY REFERENCES public.base_medicamentos_geral(id) ON DELETE CASCADE,
  grupo text NOT NULL CHECK (grupo IN ('A','B','C','D','E','F')),
  grupo_motivo text,
  prioridade_trabalho integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.medicamento_grupo_vinculo TO authenticated;
GRANT ALL ON public.medicamento_grupo_vinculo TO service_role;
ALTER TABLE public.medicamento_grupo_vinculo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grupo_vinculo_leitura" ON public.medicamento_grupo_vinculo
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "grupo_vinculo_admin" ON public.medicamento_grupo_vinculo
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------------- Triggers ----------------
CREATE OR REPLACE FUNCTION public.fn_ccm_before_write()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.condicao_normalizada := public.clin_normalize(NEW.condicao_nome);
  NEW.updated_at := now();
  IF TG_OP = 'INSERT' THEN
    NEW.criado_por := COALESCE(NEW.criado_por, auth.uid());
    RETURN NEW;
  END IF;
  -- Alteração relevante devolve o vínculo para revisão.
  IF (NEW.medicamento_id, NEW.apresentacao_id, NEW.papel, NEW.prioridade, NEW.care_context, NEW.populacao)
     IS DISTINCT FROM
     (OLD.medicamento_id, OLD.apresentacao_id, OLD.papel, OLD.prioridade, OLD.care_context, OLD.populacao)
  THEN
    NEW.versao := OLD.versao + 1;
    IF NEW.review_status = OLD.review_status AND OLD.review_status = 'reviewed' THEN
      NEW.review_status := 'pending_review';
      NEW.revisado_por := NULL;
      NEW.revisado_em := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ccm_before_write
BEFORE INSERT OR UPDATE ON public.clinical_condition_medication
FOR EACH ROW EXECUTE FUNCTION public.fn_ccm_before_write();

CREATE OR REPLACE FUNCTION public.fn_ccm_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.clinical_condition_medication_log (vinculo_id, acao, snapshot, alterado_por)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    lower(TG_OP),
    to_jsonb(COALESCE(NEW, OLD)),
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_ccm_log
AFTER INSERT OR UPDATE OR DELETE ON public.clinical_condition_medication
FOR EACH ROW EXECUTE FUNCTION public.fn_ccm_log();

-- ---------------- Migração dos vínculos existentes ----------------
INSERT INTO public.clinical_condition_medication
  (condicao_tipo, condicao_id, condicao_nome, condicao_normalizada, medicamento_id,
   papel, prioridade, care_context, populacao, review_status, notes, source_reference, revisado_em)
SELECT 'patologia', l.patologia_id, l.patologia_nome, public.clin_normalize(l.patologia_nome), l.medicamento_id,
  (CASE l.linha
     WHEN 'primeira' THEN 'primeira_linha'
     WHEN 'alternativa' THEN 'alternativa'
     WHEN 'sintomatico' THEN 'sintomatico'
     ELSE 'adjuvante' END)::public.vinculo_papel,
  COALESCE(l.prioridade, 50),
  (CASE l.ambiente
     WHEN 'ambulatorial' THEN 'ambulatorial'
     WHEN 'urgencia' THEN 'urgencia'
     WHEN 'emergencia' THEN 'emergencia'
     WHEN 'hospitalar' THEN 'hospitalar'
     ELSE 'qualquer' END)::public.vinculo_contexto,
  l.publico,
  (CASE WHEN l.status_revisao = 'aprovado' THEN 'reviewed' ELSE 'pending_review' END)::public.vinculo_status,
  l.observacao, l.fonte,
  CASE WHEN l.status_revisao = 'aprovado' THEN l.updated_at END
FROM public.patologia_medicamento l
WHERE l.medicamento_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.clinical_condition_medication
  (condicao_tipo, condicao_id, condicao_nome, condicao_normalizada, medicamento_id,
   papel, prioridade, care_context, populacao, review_status, notes, source_reference, revisado_em)
SELECT 'sindrome', l.sindrome_id, l.sindrome_nome, public.clin_normalize(l.sindrome_nome), l.medicamento_id,
  (CASE l.linha
     WHEN 'primeira' THEN 'primeira_linha'
     WHEN 'alternativa' THEN 'alternativa'
     WHEN 'sintomatico' THEN 'sintomatico'
     ELSE 'adjuvante' END)::public.vinculo_papel,
  COALESCE(l.prioridade, 50),
  (CASE l.ambiente
     WHEN 'ambulatorial' THEN 'ambulatorial'
     WHEN 'urgencia' THEN 'urgencia'
     WHEN 'emergencia' THEN 'emergencia'
     WHEN 'hospitalar' THEN 'hospitalar'
     ELSE 'qualquer' END)::public.vinculo_contexto,
  l.publico,
  (CASE WHEN l.status_revisao = 'aprovado' THEN 'reviewed' ELSE 'pending_review' END)::public.vinculo_status,
  l.observacao, l.fonte,
  CASE WHEN l.status_revisao = 'aprovado' THEN l.updated_at END
FROM public.sindrome_medicamento l
WHERE l.medicamento_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ---------------- Motor de sugestões ----------------
CREATE OR REPLACE FUNCTION public.fn_sugestoes_terapeuticas(
  p_condicao text DEFAULT NULL,
  p_sindrome text DEFAULT NULL,
  p_contexto text DEFAULT NULL,
  p_paciente jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  vinculo_id uuid, origem text, condicao_nome text,
  medicamento_id uuid, medicamento_nome text, principio_ativo text, classe_terapeutica text,
  apresentacao text, concentracao text, via text,
  dose_adulto text, dose_pediatrica text, frequencia text, duracao text,
  papel text, prioridade integer, care_context text, populacao text, notas text,
  vinculo_revisado boolean, medicamento_liberado boolean,
  apresentacao_utilizavel boolean, dose_incompleta boolean,
  tipo_receita text, alto_risco boolean,
  evitar_gestante boolean, ajuste_renal boolean, ajuste_hepatico boolean,
  alertas_paciente text[], grupo integer
)
LANGUAGE sql STABLE SET search_path = public AS $$
  WITH ctx AS (
    SELECT NULLIF(btrim(COALESCE(p_contexto, '')), '') AS c
  ), cond AS (
    SELECT l.*, 'patologia'::text AS origem_calc
    FROM public.clinical_condition_medication l, ctx
    WHERE COALESCE(btrim(p_condicao), '') <> ''
      AND l.condicao_tipo = 'patologia'
      AND l.condicao_normalizada = public.clin_normalize(p_condicao)
      AND l.review_status <> 'inactive'
      AND (ctx.c IS NULL OR l.care_context = 'qualquer' OR l.care_context::text = ctx.c)
  ), sind AS (
    SELECT l.*, 'sindrome'::text
    FROM public.clinical_condition_medication l, ctx
    WHERE COALESCE(btrim(p_sindrome), '') <> ''
      AND NOT EXISTS (SELECT 1 FROM cond)
      AND l.condicao_tipo = 'sindrome'
      AND l.condicao_normalizada = public.clin_normalize(p_sindrome)
      AND l.review_status <> 'inactive'
      AND (ctx.c IS NULL OR l.care_context = 'qualquer' OR l.care_context::text = ctx.c)
  ), uni AS (
    SELECT * FROM cond UNION ALL SELECT * FROM sind
  )
  SELECT
    u.id, u.origem_calc, u.condicao_nome,
    u.medicamento_id, COALESCE(v.principio_ativo, 'Medicamento'), v.principio_ativo, v.classe_terapeutica,
    v.apresentacao, v.concentracao, v.via_administracao,
    v.dose_adulto, v.dose_pediatrica, v.frequencia, v.duracao,
    u.papel::text, u.prioridade, u.care_context::text, u.populacao, u.notes,
    (u.review_status = 'reviewed'),
    EXISTS (SELECT 1 FROM public.vw_medicamento_liberado lib WHERE lib.medicamento_id = u.medicamento_id),
    COALESCE(v.apresentacao_autoselecionavel, false) OR COALESCE(v.apresentacoes_disponiveis, 0) > 0,
    COALESCE(v.dose_incompleta, true),
    v.tipo_receita::text, COALESCE(v.alto_risco, false),
    COALESCE(g.alerta_gestacao IS NOT NULL AND g.alerta_gestacao <> 'seguro', false),
    COALESCE(g.exige_ajuste_renal, false), COALESCE(g.exige_ajuste_hepatico, false),
    ARRAY_REMOVE(ARRAY[
      CASE WHEN COALESCE((p_paciente->>'gestante')::boolean, false)
             AND g.alerta_gestacao IS NOT NULL AND g.alerta_gestacao <> 'seguro'
           THEN 'Alerta na gestação' END,
      CASE WHEN COALESCE((p_paciente->>'pediatrico')::boolean, false) AND v.dose_pediatrica IS NULL
           THEN 'Sem dose pediátrica cadastrada' END,
      CASE WHEN COALESCE((p_paciente->>'renal')::boolean, false) AND COALESCE(g.exige_ajuste_renal, false)
           THEN 'Requer ajuste renal' END,
      CASE WHEN COALESCE((p_paciente->>'hepatico')::boolean, false) AND COALESCE(g.exige_ajuste_hepatico, false)
           THEN 'Requer ajuste hepático' END,
      CASE WHEN COALESCE(g.exige_peso, false) AND (p_paciente->>'peso') IS NULL
           THEN 'Dose depende do peso' END
    ], NULL),
    CASE
      WHEN u.review_status <> 'reviewed' THEN 4
      WHEN u.papel IN ('primeira_linha','resgate') THEN 1
      WHEN u.papel IN ('alternativa','hospitalar','situacao_especifica') THEN 2
      ELSE 3
    END
  FROM uni u
  LEFT JOIN public.vw_medicamento_completo v ON v.id = u.medicamento_id
  LEFT JOIN public.base_medicamentos_geral g ON g.id = u.medicamento_id
  ORDER BY 30, (SELECT CASE WHEN EXISTS (SELECT 1 FROM public.vw_medicamento_liberado lib WHERE lib.medicamento_id = u.medicamento_id) THEN 0 ELSE 1 END), u.prioridade, 5;
$$;

-- ---------------- Consultas administrativas ----------------
CREATE OR REPLACE FUNCTION public.fn_vinculos_por_condicao(p_tipo text, p_condicao text)
RETURNS TABLE(
  id uuid, condicao_nome text, medicamento_id uuid, principio_ativo text, classe_terapeutica text,
  papel text, prioridade integer, care_context text, populacao text, review_status text,
  notes text, source_reference text, versao integer, revisado_em timestamptz,
  medicamento_liberado boolean, apresentacao text
)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT l.id, l.condicao_nome, l.medicamento_id, v.principio_ativo, v.classe_terapeutica,
         l.papel::text, l.prioridade, l.care_context::text, l.populacao, l.review_status::text,
         l.notes, l.source_reference, l.versao, l.revisado_em,
         EXISTS (SELECT 1 FROM public.vw_medicamento_liberado lib WHERE lib.medicamento_id = l.medicamento_id),
         v.apresentacao
  FROM public.clinical_condition_medication l
  LEFT JOIN public.vw_medicamento_completo v ON v.id = l.medicamento_id
  WHERE l.condicao_tipo = p_tipo
    AND l.condicao_normalizada = public.clin_normalize(p_condicao)
  ORDER BY l.review_status, l.papel, l.prioridade, v.principio_ativo;
$$;

CREATE OR REPLACE FUNCTION public.fn_vinculos_por_medicamento(p_medicamento_id uuid)
RETURNS TABLE(
  id uuid, condicao_tipo text, condicao_nome text, papel text, prioridade integer,
  care_context text, review_status text, notes text, versao integer
)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT l.id, l.condicao_tipo, l.condicao_nome, l.papel::text, l.prioridade,
         l.care_context::text, l.review_status::text, l.notes, l.versao
  FROM public.clinical_condition_medication l
  WHERE l.medicamento_id = p_medicamento_id
  ORDER BY l.condicao_tipo, l.condicao_nome;
$$;

CREATE OR REPLACE FUNCTION public.fn_vinculo_upsert(
  p_id uuid,
  p_condicao_tipo text,
  p_condicao_nome text,
  p_medicamento_id uuid,
  p_papel text,
  p_prioridade integer,
  p_care_context text,
  p_populacao text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_source text DEFAULT NULL,
  p_apresentacao_id uuid DEFAULT NULL,
  p_condicao_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar vínculos clínicos.';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.clinical_condition_medication
      (condicao_tipo, condicao_id, condicao_nome, condicao_normalizada, medicamento_id, apresentacao_id,
       papel, prioridade, care_context, populacao, notes, source_reference, review_status)
    VALUES (p_condicao_tipo, p_condicao_id, p_condicao_nome, public.clin_normalize(p_condicao_nome),
       p_medicamento_id, p_apresentacao_id, p_papel::public.vinculo_papel, COALESCE(p_prioridade, 50),
       p_care_context::public.vinculo_contexto, p_populacao, p_notes, p_source, 'pending_review')
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.clinical_condition_medication SET
      medicamento_id = COALESCE(p_medicamento_id, medicamento_id),
      apresentacao_id = p_apresentacao_id,
      papel = COALESCE(p_papel, papel::text)::public.vinculo_papel,
      prioridade = COALESCE(p_prioridade, prioridade),
      care_context = COALESCE(p_care_context, care_context::text)::public.vinculo_contexto,
      populacao = p_populacao,
      notes = p_notes,
      source_reference = p_source
    WHERE id = p_id
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_vinculo_acao(p_id uuid, p_acao text, p_observacao text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem revisar vínculos clínicos.';
  END IF;

  IF p_acao = 'remover' THEN
    DELETE FROM public.clinical_condition_medication WHERE id = p_id;
    RETURN;
  END IF;

  UPDATE public.clinical_condition_medication SET
    review_status = (CASE p_acao
      WHEN 'aprovar' THEN 'reviewed'
      WHEN 'corrigir' THEN 'needs_correction'
      WHEN 'pendente' THEN 'pending_review'
      WHEN 'inativar' THEN 'inactive'
      ELSE review_status::text END)::public.vinculo_status,
    revisado_por = CASE WHEN p_acao = 'aprovar' THEN auth.uid() ELSE revisado_por END,
    revisado_em = CASE WHEN p_acao = 'aprovar' THEN now() ELSE revisado_em END,
    notes = COALESCE(p_observacao, notes)
  WHERE id = p_id;
END;
$$;

-- ---------------- Auditoria ----------------
CREATE OR REPLACE FUNCTION public.fn_quadros_prontos_fluxo_rapido()
RETURNS TABLE(condicao_tipo text, condicao_nome text, opcoes integer)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT l.condicao_tipo, min(l.condicao_nome), count(*)::integer
  FROM public.clinical_condition_medication l
  WHERE l.review_status = 'reviewed'
    AND EXISTS (SELECT 1 FROM public.vw_medicamento_liberado lib WHERE lib.medicamento_id = l.medicamento_id)
  GROUP BY l.condicao_tipo, l.condicao_normalizada
  ORDER BY 3 DESC;
$$;

CREATE OR REPLACE FUNCTION public.fn_resumo_vinculos_clinicos()
RETURNS jsonb
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT jsonb_build_object(
    'medicamentos_total', (SELECT count(*) FROM public.base_medicamentos_geral WHERE COALESCE(ativo, true)),
    'medicamentos_com_vinculo', (SELECT count(DISTINCT medicamento_id) FROM public.clinical_condition_medication WHERE review_status <> 'inactive'),
    'medicamentos_sem_vinculo', (SELECT count(*) FROM public.base_medicamentos_geral g WHERE COALESCE(g.ativo, true)
        AND NOT EXISTS (SELECT 1 FROM public.clinical_condition_medication l WHERE l.medicamento_id = g.id AND l.review_status <> 'inactive')),
    'vinculos_total', (SELECT count(*) FROM public.clinical_condition_medication),
    'vinculos_revisados', (SELECT count(*) FROM public.clinical_condition_medication WHERE review_status = 'reviewed'),
    'vinculos_pendentes', (SELECT count(*) FROM public.clinical_condition_medication WHERE review_status = 'pending_review'),
    'vinculos_com_problema', (SELECT count(*) FROM public.clinical_condition_medication WHERE review_status = 'needs_correction'),
    'vinculos_inativos', (SELECT count(*) FROM public.clinical_condition_medication WHERE review_status = 'inactive'),
    'quadros_com_vinculo', (SELECT count(DISTINCT (condicao_tipo || '|' || condicao_normalizada)) FROM public.clinical_condition_medication WHERE review_status <> 'inactive'),
    'quadros_prontos', (SELECT count(*) FROM public.fn_quadros_prontos_fluxo_rapido()),
    'grupos', (SELECT COALESCE(jsonb_object_agg(grupo, n), '{}'::jsonb) FROM (
        SELECT grupo, count(*) n FROM public.medicamento_grupo_vinculo GROUP BY grupo) s)
  );
$$;

CREATE OR REPLACE FUNCTION public.fn_medicamentos_sem_vinculo()
RETURNS TABLE(
  medicamento_id uuid, principio_ativo text, classe_terapeutica text,
  grupo text, grupo_motivo text, prioridade_trabalho integer,
  tem_apresentacao boolean, tem_dose boolean
)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT g.id, g.principio_ativo, g.classe_terapeutica,
         COALESCE(c.grupo, 'F'), c.grupo_motivo, COALESCE(c.prioridade_trabalho, 90),
         COALESCE(v.apresentacoes_disponiveis, 0) > 0,
         NOT COALESCE(v.dose_incompleta, true)
  FROM public.base_medicamentos_geral g
  LEFT JOIN public.medicamento_grupo_vinculo c ON c.medicamento_id = g.id
  LEFT JOIN public.vw_medicamento_completo v ON v.id = g.id
  WHERE COALESCE(g.ativo, true)
    AND NOT EXISTS (SELECT 1 FROM public.clinical_condition_medication l WHERE l.medicamento_id = g.id AND l.review_status <> 'inactive')
  ORDER BY COALESCE(c.prioridade_trabalho, 90), g.principio_ativo;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_vinculo_upsert(uuid, text, text, uuid, text, integer, text, text, text, text, uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.fn_vinculo_acao(uuid, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.fn_vinculo_upsert(uuid, text, text, uuid, text, integer, text, text, text, text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_vinculo_acao(uuid, text, text) TO authenticated;