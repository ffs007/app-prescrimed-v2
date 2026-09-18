-- Versao vigente de um escore
CREATE OR REPLACE FUNCTION public.fn_escore_versao_atual(p_escore_nome text)
RETURNS text
LANGUAGE sql STABLE SET search_path TO 'public' AS $fn$
  SELECT versao
  FROM public.stg_escores_clinicos
  WHERE nome_escore = p_escore_nome
  ORDER BY updated_at DESC
  LIMIT 1;
$fn$;

-- Conferir entradas obrigatorias
CREATE OR REPLACE FUNCTION public.fn_validar_entradas_escore(p_escore_nome text, p_entradas jsonb)
RETURNS TABLE(entradas_completas boolean, faltantes text[], versao text)
LANGUAGE plpgsql STABLE SET search_path TO 'public' AS $fn$
DECLARE
  v_esperadas jsonb;
  v_versao text;
  v_faltantes text[] := ARRAY[]::text[];
  v_chave text;
BEGIN
  SELECT entradas, versao INTO v_esperadas, v_versao
  FROM public.stg_escores_clinicos
  WHERE nome_escore = p_escore_nome
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_esperadas IS NULL OR jsonb_typeof(v_esperadas) <> 'object' THEN
    RETURN QUERY SELECT true, v_faltantes, v_versao; RETURN;
  END IF;

  FOR v_chave IN SELECT jsonb_object_keys(v_esperadas) LOOP
    IF p_entradas IS NULL OR NOT (p_entradas ? v_chave) OR jsonb_typeof(p_entradas -> v_chave) = 'null' THEN
      v_faltantes := array_append(v_faltantes, v_chave);
    END IF;
  END LOOP;

  RETURN QUERY SELECT (array_length(v_faltantes, 1) IS NULL), v_faltantes, v_versao;
END; $fn$;

-- Registrar conduta realizada e marcar divergencia
CREATE OR REPLACE FUNCTION public.fn_registrar_conduta_real(
  p_audit_id bigint, p_conduta_real text, p_motivo_override text DEFAULT NULL, p_revisao_humana boolean DEFAULT true)
RETURNS TABLE(id bigint, nome_escore text, conduta_sugerida text, conduta_real text, divergencia boolean)
LANGUAGE plpgsql SET search_path TO 'public' AS $fn$
BEGIN
  RETURN QUERY
  UPDATE public.audit_escores_clinicos a
     SET conduta_real = p_conduta_real,
         divergencia = (p_conduta_real IS DISTINCT FROM a.conduta_sugerida),
         motivo_override = coalesce(p_motivo_override, a.motivo_override),
         revisao_humana = coalesce(p_revisao_humana, a.revisao_humana)
   WHERE a.id = p_audit_id
  RETURNING a.id, a.nome_escore, a.conduta_sugerida, a.conduta_real, a.divergencia;
END; $fn$;

-- Views de acompanhamento
CREATE OR REPLACE VIEW public.vw_escores_divergencia_conduta
WITH (security_invoker = true) AS
SELECT a.id, a.atendimento_id, a.nome_escore, a.versao, a.resultado, a.categoria,
       a.conduta_sugerida, a.conduta_real, a.motivo_override, a.profissional, a.data_hora
FROM public.audit_escores_clinicos a
WHERE a.divergencia
ORDER BY a.data_hora DESC
LIMIT 100;

CREATE OR REPLACE VIEW public.vw_escores_sem_auditoria
WITH (security_invoker = true) AS
SELECT e.nome_escore, e.especialidade, e.populacao_alvo, count(a.id) AS total_calculos
FROM public.stg_escores_clinicos e
LEFT JOIN public.audit_escores_clinicos a ON a.nome_escore = e.nome_escore
GROUP BY e.nome_escore, e.especialidade, e.populacao_alvo
HAVING count(a.id) = 0
ORDER BY e.nome_escore;

CREATE OR REPLACE VIEW public.vw_escores_overrides_red_flag
WITH (security_invoker = true) AS
SELECT a.nome_escore,
       count(*) AS total_calculos,
       count(*) FILTER (WHERE a.red_flag_override) AS total_overrides,
       round(100.0 * count(*) FILTER (WHERE a.red_flag_override) / nullif(count(*), 0), 1) AS pct_overrides
FROM public.audit_escores_clinicos a
GROUP BY a.nome_escore
ORDER BY total_overrides DESC, a.nome_escore;

CREATE OR REPLACE VIEW public.vw_dashboard_escores
WITH (security_invoker = true) AS
SELECT
  (SELECT count(DISTINCT nome_escore) FROM public.stg_escores_clinicos) AS total_escores_catalogados,
  (SELECT count(DISTINCT nome_escore) FROM public.audit_escores_clinicos) AS total_escores_usados,
  (SELECT count(*) FROM public.audit_escores_clinicos) AS total_calculos,
  (SELECT count(*) FROM public.audit_escores_clinicos WHERE populacao_validada) AS calculos_populacao_valida,
  (SELECT count(*) FROM public.audit_escores_clinicos WHERE entradas_completas) AS calculos_entradas_completas,
  (SELECT count(*) FROM public.audit_escores_clinicos WHERE red_flag_override) AS total_overrides,
  (SELECT count(*) FROM public.audit_escores_clinicos WHERE divergencia) AS total_divergencias;