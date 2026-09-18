import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { IVMedication } from "../IVDilutionAdminPage";
import { computeQualityIssues, isIncomplete, isOutdated } from "../lib/ivQualityRules";

type Med = IVMedication & { status_revisao?: string | null };

export default function IVAdminDashboard({ items }: { items: Med[] }) {
  const stats = useMemo(() => {
    const total = items.length;
    const revisados = items.filter((m) => m.status_revisao === "revisado").length;
    const aguardando = items.filter((m) => m.status_revisao === "aguardando_revisao" || m.status_revisao === "rascunho").length;
    const incompletos = items.filter((m) => isIncomplete(m)).length;
    const altos = items.filter((m) => m.nivel_alerta === "alto").length;
    const desatualizados = items.filter((m) => isOutdated(m)).length;
    const inativos = items.filter((m) => m.status_revisao === "inativo").length;
    return { total, revisados, aguardando, incompletos, altos, desatualizados, inativos };
  }, [items]);

  const cards = [
    { label: "Total", value: stats.total, tone: "default" as const },
    { label: "Revisados", value: stats.revisados, tone: "success" as const },
    { label: "Aguardando revisão", value: stats.aguardando, tone: "warn" as const },
    { label: "Dados incompletos", value: stats.incompletos, tone: "danger" as const },
    { label: "Alerta alto", value: stats.altos, tone: "danger" as const },
    { label: "Fonte desatualizada", value: stats.desatualizados, tone: "warn" as const },
    { label: "Inativos", value: stats.inativos, tone: "muted" as const },
  ];

  const toneCls = (t: string) =>
    t === "success" ? "text-emerald-600 dark:text-emerald-400"
    : t === "warn" ? "text-amber-600 dark:text-amber-400"
    : t === "danger" ? "text-destructive"
    : t === "muted" ? "text-muted-foreground"
    : "text-foreground";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {cards.map((c) => (
        <Card key={c.label} className="shadow-none">
          <CardContent className="p-3">
            <div className={`text-2xl font-semibold ${toneCls(c.tone)}`}>{c.value}</div>
            <div className="text-[11px] text-muted-foreground leading-tight">{c.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
