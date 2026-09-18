import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDocumentoLinks, buildPublicUrl } from "./hooks/useDocumentoLinks";
import { toast } from "@/components/ui/use-toast";
import { Copy, MessageCircle, Mail, ShieldCheck } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  id_documento: string;
  pacienteNome?: string;
}

export default function GenerateLinkDialog({ open, onOpenChange, id_documento, pacienteNome }: Props) {
  const { create } = useDocumentoLinks();
  const [destino, setDestino] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  const handleGenerate = async () => {
    const created = await create({ id_documento });
    if (created) {
      setLink(buildPublicUrl(created.token));
      toast({ title: "Link seguro criado", description: "Expira em 30 dias." });
    }
  };

  const send = async (canal: "whatsapp" | "email" | "copiar") => {
    if (!link) return;
    if (canal !== "copiar" && !confirmed) {
      toast({ title: "Confirme o destinatário antes de enviar.", variant: "destructive" });
      return;
    }
    if (canal === "copiar") {
      await navigator.clipboard.writeText(link);
      toast({ title: "Link copiado" });
    } else if (canal === "whatsapp") {
      const msg = encodeURIComponent(`Olá${pacienteNome ? `, ${pacienteNome}` : ""}. Acesse seu documento: ${link}`);
      window.open(`https://wa.me/?text=${msg}`, "_blank");
    } else if (canal === "email") {
      window.open(`mailto:${encodeURIComponent(destino)}?subject=Seu%20documento&body=${encodeURIComponent(link)}`, "_blank");
    }
  };

  const close = () => {
    setLink(null); setDestino(""); setConfirmed(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : close())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Gerar link para paciente</DialogTitle>
        </DialogHeader>
        {!link ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Cria um link seguro com expiração de 30 dias. O paciente acessa apenas este documento.</p>
            <Button onClick={handleGenerate} className="w-full">Gerar link seguro</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-md bg-muted p-2 text-xs break-all">{link}</div>
            <div>
              <Label className="text-xs">Enviar para (e-mail ou nome)</Label>
              <Input value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="paciente@email.com" />
            </div>
            <label className="flex items-start gap-2 text-xs">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1" />
              <span>Confirmo que o destinatário está correto.</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant="outline" onClick={() => send("copiar")}><Copy className="h-3.5 w-3.5 mr-1" /> Copiar</Button>
              <Button size="sm" variant="outline" onClick={() => send("whatsapp")}><MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp</Button>
              <Button size="sm" variant="outline" onClick={() => send("email")}><Mail className="h-3.5 w-3.5 mr-1" /> E-mail</Button>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={close}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
