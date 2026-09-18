// Etapa 17 — Form básico para conjunto rápido.
import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { ConjuntoRapido } from "../hooks/useConjuntosRapidos";
import { useConjuntosRapidos } from "../hooks/useConjuntosRapidos";

interface Props { open: boolean; onClose: () => void; conjunto?: ConjuntoRapido | null; }

const CATS = ["medicamentos","exames","orientacoes","cuidados","misto"] as const;
const CONTEXTS = ["urgencia","enfermaria","ambulatorio","pronto_atendimento","telemedicina","hospitalar","pediatria","obstetricia","geral"] as const;
const VIS = ["pessoal","equipe","institucional"] as const;

export default function ConjuntoFormDialog({ open, onClose, conjunto }: Props) {
  const { save } = useConjuntosRapidos();
  const [form, setForm] = useState({
    nome_conjunto: "", descricao: "", categoria: "misto",
    contexto_atendimento: "geral", visibilidade: "pessoal", fonte_referencia: "",
  });
  useEffect(() => {
    if (conjunto) {
      setForm({
        nome_conjunto: conjunto.nome_conjunto,
        descricao: conjunto.descricao ?? "",
        categoria: conjunto.categoria,
        contexto_atendimento: conjunto.contexto_atendimento,
        visibilidade: conjunto.visibilidade,
        fonte_referencia: conjunto.fonte_referencia ?? "",
      });
    } else {
      setForm({ nome_conjunto: "", descricao: "", categoria: "misto", contexto_atendimento: "geral", visibilidade: "pessoal", fonte_referencia: "" });
    }
  }, [conjunto, open]);

  async function handleSave() {
    if (!form.nome_conjunto.trim()) { toast.error("Nome obrigatório"); return; }
    try {
      await save({
        id: conjunto?.id,
        nome_conjunto: form.nome_conjunto,
        descricao: form.descricao,
        categoria: form.categoria as any,
        contexto_atendimento: form.contexto_atendimento as any,
        visibilidade: form.visibilidade as any,
        fonte_referencia: form.fonte_referencia || null,
      });
      toast.success("Conjunto salvo");
      onClose();
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{conjunto ? "Editar conjunto" : "Novo conjunto rápido"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={form.nome_conjunto} onChange={(e) => setForm({ ...form, nome_conjunto: e.target.value })} /></div>
          <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contexto</Label>
              <Select value={form.contexto_atendimento} onValueChange={(v) => setForm({ ...form, contexto_atendimento: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONTEXTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Visibilidade</Label>
            <Select value={form.visibilidade} onValueChange={(v) => setForm({ ...form, visibilidade: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{VIS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Fonte de referência</Label><Input value={form.fonte_referencia} onChange={(e) => setForm({ ...form, fonte_referencia: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
