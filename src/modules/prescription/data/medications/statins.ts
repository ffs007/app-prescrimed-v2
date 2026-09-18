import type { MedicationV2 } from "../../types/clinical";

/**
 * Estatinas com cobertura clínica v2.
 * Fontes: Diretriz SBC de Dislipidemia 2017/2023, bulas ANVISA.
 */

const META = { verifiedBy: "lovable-curation", lastReviewed: "2026-04-21" } as const;

export const statinsV2: MedicationV2[] = [
  {
    id: 14,
    name: "Sinvastatina 20mg",
    dosage: "1 comprimido à noite",
    instructions: "uso contínuo",
    category: "Estatinas",
    safeForPregnant: false,
    pregnancyRisk: "X",
    activeIngredient: "sinvastatina",
    therapeuticClass: "estatinas",
    atcCode: "C10AA01",
    presentations: [
      { id: "comp-10", form: "comprimido", strength: 10, unit: "mg", routes: ["oral"], label: "10 mg comprimido" },
      { id: "comp-20", form: "comprimido", strength: 20, unit: "mg", routes: ["oral"], label: "20 mg comprimido" },
      { id: "comp-40", form: "comprimido", strength: 40, unit: "mg", routes: ["oral"], label: "40 mg comprimido" },
    ],
    adultDose: { amount: 20, unit: "mg", intervalHours: 24, maxDailyAmount: 40, notes: "Tomar à noite — biossíntese hepática de colesterol é noturna." },
    pregnancy: { category: "X", severity: "contraindicated", message: "Contraindicada na gestação — suspender antes de engravidar." },
    interactions: [
      { withClass: "antibiotico-macrolideo", severity: "avoid", message: "Risco grave de rabdomiólise (azitromicina/claritromicina)." },
      { withClass: "bcc-dihidropiridinico", severity: "caution", message: "Anlodipino aumenta exposição — limitar sinvastatina a 20 mg/dia." },
      { withClass: "fibratos", severity: "caution", message: "Risco aumentado de miopatia." },
    ],
    ...META,
  },
  {
    id: 49,
    name: "Atorvastatina 20mg",
    dosage: "1 comprimido à noite",
    instructions: "uso contínuo",
    category: "Estatinas",
    safeForPregnant: false,
    pregnancyRisk: "X",
    activeIngredient: "atorvastatina-calcica",
    therapeuticClass: "estatinas",
    atcCode: "C10AA05",
    presentations: [
      { id: "comp-10", form: "comprimido", strength: 10, unit: "mg", routes: ["oral"], label: "10 mg comprimido" },
      { id: "comp-20", form: "comprimido", strength: 20, unit: "mg", routes: ["oral"], label: "20 mg comprimido" },
      { id: "comp-40", form: "comprimido", strength: 40, unit: "mg", routes: ["oral"], label: "40 mg comprimido" },
      { id: "comp-80", form: "comprimido", strength: 80, unit: "mg", routes: ["oral"], label: "80 mg comprimido" },
    ],
    adultDose: { amount: 20, unit: "mg", intervalHours: 24, maxDailyAmount: 80, notes: "Pode ser tomada em qualquer horário." },
    pregnancy: { category: "X", severity: "contraindicated", message: "Contraindicada — suspender antes de engravidar." },
    interactions: [
      { withClass: "antibiotico-macrolideo", severity: "caution", message: "Risco aumentado de miopatia." },
      { withClass: "fibratos", severity: "caution", message: "Risco aumentado de rabdomiólise." },
    ],
    ...META,
  },
];
