import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onClose: () => void;
  alertMessage: string;
  medication: string;
  onConfirm: (justificativa: string) => void;
}

export default function ClinicalJustificationDialog({ open, onClose, alertMessage, medication, onConfirm }: Props) {
  const [text, setText] = useState("");
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Justificativa clínica</DialogTitle></DialogHeader>
        <div className="space-y-2 text-sm">
          <p className="text-ink">{alertMessage}</p>
          <p className="text-ink-faint text-[12px]">Medicamento: {medication}</p>
          <div>
            <Label htmlFor="just">Justificativa para manter prescrição apesar do alerta</Label>
            <Textarea id="just" value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={1000} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => { onConfirm(text); setText(""); }} disabled={text.trim().length < 5}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
