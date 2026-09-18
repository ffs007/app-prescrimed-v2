// Etapa 18 — CRUD de medicações de uso contínuo do paciente.
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Check, X } from "lucide-react";
import { useContinuousMedications } from "./hooks/usePatientHistory";
import ContinuousMedFormDialog from "./ContinuousMedFormDialog";

interface Props {
  idPaciente: string | null;
}

export default function ContinuousMedicationsCard({ idPaciente }: Props) {
  const { rows, add, update, remove } = useContinuousMedications(idPaciente);
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Medicações em uso</CardTitle>
        <Button size="sm" variant="outline" disabled={!idPaciente} onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 && (
          <div className="text-xs text-muted-foreground">Nenhuma medicação em uso registrada.</div>
        )}
        {rows.map((m) => (
          <div key={m.id} className="rounded border p-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium">{m.principio_ativo}</div>
                <div className="text-[11px] text-muted-foreground">
                  {[m.dose, m.via, m.frequencia].filter(Boolean).join(" • ") || "—"}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
                  {m.confirmado
                    ? <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/30">Confirmado</Badge>
                    : <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/30">Não confirmado</Badge>}
                  {m.paciente_refere_uso && (
                    <Badge variant="secondary" className="text-[10px]">Paciente refere</Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Button size="sm" variant="ghost"
                  onClick={() => update(m.id, { confirmado: !m.confirmado })}>
                  {m.confirmado ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>

      {open && idPaciente && (
        <ContinuousMedFormDialog
          idPaciente={idPaciente}
          onClose={() => setOpen(false)}
          onSave={async (payload) => { await add(payload); setOpen(false); }}
        />
      )}
    </Card>
  );
}
