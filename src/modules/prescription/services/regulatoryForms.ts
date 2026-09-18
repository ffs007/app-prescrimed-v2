/**
 * Documentos regulatórios do SUS e vigilância: AIH, APAC e Notificação Compulsória.
 *
 * Estratégia: cada documento é descrito por uma *especificação de campos*
 * (FieldSpec[]). O mesmo componente de formulário e o mesmo renderizador de
 * corpo (preview/impressão) servem os três, evitando triplicar UI.
 */

export type FieldType = "text" | "textarea" | "date" | "select" | "checkbox" | "number";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldSpec {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  options?: FieldOption[];
  suggestions?: string[];
  /** Ocupa metade da largura em telas médias. */
  half?: boolean;
  /** Não imprimir no documento final (campo apenas operacional). */
  printHidden?: boolean;
}

/** Valores de um documento estruturado: texto ou marcação. */
export type StructuredData = Record<string, string | boolean>;

export interface DocSection {
  label: string;
  value: string;
  /** Destaque visual (alertas, caráter de urgência). */
  emphasis?: boolean;
  /** Texto longo — renderiza em parágrafo com quebras preservadas. */
  block?: boolean;
}

/* ============================================================
 * AIH — Autorização de Internação Hospitalar
 * ============================================================ */

export const AIH_FIELDS: FieldSpec[] = [
  {
    key: "procedimento",
    label: "Procedimento solicitado",
    type: "text",
    required: true,
    placeholder: "Ex: Tratamento de pneumonia em adulto",
    suggestions: [
      "Tratamento de pneumonia ou influenza",
      "Tratamento de insuficiência cardíaca",
      "Tratamento de acidente vascular cerebral",
      "Tratamento de infecção do trato urinário",
      "Colecistectomia",
      "Apendicectomia",
      "Parto normal",
      "Parto cesariano",
      "Tratamento de diabetes mellitus descompensado",
      "Tratamento de doença pulmonar obstrutiva crônica",
    ],
  },
  { key: "codigoProcedimento", label: "Código SIGTAP", type: "text", half: true, placeholder: "00.00.00.000-0" },
  {
    key: "carater",
    label: "Caráter da internação",
    type: "select",
    half: true,
    options: [
      { value: "eletivo", label: "Eletivo" },
      { value: "urgencia", label: "Urgência / emergência" },
    ],
  },
  {
    key: "clinica",
    label: "Clínica",
    type: "select",
    half: true,
    options: [
      { value: "medica", label: "Clínica médica" },
      { value: "cirurgica", label: "Cirúrgica" },
      { value: "obstetrica", label: "Obstétrica" },
      { value: "pediatrica", label: "Pediátrica" },
      { value: "psiquiatrica", label: "Psiquiátrica" },
    ],
  },
  { key: "diasSolicitados", label: "Diárias solicitadas", type: "number", half: true, placeholder: "Ex: 5" },
  { key: "cid", label: "CID-10 principal", type: "text", required: true, half: true, placeholder: "Ex: J18.9" },
  { key: "cidSecundario", label: "CID-10 secundário", type: "text", half: true },
  {
    key: "sinaisSintomas",
    label: "Sinais e sintomas clínicos",
    type: "textarea",
    required: true,
    placeholder: "Quadro que motiva a internação",
  },
  {
    key: "condicoes",
    label: "Condições que justificam a internação",
    type: "textarea",
    required: true,
    placeholder: "Gravidade, falha do tratamento ambulatorial, necessidade de suporte hospitalar",
  },
  {
    key: "resultadosExames",
    label: "Principais resultados de exames",
    type: "textarea",
    placeholder: "Laboratoriais, imagem, ECG",
  },
  { key: "observacoes", label: "Observações", type: "textarea" },
];

/* ============================================================
 * APAC — Autorização de Procedimento de Alta Complexidade
 * ============================================================ */

export const APAC_FIELDS: FieldSpec[] = [
  {
    key: "procedimento",
    label: "Procedimento solicitado",
    type: "text",
    required: true,
    placeholder: "Ex: Hemodiálise em paciente com IRC",
    suggestions: [
      "Hemodiálise (3 sessões por semana)",
      "Diálise peritoneal ambulatorial contínua",
      "Quimioterapia paliativa",
      "Radioterapia",
      "Tratamento de hepatite viral crônica",
      "Terapia antirretroviral",
      "Medicamento do componente especializado",
      "Ressonância magnética",
      "Tomografia computadorizada",
      "Cirurgia bariátrica",
    ],
  },
  { key: "codigoProcedimento", label: "Código SIGTAP", type: "text", half: true, placeholder: "00.00.00.000-0" },
  {
    key: "tipo",
    label: "Tipo de APAC",
    type: "select",
    half: true,
    options: [
      { value: "inicial", label: "Inicial" },
      { value: "continuidade", label: "Continuidade" },
      { value: "unica", label: "Única" },
    ],
  },
  { key: "quantidade", label: "Quantidade solicitada", type: "number", half: true, placeholder: "Ex: 12" },
  { key: "cid", label: "CID-10", type: "text", required: true, half: true, placeholder: "Ex: N18.6" },
  { key: "periodoInicio", label: "Competência inicial", type: "date", half: true },
  { key: "periodoFim", label: "Competência final", type: "date", half: true },
  {
    key: "justificativa",
    label: "Justificativa clínica",
    type: "textarea",
    required: true,
    placeholder: "História, gravidade, tratamentos prévios e por que este procedimento é necessário",
  },
  {
    key: "exames",
    label: "Exames e laudos que sustentam a solicitação",
    type: "textarea",
  },
  { key: "observacoes", label: "Observações", type: "textarea" },
];

/* ============================================================
 * Notificação compulsória (vigilância epidemiológica)
 * ============================================================ */

export const AGRAVOS_NOTIFICAVEIS = [
  "Acidente por animal peçonhento",
  "Acidente de trabalho grave",
  "Coqueluche",
  "COVID-19",
  "Dengue",
  "Difteria",
  "Doença de Chagas aguda",
  "Doença meningocócica",
  "Esquistossomose",
  "Febre amarela",
  "Febre maculosa",
  "Febre tifoide",
  "Hanseníase",
  "Hepatites virais",
  "HIV/aids",
  "Influenza humana por novo subtipo",
  "Intoxicação exógena",
  "Leishmaniose tegumentar",
  "Leishmaniose visceral",
  "Leptospirose",
  "Malária",
  "Meningite",
  "Óbito materno",
  "Óbito infantil e fetal",
  "Paralisia flácida aguda",
  "Raiva humana",
  "Rubéola",
  "Sarampo",
  "Sífilis adquirida",
  "Sífilis congênita",
  "Sífilis em gestante",
  "Síndrome respiratória aguda grave (SRAG)",
  "Tétano",
  "Tuberculose",
  "Varicela grave",
  "Violência interpessoal / autoprovocada",
  "Zika vírus",
];

export const NOTIFICACAO_FIELDS: FieldSpec[] = [
  {
    key: "agravo",
    label: "Agravo ou doença notificada",
    type: "text",
    required: true,
    placeholder: "Ex: Dengue",
    suggestions: AGRAVOS_NOTIFICAVEIS,
    hint: "Lista de notificação compulsória (Portaria de Consolidação nº 4/2017).",
  },
  {
    key: "classificacao",
    label: "Classificação do caso",
    type: "select",
    half: true,
    options: [
      { value: "suspeito", label: "Suspeito" },
      { value: "confirmado", label: "Confirmado" },
    ],
  },
  {
    key: "imediata",
    label: "Notificação imediata (24 horas)",
    type: "checkbox",
    half: true,
    hint: "Marque para agravos de notificação imediata à vigilância.",
  },
  { key: "cid", label: "CID-10", type: "text", half: true, placeholder: "Ex: A90" },
  { key: "dataSintomas", label: "Início dos sintomas", type: "date", required: true, half: true },
  { key: "dataDiagnostico", label: "Data do diagnóstico / suspeita", type: "date", half: true },
  {
    key: "criterio",
    label: "Critério de confirmação",
    type: "select",
    half: true,
    options: [
      { value: "clinico", label: "Clínico-epidemiológico" },
      { value: "laboratorial", label: "Laboratorial" },
      { value: "imagem", label: "Clínico-imagem" },
      { value: "em_investigacao", label: "Em investigação" },
    ],
  },
  {
    key: "evolucao",
    label: "Evolução do caso",
    type: "select",
    half: true,
    options: [
      { value: "em_tratamento", label: "Em tratamento ambulatorial" },
      { value: "internado", label: "Internado" },
      { value: "uti", label: "Internado em UTI" },
      { value: "cura", label: "Cura / alta" },
      { value: "obito", label: "Óbito" },
      { value: "ignorado", label: "Ignorado" },
    ],
  },
  {
    key: "quadroClinico",
    label: "Quadro clínico e achados",
    type: "textarea",
    required: true,
    placeholder: "Sintomas, sinais, exames e conduta adotada",
  },
  {
    key: "vinculoEpidemiologico",
    label: "Vínculo epidemiológico / exposição",
    type: "textarea",
    placeholder: "Contatos, viagens, surto, local provável de infecção",
  },
  {
    key: "unidadeNotificadora",
    label: "Unidade notificadora",
    type: "text",
    half: true,
    placeholder: "Nome do serviço de saúde",
  },
  {
    key: "contatoPaciente",
    label: "Contato do paciente para busca ativa",
    type: "text",
    half: true,
    printHidden: true,
  },
  { key: "observacoes", label: "Observações", type: "textarea" },
];

/* ============================================================
 * Estado inicial derivado da especificação
 * ============================================================ */

const emptyFrom = (fields: FieldSpec[]): StructuredData =>
  fields.reduce<StructuredData>((acc, f) => {
    acc[f.key] = f.type === "checkbox" ? false : f.type === "select" ? (f.options?.[0]?.value ?? "") : "";
    return acc;
  }, {});

export const EMPTY_AIH: StructuredData = emptyFrom(AIH_FIELDS);
export const EMPTY_APAC: StructuredData = emptyFrom(APAC_FIELDS);
export const EMPTY_NOTIFICACAO: StructuredData = emptyFrom(NOTIFICACAO_FIELDS);

/** True quando o usuário já digitou algo além dos defaults. */
export const hasStructuredContent = (fields: FieldSpec[], data: StructuredData): boolean =>
  fields.some((f) => {
    const v = data[f.key];
    if (f.type === "checkbox") return v === true;
    if (f.type === "select") return typeof v === "string" && v !== "" && v !== f.options?.[0]?.value;
    return typeof v === "string" && v.trim() !== "";
  });

/** Campos obrigatórios ainda em branco — vira lista de pendências. */
export const missingRequired = (fields: FieldSpec[], data: StructuredData): string[] =>
  fields
    .filter((f) => f.required && !String(data[f.key] ?? "").trim())
    .map((f) => f.label);

const formatDateBR = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
};

/** Converte os dados preenchidos em seções legíveis para preview/impressão/texto. */
export const buildSections = (fields: FieldSpec[], data: StructuredData): DocSection[] => {
  const out: DocSection[] = [];
  for (const f of fields) {
    if (f.printHidden) continue;
    const raw = data[f.key];
    if (f.type === "checkbox") {
      if (raw === true) out.push({ label: f.label, value: "Sim", emphasis: true });
      continue;
    }
    const str = String(raw ?? "").trim();
    if (!str) continue;
    let value = str;
    if (f.type === "date") value = formatDateBR(str);
    if (f.type === "select") value = f.options?.find((o) => o.value === str)?.label ?? str;
    out.push({
      label: f.label,
      value,
      block: f.type === "textarea",
      emphasis: f.type === "select" && (str === "urgencia" || str === "obito" || str === "uti"),
    });
  }
  return out;
};

/** Frase de abertura de cada documento regulatório. */
export const structuredLead = (
  kind: "aih" | "apac" | "notificacao",
  patientName: string,
  data: StructuredData,
): string => {
  const nome = patientName || "____________________";
  if (kind === "aih") {
    return `Solicito autorização de internação hospitalar (AIH) para o(a) paciente ${nome}, conforme justificativa clínica abaixo.`;
  }
  if (kind === "apac") {
    return `Solicito autorização de procedimento ambulatorial de alta complexidade (APAC) para o(a) paciente ${nome}, conforme justificativa clínica abaixo.`;
  }
  const classe = data.classificacao === "confirmado" ? "confirmado" : "suspeito";
  return `Notifico à vigilância epidemiológica o caso ${classe} de ${String(data.agravo || "____________")} no(a) paciente ${nome}, nos termos da notificação compulsória.`;
};
