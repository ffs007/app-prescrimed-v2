// Etapa 18 — Form para adicionar medicação de uso contínuo.
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type { ContinuousMedicationRow } from "./lib/types";

interface Props {
  idPaciente: string;
  onClose: () => void;
  onSave: (
    payload: Omit<ContinuousMedicationRow, "id" | "criado_em" | "atualizado_em" | "criado_por">,
  ) => Promise<void>;
}

export default function ContinuousMedFormDialog({ idPaciente, onClose, onSave }: Props) {
  const [pa, setPa] = useState("");
  const [nome, setNome] = useState("");
  const [dose, setDose] = useState("");
  const [via, setVia] = useState("");
  const [freq, setFreq] = useState("");
  const [refere, setRefere] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [obs, setObs] = useState("");

  const handleSave = async () => {
    if (!pa.trim()) return;
    await onSave({
      id_paciente: idPaciente,
      principio_ativo: pa.trim(),
      nome_medicamento: nome || null,
      dose: dose || null,
      via: via || null,
      frequencia: freq || null,
      inicio: null,
      prescrito_por: null,
      paciente_refere_uso: refere,
      confirmado,
      status: "ativo",
      observacoes: obs || null,
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova medicação em uso</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <Label className="text-xs">Princípio ativo *</Label>
            <Input value={pa} onChange={(e) => setPa(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Nome comercial</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Dose</Label>
            <Input value={dose} onChange={(e) => setDose(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Via</Label>
            <Input value={via} onChange={(e) => setVia(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Frequência</Label>
            <Input value={freq} onChange={(e) => setFreq(e.target.value)} />
          </div>
          <div className="col-span-2 flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs">
              <Checkbox checked={refere} onCheckedChange={(v) => setRefere(!!v)} />
              Paciente refere uso
            </label>
            <label className="flex items-center gap-2 text-xs">
              <Checkbox checked={confirmado} onCheckedChange={(v) => setConfirmado(!!v)} />
              Confirmado
            </label>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Observações</Label>
            <Textarea value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!pa.trim()}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
