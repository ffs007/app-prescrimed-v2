import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Activity, Search } from "lucide-react";
import type { IVMedication } from "../IVDilutionAdminPage";

type RHFields = {
  exige_ajuste_funcao_renal: boolean;
  risco_acumulo_renal: boolean;
  risco_nefrotoxicidade: boolean;
  monitorar_creatinina: boolean;
  monitorar_nivel_serico: boolean;
  contraindicado_renal_grave: boolean;
  observacao_ajuste_renal: string | null;
  faixa_renal_normal: string | null;
  faixa_renal_moderada: string | null;
  faixa_renal_importante: string | null;
  faixa_renal_grave: string | null;
  faixa_dialise: string | null;
  fonte_ajuste_renal: string | null;
  exige_ajuste_funcao_hepatica: boolean;
  risco_hepatotoxicidade: boolean;
  monitorar_transaminases: boolean;
  contraindicado_hepatico_grave: boolean;
  observacao_ajuste_hepatico: string | null;
  fonte_ajuste_hepatico: string | null;
  status_revisao_ajuste_renal_hepatico: string;
};

const STATUS = ["nao_cadastrado", "aguardando_revisao", "revisado", "precisa_corrigir", "inativo"];
const statusLabel: Record<string, string> = {
  nao_cadastrado: "Não cadastrado",
  aguardando_revisao: "Aguardando revisão",
  revisado: "Revisado",
  precisa_corrigir: "Precisa corrigir",
  inativo: "Inativo",
};
const statusTone = (s: string) =>
  s === "revisado" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
  : s === "precisa_corrigir" ? "border-destructive/30 bg-destructive/10 text-destructive"
  : s === "aguardando_revisao" ? "border-warning/40 bg-warning/10 text-warning"
  : "border-muted-foreground/30 bg-muted text-muted-foreground";

type Props = {
  items: (IVMedication & Partial<RHFields>)[];
  canEdit: boolean;
  onChanged: () => void;
};

export default function RenalHepaticDoseTab({ items, canEdit, onChanged }: Props) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<(IVMedication & Partial<RHFields>) | null>(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((m) =>
      m.principio_ativo.toLowerCase().includes(t) ||
      (m.nome_comercial_referencia ?? "").toLowerCase().includes(t),
    );
  }, [items, q]);

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" /> Ajuste renal/hepático
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar princípio ativo…" className="h-8 pl-7 text-xs" />
          </div>
          <div className="border rounded-md divide-y max-h-[480px] overflow-auto">
            {filtered.map((m) => {
              const status = m.status_revisao_ajuste_renal_hepatico ?? "nao_cadastrado";
              const sem = !m.fonte_ajuste_renal && !m.fonte_ajuste_hepatico && status === "nao_cadastrado";
              return (
                <button key={m.id} onClick={() => setEditing(m)} className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.principio_ativo}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {m.exige_ajuste_funcao_renal ? "ajuste renal" : ""}
                      {m.exige_ajuste_funcao_renal && m.exige_ajuste_funcao_hepatica ? " · " : ""}
                      {m.exige_ajuste_funcao_hepatica ? "ajuste hepático" : ""}
                      {!m.exige_ajuste_funcao_renal && !m.exige_ajuste_funcao_hepatica ? "Sem ajuste cadastrado" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {sem && <Badge variant="outline" className="text-[10px]">Não revisado</Badge>}
                    <Badge variant="outline" className={`text-[10px] ${statusTone(status)}`}>{statusLabel[status]}</Badge>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && <p className="p-4 text-xs text-muted-foreground text-center">Nenhum medicamento.</p>}
          </div>
        </CardContent>
      </Card>

      {editing && (
        <RHEditor med={editing} canEdit={canEdit} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onChanged(); }} />
      )}
    </div>
  );
}

function RHEditor({ med, canEdit, onClose, onSaved }: { med: IVMedication & Partial<RHFields>; canEdit: boolean; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<RHFields>({
    exige_ajuste_funcao_renal: !!(med as any).exige_ajuste_funcao_renal,
    risco_acumulo_renal: !!med.risco_acumulo_renal,
    risco_nefrotoxicidade: !!med.risco_nefrotoxicidade,
    monitorar_creatinina: !!med.monitorar_creatinina,
    monitorar_nivel_serico: !!med.monitorar_nivel_serico,
    contraindicado_renal_grave: !!med.contraindicado_renal_grave,
    observacao_ajuste_renal: med.observacao_ajuste_renal ?? null,
    faixa_renal_normal: med.faixa_renal_normal ?? null,
    faixa_renal_moderada: med.faixa_renal_moderada ?? null,
    faixa_renal_importante: med.faixa_renal_importante ?? null,
    faixa_renal_grave: med.faixa_renal_grave ?? null,
    faixa_dialise: med.faixa_dialise ?? null,
    fonte_ajuste_renal: med.fonte_ajuste_renal ?? null,
    exige_ajuste_funcao_hepatica: !!(med as any).exige_ajuste_funcao_hepatica,
    risco_hepatotoxicidade: !!med.risco_hepatotoxicidade,
    monitorar_transaminases: !!med.monitorar_transaminases,
    contraindicado_hepatico_grave: !!med.contraindicado_hepatico_grave,
    observacao_ajuste_hepatico: med.observacao_ajuste_hepatico ?? null,
    fonte_ajuste_hepatico: med.fonte_ajuste_hepatico ?? null,
    status_revisao_ajuste_renal_hepatico: med.status_revisao_ajuste_renal_hepatico ?? "nao_cadastrado",
  });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof RHFields>(k: K, v: RHFields[K]) => setD((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!canEdit) return;
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("iv_medications").update({
      ...d,
      revisor_ajuste_renal_hepatico: u.user?.id ?? null,
      data_atualizacao_ajuste_renal_hepatico: new Date().toISOString().slice(0, 10),
    } as any).eq("id", med.id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Ajuste renal/hepático salvo");
    onSaved();
  };

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm">Ajuste renal/hepático — {med.principio_ativo}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Section title="A. Ajuste renal">
          <div className="flex flex-wrap gap-3">
            <Toggle label="Exige ajuste renal" checked={d.exige_ajuste_funcao_renal} onChange={(v) => set("exige_ajuste_funcao_renal", v)} disabled={!canEdit} />
            <Toggle label="Risco de acúmulo" checked={d.risco_acumulo_renal} onChange={(v) => set("risco_acumulo_renal", v)} disabled={!canEdit} />
            <Toggle label="Risco nefrotoxicidade" checked={d.risco_nefrotoxicidade} onChange={(v) => set("risco_nefrotoxicidade", v)} disabled={!canEdit} />
            <Toggle label="Monitorar creatinina" checked={d.monitorar_creatinina} onChange={(v) => set("monitorar_creatinina", v)} disabled={!canEdit} />
            <Toggle label="Monitorar nível sérico" checked={d.monitorar_nivel_serico} onChange={(v) => set("monitorar_nivel_serico", v)} disabled={!canEdit} />
            <Toggle label="Contraindicado renal grave" checked={d.contraindicado_renal_grave} onChange={(v) => set("contraindicado_renal_grave", v)} disabled={!canEdit} />
          </div>
          <Area label="Observação ajuste renal" value={d.observacao_ajuste_renal} onChange={(v) => set("observacao_ajuste_renal", v)} disabled={!canEdit} />
          <p className="text-[11px] text-muted-foreground">Orientações por faixa renal (texto livre, sem inventar doses):</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <TxtF label="Faixa normal/leve (≥60)" value={d.faixa_renal_normal} onChange={(v) => set("faixa_renal_normal", v)} disabled={!canEdit} />
            <TxtF label="Moderada (30–59)" value={d.faixa_renal_moderada} onChange={(v) => set("faixa_renal_moderada", v)} disabled={!canEdit} />
            <TxtF label="Importante (15–29)" value={d.faixa_renal_importante} onChange={(v) => set("faixa_renal_importante", v)} disabled={!canEdit} />
            <TxtF label="Grave (<15)" value={d.faixa_renal_grave} onChange={(v) => set("faixa_renal_grave", v)} disabled={!canEdit} />
            <TxtF label="Diálise" value={d.faixa_dialise} onChange={(v) => set("faixa_dialise", v)} disabled={!canEdit} />
          </div>
          <TxtF label="Fonte ajuste renal" value={d.fonte_ajuste_renal} onChange={(v) => set("fonte_ajuste_renal", v)} disabled={!canEdit} />
        </Section>

        <Section title="B. Ajuste hepático">
          <div className="flex flex-wrap gap-3">
            <Toggle label="Exige ajuste hepático" checked={d.exige_ajuste_funcao_hepatica} onChange={(v) => set("exige_ajuste_funcao_hepatica", v)} disabled={!canEdit} />
            <Toggle label="Risco hepatotoxicidade" checked={d.risco_hepatotoxicidade} onChange={(v) => set("risco_hepatotoxicidade", v)} disabled={!canEdit} />
            <Toggle label="Monitorar transaminases" checked={d.monitorar_transaminases} onChange={(v) => set("monitorar_transaminases", v)} disabled={!canEdit} />
            <Toggle label="Contraindicado hepático grave" checked={d.contraindicado_hepatico_grave} onChange={(v) => set("contraindicado_hepatico_grave", v)} disabled={!canEdit} />
          </div>
          <Area label="Observação ajuste hepático" value={d.observacao_ajuste_hepatico} onChange={(v) => set("observacao_ajuste_hepatico", v)} disabled={!canEdit} />
          <TxtF label="Fonte ajuste hepático" value={d.fonte_ajuste_hepatico} onChange={(v) => set("fonte_ajuste_hepatico", v)} disabled={!canEdit} />
        </Section>

        <Section title="C. Revisão">
          <div>
            <Label className="text-xs">Status de revisão</Label>
            <Select value={d.status_revisao_ajuste_renal_hepatico} onValueChange={(v) => set("status_revisao_ajuste_renal_hepatico", v)} disabled={!canEdit}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS.map((s) => <SelectItem key={s} value={s}>{statusLabel[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </Section>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>Fechar</Button>
          {canEdit && <Button size="sm" onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>}
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-2"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>{children}</div>;
}
function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return <div className="flex items-center gap-2"><Switch checked={checked} onCheckedChange={onChange} disabled={disabled} /><Label className="text-xs">{label}</Label></div>;
}
function TxtF({ label, value, onChange, disabled }: { label: string; value: string | null; onChange: (v: string | null) => void; disabled?: boolean }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input className="h-8 text-xs" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} disabled={disabled} />
    </div>
  );
}
function Area({ label, value, onChange, disabled }: { label: string; value: string | null; onChange: (v: string | null) => void; disabled?: boolean }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Textarea rows={2} className="text-xs" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} disabled={disabled} />
    </div>
  );
}
