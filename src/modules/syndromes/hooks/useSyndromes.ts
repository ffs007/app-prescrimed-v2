/**
 * useSyndromes — catálogo de síndromes vindo do backend (`base_sindromes`).
 *
 * Fonte única: nenhuma síndrome é declarada em arquivo estático. A consulta é
 * cacheada pelo React Query e filtrada por ambiente assistencial na UI.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabaseUntyped } from "@/integrations/supabase/untyped";
import type { ClinicalEnvironment, ClinicalSeverity } from "@/modules/prescription/types/prescription";
import type { Syndrome, SyndromeExam, SyndromeMedication } from "../lib/types";

export const syndromesQueryKey = ["syndromes", "base"] as const;

type Row = Record<string, unknown>;

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const asStr = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

const isEnv = (v: unknown): v is ClinicalEnvironment =>
  v === "ambulatorial" || v === "urgencia" || v === "emergencia";

function toSyndrome(row: Row): Syndrome {
  return {
    id: String(row.id),
    codigo: String(row.codigo ?? ""),
    nome: String(row.nome ?? ""),
    sinonimos: asArray<string>(row.sinonimos),
    ambientes: asArray<unknown>(row.ambientes).filter(isEnv),
    cid: asStr(row.cid_sugerido),
    gravidade: (asStr(row.gravidade_tipica) as ClinicalSeverity | null) ?? null,
    categoria: asStr(row.categoria),
    medicamentosAmbulatoriais: asArray<SyndromeMedication>(row.medicamentos_ambulatoriais),
    medicamentosHospitalares: asArray<SyndromeMedication>(row.medicamentos_hospitalares),
    examesComuns: asArray<SyndromeExam>(row.exames_comuns),
    examesApac: asArray<SyndromeExam>(row.exames_apac),
    orientacoes: asArray<string>(row.orientacoes),
    atestadoPadrao: asStr(row.atestado_padrao),
    encaminhamentos: asArray<string>(row.encaminhamentos),
    adaptacaoPediatrica: asStr(row.adaptacao_pediatrica),
    adaptacaoGestante: asStr(row.adaptacao_gestante),
    adaptacaoLactante: asStr(row.adaptacao_lactante),
    adaptacaoGeriatrica: asStr(row.adaptacao_geriatrica),
    sinaisAlerta: asArray<string>(row.sinais_alerta),
    contraindicacoes: asArray<string>(row.contraindicacoes),
    documentosRelacionados: asArray<string>(row.documentos_relacionados),
    fonte: asStr(row.fonte),
    versao: Number(row.versao ?? 1),
    status: String(row.status ?? "publicado"),
  };
}

export function useSyndromes() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: syndromesQueryKey,
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabaseUntyped
        .from("base_sindromes")
        .select("*")
        .eq("status", "publicado")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const syndromes = useMemo(() => (data ?? []).map(toSyndrome), [data]);

  return { syndromes, isLoading, isError, error };
}
