import type { ExamItem } from "../types/clinical";

export const EXAMS_LIBRARY: ExamItem[] = [
  // Hematologia
  { id: "hemograma", name: "Hemograma completo", category: "Hematologia", defaultJustification: "Avaliação clínica de rotina.", synonyms: ["hmg"] },
  { id: "vhs", name: "VHS", category: "Hematologia", defaultJustification: "Investigação de processo inflamatório." },
  { id: "ferritina", name: "Ferritina", category: "Hematologia", defaultJustification: "Investigação de anemia/estoques de ferro." },

  // Bioquímica
  { id: "glicemia-jejum", name: "Glicemia de jejum", category: "Bioquímica", defaultJustification: "Rastreio metabólico.", synonyms: ["glicose"] },
  { id: "hba1c", name: "Hemoglobina glicada", category: "Bioquímica", defaultJustification: "Controle glicêmico.", synonyms: ["a1c"] },
  { id: "perfil-lipidico", name: "Perfil lipídico (CT, HDL, LDL, TG)", category: "Bioquímica", defaultJustification: "Rastreio cardiovascular." },
  { id: "tgo-tgp", name: "TGO / TGP", category: "Bioquímica", defaultJustification: "Avaliação hepática." },
  { id: "ureia-creatinina", name: "Ureia e creatinina", category: "Bioquímica", defaultJustification: "Avaliação da função renal." },
  { id: "tsh-t4l", name: "TSH e T4 livre", category: "Bioquímica", defaultJustification: "Rastreio tireoidiano." },
  { id: "pcr", name: "PCR ultrassensível", category: "Bioquímica", defaultJustification: "Investigação de processo inflamatório." },

  // Urina / Fezes
  { id: "eas", name: "EAS / Urina tipo 1", category: "Uroanálise", defaultJustification: "Rastreio urinário." },
  { id: "urocultura", name: "Urocultura com antibiograma", category: "Uroanálise", defaultJustification: "Suspeita de ITU." },
  { id: "epf", name: "Parasitológico de fezes (3 amostras)", category: "Parasitologia", defaultJustification: "Rastreio parasitológico." },

  // Imagem
  { id: "rx-torax", name: "Radiografia de tórax PA + perfil", category: "Imagem", defaultJustification: "Avaliação respiratória.", synonyms: ["raio x torax"] },
  { id: "us-abdome", name: "Ultrassom de abdome total", category: "Imagem", defaultJustification: "Investigação abdominal." },
  { id: "ecg", name: "Eletrocardiograma de repouso", category: "Cardiologia", defaultJustification: "Avaliação cardiológica." },
  { id: "ecocardiograma", name: "Ecocardiograma transtorácico", category: "Cardiologia", defaultJustification: "Investigação cardíaca estrutural." },
];
