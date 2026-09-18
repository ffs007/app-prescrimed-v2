/**
 * Validação de modelos de documento.
 *
 * Arquitetura preparada para regras regulatórias futuras: cada regra é um
 * objeto com id, referência normativa e uma função pura de checagem. Novas
 * exigências (CFM, ANS, vigilância) entram como novos itens desta lista, sem
 * alterar a interface.
 */
import type { DocTypeKey, DocumentBranding } from "./types";
import { missingRequiredFields } from "./renderDocument";

export type IssueLevel = "erro" | "aviso" | "info";

export interface TemplateIssue {
  id: string;
  level: IssueLevel;
  message: string;
  /** Referência normativa/documental que embasa a regra. */
  reference?: string;
}

export interface TemplateRule {
  id: string;
  reference?: string;
  appliesTo?: DocTypeKey[];
  check: (b: DocumentBranding, docType: DocTypeKey) => TemplateIssue | null;
}

const rule = (
  id: string,
  level: IssueLevel,
  reference: string | undefined,
  test: (b: DocumentBranding, d: DocTypeKey) => boolean,
  message: string,
  appliesTo?: DocTypeKey[],
): TemplateRule => ({
  id,
  reference,
  appliesTo,
  check: (b, d) => (test(b, d) ? { id, level, message, reference } : null),
});

export const TEMPLATE_RULES: TemplateRule[] = [
  rule(
    "identificacao-profissional",
    "erro",
    "CFM Res. 1.931/2009 — identificação do emitente",
    (b) => !b.institution.profissionalNome.trim() || !b.institution.profissionalRegistro.trim(),
    "Informe o nome e o registro do profissional — todo documento médico precisa identificar quem assina.",
  ),
  rule(
    "endereco-contato",
    "aviso",
    undefined,
    (b) => !b.institution.endereco.trim() && !b.institution.telefone.trim(),
    "Sem endereço nem telefone no cabeçalho: dificulta o contato e a conferência do documento.",
  ),
  rule(
    "cnes-sus",
    "aviso",
    "Portaria SUS — documentos de faturamento exigem CNES",
    (b, d) => (d === "aih" || d === "apac") && !b.institution.cnes.trim(),
    "Documentos de AIH/APAC costumam exigir o CNES do estabelecimento.",
    ["aih", "apac"],
  ),
  rule(
    "fonte-legivel",
    "aviso",
    undefined,
    (b) => b.layout.fontSizePt < 10,
    "Fonte abaixo de 10 pt pode ficar ilegível na impressão e em fotocópias.",
  ),
  rule(
    "margem-minima",
    "aviso",
    undefined,
    (b) => b.layout.marginSideMm < 10 || b.layout.marginTopMm < 10,
    "Margens menores que 10 mm podem ser cortadas por impressoras comuns.",
  ),
  rule(
    "espaco-assinatura",
    "aviso",
    undefined,
    (b) => b.layout.signatureSpaceMm < 10 && !b.layout.digitalSignatureBlock,
    "Reserve pelo menos 10 mm acima da linha de assinatura, ou use assinatura digital.",
  ),
  rule(
    "qr-sem-conteudo",
    "erro",
    undefined,
    (b) => b.layout.qrPosition !== "nenhum" && !b.layout.qrContent.trim(),
    "O QR code está ativado, mas sem conteúdo definido.",
  ),
  rule(
    "receita-sem-carimbo",
    "info",
    undefined,
    (b, d) => d === "receita" && !b.layout.stampBox && !b.layout.digitalSignatureBlock,
    "Receitas impressas geralmente pedem espaço de carimbo ou assinatura digital.",
    ["receita"],
  ),
];

export function validateTemplate(
  branding: DocumentBranding,
  docType: DocTypeKey,
): TemplateIssue[] {
  const issues: TemplateIssue[] = [];
  for (const r of TEMPLATE_RULES) {
    if (r.appliesTo && docType !== "todos" && !r.appliesTo.includes(docType)) continue;
    if (r.appliesTo && docType === "todos") continue;
    const issue = r.check(branding, docType);
    if (issue) issues.push(issue);
  }
  for (const f of missingRequiredFields(branding, docType)) {
    issues.push({
      id: `campo-${f.id}`,
      level: "erro",
      message: `Campo obrigatório sem valor padrão: “${f.label}”.`,
    });
  }
  return issues;
}

export const hasBlockingIssue = (issues: TemplateIssue[]) => issues.some((i) => i.level === "erro");
