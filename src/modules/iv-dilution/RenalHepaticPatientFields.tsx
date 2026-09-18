import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity } from "lucide-react";
import type { PatientRH } from "./lib/renalHepaticCalc";

type Props = {
  value: PatientRH;
  onChange: (next: PatientRH) => void;
};

export default function RenalHepaticPatientFields({ value, onChange }: Props) {
  const set = <K extends keyof PatientRH>(k: K, v: PatientRH[K]) => onChange({ ...value, [k]: v });
  const num = (v: string) => (v ? Number(v) : null);

  return (
    <div className="rounded-md border bg-muted/30 p-3 space-y-3 text-xs">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-canon-blue" />
        <span className="font-medium">Função renal e hepática</span>
      </div>

      <p className="text-[11px] text-muted-foreground font-medium">Renal</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Field label="Creatinina">
          <Input type="number" inputMode="decimal" className="h-7 text-xs"
            value={value.creatinina_serica ?? ""} onChange={(e) => set("creatinina_serica", num(e.target.value))} />
        </Field>
        <Field label="Unidade">
          <Select value={value.unidade_creatinina ?? "mg/dL"} onValueChange={(v) => set("unidade_creatinina", v as any)}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mg/dL">mg/dL</SelectItem>
              <SelectItem value="µmol/L">µmol/L</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Data creatinina">
          <Input type="date" className="h-7 text-xs"
            value={value.data_creatinina ?? ""} onChange={(e) => set("data_creatinina", e.target.value || null)} />
        </Field>
        <Field label="eTFG (mL/min)">
          <Input type="number" inputMode="decimal" className="h-7 text-xs"
            value={value.etfg ?? ""} onChange={(e) => set("etfg", num(e.target.value))} />
        </Field>
        <Field label="ClCr (mL/min) manual">
          <Input type="number" inputMode="decimal" className="h-7 text-xs"
            value={value.clearance_creatinina_estimado ?? ""} onChange={(e) => set("clearance_creatinina_estimado", num(e.target.value))} />
        </Field>
        <Field label="Sexo biológico">
          <Select value={value.sexo_biologico ?? undefined} onValueChange={(v) => set("sexo_biologico", v as any)}>
            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Masculino</SelectItem>
              <SelectItem value="F">Feminino</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Idade (anos)">
          <Input type="number" inputMode="decimal" className="h-7 text-xs"
            value={value.idade ?? ""} onChange={(e) => set("idade", num(e.target.value))} />
        </Field>
        <Field label="Peso (kg)">
          <Input type="number" inputMode="decimal" className="h-7 text-xs"
            value={value.peso_kg ?? ""} onChange={(e) => set("peso_kg", num(e.target.value))} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-3">
        <Toggle label="DRC" checked={!!value.possui_doenca_renal_cronica} onChange={(v) => set("possui_doenca_renal_cronica", v)} />
        <Toggle label="Hemodiálise" checked={!!value.em_hemodialise} onChange={(v) => set("em_hemodialise", v)} />
        <Toggle label="Diálise peritoneal" checked={!!value.dialise_peritoneal} onChange={(v) => set("dialise_peritoneal", v)} />
        <Toggle label="LRA suspeita" checked={!!value.lesao_renal_aguda_suspeita} onChange={(v) => set("lesao_renal_aguda_suspeita", v)} />
        <Toggle label="Internado" checked={!!value.internado} onChange={(v) => set("internado", v)} />
      </div>

      <p className="text-[11px] text-muted-foreground font-medium pt-2 border-t">Hepático</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Field label="AST"><Input type="number" inputMode="decimal" className="h-7 text-xs" value={value.ast ?? ""} onChange={(e) => set("ast", num(e.target.value))} /></Field>
        <Field label="ALT"><Input type="number" inputMode="decimal" className="h-7 text-xs" value={value.alt ?? ""} onChange={(e) => set("alt", num(e.target.value))} /></Field>
        <Field label="Bilir. total"><Input type="number" inputMode="decimal" className="h-7 text-xs" value={value.bilirrubina_total ?? ""} onChange={(e) => set("bilirrubina_total", num(e.target.value))} /></Field>
        <Field label="Bilir. direta"><Input type="number" inputMode="decimal" className="h-7 text-xs" value={value.bilirrubina_direta ?? ""} onChange={(e) => set("bilirrubina_direta", num(e.target.value))} /></Field>
        <Field label="Albumina"><Input type="number" inputMode="decimal" className="h-7 text-xs" value={value.albumina ?? ""} onChange={(e) => set("albumina", num(e.target.value))} /></Field>
        <Field label="INR"><Input type="number" inputMode="decimal" className="h-7 text-xs" value={value.inr ?? ""} onChange={(e) => set("inr", num(e.target.value))} /></Field>
        <Field label="Child-Pugh">
          <Select value={value.child_pugh ?? undefined} onValueChange={(v) => set("child_pugh", v as any)}>
            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="C">C</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="flex flex-wrap gap-3">
        <Toggle label="Doença hepática" checked={!!value.possui_doenca_hepatica} onChange={(v) => set("possui_doenca_hepatica", v)} />
        <Toggle label="Cirrose conhecida" checked={!!value.cirrose_conhecida} onChange={(v) => set("cirrose_conhecida", v)} />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Switch checked={checked} onCheckedChange={onChange} />
      <Label className="text-[11px]">{label}</Label>
    </div>
  );
}
