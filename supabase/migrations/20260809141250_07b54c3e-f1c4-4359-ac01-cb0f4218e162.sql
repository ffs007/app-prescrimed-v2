REVOKE EXECUTE ON FUNCTION public.has_role(_user_id uuid, _role app_role) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(_user_id uuid, _role app_role) TO service_role;