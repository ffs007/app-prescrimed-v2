import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBlocosClinicos } from "./hooks/useBlocosClinicos";
import { BLOCO_STATUS_LABEL } from "./lib/types";
import { statusVariantClass } from "./lib/blocosCalc";

export default function ProntidaoBlocosCard() {
  const { agregados, loading } = useBlocosClinicos();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Prontidão da Base por Bloco</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {agregados.map((a) => (
              <div key={a.bloco.slug} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{a.bloco.nome}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {a.cadastrados}/{a.bloco.total_previsto}
                  </span>
                </div>
                <Badge variant="outline" className={statusVariantClass(a.status_calculado)}>
                  {BLOCO_STATUS_LABEL[a.status_calculado]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
