// Etapa 17 — Form básico para kit rápido.
import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { KitRapido } from "../hooks/useKitsRapidos";
import { useKitsRapidos } from "../hooks/useKitsRapidos";

interface Props { open: boolean; onClose: () => void; kit?: KitRapido | null; }

const CONTEXTS = ["urgencia","enfermaria","ambulatorio","pronto_atendimento","telemedicina","hospitalar","pediatria","obstetricia","geral"] as const;
const VIS = ["pessoal","equipe","institucional"] as const;

export default function KitFormDialog({ open, onClose, kit }: Props) {
  const { save } = useKitsRapidos();
  const [form, setForm] = useState({ nome: "", categoria: "", contexto: "urgencia", visibilidade: "pessoal", fonte: "" });
  useEffect(() => {
    if (kit) setForm({
      nome: kit.nome, categoria: kit.categoria ?? "", contexto: kit.contexto,
      visibilidade: kit.visibilidade, fonte: kit.fonte ?? "",
    });
    else setForm({ nome: "", categoria: "", contexto: "urgencia", visibilidade: "pessoal", fonte: "" });
  }, [kit, open]);

  async function handleSave() {
    if (!form.nome.trim()) { toast.error("Nome obrigatório"); return; }
    try {
      await save({
        id: kit?.id,
        nome: form.nome,
        categoria: form.categoria || null,
        contexto: form.contexto as any,
        visibilidade: form.visibilidade as any,
        fonte: form.fonte || null,
      });
      toast.success("Kit salvo");
      onClose();
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{kit ? "Editar kit" : "Novo kit rápido"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
          <div><Label>Categoria (ex.: dor, febre, hidratação)</Label><Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} /></div>
          <div>
            <Label>Contexto</Label>
            <Select value={form.contexto} onValueChange={(v) => setForm({ ...form, contexto: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CONTEXTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Visibilidade</Label>
            <Select value={form.visibilidade} onValueChange={(v) => setForm({ ...form, visibilidade: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{VIS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Fonte</Label><Input value={form.fonte} onChange={(e) => setForm({ ...form, fonte: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
