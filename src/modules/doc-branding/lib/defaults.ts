import type {
  CustomField,
  DocTypeKey,
  DocumentBranding,
  InstitutionData,
  LayoutConfig,
} from "./types";

export const EMPTY_INSTITUTION: InstitutionData = {
  nomeInstituicao: "",
  unidade: "",
  endereco: "",
  cidadeUf: "",
  cep: "",
  telefone: "",
  email: "",
  site: "",
  cnpj: "",
  cnes: "",
  profissionalNome: "",
  profissionalConselho: "CRM",
  profissionalRegistro: "",
  profissionalEspecialidade: "",
  profissionalRqe: "",
  registrosExtras: [],
};

export const DEFAULT_LAYOUT: LayoutConfig = {
  fontSizePt: 12,
  lineHeight: 1.45,
  fontFamily: "sistema",
  marginTopMm: 18,
  marginBottomMm: 18,
  marginSideMm: 16,
  paperSize: "A4",
  orientation: "retrato",
  showHeader: true,
  headerText: "",
  headerDivider: true,
  showFooter: true,
  footerText: "",
  pageNumbers: true,
  signaturePosition: "centro",
  signatureSpaceMm: 18,
  stampBox: false,
  stampBoxLabel: "Carimbo e assinatura",
  qrPosition: "nenhum",
  qrContent: "{{documento.urlValidacao}}",
  qrCaption: "Verifique a autenticidade",
  digitalSignatureBlock: false,
  digitalSignatureNote:
    "Documento assinado digitalmente. A validade pode ser conferida pelo código acima.",
  watermark: "",
  accentColor: "#1f3a5f",
};

export const DEFAULT_BRANDING: DocumentBranding = {
  logos: {},
  institution: EMPTY_INSTITUTION,
  customFields: [],
  layout: DEFAULT_LAYOUT,
};

/** Mescla parciais vindos do banco com os defaults (tolerante a versões antigas). */
export const normalizeBranding = (raw: unknown): DocumentBranding => {
  const b = (raw ?? {}) as Partial<DocumentBranding>;
  return {
    logos: b.logos ?? {},
    institution: { ...EMPTY_INSTITUTION, ...(b.institution ?? {}) },
    customFields: Array.isArray(b.customFields) ? b.customFields : [],
    layout: { ...DEFAULT_LAYOUT, ...(b.layout ?? {}) },
  };
};

export const newCustomField = (kind: CustomField["kind"]): CustomField => ({
  id: crypto.randomUUID(),
  kind,
  label:
    kind === "auditoria"
      ? "Nº da guia / autorização"
      : kind === "consentimento"
        ? "Ciente e de acordo"
        : "Observação de rodapé",
  value: "",
  required: kind === "auditoria",
  docTypes: [],
  signable: kind === "consentimento",
});

/* ============================================================
 * Galeria de modelos padrão (embutida — sempre disponível offline)
 * ============================================================ */

export interface GalleryTemplate {
  id: string;
  nome: string;
  descricao: string;
  documento_tipo: DocTypeKey;
  config: DocumentBranding;
}

const withLayout = (patch: Partial<LayoutConfig>, fields: CustomField[] = []): DocumentBranding => ({
  logos: {},
  institution: EMPTY_INSTITUTION,
  customFields: fields,
  layout: { ...DEFAULT_LAYOUT, ...patch },
});

export const GALLERY: GalleryTemplate[] = [
  {
    id: "gal-classico",
    nome: "Clássico consultório",
    descricao: "Cabeçalho simples com filete, assinatura centralizada e rodapé com endereço.",
    documento_tipo: "todos",
    config: withLayout({}),
  },
  {
    id: "gal-hospitalar",
    nome: "Hospitalar / SUS",
    descricao: "Fonte compacta, margens menores, quadro de carimbo e numeração de páginas.",
    documento_tipo: "todos",
    config: withLayout({
      fontSizePt: 11,
      marginTopMm: 14,
      marginBottomMm: 14,
      marginSideMm: 12,
      stampBox: true,
      pageNumbers: true,
      accentColor: "#14532d",
    }),
  },
  {
    id: "gal-convenio",
    nome: "Convênio com auditoria",
    descricao: "Campos obrigatórios de guia e matrícula, exigidos em auditoria de operadoras.",
    documento_tipo: "todos",
    config: withLayout({ stampBox: true }, [
      {
        id: "gal-conv-guia",
        kind: "auditoria",
        label: "Nº da guia / autorização",
        value: "",
        required: true,
        docTypes: [],
      },
      {
        id: "gal-conv-matricula",
        kind: "auditoria",
        label: "Matrícula do beneficiário",
        value: "",
        required: true,
        docTypes: [],
      },
      {
        id: "gal-conv-operadora",
        kind: "auditoria",
        label: "Operadora / plano",
        value: "",
        required: false,
        docTypes: [],
      },
    ]),
  },
  {
    id: "gal-digital",
    nome: "Digital com QR de validação",
    descricao: "Bloco de assinatura digital, código de validação e QR code no rodapé.",
    documento_tipo: "todos",
    config: withLayout({
      qrPosition: "rodape-direita",
      digitalSignatureBlock: true,
      signaturePosition: "direita",
    }),
  },
  {
    id: "gal-receita-2vias",
    nome: "Receita com via do paciente",
    descricao: "Marca d'água de via, espaço ampliado para carimbo da farmácia.",
    documento_tipo: "receita",
    config: withLayout({
      watermark: "VIA DO PACIENTE",
      stampBox: true,
      stampBoxLabel: "Carimbo da farmácia",
      signatureSpaceMm: 24,
    }),
  },
  {
    id: "gal-atestado-consent",
    nome: "Atestado com consentimento",
    descricao: "Linha de ciência do paciente e rodapé com aviso de sigilo médico.",
    documento_tipo: "atestado",
    config: withLayout(
      { footerText: "Documento sigiloso — uso exclusivo do paciente e de quem ele autorizar." },
      [
        {
          id: "gal-atest-ciente",
          kind: "consentimento",
          label: "Ciente do conteúdo e da finalidade deste atestado",
          value: "",
          required: false,
          docTypes: ["atestado"],
          signable: true,
        },
      ],
    ),
  },
];
