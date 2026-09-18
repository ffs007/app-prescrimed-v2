// Etapa 18 — Lista de medicamentos recorrentes do paciente.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Repeat } from "lucide-react";
import { useRecurrentMedications, type RecurrentMed } from "./hooks/usePatientHistory";

interface Props {
  idPaciente: string | null;
  onRepeat: (med: RecurrentMed) => void;
}

export default function RecurrentMedicationsList({ idPaciente, onRepeat }: Props) {
  const items = useRecurrentMedications(idPaciente);

  if (!idPaciente || items.length === 0) {
    return (
      <div className="text-xs text-muted-foreground rounded-md border bg-muted/30 p-3">
        Nenhum medicamento recorrente identificado.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Medicamentos recorrentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.slice(0, 10).map((m) => (
          <div key={m.principio_ativo} className="flex items-center justify-between gap-2 rounded border p-2">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{m.principio_ativo}</div>
              <div className="text-[11px] text-muted-foreground">
                {[m.ultima_dose, m.ultima_via, m.ultima_frequencia].filter(Boolean).join(" • ")}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Última: {new Date(m.ultima_data).toLocaleDateString("pt-BR")}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">{m.count}x</Badge>
              <Button size="sm" variant="outline" onClick={() => onRepeat(m)}>
                <Repeat className="h-3.5 w-3.5 mr-1" /> Repetir
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
