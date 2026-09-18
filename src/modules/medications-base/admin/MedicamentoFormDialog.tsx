import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CATEGORIAS_CLINICAS, PRIORIDADES_MVP, STATUS_REVISAO,
  TIPOS_RECEITA, ALERTA_GEST_LACT,
} from "../lib/constants";
import type { BaseMedicamento } from "../hooks/useBaseMedicamentos";

type Props = {
  open: boolean;
  initial?: Partial<BaseMedicamento> | null;
  onClose: () => void;
  onSave: (data: Partial<BaseMedicamento>) => Promise<boolean>;
};

const empty: Partial<BaseMedicamento> = {
  principio_ativo: "",
  categoria_clinica: "dor_febre",
  prioridade_mvp: "media",
  tipo_receita: "comum",
  alerta_gestacao: "sem_dados",
  alerta_lactacao: "sem_dados",
  status_revisao: "rascunho",
  nomes_comerciais: [],
  sinonimos: [],
  cid_relacionados: [],
  queixas_relacionadas: [],
  protocolos_relacionados: [],
  modelos_rapidos_relacionados: [],
  ativo: true,
};

const csv = (arr: string[] | undefined | null) => (arr ?? []).join(", ");
const fromCsv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function MedicamentoFormDialog({ open, initial, onClose, onSave }: Props) {
  const [form, setForm] = useState<Partial<BaseMedicamento>>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initial ? { ...empty, ...initial } : empty);
  }, [initial, open]);

  const set = <K extends keyof BaseMedicamento>(k: K, v: BaseMedicamento[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.principio_ativo?.trim()) return;
    if (form.status_revisao === "revisado" && !form.fonte_referencia?.trim()) {
      alert("Para promover a 'Revisado', informe a fonte de referência.");
      return;
    }
    setSaving(true);
    const ok = await onSave(form);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Editar medicamento" : "Novo medicamento"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="a">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="a">A. ID</TabsTrigger>
            <TabsTrigger value="b">B. Apres.</TabsTrigger>
            <TabsTrigger value="c">C. Posol.</TabsTrigger>
            <TabsTrigger value="d">D. Segur.</TabsTrigger>
            <TabsTrigger value="e">E. Contexto</TabsTrigger>
            <TabsTrigger value="f">F. Revisão</TabsTrigger>
          </TabsList>

          <TabsContent value="a" className="space-y-3 pt-3">
            <div><Label>Princípio ativo *</Label>
              <Input value={form.principio_ativo ?? ""} onChange={(e) => set("principio_ativo", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>DCB</Label>
                <Input value={form.principio_ativo_dcb ?? ""} onChange={(e) => set("principio_ativo_dcb", e.target.value)} /></div>
              <div><Label>Nome comercial referência</Label>
                <Input value={form.nome_comercial_referencia ?? ""} onChange={(e) => set("nome_comercial_referencia", e.target.value)} /></div>
            </div>
            <div><Label>Nomes comerciais (separar por vírgula)</Label>
              <Input value={csv(form.nomes_comerciais)} onChange={(e) => set("nomes_comerciais", fromCsv(e.target.value))} /></div>
            <div><Label>Sinônimos / nomes populares (vírgula)</Label>
              <Input value={csv(form.sinonimos)} onChange={(e) => set("sinonimos", fromCsv(e.target.value))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Classe terapêutica</Label>
                <Input value={form.classe_terapeutica ?? ""} onChange={(e) => set("classe_terapeutica", e.target.value)} /></div>
              <div><Label>Subclasse</Label>
                <Input value={form.subclasse_terapeutica ?? ""} onChange={(e) => set("subclasse_terapeutica", e.target.value)} /></div>
            </div>
            <div><Label>Categoria clínica</Label>
              <Select value={form.categoria_clinica} onValueChange={(v) => set("categoria_clinica", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_CLINICAS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select></div>
          </TabsContent>

          <TabsContent value="b" className="space-y-3 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Forma farmacêutica</Label>
                <Input value={form.forma_farmaceutica ?? ""} onChange={(e) => set("forma_farmaceutica", e.target.value)} /></div>
              <div><Label>Concentração</Label>
                <Input value={form.concentracao ?? ""} onChange={(e) => set("concentracao", e.target.value)} /></div>
            </div>
            <div><Label>Apresentação (texto livre)</Label>
              <Input value={form.apresentacao ?? ""} onChange={(e) => set("apresentacao", e.target.value)} /></div>
            <div><Label>Via de administração</Label>
              <Input value={form.via_administracao ?? ""} onChange={(e) => set("via_administracao", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              {[["medicamento_oral","Oral"],["medicamento_injetavel","Injetável"],["medicamento_topico","Tópico"],["medicamento_inalatorio","Inalatório"]].map(([k,lbl])=>(
                <label key={k} className="flex items-center gap-2 text-sm">
                  <Switch checked={!!(form as any)[k]} onCheckedChange={(v)=>set(k as any, v as any)} />
                  {lbl}
                </label>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="c" className="space-y-3 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Dose adulto padrão</Label>
                <Input value={form.dose_adulto_padrao ?? ""} onChange={(e)=>set("dose_adulto_padrao", e.target.value)} /></div>
              <div><Label>Dose pediátrica padrão</Label>
                <Input value={form.dose_pediatrica_padrao ?? ""} onChange={(e)=>set("dose_pediatrica_padrao", e.target.value)} /></div>
              <div><Label>Dose máxima adulto</Label>
                <Input value={form.dose_maxima_adulto ?? ""} onChange={(e)=>set("dose_maxima_adulto", e.target.value)} /></div>
              <div><Label>Dose máxima pediátrica</Label>
                <Input value={form.dose_maxima_pediatrica ?? ""} onChange={(e)=>set("dose_maxima_pediatrica", e.target.value)} /></div>
              <div><Label>Frequência padrão</Label>
                <Input value={form.frequencia_padrao ?? ""} onChange={(e)=>set("frequencia_padrao", e.target.value)} /></div>
              <div><Label>Duração padrão</Label>
                <Input value={form.duracao_padrao ?? ""} onChange={(e)=>set("duracao_padrao", e.target.value)} /></div>
            </div>
            <div><Label>Observação posologia</Label>
              <Textarea value={form.observacao_posologia ?? ""} onChange={(e)=>set("observacao_posologia", e.target.value)} /></div>
          </TabsContent>

          <TabsContent value="d" className="space-y-3 pt-3">
            <div className="grid grid-cols-2 gap-2">
              {[["exige_peso","Exige peso"],["exige_ajuste_renal","Ajuste renal"],["exige_ajuste_hepatico","Ajuste hepático"],["antimicrobiano","Antimicrobiano"],["medicamento_controlado","Controlado"],["risco_interacao_relevante","Interação relevante"],["risco_duplicidade","Risco duplicidade"]].map(([k,lbl])=>(
                <label key={k} className="flex items-center gap-2 text-sm">
                  <Switch checked={!!(form as any)[k]} onCheckedChange={(v)=>set(k as any, v as any)} />
                  {lbl}
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tipo de receita</Label>
                <Select value={form.tipo_receita} onValueChange={(v)=>set("tipo_receita", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS_RECEITA.map((t)=><SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>Alergia / classe</Label>
                <Input value={form.alerta_alergia_classe ?? ""} onChange={(e)=>set("alerta_alergia_classe", e.target.value)} /></div>
              <div><Label>Alerta gestação</Label>
                <Select value={form.alerta_gestacao} onValueChange={(v)=>set("alerta_gestacao", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ALERTA_GEST_LACT.map((t)=><SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>Alerta lactação</Label>
                <Select value={form.alerta_lactacao} onValueChange={(v)=>set("alerta_lactacao", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ALERTA_GEST_LACT.map((t)=><SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
          </TabsContent>

          <TabsContent value="e" className="space-y-3 pt-3">
            <div><Label>CIDs relacionados (vírgula)</Label>
              <Input value={csv(form.cid_relacionados)} onChange={(e)=>set("cid_relacionados", fromCsv(e.target.value))} /></div>
            <div><Label>Queixas relacionadas (vírgula)</Label>
              <Input value={csv(form.queixas_relacionadas)} onChange={(e)=>set("queixas_relacionadas", fromCsv(e.target.value))} /></div>
            <div><Label>Protocolos relacionados (vírgula)</Label>
              <Input value={csv(form.protocolos_relacionados)} onChange={(e)=>set("protocolos_relacionados", fromCsv(e.target.value))} /></div>
            <div><Label>Modelos rápidos relacionados (vírgula)</Label>
              <Input value={csv(form.modelos_rapidos_relacionados)} onChange={(e)=>set("modelos_rapidos_relacionados", fromCsv(e.target.value))} /></div>
            <div><Label>Vínculo IV (id de iv_medications)</Label>
              <Input value={form.vinculo_iv_medication_id ?? ""} onChange={(e)=>set("vinculo_iv_medication_id", e.target.value || null as any)} /></div>
          </TabsContent>

          <TabsContent value="f" className="space-y-3 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Prioridade MVP</Label>
                <Select value={form.prioridade_mvp} onValueChange={(v)=>set("prioridade_mvp", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORIDADES_MVP.map((t)=><SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>Status revisão</Label>
                <Select value={form.status_revisao} onValueChange={(v)=>set("status_revisao", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_REVISAO.map((t)=><SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
            <div><Label>Fonte de referência (obrigatória para "Revisado")</Label>
              <Input value={form.fonte_referencia ?? ""} onChange={(e)=>set("fonte_referencia", e.target.value)}
                placeholder="Ex.: Bulário Anvisa, DCB, protocolo institucional" /></div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.ativo ?? true} onCheckedChange={(v)=>set("ativo", v)} /> Ativo
            </label>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
