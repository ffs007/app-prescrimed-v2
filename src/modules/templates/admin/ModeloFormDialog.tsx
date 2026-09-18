// Etapa 17 — Form básico para modelo de prescrição.
// Foco: estrutura. Edição completa de itens é fora do escopo.
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
import type { ModeloPrescricao } from "../hooks/useModelosPrescricao";
import { useModelosPrescricao } from "../hooks/useModelosPrescricao";

interface Props {
  open: boolean;
  onClose: () => void;
  modelo?: ModeloPrescricao | null;
}

const TYPES = ["prescricao","exames","orientacoes","cuidados_enfermagem","misto","protocolo_rapido","alta","internacao","urgencia","pediatrico"] as const;
const CONTEXTS = ["urgencia","enfermaria","ambulatorio","pronto_atendimento","telemedicina","hospitalar","pediatria","obstetricia","geral"] as const;
const VIS = ["pessoal","equipe","institucional"] as const;
const STATUS = ["rascunho","aguardando_revisao","revisado","precisa_corrigir","inativo"] as const;

export default function ModeloFormDialog({ open, onClose, modelo }: Props) {
  const { save } = useModelosPrescricao();
  const [form, setForm] = useState({
    nome_modelo: "",
    descricao: "",
    tipo_modelo: "prescricao",
    contexto_atendimento: "geral",
    area_clinica: "",
    tags: "",
    criterios_uso: "",
    criterios_nao_uso: "",
    fonte_referencia: "",
    visibilidade: "pessoal",
    status_revisao: "rascunho",
  });

  useEffect(() => {
    if (modelo) {
      setForm({
        nome_modelo: modelo.nome_modelo ?? "",
        descricao: modelo.descricao ?? "",
        tipo_modelo: modelo.tipo_modelo,
        contexto_atendimento: modelo.contexto_atendimento,
        area_clinica: modelo.area_clinica ?? "",
        tags: (modelo.tags ?? []).join(", "),
        criterios_uso: modelo.criterios_uso ?? "",
        criterios_nao_uso: modelo.criterios_nao_uso ?? "",
        fonte_referencia: modelo.fonte_referencia ?? "",
        visibilidade: modelo.visibilidade,
        status_revisao: modelo.status_revisao,
      });
    } else {
      setForm({
        nome_modelo: "", descricao: "", tipo_modelo: "prescricao", contexto_atendimento: "geral",
        area_clinica: "", tags: "", criterios_uso: "", criterios_nao_uso: "",
        fonte_referencia: "", visibilidade: "pessoal", status_revisao: "rascunho",
      });
    }
  }, [modelo, open]);

  async function handleSave() {
    if (!form.nome_modelo.trim()) { toast.error("Nome obrigatório"); return; }
    if (form.visibilidade === "institucional" && form.status_revisao === "revisado" && !form.fonte_referencia.trim()) {
      toast.error("Modelo institucional revisado exige fonte de referência.");
      return;
    }
    try {
      await save({
        id: modelo?.id,
        nome_modelo: form.nome_modelo,
        descricao: form.descricao,
        tipo_modelo: form.tipo_modelo as any,
        contexto_atendimento: form.contexto_atendimento as any,
        area_clinica: form.area_clinica || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        criterios_uso: form.criterios_uso || null,
        criterios_nao_uso: form.criterios_nao_uso || null,
        fonte_referencia: form.fonte_referencia || null,
        visibilidade: form.visibilidade as any,
        status_revisao: form.status_revisao as any,
      });
      toast.success("Modelo salvo");
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{modelo ? "Editar modelo" : "Novo modelo"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome *</Label>
            <Input value={form.nome_modelo} onChange={(e) => setForm({ ...form, nome_modelo: e.target.value })} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo_modelo} onValueChange={(v) => setForm({ ...form, tipo_modelo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contexto</Label>
              <Select value={form.contexto_atendimento} onValueChange={(v) => setForm({ ...form, contexto_atendimento: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTEXTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Área clínica</Label>
            <Input value={form.area_clinica} onChange={(e) => setForm({ ...form, area_clinica: e.target.value })} />
          </div>
          <div>
            <Label>Tags (separadas por vírgula)</Label>
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div>
            <Label>Critérios de uso</Label>
            <Textarea value={form.criterios_uso} onChange={(e) => setForm({ ...form, criterios_uso: e.target.value })} />
          </div>
          <div>
            <Label>Critérios de não uso</Label>
            <Textarea value={form.criterios_nao_uso} onChange={(e) => setForm({ ...form, criterios_nao_uso: e.target.value })} />
          </div>
          <div>
            <Label>Fonte de referência</Label>
            <Input value={form.fonte_referencia} onChange={(e) => setForm({ ...form, fonte_referencia: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Visibilidade</Label>
              <Select value={form.visibilidade} onValueChange={(v) => setForm({ ...form, visibilidade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VIS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status de revisão</Label>
              <Select value={form.status_revisao} onValueChange={(v) => setForm({ ...form, status_revisao: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Itens (medicamentos, exames, orientações, cuidados) serão geridos em uma tela dedicada de edição de itens.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
