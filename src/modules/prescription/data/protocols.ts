import type { ProtocolTemplate } from "../types/clinical";

/**
 * Protocolos/modelos prontos por contexto.
 * Cada protocolo aponta para IDs do banco farmacológico legado, da
 * biblioteca de exames e da biblioteca de orientações.
 */
export const PROTOCOLS_LIBRARY: ProtocolTemplate[] = [
  {
    id: "amigdalite-bacteriana",
    name: "Amigdalite bacteriana",
    specialty: "Otorrinolaringologia",
    medicationIds: [9 /* Cefalexina */, 4 /* Dipirona */, 8 /* Prednisona */],
    orientations: ["ivas-virais"],
    notes: "Reavaliar em 48-72h. Considerar swab se recorrência.",
  },
  {
    id: "ivas-viral",
    name: "IVAS viral — sintomáticos",
    specialty: "Geral/Pediatria",
    medicationIds: [5 /* Paracetamol */, 7 /* Loratadina */],
    orientations: ["ivas-virais"],
  },
  {
    id: "gea-leve",
    name: "Gastroenterite aguda — leve a moderada",
    specialty: "Geral/Pediatria",
    medicationIds: [35 /* Ondansetrona */],
    orientations: ["gastroenterite"],
    examIds: ["epf", "hemograma"],
  },
  {
    id: "lombalgia-aguda",
    name: "Lombalgia aguda inespecífica",
    specialty: "Ortopedia",
    medicationIds: [3 /* Ibuprofeno */, 6 /* Omeprazol */],
    orientations: ["lombalgia-aguda"],
  },
];
