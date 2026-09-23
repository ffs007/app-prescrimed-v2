/**
 * Execução dos escores no servidor: monta os argumentos da função `fn_calcular_*` a partir
 * do formulário e normaliza a resposta. A própria função grava a linha em
 * `audit_escores_clinicos`, então toda chamada aqui deixa rastro.
 */
import { supabase } from "@/integrations/supabase/client";
import { LIST_SIZES, paramLabel, type ScoreDefinition } from "./scoreCatalog";

export type FieldValue = string | boolean | string[];
export type FormValues = Record<string, FieldValue>;

export interface ScoreCallContext {
  atendimentoId: string;
  ageYears: string;
}

export interface BuiltArgs {
  args: Record<string, unknown>;
  missing: string[];
}

const toNumber = (raw: string) => Number(raw.trim().replace(",", "."));

export function initialValues(def: ScoreDefinition): FormValues {
  const values: FormValues = {};
  for (const p of def.params) {
    if (p.kind === "boolean") values[p.name] = p.default === true;
    else if (p.kind === "list") values[p.name] = Array<string>(LIST_SIZES[p.name] ?? 0).fill("");
    else values[p.name] = p.default === undefined ? "" : String(p.default);
  }
  return values;
}

export function buildArgs(def: ScoreDefinition, ctx: ScoreCallContext, values: FormValues): BuiltArgs {
  const args: Record<string, unknown> = { p_atendimento_id: ctx.atendimentoId };
  const missing: string[] = [];

  if (def.ageParam) {
    const age = toNumber(ctx.ageYears);
    if (ctx.ageYears.trim() === "" || !Number.isFinite(age) || age < 0) missing.push("Idade (anos)");
    else args[def.ageParam] = Math.floor(age);
  }

  for (const p of def.params) {
    const raw = values[p.name];
    if (p.kind === "boolean") {
      args[p.name] = raw === true;
      continue;
    }
    if (p.kind === "list") {
      const cells = Array.isArray(raw) ? raw : [];
      const nums = cells.map((c) => (c.trim() === "" ? NaN : toNumber(c)));
      if (nums.length === 0 || nums.some((n) => !Number.isFinite(n))) {
        if (p.required) missing.push(paramLabel(p.name));
      } else {
        args[p.name] = nums;
      }
      continue;
    }
    const text = typeof raw === "string" ? raw.trim() : "";
    if (text === "") {
      if (p.required) missing.push(paramLabel(p.name));
      continue;
    }
    if (p.kind === "number") {
      const n = toNumber(text);
      if (!Number.isFinite(n)) missing.push(paramLabel(p.name));
      else args[p.name] = n;
    } else {
      args[p.name] = text;
    }
  }
  return { args, missing };
}

const STANDARD_KEYS = new Set([
  "status", "total", "categoria", "resposta", "limitacoes", "versao", "populacao_validada", "populacao", "contexto",
]);

const EXTRA_LABELS: Record<string, string> = {
  red_flag_override: "Sinal de alarme acionado (override)",
  imagem_indicada: "Imagem indicada",
  rx_indicado: "Radiografia indicada",
  todos_negativos: "Todos os critérios negativos",
  item9_positivo: "Item 9 (ideação) positivo",
  tep_excluida: "TEP excluída",
  mortalidade_prevista: "Mortalidade prevista",
  morbidade_prevista: "Morbidade prevista",
  mortalidade_estimada: "Mortalidade estimada",
  probabilidade_sobrevivencia: "Probabilidade de sobrevivência",
  cabg_risco_mortalidade: "Risco de mortalidade (CABG)",
  pci_risco_mortalidade: "Risco de mortalidade (ICP)",
  diferenca: "Diferença",
  grau: "Grau",
  criterios: "Critérios positivos",
  limiar_dimero: "Limiar de D-dímero (ng/mL)",
};

export type OutcomeTone = "ok" | "warning" | "blocked";

export interface ScoreOutcome {
  status: string;
  tone: OutcomeTone;
  total: number | null;
  categoria: string | null;
  resposta: string;
  limitacoes: string | null;
  versao: string | null;
  populacaoValidada: boolean | null;
  extras: { label: string; value: string }[];
}

const formatExtra = (v: unknown): string => {
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  return String(v);
};

function toneOf(status: string): OutcomeTone {
  const s = status.toUpperCase();
  if (s.startsWith("CALC")) return "ok";
  if (s === "BLOCKED") return "blocked";
  return "warning";
}

export function normalizeOutcome(row: Record<string, unknown>): ScoreOutcome {
  const status = String(row.status ?? "DESCONHECIDO");
  const extras = Object.entries(row)
    .filter(([k, v]) => !STANDARD_KEYS.has(k) && v !== null && v !== undefined)
    .map(([k, v]) => ({ label: EXTRA_LABELS[k] ?? k.replace(/_/g, " "), value: formatExtra(v) }));
  return {
    status,
    tone: toneOf(status),
    total: typeof row.total === "number" ? row.total : null,
    categoria: (row.categoria as string | null | undefined) ?? null,
    resposta: String(row.resposta ?? ""),
    limitacoes: (row.limitacoes as string | null | undefined) ?? null,
    versao: (row.versao as string | null | undefined) ?? null,
    populacaoValidada: typeof row.populacao_validada === "boolean" ? row.populacao_validada : null,
    extras,
  };
}

/** Chama a função SQL; lança erro se a chamada ou o retorno falharem. */
export async function runServerScore(def: ScoreDefinition, args: Record<string, unknown>): Promise<ScoreOutcome> {
  const { data, error } = await supabase.rpc(def.fn as never, args as never);
  if (error) throw error;
  const row = ((data as unknown as Record<string, unknown>[] | null) ?? [])[0];
  if (!row) throw new Error(`${def.fn} não retornou resultado`);
  return normalizeOutcome(row);
}

export function outcomeToText(def: ScoreDefinition, o: ScoreOutcome): string {
  const head = [o.total !== null ? `${o.total} pontos` : null, o.categoria?.replace(/_/g, " ")]
    .filter(Boolean)
    .join(" — ");
  const extras = o.extras.map((e) => `${e.label}: ${e.value}`).join("; ");
  return [`${def.title}: ${head || o.status}`, o.resposta, extras].filter(Boolean).join(". ");
}
