export type PregnancyRiskCategory = "A" | "B" | "C" | "D" | "X";

export type PrescriptionType = "comum" | "branca2vias" | "amarela" | "azul";

export type AgeGroup = "adult" | "pediatric" | "both";

export interface Medication {
  id: number;
  name: string;
  dosage: string;
  instructions: string;
  category: string;
  /** Subgrupo terapêutico exibido como cabeçalho dentro de uma patologia (ex: "Antibiótico", "AINE", "Corticoide sistêmico"). */
  subCategory?: string;
  /** Define em qual lista (adulto/pediátrica) esse medicamento aparece. Default: "both". */
  ageGroup?: AgeGroup;
  pediatricDose?: string;
  safeForPregnant?: boolean;
  pregnancyRisk?: PregnancyRiskCategory;
  prescriptionType?: PrescriptionType;
  /**
   * Medicamento via oral que também é administrado dentro da unidade
   * (ex: AAS, Clopidogrel, Captopril SL). Aparece no modo hospitalar.
   */
  inHospitalOral?: boolean;
  isCustom?: boolean;
}

/**
 * Subtipo clínico de uma patologia (ex: Conjuntivite Bacteriana).
 * Quando uma patologia tem subtipos, o usuário escolhe primeiro o subtipo
 * e o CID/medicações vêm do subtipo selecionado, não do pai.
 */
export interface PathologySubtype {
  id: string;
  /** Nome curto do subtipo (ex: "Bacteriana"). Mostrado no botão de seleção. */
  name: string;
  /** CID específico do subtipo. */
  cid?: string;
  /** IDs de medicamentos. Quando ausente, herda do pai. */
  meds?: number[];
  /** Receitas hospitalares específicas desse subtipo. */
  hospitalMeds?: string[];
  /** Linha auxiliar exibida embaixo do nome (ex: "Sem secreção, prurido"). */
  hint?: string;
}

/** Ambiente clínico de atendimento em que a patologia é abordada. */
export type ClinicalEnvironment = "ambulatorial" | "urgencia" | "emergencia";

/** Gravidade curada da patologia dentro do ambiente. */
export type ClinicalSeverity = "leve" | "moderada" | "grave" | "critica";

export interface Pathology {
  id: number;
  name: string;
  meds: number[];
  hospitalMeds?: string[];
  cid?: string;
  /** Categoria de exibição (ex: "Otorrino", "Reumatologia"). Opcional. */
  category?: string;
  /** Subtipos clínicos. Se presente e não vazio, força etapa de escolha antes da prescrição. */
  subtypes?: PathologySubtype[];
  /** Sinônimos / termos clínicos populares para a busca (ex: "ITU", "olho vermelho"). */
  synonyms?: string[];
  /**
   * Marca a patologia como urgência/emergência crítica.
   * Aparece na aba "Emergências" e ganha destaque visual sutil.
   */
  isEmergency?: boolean;
  /** Ambientes curados em que a patologia aparece (Ambulatorial / Urgências / Emergências). */
  environments?: ClinicalEnvironment[];
  /** Gravidade curada (vem da curadoria de ambiente). */
  severity?: ClinicalSeverity;
  /** Especialidade responsável, quando curada. */
  specialty?: string;
  /** Sistema/aparelho usado para agrupar a lista (ex: "cardiovascular"). */
  system?: string;
  /** Frequência relativa no ambiente (0-100). Ordena as mais comuns primeiro. */
  frequency?: number;
  /** Gravidade específica de cada ambiente. */
  severityByEnvironment?: Partial<Record<ClinicalEnvironment, ClinicalSeverity>>;
  /** Frequência específica de cada ambiente. */
  frequencyByEnvironment?: Partial<Record<ClinicalEnvironment, number>>;
  isCustom?: boolean;
}

export interface SelectedMed {
  id: number;
  name: string;
  text: string;
}

export interface ClinicInfo {
  clinicName: string;
  doctorName: string;
  crm: string;
  specialty: string;
  address: string;
  phone: string;
  email: string;
}

/**
 * Assinatura + carimbo digital.
 * - `signatureImageUrl`: imagem da assinatura (data URL vinda de upload local).
 * - Campos do carimbo (nome / função / CRM) são renderizados como bloco de texto
 *   no rodapé de todos os documentos, simulando o carimbo físico.
 * - `signatureText`: linha(s) livre(s) adicionais (legado / observações).
 */
export interface SignatureConfig {
  signatureText: string;
  signatureImageUrl: string;
  /** Nome do médico exibido no carimbo. */
  stampName?: string;
  /** Especialidade ou função (ex: "Clínica Médica", "Plantonista"). */
  stampRole?: string;
  /** CRM com UF (ex: "CRM/SP 123456"). */
  stampCrm?: string;
  /** Linha extra opcional (ex: RQE, telefone profissional). */
  stampExtra?: string;
}

/** Monta as linhas do carimbo digital, na ordem de impressão. */
export const buildStampLines = (
  signature: SignatureConfig,
  fallback?: { doctorName?: string; specialty?: string; crm?: string },
): string[] =>
  [
    signature.stampName?.trim() || fallback?.doctorName?.trim() || "",
    signature.stampRole?.trim() || fallback?.specialty?.trim() || "",
    signature.stampCrm?.trim() || fallback?.crm?.trim() || "",
    signature.stampExtra?.trim() || "",
    ...(signature.signatureText?.trim() ? signature.signatureText.trim().split("\n") : []),
  ].filter((l) => l.length > 0);

export interface PrescriptionTemplate {
  id: number;
  name: string;
  meds: SelectedMed[];
  isCustom: boolean;
}
