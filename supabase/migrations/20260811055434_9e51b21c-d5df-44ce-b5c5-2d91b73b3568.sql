CREATE TABLE IF NOT EXISTS public.stg_escore_protocolo_integracao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  linha_origem text,
  escore_nome text NOT NULL,
  protocolo_codigo text NOT NULL,
  tipo_integracao text NOT NULL,
  faixa_gatilho text,
  gatilho_descricao text,
  acao_disparada text,
  nivel_gate text NOT NULL DEFAULT 'soft_gate',
  override_por_red_flag boolean NOT NULL DEFAULT false,
  red_flag_descricao text,
  ordem_na_cadeia integer,
  populacao_validada text,
  versao_escore text,
  fonte_id text,
  trecho_citado text,
  revisao_humana_obrigatoria boolean NOT NULL DEFAULT true,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stg_escore_protocolo_integracao TO authenticated;
GRANT ALL ON public.stg_escore_protocolo_integracao TO service_role;
ALTER TABLE public.stg_escore_protocolo_integracao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins gerenciam integracao escore-protocolo"
  ON public.stg_escore_protocolo_integracao FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_integracao_escore ON public.stg_escore_protocolo_integracao (escore_nome);
CREATE INDEX IF NOT EXISTS idx_integracao_protocolo ON public.stg_escore_protocolo_integracao (protocolo_codigo);
CREATE INDEX IF NOT EXISTS idx_integracao_lote ON public.stg_escore_protocolo_integracao (lote_id);

CREATE TRIGGER trg_integracao_escore_protocolo_updated
  BEFORE UPDATE ON public.stg_escore_protocolo_integracao
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.stg_fluxo_decisao_patologia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  linha_origem text,
  patologia text NOT NULL,
  protocolo_codigo text NOT NULL,
  estado_atual text NOT NULL,
  escore_aplicado text,
  faixa_gatilho text,
  proximo_estado text NOT NULL,
  acao_disparada text,
  override_por_red_flag boolean NOT NULL DEFAULT false,
  ordem_na_cadeia integer,
  fonte_id text,
  trecho_citado text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stg_fluxo_decisao_patologia TO authenticated;
GRANT ALL ON public.stg_fluxo_decisao_patologia TO service_role;
ALTER TABLE public.stg_fluxo_decisao_patologia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins gerenciam fluxo de decisao"
  ON public.stg_fluxo_decisao_patologia FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_fluxo_patologia ON public.stg_fluxo_decisao_patologia (patologia);
CREATE INDEX IF NOT EXISTS idx_fluxo_protocolo ON public.stg_fluxo_decisao_patologia (protocolo_codigo);
CREATE INDEX IF NOT EXISTS idx_fluxo_escore ON public.stg_fluxo_decisao_patologia (escore_aplicado);

CREATE TRIGGER trg_fluxo_decisao_patologia_updated
  BEFORE UPDATE ON public.stg_fluxo_decisao_patologia
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.stg_integracao_validar()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.protocolos_ps p WHERE p.codigo_protocolo = NEW.protocolo_codigo) THEN
    RAISE EXCEPTION 'protocolo_codigo "%" nao existe em protocolos_ps', NEW.protocolo_codigo;
  END IF;
  IF NEW.escore_nome IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.stg_escores_clinicos e WHERE e.nome_escore = NEW.escore_nome
  ) THEN
    RAISE EXCEPTION 'escore_nome "%" nao existe em stg_escores_clinicos', NEW.escore_nome;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.stg_fluxo_validar()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.protocolos_ps p WHERE p.codigo_protocolo = NEW.protocolo_codigo) THEN
    RAISE EXCEPTION 'protocolo_codigo "%" nao existe em protocolos_ps', NEW.protocolo_codigo;
  END IF;
  IF NEW.escore_aplicado IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.stg_escores_clinicos e WHERE e.nome_escore = NEW.escore_aplicado
  ) THEN
    RAISE EXCEPTION 'escore_aplicado "%" nao existe em stg_escores_clinicos', NEW.escore_aplicado;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_integracao_validar
  BEFORE INSERT OR UPDATE ON public.stg_escore_protocolo_integracao
  FOR EACH ROW EXECUTE FUNCTION public.stg_integracao_validar();

CREATE TRIGGER trg_fluxo_validar
  BEFORE INSERT OR UPDATE ON public.stg_fluxo_decisao_patologia
  FOR EACH ROW EXECUTE FUNCTION public.stg_fluxo_validar();

CREATE OR REPLACE FUNCTION public.fn_integrar_escore_protocolo(
  p_escore_nome text,
  p_protocolo_codigo text,
  p_red_flag text DEFAULT NULL
)
RETURNS TABLE(
  escore_nome text,
  protocolo_codigo text,
  tipo_integracao text,
  faixa_gatilho text,
  gatilho_descricao text,
  acao_disparada text,
  nivel_gate text,
  ordem_na_cadeia integer,
  override_aplicado boolean,
  acao_override text
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_override boolean := false;
  v_acao_override text;
BEGIN
  IF p_red_flag IS NOT NULL THEN
    SELECT r.acao_override INTO v_acao_override
    FROM public.stg_regras_override_red_flag r
    WHERE r.escore_nome = p_escore_nome
      AND r.red_flag = p_red_flag
      AND r.ativo = true
    ORDER BY r.prioridade ASC
    LIMIT 1;
    v_override := v_acao_override IS NOT NULL;
  END IF;

  RETURN QUERY
  SELECT i.escore_nome, i.protocolo_codigo, i.tipo_integracao, i.faixa_gatilho,
         i.gatilho_descricao, i.acao_disparada, i.nivel_gate, i.ordem_na_cadeia,
         v_override, v_acao_override
  FROM public.stg_escore_protocolo_integracao i
  WHERE i.escore_nome = p_escore_nome
    AND i.protocolo_codigo = p_protocolo_codigo
    AND i.ativo = true
  ORDER BY i.ordem_na_cadeia NULLS LAST;
END $$;

CREATE OR REPLACE FUNCTION public.fn_obter_fluxo_decisao(
  p_patologia text,
  p_protocolo_codigo text DEFAULT NULL
)
RETURNS TABLE(
  patologia text,
  protocolo_codigo text,
  estado_atual text,
  escore_aplicado text,
  faixa_gatilho text,
  proximo_estado text,
  acao_disparada text,
  override_por_red_flag boolean,
  ordem_na_cadeia integer
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT f.patologia, f.protocolo_codigo, f.estado_atual, f.escore_aplicado,
         f.faixa_gatilho, f.proximo_estado, f.acao_disparada,
         f.override_por_red_flag, f.ordem_na_cadeia
  FROM public.stg_fluxo_decisao_patologia f
  WHERE f.patologia = p_patologia
    AND (p_protocolo_codigo IS NULL OR f.protocolo_codigo = p_protocolo_codigo)
    AND f.ativo = true
  ORDER BY f.ordem_na_cadeia NULLS LAST;
END $$;

CREATE OR REPLACE VIEW public.vw_integracao_escore_protocolo
WITH (security_invoker = true) AS
SELECT i.escore_nome, i.protocolo_codigo, i.tipo_integracao, i.faixa_gatilho,
       i.acao_disparada, i.nivel_gate, i.override_por_red_flag, i.ordem_na_cadeia,
       i.populacao_validada, i.versao_escore, i.fonte_id
FROM public.stg_escore_protocolo_integracao i
WHERE i.ativo = true;

CREATE OR REPLACE VIEW public.vw_integracao_overrides
WITH (security_invoker = true) AS
SELECT o.escore_nome, o.contexto, o.red_flag, o.red_flag_descricao,
       o.acao_override, o.escore_nao_pode, o.nivel_gate, o.prioridade, o.fonte_id
FROM public.stg_regras_override_red_flag o
WHERE o.ativo = true;

CREATE OR REPLACE VIEW public.vw_integracao_fluxos
WITH (security_invoker = true) AS
SELECT f.patologia, f.protocolo_codigo, f.estado_atual, f.escore_aplicado,
       f.faixa_gatilho, f.proximo_estado, f.acao_disparada,
       f.override_por_red_flag, f.ordem_na_cadeia, f.fonte_id
FROM public.stg_fluxo_decisao_patologia f
WHERE f.ativo = true;

CREATE OR REPLACE VIEW public.vw_integracao_resumo_global
WITH (security_invoker = true) AS
SELECT
  (SELECT count(*) FROM public.stg_escore_protocolo_integracao WHERE ativo) AS total_regras_integracao,
  (SELECT count(DISTINCT escore_nome) FROM public.stg_escore_protocolo_integracao WHERE ativo) AS total_escores_integrados,
  (SELECT count(DISTINCT protocolo_codigo) FROM public.stg_escore_protocolo_integracao WHERE ativo) AS total_protocolos_integrados,
  (SELECT count(*) FROM public.stg_regras_override_red_flag WHERE ativo) AS total_overrides,
  (SELECT count(*) FROM public.stg_fluxo_decisao_patologia WHERE ativo) AS total_fluxos_decisao,
  (SELECT count(DISTINCT patologia) FROM public.stg_fluxo_decisao_patologia WHERE ativo) AS total_patologias_com_fluxo;