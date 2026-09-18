import { supabase } from "@/integrations/supabase/client";

type Action = "criou" | "editou" | "importou" | "aprovou" | "solicitou_correcao" | "inativou" | "reativou";

export async function logIVAction(params: {
  id_medicamento?: string | null;
  principio_ativo: string;
  tipo_acao: Action;
  campo_alterado?: string | null;
  valor_anterior?: string | null;
  valor_novo?: string | null;
}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await (supabase.from("log_base_diluicao_iv" as any) as any).insert({
      ...params,
      usuario_responsavel: session.user.id,
    });
    if (error) console.error("[ivAuditLog] falha ao gravar log:", error);
  } catch (error) {
    console.error("[ivAuditLog] falha ao gravar log:", error);
  }
}

export function diffFields<T extends Record<string, any>>(prev: T, next: T): { field: string; before: string; after: string }[] {
  const diffs: { field: string; before: string; after: string }[] = [];
  const keys = new Set([...Object.keys(prev ?? {}), ...Object.keys(next ?? {})]);
  for (const k of keys) {
    const a = JSON.stringify(prev?.[k] ?? null);
    const b = JSON.stringify(next?.[k] ?? null);
    if (a !== b) diffs.push({ field: k, before: a, after: b });
  }
  return diffs;
}
