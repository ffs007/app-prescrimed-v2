// Etapa 19 — Diálogo principal de entrada inteligente.
// Permite escolher entre texto livre e foto/imagem.
import { useState, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Image as ImageIcon, FileText } from "lucide-react";
import { toast } from "sonner";
import SmartInputBanner from "./SmartInputBanner";
import SmartInputReviewDialog from "./SmartInputReviewDialog";
import { useSmartInputExtract } from "./hooks/useSmartInputExtract";
import { useSmartInputSettings } from "./hooks/useSmartInputSettings";
import { useImageCapture } from "./hooks/useImageCapture";
import type { EntradaTipo, ExtractedItem, SmartInputResult } from "./lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipoEntrada: EntradaTipo;
  contexto?: string;
  onConfirm: (selecionados: ExtractedItem[]) => void;
}

export default function SmartInputDialog({
  open, onOpenChange, tipoEntrada, contexto, onConfirm,
}: Props) {
  const { settings } = useSmartInputSettings();
  const { extract, loading } = useSmartInputExtract();
  const image = useImageCapture();
  const [text, setText] = useState("");
  const [result, setResult] = useState<SmartInputResult | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setText("");
    image.reset();
    setResult(null);
  };

  const handleExtract = async (kind: "text" | "image", payload: string) => {
    const r = await extract({ kind, payload, contexto, tipo_entrada: tipoEntrada });
    if (!r) {
      toast.error("Falha ao processar entrada");
      return;
    }
    if (r.itens.length === 0) {
      toast.warning("Nenhum item identificado");
      return;
    }
    setResult(r);
    setReviewOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Entrada inteligente</DialogTitle>
          </DialogHeader>

          <SmartInputBanner kind="default" />

          <Tabs defaultValue="text" className="mt-2">
            <TabsList>
              {settings?.usar_texto_livre !== false && (
                <TabsTrigger value="text"><FileText className="h-3.5 w-3.5 mr-1" />Texto</TabsTrigger>
              )}
              {settings?.usar_foto !== false && (
                <TabsTrigger value="image"><ImageIcon className="h-3.5 w-3.5 mr-1" />Foto</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="text" className="space-y-2 pt-2">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Cole ou digite o texto da prescrição, orientação, exames, etc."
                rows={6}
              />
              <div className="flex justify-end">
                <Button disabled={!text.trim() || loading} onClick={() => handleExtract("text", text)}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Estruturar com IA
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="image" className="space-y-2 pt-2">
              <SmartInputBanner kind="image" />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) image.handleFile(f);
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => fileRef.current?.click()}>
                  Selecionar imagem
                </Button>
                {image.dataUrl && (
                  <Button variant="ghost" onClick={image.reset}>Remover</Button>
                )}
              </div>
              {image.error && <p className="text-xs text-destructive">{image.error}</p>}
              {image.dataUrl && (
                <div className="space-y-2">
                  <img src={image.dataUrl} alt="Imagem para extração" className="max-h-60 rounded border" />
                  <div className="flex justify-end">
                    <Button
                      disabled={loading}
                      onClick={() => image.dataUrl && handleExtract("image", image.dataUrl)}
                    >
                      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Extrair com IA
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SmartInputReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        result={result}
        settings={settings}
        onConfirm={(itens) => {
          onConfirm(itens);
          onOpenChange(false);
          reset();
        }}
      />
    </>
  );
}
