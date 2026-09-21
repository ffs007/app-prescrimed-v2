// Atualizações clínicas pendentes + histórico de versões de protocolos.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { supabaseUntyped } from "@/integrations/supabase/untyped";
import { logAIUsage } from "../lib/aiLog";
import { AI_ERROR_TEXT, readFunctionErrorMessage } from "../lib/functionsError";
import type { PendingUpdate, ProtocolVersion, UpdateStatus } from "../lib/types";

interface DiscoveredItem {
  tipo?: string;
  titulo?: string;
  resumo?: string;
  conteudo_novo?: string;
  referencia?: string;
  url?: string;
}

export function useAIUpdates() {
  const qc = useQueryClient();

  const updates = useQuery({
    queryKey: ["ia", "atualizacoes"],
    queryFn: async (): Promise<PendingUpdate[]> => {
      const { data, error } = await supabaseUntyped
        .from("ia_atualizacoes_pendentes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PendingUpdate[];
    },
  });

  const versions = useQuery({
    queryKey: ["ia", "versoes"],
    queryFn: async (): Promise<ProtocolVersion[]> => {
      const { data, error } = await supabaseUntyped
        .from("protocolo_versoes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProtocolVersion[];
    },
  });

  /** Busca online atualizações para uma patologia e grava como pendentes. */
  const buscar = useMutation({
    mutationFn: async (patologia: string) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.functions.invoke("ai-assist", {
        body: { modo: "atualizacoes", patologia },
      });
      const payload = data as { itens?: DiscoveredItem[]; fonte?: string; modelo?: string; error?: string } | null;
      if (payload?.error) throw new Error(AI_ERROR_TEXT[payload.error] ?? payload.error);
      if (error) throw new Error(await readFunctionErrorMessage(error, "Não foi possível buscar agora."));

      const itens = payload?.itens ?? [];
      if (!itens.length) return { inseridos: 0, fonte: payload?.fonte ?? "gateway" };

      // Versão atual do mesmo protocolo, para permitir comparação.
      const { data: atuais } = await supabaseUntyped
        .from("protocolo_versoes")
        .select("protocolo, conteudo, versao")
        .eq("patologia", patologia)
        .order("versao", { ascending: false });
      const anteriorDe = new Map<string, string>();
      for (const v of (atuais ?? []) as ProtocolVersion[]) {
        if (!anteriorDe.has(v.protocolo)) anteriorDe.set(v.protocolo, v.conteudo);
      }

      const rows = itens
        .filter((i) => i.titulo)
        .map((i) => ({
          user_id: auth.user!.id,
          patologia,
          tipo: i.tipo ?? "protocolo",
          titulo: String(i.titulo).slice(0, 200),
          resumo: i.resumo ?? null,
          conteudo_novo: i.conteudo_novo ?? null,
          conteudo_anterior: anteriorDe.get(String(i.titulo)) ?? null,
          fonte: payload?.fonte ?? null,
          referencia: i.referencia ?? null,
          url: i.url ?? null,
          provedor: payload?.modelo ?? null,
          status: "pendente",
        }));

      const { error: insertError } = await supabaseUntyped.from("ia_atualizacoes_pendentes").insert(rows);
      if (insertError) throw insertError;

      void logAIUsage({
        modulo: "atualizacoes",
        provedor: payload?.fonte,
        modelo: payload?.modelo,
        assunto: patologia,
      });
      return { inseridos: rows.length, fonte: payload?.fonte ?? "gateway" };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ia", "atualizacoes"] }),
  });

  /** Aceitar cria nova versão do protocolo; recusar apenas marca a decisão. */
  const revisar = useMutation({
    mutationFn: async ({ item, status }: { item: PendingUpdate; status: Exclude<UpdateStatus, "pendente"> }) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada.");

      if (status === "aceito") {
        const { data: ultima } = await supabaseUntyped
          .from("protocolo_versoes")
          .select("versao")
          .eq("protocolo", item.titulo)
          .order("versao", { ascending: false })
          .limit(1)
          .maybeSingle();
        const proxima = ((ultima as { versao?: number } | null)?.versao ?? 0) + 1;
        const { error: versionError } = await supabaseUntyped.from("protocolo_versoes").insert({
          user_id: auth.user.id,
          patologia: item.patologia,
          protocolo: item.titulo,
          versao: proxima,
          conteudo: item.conteudo_novo ?? item.resumo ?? "",
          origem: item.fonte ?? "ia",
          referencia: item.referencia,
          url: item.url,
          atualizacao_id: item.id,
        });
        if (versionError) throw versionError;
      }

      const { error } = await supabaseUntyped
        .from("ia_atualizacoes_pendentes")
        .update({ status, revisado_em: new Date().toISOString() })
        .eq("id", item.id);
      if (error) throw error;

      void logAIUsage({
        modulo: "atualizacoes",
        provedor: item.fonte,
        assunto: `${item.patologia} — ${item.titulo}`,
        aceito: status === "aceito",
        referencias: item.referencia ? [item.referencia] : [],
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ia", "atualizacoes"] });
      qc.invalidateQueries({ queryKey: ["ia", "versoes"] });
    },
  });

  return {
    updates: updates.data ?? [],
    versions: versions.data ?? [],
    isLoading: updates.isLoading || versions.isLoading,
    buscar,
    revisar,
  };
}
