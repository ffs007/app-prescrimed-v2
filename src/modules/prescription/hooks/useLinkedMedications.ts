/**
 * Hooks React Query sobre o motor único (`services/clinicalSuggestions`).
 *
 * Este arquivo NÃO faz consultas próprias: toda a leitura de medicamentos passa
 * pelo serviço, garantindo o mesmo resultado em qualquer tela.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getFavoriteMedications,
  getRecentMedications,
  type QuickMedication,
} from "../services/quickAccess";
import {
  getClinicalSuggestions,
  getMedicationBaseCount,
  getMedicationPresentations,
  logSuggestionGap,
  searchMedications,
  traceSuggestions,
  type PatientContext,
  type SuggestionsResult,
} from "../services/clinicalSuggestions";
import type { ClinicalEnvironment } from "../types/prescription";

export {
  LINK_LINE_LABELS,
  LINK_LINE_ORDER,
  GROUP_LABELS,
  ROLE_LABELS,
  rankSuggestions,
  suggestionToMedication,
  recordToMedication,
  pickAutoPresentation,
  pickPosology,
  type ClinicalSuggestion,
  type LinkLine,
  type SuggestionRole,
  type SuggestionGroup,
  type MedicationRecord,
  type MedicationPresentation,
  type PosologyOption,
} from "../services/clinicalSuggestions";

const EMPTY: SuggestionsResult = {
  suggestions: [],
  byGroup: { 1: [], 2: [], 3: [], 4: [] },
  diagnostics: { returnedByService: 0, displayed: 0, droppedNoDose: 0, origin: "nenhuma" },
};

/** Sugestões revisadas para condição/síndrome no ambiente selecionado. */
export function useClinicalSuggestions(params: {
  condition?: string | null;
  syndrome?: string | null;
  environment?: ClinicalEnvironment;
  patient?: PatientContext;
}) {
  const condition = (params.condition ?? "").trim();
  const syndrome = (params.syndrome ?? "").trim();
  const patient = params.patient ?? {};

  return useQuery({
    queryKey: [
      "clinical-suggestions",
      condition.toLowerCase(),
      syndrome.toLowerCase(),
      params.environment ?? null,
      patient.isPediatric ?? false,
      patient.isPregnant ?? false,
      patient.hasRenalImpairment ?? false,
      patient.hasHepaticImpairment ?? false,
    ],
    enabled: condition.length > 1 || syndrome.length > 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const result = await getClinicalSuggestions({
        condition,
        syndrome,
        environment: params.environment ?? null,
        patient,
      });
      traceSuggestions(condition || syndrome, result);
      if (result.suggestions.length === 0) {
        void logSuggestionGap({
          tipo: "sem_sugestao",
          condicao: condition || null,
          sindrome: syndrome || null,
          ambiente: params.environment ?? null,
        });
      }
      return result;
    },
  });
}

/** Busca manual normalizada em toda a base ativa. */
export function useMedicationSearch(term: string) {
  const q = term.trim();
  return useQuery({
    queryKey: ["med-search", q.toLowerCase()],
    enabled: q.length >= 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const rows = await searchMedications(q);
      if (rows.length === 0) void logSuggestionGap({ tipo: "busca_sem_resultado", termo: q });
      return rows;
    },
  });
}

/** Apresentações + posologias compatíveis de um medicamento (Etapa 2). */
export function useMedicationPresentations(medicationId?: string | null) {
  const id = (medicationId ?? "").trim();
  return useQuery({
    queryKey: ["med-presentations", id],
    enabled: id.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: () => getMedicationPresentations(id),
  });
}

/** Total de medicamentos ativos (cabeçalho da aba de busca). */
export function useMedicationBaseCount() {
  return useQuery({
    queryKey: ["med-base-count"],
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    queryFn: getMedicationBaseCount,
  });
}

/** Favoritos do próprio médico (Etapa 4 — atalhos, nunca sugestão clínica). */
export function useFavoriteMedications() {
  return useQuery({
    queryKey: ["med-favoritos"],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: getFavoriteMedications,
  });
}

/** Medicamentos usados recentemente por este médico (armazenamento local). */
export function useRecentMedications() {
  const [recents, setRecents] = useState<QuickMedication[]>(() => getRecentMedications());
  return { recents, remember: setRecents };
}

export { EMPTY as EMPTY_SUGGESTIONS };
export type { PatientContext, SuggestionsResult };
