import type { DocumentAction } from "../components/ActionGrid";
import type { SelectedMed } from "../types/prescription";
import type { AtestadoData } from "../components/AtestadoForm";
import type { ExamesData } from "../components/ExamesForm";
import type { EncaminhamentoData } from "../components/EncaminhamentoForm";
import type { DeclaracaoData } from "../components/DeclaracaoForm";
import type { RelatorioData } from "../components/RelatorioForm";
import type { OrientacoesData } from "../components/OrientacoesForm";
import {
  missingRequired,
  AIH_FIELDS,
  APAC_FIELDS,
  NOTIFICACAO_FIELDS,
  type FieldSpec,
  type StructuredData,
} from "./regulatoryForms";

export interface ProcedimentoData {
  tipo: string;
  justificativa: string;
  observacoes: string;
  contexto: string;
}

/** Resultado da validação de um documento. */
export interface ValidationResult {
  /** True quando o documento pode ser emitido. */
  canEmit: boolean;
  /** Lista de pendências bloqueantes (faltando para emitir). */
  blockers: string[];
  /** Lista de avisos não bloqueantes (recomendações). */
  warnings: string[];
}

const ok = (warnings: string[] = []): ValidationResult => ({
  canEmit: true,
  blockers: [],
  warnings,
});

const blocked = (blockers: string[], warnings: string[] = []): ValidationResult => ({
  canEmit: false,
  blockers,
  warnings,
});

export interface PatientForValidation {
  patientName: string;
  isPediatric: boolean;
  weight: string;
}

/** Validação universal: nome do paciente é obrigatório para qualquer documento. */
const validateBase = (patient: PatientForValidation): string[] => {
  const blockers: string[] = [];
  if (!patient.patientName.trim()) blockers.push("Nome do paciente");
  return blockers;
};

export const validateReceita = (
  selected: SelectedMed[],
  patient: PatientForValidation,
): ValidationResult => {
  const blockers = validateBase(patient);
  const warnings: string[] = [];
  if (selected.length === 0) blockers.push("Adicione ao menos uma medicação");
  if (patient.isPediatric && !patient.weight.trim()) {
    warnings.push("Peso ausente — recomendado para cálculo pediátrico");
  }
  return blockers.length ? blocked(blockers, warnings) : ok(warnings);
};

export const validateAtestado = (
  data: AtestadoData,
  patient: PatientForValidation,
): ValidationResult => {
  const blockers = validateBase(patient);
  if (!data.days.trim()) blockers.push("Período de afastamento (dias)");
  return blockers.length ? blocked(blockers) : ok();
};

export const validateExames = (
  data: ExamesData,
  patient: PatientForValidation,
): ValidationResult => {
  const blockers = validateBase(patient);
  const warnings: string[] = [];
  if (data.itens.length === 0) blockers.push("Adicione ao menos um exame");
  if (!data.justificativa.trim()) warnings.push("Justificativa clínica recomendada");
  return blockers.length ? blocked(blockers, warnings) : ok(warnings);
};

export const validateEncaminhamento = (
  data: EncaminhamentoData,
  patient: PatientForValidation,
): ValidationResult => {
  const blockers = validateBase(patient);
  if (!data.especialidade.trim()) blockers.push("Especialidade de destino");
  if (!data.hipotese.trim() && !data.resumoClinico.trim())
    blockers.push("Hipótese diagnóstica ou resumo clínico");
  return blockers.length ? blocked(blockers) : ok();
};

export const validateDeclaracao = (
  data: DeclaracaoData,
  patient: PatientForValidation,
): ValidationResult => {
  const blockers = validateBase(patient);
  if (!data.data.trim()) blockers.push("Data do comparecimento");
  if (!data.horaInicio.trim()) blockers.push("Horário de início");
  return blockers.length ? blocked(blockers) : ok();
};

export const validateRelatorio = (
  data: RelatorioData,
  patient: PatientForValidation,
): ValidationResult => {
  const blockers = validateBase(patient);
  if (!data.conteudo.trim()) blockers.push("Escreva o relatório do atendimento");

  return blockers.length ? blocked(blockers) : ok();
};

export const validateOrientacoes = (
  data: OrientacoesData,
  patient: PatientForValidation,
): ValidationResult => {
  const blockers = validateBase(patient);
  if (!data.cuidadosGerais.trim() && data.sinaisAlarme.length === 0) {
    blockers.push("Cuidados gerais ou sinais de alarme");
  }
  return blockers.length ? blocked(blockers) : ok();
};

export const validateProcedimento = (
  data: ProcedimentoData,
  patient: PatientForValidation,
): ValidationResult => {
  const blockers = validateBase(patient);
  if (!data.tipo.trim()) blockers.push("Tipo de procedimento");
  if (!data.justificativa.trim()) blockers.push("Justificativa clínica");
  return blockers.length ? blocked(blockers) : ok();
};

/** Documentos regulatórios: validação dirigida pela especificação de campos. */
export const validateStructured = (
  fields: FieldSpec[],
  data: StructuredData,
  patient: PatientForValidation,
): ValidationResult => {
  const blockers = [...validateBase(patient), ...missingRequired(fields, data)];
  return blockers.length ? blocked(blockers) : ok();
};

/** Dispatcher: valida o documento ativo. */
export interface ValidationContext {
  action: DocumentAction;
  patient: PatientForValidation;
  selected: SelectedMed[];
  atestado: AtestadoData;
  exames: ExamesData;
  encaminhamento: EncaminhamentoData;
  declaracao: DeclaracaoData;
  relatorio: RelatorioData;
  orientacoes: OrientacoesData;
  procedimento: ProcedimentoData;
  aih: StructuredData;
  apac: StructuredData;
  notificacao: StructuredData;
}

export const validateDocument = (ctx: ValidationContext): ValidationResult => {
  switch (ctx.action) {
    case "receita":
      return validateReceita(ctx.selected, ctx.patient);
    case "atestado":
      return validateAtestado(ctx.atestado, ctx.patient);
    case "exames":
      return validateExames(ctx.exames, ctx.patient);
    case "encaminhamento":
      return validateEncaminhamento(ctx.encaminhamento, ctx.patient);
    case "declaracao":
      return validateDeclaracao(ctx.declaracao, ctx.patient);
    case "relatorio":
      return validateRelatorio(ctx.relatorio, ctx.patient);
    case "orientacoes":
      return validateOrientacoes(ctx.orientacoes, ctx.patient);
    case "procedimento":
      return validateProcedimento(ctx.procedimento, ctx.patient);
    case "aih":
      return validateStructured(AIH_FIELDS, ctx.aih, ctx.patient);
    case "apac":
      return validateStructured(APAC_FIELDS, ctx.apac, ctx.patient);
    case "notificacao":
      return validateStructured(NOTIFICACAO_FIELDS, ctx.notificacao, ctx.patient);
  }
};
