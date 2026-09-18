REVOKE EXECUTE ON FUNCTION public.fn_ccm_log() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_ccm_before_write() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_vinculo_upsert(uuid, text, text, uuid, text, integer, text, text, text, text, uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.fn_vinculo_acao(uuid, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.fn_vinculo_upsert(uuid, text, text, uuid, text, integer, text, text, text, text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_vinculo_acao(uuid, text, text) TO authenticated;