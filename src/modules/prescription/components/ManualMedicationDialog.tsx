/**
 * ManualMedicationDialog — formulário rápido para o médico inserir
 * um medicamento que não está nas sugestões.
 *
 * Filosofia: leve, clínico, sem poluição. Campos mínimos suficientes para
 * compor uma linha de receita coerente. O resultado é um SelectedMed pronto
 * para entrar na lista da prescrição em construção.
 */
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Pill } from "lucide-react";

export interface ManualMedicationData {
  name: string;
  presentation: string;
  dose: string;
  posology: string;
  duration: string;
  notes: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: ManualMedicationData) => void;
}

const EMPTY: ManualMedicationData = {
  name: "",
  presentation: "",
  dose: "",
  posology: "",
  duration: "",
  notes: "",
};

const ManualMedicationDialog = ({ open, onOpenChange, onConfirm }: Props) => {
  const [data, setData] = useState<ManualMedicationData>(EMPTY);

  // Reseta ao abrir
  useEffect(() => {
    if (open) setData(EMPTY);
  }, [open]);

  const set = <K extends keyof ManualMedicationData>(key: K, value: ManualMedicationData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const canSubmit = data.name.trim().length > 0 && data.posology.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onConfirm(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-lg text-ink">
            <Pill className="h-4 w-4 text-canon-blue" />
            Adicionar medicamento manualmente
          </DialogTitle>
          <DialogDescription className="text-xs text-ink-muted">
            Preencha apenas o necessário. Nome e posologia são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="manual-name" className="text-[11px] font-medium uppercase tracking-editorial text-ink-faint">
              Medicamento *
            </Label>
            <Input
              id="manual-name"
              autoFocus
              placeholder="ex: Losartana, Amoxicilina"
              value={data.name}
              onChange={(e) => set("name", e.target.value)}
              className="h-10 bg-paper-alt/40 border-ink-soft"
            />
          </div>

          {/* Apresentação + Dose lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="manual-presentation" className="text-[11px] font-medium uppercase tracking-editorial text-ink-faint">
                Apresentação
              </Label>
              <Input
                id="manual-presentation"
                placeholder="50 mg comp."
                value={data.presentation}
                onChange={(e) => set("presentation", e.target.value)}
                className="h-10 bg-paper-alt/40 border-ink-soft"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manual-dose" className="text-[11px] font-medium uppercase tracking-editorial text-ink-faint">
                Dose
              </Label>
              <Input
                id="manual-dose"
                placeholder="1 comp."
                value={data.dose}
                onChange={(e) => set("dose", e.target.value)}
                className="h-10 bg-paper-alt/40 border-ink-soft"
              />
            </div>
          </div>

          {/* Posologia */}
          <div className="space-y-1.5">
            <Label htmlFor="manual-posology" className="text-[11px] font-medium uppercase tracking-editorial text-ink-faint">
              Posologia *
            </Label>
            <Input
              id="manual-posology"
              placeholder="VO 1x ao dia · VO de 8/8h"
              value={data.posology}
              onChange={(e) => set("posology", e.target.value)}
              className="h-10 bg-paper-alt/40 border-ink-soft"
            />
          </div>

          {/* Duração */}
          <div className="space-y-1.5">
            <Label htmlFor="manual-duration" className="text-[11px] font-medium uppercase tracking-editorial text-ink-faint">
              Duração
            </Label>
            <Input
              id="manual-duration"
              placeholder="Por 7 dias · Uso contínuo"
              value={data.duration}
              onChange={(e) => set("duration", e.target.value)}
              className="h-10 bg-paper-alt/40 border-ink-soft"
            />
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label htmlFor="manual-notes" className="text-[11px] font-medium uppercase tracking-editorial text-ink-faint">
              Observações
            </Label>
            <Textarea
              id="manual-notes"
              placeholder="Tomar com alimento, evitar dirigir, etc."
              value={data.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className="bg-paper-alt/40 border-ink-soft resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-9 text-ink-muted"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-9 bg-canon-blue text-primary-foreground hover:bg-canon-blue/90"
          >
            Adicionar à receita
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Compõe o texto final da linha de receita a partir dos campos do formulário.
 * Mantém formato compatível com SelectedMed.text usado no template impresso.
 */
export const buildManualMedText = (data: ManualMedicationData): string => {
  const parts: string[] = [];
  const head = [data.name.trim(), data.presentation.trim()].filter(Boolean).join(" — ");
  if (head) parts.push(head);
  const body = [data.dose.trim(), data.posology.trim()].filter(Boolean).join(" ");
  if (body) parts.push(body);
  if (data.duration.trim()) parts.push(data.duration.trim());
  if (data.notes.trim()) parts.push(`Obs: ${data.notes.trim()}`);
  return parts.join("\n");
};

export default ManualMedicationDialog;
