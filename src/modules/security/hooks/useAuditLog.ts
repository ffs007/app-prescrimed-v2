import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import type { AuditSeverity } from "../lib/auditActions";

export interface AuditEntry {
  id: string;
  user_id: string | null;
  user_email: string | null;
  acao: string;
  modulo: string;
  entidade: string | null;
  entidade_id: string | null;
  severidade: string;
  ip: string | null;
  detalhes: Record<string, unknown>;
  criado_em: string;
}

let cachedIp: string | null = null;
async function publicIp(): Promise<string | null> {
  if (cachedIp !== null) return cachedIp;
  try {
    const res = await fetch("https://api.ipify.org?format=json", { cache: "force-cache" });
    const json = (await res.json()) as { ip?: string };
    cachedIp = json.ip ?? null;
  } catch {
    cachedIp = null;
  }
  return cachedIp;
}

export interface AuditPayload {
  acao: string;
  modulo: string;
  entidade?: string;
  entidadeId?: string;
  severidade?: AuditSeverity;
  detalhes?: Record<string, unknown>;
}

/** Registro de ação crítica — nunca inclua texto clínico ou dado de paciente. */
export function useAuditLogger() {
  const { user } = useAuth();

  return useCallback(
    async (payload: AuditPayload) => {
      if (!user) return;
      const ip = await publicIp();
      await supabase.from("audit_log_critico").insert({
        user_id: user.id,
        user_email: user.email ?? null,
        acao: payload.acao,
        modulo: payload.modulo,
        entidade: payload.entidade ?? null,
        entidade_id: payload.entidadeId ?? null,
        severidade: payload.severidade ?? "info",
        ip,
        user_agent: navigator.userAgent.slice(0, 300),
        detalhes: (payload.detalhes ?? {}) as never,
      });
    },
    [user],
  );
}

export function useAuditTrail(filters: { modulo?: string; acao?: string; busca?: string } = {}) {
  return useQuery({
    queryKey: ["audit-log", filters],
    queryFn: async (): Promise<AuditEntry[]> => {
      let query = supabase
        .from("audit_log_critico")
        .select("*")
        .order("criado_em", { ascending: false })
        .limit(200);
      if (filters.modulo) query = query.eq("modulo", filters.modulo);
      if (filters.acao) query = query.eq("acao", filters.acao);
      const { data, error } = await query;
      if (error) throw error;
      const rows = (data ?? []) as unknown as AuditEntry[];
      if (!filters.busca) return rows;
      const q = filters.busca.toLowerCase();
      return rows.filter((r) =>
        `${r.acao} ${r.modulo} ${r.entidade ?? ""} ${r.entidade_id ?? ""} ${r.user_email ?? ""}`
          .toLowerCase()
          .includes(q),
      );
    },
  });
}
