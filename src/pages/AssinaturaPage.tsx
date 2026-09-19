import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import PageMeta from "@/components/seo/PageMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSubscription } from "@/hooks/useSubscription";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";
import { isPlanId, PLANS, PLAN_LABEL, PREMIUM_FEATURES, type PlanId } from "@/modules/billing/lib/plans";
import StripeEmbeddedCheckout from "@/components/payments/StripeEmbeddedCheckout";
import PaymentTestModeBanner from "@/components/payments/PaymentTestModeBanner";
import { logUsageEvent } from "@/modules/usage/usageClient";

export default function AssinaturaPage() {
  const { user } = useAuth();
  const { subscription, isActive, isPastDue, loading } = useSubscription();
  const [checkoutPlan, setCheckoutPlan] = useState<PlanId | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (loading) return;
    if (isActive) {
      setCheckoutPlan(null);
      return;
    }
    const requestedPlan = searchParams.get("plan");
    if (!isPlanId(requestedPlan)) return;
    setCheckoutPlan(requestedPlan);
    void logUsageEvent({ tipo: "checkout_inicio", recurso: requestedPlan });
  }, [isActive, loading, searchParams]);

  const selecionarPlano = (plan: PlanId) => {
    setCheckoutPlan(plan);
    void logUsageEvent({ tipo: "checkout_inicio", recurso: plan });
  };

  const abrirPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: { environment: getStripeEnvironment(), returnUrl: window.location.href },
      });
      if (error || !data?.url) throw new Error(error?.message ?? "Não foi possível abrir a gestão do plano");
      window.open(data.url as string, "_blank", "noopener");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageMeta
        title="Assinatura | PrescriMed"
        description="Escolha o plano mensal ou anual do PrescriMed e libere os recursos avançados."
        path="/app/assinatura"
      />
      <PaymentTestModeBanner />

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Assinatura</h1>
        <p className="text-sm text-muted-foreground">
          O uso básico é livre. O plano Pro libera os recursos avançados.
        </p>
      </header>

      {!isPaymentsConfigured() && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Os pagamentos ainda não estão disponíveis nesta versão.
          </CardContent>
        </Card>
      )}

      {isActive && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Plano ativo</CardTitle>
              <Badge>{PLAN_LABEL[subscription?.price_id ?? ""] ?? "Pro"}</Badge>
              {isPastDue && <Badge variant="destructive">Pagamento pendente</Badge>}
            </div>
            <CardDescription>
              {subscription?.current_period_end
                ? `Válido até ${new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}`
                : "Renovação automática ativa"}
              {subscription?.cancel_at_period_end ? " · cancelamento agendado" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={abrirPortal} disabled={portalLoading} variant="outline">
              {portalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />}
              Gerenciar pagamento
            </Button>
          </CardContent>
        </Card>
      )}

      {!isActive && !loading && isPaymentsConfigured() && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {PLANS.map((plan) => (
              <Card key={plan.id} className={checkoutPlan === plan.id ? "border-primary" : undefined}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{plan.nome}</CardTitle>
                    {plan.destaque && <Badge variant="secondary">{plan.destaque}</Badge>}
                  </div>
                  <CardDescription>
                    <span className="text-2xl font-semibold text-foreground">{plan.preco}</span>{" "}
                    {plan.periodo}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {plan.detalhes.map((d) => (
                      <li key={d} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" onClick={() => selecionarPlano(plan.id)}>
                    Assinar {plan.nome.toLowerCase()}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">O que o plano libera</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      {!loading && !isActive && checkoutPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pagamento</CardTitle>
            <CardDescription>Preencha os dados para concluir a assinatura.</CardDescription>
          </CardHeader>
          <CardContent>
            <StripeEmbeddedCheckout
              priceId={checkoutPlan}
              quantity={1}
              returnUrl={`${window.location.origin}/app/assinatura/retorno?session_id={CHECKOUT_SESSION_ID}`}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
