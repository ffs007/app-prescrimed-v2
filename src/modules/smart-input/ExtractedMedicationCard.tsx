// Etapa 19 — Card editável de medicamento extraído pela IA.
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import ConfidenceBadge from "./ConfidenceBadge";
import type { ExtractedMedication } from "./lib/types";

interface Props {
  item: ExtractedMedication;
  onToggle: () => void;
  onEdit: (patch: Partial<ExtractedMedication>) => void;
  onRemove: () => void;
}

export default function ExtractedMedicationCard({ item, onToggle, onEdit, onRemove }: Props) {
  return (
    <div className="rounded border p-3 space-y-2">
      <div className="flex items-start gap-2">
        <Checkbox checked={item.selecionado} onCheckedChange={onToggle} className="mt-1" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{item.principio_ativo ?? "Medicamento"}</span>
            <ConfidenceBadge score={item.confianca} />
            {item.campos_faltantes.map((f, i) => (
              <Badge key={i} variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/30">
                {f.campo}
              </Badge>
            ))}
          </div>
          <div className="text-[11px] text-muted-foreground italic mt-1">"{item.texto_original}"</div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Input value={item.dose ?? ""} placeholder="Dose"
              onChange={(e) => onEdit({ dose: e.target.value })} />
            <Input value={item.unidade ?? ""} placeholder="Unidade"
              onChange={(e) => onEdit({ unidade: e.target.value })} />
            <Input value={item.via ?? ""} placeholder="Via"
              onChange={(e) => onEdit({ via: e.target.value })} />
            <Input value={item.frequencia ?? ""} placeholder="Frequência"
              onChange={(e) => onEdit({ frequencia: e.target.value })} />
            <Input value={item.duracao ?? ""} placeholder="Duração" className="col-span-2"
              onChange={(e) => onEdit({ duracao: e.target.value })} />
            {item.via?.toUpperCase() === "IV" && (
              <>
                <Input value={item.diluente ?? ""} placeholder="Diluente"
                  onChange={(e) => onEdit({ diluente: e.target.value })} />
                <Input value={item.volume_diluicao ?? ""} placeholder="Volume diluição"
                  onChange={(e) => onEdit({ volume_diluicao: e.target.value })} />
                <Input value={item.tempo_infusao ?? ""} placeholder="Tempo infusão" className="col-span-2"
                  onChange={(e) => onEdit({ tempo_infusao: e.target.value })} />
              </>
            )}
          </div>
          {item.alertas.length > 0 && (
            <div className="mt-2 space-y-1">
              {item.alertas.map((a, i) => (
                <div key={i} className="text-[11px] rounded bg-warning/10 text-warning border border-warning/30 px-2 py-1">{a}</div>
              ))}
            </div>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
