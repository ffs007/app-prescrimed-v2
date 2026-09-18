import { useState } from "react";
import { AlertTriangle, ShieldAlert, Info, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { IVAlert, Severity } from "./ivSafetyEngine";
import { logIVAlert } from "./ivAlertHistory";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

const sevTone = (s: Severity) =>
  s === "blocker"
    ? "border-destructive/30 bg-destructive/5 text-destructive"
    : s === "warning"
    ? "border-warning/40 bg-warning/5 text-warning"
    : "border-ink-soft bg-paper-alt/40 text-ink-muted";

const sevIcon = (s: Severity) =>
  s === "blocker" ? ShieldAlert : s === "warning" ? AlertTriangle : Info;

const sevLabel = (s: Severity) =>
  s === "blocker" ? "Bloqueio" : s === "warning" ? "Alerta" : "Info";

interface Props {
  alerts: IVAlert[];
  principioAtivo: string;
  /** Justificativas já confirmadas (chave = type). */
  justifications: Record<string, string>;
  onConfirmJustification: (type: string, justification: string) => void;
}

export default function IVAlertList({
  alerts,
  principioAtivo,
  justifications,
  onConfirmJustification,
}: Props) {
  if (alerts.length === 0) return null;

  return (
    <ul className="space-y-1.5">
      {alerts.map((a, i) => (
        <AlertRow
          key={`${a.type}-${i}`}
          alert={a}
          principioAtivo={principioAtivo}
          confirmedJustification={justifications[a.type]}
          onConfirmJustification={(j) => onConfirmJustification(a.type, j)}
        />
      ))}
    </ul>
  );
}

function AlertRow({
  alert,
  principioAtivo,
  confirmedJustification,
  onConfirmJustification,
}: {
  alert: IVAlert;
  principioAtivo: string;
  confirmedJustification?: string;
  onConfirmJustification: (j: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const Icon = sevIcon(alert.severity);

  const handleConfirm = async () => {
    const j = text.trim();
    if (!j) return;
    onConfirmJustification(j);
    setShowForm(false);
    await logIVAlert({
      alert,
      principio_ativo: principioAtivo,
      acao: "confirmou_com_justificativa",
      justificativa: j,
    });
  };

  return (
    <li className={cn("rounded-md border px-2.5 py-2 text-[11px]", sevTone(alert.severity))}>
      <div className="flex items-start gap-2">
        <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
              {sevLabel(alert.severity)}
            </Badge>
            {alert.hardBlock && (
              <Badge variant="outline" className="text-[9px] uppercase border-destructive/40 text-destructive">
                Bloqueio absoluto
              </Badge>
            )}
          </div>
          <p className="text-ink leading-snug">{alert.message}</p>
          {(alert.prescribedValue || alert.recommendedValue) && (
            <div className="text-[10px] text-ink-muted space-y-0.5">
              {alert.prescribedValue && (
                <div><span className="text-ink-faint">Prescrito:</span> {alert.prescribedValue}</div>
              )}
              {alert.recommendedValue && (
                <div><span className="text-ink-faint">Recomendado:</span> {alert.recommendedValue}</div>
              )}
            </div>
          )}

          {confirmedJustification ? (
            <div className="flex items-start gap-1 rounded bg-card/50 px-1.5 py-1 text-[10px] text-ink-muted">
              <CheckCircle2 className="h-3 w-3 mt-0.5 text-canon-blue shrink-0" />
              <div>
                <div className="font-medium text-ink">Justificado</div>
                <div className="italic">{confirmedJustification}</div>
              </div>
            </div>
          ) : alert.requiresJustification && !alert.hardBlock ? (
            showForm ? (
              <div className="space-y-1">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={2}
                  placeholder="Justificativa clínica para manter a prescrição"
                  className="text-[11px]"
                />
                <div className="flex gap-1">
                  <Button size="sm" className="h-6 text-[10px]" onClick={handleConfirm} disabled={!text.trim()}>
                    Confirmar
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setShowForm(true)}>
                Justificar para prosseguir
              </Button>
            )
          ) : null}
        </div>
      </div>
    </li>
  );
}
