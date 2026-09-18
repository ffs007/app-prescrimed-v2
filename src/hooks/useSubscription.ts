import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";
import { useAuth } from "@/components/providers/AuthProvider";

export type SubscriptionRow = {
  id: string;
  status: string;
  price_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  environment: string;
};

const ACTIVE_STATUSES = ["active", "trialing", "past_due"];

export function isSubscriptionActive(sub: SubscriptionRow | null | undefined): boolean {
  if (!sub) return false;
  const end = sub.current_period_end ? new Date(sub.current_period_end) : null;
  const inPeriod = !end || end.getTime() > Date.now();
  if (ACTIVE_STATUSES.includes(sub.status) && inPeriod) return true;
  return sub.status === "canceled" && !!end && end.getTime() > Date.now();
}

export function useSubscription() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["subscription", userId],
    enabled: !!userId && isPaymentsConfigured(),
    queryFn: async (): Promise<SubscriptionRow | null> => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id,status,price_id,current_period_end,cancel_at_period_end,environment")
        .eq("user_id", userId!)
        .eq("environment", getStripeEnvironment())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as SubscriptionRow) ?? null;
    },
  });

  useEffect(() => {
    if (!userId) return;
    // tópico único por instância: dois componentes podem usar o hook ao mesmo tempo
    const topic = `subscriptions-${userId}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: ["subscription", userId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const subscription = query.data ?? null;
  const isActive = isSubscriptionActive(subscription);

  return {
    subscription,
    isActive,
    isPastDue: subscription?.status === "past_due",
    plano: subscription?.price_id ?? null,
    loading: query.isLoading,
    refetch: query.refetch,
  };
}
