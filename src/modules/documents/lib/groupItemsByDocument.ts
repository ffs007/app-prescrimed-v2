// Etapa 20 — Títulos de exibição por tipo de documento.
// A função de agrupamento por bundle (groupItemsByDocument) foi removida junto com o
// DocumentsToGenerateDialog (fantasma, decisão Q6): mantinha um classificador de receita
// paralelo ao buildRegulatoryGroups usado na emissão real. TITULOS continua em uso por
// documentTemplates.ts.
import type { DocumentoTipo } from "./types";

const TITULOS: Record<DocumentoTipo, string> = {
  receita_comum: "Receita Médica",
  receita_controle_especial: "Receita de Controle Especial",
  receita_antimicrobiano: "Receita de Antimicrobiano",
  receita_controlado_especifico: "Receita de Medicamento Controlado",
  solicitacao_exames: "Solicitação de Exames",
  atestado: "Atestado Médico",
  encaminhamento: "Encaminhamento Médico",
  relatorio: "Relatório Médico",
  declaracao: "Declaração de Comparecimento",
  orientacoes_paciente: "Orientações ao Paciente",
  prescricao_hospitalar: "Prescrição Hospitalar",
  orientacoes_enfermagem_farmacia: "Orientações de Preparo e Administração",
  anexo_tecnico_iv: "Anexo Técnico — Diluição e Administração IV",
  plano_terapeutico: "Plano Terapêutico",
  resumo_atendimento: "Resumo do Atendimento",
  aih: "Laudo de Internação (AIH)",
  apac: "Laudo APAC",
  notificacao_compulsoria: "Notificação Compulsória",
  procedimento: "Solicitação de Procedimento",
};

export const DOCUMENTO_TITULOS = TITULOS;
