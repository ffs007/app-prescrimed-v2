import type { MedicationV2 } from "../../types/clinical";

/**
 * Antidiabéticos orais com cobertura clínica v2.
 * Fontes: Diretrizes SBD 2024, ADA Standards of Care 2024, bulas ANVISA.
 */

const META = { verifiedBy: "lovable-curation", lastReviewed: "2026-04-21" } as const;

export const antidiabeticsV2: MedicationV2[] = [
  {
    id: 11,
    name: "Metformina 850mg",
    dosage: "1 comprimido 2x/dia",
    instructions: "uso contínuo",
    category: "Antidiabéticos",
    safeForPregnant: false,
    pregnancyRisk: "B",
    activeIngredient: "cloridrato-de-metformina",
    therapeuticClass: "biguanida",
    atcCode: "A10BA02",
    requiresRenalReview: true,
    presentations: [
      { id: "comp-500", form: "comprimido", strength: 500, unit: "mg", routes: ["oral"], label: "500 mg comprimido" },
      { id: "comp-850", form: "comprimido", strength: 850, unit: "mg", routes: ["oral"], label: "850 mg comprimido" },
      { id: "comp-1000", form: "comprimido", strength: 1000, unit: "mg", routes: ["oral"], label: "1000 mg comprimido" },
    ],
    adultDose: { amount: 850, unit: "mg", intervalHours: 12, maxDailyAmount: 2550, notes: "Tomar com ou após refeições para reduzir efeitos GI." },
    pregnancy: { category: "B", severity: "caution", message: "Pode ser usada na gestação sob avaliação; insulina segue padrão-ouro." },
    renal: [
      { fromSeverity: "moderada", severity: "caution", message: "ClCr 30-45 mL/min: reduzir para 1000 mg/dia.", adjustment: "Suspender se ClCr <30 mL/min." },
      { fromSeverity: "grave", severity: "contraindicated", message: "Contraindicada — risco de acidose láctica." },
    ],
    interactions: [
      { withClass: "contraste-iodado", severity: "caution", message: "Suspender 48h antes/depois de contraste IV." },
    ],
    ...META,
  },
  {
    id: 47,
    name: "Glibenclamida 5mg",
    dosage: "1 comprimido 1x/dia",
    instructions: "uso contínuo",
    category: "Antidiabéticos",
    safeForPregnant: false,
    pregnancyRisk: "C",
    activeIngredient: "glibenclamida",
    therapeuticClass: "sulfonilureia",
    atcCode: "A10BB01",
    requiresRenalReview: true,
    presentations: [
      { id: "comp-5", form: "comprimido", strength: 5, unit: "mg", routes: ["oral"], label: "5 mg comprimido" },
    ],
    adultDose: { amount: 5, unit: "mg", intervalHours: 24, maxDailyAmount: 20, notes: "Tomar 30 min antes do café — risco de hipoglicemia." },
    pregnancy: { category: "C", severity: "avoid", message: "Risco de hipoglicemia neonatal — preferir insulina." },
    renal: [{ fromSeverity: "moderada", severity: "avoid", message: "Risco elevado de hipoglicemia prolongada — evitar." }],
    interactions: [
      { withClass: "betabloqueador-nao-seletivo", severity: "caution", message: "Pode mascarar sinais de hipoglicemia." },
    ],
    ...META,
  },
  {
    id: 48,
    name: "Gliclazida 30mg",
    dosage: "1 comprimido 1x/dia",
    instructions: "uso contínuo",
    category: "Antidiabéticos",
    safeForPregnant: false,
    pregnancyRisk: "C",
    activeIngredient: "gliclazida",
    therapeuticClass: "sulfonilureia",
    atcCode: "A10BB09",
    requiresRenalReview: true,
    presentations: [
      { id: "comp-30", form: "comprimido", strength: 30, unit: "mg", routes: ["oral"], label: "30 mg MR comprimido" },
      { id: "comp-60", form: "comprimido", strength: 60, unit: "mg", routes: ["oral"], label: "60 mg MR comprimido" },
    ],
    adultDose: { amount: 30, unit: "mg", intervalHours: 24, maxDailyAmount: 120, notes: "Tomar com café da manhã." },
    pregnancy: { category: "C", severity: "avoid", message: "Preferir insulina na gestação." },
    renal: [{ fromSeverity: "grave", severity: "avoid", message: "Risco de hipoglicemia prolongada." }],
    ...META,
  },
];
