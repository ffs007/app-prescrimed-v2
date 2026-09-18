// Etapa 20 — Diálogo de prévia de documentos antes de imprimir/gerar PDF.
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Printer, Download, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { renderDocument, renderCombined } from "./lib/documentTemplates";
import { printHtml, downloadHtml } from "./lib/pdfPrint";
import { saveGeneratedDocument, logDocumentAction } from "./lib/documentSave";
import type {
  DocumentBundle, PacienteInfo, AssinaturaPerfil, ContextoAtendimento, DocumentosSettings, RenderedDocument,
} from "./lib/types";

export interface DocumentPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  bundles: DocumentBundle[];
  paciente: PacienteInfo;
  perfil: AssinaturaPerfil | null;
  ctx: ContextoAtendimento;
  settings: DocumentosSettings | null;
  id_atendimento?: string | null;
  onSaved?: () => void;
}

export default function DocumentPreviewDialog(props: DocumentPreviewDialogProps) {
  const { open, onClose, bundles, paciente, perfil, ctx, settings } = props;
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const docs = useMemo<RenderedDocument[]>(() => {
    return bundles.map((b) =>
      renderDocument({
        bundle: { ...b, observacoesExtra: observacoes[b.tipo] ?? b.observacoesExtra ?? "" },
        paciente, perfil, ctx, settings,
      }),
    );
  }, [bundles, observacoes, paciente, perfil, ctx, settings]);

  const handlePrintAll = () => {
    if (docs.length === 0) return;
    printHtml(renderCombined(docs));
  };

  const handlePrintOne = (d: RenderedDocument) => printHtml(d.html);
  const handleDownloadOne = (d: RenderedDocument) =>
    downloadHtml(d.html, `${d.tipo}-${Date.now()}.html`);

  const handleSaveAll = async () => {
    if (settings?.exigir_revisao_final_concluida === false || settings?.exigir_revisao_final_concluida === true) {
      // Mantemos a lógica simples: revisão final é controlada externamente; aqui só persistimos.
    }
    setSaving(true);
    try {
      for (const d of docs) {
        const id = await saveGeneratedDocument({
          rendered: d,
          id_atendimento: props.id_atendimento ?? null,
          id_paciente: paciente.id ?? null,
          origem: "atendimento_atual",
        });
        if (id) await logDocumentAction({ id_documento: id, tipo_documento: d.tipo, acao: "gerou_pdf" });
      }
      toast.success("Documentos salvos no histórico.");
      props.onSaved?.();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Falha ao salvar documentos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Prévia dos documentos</DialogTitle>
        </DialogHeader>

        {docs.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            Nenhum documento para prévia.
          </div>
        ) : (
          <Tabs defaultValue={docs[0].tipo} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="flex-wrap h-auto justify-start">
              {docs.map((d) => (
                <TabsTrigger key={d.tipo} value={d.tipo} className="text-xs">
                  {d.titulo}
                </TabsTrigger>
              ))}
            </TabsList>
            {docs.map((d, idx) => (
              <TabsContent key={d.tipo} value={d.tipo} className="flex-1 overflow-hidden flex flex-col gap-3 pt-3">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleDownloadOne(d)}>
                    <Download className="h-4 w-4 mr-1" /> Baixar HTML
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handlePrintOne(d)}>
                    <Printer className="h-4 w-4 mr-1" /> Imprimir / PDF
                  </Button>
                </div>
                <ScrollArea className="flex-1 border rounded-md bg-muted/20">
                  <iframe
                    title={d.titulo}
                    srcDoc={d.html}
                    className="w-full h-[55vh] bg-background"
                  />
                </ScrollArea>
                <div className="space-y-1">
                  <Label className="text-xs">Observações livres do documento</Label>
                  <Textarea
                    rows={2}
                    placeholder="Adicione observações que serão incluídas no documento…"
                    value={observacoes[bundles[idx]?.tipo] ?? bundles[idx]?.observacoesExtra ?? ""}
                    onChange={(e) =>
                      setObservacoes((s) => ({ ...s, [bundles[idx].tipo]: e.target.value }))
                    }
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
          <Button variant="outline" onClick={handlePrintAll} disabled={docs.length === 0}>
            <Printer className="h-4 w-4 mr-1" /> Imprimir tudo
          </Button>
          <Button onClick={handleSaveAll} disabled={saving || docs.length === 0}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar no histórico
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
