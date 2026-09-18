// Chamada à edge function `ai-assist` (chat, documentos, validação de template).
import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAIUsage } from "../lib/aiLog";
import type { AIChatMessage } from "../lib/types";

const ERROR_TEXT: Record<string, string> = {
  "nao-autenticado": "Sua sessão expirou. Entre novamente.",
  "rate-limited": "Muitas consultas seguidas. Aguarde alguns segundos.",
  "credits-exhausted": "Os créditos de IA acabaram. Adicione créditos ou informe sua própria chave.",
  "missing-api-key": "Nenhuma chave de IA disponível. Informe sua chave nas configurações.",
  "openrouter-erro": "A chave do OpenRouter foi recusada. Verifique-a nas configurações.",
  "perplexity-erro": "A chave da Perplexity foi recusada. Verifique-a nas configurações.",
  "resposta-invalida": "A IA devolveu uma resposta que não pôde ser lida. Tente de novo.",
};

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
        setError(ERROR_TEXT[payload.error] ?? "Não foi possível consultar a IA agora.");
        return null;
      }
      if (invokeErr) throw invokeErr;
      return payload;
    } catch (e) {
      setError((e as Error).message || "Falha na consulta à IA.");
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
