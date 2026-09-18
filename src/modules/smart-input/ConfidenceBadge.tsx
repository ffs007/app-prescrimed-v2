// Etapa 19 — Badge de confiança.
import { Badge } from "@/components/ui/badge";
import { bandFor, confidenceLabel, confidenceTone } from "./lib/confidenceBands";

const toneClass = (t: string) =>
  t === "ok" ? "bg-success/10 text-success border-success/30"
  : t === "atencao" ? "bg-warning/10 text-warning border-warning/30"
  : t === "alerta" ? "bg-destructive/10 text-destructive border-destructive/30"
  : "bg-muted text-muted-foreground border-border";

export default function ConfidenceBadge({ score }: { score: number }) {
  const band = bandFor(score);
  return (
    <Badge variant="outline" className={`text-[10px] ${toneClass(confidenceTone(band))}`}>
      {confidenceLabel(band)} ({score})
    </Badge>
  );
}
