/**
 * Conferência e auditoria de escores no servidor.
 *
 * As calculadoras do front calculam localmente; quando o médico decide usar o resultado no
 * documento, a função SQL `fn_calcular_*` equivalente recalcula (com validação de população
 * e entradas) e grava a linha em `audit_escores_clinicos`. Divergência ou bloqueio impedem o uso.
 */
import { supabase } from "@/integrations/supabase/client";

type Values = Record<string, number | string>;

export interface ScoreContext {
  /** Identificador do atendimento em curso (agrupa os registros de auditoria). */
  atendimentoId: string;
  ageYears: number | null;
}

interface ServerScoreRow {
  status: string;
  total: number | null;
  categoria: string | null;
  resposta: string;
  versao: string | null;
}

type Adapter = {
  fn: string;
  args: (v: Values, c: ScoreContext) => Record<string, unknown> | null;
};

const flag = (v: Values, k: string) => Number(v[k]) > 0;
const ASCITE = ["", "ausente", "leve", "moderada_grave"];
const ENCEFALOPATIA = ["", "ausente", "grau_I_II", "grau_III_IV"];

const ADAPTERS: Record<string, Adapter> = {
  "chads-vasc": {
    fn: "fn_calcular_cha2ds2_vasc",
    args: (v, c) => {
      const sexo = String(v.sex);
      const idade = Number(v.age);
      if (!Number.isFinite(idade) || (sexo !== "M" && sexo !== "F")) return null;
      return {
        p_atendimento_id: c.atendimentoId,
        p_idade: Math.floor(idade),
        p_sexo: sexo,
        p_ic: flag(v, "icc"),
        p_has: flag(v, "hta"),
        p_dm: flag(v, "dm"),
        p_avc_previo: flag(v, "avc"),
        p_doenca_vascular: flag(v, "vasc"),
      };
    },
  },
  hasbled: {
    fn: "fn_calcular_has_bled",
    args: (v, c) => {
      if (c.ageYears === null) return null;
      return {
        p_atendimento_id: c.atendimentoId,
        p_idade: c.ageYears,
        p_has_nao_controlada: flag(v, "h"),
        p_funcao_renal_alterada: Number(v.a) >= 1,
        p_funcao_hepatica_alterada: Number(v.a) >= 2,
        p_avc_previo: flag(v, "s"),
        p_sangramento_previo: flag(v, "b"),
        p_inr_labil: flag(v, "l"),
        p_drogas_antiplaquetarias: Number(v.d) >= 1,
        p_alcool: Number(v.d) >= 2,
      };
    },
  },
  rcri: {
    fn: "fn_calcular_rcri",
    args: (v, c) => ({
      p_atendimento_id: c.atendimentoId,
      ...(c.ageYears !== null && { p_idade_anos: c.ageYears }),
      p_cirurgia_alto_risco: flag(v, "cir"),
      p_cardiopatia_isquemica: flag(v, "dac"),
      p_insuficiencia_cardiaca: flag(v, "icc"),
      p_doenca_cerebrovascular: flag(v, "avc"),
      p_diabetes_insulina: flag(v, "dm"),
      p_insuficiencia_renal: flag(v, "cr"),
    }),
  },
  "child-pugh": {
    fn: "fn_calcular_child_pugh",
    args: (v, c) => {
      if (c.ageYears === null) return null;
      return {
        p_atendimento_id: c.atendimentoId,
        p_idade: c.ageYears,
        p_bilirrubina: Number(v.bili),
        p_albumina: Number(v.alb),
        p_inr: Number(v.inr),
        p_ascite: ASCITE[Number(v.ascite)] ?? "",
        p_encefalopatia: ENCEFALOPATIA[Number(v.enc)] ?? "",
      };
    },
  },
};

export type ScoreVerification =
  | { kind: "not-applicable" }
  | { kind: "ok"; total: number; versao: string | null }
  | { kind: "rejected"; message: string }
  | { kind: "divergent"; localTotal: number; serverTotal: number; categoria: string | null };

export const hasServerScore = (calculatorId: string) => calculatorId in ADAPTERS;

/** Recalcula no servidor (o que também grava a auditoria). Lança erro se a chamada falhar. */
export async function verifyAndAuditScore(
  calculatorId: string,
  values: Values,
  ctx: ScoreContext,
  localHeadline: string,
): Promise<ScoreVerification> {
  const adapter = ADAPTERS[calculatorId];
  if (!adapter) return { kind: "not-applicable" };
  const args = adapter.args(values, ctx);
  if (!args) return { kind: "not-applicable" };

  const { data, error } = await supabase.rpc(adapter.fn as never, args as never);
  if (error) throw error;
  const row = ((data as unknown as ServerScoreRow[] | null) ?? [])[0];
  if (!row) throw new Error(`${adapter.fn} não retornou resultado`);
  if (row.status !== "CALCULATED" || row.total === null) {
    return { kind: "rejected", message: row.resposta };
  }
  const localTotal = parseInt(localHeadline, 10);
  if (Number.isFinite(localTotal) && localTotal !== row.total) {
    return { kind: "divergent", localTotal, serverTotal: row.total, categoria: row.categoria };
  }
  return { kind: "ok", total: row.total, versao: row.versao };
}
