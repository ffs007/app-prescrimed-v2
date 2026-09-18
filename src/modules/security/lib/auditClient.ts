/**
 * Registro de eventos críticos fora de componentes React.
 * Nunca envie texto clínico ou identificação de paciente em `detalhes`.
 */
import { supabase } from "@/integrations/supabase/client";
import type { AuditSeverity } from "./auditActions";

let cachedIp: string | null | undefined;

async function publicIp(): Promise<string | null> {
  if (cachedIp !== undefined) return cachedIp ?? null;
  try {
    const res = await fetch("https://api.ipify.org?format=json", { cache: "force-cache" });
    const json = (await res.json()) as { ip?: string };
    cachedIp = json.ip ?? null;
  } catch {
    cachedIp = null;
  }
  return cachedIp ?? null;
}

export interface CriticalEvent {
  acao: string;
  modulo: string;
  entidade?: string | null;
  entidadeId?: string | null;
  severidade?: AuditSeverity;
  detalhes?: Record<string, unknown>;
}

export async function recordCriticalEvent(event: CriticalEvent): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ip = await publicIp();
    await supabase.from("audit_log_critico").insert({
      user_id: user.id,
      user_email: user.email ?? null,
      acao: event.acao,
      modulo: event.modulo,
      entidade: event.entidade ?? null,
      entidade_id: event.entidadeId ?? null,
      severidade: event.severidade ?? "info",
      ip,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : null,
      detalhes: (event.detalhes ?? {}) as never,
    });
  } catch (e) {
    console.warn("Falha ao registrar evento de auditoria", e);
  }
}
