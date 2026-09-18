// Etapa 20 — Diálogo para cancelamento de documento com motivo obrigatório.
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cancelDocument } from "./lib/documentSave";

export default function CancelDocumentDialog({
  open, onClose, documentoId, onCancelled,
}: {
  open: boolean;
  onClose: () => void;
  documentoId: string | null;
  onCancelled?: () => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!documentoId) return;
    if (motivo.trim().length < 5) {
      toast.error("Informe um motivo de pelo menos 5 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await cancelDocument(documentoId, motivo.trim());
      toast.success("Documento cancelado.");
      setMotivo("");
      onCancelled?.();
      onClose();
    } catch {
      toast.error("Falha ao cancelar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar documento</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-xs">Motivo do cancelamento</Label>
          <Textarea rows={4} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            O documento será marcado como cancelado, mas permanecerá no histórico.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Voltar</Button>
          <Button variant="destructive" onClick={handle} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Cancelar documento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
