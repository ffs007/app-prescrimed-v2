/**
 * Alerta de notificação compulsória detectada a partir da patologia do
 * atendimento. Sugere abrir a ficha correspondente e lembra o prazo legal.
 */
import { Link } from "react-router-dom";
import { AlertTriangle, Clock, Siren } from "lucide-react";
import { detectAgravos, prazoLabel } from "./lib/notificationSpec";

interface Props {
  /** Texto clínico (patologia, síndrome, CID descrito). */
  clinicalText: string;
}

export default function NotificationSuggestionAlert({ clinicalText }: Props) {
  const agravos = detectAgravos(clinicalText);
  if (agravos.length === 0) return null;

  return (
    <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
      <div className="flex items-center gap-2 text-[12px] font-semibold text-destructive">
        <Siren className="h-4 w-4" /> Notificação compulsória envolvida
      </div>
      {agravos.map((a) => (
        <div key={a.id} className="text-[12px] leading-relaxed text-ink">
          <div className="flex flex-wrap items-center gap-x-2">
            <strong className="font-medium">{a.nome}</strong>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" /> {prazoLabel(a)}
            </span>
            <Link
              to={`/app/notificacoes?agravo=${a.id}`}
              className="underline underline-offset-2 hover:no-underline"
            >
              abrir ficha
            </Link>
          </div>
          {a.alertas?.map((al) => (
            <p key={al} className="mt-0.5 flex gap-1.5 text-[11px] text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
              {al}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}
