import { useEffect, type ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePermissions } from "../hooks/usePermissions";
import { useAuditLogger } from "../hooks/useAuditLog";
import { AUDIT_ACTIONS } from "../lib/auditActions";
import { PERMISSION_LABEL, type Permission } from "../lib/permissions";

interface Props {
  permission: Permission;
  children: ReactNode;
  /** Quando true, não mostra aviso — apenas oculta o conteúdo. */
  silent?: boolean;
}

/** Protege uma área da tela e registra tentativas de acesso não autorizado. */
export default function RequirePermission({ permission, children, silent }: Props) {
  const { can, loading, role } = usePermissions();
  const log = useAuditLogger();
  const allowed = can(permission);

  useEffect(() => {
    if (loading || allowed) return;
    void log({
      acao: AUDIT_ACTIONS.ACESSO_NEGADO,
      modulo: "seguranca",
      entidade: permission,
      severidade: "alerta",
      detalhes: { perfil: role },
    });
  }, [loading, allowed, permission, role, log]);

  if (loading) return null;
  if (allowed) return <>{children}</>;
  if (silent) return null;

  return (
    <Alert variant="destructive">
      <ShieldAlert className="h-4 w-4" />
      <AlertTitle>Acesso restrito</AlertTitle>
      <AlertDescription>
        Seu perfil não permite “{PERMISSION_LABEL[permission]}”. A tentativa foi registrada na trilha de auditoria.
      </AlertDescription>
    </Alert>
  );
}
