/**
 * Props compartilhados pelos 4 templates de impressão regulatórios.
 *
 * Estratégia: cada template é uma função de renderização pura. Recebe
 * o paciente, os medicamentos já filtrados (do grupo regulatório ativo),
 * info da clínica e configuração de assinatura. O wrapper de scroll/print
 * (PrintArea) só decide qual template instanciar.
 */
import type { SelectedMed, ClinicInfo, SignatureConfig } from "../../types/prescription";

export interface PrescriptionTemplateProps {
  /** Medicamentos já filtrados pelo grupo regulatório atual. */
  meds: SelectedMed[];
  patientName: string;
  isPediatric: boolean;
  isPregnant: boolean;
  ageValue: string;
  ageUnit: string;
  weight: string;
  clinicInfo: ClinicInfo;
  signatureConfig: SignatureConfig;
  /** Rótulo regulatório para o cabeçalho (ex: "Receita de Controle Especial"). */
  regulatoryLabel: string;
  /** Validade em dias do tipo de receituário (ex: 30, 10). */
  validityDays: number;
  /** Sinais de alarme / orientações de retorno impressos junto à receita. */
  returnInstructions?: string[];
}

/** Helper: data atual formatada pt-BR. */
export const todayBR = (): string => new Date().toLocaleDateString("pt-BR");
