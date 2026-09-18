/**
 * Motor de calculadoras clínicas.
 *
 * Cada calculadora é uma definição declarativa (campos + função de cálculo),
 * o que permite renderizar todas com um único componente e sugerir
 * automaticamente conforme o contexto do atendimento.
 *
 * Tudo aqui é SUGESTÃO revisável — nunca decisão automática.
 */

import type { PatientProfile } from "@/modules/prescription/data/pathologyKnowledge";

export type FieldKind = "number" | "select";

export interface CalculatorField {
  key: string;
  label: string;
  kind: FieldKind;
  unit?: string;
  hint?: string;
  options?: { value: string; label: string }[];
  /** Preenchido automaticamente a partir do paciente do atendimento. */
  autofill?: "age" | "weight" | "sex";
  optional?: boolean;
}

export type ResultTone = "neutral" | "info" | "warning" | "danger";

export interface CalculatorResult {
  /** Valor principal já formatado (ex.: "48 mL/min"). */
  headline: string;
  /** Interpretação clínica curta. */
  interpretation: string;
  tone: ResultTone;
  /** Linhas adicionais (ajustes, ressalvas). */
  details?: string[];
  /** Texto pronto para virar observação/item do documento. */
  text: string;
}

export type CalculatorCategory =
  | "renal"
  | "dose"
  | "cardio"
  | "hepatico"
  | "cirurgico"
  | "pediatrico"
  | "obstetrico"
  | "oncologico";

export interface CalculatorDef {
  id: string;
  name: string;
  short: string;
  category: CalculatorCategory;
  /** Perfis de paciente em que a calculadora é especialmente relevante. */
  profiles: PatientProfile[];
  reference: string;
  fields: CalculatorField[];
  compute: (v: Record<string, number | string>) => CalculatorResult | null;
}

const num = (v: Record<string, number | string>, k: string): number => {
  const raw = v[k];
  const n = typeof raw === "number" ? raw : parseFloat(String(raw ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};
const str = (v: Record<string, number | string>, k: string) => String(v[k] ?? "");
const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

const SEX_OPTIONS = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Feminino" },
];

/* ------------------------------------------------------------------ */
/* Função renal                                                        */
/* ------------------------------------------------------------------ */

export const cockcroftGault = (
  age: number,
  weightKg: number,
  creatinine: number,
  sex: string,
): number => ((140 - age) * weightKg * (sex === "F" ? 0.85 : 1)) / (72 * creatinine);

export const ckdEpi2021 = (age: number, creatinine: number, sex: string): number => {
  const female = sex === "F";
  const k = female ? 0.7 : 0.9;
  const a = female ? -0.241 : -0.302;
  const min = Math.min(creatinine / k, 1);
  const max = Math.max(creatinine / k, 1);
  return 142 * Math.pow(min, a) * Math.pow(max, -1.2) * Math.pow(0.9938, age) * (female ? 1.012 : 1);
};

export const bsaMosteller = (heightCm: number, weightKg: number): number =>
  Math.sqrt((heightCm * weightKg) / 3600);

export const idealBodyWeight = (heightCm: number, sex: string): number => {
  const inchesOver60 = Math.max(0, heightCm / 2.54 - 60);
  return (sex === "F" ? 45.5 : 50) + 2.3 * inchesOver60;
};

const renalBand = (crcl: number) => {
  if (crcl >= 90) return { label: "Função renal preservada", tone: "neutral" as ResultTone };
  if (crcl >= 60) return { label: "Redução leve (TFG 60–89)", tone: "info" as ResultTone };
  if (crcl >= 30) return { label: "Redução moderada (TFG 30–59)", tone: "warning" as ResultTone };
  if (crcl >= 15) return { label: "Redução grave (TFG 15–29)", tone: "danger" as ResultTone };
  return { label: "Falência renal (TFG < 15)", tone: "danger" as ResultTone };
};

/* ------------------------------------------------------------------ */
/* Definições                                                          */
/* ------------------------------------------------------------------ */

export const CALCULATORS: CalculatorDef[] = [
  {
    id: "crcl",
    name: "Depuração de creatinina (Cockcroft-Gault)",
    short: "Clearance de creatinina",
    category: "renal",
    profiles: ["nefropata", "geriatrico", "cardiopata"],
    reference: "Cockcroft & Gault, 1976 — base para ajuste de dose em bula",
    fields: [
      { key: "age", label: "Idade", kind: "number", unit: "anos", autofill: "age" },
      { key: "weight", label: "Peso", kind: "number", unit: "kg", autofill: "weight" },
      { key: "cr", label: "Creatinina sérica", kind: "number", unit: "mg/dL" },
      { key: "sex", label: "Sexo", kind: "select", options: SEX_OPTIONS, autofill: "sex" },
    ],
    compute: (v) => {
      const age = num(v, "age");
      const w = num(v, "weight");
      const cr = num(v, "cr");
      const sex = str(v, "sex");
      if (!age || !w || !cr || !sex) return null;
      const crcl = r1(cockcroftGault(age, w, cr, sex));
      const band = renalBand(crcl);
      return {
        headline: `${crcl} mL/min`,
        interpretation: band.label,
        tone: band.tone,
        details: [
          crcl < 30
            ? "Muitos fármacos exigem redução de dose ou estão contraindicados abaixo de 30 mL/min."
            : "Confira a faixa de ajuste de cada fármaco prescrito.",
        ],
        text: `Clearance de creatinina estimado (Cockcroft-Gault): ${crcl} mL/min — ${band.label}.`,
      };
    },
  },
  {
    id: "ckdepi",
    name: "Taxa de filtração glomerular (CKD-EPI 2021)",
    short: "TFG estimada",
    category: "renal",
    profiles: ["nefropata", "geriatrico"],
    reference: "CKD-EPI 2021 (sem coeficiente de raça)",
    fields: [
      { key: "age", label: "Idade", kind: "number", unit: "anos", autofill: "age" },
      { key: "cr", label: "Creatinina sérica", kind: "number", unit: "mg/dL" },
      { key: "sex", label: "Sexo", kind: "select", options: SEX_OPTIONS, autofill: "sex" },
    ],
    compute: (v) => {
      const age = num(v, "age");
      const cr = num(v, "cr");
      const sex = str(v, "sex");
      if (!age || !cr || !sex) return null;
      const tfg = r1(ckdEpi2021(age, cr, sex));
      const band = renalBand(tfg);
      return {
        headline: `${tfg} mL/min/1,73m²`,
        interpretation: band.label,
        tone: band.tone,
        text: `TFG estimada (CKD-EPI 2021): ${tfg} mL/min/1,73m² — ${band.label}.`,
      };
    },
  },
  {
    id: "renal-dose",
    name: "Dose ajustada por clearance renal",
    short: "Ajuste renal de dose",
    category: "dose",
    profiles: ["nefropata", "geriatrico"],
    reference: "Ajuste proporcional — sempre confrontar com a bula do fármaco",
    fields: [
      { key: "crcl", label: "Clearance de creatinina", kind: "number", unit: "mL/min" },
      { key: "dose", label: "Dose habitual", kind: "number", unit: "mg" },
      {
        key: "band",
        label: "Regra de ajuste do fármaco",
        kind: "select",
        options: [
          { value: "50", label: "Reduzir 50% se ClCr < 50" },
          { value: "30", label: "Reduzir 50% se ClCr < 30" },
          { value: "interval", label: "Manter dose e dobrar intervalo se ClCr < 30" },
        ],
      },
    ],
    compute: (v) => {
      const crcl = num(v, "crcl");
      const dose = num(v, "dose");
      const band = str(v, "band");
      if (!crcl || !dose || !band) return null;
      if (band === "interval") {
        const need = crcl < 30;
        return {
          headline: need ? `${dose} mg com intervalo dobrado` : `${dose} mg — intervalo habitual`,
          interpretation: need ? "Espaçar as tomadas" : "Sem necessidade de espaçamento",
          tone: need ? "warning" : "neutral",
          text: `Ajuste renal: ${dose} mg${need ? " com intervalo dobrado" : " em intervalo habitual"} (ClCr ${crcl} mL/min).`,
        };
      }
      const limit = parseFloat(band);
      const need = crcl < limit;
      const adjusted = need ? r1(dose / 2) : dose;
      return {
        headline: `${adjusted} mg por tomada`,
        interpretation: need ? `Dose reduzida (ClCr < ${limit})` : "Dose plena mantida",
        tone: need ? "warning" : "neutral",
        details: need ? ["Reavaliar função renal e resposta clínica em 48–72h."] : undefined,
        text: `Ajuste renal: ${adjusted} mg por tomada (ClCr ${crcl} mL/min, regra < ${limit} mL/min).`,
      };
    },
  },
  {
    id: "bsa-dose",
    name: "Dose por área de superfície corporal",
    short: "Dose por m² (ASC)",
    category: "oncologico",
    profiles: ["oncologico", "pediatrico"],
    reference: "Mosteller, 1987",
    fields: [
      { key: "height", label: "Altura", kind: "number", unit: "cm" },
      { key: "weight", label: "Peso", kind: "number", unit: "kg", autofill: "weight" },
      { key: "perM2", label: "Dose prescrita", kind: "number", unit: "mg/m²", optional: true },
    ],
    compute: (v) => {
      const h = num(v, "height");
      const w = num(v, "weight");
      const perM2 = num(v, "perM2");
      if (!h || !w) return null;
      const bsa = r2(bsaMosteller(h, w));
      const total = Number.isFinite(perM2) ? r1(bsa * perM2) : null;
      return {
        headline: total !== null ? `${total} mg (ASC ${bsa} m²)` : `${bsa} m²`,
        interpretation: total !== null ? "Dose total calculada pela superfície corporal" : "Área de superfície corporal",
        tone: "info",
        details: ["Dupla checagem obrigatória em quimioterapia."],
        text:
          total !== null
            ? `ASC ${bsa} m² — dose calculada ${total} mg (${perM2} mg/m²).`
            : `Área de superfície corporal: ${bsa} m².`,
      };
    },
  },
  {
    id: "carboplatina-auc",
    name: "Carboplatina — fórmula de Calvert (AUC)",
    short: "Carboplatina AUC",
    category: "oncologico",
    profiles: ["oncologico", "nefropata"],
    reference: "Calvert et al., 1989",
    fields: [
      { key: "auc", label: "AUC alvo", kind: "number", unit: "mg/mL·min" },
      { key: "gfr", label: "TFG / clearance", kind: "number", unit: "mL/min" },
    ],
    compute: (v) => {
      const auc = num(v, "auc");
      const gfr = num(v, "gfr");
      if (!auc || !gfr) return null;
      const capped = Math.min(gfr, 125);
      const dose = Math.round(auc * (capped + 25));
      return {
        headline: `${dose} mg`,
        interpretation: `AUC ${auc} com TFG ${capped} mL/min`,
        tone: "warning",
        details: gfr > 125 ? ["TFG limitada a 125 mL/min para evitar superdose."] : undefined,
        text: `Carboplatina (Calvert): ${dose} mg — AUC ${auc}, TFG ${capped} mL/min.`,
      };
    },
  },
  {
    id: "chads-vasc",
    name: "CHA₂DS₂-VASc — risco tromboembólico na FA",
    short: "CHA₂DS₂-VASc",
    category: "cardio",
    profiles: ["cardiopata", "geriatrico"],
    reference: "ESC — fibrilação atrial",
    fields: [
      { key: "icc", label: "Insuficiência cardíaca / disfunção de VE", kind: "select", options: [{ value: "0", label: "Não" }, { value: "1", label: "Sim" }] },
      { key: "hta", label: "Hipertensão arterial", kind: "select", options: [{ value: "0", label: "Não" }, { value: "1", label: "Sim" }] },
      { key: "age", label: "Idade", kind: "number", unit: "anos", autofill: "age" },
      { key: "dm", label: "Diabetes", kind: "select", options: [{ value: "0", label: "Não" }, { value: "1", label: "Sim" }] },
      { key: "avc", label: "AVC/AIT/tromboembolismo prévio", kind: "select", options: [{ value: "0", label: "Não" }, { value: "2", label: "Sim" }] },
      { key: "vasc", label: "Doença vascular", kind: "select", options: [{ value: "0", label: "Não" }, { value: "1", label: "Sim" }] },
      { key: "sex", label: "Sexo", kind: "select", options: SEX_OPTIONS, autofill: "sex" },
    ],
    compute: (v) => {
      const age = num(v, "age");
      if (!age) return null;
      const agePts = age >= 75 ? 2 : age >= 65 ? 1 : 0;
      const sexPts = str(v, "sex") === "F" ? 1 : 0;
      const score =
        num(v, "icc") + num(v, "hta") + num(v, "dm") + num(v, "avc") + num(v, "vasc") + agePts + sexPts;
      if (!Number.isFinite(score)) return null;
      const high = score >= 2;
      return {
        headline: `${score} ponto${score === 1 ? "" : "s"}`,
        interpretation: high
          ? "Anticoagulação oral indicada (risco alto)"
          : score === 1
          ? "Considerar anticoagulação (risco intermediário)"
          : "Risco baixo — anticoagulação geralmente não indicada",
        tone: high ? "danger" : score === 1 ? "warning" : "neutral",
        details: high ? ["Calcule o clearance de creatinina antes de definir a dose do anticoagulante."] : undefined,
        text: `CHA₂DS₂-VASc: ${score} ponto(s).`,
      };
    },
  },
  {
    id: "hasbled",
    name: "HAS-BLED — risco de sangramento",
    short: "HAS-BLED",
    category: "cardio",
    profiles: ["cardiopata", "geriatrico", "hepatopata"],
    reference: "Pisters et al., 2010",
    fields: [
      { key: "h", label: "Hipertensão não controlada", kind: "select", options: [{ value: "0", label: "Não" }, { value: "1", label: "Sim" }] },
      { key: "a", label: "Disfunção renal ou hepática", kind: "select", options: [{ value: "0", label: "Nenhuma" }, { value: "1", label: "Uma" }, { value: "2", label: "Ambas" }] },
      { key: "s", label: "AVC prévio", kind: "select", options: [{ value: "0", label: "Não" }, { value: "1", label: "Sim" }] },
      { key: "b", label: "Sangramento prévio / predisposição", kind: "select", options: [{ value: "0", label: "Não" }, { value: "1", label: "Sim" }] },
      { key: "l", label: "INR lábil", kind: "select", options: [{ value: "0", label: "Não" }, { value: "1", label: "Sim" }] },
      { key: "e", label: "Idade > 65 anos", kind: "select", options: [{ value: "0", label: "Não" }, { value: "1", label: "Sim" }] },
      { key: "d", label: "Drogas (AINE/antiagregante) ou álcool", kind: "select", options: [{ value: "0", label: "Nenhum" }, { value: "1", label: "Um" }, { value: "2", label: "Ambos" }] },
    ],
    compute: (v) => {
      const keys = ["h", "a", "s", "b", "l", "e", "d"];
      const score = keys.reduce((acc, k) => acc + (num(v, k) || 0), 0);
      const high = score >= 3;
      return {
        headline: `${score} ponto${score === 1 ? "" : "s"}`,
        interpretation: high ? "Risco alto de sangramento" : "Risco baixo a moderado",
        tone: high ? "danger" : "neutral",
        details: high
          ? ["Score alto não contraindica anticoagulação — corrija os fatores modificáveis e reavalie."]
          : undefined,
        text: `HAS-BLED: ${score} ponto(s).`,
      };
    },
  },
  {
    id: "rcri",
    name: "Risco cardíaco cirúrgico (RCRI / Lee)",
    short: "RCRI cirúrgico",
    category: "cirurgico",
    profiles: ["cardiopata", "geriatrico"],
    reference: "Lee et al., 1999 — Revised Cardiac Risk Index",
    fields: [
      { key: "cir", label: "Cirurgia de alto risco (intraperitoneal, intratorácica, vascular suprainguinal)", kind: "select", options: [{ value: "0", label: "Não" }, { value: "1", label: "Sim" }] },
      { key: "dac", label: "Doença arterial coronariana", kind: "select", options: [{ value: "0", label: "Não" }, { value: "1", label: "Sim" }] },
      { key: "icc", label: "Insuficiência cardíaca", kind: "select", options: [{ value: "0", label: "Não" }, { value: "1", label: "Sim" }] },
      { key: "avc", label: "Doença cerebrovascular", kind: "select", options: [{ value: "0", label: "Não" }, { value: "1", label: "Sim" }] },
      { key: "dm", label: "Diabetes em insulina", kind: "select", options: [{ value: "0", label: "Não" }, { value: "1", label: "Sim" }] },
      { key: "cr", label: "Creatinina > 2,0 mg/dL", kind: "select", options: [{ value: "0", label: "Não" }, { value: "1", label: "Sim" }] },
    ],
    compute: (v) => {
      const score = ["cir", "dac", "icc", "avc", "dm", "cr"].reduce((a, k) => a + (num(v, k) || 0), 0);
      const risk = score === 0 ? "3,9%" : score === 1 ? "6,0%" : score === 2 ? "10,1%" : "15% ou mais";
      const tone: ResultTone = score >= 2 ? "danger" : score === 1 ? "warning" : "neutral";
      return {
        headline: `${score} ponto${score === 1 ? "" : "s"}`,
        interpretation: `Risco estimado de evento cardíaco maior: ${risk}`,
        tone,
        details: score >= 2 ? ["Considerar avaliação cardiológica pré-operatória e monitorização estendida."] : undefined,
        text: `RCRI: ${score} ponto(s) — risco de evento cardíaco maior ${risk}.`,
      };
    },
  },
  {
    id: "child-pugh",
    name: "Child-Pugh — reserva hepática",
    short: "Child-Pugh",
    category: "hepatico",
    profiles: ["hepatopata", "oncologico"],
    reference: "Pugh et al., 1973",
    fields: [
      { key: "bili", label: "Bilirrubina total", kind: "number", unit: "mg/dL" },
      { key: "alb", label: "Albumina", kind: "number", unit: "g/dL" },
      { key: "inr", label: "INR", kind: "number" },
      { key: "ascite", label: "Ascite", kind: "select", options: [{ value: "1", label: "Ausente" }, { value: "2", label: "Leve" }, { value: "3", label: "Moderada/tensa" }] },
      { key: "enc", label: "Encefalopatia", kind: "select", options: [{ value: "1", label: "Ausente" }, { value: "2", label: "Grau I–II" }, { value: "3", label: "Grau III–IV" }] },
    ],
    compute: (v) => {
      const bili = num(v, "bili");
      const alb = num(v, "alb");
      const inr = num(v, "inr");
      const ascite = num(v, "ascite");
      const enc = num(v, "enc");
      if (![bili, alb, inr, ascite, enc].every(Number.isFinite)) return null;
      const p = (n: number, a: number, b: number) => (n < a ? 1 : n <= b ? 2 : 3);
      const score = p(bili, 2, 3) + (alb > 3.5 ? 1 : alb >= 2.8 ? 2 : 3) + p(inr, 1.7, 2.3) + ascite + enc;
      const cls = score <= 6 ? "A" : score <= 9 ? "B" : "C";
      return {
        headline: `${score} pontos — Child ${cls}`,
        interpretation:
          cls === "A"
            ? "Reserva hepática preservada"
            : cls === "B"
            ? "Disfunção moderada — reduzir doses de fármacos de metabolismo hepático"
            : "Disfunção grave — evitar hepatotóxicos e sedativos de longa ação",
        tone: cls === "A" ? "neutral" : cls === "B" ? "warning" : "danger",
        text: `Child-Pugh: ${score} pontos (classe ${cls}).`,
      };
    },
  },
  {
    id: "diuretico-ic",
    name: "Ajuste de diurético na IC descompensada",
    short: "Diurético na IC",
    category: "cardio",
    profiles: ["cardiopata", "nefropata", "geriatrico"],
    reference: "DOSE trial / diretriz de IC — furosemida IV 1–2,5× a dose oral domiciliar",
    fields: [
      { key: "oral", label: "Dose oral domiciliar de furosemida", kind: "number", unit: "mg/dia" },
      { key: "crcl", label: "Clearance de creatinina", kind: "number", unit: "mL/min" },
      {
        key: "resposta",
        label: "Resposta prévia ao diurético",
        kind: "select",
        options: [
          { value: "boa", label: "Boa diurese com dose habitual" },
          { value: "parcial", label: "Resposta parcial" },
          { value: "refrataria", label: "Refratária / congestão persistente" },
        ],
      },
      { key: "peso", label: "Ganho de peso desde o peso seco", kind: "number", unit: "kg", optional: true },
    ],
    compute: (v) => {
      const oral = num(v, "oral");
      const crcl = num(v, "crcl");
      const resposta = str(v, "resposta");
      const ganho = num(v, "peso");
      if (!oral || !crcl || !resposta) return null;
      let factor = resposta === "refrataria" ? 2.5 : resposta === "parcial" ? 2 : 1.5;
      if (crcl < 30) factor = Math.max(factor, 2.5);
      const ivDaily = Math.round(oral * factor);
      const perDose = Math.round(ivDaily / 2);
      const details = [
        `Sugestão: furosemida ${perDose} mg IV de 12/12h (total ${ivDaily} mg/dia).`,
        "Meta de diurese: 3–5 L nas primeiras 24h com controle de peso diário.",
        "Reavaliar eletrólitos e creatinina em 24h.",
      ];
      if (crcl < 30) details.push("ClCr < 30: pode exigir infusão contínua ou associação de tiazídico.");
      if (Number.isFinite(ganho) && ganho > 0)
        details.push(`Ganho de ${ganho} kg desde o peso seco — meta de perda de 0,5–1 kg/dia.`);
      return {
        headline: `${ivDaily} mg/dia IV`,
        interpretation: `Equivalente a ${factor}× a dose oral domiciliar`,
        tone: crcl < 30 || resposta === "refrataria" ? "danger" : "warning",
        details,
        text: `Furosemida ${perDose} mg IV 12/12h (${ivDaily} mg/dia) — ajuste por dose domiciliar ${oral} mg/dia, ClCr ${crcl} mL/min, resposta ${resposta}.`,
      };
    },
  },
  {
    id: "peso-ideal",
    name: "Peso ideal e peso de dose (obeso/gestante)",
    short: "Peso ideal / IMC",
    category: "obstetrico",
    profiles: ["obstetrico", "geriatrico"],
    reference: "Devine, 1974 — peso ajustado para fármacos hidrofílicos",
    fields: [
      { key: "height", label: "Altura", kind: "number", unit: "cm" },
      { key: "weight", label: "Peso atual", kind: "number", unit: "kg", autofill: "weight" },
      { key: "sex", label: "Sexo", kind: "select", options: SEX_OPTIONS, autofill: "sex" },
    ],
    compute: (v) => {
      const h = num(v, "height");
      const w = num(v, "weight");
      const sex = str(v, "sex");
      if (!h || !w || !sex) return null;
      const ibw = r1(idealBodyWeight(h, sex));
      const adj = r1(ibw + 0.4 * (w - ibw));
      const imc = r1(w / Math.pow(h / 100, 2));
      return {
        headline: `Ideal ${ibw} kg · ajustado ${adj} kg`,
        interpretation: `IMC ${imc} kg/m²`,
        tone: imc >= 30 ? "warning" : "neutral",
        details: [
          "Fármacos hidrofílicos (aminoglicosídeos, heparina) — usar peso ajustado.",
          "Na gestação, prefira o peso pré-gestacional para cálculo de dose.",
        ],
        text: `Peso ideal ${ibw} kg, peso ajustado ${adj} kg, IMC ${imc} kg/m².`,
      };
    },
  },
  {
    id: "dose-peso",
    name: "Dose pediátrica por peso",
    short: "Dose mg/kg",
    category: "pediatrico",
    profiles: ["pediatrico"],
    reference: "Cálculo mg/kg com teto de dose máxima diária",
    fields: [
      { key: "weight", label: "Peso", kind: "number", unit: "kg", autofill: "weight" },
      { key: "mgkg", label: "Dose", kind: "number", unit: "mg/kg/dia" },
      {
        key: "tomadas",
        label: "Tomadas por dia",
        kind: "select",
        options: [1, 2, 3, 4].map((n) => ({ value: String(n), label: `${n}x ao dia` })),
      },
      { key: "max", label: "Dose máxima diária", kind: "number", unit: "mg", optional: true },
    ],
    compute: (v) => {
      const w = num(v, "weight");
      const mgkg = num(v, "mgkg");
      const tomadas = num(v, "tomadas");
      const max = num(v, "max");
      if (!w || !mgkg || !tomadas) return null;
      let total = r1(mgkg * w);
      const capped = Number.isFinite(max) && total > max;
      if (capped) total = max;
      const perDose = r1(total / tomadas);
      const interval = Math.round(24 / tomadas);
      return {
        headline: `${perDose} mg de ${interval}/${interval}h`,
        interpretation: `Total ${total} mg/dia${capped ? " (limitado pela dose máxima)" : ""}`,
        tone: capped ? "warning" : "info",
        text: `${perDose} mg de ${interval}/${interval}h (total ${total} mg/dia — ${mgkg} mg/kg/dia para ${w} kg).`,
      };
    },
  },
];

export const getCalculator = (id: string) => CALCULATORS.find((c) => c.id === id) ?? null;

export const CATEGORY_LABEL: Record<CalculatorCategory, string> = {
  renal: "Função renal",
  dose: "Ajuste de dose",
  cardio: "Cardiovascular",
  hepatico: "Hepático",
  cirurgico: "Risco cirúrgico",
  pediatrico: "Pediatria",
  obstetrico: "Obstetrícia / peso",
  oncologico: "Oncologia",
};
