import type { ClinicalAlert } from "./clinicalSafety";
import type { DocumentAction } from "../components/ActionGrid";
import { reportError } from "@/lib/reportError";

/**
 * Log de segurança da sessão — persistido em localStorage.
 * Trilha mínima de rastreabilidade para auditoria e melhoria futura.
 * Não exposto na UI principal; consumível por painel interno.
 */

const STORAGE_KEY = "prescrimed:safety-log";
const MAX_ENTRIES = 500;

export type SafetyEventType =
  | "alert-shown"
  | "alert-overridden"
  | "alert-resolved"
  | "emission-blocked"
  | "emission-allowed";

export interface SafetyLogEntry {
  /** ISO timestamp. */
  ts: string;
  type: SafetyEventType;
  action: DocumentAction;
  alertId?: string;
  alertCategory?: ClinicalAlert["category"];
  severity?: ClinicalAlert["severity"];
  /** Justificativa fornecida pelo médico em overrides críticos. */
  justification?: string;
  /** Snapshot mínimo do paciente — sem PII identificável longa. */
  patientHash?: string;
}

const safeRead = (): SafetyLogEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    reportError("safetyLog.read", error);
    return [];
  }
};

const safeWrite = (entries: SafetyLogEntry[]) => {
  try {
    const trimmed = entries.slice(-MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    reportError("safetyLog.write", error, "Não foi possível salvar o registro local de segurança clínica (armazenamento cheio ou bloqueado).");
  }
};

export const safetyLog = {
  push(entry: Omit<SafetyLogEntry, "ts">) {
    const all = safeRead();
    all.push({ ...entry, ts: new Date().toISOString() });
    safeWrite(all);
  },
  read(): SafetyLogEntry[] {
    return safeRead();
  },
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      reportError("modules/prescription/services/safetyLog", error);
    }
  },
};

/** Hash não-criptográfico curto para anonimizar nome de paciente em log. */
export const hashPatient = (name: string): string => {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h << 5) - h + name.charCodeAt(i);
    h |= 0;
  }
  return (h >>> 0).toString(36);
};
