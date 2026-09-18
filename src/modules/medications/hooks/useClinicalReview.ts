/** Etapa 3 — hooks da fila de revisão clínica (área administrativa). */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applyReviewAction,
  correctDose,
  getReviewQueue,
  getReviewSummary,
  type DosePatch,
  type ReviewAction,
  type ReviewFilter,
  type ReviewQueueItem,
} from "../services/clinicalReview";

export function useReviewSummary() {
  return useQuery({
    queryKey: ["revisao-clinica", "resumo"],
    queryFn: getReviewSummary,
    staleTime: 30 * 1000,
  });
}

export function useReviewQueue(filter: ReviewFilter) {
  return useQuery({
    queryKey: ["revisao-clinica", "fila", filter],
    queryFn: () => getReviewQueue(filter),
    staleTime: 15 * 1000,
  });
}

export function useReviewActions() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["revisao-clinica"] });
    qc.invalidateQueries({ queryKey: ["auditoria-qualidade-farmacologica"] });
    qc.invalidateQueries({ queryKey: ["med-presentations"] });
  };

  const act = useMutation({
    mutationFn: (input: { item: ReviewQueueItem; action: ReviewAction; observacao?: string | null }) =>
      applyReviewAction(input),
    onSuccess: invalidate,
  });

  const correct = useMutation({
    mutationFn: (input: { doseId: string; patch: DosePatch }) => correctDose(input.doseId, input.patch),
    onSuccess: invalidate,
  });

  return { act, correct };
}
