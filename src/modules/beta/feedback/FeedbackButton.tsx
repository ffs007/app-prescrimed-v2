import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

const TIPOS = [
  { v: "erro", l: "Erro" },
  { v: "sugestao", l: "Sugestão" },
  { v: "alerta_incorreto", l: "Alerta incorreto" },
  { v: "medicamento_ausente", l: "Medicamento ausente" },
  { v: "dose_apresentacao_ausente", l: "Dose/apresentação ausente" },
  { v: "problema_pdf", l: "Problema no PDF" },
  { v: "problema_link", l: "Problema no link" },
  { v: "problema_mobile", l: "Problema no mobile" },
  { v: "outro", l: "Outro" },
];

const GRAVIDADES = [
  { v: "baixa", l: "Baixa" },
  { v: "media", l: "Média" },
  { v: "alta", l: "Alta" },
  { v: "critica", l: "Crítica" },
];

export default function FeedbackButton({ tela }: { tela?: string }) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState("erro");
  const [gravidade, setGravidade] = useState("media");
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);

  const enviar = async () => {
    if (!descricao.trim()) return toast.error("Descreva o feedback antes de enviar.");
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("lancamento_feedback" as any).insert({
      usuario_id: userData.user?.id ?? null,
      tipo,
      gravidade,
      tela: tela ?? (typeof window !== "undefined" ? window.location.pathname : null),
      descricao,
      dados_tecnicos: typeof navigator !== "undefined" ? { ua: navigator.userAgent } : null,
    });
    setSaving(false);
    if (error) return toast.error("Não foi possível enviar agora. Tente novamente.");
    toast.success("Feedback enviado. Obrigado!");
    setDescricao("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="fixed bottom-4 right-4 z-40 shadow-md h-9 rounded-full"
          aria-label="Enviar feedback"
        >
          <MessageSquare className="h-4 w-4 mr-1" /> Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar feedback</DialogTitle>
          <DialogDescription>
            Ajude a melhorar o PrescriMed durante o beta. Descreva o que aconteceu ou sua sugestão.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Tipo</label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Gravidade</label>
              <Select value={gravidade} onValueChange={setGravidade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRAVIDADES.map((g) => <SelectItem key={g.v} value={g.v}>{g.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Descrição</label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={5} placeholder="Descreva com detalhes…" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Tela</label>
            <Input value={tela ?? (typeof window !== "undefined" ? window.location.pathname : "")} disabled />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={enviar} disabled={saving}>{saving ? "Enviando…" : "Enviar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
