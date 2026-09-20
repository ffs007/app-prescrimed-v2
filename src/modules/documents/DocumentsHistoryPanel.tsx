// Etapa 20 — Histórico de documentos gerados, com ações de imprimir/baixar/cancelar.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Printer, Download, Ban, Eye, Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";
import type { DocumentoGerado } from "./lib/types";
import { printHtml, downloadHtml } from "./lib/pdfPrint";
import { logDocumentAction } from "./lib/documentSave";
import CancelDocumentDialog from "./CancelDocumentDialog";
import GenerateLinkDialog from "@/modules/patient-link/GenerateLinkDialog";
import { reportError } from "@/lib/reportError";

const statusBadge = (s: string) => {
  switch (s) {
    case "gerado": return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";
    case "impresso": return "bg-sky-500/10 text-sky-700 border-sky-500/30";
    case "enviado": return "bg-violet-500/10 text-violet-700 border-violet-500/30";
    case "cancelado": return "bg-destructive/10 text-destructive border-destructive/30";
    case "substituido": return "bg-amber-500/10 text-amber-700 border-amber-500/30";
    default: return "bg-muted text-muted-foreground";
  }
};

export default function DocumentsHistoryPanel({
  id_paciente, id_atendimento,
}: { id_paciente?: string | null; id_atendimento?: string | null } = {}) {
  const [items, setItems] = useState<DocumentoGerado[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [linkTarget, setLinkTarget] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("documentos_gerados").select("*").order("data_hora", { ascending: false }).limit(200);
    if (id_paciente) q = q.eq("id_paciente", id_paciente);
    if (id_atendimento) q = q.eq("id_atendimento", id_atendimento);
    const { data, error } = await q;
    if (error) toast.error("Falha ao carregar histórico");
    setItems((data ?? []) as DocumentoGerado[]);
    setLoading(false);
  }, [id_paciente, id_atendimento]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((d) =>
    !search || d.titulo?.toLowerCase().includes(search.toLowerCase())
    || d.tipo?.toLowerCase().includes(search.toLowerCase()),
  );

  const reprintFromJson = (d: DocumentoGerado) => {
    // Como não armazenamos o HTML, reimprime a partir do conteudo_resumido como fallback.
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${d.titulo}</title>
      <style>body{font-family:sans-serif;padding:24px;color:#111}h1{font-size:14pt}</style></head>
      <body><h1>${d.titulo}</h1><pre style="white-space:pre-wrap;font-family:inherit">${
        (d.conteudo_resumido ?? "").replace(/</g, "&lt;")
      }</pre></body></html>`;
    printHtml(html);
    logDocumentAction({ id_documento: d.id, tipo_documento: d.tipo, acao: "imprimiu" })
      .catch((error) => reportError("DocumentsHistoryPanel.log", error, "A impressão não foi registrada no log de documentos."));
    supabase.from("documentos_gerados").update({ status: "impresso" }).eq("id", d.id).then(({ error }) => {
      if (error) reportError("DocumentsHistoryPanel.status", error, "Não foi possível atualizar o status do documento.");
      load();
    });
  };

  const downloadJson = (d: DocumentoGerado) => {
    downloadHtml(JSON.stringify(d.conteudo_json, null, 2), `${d.tipo}-${d.id}.json`);
    logDocumentAction({ id_documento: d.id, tipo_documento: d.tipo, acao: "baixou" })
      .catch((error) => reportError("DocumentsHistoryPanel.log", error, "O download não foi registrado no log de documentos."));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de documentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Buscar por título ou tipo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin inline" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Nenhum documento encontrado.
                  </TableCell>
                </TableRow>
              ) : filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-xs">
                    {new Date(d.data_hora).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="font-medium text-sm">{d.titulo}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{d.tipo}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusBadge(d.status)}>{d.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" title="Visualizar resumo"
                        onClick={() => toast.info(d.conteudo_resumido || "Sem resumo")}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Reimprimir"
                        disabled={d.status === "cancelado"}
                        onClick={() => reprintFromJson(d)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Baixar JSON"
                        onClick={() => downloadJson(d)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Gerar link para paciente"
                        disabled={d.status === "cancelado"}
                        onClick={() => setLinkTarget(d.id)}>
                        <Link2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Cancelar"
                        disabled={d.status === "cancelado"}
                        onClick={() => setCancelTarget(d.id)}>
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <CancelDocumentDialog
          open={!!cancelTarget}
          documentoId={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onCancelled={load}
        />
        {linkTarget && (
          <GenerateLinkDialog
            open={!!linkTarget}
            onOpenChange={(v) => !v && setLinkTarget(null)}
            id_documento={linkTarget}
          />
        )}
      </CardContent>
    </Card>
  );
}
