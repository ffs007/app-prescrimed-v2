// Etapa 13 — Motor renal/hepático (puro). Não inventa regras de ajuste.

import type { IVMedication } from "../IVDilutionAdminPage";

export type Sexo = "M" | "F";
export type CrUnit = "mg/dL" | "µmol/L";
export type ChildPugh = "A" | "B" | "C";
export type RenalClass =
  | "normal_ou_leve" | "moderada" | "importante" | "grave" | "dialise" | "desconhecida";

export type PatientRH = {
  idade?: number | null;
  sexo_biologico?: Sexo | null;
  peso_kg?: number | null;
  altura_cm?: number | null;
  creatinina_serica?: number | null;
  unidade_creatinina?: CrUnit | string | null;
  data_creatinina?: string | null;
  ureia?: number | null;
  data_ureia?: string | null;
  etfg?: number | null;
  clearance_creatinina_estimado?: number | null;
  metodo_calculo_renal?: string | null;
  possui_doenca_renal_cronica?: boolean | null;
  em_hemodialise?: boolean | null;
  dialise_peritoneal?: boolean | null;
  lesao_renal_aguda_suspeita?: boolean | null;
  ast?: number | null;
  alt?: number | null;
  bilirrubina_total?: number | null;
  bilirrubina_direta?: number | null;
  albumina?: number | null;
  inr?: number | null;
  possui_doenca_hepatica?: boolean | null;
  cirrose_conhecida?: boolean | null;
  child_pugh?: ChildPugh | null;
  observacoes_funcao_renal_hepatica?: string | null;
  internado?: boolean | null;
};

export type RenalSpec = {
  exige_ajuste_funcao_renal?: boolean | null;
  risco_acumulo_renal?: boolean | null;
  risco_nefrotoxicidade?: boolean | null;
  monitorar_creatinina?: boolean | null;
  monitorar_nivel_serico?: boolean | null;
  contraindicado_renal_grave?: boolean | null;
  observacao_ajuste_renal?: string | null;
  faixa_renal_normal?: string | null;
  faixa_renal_moderada?: string | null;
  faixa_renal_importante?: string | null;
  faixa_renal_grave?: string | null;
  faixa_dialise?: string | null;
  fonte_ajuste_renal?: string | null;
};

export type HepaticSpec = {
  exige_ajuste_funcao_hepatica?: boolean | null;
  risco_hepatotoxicidade?: boolean | null;
  monitorar_transaminases?: boolean | null;
  contraindicado_hepatico_grave?: boolean | null;
  observacao_ajuste_hepatico?: string | null;
  fonte_ajuste_hepatico?: string | null;
};

export type RHSettings = {
  metodo_renal_padrao: "cockcroft_gault" | "etfg_informada" | "perguntar";
  exigir_just_clcr_lt30_ajuste_renal: boolean;
  exigir_just_nefrotoxico_clcr_lt30: boolean;
  exigir_funcao_renal_alerta_alto: boolean;
  alertar_creatinina_desatualizada: boolean;
  bloquear_contraind_renal_grave: boolean;
  bloquear_contraind_hepatico_grave: boolean;
};

export const RH_DEFAULTS: RHSettings = {
  metodo_renal_padrao: "cockcroft_gault",
  exigir_just_clcr_lt30_ajuste_renal: true,
  exigir_just_nefrotoxico_clcr_lt30: true,
  exigir_funcao_renal_alerta_alto: false,
  alertar_creatinina_desatualizada: true,
  bloquear_contraind_renal_grave: false,
  bloquear_contraind_hepatico_grave: false,
};

export type RHAlertType =
  | "ajuste_renal" | "funcao_renal_ausente" | "risco_acumulo" | "nefrotoxicidade"
  | "monitorar_nivel_serico" | "monitorar_creatinina"
  | "ajuste_hepatico" | "hepatotoxicidade" | "dados_hepaticos_ausentes"
  | "contraindicado_renal_grave" | "contraindicado_hepatico_grave"
  | "creatinina_desatualizada";

export type RHSeverity = "informativo" | "medio" | "alto";

export type RHAlert = {
  tipo: RHAlertType;
  mensagem: string;
  gravidade: RHSeverity;
  bloqueia: boolean;
  exige_justificativa: boolean;
};

export type RHResult = {
  clcr?: number | null;
  metodo?: "cockcroft_gault" | "etfg_informada" | "manual" | null;
  classificacao: RenalClass;
  faixa_orientacao?: string | null;
  dias_creatinina?: number | null;
  alerts: RHAlert[];
  bloqueios: RHAlert[];
  pendencias_justificativa: RHAlert[];
};

// ---------- Helpers ----------

export function creatininaToMgDl(value?: number | null, unit?: string | null): number | null {
  if (value == null) return null;
  if ((unit ?? "mg/dL").toLowerCase().includes("mol")) return value / 88.4;
  return value;
}

export function cockcroftGault(args: {
  idade?: number | null; peso_kg?: number | null; sexo?: Sexo | null; creatinina_mg_dl?: number | null;
}): number | null {
  const { idade, peso_kg, sexo, creatinina_mg_dl } = args;
  if (!idade || !peso_kg || !sexo || !creatinina_mg_dl || creatinina_mg_dl <= 0) return null;
  const base = ((140 - idade) * peso_kg) / (72 * creatinina_mg_dl);
  return sexo === "F" ? base * 0.85 : base;
}

export function classifyRenal(clcr?: number | null, dialise?: boolean | null): RenalClass {
  if (dialise) return "dialise";
  if (clcr == null) return "desconhecida";
  if (clcr >= 60) return "normal_ou_leve";
  if (clcr >= 30) return "moderada";
  if (clcr >= 15) return "importante";
  return "grave";
}

export function classifyLabel(c: RenalClass): string {
  switch (c) {
    case "normal_ou_leve": return "Normal/leve redução";
    case "moderada": return "Redução moderada";
    case "importante": return "Redução importante";
    case "grave": return "Redução grave";
    case "dialise": return "Em diálise";
    default: return "Desconhecida";
  }
}

export function diasDesde(date?: string | null): number | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (24 * 3600 * 1000));
}

function temDadosHepaticos(p: PatientRH): boolean {
  return [p.ast, p.alt, p.bilirrubina_total, p.albumina, p.inr, p.child_pugh].some((v) => v != null);
}

// ---------- Motor ----------

export function computeRenalHepaticAlerts(args: {
  patient: PatientRH;
  renal: RenalSpec;
  hepatic: HepaticSpec;
  settings?: RHSettings;
  medAlertaAlto?: boolean;
}): RHResult {
  const { patient, renal, hepatic } = args;
  const settings = args.settings ?? RH_DEFAULTS;
  const alerts: RHAlert[] = [];

  // ---- Renal: cálculo
  let clcr: number | null = null;
  let metodo: RHResult["metodo"] = null;
  const crMgDl = creatininaToMgDl(patient.creatinina_serica, patient.unidade_creatinina);

  if (patient.clearance_creatinina_estimado != null) {
    clcr = patient.clearance_creatinina_estimado;
    metodo = "manual";
  } else if (settings.metodo_renal_padrao === "etfg_informada" && patient.etfg != null) {
    clcr = patient.etfg;
    metodo = "etfg_informada";
  } else {
    const cg = cockcroftGault({ idade: patient.idade, peso_kg: patient.peso_kg, sexo: patient.sexo_biologico, creatinina_mg_dl: crMgDl });
    if (cg != null) { clcr = cg; metodo = "cockcroft_gault"; }
    else if (patient.etfg != null) { clcr = patient.etfg; metodo = "etfg_informada"; }
  }

  const dialise = !!(patient.em_hemodialise || patient.dialise_peritoneal);
  const classificacao = classifyRenal(clcr, dialise);
  const renalAusente = clcr == null && !dialise;

  // Orientação por faixa
  let faixa_orientacao: string | null = null;
  switch (classificacao) {
    case "normal_ou_leve": faixa_orientacao = renal.faixa_renal_normal ?? null; break;
    case "moderada": faixa_orientacao = renal.faixa_renal_moderada ?? null; break;
    case "importante": faixa_orientacao = renal.faixa_renal_importante ?? null; break;
    case "grave": faixa_orientacao = renal.faixa_renal_grave ?? null; break;
    case "dialise": faixa_orientacao = renal.faixa_dialise ?? null; break;
  }

  // ---- Renal: alertas
  if (renal.exige_ajuste_funcao_renal) {
    if (renalAusente) {
      alerts.push({
        tipo: "funcao_renal_ausente",
        mensagem: "Medicamento com ajuste renal cadastrado, mas função renal não informada.",
        gravidade: "medio",
        bloqueia: false,
        exige_justificativa: settings.exigir_funcao_renal_alerta_alto && !!args.medAlertaAlto,
      });
    } else {
      const exJust = !!(clcr != null && clcr < 30 && settings.exigir_just_clcr_lt30_ajuste_renal);
      alerts.push({
        tipo: "ajuste_renal",
        mensagem: faixa_orientacao
          ? `Revisar dose/intervalo conforme função renal. Orientação: ${faixa_orientacao}`
          : "Este medicamento exige revisão de dose/intervalo conforme função renal. Regra específica não cadastrada.",
        gravidade: clcr != null && clcr < 30 ? "alto" : "informativo",
        bloqueia: false,
        exige_justificativa: exJust,
      });
    }
  }

  if (renal.risco_acumulo_renal && (classificacao === "moderada" || classificacao === "importante" || classificacao === "grave" || classificacao === "dialise")) {
    alerts.push({
      tipo: "risco_acumulo",
      mensagem: "Risco de acúmulo em disfunção renal. Revisar dose, intervalo e monitorização.",
      gravidade: classificacao === "grave" || classificacao === "dialise" ? "alto" : "medio",
      bloqueia: false, exige_justificativa: true,
    });
  }

  if (renal.risco_nefrotoxicidade) {
    const grave = classificacao === "importante" || classificacao === "grave" || classificacao === "dialise";
    alerts.push({
      tipo: "nefrotoxicidade",
      mensagem: "Medicamento com potencial nefrotóxico. Considerar monitorização de creatinina e fatores de risco.",
      gravidade: grave ? "alto" : "informativo",
      bloqueia: false,
      exige_justificativa: !!(clcr != null && clcr < 30 && settings.exigir_just_nefrotoxico_clcr_lt30),
    });
  }

  if (renal.monitorar_nivel_serico) {
    alerts.push({
      tipo: "monitorar_nivel_serico",
      mensagem: "Medicamento pode exigir monitorização de nível sérico conforme protocolo.",
      gravidade: "informativo", bloqueia: false, exige_justificativa: false,
    });
  }
  if (renal.monitorar_creatinina) {
    alerts.push({
      tipo: "monitorar_creatinina",
      mensagem: "Considerar monitorização de função renal durante o uso.",
      gravidade: "informativo", bloqueia: false, exige_justificativa: false,
    });
  }

  if (renal.contraindicado_renal_grave && (classificacao === "grave" || classificacao === "dialise")) {
    alerts.push({
      tipo: "contraindicado_renal_grave",
      mensagem: "Medicamento possui contraindicação/alerta importante em disfunção renal grave conforme cadastro. Revisar antes de finalizar.",
      gravidade: "alto",
      bloqueia: settings.bloquear_contraind_renal_grave,
      exige_justificativa: true,
    });
  }

  // Creatinina desatualizada
  const dias = diasDesde(patient.data_creatinina);
  if (settings.alertar_creatinina_desatualizada && dias != null) {
    if (patient.internado && dias > 7) {
      alerts.push({
        tipo: "creatinina_desatualizada",
        mensagem: "Creatinina desatualizada para avaliação de função renal em paciente internado.",
        gravidade: "medio", bloqueia: false, exige_justificativa: false,
      });
    } else if (!patient.internado && dias > 30) {
      alerts.push({
        tipo: "creatinina_desatualizada",
        mensagem: "Creatinina pode estar desatualizada para ajuste medicamentoso.",
        gravidade: "informativo", bloqueia: false, exige_justificativa: false,
      });
    }
  }

  // ---- Hepático
  const hepDados = temDadosHepaticos(patient);
  if (hepatic.exige_ajuste_funcao_hepatica) {
    if (!hepDados) {
      alerts.push({
        tipo: "dados_hepaticos_ausentes",
        mensagem: "Medicamento com alerta hepático cadastrado, mas dados de função hepática não informados.",
        gravidade: "medio", bloqueia: false, exige_justificativa: false,
      });
    } else {
      alerts.push({
        tipo: "ajuste_hepatico",
        mensagem: hepatic.observacao_ajuste_hepatico
          ? `Atenção à função hepática. Orientação: ${hepatic.observacao_ajuste_hepatico}`
          : "Este medicamento exige atenção à função hepática. Orientação específica não cadastrada.",
        gravidade: "informativo", bloqueia: false, exige_justificativa: false,
      });
    }
  }

  if (hepatic.risco_hepatotoxicidade) {
    const grave = patient.child_pugh === "C" || patient.cirrose_conhecida;
    alerts.push({
      tipo: "hepatotoxicidade",
      mensagem: "Medicamento com potencial hepatotóxico. Avaliar função hepática e monitorização conforme protocolo.",
      gravidade: grave ? "alto" : "medio",
      bloqueia: false, exige_justificativa: !!grave,
    });
  }

  if (hepatic.contraindicado_hepatico_grave && (patient.child_pugh === "C" || patient.cirrose_conhecida)) {
    alerts.push({
      tipo: "contraindicado_hepatico_grave",
      mensagem: "Medicamento possui contraindicação/alerta importante em disfunção hepática grave conforme cadastro. Revisar antes de finalizar.",
      gravidade: "alto",
      bloqueia: settings.bloquear_contraind_hepatico_grave,
      exige_justificativa: true,
    });
  }

  return {
    clcr,
    metodo,
    classificacao,
    faixa_orientacao,
    dias_creatinina: dias,
    alerts,
    bloqueios: alerts.filter((a) => a.bloqueia),
    pendencias_justificativa: alerts.filter((a) => a.exige_justificativa),
  };
}

export function renalSpecFromMedication(med: IVMedication & Partial<RenalSpec>): RenalSpec {
  return {
    exige_ajuste_funcao_renal: (med as any).exige_ajuste_funcao_renal ?? null,
    risco_acumulo_renal: med.risco_acumulo_renal ?? null,
    risco_nefrotoxicidade: med.risco_nefrotoxicidade ?? null,
    monitorar_creatinina: med.monitorar_creatinina ?? null,
    monitorar_nivel_serico: med.monitorar_nivel_serico ?? null,
    contraindicado_renal_grave: med.contraindicado_renal_grave ?? null,
    observacao_ajuste_renal: med.observacao_ajuste_renal ?? null,
    faixa_renal_normal: med.faixa_renal_normal ?? null,
    faixa_renal_moderada: med.faixa_renal_moderada ?? null,
    faixa_renal_importante: med.faixa_renal_importante ?? null,
    faixa_renal_grave: med.faixa_renal_grave ?? null,
    faixa_dialise: med.faixa_dialise ?? null,
    fonte_ajuste_renal: med.fonte_ajuste_renal ?? null,
  };
}

export function hepaticSpecFromMedication(med: IVMedication & Partial<HepaticSpec>): HepaticSpec {
  return {
    exige_ajuste_funcao_hepatica: (med as any).exige_ajuste_funcao_hepatica ?? null,
    risco_hepatotoxicidade: med.risco_hepatotoxicidade ?? null,
    monitorar_transaminases: med.monitorar_transaminases ?? null,
    contraindicado_hepatico_grave: med.contraindicado_hepatico_grave ?? null,
    observacao_ajuste_hepatico: med.observacao_ajuste_hepatico ?? null,
    fonte_ajuste_hepatico: med.fonte_ajuste_hepatico ?? null,
  };
}

export function fmtNum(n: number | undefined | null, dec = 1): string {
  if (n == null || isNaN(n)) return "—";
  return Number(n).toLocaleString("pt-BR", { maximumFractionDigits: dec });
}
