import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

// Cupom promocional: R$ 10,00 de desconto por 3 meses no plano mensal
// (R$ 25,99 -> R$ 15,99 nos 3 primeiros meses).
const PROMO_COUPON_ID = "prescrimed_promo_3m";
const PROMO_AMOUNT_OFF = 1000; // centavos
const PROMO_CURRENCY = "brl";

async function ensurePromoCoupon(stripe: ReturnType<typeof createStripeClient>) {
  try {
    const existing = await stripe.coupons.retrieve(PROMO_COUPON_ID);
    if (existing && !(existing as any).deleted) return PROMO_COUPON_ID;
  } catch (_e) {
    // não existe ainda
  }
  await stripe.coupons.create({
    id: PROMO_COUPON_ID,
    name: "Promoção 3 meses",
    amount_off: PROMO_AMOUNT_OFF,
    currency: PROMO_CURRENCY,
    duration: "repeating",
    duration_in_months: 3,
  });
  return PROMO_COUPON_ID;
}

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

async function createCheckoutSession(options: {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  userId?: string;
  returnUrl: string;
  environment: StripeEnv;
}) {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.priceId)) throw new Error("Invalid priceId");
  const stripe = createStripeClient(options.environment);

  const prices = await stripe.prices.list({ lookup_keys: [options.priceId] });
  if (!prices.data.length) throw new Error("Price not found");
  const stripePrice = prices.data[0];
  const isRecurring = stripePrice.type === "recurring";

  const customerId = (options.customerEmail || options.userId)
    ? await resolveOrCreateCustomer(stripe, {
      email: options.customerEmail,
      userId: options.userId,
    })
    : undefined;

  let productDescription: string | undefined;
  if (!isRecurring) {
    const productId = typeof stripePrice.product === "string"
      ? stripePrice.product
      : (stripePrice.product as any).id;
    const product = await stripe.products.retrieve(productId);
    productDescription = product.name;
  }

  // Desconto promocional apenas no plano mensal.
  let discounts: Array<{ coupon: string }> | undefined;
  if (options.priceId === "pro_monthly") {
    try {
      const coupon = await ensurePromoCoupon(stripe);
      discounts = [{ coupon }];
    } catch (e) {
      console.error("Falha ao aplicar cupom promocional:", e);
    }
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: stripePrice.id, quantity: options.quantity || 1 }],
    mode: isRecurring ? "subscription" : "payment",
    ui_mode: "embedded_page",
    return_url: options.returnUrl,
    automatic_tax: { enabled: true },
    ...(customerId && { customer: customerId }),
    ...(discounts && { discounts }),
    ...(!isRecurring && { payment_intent_data: { description: productDescription } }),
    ...(options.userId && {
      metadata: { userId: options.userId, managed_payments: "false" },
      ...(isRecurring && { subscription_data: { metadata: { userId: options.userId } } }),
    }),
  });

  return session.client_secret;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) throw new Error("Unauthorized");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } },
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const environment = body.environment === "live" ? "live" : "sandbox";
    const clientSecret = await createCheckoutSession({
      priceId: String(body.priceId ?? ""),
      quantity: body.quantity,
      customerEmail: user.email,
      userId: user.id,
      returnUrl: String(body.returnUrl ?? ""),
      environment,
    });
    return new Response(JSON.stringify({ clientSecret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-checkout error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
