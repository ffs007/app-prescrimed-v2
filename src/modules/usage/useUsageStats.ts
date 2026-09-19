import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UsageEventRow {
  id: string;
  user_id: string;
  tipo: string;
  rota: string | null;
  recurso: string | null;
  criado_em: string;
}

export function useUsageEvents(limit = 300) {
  return useQuery({
    queryKey: ["uso-eventos", limit],
    queryFn: async (): Promise<UsageEventRow[]> => {
      const { data, error } = await supabase
        .from("uso_eventos")
        .select("id,user_id,tipo,rota,recurso,criado_em")
        .order("criado_em", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as UsageEventRow[];
    },
  });
}

const CHECKOUT_EVENT_TYPES = [
  "checkout_inicio",
  "checkout_aberto",
  "checkout_erro",
  "checkout_retorno",
];

export function useCheckoutEvents(days = 30) {
  return useQuery({
    queryKey: ["checkout-eventos", days],
    queryFn: async (): Promise<UsageEventRow[]> => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("uso_eventos")
        .select("id,user_id,tipo,rota,recurso,criado_em")
        .in("tipo", CHECKOUT_EVENT_TYPES)
        .gte("criado_em", since)
        .order("criado_em", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as UsageEventRow[];
    },
  });
}

export function summarizeCheckoutFunnel(events: UsageEventRow[]) {
  const users = (type: string, resource?: string) => new Set(
    events
      .filter((event) => event.tipo === type && (!resource || event.recurso === resource))
      .map((event) => event.user_id),
  );
  const startedUsers = users("checkout_inicio");
  const convertedFromStart = (type: string, resource?: string) =>
    [...users(type, resource)].filter((userId) => startedUsers.has(userId)).length;

  const started = startedUsers.size;
  const opened = convertedFromStart("checkout_aberto");
  const activated = convertedFromStart("checkout_retorno", "ativo");
  const errors = events.filter((event) => event.tipo === "checkout_erro").length;
  const percent = (value: number) => started ? Math.round((value / started) * 100) : 0;

  return {
    started,
    opened,
    activated,
    errors,
    openRate: percent(opened),
    activationRate: percent(activated),
    monthlyInterest: users("checkout_inicio", "pro_monthly").size,
    yearlyInterest: users("checkout_inicio", "pro_yearly").size,
  };
}

export function summarizeUsage(events: UsageEventRow[]) {
  const porDia = new Map<string, number>();
  const porRecurso = new Map<string, number>();
  const porTipo = new Map<string, number>();

  for (const ev of events) {
    const dia = ev.criado_em.slice(0, 10);
    porDia.set(dia, (porDia.get(dia) ?? 0) + 1);
    const recurso = ev.recurso ?? ev.rota ?? ev.tipo;
    porRecurso.set(recurso, (porRecurso.get(recurso) ?? 0) + 1);
    porTipo.set(ev.tipo, (porTipo.get(ev.tipo) ?? 0) + 1);
  }

  const ordenar = (m: Map<string, number>) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]);

  return {
    porDia: [...porDia.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 14),
    porRecurso: ordenar(porRecurso).slice(0, 10),
    porTipo: ordenar(porTipo),
    bloqueios: events.filter((e) => e.tipo === "bloqueio_plano").length,
  };
}
