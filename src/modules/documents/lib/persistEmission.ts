// Persistência dos documentos emitidos pelo Dashboard (documentos_gerados + log + PDF no Storage).
import { supabase } from "@/integrations/supabase/client";
import type { DocumentAction } from "@/modules/prescription/components/ActionGrid";
import type { NewEmissionRecord } from "@/modules/prescription/hooks/useEmissionHistory";
import type { ReceiptFamily } from "@/modules/prescription/services/regulatoryTaxonomy";
import { recordCriticalEvent } from "@/modules/security/lib/auditClient";
import { AUDIT_ACTIONS } from "@/modules/security/lib/auditActions";
import { logDocumentAction } from "./documentSave";
import { hashDocument, shortValidationCode } from "./pdfPrint";
import type { DocumentoAcaoLog, DocumentoTipo } from "./types";

export const DOCUMENT_PDF_BUCKET = "documentos-pdf";

const TIPO_BY_ACTION: Record<Exclude<DocumentAction, "receita">, DocumentoTipo> = {
  exames: "solicitacao_exames",
  encaminhamento: "encaminhamento",
  atestado: "atestado",
  declaracao: "declaracao",
  relatorio: "relatorio",
  orientacoes: "orientacoes_paciente",
  procedimento: "procedimento",
  aih: "aih",
  apac: "apac",
  notificacao: "notificacao_compulsoria",
};

const TIPO_BY_FAMILY: Record<ReceiptFamily, DocumentoTipo> = {
  comum: "receita_comum",
  "controle-especial": "receita_controle_especial",
  antimicrobiano: "receita_antimicrobiano",
  "notificacao-A": "receita_controlado_especifico",
  "notificacao-B": "receita_controlado_especifico",
  "notificacao-especial": "receita_controlado_especifico",
};

export function resolveDocumentoTipo(action: DocumentAction, family?: ReceiptFamily | null): DocumentoTipo {
  return action === "receita" ? TIPO_BY_FAMILY[family ?? "comum"] : TIPO_BY_ACTION[action];
}

function contentForAction(s: NewEmissionRecord): unknown {
  switch (s.action) {
    case "receita": {
      const items = s.selectedFilter ? s.selected.filter((m) => s.selectedFilter!.includes(m.id)) : s.selected;
      return items.map((m) => ({ nome: m.name, posologia: m.text }));
    }
    case "atestado": return s.atestado;
    case "exames": return s.exames;
    case "encaminhamento": return s.encaminhamento;
    case "declaracao": return s.declaracao;
    case "relatorio": return s.relatorio;
    case "orientacoes": return s.orientacoes;
    case "procedimento": return s.procedimento;
    case "aih": return s.aih ?? null;
    case "apac": return s.apac ?? null;
    case "notificacao": return s.notificacao ?? null;
  }
}

function summaryFor(s: NewEmissionRecord): string {
  if (s.action !== "receita") return s.documentTitle;
  const items = s.selectedFilter ? s.selected.filter((m) => s.selectedFilter!.includes(m.id)) : s.selected;
  return items.map((m) => `${m.name} — ${m.text}`).join("\n").slice(0, 2000);
}

export type EmissionLogAction = Extract<DocumentoAcaoLog, "imprimiu" | "gerou_pdf" | "baixou">;

interface InsertEmissionArgs {
  tipo: DocumentoTipo;
  titulo: string;
  resumo: string;
  conteudo_json: Record<string, unknown>;
  acao: EmissionLogAction;
}

async function insertEmission({ tipo, titulo, resumo, conteudo_json, acao }: InsertEmissionArgs): Promise<string> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Sessão expirada. Entre novamente para emitir documentos.");

  const hash = await hashDocument(conteudo_json);
  const { data, error } = await supabase.from("documentos_gerados").insert({
    tipo,
    titulo,
    conteudo_resumido: resumo,
    conteudo_json: conteudo_json as never,
    status: "gerado",
    gerado_por: user.id,
    origem: "atendimento_atual",
    codigo_validacao: shortValidationCode(),
    hash_documento: hash,
  }).select("id").single();
  if (error || !data) throw error ?? new Error("documentos_gerados não retornou o registro criado");

  await logDocumentAction({ id_documento: data.id, tipo_documento: tipo, acao });
  await recordCriticalEvent({
    acao: AUDIT_ACTIONS.DOCUMENTO_EMITIDO,
    modulo: "documentos",
    entidade: tipo,
    entidadeId: data.id,
    detalhes: { hash, origem: "atendimento_atual", acao },
  });
  return data.id;
}

export interface PersistEmissionArgs {
  snapshot: NewEmissionRecord;
  family?: ReceiptFamily | null;
  acao: EmissionLogAction;
}

/** Registra a emissão. Lança erro se a gravação falhar — o chamador deve bloquear a saída do documento. */
export async function persistEmission({ snapshot, family, acao }: PersistEmissionArgs): Promise<string> {
  return insertEmission({
    tipo: resolveDocumentoTipo(snapshot.action, family),
    titulo: snapshot.regulatoryLabel ? `${snapshot.documentTitle} — ${snapshot.regulatoryLabel}` : snapshot.documentTitle,
    resumo: summaryFor(snapshot),
    acao,
    conteudo_json: {
      versao_snapshot: 1,
      origem_acao: snapshot.action,
      paciente: {
        nome: snapshot.patientName || null,
        pediatrico: snapshot.isPediatric,
        gestante: snapshot.isPregnant,
        idade: [snapshot.ageValue, snapshot.ageUnit].filter(Boolean).join(" ") || null,
        peso: snapshot.weight || null,
      },
      contexto: snapshot.context,
      receituario: snapshot.regulatoryLabel ?? null,
      profissional: {
        nome: snapshot.signatureConfig.stampName ?? null,
        funcao: snapshot.signatureConfig.stampRole ?? null,
        crm: snapshot.signatureConfig.stampCrm ?? null,
      },
      conteudo: contentForAction(snapshot),
    },
  });
}

export interface PersistFormDocumentArgs {
  tipo: Extract<DocumentoTipo, "aih" | "notificacao_compulsoria">;
  titulo: string;
  resumo: string;
  /** Campos preenchidos da ficha (o que vai impresso). */
  campos: Record<string, unknown>;
  acao: EmissionLogAction;
}

/** Registro de fichas emitidas fora do Dashboard (bancadas de AIH e de notificação). Mesma regra: se falhar, o documento não sai. */
export async function persistFormDocument({ tipo, titulo, resumo, campos, acao }: PersistFormDocumentArgs): Promise<string> {
  return insertEmission({
    tipo,
    titulo,
    resumo: resumo.slice(0, 2000),
    acao,
    conteudo_json: { versao_snapshot: 1, origem_acao: tipo, conteudo: campos },
  });
}

/** Envia o PDF ao Storage e grava o caminho em documentos_gerados.arquivo_pdf_url. Lança erro em qualquer falha. */
export async function attachDocumentPdf(documentoId: string, pdf: Blob): Promise<string> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Sessão expirada.");
  const path = `${user.id}/${documentoId}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from(DOCUMENT_PDF_BUCKET)
    .upload(path, pdf, { contentType: "application/pdf", upsert: true });
  if (uploadError) throw uploadError;
  const { error: updateError } = await supabase
    .from("documentos_gerados")
    .update({ arquivo_pdf_url: path })
    .eq("id", documentoId);
  if (updateError) throw updateError;
  return path;
}
