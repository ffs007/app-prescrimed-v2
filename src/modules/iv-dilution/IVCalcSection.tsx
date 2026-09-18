import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calculator, Info } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { IVMedication } from "./IVDilutionAdminPage";
import {
  computeIVCalc, fmt, isVasoativo,
  type IVCalcInput, type IVCalcResult,
} from "./lib/ivCalc";
import { useIVCalcSettings } from "./hooks/useIVCalcSettings";
import { logIVCalc } from "./lib/ivCalcLog";

type Props = {
  medication: IVMedication;
  onResult?: (r: IVCalcResult) => void;
};

const DOSE_UNITS = ["mg", "g", "mcg", "UI", "mEq", "mmol"];
const VOL_UNITS = ["mL", "L"];
const TIME_UNITS = ["minutos", "horas"];

export default function IVCalcSection({ medication, onResult }: Props) {
  const { settings } = useIVCalcSettings();
  const vaso = isVasoativo(medication);

  const [input, setInput] = useState<IVCalcInput>({
    dose_value: null, dose_unit: "mg",
    volume_value: null, volume_unit: "mL",
    time_value: null, time_unit: "minutos",
    weight_kg: null,
  });

  const result = useMemo(
    () => computeIVCalc(input, medication, settings),
    [input, medication, settings],
  );

  useEffect(() => { onResult?.(result); }, [result]); // eslint-disable-line

  // Log com debounce 1s quando há alerta
  useEffect(() => {
    if (result.alerts.length === 0) return;
    const t = setTimeout(() => {
      logIVCalc({ med: medication, input, result, evento: "gerou_alerta" });
    }, 1000);
    return () => clearTimeout(t);
  }, [JSON.stringify(input), result.alerts.length]); // eslint-disable-line

  const update = <K extends keyof IVCalcInput>(k: K, v: IVCalcInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));

  const ok = result.alerts.length === 0 && result.status === "calculado";

  return (
    <div className="rounded-md border bg-muted/30 p-3 space-y-2 text-xs">
      <div className="flex items-center gap-2">
        <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium">Cálculos IV</span>
        {ok ? (
          <Badge variant="outline" className="ml-auto border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            Dentro dos parâmetros cadastrados
          </Badge>
        ) : result.alerts.some((a) => a.gravidade === "alto") ? (
          <Badge variant="outline" className="ml-auto border-destructive/30 bg-destructive/10 text-destructive">
            Revisar cálculo
          </Badge>
        ) : null}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <NumWithUnit label="Dose" value={input.dose_value} unit={input.dose_unit ?? "mg"} units={DOSE_UNITS}
          onValue={(v) => update("dose_value", v)} onUnit={(u) => update("dose_unit", u)} />
        <NumWithUnit label="Volume" value={input.volume_value} unit={input.volume_unit ?? "mL"} units={VOL_UNITS}
          onValue={(v) => update("volume_value", v)} onUnit={(u) => update("volume_unit", u)} />
        <NumWithUnit label="Tempo" value={input.time_value} unit={input.time_unit ?? "minutos"} units={TIME_UNITS}
          onValue={(v) => update("time_value", v)} onUnit={(u) => update("time_unit", u)} />
        {vaso && (
          <div>
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Peso (kg)</Label>
            <Input type="number" inputMode="decimal" className="h-7 text-xs mt-0.5"
              value={input.weight_kg ?? ""} onChange={(e) => update("weight_kg", e.target.value ? Number(e.target.value) : null)} />
          </div>
        )}
      </div>

      {/* Resultados */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 pt-1">
        <CalcLine label="Concentração" value={result.concentracao_calculada != null ? `${fmt(result.concentracao_calculada)} mg/mL` : "—"} />
        <CalcLine label="Conc. máx." value={result.concentracao_maxima != null ? `${fmt(result.concentracao_maxima)} mg/mL` : "não cadastrada"} />
        <CalcLine label="Velocidade" value={result.velocidade_ml_h != null ? `${fmt(result.velocidade_ml_h)} mL/h` : "—"} />
        {result.velocidade_mg_min != null && (
          <CalcLine label="Velocidade" value={`${fmt(result.velocidade_mg_min)} mg/min`} />
        )}
        {result.velocidade_mcg_kg_min != null && (
          <CalcLine label="Vel. mcg/kg/min" value={`${fmt(result.velocidade_mcg_kg_min, 3)} mcg/kg/min`} />
        )}
        <CalcLine label="Vel. máx." value={result.velocidade_maxima_mg_min != null ? `${fmt(result.velocidade_maxima_mg_min)} mg/min` : "não cadastrada"} />
        <CalcLine label="Tempo" value={result.tempo_total_minutos != null ? `${fmt(result.tempo_total_minutos)} min` : "—"} />
        <CalcLine label="Tempo mín." value={result.tempo_minimo_minutos != null ? `${fmt(result.tempo_minimo_minutos)} min` : "não cadastrado"} />
      </div>

      {/* Alertas */}
      {result.alerts.length > 0 && (
        <ul className="space-y-1 pt-1">
          {result.alerts.map((a, i) => (
            <li key={i} className={`flex items-start gap-1.5 ${
              a.gravidade === "alto" ? "text-destructive"
              : a.gravidade === "medio" ? "text-amber-700 dark:text-amber-400"
              : "text-muted-foreground"
            }`}>
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{a.mensagem}{a.exige_justificativa && " (justificativa exigida)"}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Mensagens inline (sem alerta) */}
      {result.mensagens_inline.length > 0 && (
        <ul className="space-y-1">
          {result.mensagens_inline.map((m, i) => (
            <li key={i} className="flex items-start gap-1.5 text-muted-foreground">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{m}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[10px] text-muted-foreground italic pt-1 border-t">
        Cálculos automáticos são ferramentas de apoio. Validar dose, diluição, bomba de infusão e protocolo institucional antes da administração.
      </p>
    </div>
  );
}

function NumWithUnit({
  label, value, unit, units, onValue, onUnit,
}: {
  label: string;
  value: number | null | undefined;
  unit: string;
  units: string[];
  onValue: (v: number | null) => void;
  onUnit: (u: string) => void;
}) {
  return (
    <div>
      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="flex gap-1 mt-0.5">
        <Input type="number" inputMode="decimal" className="h-7 text-xs"
          value={value ?? ""} onChange={(e) => onValue(e.target.value ? Number(e.target.value) : null)} />
        <Select value={unit} onValueChange={onUnit}>
          <SelectTrigger className="h-7 text-xs w-[68px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function CalcLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
