import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useIVPermissions } from "@/modules/iv-dilution/hooks/useIVPermissions";

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { loading, isAdmin, isReviewer } = useIVPermissions();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Verificando permissões…
      </div>
    );
  }
  if (!isAdmin && !isReviewer) return <Navigate to="/app" replace />;
  return <>{children}</>;
}
