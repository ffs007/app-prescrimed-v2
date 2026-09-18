import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MedicamentoSugerido } from "./lib/types";

interface Props {
  open: boolean;
  med: MedicamentoSugerido;
  onClose: () => void;
  onConfirm: (payload: { principio_ativo: string; dose?: string; via?: string; frequencia?: string; duracao?: string; observacao?: string }) => void;
}

export default function ProtocolMedicationReviewDialog({ open, med, onClose, onConfirm }: Props) {
  const [dose, setDose] = useState([med.dose_sugerida, med.unidade_dose].filter(Boolean).join(" "));
  const [via, setVia] = useState(med.via || "");
  const [freq, setFreq] = useState(med.frequencia || "");
  const [dur, setDur] = useState(med.duracao || "");
  const [obs, setObs] = useState(med.observacao || "");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Revisar medicamento sugerido</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div className="text-sm font-medium">{med.principio_ativo}{med.nome_sugestao ? ` · ${med.nome_sugestao}` : ""}</div>
          {med.indicacao_no_protocolo && <p className="text-xs text-muted-foreground italic">{med.indicacao_no_protocolo}</p>}
          <div><Label>Dose</Label><Input value={dose} onChange={(e) => setDose(e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Via</Label><Input value={via} onChange={(e) => setVia(e.target.value)} /></div>
            <div><Label>Frequência</Label><Input value={freq} onChange={(e) => setFreq(e.target.value)} /></div>
            <div><Label>Duração</Label><Input value={dur} onChange={(e) => setDur(e.target.value)} /></div>
          </div>
          <div><Label>Observação</Label><Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} /></div>
          <p className="text-[11px] text-muted-foreground border-t pt-2">
            Revise dose, via, frequência, duração e alertas de segurança antes de adicionar à prescrição.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onConfirm({ principio_ativo: med.principio_ativo, dose, via, frequencia: freq, duracao: dur, observacao: obs })}>
            Adicionar à prescrição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
