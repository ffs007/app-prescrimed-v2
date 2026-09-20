-- Leitura das chaves de IA pelo navegador apenas em forma mascarada; o texto puro fica restrito à edge function (service role).
CREATE OR REPLACE VIEW public.ia_credenciais_usuario_mascaradas
WITH (security_invoker = true) AS
SELECT
  user_id,
  CASE
    WHEN perplexity_key IS NULL OR btrim(perplexity_key) = '' THEN NULL
    WHEN length(perplexity_key) >= 12 THEN left(perplexity_key, 4) || '••••' || right(perplexity_key, 4)
    ELSE '••••••••'
  END AS perplexity_key,
  CASE
    WHEN openrouter_key IS NULL OR btrim(openrouter_key) = '' THEN NULL
    WHEN length(openrouter_key) >= 12 THEN left(openrouter_key, 4) || '••••' || right(openrouter_key, 4)
    ELSE '••••••••'
  END AS openrouter_key,
  modelo_preferido,
  atualizacoes_automaticas
FROM public.ia_credenciais_usuario;

REVOKE ALL ON public.ia_credenciais_usuario_mascaradas FROM PUBLIC, anon;
GRANT SELECT ON public.ia_credenciais_usuario_mascaradas TO authenticated;
GRANT ALL ON public.ia_credenciais_usuario_mascaradas TO service_role;
