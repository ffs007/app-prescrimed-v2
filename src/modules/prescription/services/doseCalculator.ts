import type { Medication } from "../types/prescription";

/**
 * Concentrações de suspensões/xaropes pediátricos (mg por mL).
 * Chaves comparadas case-insensitive como substring do nome do medicamento.
 */
export const PEDIATRIC_CONCENTRATION: Record<string, { mgPerMl: number; form: string }> = {
  amoxicilina: { mgPerMl: 50, form: "suspensão 250mg/5mL" },
  azitromicina: { mgPerMl: 40, form: "suspensão 200mg/5mL" },
  cefalexina: { mgPerMl: 50, form: "suspensão 250mg/5mL" },
  ibuprofeno: { mgPerMl: 20, form: "suspensão 100mg/5mL" },
  dipirona: { mgPerMl: 50, form: "gotas 500mg/mL" },
  paracetamol: { mgPerMl: 40, form: "gotas 200mg/mL" },
  prednisolona: { mgPerMl: 3, form: "xarope 3mg/mL" },
  prednisona: { mgPerMl: 1, form: "solução 1mg/mL" },
  dexametasona: { mgPerMl: 0.5, form: "elixir 0.5mg/5mL" },
  omeprazol: { mgPerMl: 2, form: "suspensão 2mg/mL" },
  loratadina: { mgPerMl: 1, form: "xarope 1mg/mL" },
  desloratadina: { mgPerMl: 0.5, form: "xarope 0.5mg/mL" },
  cetirizina: { mgPerMl: 1, form: "gotas 10mg/mL" },
  nimesulida: { mgPerMl: 10, form: "suspensão 50mg/5mL" },
  diclofenaco: { mgPerMl: 0.5, form: "gotas 0.5mg/gota" },
  metronidazol: { mgPerMl: 8, form: "suspensão 40mg/5mL" },
  sulfametoxazol: { mgPerMl: 8, form: "suspensão 200/40mg por 5mL" },
  albendazol: { mgPerMl: 8, form: "suspensão 40mg/mL" },
  mebendazol: { mgPerMl: 20, form: "suspensão 100mg/5mL" },
  domperidona: { mgPerMl: 1, form: "suspensão 1mg/mL" },
  metoclopramida: { mgPerMl: 0.8, form: "gotas 4mg/mL" },
  ondansetrona: { mgPerMl: 0.8, form: "xarope 4mg/5mL" },
  ambroxol: { mgPerMl: 3, form: "xarope pediátrico 15mg/5mL" },
  acetilcisteína: { mgPerMl: 20, form: "xarope 20mg/mL" },
  salbutamol: { mgPerMl: 0.4, form: "xarope 2mg/5mL" },
  clindamicina: { mgPerMl: 15, form: "suspensão 75mg/5mL" },
  fluoxetina: { mgPerMl: 4, form: "solução 20mg/5mL" },
  hidroxizina: { mgPerMl: 2, form: "xarope 2mg/mL" },
  propranolol: { mgPerMl: 1, form: "solução 1mg/mL" },
  escopolamina: { mgPerMl: 0.667, form: "gotas 6.67mg/mL" },
  "sulfato ferroso": { mgPerMl: 5, form: "gotas 125mg/mL (25mg Fe/mL)" },
  simeticona: { mgPerMl: 75, form: "gotas 75mg/mL" },
};

export const findConcentration = (medName: string) => {
  const lower = medName.toLowerCase();
  for (const [key, val] of Object.entries(PEDIATRIC_CONCENTRATION)) {
    if (lower.includes(key)) return val;
  }
  return null;
};

/**
 * Calcula dose pediátrica em texto formatado, baseado no peso do paciente
 * e na string de dose pediátrica do medicamento (ex: "50mg/kg/dia dividido em 3 doses").
 */
export const calcPediatricDose = (med: Medication, weightKg: number): string => {
  const pediatricDose = med.pediatricDose!;
  const conc = findConcentration(med.name);

  const mgPerKgDayMatch = pediatricDose.match(/(\d+(?:[.,]\d+)?)\s*mg\/kg\/d(?:ia|ose)/i);
  const dividedMatch = pediatricDose.match(/dividid[oa]\s+em\s+(\d+)\s+doses?/i);
  const perDoseMatch = pediatricDose.match(/(\d+(?:[.,]\d+)?)\s*mg\/kg\/dose\s+de\s+(\d+)\/(\d+)h/i);
  const singleDoseMatch = pediatricDose.match(/(\d+(?:[.,]\d+)?)\s*mg\/kg\/dia\s+dose\s+[úu]nica/i);
  const dropMatch = pediatricDose.match(/(\d+)\s*gota\/kg/i);

  const toMl = (mg: number): string => {
    if (!conc) return `${mg}mg`;
    const ml = Math.round((mg / conc.mgPerMl) * 10) / 10;
    return `${ml}mL (${conc.form})`;
  };

  if (perDoseMatch) {
    const mgPerKg = parseFloat(perDoseMatch[1].replace(",", "."));
    const interval = perDoseMatch[2];
    const dosePerTake = Math.round(mgPerKg * weightKg * 10) / 10;
    return `${toMl(dosePerTake)} de ${interval}/${interval}h`;
  }

  if (singleDoseMatch) {
    const mgPerKg = parseFloat(singleDoseMatch[1].replace(",", "."));
    const totalDose = Math.round(mgPerKg * weightKg * 10) / 10;
    return `${toMl(totalDose)} dose única ao dia`;
  }

  if (mgPerKgDayMatch) {
    const mgPerKg = parseFloat(mgPerKgDayMatch[1].replace(",", "."));
    const totalDay = Math.round(mgPerKg * weightKg * 10) / 10;
    if (dividedMatch) {
      const doses = parseInt(dividedMatch[1]);
      const perTake = Math.round((totalDay / doses) * 10) / 10;
      const interval = Math.round(24 / doses);
      return `${toMl(perTake)} de ${interval}/${interval}h`;
    }
    return `${toMl(totalDay)} ao dia`;
  }

  if (dropMatch) {
    const dropsPerKg = parseInt(dropMatch[1]);
    const totalDrops = Math.round(dropsPerKg * weightKg);
    const intervalMatch = pediatricDose.match(/de\s+(\d+)\/(\d+)h/i);
    const interval = intervalMatch ? `de ${intervalMatch[1]}/${intervalMatch[2]}h` : "";
    return `${totalDrops} gotas ${interval}`.trim();
  }

  return pediatricDose;
};
