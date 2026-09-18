// Etapa 12 — Motor de cálculo pediátrico (puro, sem side-effects).
// Não cadastra doses reais. Apenas computa quando spec é fornecido.

import type { IVMedication } from "../IVDilutionAdminPage";

export type PatientPed = {
  data_nascimento?: string | null;
  idade_anos?: number | null;
  idade_meses?: number | null;
  idade_dias?: number | null;
  peso_kg?: number | null;
  altura_cm?: number | null;
  superficie_corporal_m2?: number | null;
  paciente_pediatrico?: boolean | null;
  idade_gestacional_semanas?: number | null;
  peso_nascimento_kg?: number | null;
};

export type PedDoseSpec = {
  dose_pediatrica_min?: number | null;
  dose_pediatrica_max?: number | null;
  unidade_dose_pediatrica?: string | null; // mg/kg/dose, mg/kg/dia, mcg/kg/min, etc
  intervalo_dose_pediatrica?: string | null;
  dose_maxima_por_administracao?: number | null;
  dose_maxima_diaria?: number | null;
  unidade_dose_maxima?: string | null;
  faixa_etaria_min?: number | null;
  faixa_etaria_max?: number | null;
  peso_minimo_kg?: number | null;
  peso_maximo_kg?: number | null;
  uso_neonatal?: boolean | null;
  restricao_idade?: string | null;
  exige_ajuste_funcao_renal?: boolean | null;
  exige_ajuste_funcao_hepatica?: boolean | null;
  fonte_dose_pediatrica?: string | null;
  status_revisao_dose_pediatrica?: string | null;
};

export type PedSettings = {
  exigir_peso_pediatrico: boolean;
  exigir_just_dose_acima_faixa: boolean;
  bloquear_dose_2x_maxima: boolean;
  alertar_volume_abaixo_05ml: boolean;
  bloquear_volume_abaixo_01ml: boolean;
  mostrar_calc_sempre_menor_18: boolean;
  permitir_calc_pediatrico_adulto: boolean;
};

export const PED_DEFAULTS: PedSettings = {
  exigir_peso_pediatrico: true,
  exigir_just_dose_acima_faixa: true,
  bloquear_dose_2x_maxima: true,
  alertar_volume_abaixo_05ml: true,
  bloquear_volume_abaixo_01ml: true,
  mostrar_calc_sempre_menor_18: true,
  permitir_calc_pediatrico_adulto: true,
};

export type PedCalcInput = {
  patient: PatientPed;
  spec: PedDoseSpec;
  dose_prescrita?: number | null;     // já em mesma unidade base (mg ou mcg)
  unidade_prescrita?: string | null;  // mg, g, mcg, UI, mEq, mmol
  frequencia_texto?: string | null;
  concentracao_apresentacao?: number | null; // ex: mg/mL
  volume_diluicao_ml?: number | null;
  concentracao_solucao_mcg_ml?: number | null; // p/ infusão contínua
  velocidade_ml_h?: number | null;             // p/ cálculo inverso contínuo
};

export type PedSeverity = "informativo" | "medio" | "alto";
export type PedStatus = "ok" | "atencao" | "critico" | "incompleto" | "nao_aplicavel";

export type PedAlert = {
  tipo:
    | "peso_ausente" | "dose_acima_faixa" | "dose_abaixo_faixa"
    | "dose_max_adm_excedida" | "dose_max_dia_excedida"
    | "faixa_etaria_incompativel" | "peso_fora_faixa"
    | "dose_pediatrica_nao_cadastrada" | "volume_muito_baixo"
    | "ajuste_renal_hepatico" | "frequencia_ausente";
  mensagem: string;
  gravidade: PedSeverity;
  bloqueia: boolean;
  exige_justificativa: boolean;
};

export type PedCalcResult = {
  aplicavel: boolean;
  status: PedStatus;
  idade_anos_calculada?: number;
  dose_mg_kg?: number;             // dose por kg (a partir da prescrita)
  dose_total?: number;             // dose por administração calculada (faixa)
  dose_minima_total?: number;
  dose_maxima_total?: number;
  dose_diaria_total?: number;
  dose_diaria_calculada_de_dia?: number; // se unidade é mg/kg/dia × peso
  dose_por_administracao_de_diaria?: number;
  administracoes_por_dia?: number | null;
  excesso_percentual?: number;     // vs dose máxima por adm
  velocidade_ml_h?: number;        // infusão contínua
  dose_mcg_kg_min_inversa?: number;
  volume_administrar_ml?: number;
  alerts: PedAlert[];
  bloqueios: PedAlert[];
  pendencias_justificativa: PedAlert[];
};

// ---------- Helpers ----------

export function calcIdadeAnos(p: PatientPed): number | undefined {
  if (p.idade_anos != null) return Number(p.idade_anos);
  if (p.data_nascimento) {
    const nasc = new Date(p.data_nascimento);
    if (!isNaN(nasc.getTime())) {
      const ms = Date.now() - nasc.getTime();
      return ms / (365.25 * 24 * 3600 * 1000);
    }
  }
  if (p.idade_meses != null) return Number(p.idade_meses) / 12;
  if (p.idade_dias != null) return Number(p.idade_dias) / 365.25;
  return undefined;
}

export function isPediatric(p: PatientPed): boolean {
  if (p.paciente_pediatrico) return true;
  const a = calcIdadeAnos(p);
  return a != null && a < 18;
}

export function parseFrequencia(texto?: string | null): number | null {
  if (!texto) return null;
  const t = texto.toLowerCase().trim();
  if (/dose\s*[uú]nica|única/.test(t)) return 1;
  if (/cont[íi]nu/.test(t)) return null;
  if (/se\s*necess/.test(t)) return null;
  const m = t.match(/(\d+)\s*\/\s*(\d+)\s*h/);
  if (m) {
    const h = Number(m[1]);
    if (h > 0) return Math.round(24 / h);
  }
  const cada = t.match(/cada\s*(\d+)\s*h/);
  if (cada) {
    const h = Number(cada[1]);
    if (h > 0) return Math.round(24 / h);
  }
  if (/24\/24|1x\/?dia|uma vez/.test(t)) return 1;
  if (/12\/12|2x\/?dia/.test(t)) return 2;
  if (/8\/8|3x\/?dia/.test(t)) return 3;
  if (/6\/6|4x\/?dia/.test(t)) return 4;
  if (/4\/4|6x\/?dia/.test(t)) return 6;
  return null;
}

function toMg(v: number, unit?: string | null): number {
  const u = (unit ?? "mg").toLowerCase();
  if (u === "g") return v * 1000;
  if (u === "mcg" || u === "µg") return v / 1000;
  return v; // mg, UI, mEq, mmol — sem conversão
}

// ---------- Motor ----------

export function computePediatricCalc(input: PedCalcInput, settings: PedSettings = PED_DEFAULTS): PedCalcResult {
  const { patient, spec } = input;
  const idade = calcIdadeAnos(patient);
  const ped = isPediatric(patient);
  const alerts: PedAlert[] = [];

  if (!ped) {
    return {
      aplicavel: false, status: "nao_aplicavel", idade_anos_calculada: idade,
      alerts: [], bloqueios: [], pendencias_justificativa: [],
    };
  }

  // Dose pediátrica não cadastrada
  const semDosePed =
    spec.dose_pediatrica_min == null && spec.dose_pediatrica_max == null &&
    spec.dose_maxima_por_administracao == null && spec.dose_maxima_diaria == null;
  if (semDosePed) {
    alerts.push({
      tipo: "dose_pediatrica_nao_cadastrada",
      mensagem: "Dose pediátrica não cadastrada para este medicamento. Validar manualmente.",
      gravidade: "informativo", bloqueia: false, exige_justificativa: false,
    });
  }

  const peso = patient.peso_kg ?? null;
  if (!peso || peso <= 0) {
    if (settings.exigir_peso_pediatrico) {
      alerts.push({
        tipo: "peso_ausente",
        mensagem: "Peso do paciente necessário para cálculo pediátrico seguro.",
        gravidade: "alto", bloqueia: false, exige_justificativa: false,
      });
    }
  }

  // Faixa etária
  if (idade != null) {
    if (spec.faixa_etaria_min != null && idade < spec.faixa_etaria_min) {
      alerts.push({
        tipo: "faixa_etaria_incompativel",
        mensagem: "Medicamento possui restrição cadastrada para esta faixa etária.",
        gravidade: "alto", bloqueia: !!spec.restricao_idade, exige_justificativa: true,
      });
    }
    if (spec.faixa_etaria_max != null && idade > spec.faixa_etaria_max) {
      alerts.push({
        tipo: "faixa_etaria_incompativel",
        mensagem: "Medicamento possui restrição cadastrada para esta faixa etária.",
        gravidade: "alto", bloqueia: !!spec.restricao_idade, exige_justificativa: true,
      });
    }
  }

  // Peso fora da faixa
  if (peso) {
    if (spec.peso_minimo_kg != null && peso < spec.peso_minimo_kg) {
      alerts.push({ tipo: "peso_fora_faixa", mensagem: "Peso do paciente fora da faixa validada para esta orientação.", gravidade: "medio", bloqueia: false, exige_justificativa: false });
    }
    if (spec.peso_maximo_kg != null && peso > spec.peso_maximo_kg) {
      alerts.push({ tipo: "peso_fora_faixa", mensagem: "Peso do paciente fora da faixa validada para esta orientação.", gravidade: "medio", bloqueia: false, exige_justificativa: false });
    }
  }

  // Ajuste renal/hepático
  if (spec.exige_ajuste_funcao_renal || spec.exige_ajuste_funcao_hepatica) {
    alerts.push({
      tipo: "ajuste_renal_hepatico",
      mensagem: "Medicamento possui alerta de ajuste renal/hepático cadastrado.",
      gravidade: "informativo", bloqueia: false, exige_justificativa: false,
    });
  }

  const result: PedCalcResult = {
    aplicavel: true,
    status: "incompleto",
    idade_anos_calculada: idade,
    alerts,
    bloqueios: [],
    pendencias_justificativa: [],
  };

  // Cálculo por kg
  const unidade = (spec.unidade_dose_pediatrica ?? "").toLowerCase();
  const isPorDose = unidade.includes("/dose");
  const isPorDia = unidade.includes("/dia");
  const isContinua = unidade.includes("/min");

  if (peso && (spec.dose_pediatrica_min != null || spec.dose_pediatrica_max != null)) {
    const dmin = spec.dose_pediatrica_min;
    const dmax = spec.dose_pediatrica_max;
    if (isPorDose) {
      if (dmin != null) result.dose_minima_total = dmin * peso;
      if (dmax != null) result.dose_maxima_total = dmax * peso;
    } else if (isPorDia) {
      if (dmin != null) result.dose_diaria_total = dmin * peso;
      if (dmax != null) result.dose_diaria_calculada_de_dia = dmax * peso;
      const adm = parseFrequencia(input.frequencia_texto);
      result.administracoes_por_dia = adm;
      if (adm && dmax != null) {
        result.dose_por_administracao_de_diaria = (dmax * peso) / adm;
      }
      if (!adm) {
        alerts.push({
          tipo: "frequencia_ausente",
          mensagem: "Informe a frequência para calcular dose diária.",
          gravidade: "informativo", bloqueia: false, exige_justificativa: false,
        });
      }
    }
  }

  // Dose prescrita → mg/kg
  const doseMg = input.dose_prescrita != null ? toMg(input.dose_prescrita, input.unidade_prescrita ?? undefined) : null;
  if (doseMg != null && peso && peso > 0) {
    result.dose_mg_kg = doseMg / peso;

    if (isPorDose) {
      if (spec.dose_pediatrica_min != null && result.dose_mg_kg < spec.dose_pediatrica_min) {
        alerts.push({ tipo: "dose_abaixo_faixa", mensagem: "Dose prescrita abaixo da faixa pediátrica cadastrada.", gravidade: "medio", bloqueia: false, exige_justificativa: settings.exigir_just_dose_acima_faixa });
      }
      if (spec.dose_pediatrica_max != null && result.dose_mg_kg > spec.dose_pediatrica_max) {
        alerts.push({ tipo: "dose_acima_faixa", mensagem: "Dose prescrita acima da faixa pediátrica cadastrada.", gravidade: "alto", bloqueia: false, exige_justificativa: settings.exigir_just_dose_acima_faixa });
      }
    }

    if (spec.dose_maxima_por_administracao != null) {
      if (doseMg > spec.dose_maxima_por_administracao) {
        const exc = ((doseMg - spec.dose_maxima_por_administracao) / spec.dose_maxima_por_administracao) * 100;
        result.excesso_percentual = exc;
        const bloq = settings.bloquear_dose_2x_maxima && doseMg > 2 * spec.dose_maxima_por_administracao;
        alerts.push({
          tipo: "dose_max_adm_excedida",
          mensagem: `Dose por administração acima da máxima cadastrada${exc ? ` (excesso de ${exc.toFixed(0)}%).` : "."}`,
          gravidade: "alto", bloqueia: bloq, exige_justificativa: true,
        });
      }
    }

    const adm = parseFrequencia(input.frequencia_texto);
    if (spec.dose_maxima_diaria != null && adm) {
      const doseDiaria = doseMg * adm;
      if (doseDiaria > spec.dose_maxima_diaria) {
        const bloq = settings.bloquear_dose_2x_maxima && doseDiaria > 2 * spec.dose_maxima_diaria;
        alerts.push({
          tipo: "dose_max_dia_excedida",
          mensagem: "Dose diária acima da máxima cadastrada.",
          gravidade: "alto", bloqueia: bloq, exige_justificativa: true,
        });
      }
    }
  }

  // Volume a administrar
  if (doseMg != null && input.concentracao_apresentacao && input.concentracao_apresentacao > 0) {
    result.volume_administrar_ml = doseMg / input.concentracao_apresentacao;
    if (settings.bloquear_volume_abaixo_01ml && result.volume_administrar_ml < 0.1) {
      alerts.push({ tipo: "volume_muito_baixo", mensagem: "Volume calculado muito baixo. Avaliar precisão de administração.", gravidade: "alto", bloqueia: true, exige_justificativa: true });
    } else if (settings.alertar_volume_abaixo_05ml && result.volume_administrar_ml < 0.5) {
      alerts.push({ tipo: "volume_muito_baixo", mensagem: "Volume calculado muito baixo. Avaliar precisão de administração.", gravidade: "medio", bloqueia: false, exige_justificativa: false });
    }
  }

  // Infusão contínua mcg/kg/min
  if (isContinua && peso) {
    const dose = input.dose_prescrita;
    if (dose != null && input.concentracao_solucao_mcg_ml && input.concentracao_solucao_mcg_ml > 0) {
      result.velocidade_ml_h = (dose * peso * 60) / input.concentracao_solucao_mcg_ml;
    }
    if (input.velocidade_ml_h && input.concentracao_solucao_mcg_ml && input.concentracao_solucao_mcg_ml > 0) {
      result.dose_mcg_kg_min_inversa = (input.velocidade_ml_h * input.concentracao_solucao_mcg_ml) / (peso * 60);
      if (spec.dose_pediatrica_max != null && result.dose_mcg_kg_min_inversa > spec.dose_pediatrica_max) {
        alerts.push({ tipo: "dose_acima_faixa", mensagem: "Dose infundida acima do limite cadastrado.", gravidade: "alto", bloqueia: false, exige_justificativa: settings.exigir_just_dose_acima_faixa });
      }
    }
  }

  // Status final
  const blocker = alerts.some((a) => a.bloqueia);
  const high = alerts.some((a) => a.gravidade === "alto");
  const med = alerts.some((a) => a.gravidade === "medio");
  if (blocker) result.status = "critico";
  else if (high) result.status = "critico";
  else if (med) result.status = "atencao";
  else if (doseMg != null || result.dose_minima_total != null || result.dose_maxima_total != null) result.status = "ok";
  else result.status = "incompleto";

  result.bloqueios = alerts.filter((a) => a.bloqueia);
  result.pendencias_justificativa = alerts.filter((a) => a.exige_justificativa);
  return result;
}

// Mapeia campos pediátricos do iv_medications para PedDoseSpec
export function specFromMedication(med: IVMedication & Partial<PedDoseSpec>): PedDoseSpec {
  return {
    dose_pediatrica_min: med.dose_pediatrica_min ?? null,
    dose_pediatrica_max: med.dose_pediatrica_max ?? null,
    unidade_dose_pediatrica: med.unidade_dose_pediatrica ?? null,
    intervalo_dose_pediatrica: med.intervalo_dose_pediatrica ?? null,
    dose_maxima_por_administracao: med.dose_maxima_por_administracao ?? null,
    dose_maxima_diaria: med.dose_maxima_diaria ?? null,
    unidade_dose_maxima: med.unidade_dose_maxima ?? null,
    faixa_etaria_min: med.faixa_etaria_min ?? null,
    faixa_etaria_max: med.faixa_etaria_max ?? null,
    peso_minimo_kg: med.peso_minimo_kg ?? null,
    peso_maximo_kg: med.peso_maximo_kg ?? null,
    uso_neonatal: med.uso_neonatal ?? null,
    restricao_idade: med.restricao_idade ?? null,
    exige_ajuste_funcao_renal: med.exige_ajuste_funcao_renal ?? null,
    exige_ajuste_funcao_hepatica: med.exige_ajuste_funcao_hepatica ?? null,
    fonte_dose_pediatrica: med.fonte_dose_pediatrica ?? null,
    status_revisao_dose_pediatrica: med.status_revisao_dose_pediatrica ?? null,
  };
}

export function fmtNum(n: number | undefined | null, dec = 2): string {
  if (n == null || isNaN(n)) return "—";
  return Number(n).toLocaleString("pt-BR", { maximumFractionDigits: dec });
}
