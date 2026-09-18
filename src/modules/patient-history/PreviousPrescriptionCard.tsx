// Etapa 18 — Card de prescrição anterior (modo compacto).
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Repeat, GitCompare } from "lucide-react";
import type { PrescriptionHistoryRow } from "./lib/types";

interface Props {
  row: PrescriptionHistoryRow;
  onView: () => void;
  onReuse: () => void;
  onCompare: () => void;
}

export default function PreviousPrescriptionCard({ row, onView, onReuse, onCompare }: Props) {
  const itens = (row.itens as unknown as Array<Record<string, unknown>>) ?? [];
  const meds = itens.filter((i) => i.kind === "medicamento").length;
  const exames = itens.filter((i) => i.kind === "exame").length;
  const alertas = ((row.alertas_registrados as unknown as unknown[]) ?? []).length;
  const data = new Date(row.criado_em).toLocaleDateString("pt-BR");

  return (
    <Card className="hover:bg-accent/30 transition">
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-medium">Prescrição — {data}</div>
          <Badge variant="outline" className="text-[10px]">{row.status}</Badge>
        </div>
        <div className="text-xs text-muted-foreground space-y-0.5">
          {row.profissional_nome && <div>Profissional: {row.profissional_nome}</div>}
          {row.contexto_atendimento && <div>Contexto: {row.contexto_atendimento}</div>}
          {row.cid && <div>CID: {row.cid}</div>}
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="secondary" className="text-[10px]">Medicamentos: {meds}</Badge>
            <Badge variant="secondary" className="text-[10px]">Exames: {exames}</Badge>
            {alertas > 0 && (
              <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/30">
                Alertas: {alertas}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={onView}>
            <Eye className="h-3.5 w-3.5 mr-1" /> Ver detalhes
          </Button>
          <Button size="sm" onClick={onReuse}>
            <Repeat className="h-3.5 w-3.5 mr-1" /> Reaproveitar
          </Button>
          <Button size="sm" variant="ghost" onClick={onCompare}>
            <GitCompare className="h-3.5 w-3.5 mr-1" /> Comparar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
