/**
 * Registry do motor de regras clínicas.
 *
 * Substitui a lista hardcoded em `clinicalSafety.ts` por um registry
 * extensível. Cada regra é uma função pura `(ctx) => ClinicalAlert | null`
 * com metadados de governança (id, categoria, descrição, enabled).
 *
 * Vantagens:
 * - Adicionar uma regra nova = 1 import + 1 registro.
 * - Desligar uma regra sem remover código (`enabled: false`).
 * - Auditável (cada regra tem id estável).
 * - Type-safe e testável isoladamente.
 */

import type { ClinicalAlert } from "./clinicalSafety";
import type { SafetyContext } from "./clinicalSafety";
import type { RuleMetadata } from "../types/clinical";

export type RuleFn = (ctx: SafetyContext) => ClinicalAlert | null;

export interface RegisteredRule extends RuleMetadata {
  evaluate: RuleFn;
}

const REGISTRY: RegisteredRule[] = [];

/** Registra uma regra no motor. Idempotente por `id`. */
export const registerRule = (rule: RegisteredRule): void => {
  const idx = REGISTRY.findIndex((r) => r.id === rule.id);
  if (idx >= 0) {
    REGISTRY[idx] = rule;
  } else {
    REGISTRY.push(rule);
  }
};

/** Remove uma regra do registry pelo id (útil em testes). */
export const unregisterRule = (id: string): void => {
  const idx = REGISTRY.findIndex((r) => r.id === id);
  if (idx >= 0) REGISTRY.splice(idx, 1);
};

/** Lista as regras ativas (para UI de governança / docs internos). */
export const listRules = (): ReadonlyArray<RegisteredRule> => REGISTRY;

/** Avalia todas as regras habilitadas, ignorando exceções individuais. */
export const evaluateAll = (ctx: SafetyContext): ClinicalAlert[] => {
  const out: ClinicalAlert[] = [];
  for (const rule of REGISTRY) {
    if (rule.enabled === false) continue;
    try {
      const alert = rule.evaluate(ctx);
      if (alert) out.push(alert);
    } catch (err) {
      // Falha de uma regra não pode derrubar o motor — apenas log local.
      console.error(`[ruleRegistry] regra "${rule.id}" falhou:`, err);
    }
  }
  return out;
};
