import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Baby, Search } from "lucide-react";
import type { IVMedication } from "../IVDilutionAdminPage";

type PedFields = {
  dose_pediatrica_min: number | null;
  dose_pediatrica_max: number | null;
  unidade_dose_pediatrica: string | null;
  intervalo_dose_pediatrica: string | null;
  dose_maxima_por_administracao: number | null;
  dose_maxima_diaria: number | null;
  unidade_dose_maxima: string | null;
  faixa_etaria_min: number | null;
  faixa_etaria_max: number | null;
  peso_minimo_kg: number | null;
  peso_maximo_kg: number | null;
  uso_neonatal: boolean;
  restricao_idade: string | null;
  observacao_pediatrica: string | null;
  exige_ajuste_funcao_renal: boolean;
  exige_ajuste_funcao_hepatica: boolean;
  fonte_dose_pediatrica: string | null;
  status_revisao_dose_pediatrica: string;
};

const UNIDADES = ["mg/kg/dose", "mg/kg/dia", "mcg/kg/dose", "mcg/kg/min", "UI/kg/dose", "mEq/kg/dose", "mmol/kg/dose"];
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
  items: (IVMedication & Partial<PedFields>)[];
  canEdit: boolean;
  onChanged: () => void;
};

export default function PediatricDoseTab({ items, canEdit, onChanged }: Props) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<(IVMedication & Partial<PedFields>) | null>(null);

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
            <Baby className="h-4 w-4" /> Doses pediátricas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar princípio ativo…" className="h-8 pl-7 text-xs" />
          </div>

          <div className="border rounded-md divide-y max-h-[480px] overflow-auto">
            {filtered.map((m) => {
              const status = m.status_revisao_dose_pediatrica ?? "nao_cadastrado";
              const semFonte = !m.fonte_dose_pediatrica || status === "nao_cadastrado";
              return (
                <button
                  key={m.id}
                  onClick={() => setEditing(m)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.principio_ativo}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {m.dose_pediatrica_min != null || m.dose_pediatrica_max != null
                        ? `${m.dose_pediatrica_min ?? "—"}–${m.dose_pediatrica_max ?? "—"} ${m.unidade_dose_pediatrica ?? ""}`
                        : "Sem dose pediátrica cadastrada"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {semFonte && <Badge variant="outline" className="text-[10px]">Não revisada</Badge>}
                    <Badge variant="outline" className={`text-[10px] ${statusTone(status)}`}>{statusLabel[status]}</Badge>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && <p className="p-4 text-xs text-muted-foreground text-center">Nenhum medicamento encontrado.</p>}
          </div>
        </CardContent>
      </Card>

      {editing && (
        <PediatricEditor
          med={editing}
          canEdit={canEdit}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); onChanged(); }}
        />
      )}
    </div>
  );
}

function PediatricEditor({
  med, canEdit, onClose, onSaved,
}: { med: IVMedication & Partial<PedFields>; canEdit: boolean; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<PedFields>({
    dose_pediatrica_min: med.dose_pediatrica_min ?? null,
    dose_pediatrica_max: med.dose_pediatrica_max ?? null,
    unidade_dose_pediatrica: med.unidade_dose_pediatrica ?? null,
    intervalo_dose_pediatrica: med.intervalo_dose_pediatrica ?? null,
    dose_maxima_por_administracao: med.dose_maxima_por_administracao ?? null,
    dose_maxima_diaria: med.dose_maxima_diaria ?? null,
    unidade_dose_maxima: med.unidade_dose_maxima ?? null,
    faixa_etaria_min: med.faixa_etaria_min ?? null,
    faixa_etaria_max: med.faixa_etaria_max ?? null,
    peso_minimo_kg: med.peso_minimo_kg ?? null,
    peso_maximo_kg: med.peso_maximo_kg ?? null,
    uso_neonatal: !!med.uso_neonatal,
    restricao_idade: med.restricao_idade ?? null,
    observacao_pediatrica: med.observacao_pediatrica ?? null,
    exige_ajuste_funcao_renal: !!med.exige_ajuste_funcao_renal,
    exige_ajuste_funcao_hepatica: !!med.exige_ajuste_funcao_hepatica,
    fonte_dose_pediatrica: med.fonte_dose_pediatrica ?? null,
    status_revisao_dose_pediatrica: med.status_revisao_dose_pediatrica ?? "nao_cadastrado",
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof PedFields>(k: K, v: PedFields[K]) => setD((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!canEdit) return;
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const payload: any = {
      ...d,
      revisor_dose_pediatrica: u.user?.id ?? null,
      data_atualizacao_dose_pediatrica: new Date().toISOString().slice(0, 10),
    };
    const { error } = await supabase.from("iv_medications").update(payload).eq("id", med.id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Dose pediátrica salva");
    onSaved();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Dose pediátrica — {med.principio_ativo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Section title="A. Faixa de dose">
          <Grid3>
            <NumF label="Dose mín." value={d.dose_pediatrica_min} onChange={(v) => set("dose_pediatrica_min", v)} disabled={!canEdit} />
            <NumF label="Dose máx." value={d.dose_pediatrica_max} onChange={(v) => set("dose_pediatrica_max", v)} disabled={!canEdit} />
            <SelF label="Unidade" value={d.unidade_dose_pediatrica} options={UNIDADES} onChange={(v) => set("unidade_dose_pediatrica", v)} disabled={!canEdit} />
            <TextF label="Intervalo" value={d.intervalo_dose_pediatrica} onChange={(v) => set("intervalo_dose_pediatrica", v)} disabled={!canEdit} />
          </Grid3>
        </Section>

        <Section title="B. Dose máxima">
          <Grid3>
            <NumF label="Máx./adm." value={d.dose_maxima_por_administracao} onChange={(v) => set("dose_maxima_por_administracao", v)} disabled={!canEdit} />
            <NumF label="Máx./dia" value={d.dose_maxima_diaria} onChange={(v) => set("dose_maxima_diaria", v)} disabled={!canEdit} />
            <TextF label="Unidade máx." value={d.unidade_dose_maxima} onChange={(v) => set("unidade_dose_maxima", v)} disabled={!canEdit} />
          </Grid3>
        </Section>

        <Section title="C. Faixa etária / peso">
          <Grid3>
            <NumF label="Idade mín. (anos)" value={d.faixa_etaria_min} onChange={(v) => set("faixa_etaria_min", v)} disabled={!canEdit} />
            <NumF label="Idade máx. (anos)" value={d.faixa_etaria_max} onChange={(v) => set("faixa_etaria_max", v)} disabled={!canEdit} />
            <NumF label="Peso mín. (kg)" value={d.peso_minimo_kg} onChange={(v) => set("peso_minimo_kg", v)} disabled={!canEdit} />
            <NumF label="Peso máx. (kg)" value={d.peso_maximo_kg} onChange={(v) => set("peso_maximo_kg", v)} disabled={!canEdit} />
            <TextF label="Restrição de idade" value={d.restricao_idade} onChange={(v) => set("restricao_idade", v)} disabled={!canEdit} />
          </Grid3>
        </Section>

        <Section title="D. Neonatal">
          <SwitchF label="Uso neonatal" checked={d.uso_neonatal} onChange={(v) => set("uso_neonatal", v)} disabled={!canEdit} />
        </Section>

        <Section title="E. Ajustes">
          <div className="flex flex-wrap gap-3">
            <SwitchF label="Exige ajuste renal" checked={d.exige_ajuste_funcao_renal} onChange={(v) => set("exige_ajuste_funcao_renal", v)} disabled={!canEdit} />
            <SwitchF label="Exige ajuste hepático" checked={d.exige_ajuste_funcao_hepatica} onChange={(v) => set("exige_ajuste_funcao_hepatica", v)} disabled={!canEdit} />
          </div>
        </Section>

        <Section title="F. Fonte / observações">
          <TextF label="Fonte" value={d.fonte_dose_pediatrica} onChange={(v) => set("fonte_dose_pediatrica", v)} disabled={!canEdit} />
          <div>
            <Label className="text-xs">Observação pediátrica</Label>
            <Textarea value={d.observacao_pediatrica ?? ""} onChange={(e) => set("observacao_pediatrica", e.target.value || null)} disabled={!canEdit} rows={2} />
          </div>
        </Section>

        <Section title="G. Revisão">
          <SelF label="Status de revisão" value={d.status_revisao_dose_pediatrica} options={STATUS}
            renderLabel={(s) => statusLabel[s] ?? s}
            onChange={(v) => set("status_revisao_dose_pediatrica", v ?? "nao_cadastrado")} disabled={!canEdit} />
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
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      {children}
    </div>
  );
}
function Grid3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{children}</div>;
}
function NumF({ label, value, onChange, disabled }: { label: string; value: number | null; onChange: (v: number | null) => void; disabled?: boolean }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type="number" inputMode="decimal" className="h-8 text-xs"
        value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} disabled={disabled} />
    </div>
  );
}
function TextF({ label, value, onChange, disabled }: { label: string; value: string | null; onChange: (v: string | null) => void; disabled?: boolean }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input className="h-8 text-xs" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} disabled={disabled} />
    </div>
  );
}
function SelF({ label, value, options, onChange, disabled, renderLabel }:
  { label: string; value: string | null; options: string[]; onChange: (v: string | null) => void; disabled?: boolean; renderLabel?: (s: string) => string }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Select value={value ?? undefined} onValueChange={(v) => onChange(v)} disabled={disabled}>
        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{renderLabel ? renderLabel(o) : o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
function SwitchF({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
      <Label className="text-xs">{label}</Label>
    </div>
  );
}
