/**
 * Base de conhecimento por patologia — Etapa 3 (correlação automática).
 *
 * Cada patologia pode ser vinculada a: anamnese dirigida, exame físico,
 * diagnósticos diferenciais, exames complementares, condutas farmacológicas,
 * CIDs, encaminhamentos, protocolos e escores de gravidade.
 *
 * A correspondência é por palavra-chave (nome + sinônimos + categoria),
 * o mesmo padrão de `pathologyAutomation.ts`, evitando acoplamento a IDs.
 *
 * Tudo aqui é SUGESTÃO revisável — nunca decisão automática.
 */

import type { ClinicalSeverity, ClinicalEnvironment } from "../types/prescription";

/** Perfis de paciente que alteram condutas e doses. */
export type PatientProfile =
  | "cardiopata"
  | "nefropata"
  | "hepatopata"
  | "geriatrico"
  | "pediatrico"
  | "obstetrico"
  | "oncologico";

export const PROFILE_LABEL: Record<PatientProfile, string> = {
  cardiopata: "Cardiopata",
  nefropata: "Nefropata",
  hepatopata: "Hepatopata",
  geriatrico: "Geriátrico",
  pediatrico: "Pediátrico",
  obstetrico: "Obstétrico",
  oncologico: "Oncológico",
};

export interface PathologyKnowledge {
  /** Rótulo do bloco correlacionado. */
  label: string;
  anamnese: string[];
  exameFisico: string[];
  diferenciais: string[];
  /** Exames complementares usuais (rótulo livre). */
  exames: string[];
  /** Condutas farmacológicas padrão (texto clínico). */
  condutas: string[];
  /** CIDs correlatos. */
  cids: string[];
  /** Encaminhamentos mais adequados (especialidades). */
  encaminhamentos: string[];
  /** Protocolos específicos aplicáveis. */
  protocolos: string[];
  /** Escores de gravidade aplicáveis. */
  escores: string[];
  /** Restrições por perfil do paciente. */
  restricoes: Partial<Record<PatientProfile, string[]>>;
}

export interface KnowledgeRule extends PathologyKnowledge {
  match: string[];
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const EMPTY: PathologyKnowledge = {
  label: "",
  anamnese: [],
  exameFisico: [],
  diferenciais: [],
  exames: [],
  condutas: [],
  cids: [],
  encaminhamentos: [],
  protocolos: [],
  escores: [],
  restricoes: {},
};

const RULES: KnowledgeRule[] = [
  {
    match: ["amigdalite", "faringoamigdalite", "faringite", "tonsilite", "odinofagia"],
    label: "Amigdalite aguda",
    anamnese: [
      "Odinofagia, febre e tempo de evolução",
      "Tosse e coriza (sugerem etiologia viral)",
      "Contatos com faringite estreptocócica",
      "Recorrência: episódios nos últimos 12 meses",
    ],
    exameFisico: [
      "Hiperemia e exsudato amigdaliano",
      "Linfonodomegalia cervical anterior dolorosa",
      "Trismo, sialorreia e desvio de úvula (complicação)",
    ],
    diferenciais: [
      "Faringite viral",
      "Mononucleose infecciosa",
      "Abscesso periamigdaliano",
      "Epiglotite",
      "Difteria",
    ],
    exames: [
      "Teste rápido para estreptococo",
      "Cultura de orofaringe",
      "Hemograma e monoteste (suspeita de mononucleose)",
      "TC de pescoço com contraste (suspeita de abscesso)",
    ],
    condutas: [
      "Analgesia com dipirona ou paracetamol; AINE se sem contraindicação",
      "Estreptocócica provável: amoxicilina 500 mg VO 8/8h por 10 dias (criança 50 mg/kg/dia)",
      "Alergia à penicilina: azitromicina 500 mg/dia por 3 dias",
      "Hidratação oral e dieta pastosa/fria",
    ],
    cids: ["J03.9", "J02.0", "J36"],
    encaminhamentos: ["Otorrinolaringologia", "Pronto-socorro (suspeita de abscesso)"],
    protocolos: ["Escore de Centor/McIsaac", "Critérios de Paradise para amigdalectomia"],
    escores: ["Centor/McIsaac"],
    restricoes: {
      obstetrico: ["Preferir betalactâmicos; evitar quinolonas e tetraciclinas"],
      pediatrico: ["Dose por peso; evitar AAS (risco de Reye)"],
      nefropata: ["Ajustar amoxicilina pelo clearance; evitar AINE"],
      hepatopata: ["Cautela com amoxicilina-clavulanato e paracetamol em dose plena"],
    },
  },
  {
    match: ["pneumonia", "pac", "broncopneumonia"],
    label: "Pneumonia adquirida na comunidade",
    anamnese: [
      "Tempo de tosse, febre e expectoração",
      "Dispneia, dor pleurítica e calafrios",
      "Comorbidades, tabagismo e uso recente de antibiótico",
    ],
    exameFisico: [
      "Frequência respiratória, saturação e temperatura",
      "Ausculta: crepitações, sopro tubário, redução do murmúrio",
      "Sinais de esforço respiratório e nível de consciência",
    ],
    diferenciais: ["Insuficiência cardíaca descompensada", "TEP", "COVID-19", "Tuberculose", "Neoplasia pulmonar"],
    exames: ["Radiografia de tórax", "Hemograma completo", "PCR", "Ureia e creatinina", "Gasometria arterial", "Hemocultura (se internação)"],
    condutas: [
      "Ambulatorial hígido: amoxicilina 500 mg VO 8/8h por 7 dias",
      "Comorbidade/uso recente de ATB: amoxicilina-clavulanato + macrolídeo",
      "Internação: ceftriaxona 1 g IV 12/12h + azitromicina 500 mg IV/VO",
      "Oxigênio para manter SpO₂ ≥ 94% (≥ 90% em DPOC)",
    ],
    cids: ["J18.9", "J15.9", "J13"],
    encaminhamentos: ["Pneumologia", "Clínica médica", "UTI (se instabilidade)"],
    protocolos: ["Protocolo de sepse (se critérios)", "Protocolo de PAC do serviço"],
    escores: ["CURB-65", "CRB-65", "qSOFA", "SMART-COP", "PSI/PORT"],
    restricoes: {
      nefropata: ["Ajustar dose de betalactâmicos pelo clearance", "Evitar AINE"],
      cardiopata: ["Atenção à sobrecarga hídrica na hidratação"],
      geriatrico: ["Delirium pode ser a única manifestação", "Baixo limiar para internação"],
      obstetrico: ["Evitar quinolonas e tetraciclinas", "Preferir betalactâmicos e macrolídeos"],
      hepatopata: ["Cautela com macrolídeos e amoxicilina-clavulanato"],
    },
  },
  {
    match: ["itu", "cistite", "pielonefrite", "infeccao urinaria", "infecção urinária"],
    label: "Infecção do trato urinário",
    anamnese: ["Disúria, urgência e polaciúria", "Febre, dor lombar e vômitos", "ITU prévia, gestação, sondagem, litíase"],
    exameFisico: ["Giordano", "Dor suprapúbica", "Sinais vitais e desidratação"],
    diferenciais: ["Vaginite/uretrite", "Litíase renal", "Apendicite", "DIP"],
    exames: ["EAS/urina tipo 1", "Urocultura com antibiograma", "Hemograma", "Ureia e creatinina", "USG de rins e vias urinárias (se complicada)"],
    condutas: [
      "Cistite não complicada: nitrofurantoína 100 mg VO 6/6h por 5 dias",
      "Alternativa: fosfomicina 3 g dose única",
      "Pielonefrite ambulatorial: ciprofloxacino 500 mg VO 12/12h por 7 dias",
      "Pielonefrite grave: ceftriaxona 1 g IV/dia + hidratação",
    ],
    cids: ["N39.0", "N30.0", "N10"],
    encaminhamentos: ["Urologia (ITU de repetição)", "Nefrologia", "Ginecologia"],
    protocolos: ["Protocolo de ITU", "Protocolo de sepse de foco urinário"],
    escores: ["qSOFA", "SIRS", "NEWS2"],
    restricoes: {
      obstetrico: ["Nitrofurantoína evitar no 3º trimestre", "Quinolonas contraindicadas", "Tratar bacteriúria assintomática"],
      nefropata: ["Nitrofurantoína contraindicada se TFG < 30", "Ajustar quinolonas"],
      geriatrico: ["Não tratar bacteriúria assintomática", "Confusão aguda como sintoma"],
      pediatrico: ["Investigar refluxo vesicoureteral", "Evitar quinolonas"],
    },
  },
  {
    match: ["iam", "sindrome coronariana", "síndrome coronariana", "angina", "infarto", "sca"],
    label: "Síndrome coronariana aguda",
    anamnese: ["Início, caráter e irradiação da dor", "Fatores de risco cardiovascular", "Uso de nitrato, sildenafila e anticoagulante"],
    exameFisico: ["PA nos dois braços, FC e perfusão", "Ausculta cardíaca e pulmonar", "Sinais de congestão (Killip)"],
    diferenciais: ["Dissecção de aorta", "TEP", "Pericardite", "Espasmo esofágico"],
    exames: ["ECG de 12 derivações em até 10 min", "Troponina seriada", "Hemograma, eletrólitos, função renal", "Radiografia de tórax", "Ecocardiograma"],
    condutas: [
      "AAS 300 mg VO mastigável",
      "Clopidogrel/ticagrelor conforme estratégia de reperfusão",
      "Anticoagulação plena (enoxaparina ou HNF)",
      "Nitrato e morfina conforme dor; oxigênio se SpO₂ < 90%",
      "Acionar hemodinâmica / trombólise conforme tempo-porta",
    ],
    cids: ["I21.9", "I20.0", "I24.9"],
    encaminhamentos: ["Cardiologia / hemodinâmica", "UTI coronariana"],
    protocolos: ["Protocolo de dor torácica", "Via rápida de reperfusão (tempo porta-balão)"],
    escores: ["HEART", "GRACE", "TIMI", "CRUSADE (sangramento)", "Killip"],
    restricoes: {
      nefropata: ["Cuidado com contraste; hidratar", "Ajustar enoxaparina"],
      geriatrico: ["Maior risco de sangramento — reavaliar dupla antiagregação"],
      oncologico: ["Avaliar plaquetopenia antes de antiagregar/anticoagular"],
      obstetrico: ["Discutir reperfusão com equipe obstétrica"],
    },
  },
  {
    match: ["asma", "crise asmatica", "broncoespasmo", "sibilancia"],
    label: "Crise de asma",
    anamnese: ["Tempo de crise e uso de resgate", "Internações e uso prévio de corticoide", "Gatilhos e adesão ao controlador"],
    exameFisico: ["Saturação, FR e uso de musculatura acessória", "Ausculta: sibilos, tórax silencioso", "Fala entrecortada e cianose"],
    diferenciais: ["DPOC exacerbado", "Insuficiência cardíaca", "Corpo estranho", "Anafilaxia"],
    exames: ["Oximetria", "Pico de fluxo expiratório", "Radiografia de tórax (se suspeita de complicação)", "Gasometria (crise grave)"],
    condutas: [
      "Salbutamol inalatório 4-10 jatos ou nebulização a cada 20 min na 1ª hora",
      "Ipratrópio associado nas crises moderadas/graves",
      "Prednisona 40-50 mg VO por 5 dias (ou hidrocortisona IV)",
      "Sulfato de magnésio IV na crise grave refratária",
    ],
    cids: ["J45.9", "J46"],
    encaminhamentos: ["Pneumologia", "Alergologia", "UTI (se falência respiratória)"],
    protocolos: ["Protocolo de crise asmática (GINA)"],
    escores: ["PEF % do previsto", "Escore de gravidade GINA", "NEWS2"],
    restricoes: {
      cardiopata: ["Beta-agonista em alta dose: monitorar arritmia e taquicardia"],
      obstetrico: ["Tratar a crise agressivamente — hipóxia é o maior risco fetal"],
      pediatrico: ["Dose por peso; espaçador preferível à nebulização"],
    },
  },
  {
    match: ["hipertensao", "hipertensão", "has", "crise hipertensiva", "emergencia hipertensiva"],
    label: "Hipertensão arterial",
    anamnese: ["Adesão e medicações em uso", "Sintomas de lesão de órgão-alvo", "Uso de AINE, descongestionante e drogas"],
    exameFisico: ["PA nos dois braços após repouso", "Fundo de olho", "Ausculta cardíaca, pulsos e edema"],
    diferenciais: ["Pseudocrise (dor/ansiedade)", "Hipertensão secundária", "AVC", "Pré-eclâmpsia"],
    exames: ["ECG", "Ureia, creatinina e eletrólitos", "EAS", "Perfil lipídico e glicemia", "Fundoscopia"],
    condutas: [
      "Pseudocrise: analgesia/ansiolítico e reavaliação — não baixar PA rapidamente",
      "Urgência: ajuste de anti-hipertensivo VO com reavaliação em 24-72h",
      "Emergência: nitroprussiato/nitroglicerina IV em monitorização contínua",
    ],
    cids: ["I10", "I16.0", "I16.1"],
    encaminhamentos: ["Cardiologia", "Nefrologia", "UTI (emergência hipertensiva)"],
    protocolos: ["Protocolo de crise hipertensiva", "Protocolo de pré-eclâmpsia (gestante)"],
    escores: ["Risco cardiovascular global", "NEWS2"],
    restricoes: {
      obstetrico: ["IECA/BRA contraindicados", "Preferir metildopa, nifedipino e hidralazina"],
      nefropata: ["Monitorar creatinina e potássio ao iniciar IECA/BRA"],
      geriatrico: ["Reduzir PA gradualmente; risco de hipotensão e queda"],
    },
  },
  {
    match: ["diabetes", "cad", "cetoacidose", "hiperglicemia", "dm2", "dm1"],
    label: "Descompensação glicêmica",
    anamnese: ["Poliúria, polidipsia e perda de peso", "Infecção, omissão de insulina, corticoide", "Náusea, vômito e dor abdominal"],
    exameFisico: ["Hidratação, nível de consciência e hálito cetônico", "Ritmo de Kussmaul", "Sinais de foco infeccioso"],
    diferenciais: ["Estado hiperosmolar", "Acidose láctica", "Abdome agudo", "Sepse"],
    exames: ["Glicemia capilar e laboratorial", "Gasometria e ânion gap", "Cetonemia/cetonúria", "Eletrólitos com potássio", "Hemograma e EAS", "HbA1c"],
    condutas: [
      "CAD: hidratação com SF 0,9% + insulina regular IV em bomba",
      "Repor potássio antes da insulina se K < 3,3 mEq/L",
      "Tratar o fator precipitante (infecção é o mais comum)",
      "Ambulatorial: ajuste de metformina/insulina e educação alimentar",
    ],
    cids: ["E11.9", "E10.1", "E87.2"],
    encaminhamentos: ["Endocrinologia", "Nutrição", "UTI (CAD grave)"],
    protocolos: ["Protocolo de cetoacidose diabética", "Protocolo de insulinização"],
    escores: ["Ânion gap", "qSOFA", "APACHE II (UTI)"],
    restricoes: {
      nefropata: ["Metformina contraindicada se TFG < 30", "Ajustar insulina — risco de hipoglicemia"],
      geriatrico: ["Metas glicêmicas menos rígidas", "Evitar sulfonilureias de longa ação"],
      obstetrico: ["Apenas insulina; alvo glicêmico mais estrito"],
      hepatopata: ["Evitar metformina na disfunção grave"],
    },
  },
  {
    match: ["sepse", "choque septico", "choque séptico", "infeccao grave"],
    label: "Sepse e choque séptico",
    anamnese: ["Foco infeccioso provável", "Tempo de evolução e antibiótico prévio", "Imunossupressão, dispositivos e internação recente"],
    exameFisico: ["Sinais vitais completos e perfusão", "Nível de consciência", "Busca ativa do foco"],
    diferenciais: ["Choque cardiogênico", "Choque hipovolêmico", "Anafilaxia", "Intoxicação"],
    exames: ["Lactato arterial", "Hemoculturas (2 pares) antes do ATB", "Hemograma, função renal e hepática", "Gasometria", "Imagem do foco suspeito"],
    condutas: [
      "Pacote da 1ª hora: lactato, culturas, antibiótico amplo, 30 mL/kg de cristaloide",
      "Vasopressor (noradrenalina) se PAM < 65 após volume",
      "Controle do foco (drenagem/cirurgia) o quanto antes",
    ],
    cids: ["A41.9", "R65.2"],
    encaminhamentos: ["UTI", "Cirurgia (controle de foco)", "Infectologia"],
    protocolos: ["Protocolo institucional de sepse", "Surviving Sepsis Campaign"],
    escores: ["qSOFA", "SOFA", "NEWS2", "SIRS", "APACHE II"],
    restricoes: {
      cardiopata: ["Volume guiado por resposta — risco de congestão"],
      nefropata: ["Ajustar antibióticos; avaliar diálise precoce"],
      oncologico: ["Neutropenia febril: antibiótico em até 1h e isolamento"],
      obstetrico: ["Decúbito lateral esquerdo; avaliar vitalidade fetal"],
    },
  },
  {
    match: ["avc", "acidente vascular", "isquemia cerebral"],
    label: "Acidente vascular cerebral",
    anamnese: ["Horário do último momento assintomático", "Anticoagulação, cirurgia e sangramento recentes", "Déficit inicial e evolução"],
    exameFisico: ["NIHSS completo", "Glicemia capilar", "PA, ritmo cardíaco e sopro carotídeo"],
    diferenciais: ["Hipoglicemia", "Crise convulsiva com paralisia de Todd", "Enxaqueca com aura", "Lesão expansiva"],
    exames: ["TC de crânio sem contraste imediata", "Angio-TC", "Glicemia, coagulograma, hemograma", "ECG"],
    condutas: [
      "Trombólise IV até 4,5h se elegível",
      "Trombectomia mecânica conforme janela e oclusão de grande vaso",
      "Controle pressórico conforme estratégia de reperfusão",
      "Prevenção secundária e disfagia rastreada antes da dieta",
    ],
    cids: ["I63.9", "I64", "G45.9"],
    encaminhamentos: ["Neurologia / unidade de AVC", "Fisiatria e reabilitação", "UTI"],
    protocolos: ["Protocolo AVC / código AVC", "Escala pré-hospitalar de Cincinnati"],
    escores: ["NIHSS", "ABCD2 (AIT)", "Rankin modificado", "Glasgow"],
    restricoes: {
      geriatrico: ["Avaliar risco-benefício da trombólise e quedas"],
      oncologico: ["Neoplasia ativa aumenta risco hemorrágico"],
      obstetrico: ["Discussão multidisciplinar antes da trombólise"],
    },
  },
];

/** Restrições genéricas por perfil, aplicadas mesmo sem regra específica. */
export const GENERIC_PROFILE_RESTRICTIONS: Record<PatientProfile, string[]> = {
  cardiopata: [
    "Cuidado com AINE, corticoide e volume — risco de descompensação",
    "Rever fármacos que prolongam QT",
  ],
  nefropata: [
    "Ajustar doses pelo clearance de creatinina",
    "Evitar AINE, contraste iodado e nefrotóxicos",
  ],
  hepatopata: [
    "Reduzir paracetamol (máx. 2 g/dia) e evitar hepatotóxicos",
    "Cautela com benzodiazepínicos — risco de encefalopatia",
  ],
  geriatrico: [
    "Consultar critérios de Beers/STOPP antes de prescrever",
    "Iniciar com dose baixa e revisar polifarmácia",
  ],
  pediatrico: [
    "Dose por peso obrigatória; conferir apresentação e volume",
    "Evitar AAS (Reye) e medicamentos sem indicação pediátrica",
  ],
  obstetrico: [
    "Checar categoria de risco na gestação antes de prescrever",
    "Evitar IECA/BRA, quinolonas, tetraciclinas e retinoides",
  ],
  oncologico: [
    "Avaliar neutropenia, plaquetopenia e interação com quimioterápicos",
    "Febre em neutropênico é emergência médica",
  ],
};

export interface PathologyLookup {
  name: string;
  synonyms?: string[];
  category?: string;
}

/** Retorna o conhecimento correlacionado à patologia (vazio quando não há regra). */
export const getPathologyKnowledge = (p: PathologyLookup): PathologyKnowledge => {
  const haystack = norm([p.name, ...(p.synonyms ?? []), p.category ?? ""].join(" "));
  const rule = RULES.find((r) => r.match.some((m) => haystack.includes(norm(m))));
  if (!rule) return { ...EMPTY, label: p.name };
  const { match: _m, ...knowledge } = rule;
  return knowledge;
};

export const hasKnowledge = (k: PathologyKnowledge) =>
  k.exames.length > 0 ||
  k.condutas.length > 0 ||
  k.encaminhamentos.length > 0 ||
  k.protocolos.length > 0 ||
  k.escores.length > 0 ||
  k.anamnese.length > 0;

/** Perfis ativos derivados dos dados do paciente. */
export const deriveProfiles = (input: {
  isPediatric: boolean;
  isPregnant: boolean;
  ageInYears: number | null;
  hasRenalImpairment: boolean;
}): PatientProfile[] => {
  const out: PatientProfile[] = [];
  if (input.isPediatric) out.push("pediatrico");
  if (input.isPregnant) out.push("obstetrico");
  if ((input.ageInYears ?? 0) >= 60) out.push("geriatrico");
  if (input.hasRenalImpairment) out.push("nefropata");
  return out;
};

/** Restrições combinadas (específicas da patologia + genéricas do perfil). */
export const getProfileRestrictions = (
  k: PathologyKnowledge,
  profiles: PatientProfile[],
): Array<{ profile: PatientProfile; items: string[] }> =>
  profiles.map((profile) => ({
    profile,
    items: Array.from(
      new Set([...(k.restricoes[profile] ?? []), ...GENERIC_PROFILE_RESTRICTIONS[profile]]),
    ),
  }));

/** Alerta automático para quadros de alta gravidade. */
export const isHighSeverity = (
  environment: ClinicalEnvironment,
  severity?: ClinicalSeverity,
  isEmergency?: boolean,
) => environment === "emergencia" || isEmergency === true || severity === "grave" || severity === "critica";

/** Índice das patologias curadas — usado no hub para apontar lacunas. */
export const KNOWLEDGE_RULES: KnowledgeRule[] = RULES;
