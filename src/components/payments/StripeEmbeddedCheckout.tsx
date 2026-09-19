import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { logUsageEvent } from "@/modules/usage/usageClient";

interface StripeEmbeddedCheckoutProps {
  priceId: string;
  quantity?: number;
  returnUrl?: string;
}

export function StripeEmbeddedCheckout({
  priceId,
  quantity,
  returnUrl,
}: StripeEmbeddedCheckoutProps) {
  const fetchClientSecret = async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        priceId,
        quantity,
        returnUrl,
        environment: getStripeEnvironment(),
      },
    });
    if (error || !data?.clientSecret) {
      void logUsageEvent({ tipo: "checkout_erro", recurso: priceId });
      throw new Error(error?.message || "Não foi possível abrir o pagamento");
    }
    void logUsageEvent({ tipo: "checkout_aberto", recurso: priceId });
    return data.clientSecret as string;
  };

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider key={priceId} stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}

export default StripeEmbeddedCheckout;
