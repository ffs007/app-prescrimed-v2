/**
 * Passo 5 — Hook de apoio clínico por IA.
 * Chama a edge function `clinical-ai` com a patologia ativa, o ambiente,
 * o perfil do paciente e a prescrição atual. Retorno sempre como sugestão.
 */
import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AIConduta {
  titulo: string;
  detalhe: string;
  prioridade: "imediata" | "alta" | "media" | "baixa";
}

export interface AIAlerta {
  gravidade: "critico" | "atencao" | "informativo";
  mensagem: string;
}

export interface AIMedSugerido {
  nome: string;
  posologia: string;
  observacao?: string | null;
}

export interface ClinicalAIResult {
  resumo: string;
  condutas: AIConduta[];
  medicamentos_sugeridos?: AIMedSugerido[];
  exames_sugeridos?: string[];
  alertas: AIAlerta[];
  escores_recomendados?: string[];
  referencias?: string[];
}

export interface ClinicalAIRequest {
  patologia?: string;
  ambiente?: string;
  paciente?: {
    idade?: string | null;
    peso?: string | null;
    pediatrico?: boolean;
    gestante?: boolean;
    alergias?: string | null;
    renal?: boolean;
    hepatico?: boolean;
    comorbidades?: string | null;
  };
  medicamentos?: string[];
  exames?: string[];
  pergunta?: string;
}

const ERROR_TEXT: Record<string, string> = {
  "rate-limited": "Muitas consultas em sequência. Aguarde alguns segundos e tente novamente.",
  "credits-exhausted": "Os créditos de IA do projeto acabaram.",
  "missing-api-key": "A IA ainda não está configurada neste backend.",
};

export function useClinicalAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClinicalAIResult | null>(null);

  const ask = useCallback(async (req: ClinicalAIRequest): Promise<ClinicalAIResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: invokeErr } = await supabase.functions.invoke("clinical-ai", { body: req });
      if (invokeErr) throw invokeErr;
      const payload = data as (ClinicalAIResult & { error?: string }) | null;
      if (!payload || payload.error) {
        setError(ERROR_TEXT[payload?.error ?? ""] ?? "Não foi possível consultar a IA agora.");
        return null;
      }
      const normalized: ClinicalAIResult = {
        resumo: payload.resumo ?? "",
        condutas: payload.condutas ?? [],
        medicamentos_sugeridos: payload.medicamentos_sugeridos ?? [],
        exames_sugeridos: payload.exames_sugeridos ?? [],
        alertas: payload.alertas ?? [],
        escores_recomendados: payload.escores_recomendados ?? [],
        referencias: payload.referencias ?? [],
      };
      setResult(normalized);
      return normalized;
    } catch (e) {
      setError((e as Error).message ?? "Falha na consulta à IA.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { ask, reset, loading, error, result };
}
