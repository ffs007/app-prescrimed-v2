import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShieldAlert } from "lucide-react";
import type { ClinicalAlert } from "../services/clinicalSafety";

interface Props {
  alert: ClinicalAlert | null;
  onConfirm: (justification: string) => void;
  onCancel: () => void;
}

const MIN_LEN = 8;

const SafetyOverrideDialog = ({ alert, onConfirm, onCancel }: Props) => {
  const [text, setText] = useState("");
  const open = !!alert;

  useEffect(() => {
    if (!open) setText("");
  }, [open]);

  const valid = text.trim().length >= MIN_LEN;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <DialogTitle>Confirmar prescrição apesar do alerta</DialogTitle>
          <DialogDescription className="text-xs">
            {alert?.title}: {alert?.message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="safety-justification" className="text-xs font-medium text-ink">
            Justificativa clínica <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="safety-justification"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ex: paciente já fez uso prévio sem reação anafilática; benefício supera risco neste caso."
            rows={4}
            className="resize-none bg-paper-alt/40 border-ink-soft text-sm"
          />
          <p className="text-[10px] text-ink-faint">
            Sua justificativa será registrada no log de segurança da sessão. Mínimo {MIN_LEN} caracteres.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onCancel} className="h-9">
            Cancelar
          </Button>
          <Button
            onClick={() => valid && alert && onConfirm(text.trim())}
            disabled={!valid}
            className="h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Confirmar e seguir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SafetyOverrideDialog;
