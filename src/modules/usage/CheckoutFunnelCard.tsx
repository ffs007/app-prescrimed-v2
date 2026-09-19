import { AlertTriangle, ArrowRight, CheckCircle2, CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { summarizeCheckoutFunnel, useCheckoutEvents } from "./useUsageStats";

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export default function CheckoutFunnelCard() {
  const { data = [], isLoading, error } = useCheckoutEvents(30);
  const funnel = summarizeCheckoutFunnel(data);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4" aria-hidden="true" />
          Funil de assinatura
        </CardTitle>
        <CardDescription>Usuários únicos nos últimos 30 dias.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando conversão…</p>
        ) : error ? (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Não foi possível carregar o funil.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Metric label="Iniciaram" value={funnel.started} />
              <Metric label="Abriram checkout" value={funnel.opened} />
              <Metric label="Ativaram" value={funnel.activated} />
              <Metric label="Erros registrados" value={funnel.errors} />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5">
                <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Abertura: <strong>{funnel.openRate}%</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                Ativação: <strong>{funnel.activationRate}%</strong>
              </span>
              <span className="text-muted-foreground">
                Interesse: {funnel.monthlyInterest} mensal · {funnel.yearlyInterest} anual
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
