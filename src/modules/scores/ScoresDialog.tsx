import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ScoresHub from "./ScoresHub";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atendimentoId: string;
  ageInYears: number | null;
  onUseResult: (title: string, text: string) => void;
}

export default function ScoresDialog({ open, onOpenChange, atendimentoId, ageInYears, onUseResult }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Escores clínicos</DialogTitle>
          <DialogDescription>
            Calculados e auditados no servidor. O resultado entra no documento como item da receita.
          </DialogDescription>
        </DialogHeader>
        <ScoresHub
          atendimentoId={atendimentoId}
          defaultAge={ageInYears !== null ? Math.floor(ageInYears) : null}
          onUseResult={(title, text) => {
            onUseResult(title, text);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
