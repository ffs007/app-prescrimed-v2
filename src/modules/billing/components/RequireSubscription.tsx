import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";
import { logUsageEvent } from "@/modules/usage/usageClient";

interface RequireSubscriptionProps {
  recurso: string;
  children: ReactNode;
}

export function RequireSubscription({ recurso, children }: RequireSubscriptionProps) {
  const { isActive, loading } = useSubscription();

  if (loading) return null;
  if (isActive) return <>{children}</>;

  void logUsageEvent({ tipo: "bloqueio_plano", recurso });

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <CardTitle>Recurso do plano Pro</CardTitle>
        </div>
        <CardDescription>
          {recurso} faz parte do plano Pro. O uso básico do PrescriMed continua livre.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link to="/app/assinatura">Ver planos</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default RequireSubscription;
