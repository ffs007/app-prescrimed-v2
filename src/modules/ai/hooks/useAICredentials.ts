// Chaves de IA fornecidas pelo próprio médico (Perplexity e OpenRouter).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { supabaseUntyped } from "@/integrations/supabase/untyped";
import type { AICredentials } from "../lib/types";

const EMPTY: AICredentials = {
  perplexity_key: null,
  openrouter_key: null,
  modelo_preferido: "anthropic/claude-sonnet-4",
  atualizacoes_automaticas: false,
};

export function useAICredentials() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["ia", "credenciais"],
    queryFn: async (): Promise<AICredentials> => {
      const { data, error } = await supabaseUntyped
        .from("ia_credenciais_usuario")
        .select("perplexity_key, openrouter_key, modelo_preferido, atualizacoes_automaticas")
        .maybeSingle();
      if (error) throw error;
      return (data as AICredentials | null) ?? EMPTY;
    },
    staleTime: 5 * 60 * 1000,
  });

  const save = useMutation({
    mutationFn: async (patch: Partial<AICredentials>) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada.");
      const { error } = await supabaseUntyped
        .from("ia_credenciais_usuario")
        .upsert({ user_id: auth.user.id, ...patch }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ia", "credenciais"] }),
  });

  const credentials = query.data ?? EMPTY;

  return {
    credentials,
    isLoading: query.isLoading,
    save,
    hasPerplexity: !!credentials.perplexity_key,
    hasOpenRouter: !!credentials.openrouter_key,
  };
}
