import type { IVMedication } from "../IVDilutionAdminPage";

// ---------- Tipos ----------

export type DoseUnit = "mg" | "g" | "mcg" | "UI" | "mEq" | "mmol";
export type VolumeUnit = "mL" | "L";
export type TimeUnit = "minuto" | "minutos" | "min" | "hora" | "horas" | "h";

export type IVCalcInput = {
  dose_value?: number | null;
  dose_unit?: DoseUnit | string | null;
  volume_value?: number | null;
  volume_unit?: VolumeUnit | string | null;
  time_value?: number | null;
  time_unit?: TimeUnit | string | null;
  weight_kg?: number | null;
};

export type IVCalcSettings = {
  bloquear_concentracao_2x: boolean;
  exigir_just_velocidade: boolean;
  exigir_just_tempo: boolean;
  permitir_calculo_incompleto: boolean;
  exigir_peso_vasoativos: boolean;
};

export const IV_CALC_DEFAULTS: IVCalcSettings = {
  bloquear_concentracao_2x: true,
  exigir_just_velocidade: true,
  exigir_just_tempo: true,
  permitir_calculo_incompleto: true,
  exigir_peso_vasoativos: true,
};

export type IVCalcStatus =
  | "calculado" | "incompleto" | "erro_unidade"
  | "exige_peso" | "exige_volume" | "exige_tempo" | "nao_aplicavel";

export type IVCalcGravidade = "informativo" | "medio" | "alto";

export type IVCalcAlert = {
  tipo:
    | "concentracao_acima"
    | "concentracao_muito_acima"
    | "velocidade_acima"
    | "tempo_abaixo"
    | "tempo_muito_abaixo"
    | "calculo_incompleto"
    | "peso_ausente"
    | "parametro_nao_cadastrado";
  mensagem: string;
  gravidade: IVCalcGravidade;
  bloqueia: boolean;
  exige_justificativa: boolean;
};

export type IVCalcResult = {
  status: IVCalcStatus;
  dose_total_mg?: number;
  volume_total_ml?: number;
  tempo_total_minutos?: number;
  concentracao_calculada?: number; // mg/mL
  concentracao_maxima?: number;    // mg/mL
  velocidade_ml_h?: number;
  velocidade_mg_min?: number;
  velocidade_mcg_kg_min?: number;
  velocidade_maxima_mg_min?: number;
  tempo_minimo_minutos?: number;
  alerts: IVCalcAlert[];
  mensagens_inline: string[];
};

// ---------- Conversores ----------

export function toMg(value: number, unit: string): number | null {
  const u = unit.toLowerCase();
  if (u === "mg") return value;
  if (u === "g") return value * 1000;
  if (u === "mcg" || u === "ug") return value / 1000;
  return null; // UI / mEq / mmol não convertem para mg
}

export function toMl(value: number, unit: string): number | null {
  const u = unit.toLowerCase();
  if (u === "ml") return value;
  if (u === "l") return value * 1000;
  return null;
}

export function toMinutes(value: number, unit: string): number | null {
  const u = unit.toLowerCase().replace(/s$/, "");
  if (u === "minuto" || u === "min") return value;
  if (u === "hora" || u === "h") return value * 60;
  return null;
}

// ---------- Parsers tolerantes da Base IV ----------

/** Extrai número de "≤ 5 mg/mL", "5 mg/ml", "1 hora", "≥ 60 min" — devolve em mg/mL. */
export function parseConcentracaoMaxima(text?: string | null): number | null {
  if (!text) return null;
  const t = text.toLowerCase().replace(",", ".");
  const m = t.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g)\s*\/\s*(ml|l)/);
  if (!m) return null;
  let mg = parseFloat(m[1]);
  if (m[2] === "g") mg *= 1000;
  if (m[2] === "mcg") mg /= 1000;
  let ml = 1;
  if (m[3] === "l") ml = 1000;
  return mg / ml;
}

/** "≤ 50 mg/min", "1 mg/kg/min" → mg/min (ignora kg). */
export function parseVelocidadeMaxima(text?: string | null): number | null {
  if (!text) return null;
  const t = text.toLowerCase().replace(",", ".");
  const m = t.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g)\s*(?:\/\s*kg)?\s*\/\s*min/);
  if (!m) return null;
  let mg = parseFloat(m[1]);
  if (m[2] === "g") mg *= 1000;
  if (m[2] === "mcg") mg /= 1000;
  return mg;
}

/** "1 hora", "60 min", "≥ 30 minutos" → minutos. */
export function parseTempoMinimo(text?: string | null): number | null {
  if (!text) return null;
  const t = text.toLowerCase().replace(",", ".");
  const m = t.match(/(\d+(?:\.\d+)?)\s*(hora|horas|h|min|minuto|minutos)/);
  if (!m) return null;
  const v = parseFloat(m[1]);
  return /h/.test(m[2]) ? v * 60 : v;
}

// ---------- Vasoativos ----------

const VASOATIVOS_NORMALIZADOS = [
  "noradrenalina", "norepinefrina",
  "adrenalina", "epinefrina",
  "dopamina", "dobutamina",
  "nitroprussiato",
];

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function isVasoativo(med: IVMedication): boolean {
  const n = norm(med.principio_ativo);
  return VASOATIVOS_NORMALIZADOS.some((v) => n.includes(v));
}

// ---------- Engine ----------

export function computeIVCalc(
  input: IVCalcInput,
  med: IVMedication,
  settings: IVCalcSettings = IV_CALC_DEFAULTS,
): IVCalcResult {
  const alerts: IVCalcAlert[] = [];
  const mensagens: string[] = [];
  const nivel = med.nivel_alerta;
  const gravBase: IVCalcGravidade =
    nivel === "alto" ? "alto" : nivel === "medio" ? "medio" : "informativo";

  // Conversões de entrada
  let doseMg: number | undefined;
  let unitErr = false;
  if (input.dose_value != null && input.dose_unit) {
    const v = toMg(Number(input.dose_value), String(input.dose_unit));
    if (v == null) unitErr = true;
    else doseMg = v;
  }

  let volMl: number | undefined;
  if (input.volume_value != null && input.volume_unit) {
    const v = toMl(Number(input.volume_value), String(input.volume_unit));
    if (v == null) unitErr = true;
    else volMl = v;
  }

  let tMin: number | undefined;
  if (input.time_value != null && input.time_unit) {
    const v = toMinutes(Number(input.time_value), String(input.time_unit));
    if (v == null) unitErr = true;
    else tMin = v;
  }

  if (unitErr) {
    mensagens.push("Unidade não reconhecida. Revise dose, volume ou tempo.");
    return {
      status: "erro_unidade",
      alerts: [],
      mensagens_inline: mensagens,
    };
  }

  // Limites cadastrados
  const concMax = parseConcentracaoMaxima(med.concentracao_maxima);
  const velMaxMgMin = parseVelocidadeMaxima(med.velocidade_maxima_infusao);
  const tempoMinMin = parseTempoMinimo(med.tempo_minimo_infusao);

  // Cálculo concentração
  let conc: number | undefined;
  if (doseMg != null && volMl != null && volMl > 0) {
    conc = doseMg / volMl;
  }

  // Cálculo velocidade
  let velMlH: number | undefined;
  let velMgMin: number | undefined;
  if (volMl != null && tMin != null && tMin > 0) {
    velMlH = volMl / (tMin / 60);
  }
  if (doseMg != null && tMin != null && tMin > 0) {
    velMgMin = doseMg / tMin;
  }

  // Vasoativos: peso obrigatório (se setting ativo)
  const vaso = isVasoativo(med);
  let velMcgKgMin: number | undefined;
  if (vaso) {
    if (input.weight_kg && input.weight_kg > 0 && doseMg != null && tMin != null && tMin > 0) {
      velMcgKgMin = (doseMg * 1000) / input.weight_kg / tMin;
    } else if (settings.exigir_peso_vasoativos && (!input.weight_kg || input.weight_kg <= 0)) {
      alerts.push({
        tipo: "peso_ausente",
        mensagem: "Peso do paciente necessário para cálculo em mcg/kg/min.",
        gravidade: "medio",
        bloqueia: false,
        exige_justificativa: false,
      });
    }
  }

  // Status
  let status: IVCalcStatus = "calculado";
  if (vaso && (!input.weight_kg || input.weight_kg <= 0) && settings.exigir_peso_vasoativos) {
    status = "exige_peso";
  } else if (volMl == null && doseMg != null) {
    status = "exige_volume";
    mensagens.push("Informe o volume de diluição para calcular a concentração.");
  } else if (tMin == null && (volMl != null || doseMg != null)) {
    status = "exige_tempo";
    mensagens.push("Informe o tempo de infusão para calcular a velocidade.");
  } else if (doseMg == null && volMl == null && tMin == null) {
    status = "incompleto";
  }

  if (status === "incompleto") {
    alerts.push({
      tipo: "calculo_incompleto",
      mensagem: "Dados insuficientes para cálculo IV completo.",
      gravidade: "informativo",
      bloqueia: false,
      exige_justificativa: false,
    });
  }

  // Comparações
  if (conc != null && concMax != null) {
    if (conc > concMax * 2 && nivel === "alto" && settings.bloquear_concentracao_2x) {
      alerts.push({
        tipo: "concentracao_muito_acima",
        mensagem:
          "Concentração calculada muito acima da máxima cadastrada. Corrija dose ou volume antes de finalizar.",
        gravidade: "alto",
        bloqueia: true,
        exige_justificativa: false,
      });
    } else if (conc > concMax) {
      alerts.push({
        tipo: "concentracao_acima",
        mensagem: "Concentração calculada acima da máxima cadastrada.",
        gravidade: gravBase,
        bloqueia: false,
        exige_justificativa: false,
      });
    }
  }

  if (velMgMin != null && velMaxMgMin != null && velMgMin > velMaxMgMin) {
    const altoRisco = nivel === "alto";
    alerts.push({
      tipo: "velocidade_acima",
      mensagem: altoRisco
        ? "Velocidade acima da máxima cadastrada para medicamento de alto risco."
        : "Velocidade de infusão acima da máxima cadastrada.",
      gravidade: gravBase,
      bloqueia: false,
      exige_justificativa: altoRisco && settings.exigir_just_velocidade,
    });
  }

  if (tMin != null && tempoMinMin != null && tMin < tempoMinMin) {
    const muitoAbaixo = tMin < tempoMinMin * 0.5;
    const altoRisco = nivel === "alto";
    if (muitoAbaixo && altoRisco) {
      alerts.push({
        tipo: "tempo_muito_abaixo",
        mensagem: "Tempo de infusão muito abaixo do recomendado para medicamento de alto risco.",
        gravidade: "alto",
        bloqueia: false,
        exige_justificativa: settings.exigir_just_tempo,
      });
    } else {
      alerts.push({
        tipo: "tempo_abaixo",
        mensagem: "Tempo de infusão menor que o recomendado.",
        gravidade: gravBase,
        bloqueia: false,
        exige_justificativa: false,
      });
    }
  }

  // Parâmetros não cadastrados
  if (conc != null && concMax == null) mensagens.push("Concentração máxima não cadastrada para comparação.");
  if (velMgMin != null && velMaxMgMin == null) mensagens.push("Velocidade máxima não cadastrada para comparação.");
  if (tMin != null && tempoMinMin == null) mensagens.push("Tempo mínimo não cadastrado para comparação.");

  return {
    status,
    dose_total_mg: doseMg,
    volume_total_ml: volMl,
    tempo_total_minutos: tMin,
    concentracao_calculada: conc,
    concentracao_maxima: concMax ?? undefined,
    velocidade_ml_h: velMlH,
    velocidade_mg_min: velMgMin,
    velocidade_mcg_kg_min: velMcgKgMin,
    velocidade_maxima_mg_min: velMaxMgMin ?? undefined,
    tempo_minimo_minutos: tempoMinMin ?? undefined,
    alerts,
    mensagens_inline: mensagens,
  };
}

export function hasBlocking(r: IVCalcResult): boolean {
  return r.alerts.some((a) => a.bloqueia);
}

export function needsJustification(r: IVCalcResult): boolean {
  return r.alerts.some((a) => a.exige_justificativa);
}

export function fmt(n: number | undefined, digits = 2): string {
  if (n == null || !isFinite(n)) return "—";
  return Number(n.toFixed(digits)).toLocaleString("pt-BR");
}
