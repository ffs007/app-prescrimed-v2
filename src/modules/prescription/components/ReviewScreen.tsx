import { useEffect } from "react";
import { ArrowLeft, ShieldCheck, ShieldAlert, AlertCircle, CheckCircle2, FileText, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ReactNode } from "react";
import type { ValidationResult } from "../services/documentValidation";
import type { SafetyAssessment } from "../services/clinicalSafety";
import { statusLabel } from "../services/clinicalSafety";
import type { AssinaturaPerfil } from "@/modules/documents/lib/types";
import EmissionActions from "./EmissionActions";

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

interface Props {
  open: boolean;
  onClose: () => void;
  documentTitle: string;
  validation: ValidationResult;
  assessment: SafetyAssessment;
  /** Preview do documento (recebe o mesmo DocumentPreview já usado na lateral). */
  preview: ReactNode;
  documentText: string;
  onPrint: () => void;
  /**
   * Slot opcional para o painel regulatório (apenas para receita médica).
   * Quando presente, substitui o bloco padrão "Emitir documento".
   */
  regulatoryPanel?: ReactNode;
  /** Perfis de assinatura cadastrados (Admin → Documentos). Vazio esconde o seletor. */
  signatureProfiles?: AssinaturaPerfil[];
  selectedProfileId?: string;
  onSelectProfile?: (id: string) => void;
  /** Vem de documentos_settings.exigir_revisao_final_concluida. */
  requireFinalReview: boolean;
  finalReviewConfirmed: boolean;
  onToggleFinalReview: (v: boolean) => void;
}

type FinalStatus = "ready" | "review" | "blocked";

const computeFinalStatus = (v: ValidationResult, a: SafetyAssessment): FinalStatus => {
  if (!v.canEmit) return "blocked";
  if (a.status === "blocked") return "blocked";
  if (a.status === "review-required" || v.warnings.length > 0) return "review";
  return "ready";
};

const STATUS_CFG: Record<
  FinalStatus,
  { label: string; tone: string; icon: typeof ShieldCheck; description: string }
> = {
  ready: {
    label: "Pronto para emitir",
    tone: "border-canon-blue/30 bg-canon-blue/5 text-canon-blue",
    icon: ShieldCheck,
    description: "Sem pendências críticas. Você pode emitir o documento.",
  },
  review: {
    label: "Revisão recomendada",
    tone: "border-warning/40 bg-warning/5 text-warning",
    icon: ShieldAlert,
    description: "Há recomendações clínicas. Confirme antes de emitir.",
  },
  blocked: {
    label: "Emissão bloqueada",
    tone: "border-destructive/30 bg-destructive/5 text-destructive",
    icon: ShieldAlert,
    description: "Resolva os bloqueios abaixo para liberar a emissão.",
  },
};

const ReviewScreen = ({
  open,
  onClose,
  documentTitle,
  validation,
  assessment,
  preview,
  documentText,
  onPrint,
  regulatoryPanel,
  signatureProfiles = [],
  selectedProfileId,
  onSelectProfile,
  requireFinalReview,
  finalReviewConfirmed,
  onToggleFinalReview,
}: Props) => {
  // Lock scroll + Esc to close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const finalStatus = computeFinalStatus(validation, assessment);
  const cfg = STATUS_CFG[finalStatus];
  const StatusIcon = cfg.icon;
  const finalReviewOk = !requireFinalReview || finalReviewConfirmed;
  const canEmit = finalStatus !== "blocked" && finalReviewOk;
  const blockedReason =
    finalStatus === "blocked"
      ? validation.blockers[0] || assessment.pendingCritical[0]?.title || "Resolva as pendências."
      : !finalReviewOk
      ? "Confirme a revisão final antes de emitir."
      : undefined;

  // Pendências consolidadas
  const blockerItems = [
    ...validation.blockers.map((b) => ({ kind: "blocker" as const, label: b })),
    ...assessment.pendingCritical.map((a) => ({ kind: "blocker" as const, label: a.title })),
  ];
  const warningItems = [
    ...validation.warnings.map((w) => ({ kind: "warning" as const, label: w })),
    ...assessment.alerts
      .filter((a) => a.severity === "warning")
      .map((a) => ({ kind: "warning" as const, label: a.title })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper print:hidden">
      {/* Top bar */}
      <header className="shrink-0 border-b border-ink-soft bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-9 gap-2 text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar para editar</span>
            <span className="sm:hidden">Editar</span>
          </Button>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
              Revisão final
            </div>
            <div className="truncate font-serif text-base font-semibold text-ink sm:text-lg">
              {documentTitle}
            </div>
          </div>
          {/* Status badge */}
          <div
            className={cn(
              "hidden items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold sm:inline-flex",
              cfg.tone,
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {cfg.label}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_360px] lg:gap-6">
          {/* Preview central */}
          <main className="min-w-0">
            <div className="h-[60vh] lg:h-[calc(100vh-13rem)]">
              {preview}
            </div>
          </main>

          {/* Painel lateral de status + pendências + ações */}
          <aside className="space-y-4">
            {/* Status grande */}
            <div className={cn("rounded-lg border p-4 shadow-paper", cfg.tone)}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-card">
                  <StatusIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold sm:hidden">{cfg.label}</div>
                  <div className="hidden text-base font-bold sm:block">{cfg.label}</div>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                    {cfg.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Pendências bloqueantes */}
            {blockerItems.length > 0 && (
              <div className="rounded-lg border border-destructive/20 bg-card shadow-paper">
                <div className="flex items-center gap-2 border-b border-ink-soft/40 px-4 py-2.5">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <div className="text-xs font-semibold text-destructive">
                    Pendências bloqueantes ({blockerItems.length})
                  </div>
                </div>
                <ul className="divide-y divide-ink-soft/40">
                  {blockerItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 px-4 py-2.5 text-[12px] text-ink">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recomendações (não bloqueia) */}
            {warningItems.length > 0 && (
              <div className="rounded-lg border border-warning/30 bg-card shadow-paper">
                <div className="flex items-center gap-2 border-b border-ink-soft/40 px-4 py-2.5">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <div className="text-xs font-semibold text-warning">
                    Recomendações ({warningItems.length})
                  </div>
                </div>
                <ul className="divide-y divide-ink-soft/40">
                  {warningItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 px-4 py-2.5 text-[12px] text-ink">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Estado limpo */}
            {finalStatus === "ready" && blockerItems.length === 0 && warningItems.length === 0 && (
              <div className="rounded-lg border border-ink-soft bg-card p-4 shadow-paper">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-canon-blue" />
                  <div>
                    <div className="text-sm font-semibold text-ink">Documento pronto</div>
                    <p className="mt-0.5 text-[12px] text-ink-muted">
                      Nenhuma pendência identificada. Você pode emitir com segurança.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Perfil de assinatura — só aparece com perfis cadastrados em Admin → Documentos. */}
            {signatureProfiles.length > 0 && (
              <div className="rounded-lg border border-ink-soft bg-card p-4 shadow-paper">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-editorial text-ink-faint">
                  <PenLine className="h-3 w-3" />
                  Perfil de assinatura
                </div>
                <Select value={selectedProfileId} onValueChange={onSelectProfile}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>
                    {signatureProfiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.perfil_nome} — {p.nome_profissional}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Gate de revisão final — só aparece se o admin exigiu (documentos_settings). */}
            {requireFinalReview && (
              <div className={cn(
                "flex items-start gap-2.5 rounded-lg border p-4 shadow-paper",
                finalReviewConfirmed ? "border-ink-soft bg-card" : "border-warning/40 bg-warning/5",
              )}>
                <Checkbox
                  id="revisao-final"
                  checked={finalReviewConfirmed}
                  onCheckedChange={(v) => onToggleFinalReview(Boolean(v))}
                  className="mt-0.5"
                />
                <Label htmlFor="revisao-final" className="cursor-pointer text-[12px] leading-relaxed text-ink">
                  Revisei este documento por completo (paciente, conteúdo e assinatura) e confirmo a emissão.
                </Label>
              </div>
            )}

            {/* Ações — painel regulatório quando disponível, fallback para emissão única */}
            {regulatoryPanel ? (
              <div className="rounded-lg border border-ink-soft bg-card p-4 shadow-paper">
                {regulatoryPanel}
              </div>
            ) : (
              <div className="rounded-lg border border-ink-soft bg-card p-4 shadow-paper">
                <div className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-editorial text-ink-faint">
                  <FileText className="h-3 w-3" />
                  Emitir documento
                </div>
                <EmissionActions
                  documentText={documentText}
                  shareTitle={documentTitle}
                  onPrint={onPrint}
                  canEmit={canEmit}
                  blockedReason={blockedReason}
                />
                <p className="mt-2 text-[10px] text-ink-faint">
                  Imprimir abre o diálogo do navegador — escolha "Salvar como PDF" para baixar.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ReviewScreen;
