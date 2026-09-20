import { useState } from "react";
import { Printer, Share2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Props {
  /** Texto plano do documento (para Web Share / cópia). */
  documentText: string;
  /** Título sugerido para o share sheet. */
  shareTitle: string;
  /** Disparar fluxo de impressão / PDF (delegado ao pai — abre o PrintArea). */
  onPrint: () => void;
  /** Documento está liberado para emitir (gate da segurança clínica). */
  canEmit: boolean;
  /** Tooltip exibido quando bloqueado. */
  blockedReason?: string;
}

/**
 * Ações finais de emissão — botões padronizados para Imprimir/PDF e Compartilhar.
 * A assinatura digital não é oferecida (sem ICP-Brasil). Compartilhar usa Web Share API quando
 * disponível (mobile) e cai pra clipboard no desktop.
 */
const EmissionActions = ({ documentText, shareTitle, onPrint, canEmit, blockedReason }: Props) => {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    if (!canEmit) {
      toast.error("Emissão bloqueada", { description: blockedReason });
      return;
    }
    onPrint();
  };

  const handleShare = async () => {
    if (!canEmit) {
      toast.error("Emissão bloqueada", { description: blockedReason });
      return;
    }
    // 1) Web Share API (mobile e alguns desktops)
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: shareTitle, text: documentText });
        return;
      } catch (err) {
        // Usuário cancelou — não é erro
        if ((err as DOMException)?.name === "AbortError") return;
        // Cai pro fallback abaixo
      }
    }
    // 2) Fallback: copiar pra clipboard
    try {
      await navigator.clipboard.writeText(documentText);
      setCopied(true);
      toast.success("Documento copiado", {
        description: "Cole onde quiser compartilhar.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível compartilhar nem copiar.");
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
      <Button
        onClick={handlePrint}
        className="h-11 flex-1 gap-2 bg-canon-blue text-primary-foreground shadow-paper hover:bg-canon-blue/90 disabled:bg-canon-blue/40"
        disabled={!canEmit}
      >
        <Printer className="h-4 w-4" />
        Imprimir / PDF
      </Button>
      <Button
        onClick={handleShare}
        variant="outline"
        className="h-11 flex-1 gap-2 border-ink-soft"
        disabled={!canEmit}
      >
        {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        Compartilhar
      </Button>
    </div>
  );
};

export default EmissionActions;
