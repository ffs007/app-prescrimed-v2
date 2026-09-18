// Modal de IA assistiva para qualquer tipo de documento clínico.
// Gera rascunho, revisa texto, escreve justificativa de auditoria e sugere CIDs.
// Nada é aplicado sem o médico clicar em "Usar este texto".
import { useState } from "react";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAIAssist } from "./hooks/useAIAssist";
import { AI_DISCLAIMER } from "./lib/types";

export const DOC_TYPES = [
  "Prescrição",
  "Encaminhamento",
  "AIH",
  "Notificação compulsória",
  "Laudo",
  "Relatório",
  "Atestado",
];

type Acao = "rascunho" | "revisar" | "justificativa" | "cids";

const ACOES: Array<{ id: Acao; label: string; hint: string }> = [
  { id: "rascunho", label: "Gerar rascunho", hint: "A partir de anotações breves" },
  { id: "revisar", label: "Revisar texto", hint: "Clareza, coerência e completude" },
  { id: "justificativa", label: "Justificativa", hint: "Fundamentação para auditoria" },
  { id: "cids", label: "CIDs e termos", hint: "Sugestões com base no texto" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tipo do documento em edição. */
  tipoDocumento?: string;
  /** Texto atual do documento, quando houver. */
  textoInicial?: string;
  /** Recebe o texto aprovado pelo médico. Sem isso, o modal só permite copiar. */
  onApply?: (texto: string) => void;
}

export default function DocumentAIDialog({
  open, onOpenChange, tipoDocumento, textoInicial, onApply,
}: Props) {
  const { documento, loading, error } = useAIAssist();
  const [tipo, setTipo] = useState(tipoDocumento ?? DOC_TYPES[0]);
  const [acao, setAcao] = useState<Acao>(textoInicial ? "revisar" : "rascunho");
  const [entrada, setEntrada] = useState(textoInicial ?? "");
  const [saida, setSaida] = useState("");
  const [copiado, setCopiado] = useState(false);

  const run = async () => {
    if (!entrada.trim()) {
      toast.error("Escreva as anotações ou cole o texto do documento.");
      return;
    }
    const res = await documento({ tipo_documento: tipo, acao, texto: entrada });
    if (res?.texto) setSaida(res.texto);
  };

  const copiar = async () => {
    await navigator.clipboard.writeText(saida);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> IA assistiva do documento
          </DialogTitle>
          <DialogDescription>{AI_DISCLAIMER}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Tipo de documento</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">O que fazer</Label>
            <Select value={acao} onValueChange={(v) => setAcao(v as Acao)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACOES.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.label} — {a.hint}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-xs">Anotações ou texto atual</Label>
          <Textarea
            className="mt-1 min-h-[120px] text-sm"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            placeholder="Ex.: homem 62a, dor torácica há 2h, HAS e DM2, ECG sem supra, troponina pendente..."
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Evite escrever nome completo, CPF ou outros dados que identifiquem o paciente.
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
            {error}
          </div>
        )}

        {saida && (
          <div>
            <Label className="text-xs">Resultado (revise antes de usar)</Label>
            <Textarea
              className="mt-1 min-h-[180px] font-mono text-xs"
              value={saida}
              onChange={(e) => setSaida(e.target.value)}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
          {saida && (
            <Button variant="outline" size="sm" onClick={copiar}>
              {copiado ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
              Copiar
            </Button>
          )}
          {saida && onApply && (
            <Button
              size="sm"
              onClick={() => {
                onApply(saida);
                onOpenChange(false);
              }}
            >
              Usar este texto
            </Button>
          )}
          <Button size="sm" variant={saida ? "secondary" : "default"} onClick={run} disabled={loading}>
            {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
            {saida ? "Gerar de novo" : "Gerar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
