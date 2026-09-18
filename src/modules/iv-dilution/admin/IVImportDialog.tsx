import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileSpreadsheet, Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { parseFileToRows, IV_COLUMNS, type ParsedRow } from "../lib/ivCsvParser";
import { logIVAction } from "../lib/ivAuditLog";
import {
  downloadIVTemplateCsv, downloadIVTemplateXlsx,
  validateHeaders, validateRowsValues, type CellIssue,
} from "../lib/ivTemplate";

type Props = { open: boolean; onClose: () => void; onImported: () => void };
type RowAction = "criar" | "atualizar" | "ignorar";

export default function IVImportDialog({ open, onClose, onImported }: Props) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [actions, setActions] = useState<Record<number, RowAction>>({});
  const [existingMap, setExistingMap] = useState<Map<string, string>>(new Map());
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<{ created: number; updated: number; ignored: number; errors: number; aguardando: number } | null>(null);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [issues, setIssues] = useState<CellIssue[]>([]);

  useEffect(() => {
    if (!open) {
      setRows([]); setActions({}); setSummary(null); setHeaderError(null); setIssues([]);
    }
  }, [open]);

  const loadExisting = async () => {
    const { data } = await supabase.from("iv_medications").select("id,principio_ativo,apresentacao");
    const m = new Map<string, string>();
    (data ?? []).forEach((r: any) => {
      const k = `${(r.principio_ativo ?? "").toLowerCase()}|${(r.apresentacao ?? "").toLowerCase()}`;
      m.set(k, r.id);
    });
    setExistingMap(m);
    return m;
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Header validation
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const headerRow = (XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, blankrows: false })[0] ?? []) as string[];
      const hv = validateHeaders(headerRow.map((h) => String(h ?? "").trim()));
      if (!hv.ok) {
        setHeaderError("A planilha não segue o modelo esperado. Baixe o modelo oficial e tente novamente.");
        setRows([]);
        return;
      }
      setHeaderError(null);

      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
      const cellIssues = validateRowsValues(rawRows);
      setIssues(cellIssues);

      const map = await loadExisting();
      const parsed = await parseFileToRows(file);
      setRows(parsed);
      const a: Record<number, RowAction> = {};
      parsed.forEach((r) => {
        if (r.errors.length) { a[r.index] = "ignorar"; return; }
        const k = `${(r.data.principio_ativo ?? "").toLowerCase()}|${(r.data.apresentacao ?? "").toLowerCase()}`;
        a[r.index] = map.has(k) ? "atualizar" : "criar";
      });
      setActions(a);
    } catch (err: any) {
      toast.error("Falha ao ler arquivo: " + (err?.message ?? err));
    } finally {
      e.target.value = "";
    }
  };

  const stats = useMemo(() => {
    let novos = 0, dup = 0, err = 0;
    rows.forEach((r) => {
      if (r.errors.length) err++;
      else {
        const k = `${(r.data.principio_ativo ?? "").toLowerCase()}|${(r.data.apresentacao ?? "").toLowerCase()}`;
        if (existingMap.has(k)) dup++; else novos++;
      }
    });
    return { novos, dup, err };
  }, [rows, existingMap]);

  const handleImport = async () => {
    setImporting(true);
    let created = 0, updated = 0, ignored = 0, errors = 0, aguardando = 0;
    for (const r of rows) {
      const act = actions[r.index] ?? "ignorar";
      if (act === "ignorar" || r.errors.length) { ignored++; continue; }
      const payload: any = { ...r.data, data_atualizacao: r.data.data_atualizacao || new Date().toISOString().slice(0, 10) };
      if (payload.status_revisao === "aguardando_revisao") aguardando++;
      const k = `${(payload.principio_ativo ?? "").toLowerCase()}|${(payload.apresentacao ?? "").toLowerCase()}`;
      const existingId = existingMap.get(k);
      if (act === "atualizar" && existingId) {
        const { error } = await supabase.from("iv_medications").update(payload).eq("id", existingId);
        if (error) errors++; else { updated++; await logIVAction({ id_medicamento: existingId, principio_ativo: payload.principio_ativo, tipo_acao: "importou" }); }
      } else {
        const { data, error } = await supabase.from("iv_medications").insert(payload).select("id").single();
        if (error) errors++; else { created++; await logIVAction({ id_medicamento: (data as any)?.id, principio_ativo: payload.principio_ativo, tipo_acao: "importou" }); }
      }
    }
    setImporting(false);
    setSummary({ created, updated, ignored, errors, aguardando });
    if (created + updated > 0) onImported();
  };

  const canImport = rows.length > 0 && !headerError;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar planilha de medicamentos IV</DialogTitle>
          <DialogDescription>Aceita CSV ou XLSX. Antes de importar, revise a prévia, problemas e ações por linha.</DialogDescription>
        </DialogHeader>

        {!rows.length && !summary && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-1" /> Baixar modelo de importação
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={downloadIVTemplateXlsx}>Baixar XLSX</DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadIVTemplateCsv}>Baixar CSV</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <label className="inline-flex">
                <input type="file" accept=".csv,.xlsx,.xls" onChange={onFile} className="hidden" id="iv-import-file" />
                <Button asChild>
                  <span><FileSpreadsheet className="h-4 w-4 mr-1" /> Selecionar arquivo</span>
                </Button>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              A planilha deve conter exatamente os cabeçalhos do modelo oficial. Booleanos: sim/não, true/false, 1/0. Listas separadas por ponto-e-vírgula.
            </p>
            {headerError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{headerError}</span>
              </div>
            )}
          </div>
        )}

        {rows.length > 0 && !summary && (
          <div className="space-y-3">
            {issues.length > 0 && (
              <div className="border border-amber-500/30 bg-amber-500/5 rounded-md p-3 space-y-2">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4" /> {issues.length} problema(s) encontrado(s)
                </div>
                <div className="max-h-40 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Linha</TableHead>
                        <TableHead>Campo</TableHead>
                        <TableHead>Problema</TableHead>
                        <TableHead>Sugestão</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {issues.slice(0, 100).map((i, k) => (
                        <TableRow key={k}>
                          <TableCell>{i.line}</TableCell>
                          <TableCell className="font-mono text-xs">{i.field}</TableCell>
                          <TableCell className="text-sm">{i.problem}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{i.suggestion}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="secondary">{stats.novos} novos</Badge>
              <Badge variant="secondary">{stats.dup} duplicados</Badge>
              {stats.err > 0 && <Badge variant="destructive">{stats.err} com erro</Badge>}
            </div>
            <div className="overflow-x-auto border rounded-md max-h-[40vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Princípio ativo</TableHead>
                    <TableHead>Apresentação</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const k = `${(r.data.principio_ativo ?? "").toLowerCase()}|${(r.data.apresentacao ?? "").toLowerCase()}`;
                    const dup = existingMap.has(k);
                    return (
                      <TableRow key={r.index}>
                        <TableCell className="text-muted-foreground">{r.index + 2}</TableCell>
                        <TableCell className="font-medium">{r.data.principio_ativo ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{r.data.apresentacao ?? "—"}</TableCell>
                        <TableCell>
                          {r.errors.length ? <Badge variant="destructive">{r.errors[0]}</Badge>
                            : dup ? <Badge variant="secondary">Duplicado</Badge>
                            : <Badge variant="outline">Novo</Badge>}
                        </TableCell>
                        <TableCell>
                          <Select value={actions[r.index] ?? "ignorar"} onValueChange={(v) => setActions((s) => ({ ...s, [r.index]: v as RowAction }))}>
                            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="criar" disabled={r.errors.length > 0}>Criar novo</SelectItem>
                              <SelectItem value="atualizar" disabled={!dup}>Atualizar</SelectItem>
                              <SelectItem value="ignorar">Ignorar</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {summary && (
          <div className="space-y-1 text-sm">
            <p>✓ {summary.created} criados</p>
            <p>↻ {summary.updated} atualizados</p>
            <p>– {summary.ignored} ignorados</p>
            {summary.errors > 0 && <p className="text-destructive">✗ {summary.errors} com erro</p>}
            <p className="text-muted-foreground">{summary.aguardando} registros aguardando revisão</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          {canImport && !summary && (
            <Button onClick={handleImport} disabled={importing}>
              {importing ? "Importando…" : "Importar selecionados"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Re-export so IV_COLUMNS isn't tree-shaken from this file's perspective
void IV_COLUMNS;
