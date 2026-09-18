/**
 * Hook reutilizável de busca clínica unificada.
 * Re-export do `useClinicalSearch` em services/clinicalSearch para
 * manter o padrão de hooks isolados do diretório services.
 */
export { useClinicalSearch } from "../services/clinicalSearch";
export type { SearchKind, SearchResult, SearchEntry, ClinicalSearchAPI } from "../services/clinicalSearch";
