import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UsageEventRow {
  id: string;
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
        .select("id,tipo,rota,recurso,criado_em")
        .order("criado_em", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as UsageEventRow[];
    },
  });
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
