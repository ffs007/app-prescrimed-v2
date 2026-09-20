/**
 * Metadados de exibição dos escores calculados no servidor (`fn_calcular_*`):
 * título, especialidade, rótulos e opções de campos de texto.
 * As assinaturas das funções vêm de scoreRegistry.generated.ts.
 */
import { SCORE_FUNCTIONS, type ScoreFnSpec, type ScoreParamSpec } from "./scoreRegistry.generated";

export type ScoreGroup =
  | "Cardiologia"
  | "Emergência e sepse"
  | "Neurologia"
  | "Trauma"
  | "Gastro e hepato"
  | "Pneumologia e tromboembolismo"
  | "Infectologia e dermatologia"
  | "Terapia intensiva"
  | "Perioperatório"
  | "Pediatria e neonatal"
  | "Obstetrícia"
  | "Psiquiatria"
  | "Dor"
  | "Ortopedia";

export const SCORE_GROUPS: ScoreGroup[] = [
  "Emergência e sepse",
  "Cardiologia",
  "Neurologia",
  "Trauma",
  "Gastro e hepato",
  "Pneumologia e tromboembolismo",
  "Infectologia e dermatologia",
  "Terapia intensiva",
  "Perioperatório",
  "Ortopedia",
  "Pediatria e neonatal",
  "Obstetrícia",
  "Psiquiatria",
  "Dor",
];

export const SCORE_META: Record<string, { title: string; group: ScoreGroup }> = {
  "4at": { title: "4AT (delirium)", group: "Psiquiatria" },
  abcd2: { title: "ABCD² (risco após AIT)", group: "Neurologia" },
  aims65: { title: "AIMS65 (mortalidade na HDA)", group: "Gastro e hepato" },
  air: { title: "AIR (apendicite)", group: "Gastro e hepato" },
  alvarado: { title: "Alvarado (apendicite)", group: "Gastro e hepato" },
  apache2: { title: "APACHE II", group: "Terapia intensiva" },
  apgar: { title: "Apgar", group: "Pediatria e neonatal" },
  asa: { title: "ASA (classe anestésica)", group: "Perioperatório" },
  atria: { title: "ATRIA (sangramento em anticoagulação)", group: "Cardiologia" },
  audit: { title: "AUDIT (uso de álcool)", group: "Psiquiatria" },
  bisap: { title: "BISAP (pancreatite aguda)", group: "Gastro e hepato" },
  bps: { title: "BPS (dor em paciente sedado)", group: "Dor" },
  canadian_cspine: { title: "Canadian C-Spine", group: "Trauma" },
  cha2ds2_vasc: { title: "CHA₂DS₂-VASc", group: "Cardiologia" },
  child_pugh: { title: "Child-Pugh", group: "Gastro e hepato" },
  ciwa_ar: { title: "CIWA-Ar (abstinência alcoólica)", group: "Psiquiatria" },
  cpot: { title: "CPOT (dor em UTI)", group: "Dor" },
  crb65: { title: "CRB-65", group: "Pneumologia e tromboembolismo" },
  crusade: { title: "CRUSADE (sangramento na SCA)", group: "Cardiologia" },
  cssrs: { title: "C-SSRS (risco suicida)", group: "Psiquiatria" },
  curb65: { title: "CURB-65", group: "Pneumologia e tromboembolismo" },
  euroscore2: { title: "EuroSCORE II", group: "Cardiologia" },
  euroscore2_expandido: { title: "EuroSCORE II (expandido)", group: "Cardiologia" },
  flacc: { title: "FLACC (dor pediátrica)", group: "Pediatria e neonatal" },
  gbs: { title: "Glasgow-Blatchford", group: "Gastro e hepato" },
  gcs: { title: "Glasgow (GCS)", group: "Neurologia" },
  gcs_trauma: { title: "GCS no trauma", group: "Trauma" },
  grace: { title: "GRACE", group: "Cardiologia" },
  grace_bleeding: { title: "GRACE (sangramento)", group: "Cardiologia" },
  has_bled: { title: "HAS-BLED", group: "Cardiologia" },
  hasbled: { title: "HAS-BLED (com contexto)", group: "Cardiologia" },
  heart: { title: "HEART", group: "Cardiologia" },
  hunt_hess: { title: "Hunt-Hess (HSA)", group: "Neurologia" },
  iss: { title: "ISS (gravidade do trauma)", group: "Trauma" },
  lrinec: { title: "LRINEC (fasciíte necrosante)", group: "Infectologia e dermatologia" },
  mascc: { title: "MASCC (neutropenia febril)", group: "Infectologia e dermatologia" },
  meld: { title: "MELD", group: "Gastro e hepato" },
  meld_na: { title: "MELD-Na", group: "Gastro e hepato" },
  mews_ob: { title: "MEWS obstétrico", group: "Obstetrícia" },
  news2: { title: "NEWS2", group: "Emergência e sepse" },
  nexus: { title: "NEXUS (coluna cervical)", group: "Trauma" },
  orbit: { title: "ORBIT (sangramento em anticoagulação)", group: "Cardiologia" },
  ottawa_joelho: { title: "Ottawa (joelho)", group: "Ortopedia" },
  ottawa_tornozelo: { title: "Ottawa (tornozelo e pé)", group: "Ortopedia" },
  perc: { title: "PERC (exclusão de TEP)", group: "Pneumologia e tromboembolismo" },
  phq9: { title: "PHQ-9 (depressão)", group: "Psiquiatria" },
  possum: { title: "POSSUM", group: "Perioperatório" },
  qsofa: { title: "qSOFA", group: "Emergência e sepse" },
  ranson: { title: "Ranson (pancreatite)", group: "Gastro e hepato" },
  rcri: { title: "RCRI (Lee)", group: "Perioperatório" },
  regiscar: { title: "RegiSCAR (DRESS)", group: "Infectologia e dermatologia" },
  rockall: { title: "Rockall (HDA)", group: "Gastro e hepato" },
  rts: { title: "RTS (Revised Trauma Score)", group: "Trauma" },
  saps2: { title: "SAPS II", group: "Terapia intensiva" },
  scorten: { title: "SCORTEN (NET/Stevens-Johnson)", group: "Infectologia e dermatologia" },
  sins: { title: "SINS (instabilidade espinal)", group: "Ortopedia" },
  sirs: { title: "SIRS", group: "Emergência e sepse" },
  smart_cop: { title: "SMART-COP", group: "Pneumologia e tromboembolismo" },
  sofa: { title: "SOFA", group: "Terapia intensiva" },
  syntax: { title: "SYNTAX", group: "Cardiologia" },
  syntax2: { title: "SYNTAX II", group: "Cardiologia" },
  timi: { title: "TIMI (SCA)", group: "Cardiologia" },
  timi_bleeding: { title: "TIMI (sangramento)", group: "Cardiologia" },
  triss: { title: "TRISS", group: "Trauma" },
  wells_tep: { title: "Wells (TEP)", group: "Pneumologia e tromboembolismo" },
  wfns: { title: "WFNS (HSA)", group: "Neurologia" },
  wong_baker: { title: "Wong-Baker (faces)", group: "Dor" },
  years: { title: "YEARS (TEP)", group: "Pneumologia e tromboembolismo" },
};

const LABEL_OVERRIDES: Record<string, string> = {
  p_pas: "PAS (mmHg)",
  p_pad: "PAD (mmHg)",
  p_pam: "PAM (mmHg)",
  p_fc: "FC (bpm)",
  p_pulso: "Pulso (bpm)",
  p_fr: "FR (irpm)",
  p_spo2: "SpO₂ (%)",
  p_temperatura: "Temperatura (°C)",
  p_glicose: "Glicose (mg/dL)",
  p_creatinina: "Creatinina (mg/dL)",
  p_creatinina_cl: "Clearance de creatinina (mL/min)",
  p_bilirrubina: "Bilirrubina (mg/dL)",
  p_albumina: "Albumina (g/dL)",
  p_ureia: "Ureia (mg/dL)",
  p_ureia_mmol: "Ureia (mmol/L)",
  p_hemoglobina: "Hemoglobina (g/dL)",
  p_hematocrito: "Hematócrito (%)",
  p_leucocitos: "Leucócitos (/mm³)",
  p_plaquetas: "Plaquetas (/mm³)",
  p_pcr: "PCR (mg/L)",
  p_sodio: "Sódio (mEq/L)",
  p_bicarbonato: "Bicarbonato (mEq/L)",
  p_ldh: "LDH (U/L)",
  p_ast: "AST (U/L)",
  p_dimero: "D-dímero (ng/mL)",
  p_peso: "Peso (kg)",
  p_altura: "Altura (cm)",
  p_ph: "pH arterial",
  p_paco2: "PaCO₂ (mmHg)",
  p_pao2_fio2: "Relação PaO₂/FiO₂",
  p_diurese_ml_h: "Diurese (mL/h)",
  p_diurese_ml_dia: "Diurese (mL/dia)",
  p_dose_vasopressor: "Dose do vasopressor (mcg/kg/min)",
  p_duracao_min: "Duração dos sintomas (min)",
  p_tempo_min: "Tempo de vida (min: 1, 5 ou 10)",
  p_idade_dias: "Idade (dias)",
  p_pmn_pct: "Polimorfonucleares (%)",
  p_bastoes_pct: "Bastões (%)",
  p_scq_pct: "Superfície corporal atingida (%)",
  p_feve: "FEVE (%)",
  p_eosinofilia: "Eosinófilos (/mm³)",
  p_burden: "Carga dos sintomas (5 leve/nenhuma, 3 moderada, 0 grave)",
  p_escala: "Escala de SpO₂ (1 padrão, 2 hipercapnia)",
  p_suplemento: "Oxigênio suplementar",
  p_nyha: "Classe NYHA (1 a 4)",
  p_asa_classe: "Classe ASA (1 a 6)",
  p_killip: "Classe Killip (1 a 4)",
  p_grau: "Grau (1 a 5)",
  p_gcs: "Glasgow (3 a 15)",
  p_ocular: "Abertura ocular (1 a 4)",
  p_verbal: "Resposta verbal (1 a 5)",
  p_motora: "Resposta motora (1 a 6)",
  p_faces: "Face escolhida (0, 2, 4, 6, 8 ou 10)",
  p_itens: "Respostas do AUDIT",
  p_dominios: "Domínios do CIWA-Ar",
  p_rts: "RTS",
  p_iss: "ISS",
  p_saps2_pontos: "Pontuação SAPS II",
  p_euroscore2: "EuroSCORE II (%)",
  p_syntax_score: "Escore SYNTAX",
  p_grace_sangramento: "Escore GRACE de sangramento",
  p_score_fisiologico: "Pontuação fisiológica",
  p_score_operativo: "Pontuação operatória",
  p_sirs_criterios: "Critérios SIRS presentes (0 a 4)",
  p_3_fatores_risco: "3 ou mais fatores de risco para DAC",
  p_2_angina_24h: "2 ou mais episódios de angina em 24 h",
  p_aas_7dias: "Uso de AAS nos últimos 7 dias",
  p_dx_alternativo_menos_provavel: "Diagnóstico alternativo menos provável que TEP",
  p_dor_base_5mt: "Dor na base do 5º metatarso",
  p_incapaz_flexao_90: "Incapaz de flexionar o joelho a 90°",
};

const TOKEN_LABELS: Record<string, string> = {
  fid: "FID", fr: "FR", fc: "FC", pas: "PAS", pad: "PAD", pam: "PAM", ic: "IC", has: "HAS", dm: "DM",
  avc: "AVC", inr: "INR", tep: "TEP", tvp: "TVP", dac: "DAC", ecg: "ECG", st: "ST", pts: "(pontos)",
  amt4: "AMT4", cl: "CL", dx: "diagnóstico", ml: "mL", h: "h", ais: "AIS", ph: "pH",
  cardiaca: "cardíaca", frequencia: "frequência", respiratorio: "respiratório", tonus: "tônus", esforco: "esforço",
  expressao: "expressão", tensao: "tensão", vocalizacao: "vocalização", orientacao: "orientação", sincope: "síncope",
  estrogenio: "estrogênio", flexao: "flexão", cabeca: "cabeça", mediope: "mediopé", maleolo: "maléolo",
  duracao: "duração", alteracao: "alteração", criterios: "critérios", insuficiencia: "insuficiência",
  isquemica: "isquêmica", cronica: "crônica", doenca: "doença", funcao: "função", hepatica: "hepática",
  previo: "prévio", previa: "prévia", labil: "lábil", antiplaquetarias: "antiplaquetárias", alcool: "álcool",
  provavel: "provável", imobilizacao: "imobilização", cancer: "câncer", orgao: "órgão", exclusao: "exclusão",
  consciencia: "consciência", nivel: "nível", lesao: "lesão", intoxicacao: "intoxicação", deficit: "déficit",
  media: "média", desidratacao: "desidratação", hipotensao: "hipotensão", solido: "sólido", pontos: "pontos",
  ossea: "óssea", posterolateral: "posterolateral", comprometimento: "comprometimento", conformidade: "conformidade",
  emergencia: "emergência", cirurgia: "cirurgia", sangramento: "sangramento", comportamento: "comportamento",
  meses: "meses", pensamentos: "pensamentos", metodo: "método", intencao: "intenção", mecanismo: "mecanismo",
  perigoso: "perigoso", rotacao: "rotação", graus: "graus", alteracoes: "alterações", ambulatorial: "ambulatorial",
  hemoglobina: "hemoglobina", troponina: "troponina", historia: "história", fatores: "fatores",
  abdome: "abdome", externo: "externo", extremidades: "extremidades", torax: "tórax", face: "face",
  ureia: "ureia", ambulatorio: "ambulatório", distratora: "distratora", incapaz: "incapaz", apoiar: "apoiar",
  atencao: "atenção", curso: "curso", agudo: "agudo", alerta: "alerta", esquerda: "esquerda", desvio: "desvio",
  nausea: "náusea", vomito: "vômito", migracao: "migração", leucocitose: "leucocitose", anorexia: "anorexia",
  febre: "febre", rebound: "descompressão brusca", hepatopatia: "hepatopatia", diabetes: "diabetes",
  choque: "choque", parada: "parada", cardiaco: "cardíaco", biomarcador: "biomarcador", elevado: "elevado",
  linfonodomegalia: "linfonodomegalia", exclusao_investigada: "exclusão investigada",
};

export function paramLabel(name: string): string {
  const override = LABEL_OVERRIDES[name];
  if (override) return override;
  const words = name.replace(/^p_/, "").split("_").map((w) => TOKEN_LABELS[w] ?? w);
  const text = words.join(" ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export interface ParamOption {
  value: string;
  label: string;
}

const RED_FLAGS: ParamOption[] = [
  { value: "parada_cardiaca", label: "Parada cardíaca" },
  { value: "obstrucao_via_aerea", label: "Obstrução de via aérea" },
  { value: "choque_confirmado", label: "Choque confirmado" },
  { value: "supra_ST", label: "Supradesnivelamento de ST" },
  { value: "instabilidade_hemodinamica", label: "Instabilidade hemodinâmica" },
  { value: "sangramento_ativo", label: "Sangramento ativo" },
];

const ENUMS: Record<string, ParamOption[]> = {
  p_sexo: [{ value: "M", label: "Masculino" }, { value: "F", label: "Feminino" }],
  p_defesa: [
    { value: "ausente", label: "Ausente" },
    { value: "leve", label: "Leve" },
    { value: "moderada", label: "Moderada" },
    { value: "intensa", label: "Intensa" },
  ],
  p_ascite: [
    { value: "ausente", label: "Ausente" },
    { value: "leve", label: "Leve" },
    { value: "moderada_grave", label: "Moderada a grave" },
  ],
  p_encefalopatia: [
    { value: "ausente", label: "Ausente" },
    { value: "grau_I_II", label: "Grau I–II" },
    { value: "grau_III_IV", label: "Grau III–IV" },
  ],
  p_comorbidade: [
    { value: "nenhuma", label: "Nenhuma" },
    { value: "cardiopatia_ic", label: "Cardiopatia / IC" },
    { value: "renal_hepatica_ou_metastatica", label: "Renal, hepática ou metastática" },
  ],
  p_diagnostico: [
    { value: "mallory_weiss_ou_sem_lesao", label: "Mallory-Weiss ou sem lesão" },
    { value: "outros", label: "Outros" },
    { value: "malignidade", label: "Malignidade" },
  ],
  p_vasopressor: [
    { value: "dopamina", label: "Dopamina" },
    { value: "dobutamina", label: "Dobutamina" },
    { value: "noradrenalina", label: "Noradrenalina" },
    { value: "adrenalina", label: "Adrenalina" },
  ],
  p_mecanismo: [{ value: "contuso", label: "Contuso" }, { value: "penetrante", label: "Penetrante" }],
  p_probabilidade_pre_teste: [
    { value: "baixa", label: "Baixa" },
    { value: "intermediaria", label: "Intermediária" },
    { value: "alta", label: "Alta" },
  ],
  p_red_flag: RED_FLAGS,
};

const CONSCIENCIA_NEWS2: ParamOption[] = [
  { value: "A", label: "Alerta" },
  { value: "C", label: "Confusão nova" },
  { value: "V", label: "Responde à voz" },
  { value: "P", label: "Responde à dor" },
  { value: "U", label: "Não responsivo" },
];

const CONSCIENCIA_MEWS: ParamOption[] = [
  { value: "alerta", label: "Alerta" },
  { value: "voz", label: "Responde à voz" },
  { value: "dor", label: "Responde à dor" },
  { value: "nao_responsivo", label: "Não responsivo" },
];

export function paramOptions(fnId: string, name: string): ParamOption[] | null {
  if (name === "p_consciencia") return fnId === "news2" ? CONSCIENCIA_NEWS2 : CONSCIENCIA_MEWS;
  return ENUMS[name] ?? null;
}

/** Quantidade de campos numéricos dos parâmetros do tipo lista. */
export const LIST_SIZES: Record<string, number> = { p_itens: 10, p_dominios: 9 };

export interface ScoreDefinition extends ScoreFnSpec {
  title: string;
  group: ScoreGroup;
  params: ScoreParamSpec[];
}

export const SCORE_DEFINITIONS: ScoreDefinition[] = SCORE_FUNCTIONS.map((spec) => {
  const meta = SCORE_META[spec.id];
  return { ...spec, title: meta?.title ?? spec.id.toUpperCase(), group: meta?.group ?? "Emergência e sepse" };
}).sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));

export const findScore = (id: string) => SCORE_DEFINITIONS.find((s) => s.id === id) ?? null;
