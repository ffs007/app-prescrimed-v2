/** Ações críticas registradas na trilha de auditoria. */
export const AUDIT_ACTIONS = {
  DOCUMENTO_EMITIDO: "documento.emitido",
  DOCUMENTO_ALTERADO: "documento.alterado",
  DOCUMENTO_IMPRESSO: "documento.impresso",
  INTERNACAO_REGISTRADA: "internacao.registrada",
  NOTIFICACAO_EMITIDA: "notificacao.emitida",
  CONTEUDO_CLINICO_ALTERADO: "conteudo_clinico.alterado",
  ACESSO_NEGADO: "acesso.negado",
  EXPORTACAO_DADOS: "dados.exportados",
  SOLICITACAO_LGPD: "lgpd.solicitacao",
  CONSENTIMENTO: "lgpd.consentimento",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  "documento.emitido": "Documento emitido",
  "documento.alterado": "Documento alterado após emissão",
  "documento.impresso": "Documento impresso",
  "internacao.registrada": "Internação registrada",
  "notificacao.emitida": "Notificação compulsória emitida",
  "conteudo_clinico.alterado": "Conteúdo clínico alterado",
  "acesso.negado": "Acesso negado",
  "dados.exportados": "Dados exportados",
  "lgpd.solicitacao": "Solicitação do titular",
  "lgpd.consentimento": "Aceite de termos",
};

export type AuditSeverity = "info" | "alerta" | "critico";
