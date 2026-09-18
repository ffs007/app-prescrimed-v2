/**
 * useClinicalLibrary — unifica protocolos e escores da base clínica com o
 * catálogo local de trials e fluxogramas, num único formato filtrável.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ClinicalEnvironment, ClinicalSeverity } from "@/modules/prescription/types/prescription";
import { LOCAL_LIBRARY } from "../lib/catalog";
import { useLibraryDiscovery } from "./useLibraryDiscovery";
import type { LibraryItem } from "../lib/types";

const ENV_BY_CONTEXT: Record<string, ClinicalEnvironment[]> = {
  urgencia: ["urgencia"],
  pronto_atendimento: ["urgencia"],
  enfermaria: ["urgencia"],
  hospitalar: ["urgencia"],
  ambulatorio: ["ambulatorial"],
  telemedicina: ["ambulatorial"],
  pediatria: ["ambulatorial", "urgencia"],
  obstetricia: ["ambulatorial", "urgencia"],
  geral: ["ambulatorial", "urgencia", "emergencia"],
};

const severityFromProtocol = (tipo: string | null, contexto: string | null): ClinicalSeverity => {
  if (tipo === "emergencia") return "critica";
  if (contexto === "urgencia" || contexto === "pronto_atendimento") return "grave";
  if (contexto === "hospitalar" || contexto === "enfermaria") return "moderada";
  return "leve";
};

async function fetchProtocols(): Promise<LibraryItem[]> {
  const { data, error } = await supabase
    .from("base_protocolos_clinicos")
    .select(
      "id, nome_protocolo, tipo_protocolo, area_clinica, contexto_atendimento, queixas_relacionadas, sindromes_relacionadas, cids_relacionados, palavras_chave, fonte_referencia, ativo",
    )
    .eq("ativo", true)
    .order("nome_protocolo");
  if (error) throw error;
  return (data ?? []).map((p: Record<string, unknown>) => {
    const contexto = (p.contexto_atendimento as string) ?? "geral";
    const tipo = (p.tipo_protocolo as string) ?? null;
    const pathologies = [
      ...(((p.queixas_relacionadas as string[]) ?? []) || []),
      ...(((p.sindromes_relacionadas as string[]) ?? []) || []),
      ...(((p.palavras_chave as string[]) ?? []) || []),
    ].filter(Boolean);
    return {
      id: `prot_${p.id}`,
      kind: "protocolo",
      name: (p.nome_protocolo as string) ?? "Protocolo",
      description: [tipo, ((p.cids_relacionados as string[]) ?? []).slice(0, 4).join(", ")]
        .filter(Boolean)
        .join(" · "),
      pathologies,
      specialty: (p.area_clinica as string) ?? null,
      severity: severityFromProtocol(tipo, contexto),
      environments: ENV_BY_CONTEXT[contexto] ?? ["urgencia"],
      reference: (p.fonte_referencia as string) ?? null,
      source: "base",
    } satisfies LibraryItem;
  });
}

async function fetchScores(): Promise<LibraryItem[]> {
  const { data, error } = await supabase
    .from("stg_escores_clinicos")
    .select("id, nome_escore, sinonimos, especialidade, populacao_alvo, finalidade, conduta_associada, versao")
    .order("nome_escore")
    .limit(400);
  if (error) throw error;
  return (data ?? []).map((s: Record<string, unknown>) => ({
    id: `esc_${s.id}`,
    kind: "escore" as const,
    name: (s.nome_escore as string) ?? "Escore",
    description: ((s.finalidade as string) ?? (s.conduta_associada as string) ?? "").slice(0, 220),
    pathologies: [(s.finalidade as string) ?? "", (s.populacao_alvo as string) ?? "", (s.sinonimos as string) ?? ""]
      .filter(Boolean)
      .map((t) => String(t)),
    specialty: (s.especialidade as string) ?? null,
    severity: null,
    environments: ["ambulatorial", "urgencia", "emergencia"] as ClinicalEnvironment[],
    reference: (s.versao as string) ?? null,
    source: "base" as const,
  }));
}

export function useClinicalLibrary() {
  const discovery = useLibraryDiscovery();
  const protocols = useQuery({
    queryKey: ["library", "protocolos"],
    queryFn: fetchProtocols,
    staleTime: 5 * 60 * 1000,
  });
  const scores = useQuery({
    queryKey: ["library", "escores"],
    queryFn: fetchScores,
    staleTime: 5 * 60 * 1000,
  });

  const items: LibraryItem[] = [
    ...(protocols.data ?? []),
    ...(scores.data ?? []),
    ...LOCAL_LIBRARY,
    ...discovery.discovered,
  ];

  return {
    discovery,
    items,
    isLoading: protocols.isLoading || scores.isLoading,
    error: (protocols.error ?? scores.error) as Error | null,
  };
}
