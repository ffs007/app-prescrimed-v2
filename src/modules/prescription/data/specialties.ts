import type { SpecialtyItem } from "../types/clinical";

export const SPECIALTIES_LIBRARY: SpecialtyItem[] = [
  { id: "cardiologia", name: "Cardiologia", commonReasons: ["HAS de difícil controle", "Dor torácica em investigação", "Arritmia suspeita"] },
  { id: "endocrinologia", name: "Endocrinologia", commonReasons: ["DM descompensado", "Distúrbio tireoidiano", "Obesidade"] },
  { id: "ortopedia", name: "Ortopedia", commonReasons: ["Lesão ligamentar", "Fratura suspeita", "Dor articular crônica"] },
  { id: "neurologia", name: "Neurologia", commonReasons: ["Cefaleia refratária", "Déficit neurológico focal", "Convulsão"] },
  { id: "pneumologia", name: "Pneumologia", commonReasons: ["Asma de difícil controle", "DPOC", "Tosse crônica"] },
  { id: "otorrinolaringologia", name: "Otorrinolaringologia", commonReasons: ["Otite recorrente", "Sinusite crônica", "Hipoacusia"] },
  { id: "dermatologia", name: "Dermatologia", commonReasons: ["Lesão suspeita", "Dermatite refratária"] },
  { id: "gastroenterologia", name: "Gastroenterologia", commonReasons: ["Dispepsia refratária", "Doença do refluxo", "Hepatopatia"] },
  { id: "ginecologia", name: "Ginecologia", commonReasons: ["Sangramento uterino anormal", "Investigação de massa pélvica"] },
  { id: "psiquiatria", name: "Psiquiatria", commonReasons: ["Transtorno depressivo", "Ansiedade refratária"] },
  { id: "urologia", name: "Urologia", commonReasons: ["Hematúria", "ITU recorrente", "Litíase renal"] },
];
