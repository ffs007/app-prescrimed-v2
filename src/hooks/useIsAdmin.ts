import { useAuth } from "@/components/providers/AuthProvider";

export function useIsAdmin() {
  const { isAdmin, loading, rolesLoading } = useAuth();
  return { isAdmin, loading: loading || rolesLoading };
}
