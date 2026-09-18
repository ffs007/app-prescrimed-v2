/**
 * Fase 1 — `useMedications`: fonte única de medicamentos para a prescrição.
 *
 * Consome `base_medicamentos_geral` via React Query e converte para o tipo
 * `Medication` usado pela UI. Enquanto a migração de dados não estiver 100%
 * concluída, faz merge com o banco legado (`src/data/medications.ts`), que
 * ainda fornece os IDs numéricos referenciados pelas patologias.
 *
 * Na Fase 2, quando as patologias apontarem para UUIDs, basta remover o merge
 * legado — a assinatura deste hook não muda.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_MEDICATIONS } from "@/data/medications";
import type { Medication, PrescriptionType } from "@/types/prescription";
import { normalizeName } from "@/scripts/syncMedicationsToBase";

export const medicationsQueryKey = ["medications", "base_geral"] as const;

// TODO: Refactor to strict type — substituir por tipo gerado da tabela.
type BaseRow = Record<string, any>;

/** ID numérico estável (>= 500000) derivado do UUID, sem colidir com o legado. */
export function stableNumericId(uuid: string): number {
  let h = 0;
  for (let i = 0; i < uuid.length; i++) h = (h * 31 + uuid.charCodeAt(i)) | 0;
  return 500000 + (Math.abs(h) % 400000);
}

function mapPrescriptionType(tipo: string | null): PrescriptionType | undefined {
  switch (tipo) {
    case "especial_b":
      return "azul";
    case "especial_a":
      return "amarela";
    case "antimicrobiano":
      return "branca2vias";
    case "comum":
      return "comum";
    default:
      return undefined;
  }
}

export function rowToMedication(row: BaseRow): Medication {
  const name = [row.principio_ativo, row.concentracao].filter(Boolean).join(" ").trim();
  const dose = row.dose_adulto ?? row.dose_adulto_padrao;
  const pediatric = row.dose_pediatrica ?? row.dose_pediatrica_padrao;
  const frequencia = row.frequencia ?? row.frequencia_padrao;
  const duracao = row.duracao ?? row.duracao_padrao;
  return {
    id: stableNumericId(row.id),
    name,
    // Nunca inventar dose: sem cadastro, o texto é explícito.
    dosage: dose || frequencia || "Dose não cadastrada — preencher manualmente",
    instructions: [row.apresentacao, frequencia, duracao].filter(Boolean).join(" — "),
    category: row.classe_terapeutica || row.categoria_clinica || "Base Geral",
    subCategory: row.subclasse_terapeutica ?? undefined,
    pediatricDose: pediatric ?? undefined,
    prescriptionType: mapPrescriptionType(row.tipo_receita ?? null),
    safeForPregnant: row.alerta_gestacao === "seguro" ? true : row.alerta_gestacao === "sem_dados" ? undefined : false,
  };
}

export function useMedicationsQuery() {
  return useQuery({
    queryKey: medicationsQueryKey,
    queryFn: async (): Promise<BaseRow[]> => {
      // Fonte única: visão consolidada (cadastro + apresentações + doses).
      const { data, error } = await supabase
        .from("vw_medicamento_completo" as any)
        .select(
          "id, principio_ativo, concentracao, apresentacao, via_administracao, classe_terapeutica, categoria_clinica, subclasse_terapeutica, dose_adulto, dose_pediatrica, frequencia, duracao, tipo_receita, alerta_gestacao"
        )
        .eq("ativo", true)
        .neq("status_revisao", "inativo")
        .order("principio_ativo", { ascending: true });
      if (error) throw error;
      return ((data as any) ?? []) as BaseRow[];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Lista final de medicamentos. Em caso de erro de rede, cai para o banco legado
 * (a prescrição nunca fica sem catálogo).
 */
export function useMedications(extra: Medication[] = []) {
  const { data: rows, isLoading, isError, refetch } = useMedicationsQuery();

  const medications = useMemo<Medication[]>(() => {
    const merged: Medication[] = DEFAULT_MEDICATIONS.map((m) => ({ ...m }));
    const byName = new Map(merged.map((m) => [normalizeName(m.name), m] as const));

    for (const row of rows ?? []) {
      const mapped = rowToMedication(row);
      const existing =
        byName.get(normalizeName(mapped.name)) ?? byName.get(normalizeName(row.principio_ativo ?? ""));

      if (existing) {
        // Backend enriquece o legado sem trocar o ID usado pelas patologias.
        existing.pediatricDose = mapped.pediatricDose ?? existing.pediatricDose;
        existing.prescriptionType = mapped.prescriptionType ?? existing.prescriptionType;
        const doseBanco = row.dose_adulto ?? row.dose_adulto_padrao;
        if (doseBanco) existing.dosage = doseBanco;
        if (mapped.safeForPregnant !== undefined) existing.safeForPregnant = mapped.safeForPregnant;
      } else {
        merged.push(mapped);
        byName.set(normalizeName(mapped.name), mapped);
      }
    }

    return [...merged, ...extra];
  }, [rows, extra]);

  return { medications, remoteCount: rows?.length ?? 0, isLoading, isError, refetch };
}
