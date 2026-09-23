// Etapa 20 — Persistência e log de documentos.
import { supabase } from "@/integrations/supabase/client";
import type { DocumentoAcaoLog, DocumentoTipo, RenderedDocument } from "./types";
import { hashDocument, shortValidationCode } from "./pdfPrint";
import { recordCriticalEvent } from "@/modules/security/lib/auditClient";
import { AUDIT_ACTIONS } from "@/modules/security/lib/auditActions";

export async function saveGeneratedDocument(args: {
  rendered: RenderedDocument;
  id_atendimento?: string | null;
  id_paciente?: string | null;
  origem?: "atendimento_atual" | "manual";
}): Promise<string> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw authError ?? new Error("Sessão expirada. Entre novamente para registrar o documento.");
  const hash = await hashDocument({ html: args.rendered.html, json: args.rendered.conteudo_json });
  const { data, error } = await supabase.from("documentos_gerados").insert({
    tipo: args.rendered.tipo,
    titulo: args.rendered.titulo,
    conteudo_resumido: args.rendered.conteudo_resumido,
    conteudo_json: args.rendered.conteudo_json as never,
    status: "gerado",
    gerado_por: user.id,
    origem: args.origem ?? "atendimento_atual",
    id_atendimento: args.id_atendimento ?? null,
    id_paciente: args.id_paciente ?? null,
    codigo_validacao: shortValidationCode(),
    hash_documento: hash,
  }).select("id").single();
  if (error || !data?.id) throw error ?? new Error("O Supabase não retornou o identificador do documento.");
  await logDocumentAction({ id_documento: data.id, tipo_documento: args.rendered.tipo, acao: "gerou_pdf" });
  await recordCriticalEvent({
    acao: AUDIT_ACTIONS.DOCUMENTO_EMITIDO,
    modulo: "documentos",
    entidade: args.rendered.tipo,
    entidadeId: data?.id ?? null,
    detalhes: { hash, origem: args.origem ?? "atendimento_atual" },
  });
  return data.id;
}

export async function logDocumentAction(args: {
  id_documento?: string | null;
  tipo_documento?: DocumentoTipo | null;
  acao: DocumentoAcaoLog;
  id_atendimento?: string | null;
  id_paciente?: string | null;
  destino_envio?: string | null;
  motivo_cancelamento?: string | null;
}): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw authError ?? new Error("Sessão expirada. Entre novamente para registrar a ação do documento.");
  const { error } = await supabase.from("log_documentos_clinicos").insert({
    id_documento: args.id_documento ?? null,
    tipo_documento: args.tipo_documento ?? null,
    acao: args.acao,
    usuario_responsavel: user.id,
    id_atendimento: args.id_atendimento ?? null,
    id_paciente: args.id_paciente ?? null,
    destino_envio: args.destino_envio ?? null,
    motivo_cancelamento: args.motivo_cancelamento ?? null,
  });
  if (error) throw error;
}

export async function cancelDocument(id: string, motivo: string): Promise<void> {
  const { error } = await supabase.from("documentos_gerados")
    .update({ status: "cancelado", motivo_cancelamento: motivo })
    .eq("id", id);
  if (error) throw error;
  await logDocumentAction({ id_documento: id, acao: "cancelou", motivo_cancelamento: motivo });
  await recordCriticalEvent({
    acao: AUDIT_ACTIONS.DOCUMENTO_ALTERADO,
    modulo: "documentos",
    entidade: "documentos_gerados",
    entidadeId: id,
    severidade: "alerta",
    detalhes: { operacao: "cancelamento" },
  });
}
