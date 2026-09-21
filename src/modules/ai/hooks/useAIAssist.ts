// Chamada à edge function `ai-assist` (chat, documentos, validação de template).
import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAIUsage } from "../lib/aiLog";
import { AI_ERROR_TEXT, readFunctionErrorMessage } from "../lib/functionsError";
import type { AIChatMessage } from "../lib/types";

export interface AIAssistResponse {
  texto: string;
  fonte?: string;
  modelo?: string;
  referencias?: string[];
  disclaimer?: string;
}

interface DocumentoParams {
  tipo_documento: string;
  acao: "rascunho" | "revisar" | "justificativa" | "cids";
  texto: string;
}

export function useAIAssist() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(async (body: Record<string, unknown>): Promise<AIAssistResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: invokeErr } = await supabase.functions.invoke("ai-assist", { body });
      const payload = data as (AIAssistResponse & { error?: string }) | null;
      if (payload?.error) {
        setError(AI_ERROR_TEXT[payload.error] ?? "Não foi possível consultar a IA agora.");
        return null;
      }
      if (invokeErr) throw invokeErr;
      return payload;
    } catch (e) {
      setError(await readFunctionErrorMessage(e, "Falha na consulta à IA."));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const chat = useCallback(
    async (mensagens: AIChatMessage[]) => {
      const res = await call({ modo: "chat", mensagens });
      if (res) {
        void logAIUsage({
          modulo: "chatbot",
          provedor: res.fonte,
          modelo: res.modelo,
          assunto: mensagens[mensagens.length - 1]?.content,
          referencias: res.referencias,
        });
      }
      return res;
    },
    [call],
  );

  const documento = useCallback(
    async (p: DocumentoParams) => {
      const res = await call({ modo: "documento", ...p });
      if (res) {
        void logAIUsage({
          modulo: "documento",
          provedor: res.fonte,
          modelo: res.modelo,
          assunto: `${p.acao} — ${p.tipo_documento}`,
        });
      }
      return res;
    },
    [call],
  );

  const validarTemplate = useCallback(
    async (tipo_documento: string, template: string) => {
      const res = await call({ modo: "validar_template", tipo_documento, template });
      if (res) {
        void logAIUsage({
          modulo: "validacao_template",
          provedor: res.fonte,
          modelo: res.modelo,
          assunto: `validação — ${tipo_documento}`,
          referencias: res.referencias,
        });
      }
      return res;
    },
    [call],
  );

  return { chat, documento, validarTemplate, loading, error, setError };
}
