// Etapa 19 — Bandas de confiança e regra de pré-seleção.
import type { ConfidenceBand, SmartInputSettings } from "./types";

export function bandFor(score: number): ConfidenceBand {
  if (score >= 90) return "alta";
  if (score >= 70) return "moderada";
  if (score >= 50) return "baixa";
  return "muito_baixa";
}

export function confidenceLabel(band: ConfidenceBand): string {
  return band === "alta"
    ? "Alta"
    : band === "moderada"
    ? "Revisar"
    : band === "baixa"
    ? "Confirmação necessária"
    : "Não estruturado";
}

export function confidenceTone(band: ConfidenceBand): "ok" | "atencao" | "alerta" | "neutral" {
  return band === "alta" ? "ok" : band === "moderada" ? "atencao" : band === "baixa" ? "alerta" : "neutral";
}

/**
 * Decide se o item deve vir pré-selecionado, segundo as configs administrativas.
 * Itens críticos com baixa confiança nunca são pré-selecionados.
 */
export function shouldPreselect(score: number, settings: SmartInputSettings | null): boolean {
  if (!settings) return false;
  if (!settings.permitir_preselecao_alta_confianca) return false;
  return score >= settings.confianca_min_preselecao;
}

export function meetsSuggestionThreshold(score: number, settings: SmartInputSettings | null): boolean {
  if (!settings) return score >= 70;
  return score >= settings.confianca_min_sugestao;
}
