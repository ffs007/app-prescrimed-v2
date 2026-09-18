import type { Medication, Pathology } from "@/types/prescription";

export const DEFAULT_MEDICATIONS: Medication[] = [
  // Antibióticos — Receita branca 2 vias
  { id: 1, name: "Amoxicilina 500mg", dosage: "1 cápsula de 8/8h", instructions: "por 7 dias", category: "Antibióticos", prescriptionType: "branca2vias", pediatricDose: "50mg/kg/dia dividido em 3 doses", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 2, name: "Azitromicina 500mg", dosage: "1 comprimido 1x/dia", instructions: "por 3 dias", category: "Antibióticos", prescriptionType: "branca2vias", pediatricDose: "10mg/kg/dia dose única", safeForPregnant: false, pregnancyRisk: "B" },
  { id: 9, name: "Cefalexina 500mg", dosage: "1 cápsula de 6/6h", instructions: "por 7 dias", category: "Antibióticos", prescriptionType: "branca2vias", pediatricDose: "50mg/kg/dia dividido em 4 doses", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 16, name: "Ciprofloxacino 500mg", dosage: "1 comprimido de 12/12h", instructions: "por 7 dias", category: "Antibióticos", prescriptionType: "branca2vias", pediatricDose: "Não recomendado", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 17, name: "Metronidazol 400mg", dosage: "1 comprimido de 8/8h", instructions: "por 7 dias", category: "Antibióticos", prescriptionType: "branca2vias", pediatricDose: "30mg/kg/dia dividido em 3 doses", safeForPregnant: false, pregnancyRisk: "B" },
  { id: 18, name: "Sulfametoxazol+Trimetoprima 800/160mg", dosage: "1 comprimido de 12/12h", instructions: "por 7 dias", category: "Antibióticos", prescriptionType: "branca2vias", pediatricDose: "40mg/kg/dia (sulfa) dividido em 2 doses", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 19, name: "Levofloxacino 500mg", dosage: "1 comprimido 1x/dia", instructions: "por 7 dias", category: "Antibióticos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 20, name: "Clindamicina 300mg", dosage: "1 cápsula de 8/8h", instructions: "por 7 dias", category: "Antibióticos", prescriptionType: "branca2vias", pediatricDose: "25mg/kg/dia dividido em 3 doses", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 21, name: "Doxiciclina 100mg", dosage: "1 comprimido de 12/12h", instructions: "por 7 dias", category: "Antibióticos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 22, name: "Norfloxacino 400mg", dosage: "1 comprimido de 12/12h", instructions: "por 7 dias", category: "Antibióticos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },

  // Anti-inflamatórios
  { id: 3, name: "Ibuprofeno 600mg", dosage: "1 comprimido de 8/8h", instructions: "por 5 dias se dor", category: "Anti-inflamatórios", pediatricDose: "10mg/kg/dose de 8/8h", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 23, name: "Nimesulida 100mg", dosage: "1 comprimido de 12/12h", instructions: "por 5 dias", category: "Anti-inflamatórios", pediatricDose: "Não recomendado < 12 anos", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 24, name: "Diclofenaco 50mg", dosage: "1 comprimido de 8/8h", instructions: "por 5 dias", category: "Anti-inflamatórios", pediatricDose: "2-3mg/kg/dia dividido em 3 doses", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 25, name: "Meloxicam 15mg", dosage: "1 comprimido 1x/dia", instructions: "por 7 dias", category: "Anti-inflamatórios", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 26, name: "Cetoprofeno 100mg", dosage: "1 comprimido de 12/12h", instructions: "por 5 dias", category: "Anti-inflamatórios", safeForPregnant: false, pregnancyRisk: "C" },

  // Analgésicos
  { id: 4, name: "Dipirona 500mg", dosage: "1 comprimido de 6/6h", instructions: "se dor ou febre", category: "Analgésicos", pediatricDose: "25mg/kg/dose de 6/6h", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 5, name: "Paracetamol 750mg", dosage: "1 comprimido de 6/6h", instructions: "se dor ou febre", category: "Analgésicos", pediatricDose: "15mg/kg/dose de 6/6h", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 27, name: "Tramadol 50mg", dosage: "1 cápsula de 8/8h", instructions: "se dor intensa", category: "Analgésicos", prescriptionType: "amarela", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 28, name: "Codeína 30mg", dosage: "1 comprimido de 6/6h", instructions: "se dor intensa", category: "Analgésicos", prescriptionType: "amarela", safeForPregnant: false, pregnancyRisk: "C" },

  // Gastro
  { id: 6, name: "Omeprazol 20mg", dosage: "1 cápsula em jejum", instructions: "por 30 dias", category: "Gastro", pediatricDose: "1mg/kg/dia", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 29, name: "Pantoprazol 40mg", dosage: "1 comprimido em jejum", instructions: "por 30 dias", category: "Gastro", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 30, name: "Ranitidina 150mg", dosage: "1 comprimido de 12/12h", instructions: "por 14 dias", category: "Gastro", pediatricDose: "4mg/kg/dia dividido em 2 doses", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 31, name: "Domperidona 10mg", dosage: "1 comprimido de 8/8h antes das refeições", instructions: "por 7 dias", category: "Gastro", pediatricDose: "0.25mg/kg/dose de 8/8h", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 32, name: "Metoclopramida 10mg", dosage: "1 comprimido de 8/8h", instructions: "por 5 dias", category: "Gastro", pediatricDose: "0.1-0.15mg/kg/dose", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 33, name: "Simeticona 125mg", dosage: "1 cápsula de 8/8h", instructions: "após as refeições", category: "Gastro", pediatricDose: "Gotas: 1 gota/kg de 8/8h", safeForPregnant: true, pregnancyRisk: "A" },
  { id: 34, name: "Loperamida 2mg", dosage: "2 comprimidos iniciais, depois 1 após cada evacuação", instructions: "máximo 8mg/dia", category: "Gastro", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 35, name: "Ondansetrona 8mg", dosage: "1 comprimido de 8/8h", instructions: "se náusea ou vômito", category: "Gastro", pediatricDose: "0.15mg/kg/dose de 8/8h", safeForPregnant: true, pregnancyRisk: "B" },

  // Antialérgicos
  { id: 7, name: "Loratadina 10mg", dosage: "1 comprimido 1x/dia", instructions: "por 7 dias", category: "Antialérgicos", pediatricDose: "5mg 1x/dia (2-6 anos)", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 36, name: "Desloratadina 5mg", dosage: "1 comprimido 1x/dia", instructions: "por 7 dias", category: "Antialérgicos", pediatricDose: "Xarope: 1.25mg 1x/dia (1-5 anos)", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 37, name: "Cetirizina 10mg", dosage: "1 comprimido 1x/dia", instructions: "por 7 dias", category: "Antialérgicos", pediatricDose: "5mg 1x/dia (2-6 anos)", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 38, name: "Fexofenadina 180mg", dosage: "1 comprimido 1x/dia", instructions: "por 7 dias", category: "Antialérgicos", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 39, name: "Hidroxizina 25mg", dosage: "1 comprimido de 8/8h", instructions: "por 5 dias", category: "Antialérgicos", pediatricDose: "1mg/kg/dia dividido em 3 doses", safeForPregnant: false, pregnancyRisk: "C" },

  // Corticoides
  { id: 8, name: "Prednisona 20mg", dosage: "1 comprimido 1x/dia pela manhã", instructions: "por 5 dias", category: "Corticoides", pediatricDose: "1-2mg/kg/dia", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 10, name: "Dexametasona 4mg", dosage: "1 comprimido 1x/dia", instructions: "por 3 dias", category: "Corticoides", pediatricDose: "0.15mg/kg/dose", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 40, name: "Prednisolona 5mg/mL (xarope)", dosage: "Conforme peso", instructions: "por 5 dias", category: "Corticoides", pediatricDose: "1-2mg/kg/dia", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 41, name: "Betametasona 0.5mg", dosage: "1 comprimido de 12/12h", instructions: "por 3 dias", category: "Corticoides", safeForPregnant: false, pregnancyRisk: "C" },

  // Anti-hipertensivos
  { id: 12, name: "Losartana 50mg", dosage: "1 comprimido 1x/dia", instructions: "uso contínuo", category: "Anti-hipertensivos", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 13, name: "Atenolol 50mg", dosage: "1 comprimido 1x/dia", instructions: "uso contínuo", category: "Anti-hipertensivos", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 42, name: "Enalapril 10mg", dosage: "1 comprimido 1x/dia", instructions: "uso contínuo", category: "Anti-hipertensivos", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 43, name: "Anlodipino 5mg", dosage: "1 comprimido 1x/dia", instructions: "uso contínuo", category: "Anti-hipertensivos", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 44, name: "Hidroclorotiazida 25mg", dosage: "1 comprimido 1x/dia pela manhã", instructions: "uso contínuo", category: "Anti-hipertensivos", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 45, name: "Propranolol 40mg", dosage: "1 comprimido de 12/12h", instructions: "uso contínuo", category: "Anti-hipertensivos", pediatricDose: "1mg/kg/dia dividido em 2 doses", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 46, name: "Valsartana 80mg", dosage: "1 comprimido 1x/dia", instructions: "uso contínuo", category: "Anti-hipertensivos", safeForPregnant: false, pregnancyRisk: "D" },

  // Antidiabéticos
  { id: 11, name: "Metformina 850mg", dosage: "1 comprimido 2x/dia", instructions: "uso contínuo", category: "Antidiabéticos", safeForPregnant: false, pregnancyRisk: "B" },
  { id: 47, name: "Glibenclamida 5mg", dosage: "1 comprimido 1x/dia", instructions: "uso contínuo", category: "Antidiabéticos", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 48, name: "Gliclazida 30mg", dosage: "1 comprimido 1x/dia", instructions: "uso contínuo", category: "Antidiabéticos", safeForPregnant: false, pregnancyRisk: "C" },

  // Estatinas
  { id: 14, name: "Sinvastatina 20mg", dosage: "1 comprimido à noite", instructions: "uso contínuo", category: "Estatinas", safeForPregnant: false, pregnancyRisk: "X" },
  { id: 49, name: "Atorvastatina 20mg", dosage: "1 comprimido à noite", instructions: "uso contínuo", category: "Estatinas", safeForPregnant: false, pregnancyRisk: "X" },
  { id: 50, name: "Rosuvastatina 10mg", dosage: "1 comprimido à noite", instructions: "uso contínuo", category: "Estatinas", safeForPregnant: false, pregnancyRisk: "X" },

  // Antifúngicos
  { id: 15, name: "Fluconazol 150mg", dosage: "1 cápsula dose única", instructions: "", category: "Antifúngicos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 51, name: "Nistatina 100.000 UI/mL (suspensão)", dosage: "1mL de 6/6h na boca", instructions: "por 14 dias", category: "Antifúngicos", pediatricDose: "1mL de 6/6h", safeForPregnant: true, pregnancyRisk: "A" },
  { id: 52, name: "Cetoconazol 200mg", dosage: "1 comprimido 1x/dia", instructions: "por 14 dias", category: "Antifúngicos", safeForPregnant: false, pregnancyRisk: "C" },

  // Ansiolíticos / Antidepressivos — todos sujeitos a Receita de Controle Especial (C1) ou Notif. B (B1)
  { id: 53, name: "Fluoxetina 20mg", dosage: "1 cápsula 1x/dia pela manhã", instructions: "uso contínuo", category: "Antidepressivos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 54, name: "Sertralina 50mg", dosage: "1 comprimido 1x/dia", instructions: "uso contínuo", category: "Antidepressivos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 55, name: "Amitriptilina 25mg", dosage: "1 comprimido à noite", instructions: "uso contínuo", category: "Antidepressivos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 56, name: "Escitalopram 10mg", dosage: "1 comprimido 1x/dia", instructions: "uso contínuo", category: "Antidepressivos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 57, name: "Clonazepam 2mg", dosage: "Gotas: conforme orientação", instructions: "uso conforme necessidade", category: "Ansiolíticos", prescriptionType: "azul", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 58, name: "Diazepam 10mg", dosage: "1 comprimido à noite", instructions: "uso conforme necessidade", category: "Ansiolíticos", prescriptionType: "azul", safeForPregnant: false, pregnancyRisk: "D" },

  // ==================== Controlados adicionais (curadoria ampla SVS 344/98) ====================
  // Antidepressivos C1
  { id: 77, name: "Paroxetina 20mg", dosage: "1 comprimido 1x/dia pela manhã", instructions: "uso contínuo", category: "Antidepressivos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 78, name: "Citalopram 20mg", dosage: "1 comprimido 1x/dia", instructions: "uso contínuo", category: "Antidepressivos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 79, name: "Venlafaxina 75mg", dosage: "1 cápsula 1x/dia", instructions: "uso contínuo", category: "Antidepressivos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 80, name: "Desvenlafaxina 50mg", dosage: "1 comprimido 1x/dia", instructions: "uso contínuo", category: "Antidepressivos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 81, name: "Duloxetina 30mg", dosage: "1 cápsula 1x/dia", instructions: "uso contínuo", category: "Antidepressivos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 82, name: "Bupropiona 150mg", dosage: "1 comprimido de 12/12h", instructions: "uso contínuo", category: "Antidepressivos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 83, name: "Mirtazapina 30mg", dosage: "1 comprimido à noite", instructions: "uso contínuo", category: "Antidepressivos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 84, name: "Trazodona 100mg", dosage: "1 comprimido à noite", instructions: "uso contínuo", category: "Antidepressivos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  // Antipsicóticos C1
  { id: 85, name: "Risperidona 1mg", dosage: "1 comprimido de 12/12h", instructions: "uso contínuo", category: "Antipsicóticos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 86, name: "Quetiapina 25mg", dosage: "1 comprimido à noite", instructions: "uso contínuo", category: "Antipsicóticos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 87, name: "Olanzapina 10mg", dosage: "1 comprimido à noite", instructions: "uso contínuo", category: "Antipsicóticos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 88, name: "Aripiprazol 15mg", dosage: "1 comprimido 1x/dia", instructions: "uso contínuo", category: "Antipsicóticos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 89, name: "Haloperidol 5mg", dosage: "1 comprimido de 12/12h", instructions: "uso contínuo", category: "Antipsicóticos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  // Anticonvulsivantes C1
  { id: 90, name: "Carbamazepina 200mg", dosage: "1 comprimido de 12/12h", instructions: "uso contínuo", category: "Anticonvulsivantes", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 91, name: "Topiramato 50mg", dosage: "1 comprimido de 12/12h", instructions: "uso contínuo", category: "Anticonvulsivantes", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 92, name: "Lamotrigina 100mg", dosage: "1 comprimido 1x/dia", instructions: "uso contínuo", category: "Anticonvulsivantes", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 93, name: "Gabapentina 300mg", dosage: "1 cápsula de 8/8h", instructions: "uso contínuo", category: "Anticonvulsivantes", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 94, name: "Pregabalina 75mg", dosage: "1 cápsula de 12/12h", instructions: "uso contínuo", category: "Anticonvulsivantes", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 95, name: "Ácido Valproico 500mg", dosage: "1 comprimido de 12/12h", instructions: "uso contínuo", category: "Anticonvulsivantes", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 96, name: "Levetiracetam 500mg", dosage: "1 comprimido de 12/12h", instructions: "uso contínuo", category: "Anticonvulsivantes", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  // Benzodiazepínicos B1 — Notif. Azul
  { id: 97, name: "Alprazolam 0,5mg", dosage: "1 comprimido de 12/12h", instructions: "uso conforme necessidade", category: "Ansiolíticos", prescriptionType: "azul", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 98, name: "Bromazepam 3mg", dosage: "1 comprimido de 12/12h", instructions: "uso conforme necessidade", category: "Ansiolíticos", prescriptionType: "azul", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 99, name: "Zolpidem 10mg", dosage: "1 comprimido à noite", instructions: "para insônia", category: "Ansiolíticos", prescriptionType: "azul", safeForPregnant: false, pregnancyRisk: "C" },
  // Anfetamínicos A3 — Notif. Amarela
  { id: 700, name: "Metilfenidato (Ritalina) 10mg", dosage: "1 comprimido de 12/12h", instructions: "uso contínuo", category: "Estimulantes", prescriptionType: "amarela", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 701, name: "Lisdexanfetamina (Venvanse) 30mg", dosage: "1 cápsula 1x/dia pela manhã", instructions: "uso contínuo", category: "Estimulantes", prescriptionType: "amarela", safeForPregnant: false, pregnancyRisk: "C" },
  // Opioides A1/A2 — Notif. Amarela
  { id: 702, name: "Morfina 10mg", dosage: "1 comprimido de 4/4h", instructions: "se dor intensa", category: "Opioides", prescriptionType: "amarela", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 703, name: "Oxicodona 10mg LP", dosage: "1 comprimido de 12/12h", instructions: "se dor crônica intensa", category: "Opioides", prescriptionType: "amarela", safeForPregnant: false, pregnancyRisk: "B" },
  // Anabolizante C5
  { id: 704, name: "Testosterona 250mg/mL (injetável)", dosage: "1 ampola IM a cada 21 dias", instructions: "uso contínuo (TRT)", category: "Hormônios", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "X" },
  // Retinoide C2
  { id: 705, name: "Isotretinoína 20mg", dosage: "1 cápsula 1x/dia", instructions: "uso contínuo (acne grave)", category: "Dermatológicos", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "X" },

  // Antiparasitários
  { id: 59, name: "Albendazol 400mg", dosage: "1 comprimido dose única", instructions: "repetir em 14 dias se necessário", category: "Antiparasitários", pediatricDose: "200mg dose única (1-2 anos)", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 60, name: "Ivermectina 6mg", dosage: "Conforme peso (200mcg/kg)", instructions: "dose única em jejum", category: "Antiparasitários", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 61, name: "Secnidazol 1g", dosage: "2 comprimidos dose única", instructions: "", category: "Antiparasitários", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 62, name: "Mebendazol 100mg", dosage: "1 comprimido de 12/12h", instructions: "por 3 dias", category: "Antiparasitários", pediatricDose: "100mg de 12/12h por 3 dias (>2 anos)", safeForPregnant: false, pregnancyRisk: "C" },

  // Broncodilatadores / Respiratório
  { id: 63, name: "Salbutamol spray 100mcg", dosage: "2 jatos de 6/6h", instructions: "se dispneia", category: "Broncodilatadores", pediatricDose: "1-2 jatos de 6/6h", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 64, name: "Budesonida 200mcg spray nasal", dosage: "2 jatos em cada narina 1x/dia", instructions: "por 30 dias", category: "Broncodilatadores", pediatricDose: "1 jato em cada narina 1x/dia", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 65, name: "Acetilcisteína 600mg", dosage: "1 envelope diluído 1x/dia", instructions: "por 7 dias", category: "Mucolíticos", pediatricDose: "100mg de 8/8h (2-6 anos)", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 66, name: "Ambroxol 30mg", dosage: "1 comprimido de 8/8h", instructions: "por 5 dias", category: "Mucolíticos", pediatricDose: "Xarope pediátrico: 2.5mL de 8/8h", safeForPregnant: true, pregnancyRisk: "B" },

  // Outros
  { id: 67, name: "Sulfato Ferroso 40mg Fe elementar", dosage: "1 comprimido 1x/dia em jejum", instructions: "por 90 dias", category: "Suplementos", pediatricDose: "3-5mg/kg/dia de Fe elementar", safeForPregnant: true, pregnancyRisk: "A" },
  { id: 68, name: "Ácido Fólico 5mg", dosage: "1 comprimido 1x/dia", instructions: "uso contínuo", category: "Suplementos", safeForPregnant: true, pregnancyRisk: "A" },
  { id: 69, name: "Complexo B", dosage: "1 comprimido 1x/dia", instructions: "por 30 dias", category: "Suplementos", safeForPregnant: true, pregnancyRisk: "A" },
  { id: 70, name: "Vitamina D 7.000UI", dosage: "1 comprimido por semana", instructions: "por 8 semanas", category: "Suplementos", safeForPregnant: true, pregnancyRisk: "A" },
  { id: 71, name: "Escopolamina (Buscopan) 10mg", dosage: "1 comprimido de 8/8h", instructions: "se cólica", category: "Antiespasmódicos", pediatricDose: "Gotas: 1 gota/kg de 8/8h", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 72, name: "AAS 100mg", dosage: "1 comprimido 1x/dia", instructions: "uso contínuo", category: "Antiagregantes", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 73, name: "Varfarina 5mg", dosage: "1 comprimido 1x/dia", instructions: "conforme INR", category: "Anticoagulantes", safeForPregnant: false, pregnancyRisk: "X" },
  { id: 74, name: "Levotiroxina 50mcg", dosage: "1 comprimido em jejum", instructions: "uso contínuo", category: "Tireoide", safeForPregnant: true, pregnancyRisk: "A" },
  { id: 75, name: "Alopurinol 300mg", dosage: "1 comprimido 1x/dia", instructions: "uso contínuo", category: "Antigotosos", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 76, name: "Colchicina 0.5mg", dosage: "1 comprimido de 12/12h", instructions: "por 5 dias na crise", category: "Antigotosos", safeForPregnant: false, pregnancyRisk: "D" },

  // ==================== PROTOCOLOS DETALHADOS (IDs 100+) ====================
  // ---------- Amigdalite Bacteriana — ADULTO ----------
  // Antibióticos
  { id: 100, name: "Amoxicilina 500mg", dosage: "1 cp de 8/8h", instructions: "por 10 dias (30 cp)", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "adult", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 101, name: "Amoxicilina 875mg", dosage: "1 cp de 12/12h", instructions: "por 10 dias (20 cp)", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "adult", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 102, name: "Amoxicilina 500mg + Clavulanato 125mg", dosage: "1 cp de 8/8h", instructions: "por 10 dias (30 cp)", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "adult", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 103, name: "Amoxicilina 875mg + Clavulanato 125mg", dosage: "1 cp de 12/12h", instructions: "por 10 dias (20 cp)", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "adult", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 104, name: "Azitromicina 500mg", dosage: "1 cp 1x/dia", instructions: "por 3 dias (3 cp)", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "adult", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "B" },
  { id: 105, name: "Cefalexina 500mg", dosage: "1 cp de 12/12h", instructions: "por 10 dias (20 cp)", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "adult", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 106, name: "Cefalexina 1g", dosage: "1 cp de 12/12h", instructions: "por 10 dias (20 cp)", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "adult", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 107, name: "Axetilcefuroxima 250mg", dosage: "2 cp de 12/12h", instructions: "por 10 dias (40 cp)", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "adult", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 108, name: "Axetilcefuroxima 500mg", dosage: "1 cp de 12/12h", instructions: "por 10 dias (20 cp)", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "adult", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 109, name: "Claritromicina 500mg", dosage: "1 cp de 12/12h", instructions: "por 10 dias (20 cp)", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "adult", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 110, name: "Estolato de Eritromicina 500mg", dosage: "1 cp de 8/8h", instructions: "por 10 dias (30 cp)", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "adult", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 111, name: "Cloridrato de Clindamicina 300mg", dosage: "1 cp de 8/8h", instructions: "por 10 dias (30 cp)", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "adult", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 112, name: "Cefaclor 500mg", dosage: "1 cp de 8/8h", instructions: "por 10 dias (30 cp)", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "adult", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 113, name: "Cefaclor 750mg", dosage: "1 cp de 12/12h", instructions: "por 10 dias (20 cp)", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "adult", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 114, name: "Fenoximetilpenicilina Potássica 500.000 UI", dosage: "1 cp de 8/8h", instructions: "por 10 dias (30 cp)", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "adult", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },

  // AINE — ADULTO (compartilhado entre Amigdalite Bact, Amigdalite Viral, Artrite Gotosa)
  { id: 120, name: "Ibuprofeno 600mg", dosage: "1 cp de 8/8h", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 121, name: "Diclofenaco 50mg", dosage: "1 cp de 8/8h", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 122, name: "Cetoprofeno 100mg", dosage: "1 cp de 12/12h", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 123, name: "Nimesulida 100mg", dosage: "1 cp de 12/12h", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 124, name: "Tenoxicam 20mg", dosage: "1 cp 1x/dia", instructions: "por 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 125, name: "Naproxeno 500mg", dosage: "1 cp de 12/12h", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 126, name: "Ibuprofeno 300mg", dosage: "1 cp de 8/8h", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 127, name: "Ibuprofeno 400mg", dosage: "1 cp de 8/8h", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 128, name: "Diclofenaco 75mg", dosage: "1 cp de 12/12h", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 129, name: "Diclofenaco 100mg", dosage: "1 cp 1x/dia", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 130, name: "Cetoprofeno 50mg", dosage: "1 cp de 8/8h", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 131, name: "Cetoprofeno 150mg", dosage: "1 cp 1x/dia", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 132, name: "Cetoprofeno 200mg", dosage: "1 cp 1x/dia", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 133, name: "Nimesulida Gotas 50mg/mL", dosage: "20 gotas de 12/12h", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 134, name: "Nimesulida 200mg", dosage: "1 cp 1x/dia", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 135, name: "Meloxicam 7,5mg", dosage: "1 cp 1x/dia", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 136, name: "Meloxicam 15mg", dosage: "1 cp 1x/dia", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 137, name: "Piroxicam 20mg", dosage: "1 cp 1x/dia", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 138, name: "Naproxeno 250mg", dosage: "1 cp de 12/12h", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 139, name: "Naproxeno 275mg", dosage: "1 cp de 12/12h", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 140, name: "Naproxeno 550mg", dosage: "1 cp de 12/12h", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 141, name: "Naproxeno 660mg", dosage: "1 cp 1x/dia", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 142, name: "Trometamol Cetorolaco 10mg", dosage: "1 cp de 8/8h", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 143, name: "Ácido Mefenâmico 500mg", dosage: "1 cp de 8/8h", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 144, name: "Indometacina 50mg", dosage: "1 cp de 8/8h", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 145, name: "AAS (Ácido Acetilsalicílico) 500mg", dosage: "1 cp de 6/6h", instructions: "por até 3 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 146, name: "Celecoxibe 100mg", dosage: "1 cp de 12/12h", instructions: "por até 10 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 147, name: "Celecoxibe 200mg", dosage: "1 cp 1x/dia", instructions: "por até 10 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 148, name: "Etoricoxibe 60mg", dosage: "1 cp 1x/dia", instructions: "por até 10 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 149, name: "Etoricoxibe 90mg", dosage: "1 cp 1x/dia", instructions: "por até 10 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },

  // Corticoides sistêmicos — ADULTO
  { id: 160, name: "Prednisona 5mg", dosage: "1 cp 1x/dia", instructions: "por 5 dias", category: "Corticoides", subCategory: "Corticoide sistêmico", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 161, name: "Prednisona 20mg", dosage: "1 cp 1x/dia", instructions: "por 5 dias", category: "Corticoides", subCategory: "Corticoide sistêmico", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 162, name: "Prednisolona 5mg", dosage: "1 cp 1x/dia", instructions: "por 5 dias", category: "Corticoides", subCategory: "Corticoide sistêmico", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 163, name: "Prednisolona 10mg", dosage: "1 cp 1x/dia", instructions: "por 5 dias", category: "Corticoides", subCategory: "Corticoide sistêmico", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 164, name: "Prednisolona 20mg", dosage: "1 cp 1x/dia", instructions: "por 5 dias", category: "Corticoides", subCategory: "Corticoide sistêmico", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 165, name: "Prednisolona 40mg", dosage: "1 cp 1x/dia", instructions: "por 5 dias", category: "Corticoides", subCategory: "Corticoide sistêmico", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 166, name: "Dexametasona 0,5mg", dosage: "1 cp de 12/12h", instructions: "por 5 dias", category: "Corticoides", subCategory: "Corticoide sistêmico", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 167, name: "Dexametasona 0,75mg", dosage: "1 cp de 12/12h", instructions: "por 5 dias", category: "Corticoides", subCategory: "Corticoide sistêmico", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 168, name: "Dexametasona 4mg", dosage: "1 cp 1x/dia", instructions: "por 5 dias", category: "Corticoides", subCategory: "Corticoide sistêmico", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 169, name: "Dexametasona Xarope 0,1mg/mL", dosage: "10mL 1x/dia", instructions: "por 5 dias", category: "Corticoides", subCategory: "Corticoide sistêmico", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 170, name: "Betametasona 2mg", dosage: "1 cp 1x/dia", instructions: "por 5 dias", category: "Corticoides", subCategory: "Corticoide sistêmico", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 171, name: "Maleato de Dexclorfeniramina 0,4mg/mL + Betametasona 0,05mg/mL", dosage: "10mL de 8/8h", instructions: "por 5 dias", category: "Corticoides", subCategory: "Corticoide sistêmico", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 172, name: "Prednisolona Xarope 3mg/mL", dosage: "4mL 1x/dia", instructions: "por 5 dias", category: "Corticoides", subCategory: "Corticoide sistêmico", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 173, name: "Prednisolona Gotas 11mg/mL", dosage: "20 gotas 1x/dia", instructions: "por 5 dias", category: "Corticoides", subCategory: "Corticoide sistêmico", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },

  // Corticoides INJETÁVEIS — ADULTO (Gota)
  { id: 180, name: "Fosfato Dissódico de Dexametasona 2mg/mL", dosage: "Aplicar 1 amp IM", instructions: "dose única", category: "Corticoides", subCategory: "Corticoide injetável", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 181, name: "Fosfato Dissódico de Dexametasona 4mg/mL", dosage: "Aplicar 1 amp IM", instructions: "dose única", category: "Corticoides", subCategory: "Corticoide injetável", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 182, name: "Fosfato Dissódico de Dexametasona 2mg/mL + Acetato de Dexametasona 8mg/mL", dosage: "Aplicar 1 amp IM", instructions: "dose única", category: "Corticoides", subCategory: "Corticoide injetável", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 183, name: "Dexametasona 4,37mg + Tiamina 100mg + Piridoxina 100mg + Cianocobalamina 5000mcg", dosage: "Aplicar 1 amp IM", instructions: "a cada 2 dias", category: "Corticoides", subCategory: "Corticoide injetável", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 184, name: "Dipropionato de Betametasona 5mg/mL + Fosfato Dissódico de Betametasona 2mg/mL", dosage: "Aplicar 1 amp IM", instructions: "dose única", category: "Corticoides", subCategory: "Corticoide injetável", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 185, name: "Acetato de Betametasona 3mg/mL + Fosfato Dissódico de Betametasona 3,945mg/mL", dosage: "Aplicar 1 amp IM", instructions: "dose única", category: "Corticoides", subCategory: "Corticoide injetável", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 186, name: "Acetato de Metilprednisolona 40mg/mL (suspensão injetável)", dosage: "Aplicar 1 amp IM", instructions: "dose única", category: "Corticoides", subCategory: "Corticoide injetável", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },

  // Analgésicos / Antitérmicos — ADULTO
  { id: 190, name: "Dipirona 500mg", dosage: "1 cp de 6/6h", instructions: "se dor ou febre", category: "Analgésicos", subCategory: "Analgésico/Antitérmico", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 191, name: "Dipirona 1g", dosage: "1 cp de 6/6h", instructions: "se dor ou febre", category: "Analgésicos", subCategory: "Analgésico/Antitérmico", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 192, name: "Dipirona Gotas 500mg/mL", dosage: "40 gotas de 6/6h", instructions: "se dor ou febre", category: "Analgésicos", subCategory: "Analgésico/Antitérmico", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 193, name: "Paracetamol 500mg", dosage: "1 cp de 6/6h", instructions: "se dor ou febre", category: "Analgésicos", subCategory: "Analgésico/Antitérmico", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 194, name: "Paracetamol 750mg", dosage: "1 cp de 6/6h", instructions: "se dor ou febre", category: "Analgésicos", subCategory: "Analgésico/Antitérmico", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 195, name: "Paracetamol Gotas 200mg/mL", dosage: "50 gotas de 6/6h", instructions: "se dor ou febre", category: "Analgésicos", subCategory: "Analgésico/Antitérmico", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "B" },

  // ---------- PEDIÁTRICO — Amigdalite Bacteriana ----------
  // Antibióticos pediátricos
  { id: 200, name: "Amoxicilina Susp. 250mg/5mL", dosage: "Conforme peso, de 8/8h", instructions: "por 10 dias", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "pediatric", pediatricDose: "50mg/kg/dia ÷ 3 doses", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 201, name: "Amoxicilina Susp. 400mg/5mL", dosage: "Conforme peso, de 8/8h", instructions: "por 10 dias", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "pediatric", pediatricDose: "50mg/kg/dia ÷ 3 doses", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 202, name: "Amoxicilina Susp. 500mg/5mL", dosage: "Conforme peso, de 8/8h", instructions: "por 10 dias", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "pediatric", pediatricDose: "50mg/kg/dia ÷ 3 doses", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 203, name: "Amoxicilina 250mg/5mL + Clavulanato 62,5mg/5mL", dosage: "Conforme peso, de 8/8h", instructions: "por 10 dias", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "pediatric", pediatricDose: "50mg/kg/dia ÷ 3 doses", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 204, name: "Amoxicilina 400mg/5mL + Clavulanato 57mg/5mL", dosage: "Conforme peso, de 8/8h", instructions: "por 10 dias", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "pediatric", pediatricDose: "45mg/kg/dia ÷ 2-3 doses", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 205, name: "Amoxicilina 600mg/5mL + Clavulanato 42,9mg/5mL", dosage: "Conforme peso, de 12/12h", instructions: "por 10 dias", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "pediatric", pediatricDose: "90mg/kg/dia ÷ 2 doses", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 206, name: "Azitromicina Susp. 200mg/5mL", dosage: "Conforme peso, 1x/dia", instructions: "por 5 dias", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "pediatric", pediatricDose: "10mg/kg/dia 1x/dia", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "B" },
  { id: 207, name: "Cefalexina Susp. 250mg/5mL", dosage: "Conforme peso, de 6/6h", instructions: "por 7 dias", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "pediatric", pediatricDose: "50mg/kg/dia ÷ 4 doses", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 208, name: "Cefalexina Susp. 500mg/5mL", dosage: "Conforme peso, de 12/12h", instructions: "por 7 dias", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "pediatric", pediatricDose: "50mg/kg/dia ÷ 2 doses", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 209, name: "Axetilcefuroxima Susp. 250mg/5mL", dosage: "Conforme peso, de 12/12h", instructions: "por 7 dias", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "pediatric", pediatricDose: "30mg/kg/dia ÷ 2 doses", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 210, name: "Claritromicina Susp. 25mg/mL", dosage: "Conforme peso, de 12/12h", instructions: "por 10 dias", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "pediatric", pediatricDose: "15mg/kg/dia ÷ 2 doses", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 211, name: "Claritromicina Susp. 50mg/mL", dosage: "Conforme peso, de 12/12h", instructions: "por 10 dias", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "pediatric", pediatricDose: "15mg/kg/dia ÷ 2 doses", prescriptionType: "branca2vias", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 212, name: "Cefaclor Susp. 250mg/5mL", dosage: "Conforme peso, de 8/8h", instructions: "por 10 dias", category: "Antibióticos", subCategory: "Antibiótico", ageGroup: "pediatric", pediatricDose: "40mg/kg/dia ÷ 3 doses", prescriptionType: "branca2vias", safeForPregnant: true, pregnancyRisk: "B" },

  // AINE pediátrico
  { id: 220, name: "Ibuprofeno Gotas 50mg/mL", dosage: "Conforme peso, de 8/8h", instructions: "por 5 dias, se dor ou febre", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "pediatric", pediatricDose: "10mg/kg/dose", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 221, name: "Ibuprofeno Gotas 100mg/mL", dosage: "Conforme peso, de 8/8h", instructions: "por 5 dias, se dor ou febre", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "pediatric", pediatricDose: "10mg/kg/dose", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 222, name: "Ibuprofeno Xarope 30mg/mL", dosage: "Conforme peso, de 8/8h", instructions: "por 5 dias, se dor ou febre", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "pediatric", pediatricDose: "10mg/kg/dose", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 223, name: "Cetoprofeno Gotas 20mg/mL", dosage: "Conforme peso, de 8/8h", instructions: "por 5 dias, se dor", category: "Anti-inflamatórios", subCategory: "AINE", ageGroup: "pediatric", safeForPregnant: false, pregnancyRisk: "C" },

  // Corticoide pediátrico
  { id: 230, name: "Prednisolona Xarope 3mg/mL", dosage: "Conforme peso, 1x/dia", instructions: "por 5 dias", category: "Corticoides", subCategory: "Corticoide sistêmico", ageGroup: "pediatric", pediatricDose: "1-2mg/kg/dia", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 231, name: "Prednisolona Gotas 11mg/mL", dosage: "Conforme peso, 1x/dia", instructions: "por 5 dias", category: "Corticoides", subCategory: "Corticoide sistêmico", ageGroup: "pediatric", pediatricDose: "1-2mg/kg/dia", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 232, name: "Dexametasona Xarope 0,1mg/mL", dosage: "Conforme peso, de 6/6h", instructions: "por 5 dias", category: "Corticoides", subCategory: "Corticoide sistêmico", ageGroup: "pediatric", pediatricDose: "0,15mg/kg/dose", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 233, name: "Maleato de Dexclorfeniramina 0,4mg/mL + Betametasona 0,05mg/mL", dosage: "Conforme peso, de 8/8h", instructions: "por 5 dias", category: "Corticoides", subCategory: "Corticoide sistêmico", ageGroup: "pediatric", safeForPregnant: false, pregnancyRisk: "C" },

  // Analgésico pediátrico
  { id: 240, name: "Dipirona Gotas 500mg/mL", dosage: "Conforme peso, de 6/6h", instructions: "se dor ou febre", category: "Analgésicos", subCategory: "Analgésico/Antitérmico", ageGroup: "pediatric", pediatricDose: "1 gota/kg/dose", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 241, name: "Dipirona Xarope 50mg/mL", dosage: "Conforme peso, de 6/6h", instructions: "se dor ou febre", category: "Analgésicos", subCategory: "Analgésico/Antitérmico", ageGroup: "pediatric", pediatricDose: "25mg/kg/dose", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 242, name: "Paracetamol Gotas 200mg/mL", dosage: "Conforme peso, de 6/6h", instructions: "se dor ou febre", category: "Analgésicos", subCategory: "Analgésico/Antitérmico", ageGroup: "pediatric", pediatricDose: "1 gota/kg/dose", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 243, name: "Paracetamol Xarope 32mg/mL", dosage: "Conforme peso, de 6/6h", instructions: "se dor ou febre", category: "Analgésicos", subCategory: "Analgésico/Antitérmico", ageGroup: "pediatric", pediatricDose: "15mg/kg/dose", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 244, name: "Paracetamol Xarope 100mg/mL", dosage: "Conforme peso, de 6/6h", instructions: "se dor ou febre", category: "Analgésicos", subCategory: "Analgésico/Antitérmico", ageGroup: "pediatric", pediatricDose: "15mg/kg/dose", safeForPregnant: true, pregnancyRisk: "B" },

  // ---------- ANEMIA FERROPRIVA — Antianêmicos ----------
  // Adulto
  { id: 300, name: "Sulfato Ferroso 40mg Fe elementar", dosage: "1 cp após o almoço, com suco de laranja/limão", instructions: "por 60 dias", category: "Suplementos", subCategory: "Antianêmico", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "A" },
  { id: 301, name: "Sulfato Ferroso Gotas 125mg/mL", dosage: "40 gotas após o almoço, com suco cítrico", instructions: "por 60 dias", category: "Suplementos", subCategory: "Antianêmico", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "A" },
  { id: 302, name: "Sulfato Ferroso Xarope 25mg/mL", dosage: "8mL após o almoço, com suco cítrico", instructions: "por 60 dias", category: "Suplementos", subCategory: "Antianêmico", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "A" },
  { id: 303, name: "Sulfato Ferroso Xarope 50mg/mL", dosage: "4mL após o almoço, com suco cítrico", instructions: "por 60 dias", category: "Suplementos", subCategory: "Antianêmico", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "A" },
  { id: 304, name: "Ferripolimaltose 100mg Fe elementar", dosage: "1 cp após o almoço, com suco cítrico", instructions: "por 60 dias", category: "Suplementos", subCategory: "Antianêmico", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "A" },
  { id: 305, name: "Ferripolimaltose Gotas 50mg/mL", dosage: "40 gotas após o almoço, com suco cítrico", instructions: "por 60 dias", category: "Suplementos", subCategory: "Antianêmico", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "A" },
  { id: 306, name: "Ferripolimaltose Gotas 100mg/mL", dosage: "20 gotas após o almoço, com suco cítrico", instructions: "por 60 dias", category: "Suplementos", subCategory: "Antianêmico", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "A" },
  { id: 307, name: "Ferripolimaltose Xarope 10mg/mL", dosage: "10mL após o almoço, com suco cítrico", instructions: "por 60 dias", category: "Suplementos", subCategory: "Antianêmico", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "A" },
  { id: 308, name: "Sacarato de Hidróxido Férrico 20mg/mL (injetável)", dosage: "Diluir 2 amp em 500mL de SF 0,9%", instructions: "EV lento (4h)", category: "Suplementos", subCategory: "Antianêmico", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "B" },
  // Pediátrico
  { id: 320, name: "Sulfato Ferroso Gotas 125mg/mL", dosage: "Conforme peso, 1x/dia", instructions: "por 30 dias", category: "Suplementos", subCategory: "Antianêmico", ageGroup: "pediatric", pediatricDose: "3-5mg Fe/kg/dia" },
  { id: 321, name: "Sulfato Ferroso Xarope 25mg/mL", dosage: "Conforme peso, 1x/dia", instructions: "por 30 dias", category: "Suplementos", subCategory: "Antianêmico", ageGroup: "pediatric", pediatricDose: "3-5mg Fe/kg/dia" },
  { id: 322, name: "Sulfato Ferroso Xarope 50mg/mL", dosage: "Conforme peso, 1x/dia", instructions: "por 30 dias", category: "Suplementos", subCategory: "Antianêmico", ageGroup: "pediatric", pediatricDose: "3-5mg Fe/kg/dia" },
  { id: 323, name: "Ferripolimaltose Gotas 50mg/mL", dosage: "Conforme peso, 1x/dia", instructions: "por 30 dias", category: "Suplementos", subCategory: "Antianêmico", ageGroup: "pediatric", pediatricDose: "3-5mg Fe/kg/dia" },
  { id: 324, name: "Ferripolimaltose Gotas 100mg/mL", dosage: "Conforme peso, 1x/dia", instructions: "por 30 dias", category: "Suplementos", subCategory: "Antianêmico", ageGroup: "pediatric", pediatricDose: "3-5mg Fe/kg/dia" },
  { id: 325, name: "Ferripolimaltose Xarope 10mg/mL", dosage: "Conforme peso, 1x/dia", instructions: "por 30 dias", category: "Suplementos", subCategory: "Antianêmico", ageGroup: "pediatric", pediatricDose: "3-5mg Fe/kg/dia" },
  { id: 326, name: "Glicinato Férrico Gotas 131,58mg/mL", dosage: "Conforme peso, de 12/12h", instructions: "por 30 dias", category: "Suplementos", subCategory: "Antianêmico", ageGroup: "pediatric" },
  { id: 327, name: "Glicinato Férrico Gotas 250mg/mL", dosage: "Conforme peso, de 12/12h", instructions: "por 30 dias", category: "Suplementos", subCategory: "Antianêmico", ageGroup: "pediatric" },
  { id: 328, name: "Glicinato Férrico Xarope 275,80mg/10mL", dosage: "Conforme peso, de 12/12h", instructions: "por 30 dias", category: "Suplementos", subCategory: "Antianêmico", ageGroup: "pediatric" },

  // ---------- ARTRITE GOTOSA — Hipouricemiante + Colchicina ----------
  { id: 400, name: "Colchicina 0,5mg", dosage: "1 cp de 8/8h no 1º dia, depois 1 cp de 12/12h", instructions: "até melhora total", category: "Antigotosos", subCategory: "AINE", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "D" },
  { id: 401, name: "Alopurinol 100mg", dosage: "1 cp 1x/dia", instructions: "por 30 dias", category: "Antigotosos", subCategory: "Hipouricemiante", ageGroup: "adult", safeForPregnant: false, pregnancyRisk: "C" },

  // ---------- ASMA — ADULTO ----------
  { id: 500, name: "Salbutamol Spray 100mcg/dose", dosage: "Inalar 2 jatos", instructions: "se necessário", category: "Broncodilatadores", subCategory: "Beta-2 agonista curta duração", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 501, name: "Salbutamol Gotas 5mg/mL", dosage: "Diluir 20 gotas em 5mL SF 0,9% — nebulizar", instructions: "se necessário", category: "Broncodilatadores", subCategory: "Beta-2 agonista curta duração", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 502, name: "Bromidrato de Fenoterol 100mcg/dose", dosage: "Inalar 2 jatos", instructions: "se necessário", category: "Broncodilatadores", subCategory: "Beta-2 agonista curta duração", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 510, name: "Budesonida 200mcg (cápsulas)", dosage: "Inalar 1 cápsula de 12/12h", instructions: "uso contínuo", category: "Broncodilatadores", subCategory: "Corticoide inalatório", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 511, name: "Beclometasona 50mcg", dosage: "Inalar 4 jatos de 12/12h", instructions: "uso contínuo", category: "Broncodilatadores", subCategory: "Corticoide inalatório", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 512, name: "Beclometasona 200mcg", dosage: "Inalar 1 jato de 12/12h", instructions: "uso contínuo", category: "Broncodilatadores", subCategory: "Corticoide inalatório", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 513, name: "Beclometasona 250mcg", dosage: "Inalar 1 jato de 12/12h", instructions: "uso contínuo", category: "Broncodilatadores", subCategory: "Corticoide inalatório", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 520, name: "Formoterol 6mcg + Budesonida 100mcg", dosage: "Inalar 1 cápsula de 12/12h", instructions: "uso contínuo", category: "Broncodilatadores", subCategory: "Beta-2 longa duração + Corticoide", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 521, name: "Formoterol 6mcg + Budesonida 200mcg", dosage: "Inalar 1 cápsula de 12/12h", instructions: "uso contínuo", category: "Broncodilatadores", subCategory: "Beta-2 longa duração + Corticoide", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 522, name: "Formoterol 12mcg + Budesonida 200mcg", dosage: "Inalar 1 cápsula de 12/12h", instructions: "uso contínuo", category: "Broncodilatadores", subCategory: "Beta-2 longa duração + Corticoide", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 523, name: "Formoterol 12mcg + Budesonida 400mcg", dosage: "Inalar 1 cápsula de 12/12h", instructions: "uso contínuo", category: "Broncodilatadores", subCategory: "Beta-2 longa duração + Corticoide", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 524, name: "Formoterol 6mcg + Beclometasona 100mcg", dosage: "Inalar 1 cápsula de 12/12h", instructions: "uso contínuo", category: "Broncodilatadores", subCategory: "Beta-2 longa duração + Corticoide", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 525, name: "Formoterol 6mcg + Beclometasona 200mcg", dosage: "Inalar 1 cápsula de 12/12h", instructions: "uso contínuo", category: "Broncodilatadores", subCategory: "Beta-2 longa duração + Corticoide", ageGroup: "adult", safeForPregnant: true, pregnancyRisk: "C" },

  // ---------- ASMA — PEDIÁTRICO ----------
  { id: 600, name: "Salbutamol Spray 100mcg/dose", dosage: "Inalar c/ espaçador, conforme idade", instructions: "máx 6 jatos/dia", category: "Broncodilatadores", subCategory: "Beta-2 agonista curta duração", ageGroup: "pediatric", pediatricDose: "1-2 jatos por dose", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 601, name: "Salbutamol Gotas 5mg/mL", dosage: "Nebulizar c/ 4mL de SF 0,9% de 6/6h", instructions: "conforme necessidade", category: "Broncodilatadores", subCategory: "Beta-2 agonista curta duração", ageGroup: "pediatric", pediatricDose: "1 gota/3kg (mín 5, máx 20 gotas)", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 602, name: "Bromidrato de Fenoterol 100mcg/dose", dosage: "Inalar 1 jato c/ espaçador", instructions: "máx 8 jatos/dia", category: "Broncodilatadores", subCategory: "Beta-2 agonista curta duração", ageGroup: "pediatric", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 610, name: "Brometo de Ipratrópio Gotas 0,25mg/mL", dosage: "Nebulizar c/ 4mL SF 0,9% de 6/6h", instructions: "conforme necessidade", category: "Broncodilatadores", subCategory: "Anticolinérgico", ageGroup: "pediatric", pediatricDose: "20-40 gotas por dose", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 620, name: "Budesonida 0,25mg/mL (susp. nebulização)", dosage: "Nebulizar c/ 3mL SF 0,9% de 12/12h", instructions: "uso contínuo", category: "Broncodilatadores", subCategory: "Corticoide inalatório", ageGroup: "pediatric", pediatricDose: "1-2mL por dose", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 621, name: "Beclometasona 50mcg", dosage: "Inalar 1 jato c/ espaçador de 12/12h", instructions: "uso contínuo", category: "Broncodilatadores", subCategory: "Corticoide inalatório", ageGroup: "pediatric", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 630, name: "Montelucaste Granulado 4mg", dosage: "1 sachê 1x/dia", instructions: "uso contínuo", category: "Broncodilatadores", subCategory: "Antagonista de leucotrieno", ageGroup: "pediatric", pediatricDose: "6 meses a 5 anos", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 631, name: "Montelucaste 4mg", dosage: "1 cp mastigável 1x/dia", instructions: "uso contínuo", category: "Broncodilatadores", subCategory: "Antagonista de leucotrieno", ageGroup: "pediatric", pediatricDose: "2 a 5 anos", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 632, name: "Montelucaste 5mg", dosage: "1 cp mastigável 1x/dia", instructions: "uso contínuo", category: "Broncodilatadores", subCategory: "Antagonista de leucotrieno", ageGroup: "pediatric", pediatricDose: "6 a 14 anos", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 640, name: "Formoterol 6mcg + Budesonida 100mcg", dosage: "Inalar 1-2 jatos de 8/8h", instructions: "uso contínuo", category: "Broncodilatadores", subCategory: "Beta-2 longa duração + Corticoide", ageGroup: "pediatric", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 641, name: "Salmeterol 25mcg + Fluticasona 50mcg", dosage: "Inalar 1-2 jatos de 12/12h", instructions: "uso contínuo", category: "Broncodilatadores", subCategory: "Beta-2 longa duração + Corticoide", ageGroup: "pediatric", safeForPregnant: true, pregnancyRisk: "C" },

  // ---------- VO administrado na unidade (intra-hospitalar) ----------
  // Medicações via oral / sublingual dadas na sala de emergência, não para casa.
  { id: 900, name: "AAS 300mg (mastigável)", dosage: "300mg VO mastigar dose única", instructions: "síndrome coronariana aguda", category: "Antiagregantes", subCategory: "VO intra-hospitalar", inHospitalOral: true, safeForPregnant: false, pregnancyRisk: "D" },
  { id: 901, name: "Clopidogrel 75mg", dosage: "Ataque 300-600mg VO, depois 75mg/dia", instructions: "conforme protocolo SCA", category: "Antiagregantes", subCategory: "VO intra-hospitalar", inHospitalOral: true, safeForPregnant: false, pregnancyRisk: "B" },
  { id: 902, name: "Captopril 25mg (sublingual)", dosage: "25mg SL dose única", instructions: "se PAS > 180mmHg sintomática", category: "Anti-hipertensivos", subCategory: "VO intra-hospitalar", inHospitalOral: true, safeForPregnant: false, pregnancyRisk: "D" },
  { id: 903, name: "Isossorbida 5mg (sublingual)", dosage: "5mg SL, repetir até 3x", instructions: "dor torácica isquêmica", category: "Cardiovascular", subCategory: "VO intra-hospitalar", inHospitalOral: true, safeForPregnant: false, pregnancyRisk: "C" },
  { id: 904, name: "Atorvastatina 80mg", dosage: "80mg VO dose única", instructions: "carga na SCA", category: "Estatinas", subCategory: "VO intra-hospitalar", inHospitalOral: true, safeForPregnant: false, pregnancyRisk: "X" },
  { id: 905, name: "Prednisona 40mg", dosage: "40mg VO dose única", instructions: "crise asmática / DPOC exacerbado", category: "Corticoides", subCategory: "VO intra-hospitalar", inHospitalOral: true, pediatricDose: "1-2mg/kg/dose (máx 40mg)", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 906, name: "Prednisolona 3mg/mL (solução oral)", dosage: "Conforme peso, dose única na unidade", instructions: "crise asmática pediátrica", category: "Corticoides", subCategory: "VO intra-hospitalar", inHospitalOral: true, pediatricDose: "1-2mg/kg/dose (máx 40mg)", safeForPregnant: false, pregnancyRisk: "C" },
  { id: 907, name: "Dipirona 500mg/mL gotas", dosage: "Conforme peso/idade, dose única", instructions: "febre ou dor na unidade", category: "Analgésicos", subCategory: "VO intra-hospitalar", inHospitalOral: true, pediatricDose: "25mg/kg/dose (1 gota/kg)", safeForPregnant: true, pregnancyRisk: "C" },
  { id: 908, name: "Paracetamol 200mg/mL gotas", dosage: "Conforme peso, dose única", instructions: "febre ou dor na unidade", category: "Analgésicos", subCategory: "VO intra-hospitalar", inHospitalOral: true, pediatricDose: "15mg/kg/dose", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 909, name: "Ondansetrona 4mg (comprimido orodispersível)", dosage: "4-8mg VO dose única", instructions: "vômitos na unidade", category: "Gastro", subCategory: "VO intra-hospitalar", inHospitalOral: true, pediatricDose: "0,15mg/kg/dose (máx 8mg)", safeForPregnant: true, pregnancyRisk: "B" },
  { id: 910, name: "Glicose 15g VO (sachê/copo)", dosage: "15g VO, repetir em 15min se necessário", instructions: "hipoglicemia com paciente consciente", category: "Metabolismo", subCategory: "VO intra-hospitalar", inHospitalOral: true, pediatricDose: "0,3g/kg VO", safeForPregnant: true, pregnancyRisk: "A" },
  { id: 911, name: "Sais de reidratação oral (SRO)", dosage: "50-100mL/kg VO em 4h (TRO)", instructions: "desidratação leve/moderada na unidade", category: "Hidratação", subCategory: "VO intra-hospitalar", inHospitalOral: true, pediatricDose: "50-100mL/kg em 4h", safeForPregnant: true, pregnancyRisk: "A" },
];

export const DEFAULT_PATHOLOGIES: Pathology[] = [
  // Otorrino / Via Aérea Superior
  { id: 1, name: "Amigdalite Bacteriana", cid: "J03", meds: [
    // Adulto: Antibióticos
    100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114,
    // Adulto: AINE
    120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149,
    // Adulto: Corticoide sistêmico
    160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173,
    // Adulto: Analgésico/Antitérmico
    190, 191, 192, 193, 194, 195,
    // Pediátrico: Antibiótico
    200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212,
    // Pediátrico: AINE
    220, 221, 222, 223,
    // Pediátrico: Corticoide
    230, 231, 232, 233,
    // Pediátrico: Analgésico
    240, 241, 242, 243, 244,
  ], hospitalMeds: [
    // Hidratação / Diluição
    "Soro Fisiológico 0,9% 100 mL EV",
    "Soro Fisiológico 0,9% 250 mL EV",
    "Soro Fisiológico 0,9% 500 mL EV",
    "Soro Fisiológico 0,9% 1000 mL EV",
    // Antibióticos parenterais
    "Penicilina Benzatina 1.200.000 UI IM — dose única",
    "Ceftriaxona 2 g EV — 1x/dia",
    "Ceftriaxona 2 g IM — 1x/dia",
    // AINE parenteral
    "Diclofenaco 75 mg (3 mL) EV — de 12/12h, se dor",
    "Diclofenaco 75 mg (3 mL) IM — de 12/12h, se dor",
    "Tenoxicam 20 mg EV — 1x/dia, se dor",
    "Tenoxicam 20 mg IM — 1x/dia, se dor",
    "Cetoprofeno 100 mg EV — de 12/12h, se dor",
    "Cetoprofeno 100 mg (2 mL) IM — de 12/12h, se dor",
    // Analgésico / Antitérmico parenteral
    "Dipirona 1 g (2 mL) EV — de 6/6h, se dor ou febre",
    "Dipirona 1 g (2 mL) IM — de 6/6h, se dor ou febre",
    "Paracetamol 1 g (100 mL) EV — de 6/6h, se dor ou febre",
    // Corticoide sistêmico parenteral
    "Dexametasona 4 mg (1 mL) EV — dose única",
    "Dexametasona 4 mg (1 mL) IM — dose única",
    "Dexametasona 10 mg (1 mL) EV — dose única",
    "Dexametasona 10 mg (1 mL) IM — dose única",
  ]},
  { id: 2, name: "Amigdalite Viral", cid: "J03.9", meds: [
    // Adulto
    120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149,
    160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173,
    190, 191, 192, 193, 194, 195,
    // Pediátrico
    220, 221, 222, 223,
    230, 231, 232, 233,
    240, 241, 242, 243, 244,
  ], hospitalMeds: [
    "Dipirona 1g EV de 6/6h se febre",
    "Cetoprofeno 100mg EV de 12/12h se dor",
    "Hidratação: SF 0,9% 1000mL EV em 8h",
  ]},
  { id: 11, name: "Sinusite Aguda", cid: "J01", meds: [1, 6, 7, 4], hospitalMeds: [
    "Ceftriaxona 1g EV de 12/12h",
    "Dipirona 1g EV de 6/6h se dor",
    "Dexametasona 4mg EV 1x/dia",
    "SF 0,9% nasal frequente",
  ]},
  { id: 12, name: "Otite Média Aguda", cid: "H66", meds: [1, 4, 3], hospitalMeds: [
    "Ceftriaxona 1g EV de 12/12h",
    "Dipirona 1g EV de 6/6h se dor",
    "Cetoprofeno 100mg EV de 12/12h",
  ]},
  { id: 13, name: "Faringite Aguda", cid: "J02", meds: [4, 5, 3], hospitalMeds: [
    "Dipirona 1g EV de 6/6h",
    "Cetoprofeno 100mg EV de 12/12h",
    "Dexametasona 4mg EV dose única",
  ]},
  { id: 14, name: "Rinite Alérgica", cid: "J30", meds: [7, 64, 38] },
  { id: 15, name: "Laringite Aguda", cid: "J04", meds: [8, 4, 6], hospitalMeds: [
    "Dexametasona 10mg EV dose única",
    "Adrenalina 0,5mL + SF 3mL nebulização",
    "Dipirona 1g EV de 6/6h se febre",
  ]},

  // Respiratório
  { id: 5, name: "Asma (Crise)", cid: "J45", meds: [
    // Adulto
    500, 501, 502,
    510, 511, 512, 513,
    520, 521, 522, 523, 524, 525,
    160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173,
    // Pediátrico
    600, 601, 602,
    610,
    620, 621,
    630, 631, 632,
    640, 641,
  ], hospitalMeds: [
    "Salbutamol 10 gotas + Ipratrópio 40 gotas + SF 3mL NBZ de 20/20min (3x), depois de 4/4h",
    "Hidrocortisona 200mg EV agora, depois 100mg EV de 8/8h",
    "Sulfato de Magnésio 2g EV em 20min (se crise grave)",
    "O2 suplementar para manter SpO2 > 94%",
  ]},
  { id: 6, name: "Broncoespasmo", cid: "J98.0", meds: [63, 8], hospitalMeds: [
    "Salbutamol 10 gotas + Ipratrópio 40 gotas + SF 3mL NBZ de 20/20min",
    "Hidrocortisona 100mg EV de 8/8h",
    "O2 suplementar se SpO2 < 94%",
  ]},
  { id: 16, name: "Bronquite Aguda", cid: "J20", meds: [65, 66, 4], hospitalMeds: [
    "Dipirona 1g EV de 6/6h se febre",
    "Salbutamol 10 gotas + SF 3mL NBZ de 6/6h se broncoespasmo",
    "Hidratação: SF 0,9% 1000mL EV em 8h",
  ]},
  { id: 17, name: "Pneumonia Comunitária", cid: "J18", meds: [1, 2, 4, 5], hospitalMeds: [
    "Ceftriaxona 1g EV de 12/12h",
    "Azitromicina 500mg EV 1x/dia",
    "Dipirona 1g EV de 6/6h se febre",
    "O2 suplementar se SpO2 < 94%",
    "Hidratação: SF 0,9% 1000mL EV em 8h",
    "Enoxaparina 40mg SC 1x/dia (profilaxia TVP)",
  ]},
  { id: 18, name: "IVAS (Resfriado Comum)", cid: "J06", meds: [4, 5, 7, 33] },
  { id: 19, name: "COVID-19 (Sintomático)", cid: "U07.1", meds: [4, 5, 6], hospitalMeds: [
    "Dexametasona 6mg EV 1x/dia por 10 dias",
    "Enoxaparina 40mg SC 1x/dia",
    "Dipirona 1g EV de 6/6h se febre",
    "O2 suplementar para manter SpO2 > 94%",
    "Hidratação: SF 0,9% 1000mL EV em 8h",
  ]},

  // Gastro
  { id: 20, name: "DRGE (Refluxo)", cid: "K21", meds: [6, 29, 31], hospitalMeds: [
    "Omeprazol 40mg EV de 12/12h",
    "Metoclopramida 10mg EV de 8/8h",
  ]},
  { id: 21, name: "Gastrite", cid: "K29", meds: [6, 29, 30], hospitalMeds: [
    "Omeprazol 40mg EV de 12/12h",
    "Dipirona 1g EV de 6/6h se dor",
    "Escopolamina 20mg EV de 8/8h se cólica",
  ]},
  { id: 22, name: "Dispepsia Funcional", cid: "K30", meds: [6, 31, 33] },
  { id: 23, name: "Gastroenterite Aguda", cid: "A09", meds: [32, 35, 34, 4], hospitalMeds: [
    "Hidratação: SF 0,9% 1000mL + KCl 10mL EV em 4h",
    "Ondansetrona 8mg EV de 8/8h se vômitos",
    "Dipirona 1g EV de 6/6h se febre",
    "Metoclopramida 10mg EV de 8/8h se náusea",
  ]},
  { id: 24, name: "Cólica Abdominal", cid: "R10", meds: [71, 4, 33], hospitalMeds: [
    "Escopolamina 20mg + Dipirona 2,5g EV de 8/8h",
    "Tramadol 100mg EV de 8/8h se dor intensa",
  ]},
  { id: 25, name: "Parasitose Intestinal", cid: "B82", meds: [59, 62] },
  { id: 26, name: "Giardíase", cid: "A07.1", meds: [17, 61] },
  { id: 27, name: "Amebíase", cid: "A06", meds: [17, 61] },

  // Urologia
  { id: 8, name: "Infecção Urinária (Cistite)", cid: "N30", meds: [22, 18, 4], hospitalMeds: [
    "Ciprofloxacino 400mg EV de 12/12h",
    "Dipirona 1g EV de 6/6h se febre",
    "Hidratação: SF 0,9% 1000mL EV em 6h",
  ]},
  { id: 28, name: "Pielonefrite", cid: "N10", meds: [16, 4, 5], hospitalMeds: [
    "Ceftriaxona 1g EV de 12/12h",
    "Dipirona 1g EV de 6/6h se febre",
    "Hidratação: SF 0,9% 1500mL EV em 8h",
    "Ondansetrona 8mg EV de 8/8h se vômitos",
  ]},

  // Ginecologia
  { id: 7, name: "Candidíase Vaginal", cid: "B37.3", meds: [15] },
  { id: 29, name: "Vaginose Bacteriana", cid: "N76", meds: [17] },

  // Dermatologia
  { id: 30, name: "Urticária Aguda", cid: "L50", meds: [7, 37, 8], hospitalMeds: [
    "Hidrocortisona 200mg EV agora",
    "Prometazina 50mg IM dose única",
    "Adrenalina 0,3mg IM se anafilaxia",
  ]},
  { id: 31, name: "Dermatite Alérgica", cid: "L23", meds: [7, 36, 8], hospitalMeds: [
    "Hidrocortisona 100mg EV de 8/8h",
    "Prometazina 50mg IM de 12/12h",
  ]},
  { id: 32, name: "Escabiose (Sarna)", cid: "B86", meds: [60, 7] },
  { id: 33, name: "Micose Cutânea", cid: "B35", meds: [52, 15] },
  { id: 34, name: "Erisipela / Celulite", cid: "L03", meds: [9, 3, 4], hospitalMeds: [
    "Oxacilina 2g EV de 4/4h",
    "Clindamicina 600mg EV de 8/8h (alternativa)",
    "Dipirona 1g EV de 6/6h se dor ou febre",
    "Cetoprofeno 100mg EV de 12/12h",
  ]},

  // Reumatologia
  { id: 4, name: "Artrite Gotosa (Gota - Crise)", cid: "M10", meds: [
    // AINE (incluindo Colchicina como 1ª linha)
    400, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149,
    // Corticoide sistêmico
    160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173,
    // Corticoide injetável
    180, 181, 182, 183, 184, 185, 186,
    // Hipouricemiante
    401,
  ], hospitalMeds: [
    "Cetoprofeno 100mg EV de 12/12h",
    "Colchicina 0,5mg VO de 12/12h",
    "Dipirona 1g EV de 6/6h se dor",
    "Dexametasona 4mg EV de 12/12h por 3 dias",
  ]},
  { id: 35, name: "Gota (Prevenção)", cid: "M10", meds: [75] },
  { id: 36, name: "Lombalgia / Cervicalgia", cid: "M54", meds: [3, 24, 4, 27], hospitalMeds: [
    "Dipirona 1g EV de 6/6h",
    "Cetoprofeno 100mg EV de 12/12h",
    "Tramadol 100mg EV de 8/8h se dor intensa",
    "Ciclobenzaprina 5mg VO de 8/8h",
    "Dexametasona 4mg EV 1x/dia por 3 dias",
  ]},
  { id: 37, name: "Dor Muscular / Mialgia", cid: "M79", meds: [3, 4, 23], hospitalMeds: [
    "Dipirona 1g EV de 6/6h",
    "Cetoprofeno 100mg EV de 12/12h",
  ]},

  // Cardiologia / Crônicos
  { id: 9, name: "Hipertensão Arterial", cid: "I10", meds: [12, 42, 43, 44], hospitalMeds: [
    "Captopril 25mg SL se PAS > 180",
    "Nitroprussiato de sódio 0,5-3mcg/kg/min EV BIC (emergência)",
    "Furosemida 20mg EV se congestão",
  ]},
  { id: 10, name: "Diabetes Tipo 2", cid: "E11", meds: [11, 47], hospitalMeds: [
    "Insulina Regular conforme glicemia capilar de 4/4h",
    "Hidratação: SF 0,9% 1000mL EV em 6h",
    "Monitorar glicemia capilar de 4/4h",
  ]},
  { id: 38, name: "Dislipidemia", cid: "E78", meds: [14, 49, 50] },
  { id: 39, name: "Insuficiência Cardíaca (Manutenção)", cid: "I50", meds: [42, 13, 44], hospitalMeds: [
    "Furosemida 20-40mg EV de 8/8h",
    "Dobutamina 5-10mcg/kg/min EV BIC se choque",
    "Enalaprilato 1,25mg EV de 6/6h",
    "O2 suplementar se SpO2 < 94%",
    "Restrição hídrica e de sódio",
  ]},
  { id: 40, name: "Prevenção Cardiovascular", cid: "I25", meds: [72, 49] },
  { id: 41, name: "Hipotireoidismo", cid: "E03", meds: [74] },

  // Neurologia / Psiquiatria
  { id: 42, name: "Cefaleia Tensional", cid: "G44", meds: [4, 5, 3], hospitalMeds: [
    "Dipirona 1g EV de 6/6h",
    "Cetoprofeno 100mg EV de 12/12h",
    "Metoclopramida 10mg EV dose única",
  ]},
  { id: 43, name: "Enxaqueca", cid: "G43", meds: [4, 32, 55], hospitalMeds: [
    "Dipirona 1g EV dose única",
    "Metoclopramida 10mg EV dose única",
    "Dexametasona 4mg EV dose única",
    "Sumatriptano 6mg SC (se refratária)",
    "Hidratação: SF 0,9% 500mL EV",
  ]},
  { id: 44, name: "Depressão Leve/Moderada", cid: "F32", meds: [53, 54, 56] },
  { id: 45, name: "Transtorno de Ansiedade", cid: "F41", meds: [54, 56] },
  { id: 46, name: "Insônia", cid: "G47", meds: [55, 39] },

  // Hematologia / Suplementos
  { id: 3, name: "Anemia Ferropriva", cid: "D50", meds: [
    // Adulto
    300, 301, 302, 303, 304, 305, 306, 307, 308,
    // Pediátrico
    320, 321, 322, 323, 324, 325, 326, 327, 328,
  ], hospitalMeds: [
    "Hidróxido de ferro III 100mg EV diluído em SF 100mL em 30min",
    "Ácido fólico 5mg VO 1x/dia",
  ]},
  { id: 47, name: "Deficiência de Vitamina D", cid: "E55", meds: [70] },
  { id: 48, name: "Pré-natal (Suplementação)", cid: "Z34", meds: [67, 68, 69] },

  // Infectologia
  { id: 49, name: "Candidíase Oral (Sapinho)", cid: "B37.0", meds: [51] },
  { id: 50, name: "Herpes Zoster (Sintomático)", cid: "B02", meds: [4, 27, 55], hospitalMeds: [
    "Aciclovir 10mg/kg EV de 8/8h",
    "Dipirona 1g EV de 6/6h se dor",
    "Tramadol 100mg EV de 8/8h se dor intensa",
  ]},
];

export const PREGNANCY_RISK_INFO: Record<string, { label: string; color: string; description: string }> = {
  A: { label: "A", color: "text-green-600 bg-green-100", description: "Seguro" },
  B: { label: "B", color: "text-blue-600 bg-blue-100", description: "Provavelmente seguro" },
  C: { label: "C", color: "text-yellow-700 bg-yellow-100", description: "Usar com cautela" },
  D: { label: "D", color: "text-orange-700 bg-orange-100", description: "Evidência de risco" },
  X: { label: "X", color: "text-red-700 bg-red-100", description: "Contraindicado" },
};

export const PRESCRIPTION_TYPE_INFO: Record<string, { label: string; color: string; description: string; printLabel: string }> = {
  comum: { label: "Comum", color: "text-foreground bg-muted", description: "Receita simples", printLabel: "RECEITA MÉDICA" },
  branca2vias: { label: "2 Vias", color: "text-blue-700 bg-blue-100", description: "Receita branca em 2 vias (antibióticos)", printLabel: "RECEITA MÉDICA — 2 VIAS (ANTIBIÓTICO)" },
  amarela: { label: "Amarela", color: "text-yellow-800 bg-yellow-100", description: "Receita amarela — Notificação A (opioides/entorpecentes)", printLabel: "NOTIFICAÇÃO DE RECEITA \"A\" (AMARELA)" },
  azul: { label: "Azul", color: "text-sky-700 bg-sky-100", description: "Receita azul — Notificação B (psicotrópicos)", printLabel: "NOTIFICAÇÃO DE RECEITA \"B\" (AZUL)" },
};
