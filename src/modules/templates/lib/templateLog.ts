// Etapa 17 — Log de uso de modelos/kits (buffered, fire-and-forget).

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { reportError } from "@/lib/reportError";

type Action = Database["public"]["Enums"]["template_log_action"];
type TipoModelo = Database["public"]["Enums"]["template_type"];

export interface LogTemplateUseInput {
  id_atendimento?: string;
  id_paciente?: string;
  id_modelo?: string;
  nome_modelo?: string;
  versao_modelo?: number;
  tipo_modelo?: TipoModelo;
  acao: Action;
  itens_visualizados?: unknown[];
  itens_adicionados?: unknown[];
  itens_editados?: unknown[];
  itens_removidos?: unknown[];
  alertas_gerados?: unknown[];
  justificativas?: unknown[];
}

export async function logTemplateUse(input: LogTemplateUseInput) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: writeError } = await supabase.from("log_uso_modelos_prescricao").insert({
      usuario_responsavel: user.id,
      acao: input.acao,
      id_atendimento: input.id_atendimento ?? null,
      id_paciente: input.id_paciente ?? null,
      id_modelo: input.id_modelo ?? null,
      nome_modelo: input.nome_modelo ?? null,
      versao_modelo: input.versao_modelo ?? null,
      tipo_modelo: input.tipo_modelo ?? null,
      itens_visualizados: (input.itens_visualizados ?? []) as any,
      itens_adicionados: (input.itens_adicionados ?? []) as any,
      itens_editados: (input.itens_editados ?? []) as any,
      itens_removidos: (input.itens_removidos ?? []) as any,
      alertas_gerados: (input.alertas_gerados ?? []) as any,
      justificativas: (input.justificativas ?? []) as any,
    });
    if (writeError) throw writeError;
  } catch (err) {
    reportError("templateLog", err);
  }
}
