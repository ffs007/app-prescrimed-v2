import { useAuth } from "@/components/providers/AuthProvider";

export type IVProfile = "medico" | "enfermagem" | "farmacia" | "admin" | "revisor";

export function useIVPermissions() {
  const { roles, loading, rolesLoading } = useAuth();

  const isAdmin = roles.includes("admin");
  const isReviewer = roles.includes("revisor");
  const isNursing = roles.includes("enfermagem");
  const isPharmacy = roles.includes("farmacia");

  // Resolve a primary "view profile" — defaults to médico
  const profile: IVProfile =
    isAdmin ? "admin"
    : isReviewer ? "revisor"
    : isPharmacy ? "farmacia"
    : isNursing ? "enfermagem"
    : "medico";

  return {
    loading: loading || rolesLoading,
    roles,
    profile,
    isAdmin,
    isReviewer,
    isNursing,
    isPharmacy,
    canEdit: isAdmin || isReviewer,
    canImport: isAdmin,
    canApprove: isAdmin || isReviewer,
    canInactivate: isAdmin,
    // Visualization rules (Etapa 9)
    canSeePrescriberCard: true,
    canSeePreparation: isNursing || isPharmacy || isAdmin || isReviewer,
    canSeeAdminBase: isAdmin || isReviewer,
  };
}
