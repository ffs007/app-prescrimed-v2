import { supabase } from "@/integrations/supabase/client";
import { reportError } from "@/lib/reportError";

export type UsageEventType =
  | "sessao_inicio"
  | "sessao_fim"
  | "tela"
  | "documento"
  | "busca"
  | "ia"
  | "bloqueio_plano"
  | "checkout_inicio"
  | "checkout_aberto"
  | "checkout_erro"
  | "checkout_retorno";

interface UsageEventInput {
  tipo: UsageEventType | string;
  rota?: string;
  recurso?: string;
  detalhe?: Record<string, unknown>;
}

const recent = new Map<string, number>();

/**
 * Registra uma ação do usuário. Nunca envia texto clínico nem dado de paciente.
 */
export async function logUsageEvent(input: UsageEventInput): Promise<void> {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return;

    const key = `${input.tipo}:${input.rota ?? ""}:${input.recurso ?? ""}`;
    const last = recent.get(key) ?? 0;
    if (Date.now() - last < 5000) return;
    recent.set(key, Date.now());

    const { error: writeError } = await supabase.from("uso_eventos").insert({
      user_id: userId,
      tipo: input.tipo,
      rota: input.rota ?? null,
      recurso: input.recurso ?? null,
      detalhe: (input.detalhe ?? {}) as never,
    });
    if (writeError) throw writeError;
  } catch (error) {
    reportError("modules/usage/usageClient", error);
  }
}
