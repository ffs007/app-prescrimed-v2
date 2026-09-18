// Etapa 18 — Engine que reavalia segurança ao reaproveitar itens.
// Usa SEMPRE os dados ATUAIS do paciente, não os da prescrição antiga.
import type {
  ReuseItem,
  ItemReuseStatus,
  PatientSnapshot,
  ComparisonDiff,
} from "./types";
import { hasCriticalChanges } from "./historyCompare";

export interface ReuseSafetyContext {
  pacienteAtual: PatientSnapshot;
  pacienteAnterior: PatientSnapshot;
  diffs: ComparisonDiff[];
  /** Settings administrativos */
  bloquearAlertaCritico: boolean;
  exigirJustDadosMudaram: boolean;
}

export interface ReuseEvaluationResult {
  status: ItemReuseStatus;
  alertas: string[];
}

/**
 * Avalia um item da prescrição anterior à luz dos dados atuais.
 * Versão inicial — integra com módulos de segurança via callbacks externos
 * quando o componente os instanciar (mantém este lib puro/testável).
 */
export function evaluateReuseItem(
  item: ReuseItem,
  ctx: ReuseSafetyContext,
): ReuseEvaluationResult {
  const alertas: string[] = [];
  let status: ItemReuseStatus = "seguro_para_revisao";

  // Dados insuficientes
  if (item.kind === "medicamento") {
    const precisaPeso =
      ctx.pacienteAtual.idade_anos !== undefined &&
      ctx.pacienteAtual.idade_anos < 18;
    if (precisaPeso && !ctx.pacienteAtual.peso_kg) {
      alertas.push("Dados atuais insuficientes para repetir com segurança.");
      status = "dados_insuficientes";
    }
  }

  // Diffs críticos
  if (hasCriticalChanges(ctx.diffs)) {
    alertas.push(
      "Dados do paciente mudaram desde a prescrição anterior. Revise antes de repetir.",
    );
    if (ctx.exigirJustDadosMudaram && status === "seguro_para_revisao") {
      status = "exige_justificativa";
    }
  }

  // Alertas vindos do snapshot original (continuam relevantes)
  if (item.alertas_atuais.length > 0) {
    const algumCritico = item.alertas_atuais.some((a) =>
      /bloqueio|contraindicad|crítico/i.test(a),
    );
    if (algumCritico && ctx.bloquearAlertaCritico) {
      status = "bloqueado";
      alertas.push("Item bloqueado por alerta crítico atual.");
    } else if (status === "seguro_para_revisao") {
      status = "requer_atencao";
    }
  }

  return { status, alertas };
}

/** Lote — re-roda evaluate em todos os itens. */
export function evaluateReuseItems(
  items: ReuseItem[],
  ctx: ReuseSafetyContext,
): ReuseItem[] {
  return items.map((it) => {
    const r = evaluateReuseItem(it, ctx);
    return {
      ...it,
      status: r.status,
      alertas_atuais: [...new Set([...it.alertas_atuais, ...r.alertas])],
      // bloqueia automaticamente
      selecionado: r.status === "bloqueado" ? false : it.selecionado,
    };
  });
}
