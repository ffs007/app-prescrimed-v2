import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListChecks, FileDown } from "lucide-react";
import { useBlocosClinicos } from "../hooks/useBlocosClinicos";
import { BLOCO_STATUS_LABEL, type BlocoClinico } from "../lib/types";
import { statusVariantClass } from "../lib/blocosCalc";
import BlocoDetailDialog from "./BlocoDetailDialog";
import PendenciasReportDialog from "./PendenciasReportDialog";

export default function ExpansaoBaseMedTab() {
  const { agregados, loading, updateStatusBloco } = useBlocosClinicos();
  const [selected, setSelected] = useState<BlocoClinico | null>(null);
  const [showReport, setShowReport] = useState(false);

  if (loading) return <p className="text-sm text-muted-foreground p-4">Carregando blocos…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Expansão da Base Medicamentosa</h2>
          <p className="text-sm text-muted-foreground">Cadastre medicamentos por blocos clínicos para o lançamento beta.</p>
        </div>
        <Button variant="outline" onClick={() => setShowReport(true)}>
          <FileDown className="w-4 h-4 mr-1" /> Gerar lista de pendências
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {agregados.map((a) => (
          <Card key={a.bloco.slug} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setSelected(a.bloco)}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{a.bloco.nome}</CardTitle>
                <Badge variant="outline" className={statusVariantClass(a.status_calculado)}>
                  {BLOCO_STATUS_LABEL[a.status_calculado]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Medicamentos</span>
                <span className="font-medium">{a.cadastrados}/{a.bloco.total_previsto}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revisados</span>
                <span className="font-medium">{a.revisados}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pendentes</span>
                <span className="font-medium">{a.pendentes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Apresentações</span>
                <span className="font-medium">{a.apresentacoes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vínculos CID/queixa</span>
                <span className="font-medium">{a.vinculos}</span>
              </div>
              {a.checklist_total > 0 && (
                <div className="flex items-center gap-1 pt-1 text-xs text-muted-foreground">
                  <ListChecks className="w-3 h-3" />
                  Checklist: {a.checklist_total - a.checklist_pendentes}/{a.checklist_total}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <BlocoDetailDialog
        bloco={selected}
        onClose={() => setSelected(null)}
        onUpdateStatus={updateStatusBloco}
      />

      <PendenciasReportDialog open={showReport} onClose={() => setShowReport(false)} />
    </div>
  );
}
