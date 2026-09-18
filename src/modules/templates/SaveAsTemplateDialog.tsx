// Etapa 17 — Salvar prescrição atual como modelo (sanitiza dados do paciente).
import { useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useModelosPrescricao } from "./hooks/useModelosPrescricao";
import { useTemplatesSettings } from "./hooks/useTemplatesSettings";
import { sanitizePrescriptionToTemplate } from "./lib/templateSanitize";
import { logTemplateUse } from "./lib/templateLog";
import type { AnyTemplateItem } from "./lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  itensPrescricao: AnyTemplateItem[];
}

const VIS = ["pessoal","equipe","institucional"] as const;
const CONTEXTS = ["urgencia","enfermaria","ambulatorio","pronto_atendimento","telemedicina","hospitalar","pediatria","obstetricia","geral"] as const;

export default function SaveAsTemplateDialog({ open, onClose, itensPrescricao }: Props) {
  const { save } = useModelosPrescricao();
  const { settings } = useTemplatesSettings();
  const [form, setForm] = useState({
    nome: "", descricao: "", tags: "",
    contexto: "geral", visibilidade: "pessoal",
    manterDoses: true, manterOrientacoes: true,
    removerDadosPaciente: true,
  });

  async function handleSave() {
    if (!form.nome.trim()) { toast.error("Nome obrigatório"); return; }
    if (settings?.permitir_salvar_prescricao_como_modelo === false) {
      toast.error("Salvar como modelo está desativado nas configurações."); return;
    }
    const removePII = form.removerDadosPaciente || (settings?.remover_dados_paciente_auto ?? true);
    const cleaned = removePII
      ? sanitizePrescriptionToTemplate(itensPrescricao)
      : itensPrescricao;
    const meds = cleaned.filter((i) => i.tipo_item === "medicamento");
    const exams = cleaned.filter((i) => i.tipo_item === "exame");
    const orient = form.manterOrientacoes ? cleaned.filter((i) => i.tipo_item === "orientacao") : [];
    const cuidados = cleaned.filter((i) => i.tipo_item === "cuidado_enfermagem");
    if (!form.manterDoses) {
      meds.forEach((m: any) => { m.dose = undefined; m.unidade_dose = undefined; });
    }
    try {
      await save({
        nome_modelo: form.nome,
        descricao: form.descricao,
        tipo_modelo: "prescricao",
        contexto_atendimento: form.contexto as any,
        visibilidade: form.visibilidade as any,
        status_revisao: "rascunho",
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        itens_prescricao: meds as any,
        exames_sugeridos: exams as any,
        orientacoes_paciente: orient as any,
        cuidados_enfermagem: cuidados as any,
      });
      toast.success("Modelo criado a partir da prescrição.");
      void logTemplateUse({ acao: "salvo_de_prescricao", nome_modelo: form.nome });
      onClose();
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Criar modelo a partir desta prescrição</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
          <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
          <div><Label>Tags</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
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
          </div>
          <div className="flex items-center justify-between"><Label>Manter doses</Label>
            <Switch checked={form.manterDoses} onCheckedChange={(v) => setForm({ ...form, manterDoses: v })} /></div>
          <div className="flex items-center justify-between"><Label>Manter orientações</Label>
            <Switch checked={form.manterOrientacoes} onCheckedChange={(v) => setForm({ ...form, manterOrientacoes: v })} /></div>
          <div className="flex items-center justify-between"><Label>Remover dados do paciente</Label>
            <Switch checked={form.removerDadosPaciente} onCheckedChange={(v) => setForm({ ...form, removerDadosPaciente: v })} /></div>
          <p className="text-xs text-muted-foreground">
            Dados pessoais do paciente nunca são gravados no modelo.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar modelo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
