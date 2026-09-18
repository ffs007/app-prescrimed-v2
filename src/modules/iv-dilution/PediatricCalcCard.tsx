import { useEffect, useMemo, useState } from "react";
import { Baby, ChevronDown, ChevronUp, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { IVMedication } from "./IVDilutionAdminPage";
import {
  computePediatricCalc, specFromMedication, isPediatric, fmtNum,
  type PatientPed, type PedCalcResult,
} from "./lib/pediatricCalc";
import { usePediatricSettings } from "./hooks/usePediatricSettings";
import { logPediatricCalc } from "./lib/pediatricCalcLog";

type Props = {
  medication: IVMedication & any;
  patient: PatientPed;
  dose_prescrita?: number | null;
  unidade_prescrita?: string | null;
  frequencia_texto?: string | null;
  concentracao_apresentacao?: number | null;
  /** Forçar exibição mesmo se paciente não-pediátrico (modo manual) */
  forceShow?: boolean;
  onResult?: (r: PedCalcResult) => void;
  idPrescricao?: string | null;
  idPaciente?: string | null;
};

const statusTone = (s: PedCalcResult["status"]) =>
  s === "ok" ? "border-emerald-500/30 bg-emerald-500/5"
  : s === "atencao" ? "border-warning/40 bg-warning/5"
  : s === "critico" ? "border-destructive/30 bg-destructive/5"
  : "border-muted-foreground/30 bg-muted/30";

const statusBadge = (s: PedCalcResult["status"]) =>
  s === "ok" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
  : s === "atencao" ? "border-warning/30 bg-warning/10 text-warning"
  : s === "critico" ? "border-destructive/30 bg-destructive/10 text-destructive"
  : "border-muted-foreground/30 bg-muted text-muted-foreground";

const statusLabel = (s: PedCalcResult["status"]) =>
  s === "ok" ? "dentro da faixa"
  : s === "atencao" ? "revisar"
  : s === "critico" ? "crítico"
  : s === "incompleto" ? "dados insuficientes"
  : "—";

export default function PediatricCalcCard({
  medication, patient, dose_prescrita, unidade_prescrita, frequencia_texto,
  concentracao_apresentacao, forceShow, onResult, idPrescricao, idPaciente,
}: Props) {
  const { settings } = usePediatricSettings();
  const [detailed, setDetailed] = useState(false);

  const ped = isPediatric(patient);
  const spec = useMemo(() => specFromMedication(medication), [medication]);
  const hasPedSpec =
    spec.dose_pediatrica_min != null || spec.dose_pediatrica_max != null ||
    spec.dose_maxima_por_administracao != null || spec.dose_maxima_diaria != null;

  const visible = ped || forceShow || (settings.mostrar_calc_sempre_menor_18 && ped);
  const result = useMemo(
    () => computePediatricCalc({
      patient, spec,
      dose_prescrita: dose_prescrita ?? null,
      unidade_prescrita: unidade_prescrita ?? null,
      frequencia_texto: frequencia_texto ?? null,
      concentracao_apresentacao: concentracao_apresentacao ?? null,
    }, settings),
    [patient, spec, dose_prescrita, unidade_prescrita, frequencia_texto, concentracao_apresentacao, settings],
  );

  useEffect(() => { onResult?.(result); }, [result]); // eslint-disable-line

  // log com debounce 1s quando há alerta
  useEffect(() => {
    if (!visible || result.alerts.length === 0) return;
    const t = setTimeout(() => {
      logPediatricCalc({
        evento: "alerta_gerado",
        input: {
          patient, spec,
          dose_prescrita: dose_prescrita ?? null,
          unidade_prescrita: unidade_prescrita ?? null,
          frequencia_texto: frequencia_texto ?? null,
        },
        result,
        principio_ativo: medication.principio_ativo,
        id_prescricao: idPrescricao ?? null,
        id_paciente: idPaciente ?? null,
      });
    }, 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line
  }, [JSON.stringify({ d: dose_prescrita, u: unidade_prescrita, f: frequencia_texto, p: patient.peso_kg }), result.alerts.length]);

  if (!visible) return null;

  return (
    <div className={`rounded-md border p-3 space-y-2 text-xs ${statusTone(result.status)}`}>
      <div className="flex items-center gap-2">
        <Baby className="h-3.5 w-3.5 text-canon-blue" />
        <span className="font-medium">Cálculo Pediátrico</span>
        <Badge variant="outline" className={`ml-auto text-[10px] ${statusBadge(result.status)}`}>
          {statusLabel(result.status)}
        </Badge>
      </div>

      {/* Modo compacto */}
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-0.5">
        <Row label="Peso" value={patient.peso_kg ? `${fmtNum(patient.peso_kg)} kg` : "—"} />
        <Row label="Dose prescrita" value={dose_prescrita ? `${fmtNum(dose_prescrita)} ${unidade_prescrita ?? ""}` : "—"} />
        <Row label="Equivale a" value={result.dose_mg_kg != null ? `${fmtNum(result.dose_mg_kg, 3)} mg/kg` : "—"} />
        {hasPedSpec ? (
          <Row label="Faixa cadastrada"
            value={
              spec.dose_pediatrica_min != null || spec.dose_pediatrica_max != null
                ? `${fmtNum(spec.dose_pediatrica_min)} – ${fmtNum(spec.dose_pediatrica_max)} ${spec.unidade_dose_pediatrica ?? ""}`
                : "—"
            } />
        ) : (
          <Row label="Faixa cadastrada" value="não cadastrada" />
        )}
        {spec.dose_maxima_por_administracao != null && (
          <Row label="Máx./adm." value={`${fmtNum(spec.dose_maxima_por_administracao)} ${spec.unidade_dose_maxima ?? ""}`} />
        )}
        {result.excesso_percentual != null && (
          <Row label="Excesso" value={`${fmtNum(result.excesso_percentual, 0)}%`} />
        )}
      </dl>

      <button
        type="button"
        onClick={() => setDetailed((v) => !v)}
        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
      >
        {detailed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {detailed ? "Ocultar cálculo" : "Ver cálculo"}
      </button>

      {detailed && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-0.5 border-t pt-1.5">
          <Row label="Idade" value={result.idade_anos_calculada != null ? `${fmtNum(result.idade_anos_calculada, 1)} anos` : "—"} />
          <Row label="Frequência" value={frequencia_texto ?? "—"} />
          <Row label="Adm./dia" value={result.administracoes_por_dia != null ? String(result.administracoes_por_dia) : "—"} />
          <Row label="Dose mínima total" value={result.dose_minima_total != null ? `${fmtNum(result.dose_minima_total)} ${spec.unidade_dose_maxima ?? "mg"}` : "—"} />
          <Row label="Dose máxima total" value={result.dose_maxima_total != null ? `${fmtNum(result.dose_maxima_total)} ${spec.unidade_dose_maxima ?? "mg"}` : "—"} />
          <Row label="Dose diária" value={result.dose_diaria_total != null ? `${fmtNum(result.dose_diaria_total)}` : "—"} />
          <Row label="Dose máx. diária" value={spec.dose_maxima_diaria != null ? `${fmtNum(spec.dose_maxima_diaria)} ${spec.unidade_dose_maxima ?? ""}` : "—"} />
          <Row label="Volume a administrar" value={result.volume_administrar_ml != null ? `${fmtNum(result.volume_administrar_ml, 3)} mL` : "—"} />
          <Row label="Fonte" value={spec.fonte_dose_pediatrica ?? "—"} />
          {!hasPedSpec && (
            <p className="col-span-full text-[11px] text-muted-foreground italic">Dose pediátrica não revisada</p>
          )}
        </div>
      )}

      {result.alerts.length > 0 && (
        <ul className="space-y-1 pt-1 border-t">
          {result.alerts.map((a, i) => (
            <li key={i} className={`flex items-start gap-1.5 ${
              a.gravidade === "alto" ? "text-destructive"
              : a.gravidade === "medio" ? "text-warning"
              : "text-muted-foreground"
            }`}>
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{a.mensagem}{a.exige_justificativa && " (justificativa exigida)"}{a.bloqueia && " (bloqueio)"}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="flex items-start gap-1 text-[10px] italic text-muted-foreground pt-1 border-t">
        <Info className="h-2.5 w-2.5 mt-0.5 shrink-0" />
        Cálculos pediátricos são ferramentas de apoio. Validar dose, peso atual, função renal/hepática, indicação clínica e protocolo institucional.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-muted-foreground shrink-0">{label}:</dt>
      <dd className="font-medium min-w-0 break-words">{value}</dd>
    </div>
  );
}
