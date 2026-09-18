-- 1. Ligação estável dose -> medicamento
ALTER TABLE public.base_medicamentos_dose
  ADD COLUMN IF NOT EXISTS medicamento_id uuid REFERENCES public.base_medicamentos_geral(id) ON DELETE SET NULL;

UPDATE public.base_medicamentos_dose d
SET medicamento_id = m.id
FROM public.base_medicamentos_geral m
WHERE d.medicamento_id IS NULL
  AND public.clin_normalize(d.principio_ativo) = public.clin_normalize(m.principio_ativo);

CREATE INDEX IF NOT EXISTS idx_bmd_medicamento_id ON public.base_medicamentos_dose(medicamento_id);
CREATE INDEX IF NOT EXISTS idx_bmd_principio_norm ON public.base_medicamentos_dose(public.clin_normalize(principio_ativo));

-- 2. Busca normalizada de medicamentos
ALTER TABLE public.base_medicamentos_geral
  ADD COLUMN IF NOT EXISTS busca_normalizada text;

CREATE OR REPLACE FUNCTION public.fn_bmg_set_busca()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.busca_normalizada := public.clin_normalize(
    concat_ws(' ',
      NEW.principio_ativo,
      NEW.nome_comercial_referencia,
      NEW.apresentacao,
      NEW.concentracao,
      NEW.classe_terapeutica,
      NEW.subclasse_terapeutica,
      NEW.categoria_clinica
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bmg_busca ON public.base_medicamentos_geral;
CREATE TRIGGER trg_bmg_busca
  BEFORE INSERT OR UPDATE ON public.base_medicamentos_geral
  FOR EACH ROW EXECUTE FUNCTION public.fn_bmg_set_busca();

UPDATE public.base_medicamentos_geral SET busca_normalizada = public.clin_normalize(
  concat_ws(' ', principio_ativo, nome_comercial_referencia, apresentacao, concentracao,
            classe_terapeutica, subclasse_terapeutica, categoria_clinica));

CREATE INDEX IF NOT EXISTS idx_bmg_busca_norm ON public.base_medicamentos_geral USING gin (busca_normalizada extensions.gin_trgm_ops);

-- 3. Visão consolidada: fonte única de verdade por medicamento
CREATE OR REPLACE VIEW public.vw_medicamento_completo
WITH (security_invoker = true) AS
SELECT
  m.id,
  m.principio_ativo,
  m.nome_comercial_referencia,
  m.classe_terapeutica,
  m.categoria_clinica,
  m.subclasse_terapeutica,
  m.tipo_receita,
  m.alto_risco,
  m.antimicrobiano,
  m.alerta_gestacao,
  m.ativo,
  m.status_revisao,
  m.busca_normalizada,
  COALESCE(m.apresentacao, ap.apresentacao_texto)   AS apresentacao,
  COALESCE(m.concentracao, ap.concentracao)         AS concentracao,
  ap.forma_farmaceutica,
  ap.unidade_concentracao,
  COALESCE(m.via_administracao, ap.via_administracao, dz.via) AS via_administracao,
  ap.total_apresentacoes,
  COALESCE(m.dose_adulto_padrao, dz.dose_adulto)     AS dose_adulto,
  COALESCE(m.dose_pediatrica_padrao, dz.dose_pediatrica) AS dose_pediatrica,
  COALESCE(m.frequencia_padrao, dz.frequencia)       AS frequencia,
  COALESCE(m.duracao_padrao, dz.duracao)             AS duracao,
  dz.dose_maxima_dia,
  dz.observacao_dose,
  dz.total_doses,
  (COALESCE(m.dose_adulto_padrao, dz.dose_adulto) IS NULL) AS dose_incompleta,
  (COALESCE(m.apresentacao, ap.apresentacao_texto) IS NULL) AS apresentacao_incompleta
FROM public.base_medicamentos_geral m
LEFT JOIN LATERAL (
  SELECT a.apresentacao_texto, a.concentracao, a.forma_farmaceutica,
         a.unidade_concentracao, a.via_administracao,
         count(*) OVER () AS total_apresentacoes
  FROM public.base_apresentacoes_medicamentos a
  WHERE a.id_medicamento = m.id AND a.ativo IS NOT FALSE
  ORDER BY a.created_at
  LIMIT 1
) ap ON true
LEFT JOIN LATERAL (
  SELECT
    max(d.via) FILTER (WHERE d.via IS NOT NULL) AS via,
    max(CASE WHEN d.populacao IS NULL OR d.populacao NOT ILIKE '%pedi%'
        THEN concat_ws(' ', nullif(concat_ws('-', d.dose_min::text, nullif(d.dose_max::text, d.dose_min::text)), ''), d.dose_unidade) END) AS dose_adulto,
    max(CASE WHEN d.populacao ILIKE '%pedi%'
        THEN concat_ws(' ', nullif(concat_ws('-', d.dose_min::text, nullif(d.dose_max::text, d.dose_min::text)), ''), d.dose_unidade) END) AS dose_pediatrica,
    max(d.frequencia) AS frequencia,
    max(d.duracao) AS duracao,
    max(concat_ws(' ', d.dose_maxima_dia::text, d.dose_maxima_dia_unidade)) AS dose_maxima_dia,
    max(d.observacao_dose) AS observacao_dose,
    count(*) AS total_doses
  FROM public.base_medicamentos_dose d
  WHERE d.medicamento_id = m.id
) dz ON true;

GRANT SELECT ON public.vw_medicamento_completo TO authenticated, anon, service_role;

-- 4. Consulta única de sugestões clínicas
CREATE OR REPLACE FUNCTION public.fn_sugestoes_clinicas(
  p_condicao text DEFAULT NULL,
  p_sindrome text DEFAULT NULL,
  p_ambiente text DEFAULT NULL
)
RETURNS TABLE (
  origem text,
  vinculo_id uuid,
  medicamento_id uuid,
  medicamento_nome text,
  principio_ativo text,
  apresentacao text,
  concentracao text,
  via text,
  dose_adulto text,
  dose_pediatrica text,
  frequencia text,
  duracao text,
  linha text,
  prioridade int,
  observacao text,
  evitar_gestante boolean,
  ajuste_renal boolean,
  ajuste_hepatico boolean,
  tipo_receita text,
  alto_risco boolean,
  dose_incompleta boolean
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH cond AS (
    SELECT 'patologia'::text AS origem, l.id, l.medicamento_id, l.medicamento_nome, l.via,
           l.dose_adulto, l.dose_pediatrica, l.duracao, l.linha, l.prioridade,
           l.observacao, l.evitar_gestante, l.ajuste_renal, l.ajuste_hepatico
    FROM public.patologia_medicamento l
    WHERE p_condicao IS NOT NULL
      AND l.patologia_normalizada = public.clin_normalize(p_condicao)
      AND (p_ambiente IS NULL OR l.ambiente = p_ambiente)
      AND l.status_revisao = 'aprovado'
  ), sind AS (
    SELECT 'sindrome'::text, l.id, l.medicamento_id, l.medicamento_nome, l.via,
           l.dose_adulto, l.dose_pediatrica, l.duracao, l.linha, l.prioridade,
           l.observacao, l.evitar_gestante, l.ajuste_renal, l.ajuste_hepatico
    FROM public.sindrome_medicamento l
    WHERE p_sindrome IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM cond)
      AND l.sindrome_normalizada = public.clin_normalize(p_sindrome)
      AND (p_ambiente IS NULL OR l.ambiente = p_ambiente)
      AND l.status_revisao = 'aprovado'
  ), uni AS (
    SELECT * FROM cond UNION ALL SELECT * FROM sind
  )
  SELECT
    u.origem, u.id, u.medicamento_id, u.medicamento_nome,
    v.principio_ativo, v.apresentacao, v.concentracao,
    COALESCE(u.via, v.via_administracao),
    COALESCE(u.dose_adulto, v.dose_adulto),
    COALESCE(u.dose_pediatrica, v.dose_pediatrica),
    v.frequencia,
    COALESCE(u.duracao, v.duracao),
    u.linha::text, u.prioridade, u.observacao,
    COALESCE(u.evitar_gestante, false), COALESCE(u.ajuste_renal, false), COALESCE(u.ajuste_hepatico, false),
    v.tipo_receita::text, COALESCE(v.alto_risco, false),
    (COALESCE(u.dose_adulto, v.dose_adulto) IS NULL)
  FROM uni u
  LEFT JOIN public.vw_medicamento_completo v ON v.id = u.medicamento_id
  ORDER BY u.prioridade NULLS LAST, u.medicamento_nome;
$$;

GRANT EXECUTE ON FUNCTION public.fn_sugestoes_clinicas(text, text, text) TO authenticated, service_role;

-- 5. Registro interno de lacunas
CREATE TABLE IF NOT EXISTS public.auditoria_sugestoes_lacunas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  tipo text NOT NULL CHECK (tipo IN ('sem_sugestao', 'busca_sem_resultado', 'dose_ausente', 'apresentacao_ausente')),
  condicao text,
  sindrome text,
  ambiente text,
  termo_buscado text,
  detalhe text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.auditoria_sugestoes_lacunas TO authenticated;
GRANT ALL ON public.auditoria_sugestoes_lacunas TO service_role;
ALTER TABLE public.auditoria_sugestoes_lacunas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lacunas_insert_own" ON public.auditoria_sugestoes_lacunas;
CREATE POLICY "lacunas_insert_own" ON public.auditoria_sugestoes_lacunas
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "lacunas_select_own_or_admin" ON public.auditoria_sugestoes_lacunas;
CREATE POLICY "lacunas_select_own_or_admin" ON public.auditoria_sugestoes_lacunas
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_lacunas_created ON public.auditoria_sugestoes_lacunas(created_at DESC);

-- 6. Reativação controlada dos vínculos de doença (síndromes seguem em revisão)
UPDATE public.patologia_medicamento l
SET status_revisao = 'aprovado', updated_at = now()
WHERE l.status_revisao = 'pendente'
  AND l.medicamento_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.base_medicamentos_geral m WHERE m.id = l.medicamento_id AND m.ativo)
  AND coalesce(btrim(l.dose_adulto), '') <> ''
  AND coalesce(btrim(l.via), '') <> ''
  AND l.ambiente IN ('ambulatorial', 'urgencia', 'emergencia');

-- Índices de desempenho para as consultas de sugestão
CREATE INDEX IF NOT EXISTS idx_pm_lookup ON public.patologia_medicamento(patologia_normalizada, ambiente, status_revisao);
CREATE INDEX IF NOT EXISTS idx_sm_lookup ON public.sindrome_medicamento(sindrome_normalizada, ambiente, status_revisao);