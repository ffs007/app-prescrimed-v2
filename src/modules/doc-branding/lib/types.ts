/**
 * Personalização de documentos — modelo de dados.
 *
 * Um "perfil de documento" (DocumentBranding) descreve TUDO que muda a
 * aparência e os blocos legais de um documento emitido: marcas, dados
 * institucionais, campos extras (auditoria/consentimento/rodapé) e ajustes
 * de layout (fonte, margens, assinatura, carimbo, QR code).
 *
 * O mesmo perfil serve para pré-visualização em tela e para a folha impressa,
 * porque o renderizador (renderDocument.ts) é único.
 */

/** Tipos de documento que podem ter modelo próprio. */
export const DOC_TYPES = [
  "todos",
  "receita",
  "atestado",
  "exames",
  "encaminhamento",
  "declaracao",
  "relatorio",
  "orientacoes",
  "procedimento",
  "aih",
  "apac",
  "notificacao",
] as const;

export type DocTypeKey = (typeof DOC_TYPES)[number];

export const DOC_TYPE_LABELS: Record<DocTypeKey, string> = {
  todos: "Todos os documentos",
  receita: "Receita médica",
  atestado: "Atestado",
  exames: "Solicitação de exames",
  encaminhamento: "Encaminhamento",
  declaracao: "Declaração de comparecimento",
  relatorio: "Relatório de atendimento",
  orientacoes: "Orientações & retorno",
  procedimento: "Solicitação de procedimento",
  aih: "AIH — internação",
  apac: "APAC — alta complexidade",
  notificacao: "Notificação compulsória",
};

/* ============================================================
 * 1. Logos / marcas
 * ============================================================ */

export type LogoSlot = "institucional" | "clinica" | "consultorio" | "rede";

export const LOGO_LABELS: Record<LogoSlot, string> = {
  institucional: "Institucional (hospital / secretaria)",
  clinica: "Clínica",
  consultorio: "Consultório",
  rede: "Rede de saúde / convênio",
};

export interface LogoConfig {
  /** URL http(s) ou data URL do arquivo enviado. */
  src: string;
  /** Altura de impressão em milímetros. */
  heightMm: number;
  /** Texto alternativo — acessibilidade e leitura por auditoria. */
  alt: string;
}

export type Logos = Partial<Record<LogoSlot, LogoConfig>>;

/* ============================================================
 * 2. Dados institucionais
 * ============================================================ */

export interface InstitutionData {
  nomeInstituicao: string;
  unidade: string;
  endereco: string;
  cidadeUf: string;
  cep: string;
  telefone: string;
  email: string;
  site: string;
  cnpj: string;
  cnes: string;
  /** Profissional responsável. */
  profissionalNome: string;
  profissionalConselho: string; // Ex: CRM, COREN, CRO, CRP
  profissionalRegistro: string; // Ex: CRM/SP 123456
  profissionalEspecialidade: string;
  profissionalRqe: string;
  /** Registros adicionais de outras categorias profissionais. */
  registrosExtras: Array<{ conselho: string; numero: string; nome?: string }>;
}

/* ============================================================
 * 3. Campos personalizados
 * ============================================================ */

export type CustomFieldKind = "auditoria" | "consentimento" | "rodape";

export const CUSTOM_FIELD_LABELS: Record<CustomFieldKind, string> = {
  auditoria: "Auditoria de convênio",
  consentimento: "Consentimento",
  rodape: "Rodapé específico",
};

export interface CustomField {
  id: string;
  kind: CustomFieldKind;
  label: string;
  /** Valor fixo, ou vazio para virar linha em branco preenchida à mão. */
  value: string;
  /** Obrigatório para auditoria — bloqueia a emissão enquanto vazio. */
  required: boolean;
  /** Exibir apenas nestes tipos de documento (vazio = todos). */
  docTypes: DocTypeKey[];
  /** Linha assinável (imprime linha pontilhada para preenchimento manual). */
  signable?: boolean;
}

/* ============================================================
 * 4. Layout e formatação
 * ============================================================ */

export type SignaturePosition = "direita" | "centro" | "esquerda";
export type QrPosition = "rodape-direita" | "rodape-esquerda" | "cabecalho-direita" | "nenhum";

export interface LayoutConfig {
  /** Corpo do texto, em pontos. */
  fontSizePt: number;
  /** Altura de linha do corpo. */
  lineHeight: number;
  fontFamily: "sistema" | "serifada" | "monoespacada";
  marginTopMm: number;
  marginBottomMm: number;
  marginSideMm: number;
  paperSize: "A4" | "Carta";
  orientation: "retrato" | "paisagem";
  showHeader: boolean;
  headerText: string;
  headerDivider: boolean;
  showFooter: boolean;
  footerText: string;
  /** Numeração "Página X de Y" no rodapé. */
  pageNumbers: boolean;
  signaturePosition: SignaturePosition;
  /** Espaço em branco reservado acima da linha de assinatura (mm). */
  signatureSpaceMm: number;
  /** Reservar quadro para carimbo físico. */
  stampBox: boolean;
  stampBoxLabel: string;
  qrPosition: QrPosition;
  /** Texto/URL codificado no QR — aceita variáveis (ex: {{documento.codigo}}). */
  qrContent: string;
  qrCaption: string;
  /** Bloco de assinatura digital (hash + código de validação). */
  digitalSignatureBlock: boolean;
  digitalSignatureNote: string;
  /** Marca d'água discreta (ex: "VIA DO PACIENTE"). */
  watermark: string;
  accentColor: string; // hex, usado em filetes e títulos
}

/* ============================================================
 * Perfil completo
 * ============================================================ */

export interface DocumentBranding {
  logos: Logos;
  institution: InstitutionData;
  customFields: CustomField[];
  layout: LayoutConfig;
}

export interface DocumentTemplateRecord {
  id: string;
  user_id: string;
  nome: string;
  descricao: string | null;
  documento_tipo: DocTypeKey;
  is_galeria: boolean;
  visibilidade: "privado" | "instituicao" | "publico";
  instituicao: string | null;
  config: DocumentBranding;
  created_at: string;
  updated_at: string;
}

/** Dados variáveis do documento em si — o que o motor interpola. */
export interface DocumentRenderData {
  titulo: string;
  /** Corpo já formatado em HTML seguro (gerado pelo app) ou texto simples. */
  corpoHtml?: string;
  corpoTexto?: string;
  paciente?: {
    nome?: string;
    idade?: string;
    documento?: string;
    cartaoSus?: string;
    convenio?: string;
  };
  cidade?: string;
  data?: string;
  /** Código curto de validação / hash do documento. */
  codigo?: string;
  hash?: string;
  /** URL pública de verificação, quando existir. */
  urlValidacao?: string;
}
