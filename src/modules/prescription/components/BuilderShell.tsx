import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Eye, AlertCircle } from "lucide-react";
import type { ValidationResult } from "../services/documentValidation";
import type { UsePatientReturn } from "../hooks/usePatient";

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

interface BuilderShellProps {
  children: ReactNode;
  patient: UsePatientReturn;
  validation: ValidationResult;
  onReview: () => void;
  onClear: () => void;
  reviewLabel?: string;
  /** Painel de segurança clínica (opcional, renderizado entre construtor e barra de emissão). */
  safetyPanel?: ReactNode;
}

/** Chip compacto reutilizado no header do Bloco C. */
const Chip = ({
  tone = "default",
  children,
}: {
  tone?: "default" | "warning" | "destructive" | "info";
  children: ReactNode;
}) => {
  const tones = {
    default: "border-ink-soft bg-paper-alt/60 text-ink-muted",
    info: "border-canon-blue/30 bg-canon-blue/10 text-canon-blue",
    warning: "border-warning/40 bg-warning/10 text-warning",
    destructive: "border-destructive/30 bg-destructive/5 text-destructive",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
};

/**
 * BuilderShell — wrapper unificado do Bloco C.
 *
 * Envolve qualquer formulário com:
 * - barra de chips de contexto reaproveitado do paciente
 * - barra de ações (Limpar + Emitir) com pendências inline
 *
 * Mantém a UX de "tela única": construção + preview lateral coexistem.
 * O botão "Emitir" sempre fica clicável (decisão de UX); se inválido,
 * o handler chamado pelo Dashboard mostra um toast com as pendências.
 */
const BuilderShell = ({
  children,
  patient,
  validation,
  onReview,
  onClear,
  reviewLabel = "Revisar e emitir",
  safetyPanel,
}: BuilderShellProps) => {
  const { patientName, isPediatric, isPregnant, weight, ageValue, ageUnit, hasAllergies, allergies, hasRenalImpairment, renalFunction } = patient;

  const hasContext =
    patientName || ageValue || weight || isPediatric || isPregnant || hasAllergies || hasRenalImpairment;

  const { canEmit, blockers, warnings } = validation;

  return (
    <div className="space-y-3">
      {/* Faixa de contexto reaproveitado do Bloco A */}
      {hasContext && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-ink-soft bg-card/60 px-3 py-2 shadow-paper">
          <span className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
            Contexto
          </span>
          {patientName && <Chip tone="info">{patientName}</Chip>}
          {ageValue && (
            <Chip>
              {ageValue} {ageUnit}
            </Chip>
          )}
          {weight && <Chip>{weight} kg</Chip>}
          {isPediatric && <Chip tone="info">Pediátrico</Chip>}
          {isPregnant && <Chip tone="destructive">Gestante</Chip>}
          {hasAllergies && (
            <Chip tone="warning">
              Alergia: <span className="ml-0.5 max-w-[140px] truncate">{allergies}</span>
            </Chip>
          )}
          {hasRenalImpairment && (
            <Chip tone="warning">FR {renalFunction}</Chip>
          )}
        </div>
      )}

      {/* Slot do construtor específico */}
      {children}

      {/* Painel de segurança clínica (opcional) */}
      {safetyPanel}

      {/* Barra de ações (Bloco C · Emissão) */}
      <div className="rounded-lg border border-ink-soft bg-card p-3 shadow-paper sm:p-4">
        {/* Pendências inline */}
        {(blockers.length > 0 || warnings.length > 0) && (
          <div className="mb-3 space-y-1.5">
            {blockers.length > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-2.5 py-2 text-[11px] text-ink">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                <div>
                  <span className="font-medium text-destructive">Faltam para emitir:</span>{" "}
                  {blockers.join(" · ")}
                </div>
              </div>
            )}
            {warnings.length > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 px-2.5 py-2 text-[11px] text-ink">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                <div>
                  <span className="font-medium text-warning">Recomendações:</span>{" "}
                  {warnings.join(" · ")}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            onClick={onClear}
            className="h-9 text-ink-muted hover:text-ink"
          >
            <Eraser className="mr-2 h-3.5 w-3.5" />
            Limpar
          </Button>
          <Button
            onClick={onReview}
            className={cn(
              "h-10 gap-2 px-5 shadow-paper transition",
              canEmit
                ? "bg-canon-blue text-primary-foreground hover:bg-canon-blue/90"
                : "bg-canon-blue/40 text-primary-foreground hover:bg-canon-blue/50",
            )}
          >
            <Eye className="h-4 w-4" />
            {reviewLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BuilderShell;
