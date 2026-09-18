/**
 * Camada 2 do fluxo clínico — Síndromes.
 *
 * Uma síndrome é a porta de entrada rápida do atendimento quando ainda não há
 * diagnóstico fechado (dor, febre, tosse…). Ela carrega blocos reutilizáveis
 * que alimentam a Camada 3 (documentos): medicamentos, exames, orientações,
 * atestado padrão, encaminhamentos, adaptações por perfil e sinais de alerta.
 */
import type { ClinicalEnvironment, ClinicalSeverity } from "@/modules/prescription/types/prescription";

export interface SyndromeMedication {
  nome: string;
  posologia?: string;
  via?: string;
  obs?: string;
}

export interface SyndromeExam {
  nome: string;
  tipo?: string;
  obs?: string;
}

export interface Syndrome {
  id: string;
  codigo: string;
  nome: string;
  sinonimos: string[];
  ambientes: ClinicalEnvironment[];
  cid?: string | null;
  gravidade?: ClinicalSeverity | null;
  categoria?: string | null;
  medicamentosAmbulatoriais: SyndromeMedication[];
  medicamentosHospitalares: SyndromeMedication[];
  examesComuns: SyndromeExam[];
  examesApac: SyndromeExam[];
  orientacoes: string[];
  atestadoPadrao?: string | null;
  encaminhamentos: string[];
  adaptacaoPediatrica?: string | null;
  adaptacaoGestante?: string | null;
  adaptacaoLactante?: string | null;
  adaptacaoGeriatrica?: string | null;
  sinaisAlerta: string[];
  contraindicacoes: string[];
  documentosRelacionados: string[];
  fonte?: string | null;
  versao: number;
  status: string;
}

/** Texto formatado de um medicamento de síndrome, pronto para a receita. */
export const syndromeMedText = (med: SyndromeMedication): string =>
  [med.posologia, med.via ? `Via ${med.via}` : "", med.obs]
    .filter(Boolean)
    .join(" — ");
