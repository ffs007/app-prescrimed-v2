import type { IVMedication } from "./IVDilutionAdminPage";

export type Severity = "info" | "warning" | "blocker";

export type IVAlertType =
  | "solucao_incompativel"
  | "concentracao_acima_max"
  | "tempo_infusao_baixo"
  | "velocidade_infusao_alta"
  | "exige_fotoprotecao"
  | "exige_equipo_fotossensivel"
  | "exige_filtro"
  | "risco_flebite"
  | "incompatibilidades_cadastradas"
  | "dados_incompletos"
  | "informativo";

export interface IVAlert {
  type: IVAlertType;
  severity: Severity;
  message: string;
  prescribedValue?: string;
  recommendedValue?: string;
  /** Bloqueio absoluto: precisa corrigir, não aceita justificativa. */
  hardBlock?: boolean;
  /** Alerta crítico que aceita justificativa para prosseguir. */
  requiresJustification?: boolean;
}

export interface IVPrescriptionInput {
  /** Texto livre do diluente / solução escolhida pelo médico (ex: "SF 0,9%", "Ringer Lactato"). */
  selectedSolution?: string | null;
  /** Dose total prescrita em mg (ou unidade compatível com a concentração máxima). */
  doseValueMg?: number | null;
  /** Volume total de diluição em mL. */
  diluentVolumeMl?: number | null;
  /** Tempo de infusão informado em minutos. */
  infusionTimeMin?: number | null;
  /** Velocidade de infusão informada (texto livre). */
  infusionRate?: string | null;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const ESSENTIAL_FIELDS: Array<keyof IVMedication> = [
  "solucoes_compativeis",
  "concentracao_maxima",
  "tempo_minimo_infusao",
  "incompatibilidades",
  "fonte_referencia",
];

const isEmptyField = (v: unknown) => {
  if (v == null) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    return !t || t === "não informado" || t === "nao informado";
  }
  return false;
};

/** Extrai número (concentração ou velocidade) de strings tipo "5 mg/mL", "10 mg/min". */
export const parseFirstNumber = (s?: string | null): number | null => {
  if (!s) return null;
  const m = s.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
};

/** Extrai minutos de strings tipo "30 minutos", "1 hora", "1 h", "30 min". */
export const parseDurationMinutes = (s?: string | null): number | null => {
  if (!s) return null;
  const lower = s.toLowerCase();
  const num = parseFirstNumber(lower);
  if (num == null) return null;
  if (/h(ora)?/.test(lower)) return num * 60;
  return num;
};

/** Detecta se o texto da solução escolhida bate com algum item de incompatibilidades. */
const matchesIncompatibility = (solution: string, incompatibilities: string[]): string | null => {
  const sol = norm(solution);
  for (const inc of incompatibilities) {
    const incNorm = norm(inc);
    // tokens significativos
    const tokens = incNorm
      .split(/[(),;/]| ou | e |\s+/g)
      .map((t) => t.trim())
      .filter((t) => t.length >= 3);
    if (tokens.some((t) => sol.includes(t))) return inc;
  }
  return null;
};

/** Casos de bloqueio absoluto definidos por princípio ativo + padrão de solução. */
const HARD_BLOCKS: Array<{
  match: (m: IVMedication, sol: string) => boolean;
  message: string;
}> = [
  {
    match: (m, sol) =>
      norm(m.principio_ativo).includes("ceftriaxona") &&
      /(calcio|cálcio|ringer)/i.test(sol),
    message:
      "Ceftriaxona não deve ser administrada com soluções contendo cálcio devido ao risco de precipitação.",
  },
  {
    match: (m, sol) =>
      norm(m.principio_ativo).includes("anfotericina b convencional") &&
      /(cloreto de sodio|cloreto de sódio|sf\b|nacl|salina)/i.test(sol),
    message:
      "Anfotericina B convencional não deve ser diluída em soluções contendo cloreto de sódio devido ao risco de precipitação.",
  },
];

export interface AnalyzeResult {
  alerts: IVAlert[];
  hasHardBlock: boolean;
  hasJustifiable: boolean;
}

export function analyzeIVPrescription(
  med: IVMedication,
  input: IVPrescriptionInput,
): AnalyzeResult {
  const alerts: IVAlert[] = [];

  // 1. Solução incompatível
  if (input.selectedSolution) {
    // Hard block primeiro
    for (const rule of HARD_BLOCKS) {
      if (rule.match(med, input.selectedSolution)) {
        alerts.push({
          type: "solucao_incompativel",
          severity: "blocker",
          hardBlock: true,
          message: rule.message,
          prescribedValue: input.selectedSolution,
          recommendedValue: med.solucoes_compativeis.join(", ") || undefined,
        });
        break;
      }
    }

    if (!alerts.some((a) => a.type === "solucao_incompativel")) {
      const incMatch = matchesIncompatibility(input.selectedSolution, med.incompatibilidades);
      if (incMatch) {
        alerts.push({
          type: "solucao_incompativel",
          severity: "blocker",
          requiresJustification: true,
          message: "Solução incompatível com este medicamento. Revise o diluente antes de concluir a prescrição.",
          prescribedValue: input.selectedSolution,
          recommendedValue: med.solucoes_compativeis.join(", ") || undefined,
        });
      } else if (med.solucoes_compativeis.length > 0) {
        const sol = norm(input.selectedSolution);
        const compatible = med.solucoes_compativeis.some((c) => {
          const cn = norm(c);
          const tokens = cn.split(/\s+/).filter((t) => t.length >= 2);
          return tokens.some((t) => sol.includes(t));
        });
        if (!compatible) {
          alerts.push({
            type: "solucao_incompativel",
            severity: "warning",
            message: "Solução escolhida não consta entre as compatíveis cadastradas.",
            prescribedValue: input.selectedSolution,
            recommendedValue: med.solucoes_compativeis.join(", "),
          });
        }
      }
    }
  }

  // 2. Concentração acima da máxima
  const maxConc = parseFirstNumber(med.concentracao_maxima);
  if (
    maxConc != null &&
    input.doseValueMg != null &&
    input.diluentVolumeMl != null &&
    input.diluentVolumeMl > 0
  ) {
    const calc = input.doseValueMg / input.diluentVolumeMl;
    if (calc > maxConc) {
      const ratio = calc / maxConc;
      const isHigh = med.nivel_alerta === "alto";
      const hardBlock = isHigh && ratio > 2;
      alerts.push({
        type: "concentracao_acima_max",
        severity: "blocker",
        hardBlock,
        requiresJustification: !hardBlock && isHigh,
        message: hardBlock
          ? "Concentração calculada muito acima da máxima recomendada. Corrija a dose ou o volume de diluição."
          : "Concentração acima da máxima recomendada para administração IV. Aumente o volume de diluição ou revise a dose.",
        prescribedValue: `${calc.toFixed(2)} mg/mL`,
        recommendedValue: med.concentracao_maxima ?? undefined,
      });
    }
  }

  // 3. Tempo de infusão menor que o recomendado
  const minTime = parseDurationMinutes(med.tempo_minimo_infusao);
  if (minTime != null && input.infusionTimeMin != null && input.infusionTimeMin < minTime) {
    const isHigh = med.nivel_alerta === "alto";
    alerts.push({
      type: "tempo_infusao_baixo",
      severity: isHigh ? "blocker" : "warning",
      requiresJustification: isHigh,
      message: "Tempo de infusão menor que o recomendado.",
      prescribedValue: `${input.infusionTimeMin} min`,
      recommendedValue: med.tempo_minimo_infusao ?? undefined,
    });
  }

  // 4. Velocidade de infusão acima da máxima
  const maxRate = parseFirstNumber(med.velocidade_maxima_infusao);
  const rateInformed = parseFirstNumber(input.infusionRate);
  if (maxRate != null && rateInformed != null && rateInformed > maxRate) {
    const isHigh = med.nivel_alerta === "alto";
    alerts.push({
      type: "velocidade_infusao_alta",
      severity: "blocker",
      requiresJustification: isHigh,
      message: "Velocidade de infusão acima da máxima recomendada.",
      prescribedValue: input.infusionRate ?? undefined,
      recommendedValue: med.velocidade_maxima_infusao ?? undefined,
    });
  }

  // 5–8. Características do medicamento
  if (med.exige_fotoprotecao) {
    alerts.push({
      type: "exige_fotoprotecao",
      severity: "warning",
      message: "Este medicamento exige proteção da luz durante preparo/administração.",
    });
  }
  if (med.exige_equipo_fotossensivel) {
    alerts.push({
      type: "exige_equipo_fotossensivel",
      severity: "warning",
      message: "Este medicamento exige equipo fotossensível conforme orientação cadastrada.",
    });
  }
  if (med.exige_filtro) {
    const isHigh = med.nivel_alerta === "alto";
    alerts.push({
      type: "exige_filtro",
      severity: isHigh ? "blocker" : "warning",
      requiresJustification: isHigh,
      message: isHigh
        ? "Este medicamento exige filtro durante administração. Confirme que a necessidade de filtro foi revisada."
        : "Este medicamento exige filtro durante administração.",
    });
  }
  if (med.risco_flebite) {
    alerts.push({
      type: "risco_flebite",
      severity: "warning",
      message: "Medicamento com risco de flebite. Avaliar acesso, diluição e velocidade de infusão.",
    });
  }

  // 9. Incompatibilidades cadastradas (mesmo sem solução escolhida)
  if (
    med.incompatibilidades.length > 0 &&
    !alerts.some((a) => a.type === "solucao_incompativel")
  ) {
    alerts.push({
      type: "incompatibilidades_cadastradas",
      severity: "info",
      message: "Incompatibilidades relevantes cadastradas. Ver detalhes antes de administrar.",
    });
  }

  // 10. Dados incompletos
  const missing = ESSENTIAL_FIELDS.filter((f) => isEmptyField(med[f]));
  if (missing.length > 0) {
    alerts.push({
      type: "dados_incompletos",
      severity: "info",
      message: "Dados de diluição IV incompletos para este medicamento. Validar conforme protocolo institucional.",
    });
  }

  return {
    alerts,
    hasHardBlock: alerts.some((a) => a.hardBlock),
    hasJustifiable: alerts.some((a) => a.requiresJustification),
  };
}

export const SEVERITY_ORDER: Record<Severity, number> = { blocker: 0, warning: 1, info: 2 };
