import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { IVMedication } from "./IVDilutionAdminPage";
import { logIVAction, diffFields } from "./lib/ivAuditLog";

type MedExt = IVMedication & { status_revisao?: string | null; observacao_revisao?: string | null };
type Props = {
  open: boolean;
  initial?: MedExt;
  onClose: () => void;
  onSaved: () => void;
};

const empty: Partial<MedExt> = {
  principio_ativo: "", nome_comercial_referencia: "", apresentacao: "", via_administracao: "IV",
  volume_reconstituicao: "", diluente_reconstituicao: "", estabilidade_apos_reconstituicao: "",
  solucoes_compativeis: [], volume_diluicao: "", estabilidade_apos_diluicao: "",
  concentracao_maxima: "", tempo_minimo_infusao: "", velocidade_maxima_infusao: "",
  ph: "", observacoes_gerais: "",
  risco_flebite: false, exige_fotoprotecao: false, exige_equipo_fotossensivel: false, exige_filtro: false,
  incompatibilidades: [], volume_expansao_pos_reconstituicao: "",
  nivel_alerta: "baixo", alerta_medico: "", alerta_enfermagem_farmacia: "",
  fonte_referencia: "", status_revisao: "rascunho",
};

const toCsv = (a?: string[] | null) => (a ?? []).join(", ");
const fromCsv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function IVMedicationFormDialog({ open, initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Partial<MedExt>>(initial ?? empty);
  const [solucoesText, setSolucoesText] = useState(toCsv(initial?.solucoes_compativeis));
  const [incompText, setIncompText] = useState(toCsv(initial?.incompatibilidades));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initial ?? empty);
    setSolucoesText(toCsv(initial?.solucoes_compativeis));
    setIncompText(toCsv(initial?.incompatibilidades));
  }, [initial, open]);

  const set = <K extends keyof MedExt>(k: K, v: MedExt[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (status?: MedExt["status_revisao"]) => {
    if (!form.principio_ativo?.trim()) { toast.error("Princípio ativo é obrigatório"); return; }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const payload: any = {
      ...form,
      solucoes_compativeis: fromCsv(solucoesText),
      incompatibilidades: fromCsv(incompText),
      data_atualizacao: new Date().toISOString().slice(0, 10),
      ...(status ? { status_revisao: status } : {}),
      ...(status === "revisado" ? { revisado_por: session?.user.id, data_revisao: new Date().toISOString() } : {}),
    };
    let res: any;
    if (initial?.id) {
      res = await supabase.from("iv_medications").update(payload).eq("id", initial.id);
    } else {
      payload.criado_por = session?.user.id;
      res = await supabase.from("iv_medications").insert(payload).select("id").single();
    }
    setSaving(false);
    if (res.error) { toast.error("Erro ao salvar: " + res.error.message); return; }

    const newId = initial?.id ?? (res.data as any)?.id;
    if (initial?.id) {
      const diffs = diffFields(initial as any, payload);
      for (const d of diffs.slice(0, 8)) {
        await logIVAction({ id_medicamento: newId, principio_ativo: payload.principio_ativo, tipo_acao: status === "revisado" ? "aprovou" : "editou", campo_alterado: d.field, valor_anterior: d.before, valor_novo: d.after });
      }
    } else {
      await logIVAction({ id_medicamento: newId, principio_ativo: payload.principio_ativo, tipo_acao: "criou" });
    }
    toast.success(initial?.id ? "Atualizado" : "Criado");
    onSaved();
  };

  const inactivate = async () => {
    if (!initial?.id) return;
    if (!confirm("Inativar este medicamento?")) return;
    const { error } = await supabase.from("iv_medications").update({ status_revisao: "inativo" } as any).eq("id", initial.id);
    if (error) { toast.error(error.message); return; }
    await logIVAction({ id_medicamento: initial.id, principio_ativo: initial.principio_ativo, tipo_acao: "inativou" });
    toast.success("Inativado.");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar medicamento IV" : "Novo medicamento IV"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="ident" className="w-full">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full">
            <TabsTrigger value="ident">Identificação</TabsTrigger>
            <TabsTrigger value="recon">Reconstituição</TabsTrigger>
            <TabsTrigger value="dil">Diluição</TabsTrigger>
            <TabsTrigger value="adm">Administração</TabsTrigger>
            <TabsTrigger value="alerta">Alertas</TabsTrigger>
            <TabsTrigger value="fonte">Fonte</TabsTrigger>
          </TabsList>

          <TabsContent value="ident" className="grid gap-3 sm:grid-cols-2 pt-3">
            <Field label="Princípio ativo *"><Input value={form.principio_ativo ?? ""} onChange={(e) => set("principio_ativo", e.target.value)} /></Field>
            <Field label="Nome comercial / referência"><Input value={form.nome_comercial_referencia ?? ""} onChange={(e) => set("nome_comercial_referencia", e.target.value)} /></Field>
            <Field label="Apresentação"><Input value={form.apresentacao ?? ""} onChange={(e) => set("apresentacao", e.target.value)} /></Field>
            <Field label="Via de administração"><Input value={form.via_administracao ?? "IV"} onChange={(e) => set("via_administracao", e.target.value)} /></Field>
          </TabsContent>

          <TabsContent value="recon" className="grid gap-3 sm:grid-cols-2 pt-3">
            <Field label="Volume de reconstituição"><Input value={form.volume_reconstituicao ?? ""} onChange={(e) => set("volume_reconstituicao", e.target.value)} /></Field>
            <Field label="Diluente de reconstituição"><Input value={form.diluente_reconstituicao ?? ""} onChange={(e) => set("diluente_reconstituicao", e.target.value)} /></Field>
            <Field label="Estabilidade após reconstituição"><Input value={form.estabilidade_apos_reconstituicao ?? ""} onChange={(e) => set("estabilidade_apos_reconstituicao", e.target.value)} /></Field>
            <Field label="Volume de expansão pós-reconstituição"><Input value={form.volume_expansao_pos_reconstituicao ?? ""} onChange={(e) => set("volume_expansao_pos_reconstituicao", e.target.value)} /></Field>
          </TabsContent>

          <TabsContent value="dil" className="grid gap-3 sm:grid-cols-2 pt-3">
            <Field label="Soluções compatíveis (vírgula)" full><Input value={solucoesText} onChange={(e) => setSolucoesText(e.target.value)} placeholder="SF 0,9%, SG 5%" /></Field>
            <Field label="Volume de diluição"><Input value={form.volume_diluicao ?? ""} onChange={(e) => set("volume_diluicao", e.target.value)} /></Field>
            <Field label="Estabilidade após diluição"><Input value={form.estabilidade_apos_diluicao ?? ""} onChange={(e) => set("estabilidade_apos_diluicao", e.target.value)} /></Field>
            <Field label="Concentração máxima"><Input value={form.concentracao_maxima ?? ""} onChange={(e) => set("concentracao_maxima", e.target.value)} /></Field>
          </TabsContent>

          <TabsContent value="adm" className="grid gap-3 sm:grid-cols-2 pt-3">
            <Field label="Tempo mínimo de infusão"><Input value={form.tempo_minimo_infusao ?? ""} onChange={(e) => set("tempo_minimo_infusao", e.target.value)} /></Field>
            <Field label="Velocidade máxima de infusão"><Input value={form.velocidade_maxima_infusao ?? ""} onChange={(e) => set("velocidade_maxima_infusao", e.target.value)} /></Field>
            <Field label="pH"><Input value={form.ph ?? ""} onChange={(e) => set("ph", e.target.value)} /></Field>
            <div className="sm:col-span-2"><Toggle label="Risco de flebite" checked={!!form.risco_flebite} onChange={(v) => set("risco_flebite", v)} /></div>
          </TabsContent>

          <TabsContent value="alerta" className="grid gap-3 sm:grid-cols-2 pt-3">
            <div className="sm:col-span-2 grid grid-cols-2 gap-3">
              <Toggle label="Exige fotoproteção" checked={!!form.exige_fotoprotecao} onChange={(v) => set("exige_fotoprotecao", v)} />
              <Toggle label="Equipo fotossensível" checked={!!form.exige_equipo_fotossensivel} onChange={(v) => set("exige_equipo_fotossensivel", v)} />
              <Toggle label="Exige filtro" checked={!!form.exige_filtro} onChange={(v) => set("exige_filtro", v)} />
            </div>
            <Field label="Incompatibilidades (vírgula)" full><Input value={incompText} onChange={(e) => setIncompText(e.target.value)} /></Field>
            <Field label="Nível de alerta">
              <Select value={form.nivel_alerta ?? "baixo"} onValueChange={(v) => set("nivel_alerta", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Alerta para o médico" full><Textarea rows={2} value={form.alerta_medico ?? ""} onChange={(e) => set("alerta_medico", e.target.value)} /></Field>
            <Field label="Alerta enfermagem / farmácia" full><Textarea rows={2} value={form.alerta_enfermagem_farmacia ?? ""} onChange={(e) => set("alerta_enfermagem_farmacia", e.target.value)} /></Field>
            <Field label="Observações gerais" full><Textarea rows={2} value={form.observacoes_gerais ?? ""} onChange={(e) => set("observacoes_gerais", e.target.value)} /></Field>
          </TabsContent>

          <TabsContent value="fonte" className="grid gap-3 sm:grid-cols-2 pt-3">
            <Field label="Fonte de referência" full><Input value={form.fonte_referencia ?? ""} onChange={(e) => set("fonte_referencia", e.target.value)} /></Field>
            <Field label="Status de revisão">
              <Select value={form.status_revisao ?? "rascunho"} onValueChange={(v) => set("status_revisao", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="aguardando_revisao">Aguardando revisão</SelectItem>
                  <SelectItem value="revisado">Revisado</SelectItem>
                  <SelectItem value="precisa_corrigir">Precisa corrigir</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          {initial?.id && <Button variant="destructive" onClick={inactivate} disabled={saving}>Inativar</Button>}
          <Button variant="secondary" onClick={() => submit("rascunho")} disabled={saving}>Salvar rascunho</Button>
          <Button variant="secondary" onClick={() => submit("aguardando_revisao")} disabled={saving}>Enviar p/ revisão</Button>
          <Button onClick={() => submit("revisado")} disabled={saving}>{saving ? "Salvando…" : "Salvar como revisado"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-md border p-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
