import type { ClinicalEnvironment, ClinicalSeverity } from "@/modules/prescription/types/prescription";

export type LibraryKind = "protocolo" | "escore" | "trial" | "fluxograma";

export interface LibraryItem {
  id: string;
  kind: LibraryKind;
  name: string;
  /** Descrição breve, uma linha. */
  description: string;
  /** Patologias / condições associadas. */
  pathologies: string[];
  specialty: string | null;
  severity: ClinicalSeverity | null;
  environments: ClinicalEnvironment[];
  /** Referência ou guideline de origem. */
  reference: string | null;
  url?: string | null;
  /** De onde veio: base clínica do sistema ou catálogo local. */
  source: "base" | "catalogo" | "descoberta";
}

export const KIND_LABEL: Record<LibraryKind, string> = {
  protocolo: "Protocolos",
  escore: "Escores",
  trial: "Trials",
  fluxograma: "Fluxogramas",
};

export const ENVIRONMENT_LABEL: Record<ClinicalEnvironment, string> = {
  ambulatorial: "Ambulatorial",
  urgencia: "Urgências / PS",
  emergencia: "Emergências / SV",
};

export const SEVERITY_LABEL: Record<ClinicalSeverity, string> = {
  leve: "Leve",
  moderada: "Moderada",
  grave: "Grave",
  critica: "Crítica",
};

export const normalizeText = (s: string) =>
  (s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
