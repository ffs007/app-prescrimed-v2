import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import PageMeta from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";
import { logUsageEvent } from "@/modules/usage/usageClient";

export default function AssinaturaRetornoPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { isActive } = useSubscription();

  useEffect(() => {
    if (!sessionId) return;
    void logUsageEvent({
      tipo: "checkout_retorno",
      recurso: isActive ? "ativo" : "pendente",
    });
  }, [isActive, sessionId]);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageMeta title="Assinatura confirmada | PrescriMed" description="Confirmação da assinatura do PrescriMed." path="/app/assinatura/retorno" />
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>
              {sessionId
                ? isActive
                  ? "Assinatura confirmada"
                  : "Pagamento em confirmação"
                : "Sem informações do pagamento"}
            </CardTitle>
          </div>
          <CardDescription>
            {sessionId
              ? isActive
                ? "Seu plano já está ativo. Bom trabalho!"
                : "Estamos confirmando o pagamento. A liberação costuma levar alguns segundos."
              : "Volte para a tela de planos e tente novamente."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button asChild>
            <Link to="/app">Ir para o início</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/app/assinatura">Ver assinatura</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
