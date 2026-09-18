import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { buildCsvTemplate, parseCsv, type ParsedRow } from "../lib/csvImport";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
};

export default function ImportarMedicamentosDialog({ open, onClose, onImported }: Props) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headerErrors, setHeaderErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const downloadTemplate = () => {
    const blob = new Blob([buildCsvTemplate()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_importacao_medicamentos_geral_prescrimed.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    const parsed = parseCsv(text);
    setRows(parsed.rows);
    setHeaderErrors(parsed.headerErrors);
  };

  const importRows = async () => {
    const valid = rows.filter((r) => r.ok).map((r) => r.data);
    if (valid.length === 0) { toast.error("Nenhuma linha válida"); return; }
    setImporting(true);
    const { error } = await supabase.from("base_medicamentos_geral" as any).insert(valid as any);
    setImporting(false);
    if (error) { toast.error(`Erro: ${error.message}`); return; }
    toast.success(`${valid.length} medicamento(s) importado(s)`);
    setRows([]);
    onImported();
    onClose();
  };

  const validCount = rows.filter((r) => r.ok).length;
  const invalidCount = rows.length - validCount;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar medicamentos (CSV)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" /> Baixar modelo CSV
          </Button>
          <div>
            <label className="flex items-center gap-2 cursor-pointer text-sm border rounded-md p-3 hover:bg-accent">
              <Upload className="h-4 w-4" />
              <span>Selecionar arquivo CSV</span>
              <input type="file" accept=".csv" className="hidden" onChange={onFile} />
            </label>
          </div>

          {headerErrors.length > 0 && (
            <div className="text-sm text-destructive">{headerErrors.join("; ")}</div>
          )}

          {rows.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm">
                <strong>{validCount}</strong> linha(s) válida(s), <strong>{invalidCount}</strong> com erros.
              </p>
              {invalidCount > 0 && (
                <div className="text-xs text-destructive max-h-32 overflow-y-auto space-y-1 border rounded p-2">
                  {rows.filter((r) => !r.ok).slice(0, 20).map((r, i) => (
                    <div key={i}>{r.errors.join("; ")}</div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Linhas com status "revisado" sem fonte serão importadas como "aguardando revisão".
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={validCount === 0 || importing} onClick={importRows}>
            {importing ? "Importando…" : `Importar ${validCount} linha(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
