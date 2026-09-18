import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const TIPOS = [
  "farmacocinetica","farmacodinamica","duplicidade_terapeutica","qt_longo",
  "nefrotoxicidade_somada","hepatotoxicidade_somada","risco_hemorragico",
  "depressao_respiratoria","sedacao_somada","serotoninergico","hipercalemia",
  "hipocalemia","hipotensao","bradicardia","hipertensao","glicemia","outro",
];
const GRAV = ["leve","moderada","grave","contraindicada"];
const NIVEL = ["informativo","atencao","alto","critico"];
const STATUS = ["rascunho","aguardando_revisao","revisado","precisa_corrigir","inativo"];

interface Props {
  open: boolean;
  initial?: Record<string, unknown> | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function InteractionFormDialog({ open, initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Record<string, unknown>>(initial || {
    tipo_interacao: "farmacodinamica", gravidade: "moderada", nivel_alerta: "atencao",
    status_revisao: "aguardando_revisao", exige_justificativa: false, bloqueio_absoluto: false,
  });

  useEffect(() => { if (initial) setForm(initial); }, [initial]);

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  async function save() {
    const f = form as Record<string, unknown>;
    if (!f.principio_ativo_a && !f.classe_a) { toast.error("Informe princípio ativo A ou classe A"); return; }
    if (!f.principio_ativo_b && !f.classe_b) { toast.error("Informe princípio ativo B ou classe B"); return; }
    if (f.status_revisao === "revisado") {
      if (!f.fonte_referencia) { toast.error("Interação revisada exige fonte"); return; }
      if (f.gravidade === "contraindicada" && !f.mensagem_medico) { toast.error("Interação crítica exige mensagem ao médico"); return; }
      if (f.bloqueio_absoluto && !f.conduta_sugerida) { toast.error("Bloqueio absoluto exige conduta sugerida"); return; }
    }
    const { id, ...payload } = f as { id?: string };
    const { error } = id
      ? await (supabase.from("base_interacoes_medicamentosas") as any).update(payload).eq("id", id)
      : await (supabase.from("base_interacoes_medicamentosas") as any).insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Interação salva");
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{(form as { id?: string }).id ? "Editar interação" : "Nova interação"}</DialogTitle>
        </DialogHeader>

        <section className="space-y-2">
          <h4 className="text-xs font-semibold text-ink">A. Medicamentos envolvidos</h4>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Princípio ativo A</Label><Input value={(form.principio_ativo_a as string) || ""} onChange={(e) => set("principio_ativo_a", e.target.value)} /></div>
            <div><Label>Princípio ativo B</Label><Input value={(form.principio_ativo_b as string) || ""} onChange={(e) => set("principio_ativo_b", e.target.value)} /></div>
            <div><Label>Nome comercial A</Label><Input value={(form.medicamento_a as string) || ""} onChange={(e) => set("medicamento_a", e.target.value)} /></div>
            <div><Label>Nome comercial B</Label><Input value={(form.medicamento_b as string) || ""} onChange={(e) => set("medicamento_b", e.target.value)} /></div>
            <div><Label>Classe A</Label><Input value={(form.classe_a as string) || ""} onChange={(e) => set("classe_a", e.target.value)} /></div>
            <div><Label>Classe B</Label><Input value={(form.classe_b as string) || ""} onChange={(e) => set("classe_b", e.target.value)} /></div>
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-semibold text-ink">B/C. Tipo, gravidade e nível</h4>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Tipo</Label>
              <Select value={form.tipo_interacao as string} onValueChange={(v) => set("tipo_interacao", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Gravidade</Label>
              <Select value={form.gravidade as string} onValueChange={(v) => set("gravidade", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GRAV.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Nível</Label>
              <Select value={form.nivel_alerta as string} onValueChange={(v) => set("nivel_alerta", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{NIVEL.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-semibold text-ink">D. Mensagem e conduta</h4>
          <div><Label>Mecanismo</Label><Textarea rows={2} value={(form.mecanismo as string) || ""} onChange={(e) => set("mecanismo", e.target.value)} /></div>
          <div><Label>Mensagem ao médico</Label><Textarea rows={2} value={(form.mensagem_medico as string) || ""} onChange={(e) => set("mensagem_medico", e.target.value)} /></div>
          <div><Label>Mensagem enfermagem/farmácia</Label><Textarea rows={2} value={(form.mensagem_enfermagem_farmacia as string) || ""} onChange={(e) => set("mensagem_enfermagem_farmacia", e.target.value)} /></div>
          <div><Label>Conduta sugerida</Label><Textarea rows={2} value={(form.conduta_sugerida as string) || ""} onChange={(e) => set("conduta_sugerida", e.target.value)} /></div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2"><Switch checked={!!form.exige_justificativa} onCheckedChange={(v) => set("exige_justificativa", v)} /> Exige justificativa</label>
            <label className="flex items-center gap-2"><Switch checked={!!form.bloqueio_absoluto} onCheckedChange={(v) => set("bloqueio_absoluto", v)} /> Bloqueio absoluto</label>
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-semibold text-ink">E. Monitorização</h4>
          <div><Label>Monitorização recomendada</Label><Textarea rows={2} value={(form.monitorizacao_recomendada as string) || ""} onChange={(e) => set("monitorizacao_recomendada", e.target.value)} /></div>
          <div><Label>Exames a monitorar (separados por vírgula)</Label>
            <Input value={(form.exames_monitorar as string[] | undefined)?.join(", ") || ""} onChange={(e) => set("exames_monitorar", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} />
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-semibold text-ink">F. Populações de risco</h4>
          <Input placeholder="ex: idoso, gestante, pediatria"
            value={(form.populacoes_maior_risco as string[] | undefined)?.join(", ") || ""}
            onChange={(e) => set("populacoes_maior_risco", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} />
          <div><Label>Contexto clínico relevante</Label><Textarea rows={2} value={(form.contexto_clinico_relevante as string) || ""} onChange={(e) => set("contexto_clinico_relevante", e.target.value)} /></div>
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-semibold text-ink">G. Fonte e revisão</h4>
          <div><Label>Fonte de referência</Label><Input value={(form.fonte_referencia as string) || ""} onChange={(e) => set("fonte_referencia", e.target.value)} /></div>
          <div><Label>Status de revisão</Label>
            <Select value={form.status_revisao as string} onValueChange={(v) => set("status_revisao", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {form.status_revisao !== "revisado" && (
            <Badge variant="outline" className="text-[10px]">Aguardando revisão</Badge>
          )}
        </section>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
