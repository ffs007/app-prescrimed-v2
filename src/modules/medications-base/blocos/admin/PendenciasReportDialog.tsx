import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { usePendenciasReport } from "../hooks/usePendenciasReport";
import { downloadFile, gerarCSV, gerarMarkdown, type PendenciaItem } from "../lib/pendenciasReport";

type Props = { open: boolean; onClose: () => void };

export default function PendenciasReportDialog({ open, onClose }: Props) {
  const { gerar } = usePendenciasReport();
  const [items, setItems] = useState<PendenciaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    gerar().then((r) => { setItems(r); setLoading(false); });
  }, [open, gerar]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lista de pendências — Base Medicamentosa</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Gerando relatório…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma pendência identificada.</p>
        ) : (
          <div className="space-y-3 text-sm">
            {Object.entries(items.reduce<Record<string, PendenciaItem[]>>((acc, it) => {
              (acc[it.bloco] ??= []).push(it);
              return acc;
            }, {})).map(([bloco, arr]) => (
              <div key={bloco}>
                <h4 className="font-semibold mb-1">{bloco}</h4>
                <ul className="space-y-1">
                  {arr.map((it, i) => (
                    <li key={i} className="text-muted-foreground">
                      <span className="text-foreground">{it.medicamento}</span> — falta: {it.faltando.join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => downloadFile("pendencias-base.md", gerarMarkdown(items), "text/markdown")} disabled={!items.length}>
            <FileText className="w-4 h-4 mr-1" /> Markdown
          </Button>
          <Button variant="outline" onClick={() => downloadFile("pendencias-base.csv", gerarCSV(items), "text/csv")} disabled={!items.length}>
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
