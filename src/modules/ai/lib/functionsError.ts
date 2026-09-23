// supabase-js devolve data:null + FunctionsHttpError genérico em qualquer
// resposta não-2xx do ai-assist; o corpo JSON real (com o código de erro)
// só existe em error.context (Response). Sem isso, todo erro (403 de
// assinatura incluído) vira "Edge Function returned a non-2xx status code".
export const AI_ERROR_TEXT: Record<string, string> = {
  "nao-autenticado": "Sua sessão expirou. Entre novamente.",
  "rate-limited": "Muitas consultas seguidas. Aguarde alguns segundos.",
  "credits-exhausted": "Os créditos de IA acabaram. Adicione créditos ou informe sua própria chave.",
  "missing-api-key": "Nenhuma chave de IA disponível. Informe sua chave nas configurações.",
  "openrouter-erro": "A chave do OpenRouter foi recusada. Verifique-a nas configurações.",
  "perplexity-erro": "A chave da Perplexity foi recusada. Verifique-a nas configurações.",
  "resposta-invalida": "A IA devolveu uma resposta que não pôde ser lida. Tente de novo.",
  "assinatura-necessaria": "Recurso exclusivo do plano Pro. Assine para usar.",
};

export async function readFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  const ctx = (error as { context?: Response } | null)?.context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = await ctx.json();
      if (typeof body?.error === "string") return AI_ERROR_TEXT[body.error] ?? fallback;
    } catch {
      return fallback;
    }
  }
  return (error as Error | null)?.message || fallback;
}
