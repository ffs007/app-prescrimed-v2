import { useCallback, useEffect, useState } from "react";
import type { SelectedMed, ClinicInfo, SignatureConfig } from "../types/prescription";
import type { DocumentAction } from "../components/ActionGrid";
import type { CareContext } from "../components/ContextHeader";
import type { AtestadoData } from "../components/AtestadoForm";
import type { ExamesData } from "../components/ExamesForm";
import type { EncaminhamentoData } from "../components/EncaminhamentoForm";
import type { DeclaracaoData } from "../components/DeclaracaoForm";
import type { RelatorioData } from "../components/RelatorioForm";
import type { OrientacoesData } from "../components/OrientacoesForm";
import type { ProcedimentoData } from "../components/ProcedimentoForm";
import type { StructuredData } from "../services/regulatoryForms";

const STORAGE_KEY = "prescrimed-emission-history";
const MAX_ENTRIES = 100;

/**
 * Snapshot completo de uma emissão — permite reabrir, reimprimir e baixar
 * o documento exatamente como foi emitido, sem depender do estado atual.
 */
export interface EmissionRecord {
  id: string;
  emittedAt: string; // ISO
  action: DocumentAction;
  documentTitle: string;
  patientName: string;
  isPediatric: boolean;
  isPregnant: boolean;
  ageValue: string;
  ageUnit: string;
  weight: string;
  context: CareContext;
  /** Rótulo regulatório, se aplicável (ex: "Controle Especial"). */
  regulatoryLabel?: string;
  /** IDs filtrados para reimpressão regulatória. */
  selectedFilter?: number[];
  /** Snapshots dos forms — apenas o relevante para `action` é preenchido. */
  selected: SelectedMed[];
  atestado: AtestadoData;
  exames: ExamesData;
  encaminhamento: EncaminhamentoData;
  declaracao: DeclaracaoData;
  relatorio: RelatorioData;
  orientacoes: OrientacoesData;
  procedimento: ProcedimentoData;
  /** Documentos regulatórios (AIH, APAC, notificação compulsória). */
  aih?: StructuredData;
  apac?: StructuredData;
  notificacao?: StructuredData;
  clinicInfo: ClinicInfo;
  signatureConfig: SignatureConfig;
}

export type NewEmissionRecord = Omit<EmissionRecord, "id" | "emittedAt">;

const safeParse = (raw: string | null): EmissionRecord[] => {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

/**
 * Histórico de emissões persistido em localStorage.
 * Mais recente primeiro. Limitado a MAX_ENTRIES para evitar inflar storage.
 */
export const useEmissionHistory = () => {
  const [history, setHistory] = useState<EmissionRecord[]>(() =>
    typeof window === "undefined" ? [] : safeParse(window.localStorage.getItem(STORAGE_KEY)),
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      /* quota — ignora */
    }
  }, [history]);

  const add = useCallback((record: NewEmissionRecord) => {
    const entry: EmissionRecord = {
      ...record,
      id: `em_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      emittedAt: new Date().toISOString(),
    };
    setHistory((prev) => [entry, ...prev].slice(0, MAX_ENTRIES));
    return entry;
  }, []);

  const remove = useCallback((id: string) => {
    setHistory((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clear = useCallback(() => setHistory([]), []);

  return { history, add, remove, clear };
};
