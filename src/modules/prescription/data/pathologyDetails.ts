/**
 * Seções clínicas detalhadas por patologia.
 *
 * Complementa `pathologyKnowledge.ts` com alta especificidade por condição:
 * anamnese dirigida (com campos extras por perfil), diferenciais priorizados,
 * exame físico (sinais cardinais / gravidade / atípicos), exames
 * complementares separados por natureza, conduta inicial e de manutenção,
 * critérios de decisão (alta / observação / internação), monitorização e
 * blocos de alerta tempo-dependentes.
 *
 * Tudo é SUGESTÃO revisável — nunca decisão automática.
 */

import type { ClinicalSeverity, ClinicalEnvironment } from "../types/prescription";
import type { PatientProfile } from "./pathologyKnowledge";

export type DifferentialWeight = "alta" | "media" | "baixa";

export interface PathologyDifferential {
  nome: string;
  probabilidade: DifferentialWeight;
  /** Pista clínica que aumenta ou reduz a suspeita. */
  pista?: string;
}

export interface PathologyPhysicalExam {
  cardinais: string[];
  gravidade: string[];
  tipicos: string[];
  atipicos: string[];
}

export interface PathologyWorkup {
  laboratoriais: string[];
  imagem: string[];
  outros: string[];
}

export interface PathologyPlan {
  inicial: string[];
  manutencao: string[];
}

export interface PathologyDecision {
  alta: string[];
  observacao: string[];
  internacao: string[];
}

export interface PathologyMonitoring {
  itens: string[];
  /** Intervalos sugeridos de reavaliação. */
  reavaliacao: string[];
}

export interface PathologyDetail {
  anamnese: string[];
  /** Campos adicionais conforme o perfil do paciente. */
  anamnesePerfil?: Partial<Record<PatientProfile, string[]>>;
  diferenciais: PathologyDifferential[];
  exameFisico: PathologyPhysicalExam;
  exames: PathologyWorkup;
  conduta: PathologyPlan;
  decisao: PathologyDecision;
  monitorizacao: PathologyMonitoring;
  /** Intervenções tempo-dependentes (mostradas em destaque). */
  tempoDependentes?: string[];
  /** Gatilhos de escalonamento de cuidado. */
  escalonamento?: string[];
}

export const DIFFERENTIAL_LABEL: Record<DifferentialWeight, string> = {
  alta: "Mais provável",
  media: "Considerar",
  baixa: "Não perder",
};

/** Campos de anamnese exigidos pelo perfil, independentes da patologia. */
export const PROFILE_ANAMNESIS: Partial<Record<PatientProfile, string[]>> = {
  obstetrico: [
    "Idade gestacional (DUM / USG mais precoce)",
    "Número de gestações, partos e abortos (G/P/A)",
    "Movimentos fetais nas últimas 24h",
    "Perdas vaginais: sangue, líquido ou secreção",
    "Pré-natal: nº de consultas, sorologias e vacinas",
  ],
  pediatrico: [
    "Peso atual e curva de crescimento (percentil peso/estatura)",
    "Marcos do desenvolvimento neuropsicomotor",
    "Caderneta de imunizações em dia",
    "Aceitação alimentar, diurese e nº de fraldas",
    "Frequência a creche/escola e contatos doentes",
  ],
  geriatrico: [
    "Funcionalidade prévia e risco de queda",
    "Polifarmácia e adesão",
    "Estado cognitivo basal (mudança aguda = delirium)",
  ],
  oncologico: [
    "Neoplasia, estadiamento e data do último ciclo",
    "Contagem de neutrófilos mais recente",
  ],
  nefropata: ["Estágio da doença renal, TFG basal e diálise (dias/turnos)"],
  hepatopata: ["Etiologia, Child-Pugh prévio, ascite e encefalopatia"],
  cardiopata: ["Classe funcional NYHA, FEVE conhecida e dispositivos"],
};

/** Blocos de alerta automáticos por classe de gravidade. */
export const SEVERITY_ALERT_BLOCKS: Record<ClinicalSeverity, string[]> = {
  leve: [
    "Confirmar critérios de alta e orientar sinais de retorno por escrito",
    "Reavaliar em 48-72h se não houver melhora",
  ],
  moderada: [
    "Reavaliar sinais vitais em 30-60 minutos",
    "Definir explicitamente alta, observação ou internação após reavaliação",
    "Registrar resposta à primeira intervenção",
  ],
  grave: [
    "Checar sinais de choque (perfusão, PA, lactato, diurese)",
    "Avaliar via aérea e necessidade de suporte ventilatório",
    "Reavaliar PA e FR a cada 15 minutos",
    "Acesso venoso calibroso e monitorização contínua",
  ],
  critica: [
    "Avaliar via aérea imediatamente — considerar via aérea definitiva",
    "Checar sinais de choque e iniciar ressuscitação sem aguardar exames",
    "Reavaliar PA, FR e nível de consciência a cada 5-10 minutos",
    "Acionar equipe/UTI e registrar horário de cada intervenção",
  ],
};

/** Gravidade efetiva do atendimento (ambiente eleva o piso). */
export const effectiveSeverity = (
  environment: ClinicalEnvironment,
  severity?: ClinicalSeverity | null,
): ClinicalSeverity => {
  if (severity === "critica") return "critica";
  if (environment === "emergencia") return severity === "grave" ? "critica" : "grave";
  if (severity) return severity;
  return environment === "urgencia" ? "moderada" : "leve";
};

const DETAILS: Record<string, PathologyDetail> = {
  "Amigdalite aguda": {
    anamnese: [
      "Odinofagia: início, intensidade e dificuldade para engolir saliva",
      "Febre aferida, calafrios e tempo de evolução",
      "Presença de exsudato/placas relatada pelo paciente",
      "Tosse e coriza (sugerem etiologia viral)",
      "Contatos domiciliares/escolares com faringite estreptocócica",
      "Recorrência: número de episódios nos últimos 12 meses",
      "Uso recente de antibiótico e alergias (penicilina)",
    ],
    anamnesePerfil: {
      pediatrico: [
        "Aceitação de líquidos e sinais de desidratação",
        "Sialorreia, voz abafada ou recusa alimentar completa",
      ],
      obstetrico: ["Idade gestacional para escolha do antibiótico"],
    },
    diferenciais: [
      { nome: "Faringite viral", probabilidade: "alta", pista: "Tosse, coriza, conjuntivite, rouquidão" },
      { nome: "Faringoamigdalite estreptocócica", probabilidade: "alta", pista: "Centor/McIsaac ≥ 3, exsudato, adenomegalia dolorosa" },
      { nome: "Mononucleose infecciosa", probabilidade: "media", pista: "Adolescente, fadiga, adenomegalia difusa, esplenomegalia" },
      { nome: "Abscesso periamigdaliano", probabilidade: "baixa", pista: "Trismo, desvio de úvula, voz de batata quente" },
      { nome: "Epiglotite", probabilidade: "baixa", pista: "Estridor, sialorreia, posição de tripé — via aérea" },
      { nome: "Difteria", probabilidade: "baixa", pista: "Membrana acinzentada aderente, vacinação incompleta" },
    ],
    exameFisico: {
      cardinais: [
        "Hiperemia e hipertrofia amigdaliana",
        "Exsudato purulento em criptas",
        "Linfonodomegalia cervical anterior dolorosa",
        "Temperatura axilar",
      ],
      gravidade: [
        "Trismo, sialorreia ou incapacidade de engolir saliva",
        "Desvio de úvula e abaulamento do pilar (abscesso)",
        "Estridor, dispneia ou estertor — via aérea ameaçada",
        "Sinais de desidratação e hipotensão",
      ],
      tipicos: ["Petéquias em palato", "Halitose", "Ausência de tosse"],
      atipicos: [
        "Exantema escarlatiniforme e língua em framboesa",
        "Esplenomegalia (mononucleose)",
        "Membrana aderente que sangra ao descolar (difteria)",
      ],
    },
    exames: {
      laboratoriais: [
        "Teste rápido para estreptococo (quando disponível)",
        "Cultura de orofaringe se teste rápido negativo em criança",
        "Hemograma e monoteste se suspeita de mononucleose",
        "PCR apenas em quadros arrastados/complicados",
      ],
      imagem: ["TC de pescoço com contraste se suspeita de abscesso/infecção profunda"],
      outros: ["Escore de Centor/McIsaac para decidir antibiótico"],
    },
    conduta: {
      inicial: [
        "Analgesia: dipirona ou paracetamol; AINE se sem contraindicação",
        "Hidratação oral e dieta pastosa/fria",
        "Estreptocócica provável: amoxicilina 500 mg VO 8/8h por 10 dias (criança 50 mg/kg/dia)",
        "Alergia à penicilina: azitromicina 500 mg/dia por 3 dias ou clindamicina",
      ],
      manutencao: [
        "Completar 10 dias do antibiótico mesmo com melhora precoce",
        "Retorno em 48-72h se não houver defervescência",
        "Encaminhar à otorrinolaringologia se ≥ 7 episódios/ano (critérios de Paradise)",
      ],
    },
    decisao: {
      alta: ["Ingesta oral preservada, sem sinais de complicação, dor controlada"],
      observacao: ["Dor intensa com ingesta limitada — hidratação e analgesia venosa e reavaliar"],
      internacao: [
        "Suspeita de abscesso periamigdaliano ou infecção cervical profunda",
        "Incapacidade de deglutir, desidratação ou sinais de obstrução de via aérea",
      ],
    },
    monitorizacao: {
      itens: ["Temperatura", "Capacidade de deglutir", "Sinais de obstrução respiratória"],
      reavaliacao: ["Reavaliar em 48-72h", "Retorno imediato se trismo, sialorreia ou dispneia"],
    },
  },

  "Pneumonia adquirida na comunidade": {
    anamnese: [
      "Tempo de tosse, expectoração e febre",
      "Dispneia, dor pleurítica e calafrios",
      "Comorbidades, tabagismo e uso recente de antibiótico",
      "Contato com sintomáticos respiratórios e viagens",
    ],
    anamnesePerfil: {
      pediatrico: ["Aceitação alimentar, imunizações (pneumo/Hib) e taquipneia relatada"],
      geriatrico: ["Confusão aguda, queda ou perda funcional como apresentação"],
      obstetrico: ["Idade gestacional e movimentos fetais"],
    },
    diferenciais: [
      { nome: "Insuficiência cardíaca descompensada", probabilidade: "alta", pista: "Ortopneia, edema, BNP elevado" },
      { nome: "COVID-19 / influenza", probabilidade: "alta", pista: "Sazonalidade e contato" },
      { nome: "Tromboembolismo pulmonar", probabilidade: "media", pista: "Dor pleurítica súbita, imobilização, hipoxemia sem achado radiológico" },
      { nome: "Tuberculose", probabilidade: "media", pista: "Tosse > 3 semanas, sudorese noturna, perda de peso" },
      { nome: "Neoplasia pulmonar", probabilidade: "baixa", pista: "Tabagista, pneumonia de repetição no mesmo lobo" },
    ],
    exameFisico: {
      cardinais: ["FR, SpO₂ e temperatura", "Crepitações localizadas", "Sopro tubário e frêmito aumentado"],
      gravidade: [
        "FR ≥ 30 irpm, SpO₂ < 90% em ar ambiente",
        "PAS < 90 mmHg ou PAD ≤ 60 mmHg",
        "Confusão mental de início recente",
        "Uso de musculatura acessória e cianose",
      ],
      tipicos: ["Macicez à percussão", "Redução do murmúrio vesicular"],
      atipicos: ["Apenas confusão e queda no idoso", "Dor abdominal em pneumonia de base"],
    },
    exames: {
      laboratoriais: ["Hemograma", "PCR", "Ureia e creatinina", "Gasometria arterial se hipoxemia", "Hemoculturas se internação"],
      imagem: ["Radiografia de tórax PA e perfil", "TC de tórax se dúvida ou má evolução", "USG pulmonar à beira do leito"],
      outros: ["Painel viral respiratório", "Antígeno urinário pneumococo/Legionella em casos graves"],
    },
    conduta: {
      inicial: [
        "Oxigênio para SpO₂ ≥ 94% (≥ 90% em DPOC)",
        "Antibiótico na 1ª hora nos casos graves",
        "Ambulatorial hígido: amoxicilina 500 mg VO 8/8h por 7 dias",
        "Internado: ceftriaxona 1 g IV 12/12h + azitromicina",
      ],
      manutencao: [
        "Descalonar para VO quando afebril 24h e estável",
        "Duração mínima de 5 dias com 48h de estabilidade",
        "Radiografia de controle em 6 semanas nos fatores de risco de neoplasia",
      ],
    },
    decisao: {
      alta: ["CURB-65 0-1, SpO₂ ≥ 92%, tolerando VO e suporte domiciliar"],
      observacao: ["CURB-65 2 — observar resposta às primeiras doses e hidratação"],
      internacao: ["CURB-65 ≥ 3, hipoxemia, instabilidade, derrame complicado ou falha ambulatorial"],
    },
    monitorizacao: {
      itens: ["SpO₂ contínua se hipoxemia", "FR, PA, temperatura e diurese", "Nível de consciência"],
      reavaliacao: ["Sinais vitais a cada 4-6h no internado", "Reavaliação clínica em 48-72h no ambulatorial"],
    },
    tempoDependentes: ["Antibiótico em até 1h quando houver critérios de sepse"],
    escalonamento: ["UTI se necessidade de vasopressor, ventilação ou ≥ 3 critérios menores da ATS/IDSA"],
  },

  "Infecção do trato urinário": {
    anamnese: [
      "Disúria, urgência, polaciúria e hematúria",
      "Febre, calafrios, dor lombar e vômitos (sugerem pielonefrite)",
      "ITU prévia, litíase, sondagem e instrumentação",
      "Atividade sexual, gestação e uso recente de antibiótico",
    ],
    anamnesePerfil: {
      obstetrico: ["Idade gestacional", "Contrações ou perda de líquido", "Movimentos fetais"],
      pediatrico: ["Febre sem foco, irritabilidade, jato urinário e treinamento esfincteriano"],
      geriatrico: ["Mudança aguda de comportamento; evitar tratar bacteriúria assintomática"],
    },
    diferenciais: [
      { nome: "Cistite não complicada", probabilidade: "alta", pista: "Sintomas baixos sem febre" },
      { nome: "Pielonefrite aguda", probabilidade: "alta", pista: "Febre, Giordano positivo, vômitos" },
      { nome: "Vaginite / uretrite", probabilidade: "media", pista: "Corrimento, prurido, parceiro sintomático" },
      { nome: "Litíase renal", probabilidade: "media", pista: "Cólica em cólica, hematúria sem piúria" },
      { nome: "Apendicite / DIP", probabilidade: "baixa", pista: "Dor à descompressão, dor à mobilização do colo" },
    ],
    exameFisico: {
      cardinais: ["Dor suprapúbica", "Giordano", "Temperatura e sinais vitais"],
      gravidade: ["Hipotensão, taquicardia e má perfusão (sepse urinária)", "Vômitos incoercíveis", "Rim único/transplantado com obstrução"],
      tipicos: ["Bexigoma ausente, urina turva/fétida"],
      atipicos: ["Apenas confusão no idoso", "Febre sem foco no lactente"],
    },
    exames: {
      laboratoriais: ["EAS/urina tipo 1", "Urocultura com antibiograma antes do ATB", "Hemograma, ureia e creatinina", "Hemocultura se febre alta/sepse", "Beta-hCG em mulher em idade fértil"],
      imagem: ["USG de rins e vias urinárias se complicada, gestante ou má evolução", "TC se suspeita de abscesso ou obstrução"],
      outros: ["Lactato se critérios de sepse"],
    },
    conduta: {
      inicial: [
        "Cistite: nitrofurantoína 100 mg VO 6/6h por 5 dias ou fosfomicina 3 g dose única",
        "Pielonefrite ambulatorial: ciprofloxacino 500 mg VO 12/12h por 7 dias",
        "Pielonefrite grave: ceftriaxona 1 g IV/dia + hidratação IV + antitérmico",
      ],
      manutencao: [
        "Ajustar antibiótico pelo antibiograma em 48-72h",
        "Gestante: tratar sempre bacteriúria assintomática e repetir urocultura de controle",
        "ITU de repetição: investigar fator anatômico e discutir profilaxia",
      ],
    },
    decisao: {
      alta: ["Cistite não complicada, tolerando VO, sem febre"],
      observacao: ["Pielonefrite com vômitos — hidratação e primeira dose IV, reavaliar em 4-6h"],
      internacao: ["Sepse, gestante com pielonefrite, obstrução, imunossupressão ou falha ambulatorial"],
    },
    monitorizacao: {
      itens: ["Temperatura, PA e diurese", "Função renal", "Resposta em 48-72h"],
      reavaliacao: ["Reavaliar em 48-72h; se mantém febre após 72h, imagem obrigatória"],
    },
    escalonamento: ["Sepse urinária: pacote da 1ª hora e considerar desobstrução urgente"],
  },

  "Síndrome coronariana aguda": {
    anamnese: [
      "Horário exato do início da dor e duração",
      "Caráter, irradiação e fatores de melhora/piora",
      "Fatores de risco cardiovascular e eventos prévios",
      "Uso de nitrato, sildenafila, anticoagulante e cocaína",
      "Sangramento, cirurgia ou AVC recentes (elegibilidade para trombólise)",
    ],
    anamnesePerfil: {
      geriatrico: ["Apresentação atípica: dispneia, síncope, confusão"],
      obstetrico: ["Idade gestacional e vitalidade fetal antes de reperfusão"],
      oncologico: ["Plaquetopenia e terapias cardiotóxicas em curso"],
    },
    diferenciais: [
      { nome: "Angina instável / IAM", probabilidade: "alta", pista: "Dor em aperto, alterações dinâmicas do ECG" },
      { nome: "Dissecção de aorta", probabilidade: "baixa", pista: "Dor lancinante dorsal, assimetria de pulsos/PA" },
      { nome: "TEP", probabilidade: "media", pista: "Dispneia súbita, hipoxemia, taquicardia" },
      { nome: "Pericardite", probabilidade: "media", pista: "Dor pleurítica que melhora sentado, atrito" },
      { nome: "Espasmo esofágico / DRGE", probabilidade: "media", pista: "Relação com alimentação" },
    ],
    exameFisico: {
      cardinais: ["PA nos dois braços e FC", "Ausculta cardíaca (B3, sopro novo)", "Perfusão periférica"],
      gravidade: ["Killip II-IV: estertores, B3, edema agudo, choque", "Hipotensão, sudorese e má perfusão", "Arritmia maligna ou bradicardia sintomática"],
      tipicos: ["Sudorese fria, náusea, dor irradiada para MSE/mandíbula"],
      atipicos: ["Dor epigástrica, dispneia isolada, síncope — idoso, mulher e diabético"],
    },
    exames: {
      laboratoriais: ["Troponina na admissão e seriada (0-1h/0-3h)", "Hemograma, eletrólitos, função renal", "Coagulograma e glicemia"],
      imagem: ["Radiografia de tórax", "Ecocardiograma (alteração segmentar)", "Angio-TC se suspeita de dissecção/TEP"],
      outros: ["ECG de 12 derivações em até 10 min e seriado", "Derivações direitas/posteriores se parede inferior"],
    },
    conduta: {
      inicial: [
        "Monitorização, acesso venoso e desfibrilador disponível",
        "AAS 300 mg mastigável",
        "Segundo antiagregante conforme estratégia de reperfusão",
        "Anticoagulação plena (enoxaparina ou HNF)",
        "Nitrato se dor e PAS > 100 (contraindicado com sildenafila / IAM de VD)",
        "Acionar hemodinâmica; trombólise se angioplastia indisponível em 120 min",
      ],
      manutencao: [
        "Dupla antiagregação, estatina de alta potência, betabloqueador e IECA/BRA",
        "Reabilitação cardiovascular e controle de fatores de risco",
        "Ecocardiograma de controle e programação de alta com plano medicamentoso",
      ],
    },
    decisao: {
      alta: ["HEART 0-3 com troponinas seriadas negativas e ECG normal — alta com reavaliação ambulatorial"],
      observacao: ["HEART 4-6: unidade de dor torácica, troponina seriada e teste funcional"],
      internacao: ["Supra de ST, troponina positiva, instabilidade, HEART ≥ 7 — unidade coronariana"],
    },
    monitorizacao: {
      itens: ["Monitorização eletrocardiográfica contínua", "PA, FC, SpO₂ e dor (escala)", "Sinais de sangramento após antitrombóticos"],
      reavaliacao: ["ECG a cada 15-30 min enquanto houver dor", "Troponina conforme protocolo 0/1h ou 0/3h"],
    },
    tempoDependentes: [
      "ECG em até 10 minutos da chegada",
      "Tempo porta-balão < 90 min; porta-agulha (trombólise) < 30 min",
      "AAS na primeira avaliação, salvo contraindicação",
    ],
    escalonamento: ["Choque cardiogênico, arritmia maligna ou edema agudo: UTI e suporte avançado imediato"],
  },

  "Crise de asma": {
    anamnese: [
      "Tempo de crise e número de resgates nas últimas 24h",
      "Internações prévias, UTI e intubação (risco de crise fatal)",
      "Uso de corticoide oral recente e adesão ao controlador",
      "Gatilho identificado (infecção, alérgeno, AINE, exercício)",
    ],
    anamnesePerfil: {
      pediatrico: ["Peso atual, técnica inalatória, uso de espaçador e imunizações"],
      obstetrico: ["Idade gestacional e movimentos fetais — hipóxia é o maior risco fetal"],
    },
    diferenciais: [
      { nome: "Exacerbação de asma", probabilidade: "alta", pista: "História prévia, sibilos difusos, resposta a broncodilatador" },
      { nome: "DPOC exacerbado", probabilidade: "media", pista: "Tabagista, > 40 anos, expectoração purulenta" },
      { nome: "Insuficiência cardíaca (asma cardíaca)", probabilidade: "media", pista: "Ortopneia, estertores, edema" },
      { nome: "Anafilaxia", probabilidade: "baixa", pista: "Urticária, angioedema, hipotensão após exposição" },
      { nome: "Corpo estranho", probabilidade: "baixa", pista: "Início súbito, sibilo localizado, criança" },
    ],
    exameFisico: {
      cardinais: ["FR, SpO₂ e FC", "Sibilos expiratórios difusos", "Capacidade de completar frases"],
      gravidade: ["Tórax silencioso — obstrução grave", "Uso de musculatura acessória e tiragem", "Fala monossilábica, agitação ou sonolência", "SpO₂ < 90%, cianose, bradicardia"],
      tipicos: ["Tempo expiratório prolongado", "Melhora após broncodilatador"],
      atipicos: ["Ausência de sibilos com dispneia intensa", "Tosse como equivalente asmático"],
    },
    exames: {
      laboratoriais: ["Gasometria arterial apenas na crise grave/refratária", "Eletrólitos (potássio) após beta-agonista em alta dose"],
      imagem: ["Radiografia de tórax se suspeita de pneumonia, pneumotórax ou má resposta"],
      outros: ["Oximetria contínua", "Pico de fluxo expiratório antes e após tratamento"],
    },
    conduta: {
      inicial: [
        "Salbutamol 4-10 jatos com espaçador ou nebulização a cada 20 min na 1ª hora",
        "Ipratrópio associado nas crises moderadas e graves",
        "Corticoide sistêmico na 1ª hora: prednisona 40-50 mg VO (ou hidrocortisona IV)",
        "Oxigênio para SpO₂ 93-95% (94-98% em criança)",
        "Sulfato de magnésio 2 g IV na crise grave refratária",
      ],
      manutencao: [
        "Prednisona por 5-7 dias (3-5 dias em criança)",
        "Iniciar ou ajustar corticoide inalatório antes da alta",
        "Revisar técnica inalatória e plano de ação escrito",
        "Consulta de reavaliação em 2-7 dias",
      ],
    },
    decisao: {
      alta: ["PEF > 70% do previsto, SpO₂ ≥ 94% em ar ambiente e sem dispneia após 1h"],
      observacao: ["PEF 40-70% — manter tratamento e reavaliar após 1-2h"],
      internacao: ["PEF < 40%, hipoxemia persistente, tórax silencioso, alteração de consciência ou crise fatal prévia"],
    },
    monitorizacao: {
      itens: ["SpO₂ contínua", "FR e esforço respiratório", "Resposta ao broncodilatador (PEF)"],
      reavaliacao: ["Reavaliar a cada 20 min na 1ª hora", "Depois a cada 1h até estabilidade"],
    },
    tempoDependentes: ["Corticoide sistêmico dentro da 1ª hora", "Broncodilatador contínuo na crise grave"],
    escalonamento: ["UTI se rebaixamento, hipercapnia, exaustão ou necessidade de ventilação"],
  },

  "Hipertensão arterial": {
    anamnese: [
      "Medicações em uso, doses e adesão",
      "Sintomas de lesão de órgão-alvo: dor torácica, dispneia, déficit neurológico, alteração visual",
      "Uso de AINE, descongestionante, corticoide, anticoncepcional e drogas ilícitas",
      "Aferições domiciliares e histórico de PA prévia",
    ],
    anamnesePerfil: {
      obstetrico: ["Idade gestacional, proteinúria, cefaleia, escotomas e epigastralgia (pré-eclâmpsia)", "Movimentos fetais"],
      geriatrico: ["Sintomas ortostáticos e histórico de quedas"],
      nefropata: ["Volume/diálise recente e ganho de peso interdialítico"],
    },
    diferenciais: [
      { nome: "Pseudocrise hipertensiva (dor/ansiedade)", probabilidade: "alta", pista: "PA alta sem lesão de órgão-alvo" },
      { nome: "Urgência hipertensiva", probabilidade: "alta", pista: "PA muito elevada, assintomático" },
      { nome: "Emergência hipertensiva", probabilidade: "media", pista: "Lesão aguda de órgão-alvo" },
      { nome: "Pré-eclâmpsia / eclâmpsia", probabilidade: "media", pista: "Gestante > 20 semanas com proteinúria" },
      { nome: "Hipertensão secundária", probabilidade: "baixa", pista: "Jovem, refratária, hipocalemia, sopro abdominal" },
    ],
    exameFisico: {
      cardinais: ["PA nos dois braços após 5 min de repouso, manguito adequado", "FC e ritmo", "Ausculta cardíaca e pulmonar"],
      gravidade: ["Déficit neurológico focal ou rebaixamento", "Estertores/edema agudo de pulmão", "Dor torácica com assimetria de pulsos", "Papiledema ou hemorragias na fundoscopia"],
      tipicos: ["Assintomático", "Cefaleia occipital leve"],
      atipicos: ["Epistaxe, tontura inespecífica — não caracterizam emergência isoladamente"],
    },
    exames: {
      laboratoriais: ["Ureia, creatinina e eletrólitos", "EAS com proteinúria", "Hemograma", "Troponina se dor torácica", "Perfil lipídico e glicemia (avaliação crônica)"],
      imagem: ["ECG", "Radiografia de tórax se dispneia", "TC de crânio se déficit neurológico", "Angio-TC se suspeita de dissecção"],
      outros: ["Fundoscopia", "MAPA/MRPA na avaliação ambulatorial"],
    },
    conduta: {
      inicial: [
        "Pseudocrise: analgesia/ansiolítico, repouso e reaferir — não reduzir PA rapidamente",
        "Urgência: ajustar anti-hipertensivo VO, reduzir PA em 24-48h",
        "Emergência: droga IV titulável em monitorização; reduzir PAM 20-25% na 1ª hora",
        "Gestante com PA ≥ 160/110: hidralazina ou nifedipino e sulfato de magnésio se pré-eclâmpsia grave",
      ],
      manutencao: [
        "Otimizar esquema: IECA/BRA + tiazídico + bloqueador de canal de cálcio",
        "Medidas não farmacológicas e MRPA",
        "Reavaliação em 7-30 dias após ajuste",
      ],
    },
    decisao: {
      alta: ["Sem lesão de órgão-alvo, PA em queda, com plano e retorno agendado"],
      observacao: ["PA muito elevada com sintomas inespecíficos — reaferir após repouso e analgesia"],
      internacao: ["Emergência hipertensiva, pré-eclâmpsia grave/eclâmpsia, dissecção, EAP ou AVC"],
    },
    monitorizacao: {
      itens: ["PA seriada", "Diurese e função renal", "Sintomas neurológicos e cardiovasculares"],
      reavaliacao: ["Reaferir em 30 min após repouso", "Na emergência: PA a cada 5-15 min sob droga IV"],
    },
    tempoDependentes: ["Emergência hipertensiva: iniciar droga IV imediatamente, sem aguardar exames"],
    escalonamento: ["UTI para todo uso de anti-hipertensivo IV contínuo"],
  },

  "Descompensação glicêmica": {
    anamnese: [
      "Poliúria, polidipsia, perda de peso e astenia",
      "Omissão de insulina, falha de bomba, corticoide ou infecção",
      "Náusea, vômitos e dor abdominal",
      "Tipo de diabetes, esquema atual e glicemias domiciliares",
    ],
    anamnesePerfil: {
      pediatrico: ["Peso, diurese/fraldas, primeira descompensação e imunizações"],
      obstetrico: ["Idade gestacional, movimentos fetais — CAD é emergência obstétrica"],
      geriatrico: ["Ingesta hídrica reduzida e risco de estado hiperosmolar"],
      nefropata: ["TFG atual — metformina e insulina exigem ajuste"],
    },
    diferenciais: [
      { nome: "Cetoacidose diabética", probabilidade: "alta", pista: "Glicemia > 250, cetonemia, pH < 7,3" },
      { nome: "Estado hiperosmolar", probabilidade: "media", pista: "Glicemia > 600, osmolaridade alta, sem cetose" },
      { nome: "Sepse / infecção precipitante", probabilidade: "alta", pista: "Febre, foco identificável" },
      { nome: "Acidose láctica", probabilidade: "baixa", pista: "Uso de metformina com TFG baixa, choque" },
      { nome: "Abdome agudo cirúrgico", probabilidade: "baixa", pista: "Dor que persiste após correção metabólica" },
    ],
    exameFisico: {
      cardinais: ["Estado de hidratação e PA", "Nível de consciência", "Hálito cetônico e ritmo de Kussmaul"],
      gravidade: ["Hipotensão e taquicardia (choque)", "Glasgow < 12 ou letargia", "pH < 7,0 ou bicarbonato < 10", "Potássio < 3,3 mEq/L"],
      tipicos: ["Mucosas secas, turgor reduzido, taquipneia"],
      atipicos: ["Dor abdominal simulando abdome agudo", "Hipotermia na sepse associada"],
    },
    exames: {
      laboratoriais: ["Glicemia capilar e laboratorial", "Gasometria com ânion gap", "Cetonemia/cetonúria", "Eletrólitos com potássio (seriado)", "Ureia, creatinina, hemograma e EAS", "HbA1c"],
      imagem: ["Radiografia de tórax se suspeita de foco pulmonar"],
      outros: ["ECG (alterações do potássio)", "Culturas se febre"],
    },
    conduta: {
      inicial: [
        "SF 0,9% 15-20 mL/kg na 1ª hora conforme volemia",
        "Repor potássio antes da insulina se K < 3,3 mEq/L",
        "Insulina regular IV em bomba 0,1 U/kg/h após reposição inicial",
        "Adicionar soro glicosado quando glicemia < 250 mg/dL",
        "Tratar o precipitante (infecção é o mais comum)",
      ],
      manutencao: [
        "Transição para insulina SC com sobreposição de 1-2h após resolução da acidose",
        "Educação em diabetes, ajuste de esquema e checagem da técnica",
        "Encaminhamento à endocrinologia e nutrição",
      ],
    },
    decisao: {
      alta: ["Hiperglicemia sem cetose, tolerando VO, com ajuste e retorno programado"],
      observacao: ["Cetose leve sem acidose — hidratação e correção com reavaliação em 4-6h"],
      internacao: ["CAD ou estado hiperosmolar, vômitos persistentes, rebaixamento ou falta de suporte domiciliar"],
    },
    monitorizacao: {
      itens: ["Glicemia capilar horária", "Potássio e gasometria", "Diurese e nível de consciência"],
      reavaliacao: ["Glicemia a cada 1h", "Eletrólitos/gasometria a cada 2-4h até resolução"],
    },
    tempoDependentes: ["Hidratação imediata; insulina apenas após checar potássio"],
    escalonamento: ["UTI se pH < 7,0, rebaixamento, instabilidade ou necessidade de bomba de insulina"],
  },

  "Sepse e choque séptico": {
    anamnese: [
      "Foco infeccioso provável e tempo de evolução",
      "Antibiótico prévio, internação e procedimentos recentes",
      "Imunossupressão, quimioterapia, dispositivos e próteses",
      "Alergias medicamentosas antes do antibiótico empírico",
    ],
    anamnesePerfil: {
      oncologico: ["Data do último ciclo e neutrófilos — neutropenia febril é emergência"],
      obstetrico: ["Idade gestacional, corioamnionite, movimentos fetais"],
      pediatrico: ["Peso para dose e volume, imunizações, tempo de enchimento capilar"],
      geriatrico: ["Delirium e hipotermia podem ser as únicas manifestações"],
    },
    diferenciais: [
      { nome: "Choque séptico", probabilidade: "alta", pista: "Infecção + hipotensão refratária a volume + lactato > 2" },
      { nome: "Choque hipovolêmico/hemorrágico", probabilidade: "media", pista: "Perda evidente, resposta a volume" },
      { nome: "Choque cardiogênico", probabilidade: "media", pista: "Congestão, B3, ECG alterado" },
      { nome: "Anafilaxia", probabilidade: "baixa", pista: "Exposição, urticária, broncoespasmo" },
      { nome: "Insuficiência adrenal / intoxicação", probabilidade: "baixa", pista: "Corticoterapia crônica, história toxicológica" },
    ],
    exameFisico: {
      cardinais: ["Sinais vitais completos e temperatura", "Perfusão: enchimento capilar, livedo, extremidades", "Nível de consciência", "Busca ativa do foco (pele, pulmão, abdome, urina, cateteres)"],
      gravidade: ["PAM < 65 mmHg após volume", "Lactato > 2 mmol/L", "Oligúria < 0,5 mL/kg/h", "Glasgow rebaixado, taquipneia > 22"],
      tipicos: ["Febre, taquicardia, taquipneia"],
      atipicos: ["Hipotermia, ausência de febre no idoso e no imunossuprimido"],
    },
    exames: {
      laboratoriais: ["Lactato arterial (e repetido)", "2 pares de hemocultura antes do antibiótico", "Hemograma, função renal e hepática, coagulograma", "Gasometria e eletrólitos", "Culturas do foco suspeito"],
      imagem: ["Radiografia de tórax", "USG à beira do leito", "TC do sítio suspeito quando estável"],
      outros: ["qSOFA / SOFA", "Débito urinário com sonda quando indicado"],
    },
    conduta: {
      inicial: [
        "Pacote da 1ª hora: lactato, culturas, antibiótico de amplo espectro, 30 mL/kg de cristaloide",
        "Noradrenalina se PAM < 65 mmHg após volume — não atrasar por acesso central",
        "Oxigênio e suporte ventilatório conforme necessidade",
        "Controle do foco (drenagem, retirada de cateter, cirurgia) o mais precoce possível",
      ],
      manutencao: [
        "Descalonar antibiótico conforme culturas em 48-72h",
        "Reavaliar volemia — evitar sobrecarga após ressuscitação",
        "Profilaxias (TEV, lesão de mucosa gástrica) e nutrição precoce",
      ],
    },
    decisao: {
      alta: ["Não aplicável na sepse — infecção sem disfunção pode seguir ambulatorial com retorno em 24h"],
      observacao: ["Infecção com qSOFA 0-1 e sem disfunção — observar e reavaliar lactato"],
      internacao: ["Toda sepse; choque séptico obrigatoriamente em UTI"],
    },
    monitorizacao: {
      itens: ["PA invasiva ou aferição frequente, FC, SpO₂", "Diurese horária", "Lactato seriado e perfusão"],
      reavaliacao: ["Reavaliar perfusão a cada 15-30 min na ressuscitação", "Lactato a cada 2-4h até normalizar"],
    },
    tempoDependentes: [
      "Antibiótico em até 1 hora do reconhecimento",
      "Cristaloide 30 mL/kg nas primeiras 3 horas",
      "Controle do foco idealmente em até 6-12 horas",
    ],
    escalonamento: ["Vasopressor, lactato em elevação ou disfunção de dois ou mais órgãos: UTI imediata"],
  },

  "Acidente vascular cerebral": {
    anamnese: [
      "Horário do último momento assintomático (define janela)",
      "Déficit inicial, progressão e sintomas associados (cefaleia, vômito, crise)",
      "Anticoagulação, cirurgia, trauma ou sangramento recentes",
      "Rankin prévio e comorbidades (FA, HAS, DM)",
    ],
    anamnesePerfil: {
      geriatrico: ["Funcionalidade prévia e risco de queda para decisão terapêutica"],
      obstetrico: ["Idade gestacional — decisão de trombólise multidisciplinar"],
      oncologico: ["Neoplasia ativa e plaquetopenia aumentam risco hemorrágico"],
    },
    diferenciais: [
      { nome: "AVC isquêmico", probabilidade: "alta", pista: "Déficit focal súbito, TC sem sangue" },
      { nome: "AVC hemorrágico", probabilidade: "alta", pista: "Cefaleia intensa, vômitos, PA muito elevada" },
      { nome: "Hipoglicemia", probabilidade: "media", pista: "Glicemia capilar baixa — sempre checar" },
      { nome: "Crise convulsiva com paralisia de Todd", probabilidade: "media", pista: "Crise testemunhada, déficit transitório" },
      { nome: "Enxaqueca com aura / lesão expansiva", probabilidade: "baixa", pista: "Progressão lenta, história prévia" },
    ],
    exameFisico: {
      cardinais: ["NIHSS completo", "Glicemia capilar imediata", "PA, FC e ritmo (fibrilação atrial)"],
      gravidade: ["Rebaixamento (Glasgow ≤ 8) — via aérea", "NIHSS elevado e desvio do olhar", "Sinais de hipertensão intracraniana e vômitos", "Instabilidade respiratória e broncoaspiração"],
      tipicos: ["Hemiparesia, disartria, desvio de rima, afasia"],
      atipicos: ["Vertigem isolada, confusão, alteração comportamental"],
    },
    exames: {
      laboratoriais: ["Glicemia", "Hemograma, plaquetas e coagulograma", "Função renal e eletrólitos", "Troponina"],
      imagem: ["TC de crânio sem contraste imediata", "Angio-TC de crânio e vasos cervicais", "TC de perfusão ou RM nas janelas estendidas"],
      outros: ["ECG e monitorização de ritmo", "Rastreio de disfagia antes de qualquer via oral"],
    },
    conduta: {
      inicial: [
        "Código AVC: cabeceira 30°, oxigênio se SpO₂ < 94%, acesso venoso",
        "Corrigir hipoglicemia; tratar febre",
        "Trombólise IV até 4,5h se elegível (PA < 185/110 antes de infundir)",
        "Trombectomia mecânica conforme oclusão de grande vaso e janela",
        "AVC hemorrágico: reverter anticoagulação e controlar PA",
      ],
      manutencao: [
        "Prevenção secundária: antiagregante ou anticoagulante conforme etiologia, estatina",
        "Profilaxia de TEV, mobilização e reabilitação precoces",
        "Investigação etiológica: eco, Holter, doppler de carótidas",
      ],
    },
    decisao: {
      alta: ["AIT de baixo risco (ABCD2 baixo) apenas com investigação rápida garantida"],
      observacao: ["AIT em investigação — monitorização e imagem vascular"],
      internacao: ["Todo AVC agudo — preferencialmente unidade de AVC; UTI se rebaixamento ou pós-trombólise instável"],
    },
    monitorizacao: {
      itens: ["NIHSS seriado", "PA conforme estratégia de reperfusão", "Glicemia, temperatura e SpO₂", "Sinais de transformação hemorrágica"],
      reavaliacao: [
        "Pós-trombólise: PA e neuro a cada 15 min por 2h, 30 min por 6h, 1h por 16h",
        "TC de controle em 24h antes de antiagregar",
      ],
    },
    tempoDependentes: [
      "Porta-TC em até 20 minutos",
      "Porta-agulha (trombólise) em até 60 minutos",
      "Trombectomia: até 6h (até 24h em casos selecionados por perfusão)",
    ],
    escalonamento: ["Glasgow ≤ 8, deterioração neurológica ou hemorragia: via aérea definitiva, neurocirurgia e UTI"],
  },
};

export const getPathologyDetail = (label: string): PathologyDetail | null =>
  DETAILS[label] ?? null;

export const PATHOLOGY_DETAIL_LABELS = Object.keys(DETAILS);
