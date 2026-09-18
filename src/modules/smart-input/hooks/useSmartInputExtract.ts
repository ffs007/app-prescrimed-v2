// Etapa 19 — Hook que invoca a edge function smart-input-extract.
import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ExtractedItem, SmartInputResult, EntradaTipo, EntradaOrigem } from "../lib/types";
import { detectMissingFields } from "../lib/missingFields";

interface ExtractParams {
  kind: "text" | "image" | "file_text";
  payload: string;
  contexto?: string;
  tipo_entrada: EntradaTipo;
  origem?: EntradaOrigem;
}

type RawItem = Record<string, unknown> & {
  tipo: ExtractedItem["tipo"];
  texto_original: string;
  confianca: number;
};

export function useSmartInputExtract() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extract = useCallback(async (p: ExtractParams): Promise<SmartInputResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: invokeErr } = await supabase.functions.invoke("smart-input-extract", {
        body: { kind: p.kind, payload: p.payload, contexto: p.contexto },
      });
      if (invokeErr) throw invokeErr;

      const itensRaw: RawItem[] = (data?.itens ?? []) as RawItem[];

      const itens: ExtractedItem[] = itensRaw.map((it, i) => {
        const base = {
          id: `item_${Date.now()}_${i}`,
          campos_faltantes: (it.campos_faltantes as ExtractedItem["campos_faltantes"]) ?? [],
          campos_ambiguos: (it.campos_ambiguos as string[]) ?? [],
          alertas: (it.alertas as string[]) ?? [],
          selecionado: false,
        } as const;
        const merged = { ...it, ...base } as ExtractedItem;
        // Recalcula faltantes por segurança (independente da IA)
        const faltantes = detectMissingFields(merged);
        return { ...merged, campos_faltantes: [...merged.campos_faltantes, ...faltantes] };
      });

      return {
        tipo_entrada: p.tipo_entrada,
        origem: p.origem ?? "prescricao",
        texto_original: p.kind === "text" ? p.payload : "",
        texto_transcrito_ou_extraido: p.kind !== "text" ? p.contexto ?? null : null,
        confianca_geral: typeof data?.confianca_geral === "number" ? data.confianca_geral : 0,
        alertas_ia: Array.isArray(data?.alertas_ia) ? data.alertas_ia : [],
        itens,
      };
    } catch (e) {
      setError((e as Error).message ?? "extract-failed");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { extract, loading, error };
}
