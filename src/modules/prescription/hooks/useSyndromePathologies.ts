/**
 * useSyndromePathologies — ligação entre a queixa/síndrome de entrada e as
 * doenças específicas (`sindrome_patologia`).
 *
 * Retorna um mapa `codigo da síndrome -> nomes normalizados das condições`.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabaseUntyped } from "@/integrations/supabase/untyped";

export const syndromePathologiesQueryKey = ["syndromes", "patologias"] as const;

type Row = { sindrome_codigo: string; nome_normalizado: string; prioridade: number | null };

export function useSyndromePathologies() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: syndromePathologiesQueryKey,
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabaseUntyped
        .from("sindrome_patologia")
        .select("sindrome_codigo, nome_normalizado, prioridade");
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const bySyndrome = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const row of data ?? []) {
      const set = map.get(row.sindrome_codigo) ?? new Set<string>();
      set.add(row.nome_normalizado);
      map.set(row.sindrome_codigo, set);
    }
    return map;
  }, [data]);

  return { bySyndrome, isLoading, isError, refetch };
}
