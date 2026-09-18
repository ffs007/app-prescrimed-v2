import { Check, ShieldAlert, ShieldCheck, AlertTriangle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type {
  ClinicalAlert,
  SafetyAssessment,
  SafetyStatus,
} from "../services/clinicalSafety";
import { statusLabel } from "../services/clinicalSafety";
import type { OverrideRecord } from "../hooks/useSafetyOverride";

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

interface SafetyPanelProps {
  assessment: SafetyAssessment;
  overrides: Record<string, OverrideRecord>;
  onAcknowledge: (alertId: string) => void;
  onRequestJustify: (alert: ClinicalAlert) => void;
  onRevoke: (alertId: string) => void;
}

const statusStyle: Record<
  SafetyStatus,
  { wrapper: string; icon: React.ComponentType<{ className?: string }>; iconBg: string; label: string }
> = {
  ok: {
    wrapper: "border-canon-blue/20 bg-canon-blue/5",
    icon: ShieldCheck,
    iconBg: "bg-canon-blue/10 text-canon-blue",
    label: "text-canon-blue",
  },
  info: {
    wrapper: "border-canon-blue/20 bg-canon-blue/5",
    icon: ShieldCheck,
    iconBg: "bg-canon-blue/10 text-canon-blue",
    label: "text-canon-blue",
  },
  "review-required": {
    wrapper: "border-warning/30 bg-warning/5",
    icon: ShieldAlert,
    iconBg: "bg-warning/10 text-warning",
    label: "text-warning",
  },
  blocked: {
    wrapper: "border-destructive/30 bg-destructive/5",
    icon: ShieldAlert,
    iconBg: "bg-destructive/10 text-destructive",
    label: "text-destructive",
  },
};

const severityStyle = {
  info: { icon: Info, badge: "bg-canon-blue/10 text-canon-blue", label: "Info" },
  warning: {
    icon: AlertTriangle,
    badge: "bg-warning/10 text-warning",
    label: "Atenção",
  },
  critical: {
    icon: ShieldAlert,
    badge: "bg-destructive/10 text-destructive",
    label: "Crítico",
  },
} as const;

const SafetyPanel = ({
  assessment,
  overrides,
  onAcknowledge,
  onRequestJustify,
  onRevoke,
}: SafetyPanelProps) => {
  const { status, alerts } = assessment;
  const cfg = statusStyle[status];
  const StatusIcon = cfg.icon;

  // Não polui quando não há nada relevante
  if (status === "ok" && alerts.length === 0) {
    return (
      <div className={cn("flex items-center gap-2 rounded-md border px-3 py-2", cfg.wrapper)}>
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-md", cfg.iconBg)}>
          <StatusIcon className="h-3.5 w-3.5" />
        </div>
        <div>
          <div className={cn("text-xs font-semibold", cfg.label)}>{statusLabel(status)}</div>
          <div className="text-[10px] text-ink-muted">Nenhum alerta clínico identificado.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border shadow-paper", cfg.wrapper)}>
      {/* Header status */}
      <div className="flex items-center justify-between gap-3 border-b border-ink-soft/40 px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2.5">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-md", cfg.iconBg)}>
            <StatusIcon className="h-4 w-4" />
          </div>
          <div>
            <div className={cn("text-sm font-semibold", cfg.label)}>{statusLabel(status)}</div>
            <div className="text-[10px] uppercase tracking-editorial text-ink-faint">
              Revisão de segurança clínica
            </div>
          </div>
        </div>
        <div className="text-[11px] font-medium text-ink-muted">
          {alerts.length} {alerts.length === 1 ? "alerta" : "alertas"}
        </div>
      </div>

      {/* Lista de alertas */}
      <ul className="divide-y divide-ink-soft/40">
        {alerts.map((a) => {
          const sev = severityStyle[a.severity];
          const SevIcon = sev.icon;
          const overridden = overrides[a.id];
          return (
            <li key={a.id} className="px-3 py-3 sm:px-4">
              <div className="flex items-start gap-2.5">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                    sev.badge,
                  )}
                >
                  <SevIcon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-editorial", sev.badge)}>
                      {sev.label}
                    </span>
                    <span className="text-sm font-semibold text-ink">{a.title}</span>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                    {a.message}
                  </p>
                  {a.action && (
                    <p className="mt-1 text-[11px] italic text-ink-faint">→ {a.action}</p>
                  )}

                  {/* Estado de override / ação */}
                  {overridden ? (
                    <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-ink-soft bg-card px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                        <Check className="h-3 w-3 text-canon-blue" />
                        <span>
                          {overridden.ackKind === "justified"
                            ? `Confirmado clinicamente: "${overridden.justification}"`
                            : "Revisado e confirmado pelo médico"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRevoke(a.id)}
                        className="rounded p-1 text-ink-faint hover:bg-paper-alt hover:text-ink"
                        title="Desfazer confirmação"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : a.overridable ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {a.severity === "critical" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onRequestJustify(a)}
                          className="h-7 border-destructive/40 text-[11px] text-destructive hover:bg-destructive/10"
                        >
                          Confirmar com justificativa
                        </Button>
                      ) : (
                        <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-ink-muted hover:text-ink">
                          <Checkbox
                            checked={false}
                            onCheckedChange={(v) => v && onAcknowledge(a.id)}
                          />
                          Revisei e confirmo
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] font-medium text-destructive">
                      Bloqueio rígido — corrija o dado para destravar.
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SafetyPanel;
