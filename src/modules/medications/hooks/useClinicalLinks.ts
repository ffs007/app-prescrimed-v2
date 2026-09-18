/** Etapa 4 — hooks da administração de vínculos clínicos. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applyLinkAction,
  getLinkSummary,
  getLinksByCondition,
  getLinksByMedication,
  getReadyConditions,
  getUnlinkedMedications,
  upsertLink,
  type LinkAction,
  type UpsertLinkInput,
} from "../services/clinicalLinks";

export function useLinkSummary() {
  return useQuery({ queryKey: ["vinculos", "resumo"], queryFn: getLinkSummary, staleTime: 30_000 });
}

export function useUnlinkedMedications() {
  return useQuery({ queryKey: ["vinculos", "sem-vinculo"], queryFn: getUnlinkedMedications, staleTime: 60_000 });
}

export function useReadyConditions() {
  return useQuery({ queryKey: ["vinculos", "quadros-prontos"], queryFn: getReadyConditions, staleTime: 60_000 });
}

export function useLinksByCondition(type: "patologia" | "sindrome", condition: string) {
  const c = condition.trim();
  return useQuery({
    queryKey: ["vinculos", "condicao", type, c.toLowerCase()],
    queryFn: () => getLinksByCondition(type, c),
    enabled: c.length > 1,
    staleTime: 15_000,
  });
}

export function useLinksByMedication(medicationId: string | null) {
  const id = medicationId ?? "";
  return useQuery({
    queryKey: ["vinculos", "medicamento", id],
    queryFn: () => getLinksByMedication(id),
    enabled: id.length > 0,
    staleTime: 15_000,
  });
}

export function useLinkMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["vinculos"] });
    qc.invalidateQueries({ queryKey: ["clinical-suggestions"] });
  };

  const save = useMutation({ mutationFn: (input: UpsertLinkInput) => upsertLink(input), onSuccess: invalidate });
  const act = useMutation({
    mutationFn: (input: { id: string; action: LinkAction; note?: string | null }) =>
      applyLinkAction(input.id, input.action, input.note),
    onSuccess: invalidate,
  });

  return { save, act };
}
