/**
 * Automação por patologia — combos de exames + sinais de alarme.
 *
 * Filosofia
 * ---------
 * Ao escolher a patologia, o médico já recebe:
 *   1. Combo de exames (laboratoriais + imagem) relevantes para o quadro.
 *   2. Sinais de alarme específicos daquela condição.
 * Tudo é apenas SUGESTÃO: os itens caem nos formulários normais de
 * "Solicitação de exames" e "Orientações & retorno", onde podem ser
 * editados, adicionados ou removidos livremente.
 *
 * Implementação por palavra-chave (nome + sinônimos + subtipo), o que evita
 * acoplamento a IDs e cobre automaticamente novas patologias equivalentes.
 */

export interface PathologyCombo {
  /** Rótulo do combo, exibido no painel. */
  label: string;
  /** Exames laboratoriais sugeridos. */
  labs: string[];
  /** Exames de imagem / gráficos sugeridos. */
  imaging: string[];
  /** Sinais de alarme específicos do quadro. */
  redFlags: string[];
}

interface ComboRule extends PathologyCombo {
  /** Termos (normalizados) que ativam a regra. */
  match: string[];
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Sinais de alarme universais — sempre sugeridos, em qualquer quadro. */
export const UNIVERSAL_RED_FLAGS: string[] = [
  "Febre persistente por mais de 72h ou acima de 39°C",
  "Falta de ar, dor no peito ou palpitações",
  "Sonolência excessiva, confusão mental ou desmaio",
  "Piora progressiva dos sintomas apesar do tratamento",
];

const RULES: ComboRule[] = [
  {
    match: ["amigdalite", "faringite", "faringoamigdalite", "ivas", "gripe", "resfriado", "laringite"],
    label: "Vias aéreas superiores",
    labs: ["Hemograma completo", "PCR (proteína C reativa)"],
    imaging: [],
    redFlags: [
      "Dificuldade para engolir saliva ou abrir a boca",
      "Voz abafada, salivação ou abaulamento de amígdala",
      "Estridor ou dificuldade respiratória",
      "Febre persistente após 48-72h de antibiótico",
    ],
  },
  {
    match: ["sinusite"],
    label: "Sinusite",
    labs: ["Hemograma completo", "PCR (proteína C reativa)"],
    imaging: ["Tomografia de seios da face"],
    redFlags: [
      "Edema ou vermelhidão ao redor dos olhos",
      "Alteração visual ou dor ocular intensa",
      "Cefaleia intensa com vômitos ou rigidez de nuca",
    ],
  },
  {
    match: ["otite"],
    label: "Otite",
    labs: [],
    imaging: [],
    redFlags: [
      "Secreção purulenta persistente ou sangramento pelo ouvido",
      "Dor ou edema atrás da orelha (mastoide)",
      "Paralisia facial, tontura intensa ou perda auditiva súbita",
    ],
  },
  {
    match: ["pneumonia", "bronquite", "bronquiolite", "insuficiencia respiratoria", "covid", "influenza"],
    label: "Infecção respiratória baixa",
    labs: ["Hemograma completo", "PCR (proteína C reativa)", "Ureia", "Creatinina", "Sódio", "Potássio"],
    imaging: ["Raio-X de tórax PA + perfil"],
    redFlags: [
      "Frequência respiratória elevada, tiragem ou uso de musculatura acessória",
      "Saturação de oxigênio abaixo de 94%",
      "Cianose (lábios ou extremidades arroxeadas)",
      "Dor torácica ventilatório-dependente ou escarro com sangue",
    ],
  },
  {
    match: ["asma", "broncoespasmo", "dpoc"],
    label: "Crise obstrutiva",
    labs: [],
    imaging: ["Raio-X de tórax PA + perfil"],
    redFlags: [
      "Falta de ar em repouso ou dificuldade para falar frases completas",
      "Chiado que não melhora após a medicação de resgate",
      "Sonolência, agitação ou cianose",
    ],
  },
  {
    match: ["itu", "cistite", "pielonefrite", "uretrite", "infeccao urinaria"],
    label: "Infecção do trato urinário",
    labs: ["EAS / Urina I", "Urocultura com antibiograma", "Hemograma completo", "Creatinina", "Ureia"],
    imaging: ["USG rins e vias urinárias"],
    redFlags: [
      "Febre alta com calafrios ou dor lombar (punho-percussão positiva)",
      "Vômitos que impedem o uso do antibiótico oral",
      "Ausência de urina ou urina com sangue",
    ],
  },
  {
    match: ["colica renal", "litiase", "nefrolitiase", "calculo renal"],
    label: "Cólica renal",
    labs: ["EAS / Urina I", "Creatinina", "Ureia", "Hemograma completo"],
    imaging: ["USG rins e vias urinárias", "Uro-TC"],
    redFlags: [
      "Febre associada à dor lombar",
      "Dor refratária à analgesia prescrita",
      "Ausência de urina ou vômitos incoercíveis",
    ],
  },
  {
    match: ["diarreia", "gastroenterite", "gea", "desidratacao", "vomito"],
    label: "Gastroenterite / desidratação",
    labs: ["Hemograma completo", "Sódio", "Potássio", "Creatinina", "Ureia", "Parasitológico de fezes (3 amostras)"],
    imaging: [],
    redFlags: [
      "Sinais de desidratação (boca seca, olhos fundos, urina escassa)",
      "Vômitos persistentes que impedem hidratação oral",
      "Sangue ou muco abundante nas fezes",
      "Dor abdominal intensa ou refratária",
    ],
  },
  {
    match: ["abdome agudo", "apendicite", "colecistite", "pancreatite", "dor abdominal"],
    label: "Dor abdominal / abdome agudo",
    labs: ["Hemograma completo", "PCR (proteína C reativa)", "Amilase", "Lipase", "TGO (AST)", "TGP (ALT)", "Bilirrubinas totais e frações", "EAS / Urina I", "Beta-HCG quantitativo"],
    imaging: ["USG abdominal total", "Tomografia de abdome e pelve com contraste"],
    redFlags: [
      "Dor abdominal intensa, contínua ou refratária à analgesia",
      "Abdome rígido, distendido ou com parada de eliminação de gases e fezes",
      "Vômitos persistentes ou com sangue",
      "Febre associada ou icterícia",
    ],
  },
  {
    match: ["hemorragia digestiva", "melena", "hematemese"],
    label: "Hemorragia digestiva",
    labs: ["Hemograma completo", "Coagulograma (TP/INR, TTPA)", "Ureia", "Creatinina", "Tipagem sanguínea"],
    imaging: ["Endoscopia digestiva alta"],
    redFlags: [
      "Vômito com sangue ou fezes escurecidas (melena)",
      "Tontura, palidez intensa ou desmaio",
      "Frequência cardíaca elevada com pressão baixa",
    ],
  },
  {
    match: ["dor toracica", "infarto", "iam", "sindrome coronariana", "angina"],
    label: "Dor torácica / síndrome coronariana",
    labs: ["Troponina", "CPK", "Hemograma completo", "Creatinina", "Potássio", "Glicemia de jejum", "Coagulograma (TP/INR, TTPA)"],
    imaging: ["Eletrocardiograma de repouso", "Raio-X de tórax PA + perfil", "Ecocardiograma transtorácico"],
    redFlags: [
      "Dor no peito em aperto, com irradiação para braço, mandíbula ou dorso",
      "Sudorese fria, náusea ou falta de ar associadas",
      "Desmaio ou palpitações sustentadas",
    ],
  },
  {
    match: ["hipertensao", "has", "crise hipertensiva", "pressao alta"],
    label: "Hipertensão arterial",
    labs: ["Creatinina", "Ureia", "Potássio", "Sódio", "Glicemia de jejum", "Colesterol total e frações", "Triglicerídeos", "EAS / Urina I"],
    imaging: ["Eletrocardiograma de repouso"],
    redFlags: [
      "PA acima de 180/120 mmHg com sintomas",
      "Cefaleia intensa, alteração visual ou déficit neurológico",
      "Dor torácica ou falta de ar",
    ],
  },
  {
    match: ["avc", "acidente vascular", "deficit neurologico"],
    label: "AVC / déficit neurológico",
    labs: ["Hemograma completo", "Glicemia de jejum", "Coagulograma (TP/INR, TTPA)", "Sódio", "Potássio", "Creatinina", "Troponina"],
    imaging: ["Tomografia de crânio sem contraste", "Eletrocardiograma de repouso"],
    redFlags: [
      "Perda súbita de força ou sensibilidade em um lado do corpo",
      "Dificuldade para falar ou entender, boca torta",
      "Perda visual súbita ou desequilíbrio importante",
    ],
  },
  {
    match: ["cefaleia", "enxaqueca", "migranea"],
    label: "Cefaleia",
    labs: ["Hemograma completo", "PCR (proteína C reativa)"],
    imaging: ["Tomografia de crânio sem contraste"],
    redFlags: [
      "Cefaleia súbita e de forte intensidade (pior da vida)",
      "Febre com rigidez de nuca",
      "Alteração visual, confusão mental ou déficit neurológico",
      "Dor que piora progressivamente ou desperta à noite",
    ],
  },
  {
    match: ["convulsao", "crise convulsiva", "epilepsia"],
    label: "Crise convulsiva",
    labs: ["Glicemia de jejum", "Sódio", "Potássio", "Cálcio total", "Magnésio", "Hemograma completo"],
    imaging: ["Tomografia de crânio sem contraste"],
    redFlags: [
      "Nova crise convulsiva ou crise com duração maior que 5 minutos",
      "Não recuperação da consciência após a crise",
      "Febre associada ou trauma craniano",
    ],
  },
  {
    match: ["dengue", "chikungunya", "zika", "arbovirose"],
    label: "Arbovirose",
    labs: ["Hemograma completo", "Plaquetas", "Sorologia dengue (IgM/IgG/NS1)", "TGO (AST)", "TGP (ALT)", "Creatinina"],
    imaging: [],
    redFlags: [
      "Dor abdominal intensa e contínua",
      "Vômitos persistentes",
      "Sangramento de mucosas (gengiva, nariz) ou manchas roxas",
      "Tontura ao levantar, queda de pressão ou letargia",
    ],
  },
  {
    match: ["sepse", "choque septico"],
    label: "Sepse",
    labs: ["Hemograma completo", "PCR (proteína C reativa)", "Procalcitonina", "Lactato", "Hemocultura (2 amostras)", "Urocultura com antibiograma", "Creatinina", "Ureia", "Coagulograma (TP/INR, TTPA)"],
    imaging: ["Raio-X de tórax PA + perfil"],
    redFlags: [
      "Confusão mental ou sonolência",
      "Pressão arterial baixa ou extremidades frias",
      "Respiração acelerada ou queda da saturação",
      "Redução importante do volume urinário",
    ],
  },
  {
    match: ["anafilaxia", "urticaria", "alergia", "angioedema"],
    label: "Reação alérgica",
    labs: ["Hemograma completo"],
    imaging: [],
    redFlags: [
      "Inchaço de lábios, língua ou garganta",
      "Falta de ar, chiado ou rouquidão",
      "Tontura, desmaio ou queda de pressão",
      "Placas que se espalham rapidamente pelo corpo",
    ],
  },
  {
    match: ["diabetes", "cetoacidose", "hiperglicemia", "hipoglicemia"],
    label: "Descompensação glicêmica",
    labs: ["Glicemia de jejum", "Hemoglobina glicada (HbA1c)", "Sódio", "Potássio", "Creatinina", "Ureia", "EAS / Urina I", "Microalbuminúria 24h"],
    imaging: [],
    redFlags: [
      "Glicemia capilar muito alta com náusea, vômito ou dor abdominal",
      "Respiração rápida e profunda ou hálito adocicado",
      "Sonolência, confusão mental ou desmaio",
      "Hipoglicemia com sudorese e tremores que não melhora após ingesta",
    ],
  },
  {
    match: ["lombalgia", "dor lombar", "cervicalgia", "fibromialgia"],
    label: "Dor musculoesquelética",
    labs: ["Hemograma completo", "PCR (proteína C reativa)", "VHS"],
    imaging: ["Raio-X de coluna lombar"],
    redFlags: [
      "Perda de força ou dormência nas pernas",
      "Perda de controle da urina ou das fezes",
      "Febre, perda de peso ou dor noturna incapacitante",
    ],
  },
  {
    match: ["celulite", "erisipela", "abscesso", "ferida", "pe diabetico"],
    label: "Infecção de pele e partes moles",
    labs: ["Hemograma completo", "PCR (proteína C reativa)", "Glicemia de jejum", "Creatinina"],
    imaging: ["USG cervical / partes moles"],
    redFlags: [
      "Vermelhidão que se expande rapidamente",
      "Febre alta, calafrios ou queda do estado geral",
      "Dor desproporcional, bolhas ou área escurecida na pele",
    ],
  },
  {
    match: ["colica menstrual", "dismenorreia", "sangramento uterino"],
    label: "Ginecológico",
    labs: ["Beta-HCG quantitativo", "Hemograma completo"],
    imaging: ["USG pélvica", "USG transvaginal"],
    redFlags: [
      "Dor abdominal intensa com desmaio ou palidez",
      "Sangramento vaginal abundante e contínuo",
      "Febre com corrimento de odor fétido",
    ],
  },
];

/** Combo genérico quando nenhuma regra específica casa. */
const FALLBACK: PathologyCombo = {
  label: "Avaliação inicial",
  labs: ["Hemograma completo", "PCR (proteína C reativa)"],
  imaging: [],
  redFlags: [],
};

/**
 * Resolve o combo (exames + sinais de alarme) de uma patologia.
 * Combina TODAS as regras que casam, deduplicando itens.
 */
export const getPathologyCombo = (input: {
  name: string;
  synonyms?: string[];
  category?: string;
}): PathologyCombo => {
  const haystack = norm([input.name, ...(input.synonyms ?? []), input.category ?? ""].join(" "));
  const hits = RULES.filter((r) => r.match.some((m) => haystack.includes(m)));

  if (hits.length === 0) {
    return { ...FALLBACK, redFlags: [...UNIVERSAL_RED_FLAGS] };
  }

  const uniq = (xs: string[]) => Array.from(new Set(xs));
  return {
    label: hits.map((h) => h.label).join(" · "),
    labs: uniq(hits.flatMap((h) => h.labs)),
    imaging: uniq(hits.flatMap((h) => h.imaging)),
    redFlags: uniq([...hits.flatMap((h) => h.redFlags), ...UNIVERSAL_RED_FLAGS]),
  };
};
