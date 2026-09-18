import { supabase } from "@/integrations/supabase/client";
import type { MatchResult, MatchType } from "./ivMatcher";

type Action =
  | "associado_automaticamente"
  | "confirmado_pelo_usuario"
  | "escolhido_manual"
  | "ignorado"
  | "sem_correspondencia";

export async function logIVMatch(params: {
  result: MatchResult;
  action: Action;
  type?: MatchType;
  prescricaoId?: string | null;
  medicamentoPrescritoId?: string | null;
  chosenMedId?: string | null;
  chosenMedName?: string | null;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("log_correspondencia_medicamentos_iv").insert({
      usuario_responsavel: user.id,
      id_prescricao: params.prescricaoId ?? null,
      id_medicamento_prescrito: params.medicamentoPrescritoId ?? null,
      texto_digitado: params.result.query,
      texto_normalizado: params.result.normalized,
      medicamento_correspondente: params.chosenMedName ?? params.result.best?.med.principio_ativo ?? null,
      id_base_diluicao_iv: params.chosenMedId ?? params.result.best?.med.id ?? null,
      tipo_correspondencia: params.type ?? params.result.best?.type ?? "nenhuma",
      score_confianca: params.result.best?.score ?? 0,
      acao_usuario: params.action,
    } as any);
  } catch {
    // silencioso: log não deve quebrar fluxo
  }
}

export async function suggestSearchTerm(params: {
  medId: string;
  principioAtivo: string;
  termo: string;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("iv_termos_sugeridos").insert({
      id_medicamento: params.medId,
      principio_ativo: params.principioAtivo,
      termo_sugerido: params.termo,
      ultimo_usuario: user.id,
    } as any);
  } catch {
    // ignore
  }
}
