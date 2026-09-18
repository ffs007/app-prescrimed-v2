import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useTestesClinicosV2 } from "./hooks/useTestesClinicosV2";
import { PRONTIDAO_LABEL, PRONTIDAO_TONE, STATUS_LABEL, STATUS_TONE, calcularProntidao } from "./lib/status";

export default function ProntidaoBetaTestesResumo() {
  const { items, config, loading } = useTestesClinicosV2();
  if (loading) return null;
  if (config && !config.mostrar_resumo_prontidao_beta) return null;

  const prontidao = calcularProntidao(items);
  const criticosReprovados = items.filter((i) => i.critico && i.status_teste === "reprovado");
  const criticosPendentes = items.filter((i) => i.critico && ["pendente", "precisa_ajuste"].includes(i.status_teste));
  const bloqueado = config?.exigir_criticos_aprovados && criticosReprovados.length > 0;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-semibold">Testes Clínicos</span>
          </div>
          <Badge variant="outline" className={PRONTIDAO_TONE[prontidao]}>
            {PRONTIDAO_LABEL[prontidao]}
          </Badge>
        </div>

        {bloqueado && (
          <div className="flex items-start gap-2 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5" />
            <span>Não pronto para beta — há testes críticos reprovados.</span>
          </div>
        )}

        {(criticosReprovados.length > 0 || criticosPendentes.length > 0) && (
          <div className="text-xs space-y-1">
            <div className="text-muted-foreground">Testes críticos que exigem atenção:</div>
            {[...criticosReprovados, ...criticosPendentes].map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2">
                <span>{t.codigo} — {t.nome_teste}</span>
                <Badge variant="outline" className={STATUS_TONE[t.status_teste]}>
                  {STATUS_LABEL[t.status_teste]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
