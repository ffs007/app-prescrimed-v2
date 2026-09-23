/**
 * Workflow FAIL-CLOSED de emissão clínica.
 *
 * Sequência obrigatória (qualquer throw aborta a entrega do documento):
 *
 *   1) persistDocumento → grava linha em `documentos_gerados`
 *   2) persistHistorico  → grava linha em `prescricoes_historico` (receitas apenas)
 *   3) generatePdf       → produz o Blob binário A4
 *   4) uploadPdfBucket   → envia Blob para Storage `documentos-pdf`
 *   5) saveLocalHistory  → atualiza `emissionHistory` do navegador (só se 1..4 passarem)
 *
 * Se qualquer etapa lançar erro → `allowDelivery = false`, e o chamador DEVE
 * cancelar a impressora / não disponibilizar o blob para download.
 *
 * Observação sobre regras clínicas: esta função não toca em cálculo de dose,
 * validação posológica, interações, segurança clínica, ou gating de revisão
 * final. Tudo isso já acontece ANTES de chegar aqui (validado no Dashboard
 * em camadas 0-2). Aqui só é garantido o CONTRATO DE PERSISTÊNCIA do que foi
 * aprovado clínicamente — não é "segurança clínica", é "segurança operacional
 * de registro", exigida por regulamentação (CGM 3.0, LGPD, auditoria médica).
 */
import type { NewEmissionRecord } from "@/modules/prescription/hooks/useEmissionHistory";
import type { ReceiptFamily } from "@/modules/prescription/services/regulatoryTaxonomy";
import type { EmissionLogAction } from "./persistEmission";

export interface FailClosedArgs {
  snapshot: NewEmissionRecord;
  acao: EmissionLogAction;
  family?: ReceiptFamily | null;
  /** Passo 1: documentos_gerados. Retorna o id gravado (string). Throw aborta. */
  persistDocumento: (args: {
    snapshot: NewEmissionRecord;
    family?: ReceiptFamily | null;
    acao: EmissionLogAction;
  }) => Promise<string>;
  /** Passo 2: prescricoes_historico. Chamado SOMENTE se action === "receita". Throw aborta. */
  persistHistorico: () => Promise<void>;
  /** Passo 3: gerar blob PDF antes do upload. Throw aborta. */
  generatePdf: () => Promise<Blob>;
  /** Passo 4: enviar Blob → storage `documentos-pdf`. Retorna caminho salvo. Throw aborta. */
  uploadPdfBucket: (documentoId: string, pdf: Blob) => Promise<string>;
  /** Passo 5: salvar snapshot local no emissionHistory do navegador. Chamado SÓ se 1..4 passaram. */
  saveLocalHistory?: (documentoId: string) => Promise<void> | void;
}

export interface FailClosedResult {
  allowDelivery: boolean;
  documentoId?: string;
  pdfBlob?: Blob;
  pdfPath?: string;
  error?: string;
}

const ehReceita = (s: NewEmissionRecord) => s.action === "receita";

export async function runEmissionFailClosed(args: FailClosedArgs): Promise<FailClosedResult> {
  const {
    snapshot,
    acao,
    family,
    persistDocumento,
    persistHistorico,
    generatePdf,
    uploadPdfBucket,
    saveLocalHistory,
  } = args;

  // (1) documentos_gerados — tabela mestre, SEMPRE executa primeiro
  let documentoId: string;
  try {
    documentoId = await persistDocumento({ snapshot, family, acao });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err ?? "erro desconhecido");
    return { allowDelivery: false, error: message };
  }

  // (2) prescricoes_historico — só para receitas, aborta se falhar
  if (ehReceita(snapshot)) {
    try {
      await persistHistorico();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err ?? "erro prescricoes_historico");
      return { allowDelivery: false, error: message };
    }
  }

  // (3) Blob PDF — geração local, sempre precisa rodar ANTES do bucket
  let pdfBlob: Blob;
  try {
    pdfBlob = await generatePdf();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err ?? "erro ao gerar PDF");
    return { allowDelivery: false, documentoId, error: message };
  }

  // (4) Envio para Storage `documentos-pdf` — obrigatório ANTES de liberar
  let pdfPath: string;
  try {
    pdfPath = await uploadPdfBucket(documentoId, pdfBlob);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err ?? "erro no upload do bucket");
    return { allowDelivery: false, documentoId, error: message };
  }

  // (5) Histórico local (snapshots em memória/localStorage do navegador)
  if (saveLocalHistory) {
    try {
      await Promise.resolve(saveLocalHistory(documentoId));
    } catch {
      // Histórico local nunca bloqueia o workflow — é cache, não registro mestre.
      // (Falha aqui é silenciosa, a entrega já está garantida pelas etapas 1..4.)
    }
  }

  // PASSOU em todas as etapas → médico PODE ver a impressora / receber o blob.
  return {
    allowDelivery: true,
    documentoId,
    pdfBlob,
    pdfPath,
  };
}
