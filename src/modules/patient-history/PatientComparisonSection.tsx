// Etapa 18 — Seção de comparação dados antigos vs atuais.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ComparisonDiff } from "./lib/types";

interface Props {
  diffs: ComparisonDiff[];
}

const sevTone = (s: ComparisonDiff["severidade"]) =>
  s === "alta"
    ? "bg-destructive/10 text-destructive border-destructive/30"
    : s === "atencao"
    ? "bg-warning/10 text-warning border-warning/30"
    : "bg-muted text-muted-foreground border-border";

export default function PatientComparisonSection({ diffs }: Props) {
  if (diffs.length === 0) {
    return (
      <div className="text-xs text-muted-foreground rounded-md border bg-muted/30 p-3">
        Nenhuma alteração relevante detectada nos dados do paciente desde a prescrição anterior.
      </div>
    );
  }
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Comparação com dados atuais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {diffs.map((d, i) => (
          <div key={i} className="rounded border p-2 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium capitalize">{d.campo.replace(/_/g, " ")}</span>
              <Badge variant="outline" className={`text-[10px] ${sevTone(d.severidade)}`}>
                {d.severidade}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="line-through">{d.valor_anterior ?? "—"}</span>
              <span className="mx-2">→</span>
              <span className="text-foreground">{d.valor_atual ?? "—"}</span>
            </div>
            <p className="text-xs">{d.mensagem}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
