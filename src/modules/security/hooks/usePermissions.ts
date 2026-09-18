import { useMemo } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  DEFAULT_ROLE,
  permissionsForRoles,
  primaryRole,
  requiresSupervision,
  ROLE_LABEL,
  type Permission,
} from "../lib/permissions";

export function usePermissions() {
  const { roles, loading, rolesLoading } = useAuth();

  return useMemo(() => {
    const effectiveRoles = roles.length > 0 ? roles : [DEFAULT_ROLE];
    const granted = permissionsForRoles(effectiveRoles);
    const role = primaryRole(effectiveRoles);
    return {
      loading: loading || rolesLoading,
      roles: effectiveRoles,
      role,
      roleLabel: ROLE_LABEL[role],
      can: (permission: Permission) => granted.has(permission),
      canAny: (permissions: Permission[]) => permissions.some((p) => granted.has(p)),
      permissions: granted,
      needsSupervision: requiresSupervision(effectiveRoles),
    };
  }, [roles, loading, rolesLoading]);
}
