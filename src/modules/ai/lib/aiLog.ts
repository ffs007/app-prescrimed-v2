// Registro de uso de IA para rastreabilidade (LGPD).
// Guarda apenas metadados: módulo, provedor, modelo, assunto curto e referências.
// Nunca grava texto clínico, dados do paciente nem o conteúdo enviado.
import { supabase } from "@/integrations/supabase/client";
import { supabaseUntyped } from "@/integrations/supabase/untyped";

export interface AILogEntry {
  modulo: "chatbot" | "documento" | "atualizacoes" | "validacao_template";
  provedor?: string | null;
  modelo?: string | null;
  /** Assunto genérico, sem identificação do paciente. Truncado em 120 caracteres. */
  assunto?: string | null;
  referencias?: string[];
  aceito?: boolean | null;
}

const sanitize = (s?: string | null) =>
  s ? s.replace(/\s+/g, " ").trim().slice(0, 120) : null;

/** Fire-and-forget: nunca quebra a interface. */
export async function logAIUsage(entry: AILogEntry): Promise<void> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await supabaseUntyped.from("ia_interacoes_log").insert({
      user_id: auth.user.id,
      modulo: entry.modulo,
      provedor: entry.provedor ?? null,
      modelo: entry.modelo ?? null,
      assunto: sanitize(entry.assunto),
      referencias: entry.referencias ?? [],
      aceito: entry.aceito ?? null,
    });
  } catch {
    // silencioso
  }
}
