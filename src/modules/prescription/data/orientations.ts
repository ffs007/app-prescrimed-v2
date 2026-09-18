import type { OrientationItem } from "../types/clinical";

/**
 * Biblioteca semente de orientações clínicas reutilizáveis.
 * Pode ser estendida por especialidade/contexto.
 */
export const ORIENTATIONS_LIBRARY: OrientationItem[] = [
  {
    id: "ivas-virais",
    title: "Infecção de vias aéreas — sintomáticos",
    category: "Pediatria/Geral",
    body: [
      "Hidratação oral aumentada e repouso conforme tolerância.",
      "Lavagem nasal com soro fisiológico 0,9% sempre que necessário.",
      "Antitérmico/analgésico se febre ≥ 37,8°C ou dor.",
      "Ambiente arejado e umidificado.",
    ].join("\n"),
    redFlags: [
      "Febre > 39°C persistente por mais de 48h",
      "Dificuldade respiratória, batimento de asa nasal ou tiragem",
      "Recusa alimentar importante ou sinais de desidratação",
      "Sonolência excessiva ou irritabilidade desproporcional",
    ],
    returnPlan: "Retorno em 48-72h se persistência de sintomas ou imediato em caso de sinais de alarme.",
    synonyms: ["resfriado", "gripe", "ivas", "rinite viral"],
  },
  {
    id: "gastroenterite",
    title: "Gastroenterite aguda — manejo domiciliar",
    category: "Pediatria/Geral",
    body: [
      "Manter alimentação habitual conforme aceitação.",
      "Oferecer soro de reidratação oral (SRO) após cada evacuação líquida.",
      "Evitar refrigerantes, sucos industrializados e leite integral.",
      "Higiene rigorosa das mãos.",
    ].join("\n"),
    redFlags: [
      "Vômitos persistentes que impedem hidratação oral",
      "Sinais de desidratação (boca seca, olhos fundos, choro sem lágrimas, oligúria)",
      "Sangue ou muco abundante nas fezes",
      "Letargia ou irritabilidade",
    ],
    returnPlan: "Retorno em 24-48h se não houver melhora ou imediato se sinais de alarme.",
    synonyms: ["diarreia", "vômito", "gea"],
  },
  {
    id: "hipertensao-controle",
    title: "Hipertensão — orientações de controle",
    category: "Cardiologia",
    body: [
      "Aferir pressão arterial em domicílio em horários padronizados.",
      "Reduzir consumo de sal (< 5g/dia) e ultraprocessados.",
      "Atividade física aeróbica regular (≥ 150 min/semana).",
      "Adesão estrita à medicação prescrita; não interromper sem orientação.",
    ].join("\n"),
    redFlags: [
      "PA > 180/120 mmHg com sintomas (cefaleia intensa, dispneia, alteração visual)",
      "Dor torácica ou déficit neurológico súbito",
    ],
    returnPlan: "Reavaliação em 30 dias com diário de PA. Imediato se sinais de alarme.",
    synonyms: ["has", "pressão alta"],
  },
  {
    id: "lombalgia-aguda",
    title: "Lombalgia aguda — medidas não farmacológicas",
    category: "Ortopedia",
    body: [
      "Manter atividade conforme tolerância; evitar repouso prolongado.",
      "Aplicação de calor local 20 min, 2-3x/dia.",
      "Postura adequada; evitar carga > 5 kg na fase aguda.",
    ].join("\n"),
    redFlags: [
      "Dor irradiada com perda de força ou parestesia",
      "Incontinência urinária ou fecal",
      "Febre associada ou perda ponderal não intencional",
    ],
    returnPlan: "Reavaliação em 7-14 dias se persistência. Imediato se sinais neurológicos.",
    synonyms: ["dor lombar", "lombar"],
  },
];
