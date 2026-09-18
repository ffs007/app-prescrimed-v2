import { useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Baby, AlertTriangle } from "lucide-react";
import type { PatientPed } from "./lib/pediatricCalc";
import { calcIdadeAnos, isPediatric } from "./lib/pediatricCalc";

type Props = {
  value: PatientPed;
  onChange: (next: PatientPed) => void;
  /** Quando true, peso fica em destaque e validação ativa */
  pedRequired?: boolean;
};

export default function PediatricPatientFields({ value, onChange, pedRequired }: Props) {
  const set = <K extends keyof PatientPed>(k: K, v: PatientPed[K]) => onChange({ ...value, [k]: v });

  const idade = useMemo(() => calcIdadeAnos(value), [value]);
  const ped = isPediatric(value);
  const neonatal = (idade ?? 99) < 1 / 12; // < ~28 dias aprox
  const semPeso = !value.peso_kg || value.peso_kg <= 0;

  // Auto-marcar pediátrico quando idade < 18
  useEffect(() => {
    if (idade != null && idade < 18 && !value.paciente_pediatrico) {
      onChange({ ...value, paciente_pediatrico: true });
    }
    // eslint-disable-next-line
  }, [idade]);

  return (
    <div className="rounded-md border bg-muted/30 p-3 space-y-3 text-xs">
      <div className="flex items-center gap-2">
        <Baby className="h-4 w-4 text-canon-blue" />
        <span className="font-medium">Dados do paciente (cálculo por peso)</span>
        <div className="ml-auto flex items-center gap-2">
          <Label htmlFor="ped-flag" className="text-[11px]">Paciente pediátrico</Label>
          <Switch
            id="ped-flag"
            checked={!!value.paciente_pediatrico}
            onCheckedChange={(v) => set("paciente_pediatrico", v)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Field label="Data nasc.">
          <Input type="date" className="h-7 text-xs"
            value={value.data_nascimento ?? ""} onChange={(e) => set("data_nascimento", e.target.value || null)} />
        </Field>
        <Field label="Idade (anos)">
          <Input type="number" inputMode="decimal" className="h-7 text-xs"
            value={value.idade_anos ?? ""} onChange={(e) => set("idade_anos", e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <Field label="Idade (meses)">
          <Input type="number" inputMode="decimal" className="h-7 text-xs"
            value={value.idade_meses ?? ""} onChange={(e) => set("idade_meses", e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <Field label="Idade (dias)">
          <Input type="number" inputMode="decimal" className="h-7 text-xs"
            value={value.idade_dias ?? ""} onChange={(e) => set("idade_dias", e.target.value ? Number(e.target.value) : null)} />
        </Field>

        <Field label={ped ? "Peso (kg) *" : "Peso (kg)"} highlight={ped}>
          <Input type="number" inputMode="decimal"
            className={`h-7 text-xs ${ped && semPeso ? "border-destructive" : ""}`}
            value={value.peso_kg ?? ""} onChange={(e) => set("peso_kg", e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <Field label="Altura (cm)">
          <Input type="number" inputMode="decimal" className="h-7 text-xs"
            value={value.altura_cm ?? ""} onChange={(e) => set("altura_cm", e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <Field label="SC (m²)">
          <Input type="number" inputMode="decimal" className="h-7 text-xs"
            value={value.superficie_corporal_m2 ?? ""} onChange={(e) => set("superficie_corporal_m2", e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <div />

        {neonatal && (
          <>
            <Field label="IG (semanas)">
              <Input type="number" inputMode="decimal" className="h-7 text-xs"
                value={value.idade_gestacional_semanas ?? ""} onChange={(e) => set("idade_gestacional_semanas", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Field label="Peso ao nascer (kg)">
              <Input type="number" inputMode="decimal" className="h-7 text-xs"
                value={value.peso_nascimento_kg ?? ""} onChange={(e) => set("peso_nascimento_kg", e.target.value ? Number(e.target.value) : null)} />
            </Field>
          </>
        )}
      </div>

      {(ped || pedRequired) && semPeso && (
        <p className="flex items-center gap-1 text-destructive">
          <AlertTriangle className="h-3 w-3" />
          Peso do paciente necessário para cálculo pediátrico seguro.
        </p>
      )}
    </div>
  );
}

function Field({ label, children, highlight }: { label: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div>
      <Label className={`text-[10px] uppercase tracking-wide ${highlight ? "text-destructive" : "text-muted-foreground"}`}>{label}</Label>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
