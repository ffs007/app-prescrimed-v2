/**
 * useCustomPathologies — patologias personalizadas do próprio médico.
 *
 * Persistidas em `patologias_usuario` (RLS por user_id), com CRUD via React
 * Query. Entram no catálogo do Bloco C junto com as patologias do banco
 * clínico, marcadas como `isCustom`.
 */
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  ClinicalEnvironment,
  ClinicalSeverity,
  Pathology,
} from "../types/prescription";

export const customPathologiesQueryKey = ["patologias-usuario"] as const;

export interface CustomPathologyMed {
  nome: string;
  posologia: string;
}

export interface CustomPathologyRow {
  id: string;
  nome: string;
  cid10: string | null;
  categoria: string | null;
  ambientes: string[] | null;
  gravidade: string | null;
  sinonimos: string[] | null;
  medicamentos: CustomPathologyMed[] | null;
  observacoes: string | null;
  ativo: boolean;
}

export interface CustomPathologyInput {
  nome: string;
  cid10?: string;
  categoria?: string;
  ambientes: ClinicalEnvironment[];
  gravidade?: ClinicalSeverity | "";
  sinonimos: string[];
  medicamentos: CustomPathologyMed[];
  observacoes?: string;
}

const isEnv = (v: string): v is ClinicalEnvironment =>
  v === "ambulatorial" || v === "urgencia" || v === "emergencia";

/** ID numérico estável (>= 960000) para conviver com o catálogo do banco. */
export function customStableId(uuid: string): number {
  let h = 0;
  for (let i = 0; i < uuid.length; i++) h = (h * 31 + uuid.charCodeAt(i)) | 0;
  return 960000 + (Math.abs(h) % 30000);
}

export function rowToPathology(row: CustomPathologyRow): Pathology {
  const meds = (row.medicamentos ?? []).filter((m) => m && m.nome);
  return {
    id: customStableId(row.id),
    name: row.nome,
    meds: [],
    hospitalMeds: meds.map((m) =>
      [m.nome, m.posologia].filter(Boolean).join(" — "),
    ),
    cid: row.cid10 ?? undefined,
    category: row.categoria ?? undefined,
    synonyms: row.sinonimos ?? [],
    environments: (row.ambientes ?? []).filter(isEnv),
    severity: (row.gravidade as ClinicalSeverity | null) ?? undefined,
    isEmergency: (row.ambientes ?? []).includes("emergencia"),
    isCustom: true,
  };
}

const toPayload = (input: CustomPathologyInput) => ({
  nome: input.nome.trim(),
  cid10: input.cid10?.trim() || null,
  categoria: input.categoria?.trim() || null,
  ambientes: input.ambientes,
  gravidade: input.gravidade || null,
  sinonimos: input.sinonimos.map((s) => s.trim()).filter(Boolean),
  medicamentos: input.medicamentos
    .filter((m) => m.nome.trim())
    .map((m) => ({ nome: m.nome.trim(), posologia: m.posologia.trim() })),
  observacoes: input.observacoes?.trim() || null,
});

export function useCustomPathologiesQuery() {
  return useQuery({
    queryKey: customPathologiesQueryKey,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<CustomPathologyRow[]> => {
      const { data, error } = await supabase
        .from("patologias_usuario")
        .select(
          "id, nome, cid10, categoria, ambientes, gravidade, sinonimos, medicamentos, observacoes, ativo",
        )
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as unknown as CustomPathologyRow[];
    },
  });
}

/** Lista pronta para o catálogo do Bloco C. */
export function useCustomPathologies(): {
  pathologies: Pathology[];
  isLoading: boolean;
} {
  const { data, isLoading } = useCustomPathologiesQuery();
  const pathologies = useMemo(
    () => (data ?? []).map(rowToPathology),
    [data],
  );
  return { pathologies, isLoading };
}

export function useCustomPathologyMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: customPathologiesQueryKey });
  };

  const create = useMutation({
    mutationFn: async (input: CustomPathologyInput) => {
      const { error } = await supabase
        .from("patologias_usuario")
        .insert(toPayload(input));
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CustomPathologyInput }) => {
      const { error } = await supabase
        .from("patologias_usuario")
        .update(toPayload(input))
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("patologias_usuario")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
