DROP POLICY "Anyone can read shared trauma score results" ON public.resultados_escores_trauma;
REVOKE SELECT ON public.resultados_escores_trauma FROM anon;

CREATE OR REPLACE FUNCTION public.get_resultado_escore_trauma(_token text)
RETURNS TABLE(escore text, pontuacao numeric, estrato text, rotulo text, entrada jsonb, detalhes jsonb, observacao text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.escore, r.pontuacao, r.estrato, r.rotulo, r.entrada, r.detalhes, r.observacao, r.created_at
  FROM public.resultados_escores_trauma r
  WHERE r.share_token = _token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_resultado_escore_trauma(text) TO anon, authenticated;