import { useCallback, useState } from "react";

/**
 * Override clínico em memória da sessão de atendimento.
 *
 * Comportamento:
 * - "ack" — médico confirmou alerta de Atenção (warning) com checkbox.
 * - "justified" — médico confirmou alerta Crítico (critical) com justificativa textual.
 *
 * O estado é resetado pelo Dashboard quando o paciente/atendimento muda.
 */
export interface OverrideRecord {
  ackKind: "ack" | "justified";
  justification?: string;
  at: string; // ISO
}

export const useSafetyOverride = () => {
  const [overrides, setOverrides] = useState<Record<string, OverrideRecord>>({});

  const acknowledge = useCallback((alertId: string) => {
    setOverrides((prev) => ({
      ...prev,
      [alertId]: { ackKind: "ack", at: new Date().toISOString() },
    }));
  }, []);

  const justify = useCallback((alertId: string, justification: string) => {
    setOverrides((prev) => ({
      ...prev,
      [alertId]: {
        ackKind: "justified",
        justification: justification.trim(),
        at: new Date().toISOString(),
      },
    }));
  }, []);

  const revoke = useCallback((alertId: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[alertId];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setOverrides({}), []);

  const acknowledgedIds = new Set(Object.keys(overrides));

  return {
    overrides,
    acknowledgedIds,
    acknowledge,
    justify,
    revoke,
    clearAll,
  };
};
