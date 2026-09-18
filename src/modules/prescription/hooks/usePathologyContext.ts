/**
 * usePathologyContext — conteúdo clínico curado da patologia ativa.
 *
 * Lê `patologia_documentos` (documentos sugeridos), `patologia_recursos`
 * (protocolos, escores, trials, guidelines) e `patologia_conteudo` (seções
 * clínicas) filtrando pelo ambiente de atendimento selecionado.
 */
import { useQuery } from "@tanstack/react-query";
import { supabaseUntyped } from "@/integrations/supabase/untyped";
import type { ClinicalEnvironment } from "../types/prescription";

export const patNorm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export interface PathologyDocumentSuggestion {
  documento: string;
  prioridade: number;
  nota: string | null;
}

export interface PathologyResource {
  id: string;
  tipo: "protocolo" | "escore" | "trial" | "guideline" | "link";
  titulo: string;
  codigo: string | null;
  resumo: string | null;
  url: string | null;
}

export interface PathologySection {
  secao: string;
  conteudo: Record<string, unknown>;
  ordem: number;
  fonte: string | null;
}

export interface PathologyContext {
  documentos: PathologyDocumentSuggestion[];
  recursos: PathologyResource[];
  secoes: PathologySection[];
}

const EMPTY: PathologyContext = { documentos: [], recursos: [], secoes: [] };

export function usePathologyContext(
  pathologyName: string | null | undefined,
  environment: ClinicalEnvironment,
) {
  const key = pathologyName ? patNorm(pathologyName) : "";

  const query = useQuery({
    queryKey: ["pathology-context", key, environment],
    enabled: key.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PathologyContext> => {
      const [docs, recs, secs] = await Promise.all([
        supabaseUntyped
          .from("patologia_documentos")
          .select("documento, prioridade, nota, ambiente")
          .eq("nome_normalizado", key)
          .order("prioridade", { ascending: false }),
        supabaseUntyped
          .from("patologia_recursos")
          .select("id, tipo, titulo, codigo, resumo, url, ordem")
          .eq("nome_normalizado", key)
          .order("ordem"),
        supabaseUntyped
          .from("patologia_conteudo")
          .select("secao, conteudo, ordem, fonte, ambiente")
          .eq("nome_normalizado", key)
          .order("ordem"),
      ]);

      const inEnv = <T extends { ambiente?: string | null }>(rows: T[] | null) =>
        (rows ?? []).filter((r) => !r.ambiente || r.ambiente === environment);

      return {
        documentos: inEnv(docs.data as never[]) as PathologyDocumentSuggestion[],
        recursos: ((recs.data ?? []) as PathologyResource[]),
        secoes: inEnv(secs.data as never[]) as PathologySection[],
      };
    },
  });

  return { context: query.data ?? EMPTY, isLoading: query.isLoading, isError: query.isError };
}
