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
  "alergia_confirmada","alergia_classe","reacao_cruzada","gestacao","lactacao",
  "comorbidade","cid","idade","outro",
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

export default function ContraindicationFormDialog({ open, initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Record<string, unknown>>(initial || {
    tipo_contraindicacao: "comorbidade", gravidade: "moderada", nivel_alerta: "atencao",
    status_revisao: "aguardando_revisao", exige_justificativa: false, bloqueio_absoluto: false,
    nomes_comerciais: [], populacoes_afetadas: [],
  });

  useEffect(() => { if (initial) setForm(initial); }, [initial]);

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  async function save() {
    const f = form as Record<string, unknown>;
    if (!f.principio_ativo && !f.classe_terapeutica) {
      toast.error("Informe princípio ativo ou classe terapêutica"); return;
    }
    if (f.status_revisao === "revisado") {
      if (!f.fonte_referencia) { toast.error("Contraindicação revisada exige fonte"); return; }
      if (f.bloqueio_absoluto && !f.conduta_sugerida) { toast.error("Bloqueio absoluto exige conduta sugerida"); return; }
    }
    const { id, ...payload } = f as { id?: string };
    const { error } = id
      ? await (supabase.from("base_contraindicacoes_medicamentos") as any).update(payload).eq("id", id)
      : await (supabase.from("base_contraindicacoes_medicamentos") as any).insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Contraindicação salva");
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{(form as { id?: string }).id ? "Editar contraindicação" : "Nova contraindicação"}</DialogTitle>
        </DialogHeader>

        <section className="space-y-2">
          <h4 className="text-xs font-semibold">A. Medicamento / classe</h4>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Princípio ativo</Label><Input value={(form.principio_ativo as string) || ""} onChange={(e) => set("principio_ativo", e.target.value)} /></div>
            <div><Label>Classe terapêutica</Label><Input value={(form.classe_terapeutica as string) || ""} onChange={(e) => set("classe_terapeutica", e.target.value)} /></div>
            <div className="col-span-2"><Label>Nomes comerciais (separados por vírgula)</Label>
              <Input value={(form.nomes_comerciais as string[] | undefined)?.join(", ") || ""}
                onChange={(e) => set("nomes_comerciais", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} />
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-semibold">B. Tipo e condição clínica</h4>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Tipo</Label>
              <Select value={form.tipo_contraindicacao as string} onValueChange={(v) => set("tipo_contraindicacao", v)}>
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
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Condição clínica</Label><Input value={(form.condicao_clinica as string) || ""} onChange={(e) => set("condicao_clinica", e.target.value)} /></div>
            <div><Label>CID relacionado</Label><Input value={(form.cid_relacionado as string) || ""} onChange={(e) => set("cid_relacionado", e.target.value)} /></div>
            <div><Label>Grupo CID</Label><Input value={(form.grupo_cid as string) || ""} onChange={(e) => set("grupo_cid", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Idade mín.</Label><Input type="number" value={(form.idade_min as number | string) ?? ""} onChange={(e) => set("idade_min", e.target.value ? Number(e.target.value) : null)} /></div>
              <div><Label>Idade máx.</Label><Input type="number" value={(form.idade_max as number | string) ?? ""} onChange={(e) => set("idade_max", e.target.value ? Number(e.target.value) : null)} /></div>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-semibold">C. Mecanismo e mensagens</h4>
          <div><Label>Mecanismo / motivo</Label><Textarea rows={2} value={(form.mecanismo_ou_motivo as string) || ""} onChange={(e) => set("mecanismo_ou_motivo", e.target.value)} /></div>
          <div><Label>Mensagem ao médico</Label><Textarea rows={2} value={(form.mensagem_medico as string) || ""} onChange={(e) => set("mensagem_medico", e.target.value)} /></div>
          <div><Label>Mensagem enfermagem/farmácia</Label><Textarea rows={2} value={(form.mensagem_enfermagem_farmacia as string) || ""} onChange={(e) => set("mensagem_enfermagem_farmacia", e.target.value)} /></div>
          <div><Label>Conduta sugerida</Label><Textarea rows={2} value={(form.conduta_sugerida as string) || ""} onChange={(e) => set("conduta_sugerida", e.target.value)} /></div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2"><Switch checked={!!form.exige_justificativa} onCheckedChange={(v) => set("exige_justificativa", v)} /> Exige justificativa</label>
            <label className="flex items-center gap-2"><Switch checked={!!form.bloqueio_absoluto} onCheckedChange={(v) => set("bloqueio_absoluto", v)} /> Bloqueio absoluto</label>
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-semibold">D. Populações afetadas</h4>
          <Input placeholder="ex: idoso, gestante, pediatria"
            value={(form.populacoes_afetadas as string[] | undefined)?.join(", ") || ""}
            onChange={(e) => set("populacoes_afetadas", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} />
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-semibold">E. Fonte e revisão</h4>
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
