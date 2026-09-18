/**
 * Descoberta online de protocolos e escores oficiais.
 *
 * Chama a função clinical-ai em modo "biblioteca" (Perplexity quando
 * configurado) e grava o resultado em `library_descobertas`, alimentando o hub
 * Protocolos & Escores automaticamente. Todo item entra como "pendente" —
 * sugestão revisável, nunca conteúdo oficial automático.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ClinicalEnvironment, ClinicalSeverity } from "@/modules/prescription/types/prescription";
import type { LibraryItem, LibraryKind } from "../lib/types";

interface DiscoveredRow {
  id: string;
  kind: string;
  nome: string;
  descricao: string | null;
  patologias: string[];
  especialidade: string | null;
  gravidade: string | null;
  ambientes: string[];
  referencia: string | null;
  url: string | null;
  status: string;
}

const toItem = (r: DiscoveredRow): LibraryItem => ({
  id: `desc_${r.id}`,
  kind: (["protocolo", "escore", "trial", "fluxograma"].includes(r.kind) ? r.kind : "protocolo") as LibraryKind,
  name: r.nome,
  description: r.descricao ?? "",
  pathologies: r.patologias ?? [],
  specialty: r.especialidade,
  severity: (r.gravidade as ClinicalSeverity | null) ?? null,
  environments: (r.ambientes?.length ? r.ambientes : ["ambulatorial", "urgencia", "emergencia"]) as ClinicalEnvironment[],
  reference: r.referencia,
  url: r.url,
  source: "descoberta",
});

export function useLibraryDiscovery() {
  const qc = useQueryClient();

  const discovered = useQuery({
    queryKey: ["library", "descobertas"],
    queryFn: async (): Promise<LibraryItem[]> => {
      const { data, error } = await supabase
        .from("library_descobertas")
        .select("id, kind, nome, descricao, patologias, especialidade, gravidade, ambientes, referencia, url, status")
        .neq("status", "descartado")
        .order("nome");
      if (error) throw error;
      return ((data ?? []) as DiscoveredRow[]).map(toItem);
    },
    staleTime: 60_000,
  });

  const search = useMutation({
    mutationFn: async (tema: string) => {
      const { data, error } = await supabase.functions.invoke("clinical-ai", {
        body: { modo: "biblioteca", tema },
      });
      if (error) throw new Error(error.message);
      const itens = (data?.itens ?? []) as Array<Record<string, unknown>>;
      if (!itens.length) return { inseridos: 0, fonte: data?.fonte ?? "gateway" };

      const { data: auth } = await supabase.auth.getUser();
      const rows = itens.map((i) => ({
        kind: String(i.kind ?? "protocolo"),
        nome: String(i.nome ?? "").slice(0, 200),
        descricao: (i.descricao as string) ?? null,
        patologias: (i.patologias as string[]) ?? [],
        especialidade: (i.especialidade as string) ?? null,
        gravidade: (i.gravidade as string) ?? null,
        ambientes: (i.ambientes as string[]) ?? [],
        referencia: (i.referencia as string) ?? null,
        url: (i.url as string) ?? null,
        consulta: tema,
        criado_por: auth.user?.id ?? null,
      })).filter((r) => r.nome);

      const { error: upsertError } = await supabase
        .from("library_descobertas")
        .upsert(rows, { onConflict: "kind,nome" });
      if (upsertError) throw upsertError;
      return { inseridos: rows.length, fonte: (data?.fonte as string) ?? "gateway" };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["library", "descobertas"] }),
  });

  return { discovered: discovered.data ?? [], isLoading: discovered.isLoading, search };
}
