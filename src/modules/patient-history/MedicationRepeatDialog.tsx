// Etapa 18 — Mini revisão para repetir medicamento isolado.
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RecurrentMed } from "./hooks/usePatientHistory";
import type { ReuseItem } from "./lib/types";

interface Props {
  med: RecurrentMed | null;
  onClose: () => void;
  onAdd: (item: ReuseItem) => void;
}

export default function MedicationRepeatDialog({ med, onClose, onAdd }: Props) {
  const [dose, setDose] = useState(med?.ultima_dose ?? "");
  const [via, setVia] = useState(med?.ultima_via ?? "");
  const [freq, setFreq] = useState(med?.ultima_frequencia ?? "");
  const [obs, setObs] = useState("");

  if (!med) return null;

  const handleAdd = () => {
    onAdd({
      id: `repeat_${Date.now()}`,
      kind: "medicamento",
      titulo: med.principio_ativo,
      principio_ativo: med.principio_ativo,
      dose, via, frequencia: freq, observacoes: obs,
      selecionado: true,
      editado: true,
      status: "seguro_para_revisao",
      alertas_atuais: [],
    });
    onClose();
  };

  return (
    <Dialog open={!!med} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Repetir {med.principio_ativo}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Esta medicação aparece {med.count}x no histórico do paciente.
            Revise dose, via e frequência antes de adicionar.
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="Dose" />
            <Input value={via} onChange={(e) => setVia(e.target.value)} placeholder="Via" />
            <Input value={freq} onChange={(e) => setFreq(e.target.value)} placeholder="Frequência" className="col-span-2" />
            <Textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Observações" className="col-span-2" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleAdd}>Adicionar à prescrição</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
