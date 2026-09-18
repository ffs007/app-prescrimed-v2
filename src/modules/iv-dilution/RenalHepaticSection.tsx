import { useEffect, useMemo, useState } from "react";
import { Activity, ChevronDown, ChevronUp, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { IVMedication } from "./IVDilutionAdminPage";
import {
  computeRenalHepaticAlerts, renalSpecFromMedication, hepaticSpecFromMedication,
  classifyLabel, fmtNum,
  type PatientRH, type RHResult,
} from "./lib/renalHepaticCalc";
import { useRenalHepaticSettings } from "./hooks/useRenalHepaticSettings";
import { logRHAlert } from "./lib/renalHepaticLog";

type Props = {
  medication: IVMedication & any;
  patient: PatientRH;
  onResult?: (r: RHResult) => void;
  idPrescricao?: string | null;
  idPaciente?: string | null;
};

const sevTone = (s: "informativo" | "medio" | "alto") =>
  s === "alto" ? "text-destructive"
  : s === "medio" ? "text-warning"
  : "text-muted-foreground";

const classBadge = (c: string) =>
  c === "grave" || c === "dialise" ? "border-destructive/30 bg-destructive/10 text-destructive"
  : c === "importante" ? "border-warning/40 bg-warning/10 text-warning"
  : c === "moderada" ? "border-canon-blue/30 bg-canon-blue/10 text-canon-blue"
  : c === "normal_ou_leve" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
  : "border-muted-foreground/30 bg-muted text-muted-foreground";

export default function RenalHepaticSection({ medication, patient, onResult, idPrescricao, idPaciente }: Props) {
  const { settings } = useRenalHepaticSettings();
  const [expanded, setExpanded] = useState(false);
  const [detailed, setDetailed] = useState(false);

  const renal = useMemo(() => renalSpecFromMedication(medication), [medication]);
  const hepatic = useMemo(() => hepaticSpecFromMedication(medication), [medication]);

  const aplicavel =
    !!(renal.exige_ajuste_funcao_renal || renal.risco_acumulo_renal || renal.risco_nefrotoxicidade ||
       renal.monitorar_creatinina || renal.monitorar_nivel_serico || renal.contraindicado_renal_grave ||
       hepatic.exige_ajuste_funcao_hepatica || hepatic.risco_hepatotoxicidade || hepatic.contraindicado_hepatico_grave);

  const result = useMemo(
    () => computeRenalHepaticAlerts({ patient, renal, hepatic, settings, medAlertaAlto: medication.nivel_alerta === "alto" }),
    [patient, renal, hepatic, settings, medication.nivel_alerta],
  );

  useEffect(() => { onResult?.(result); }, [result]); // eslint-disable-line

  // log com debounce 1s
  useEffect(() => {
    if (!aplicavel || result.alerts.length === 0) return;
    const t = setTimeout(() => {
      result.alerts.forEach((a) => {
        logRHAlert({
          alert: a, patient, result,
          principio_ativo: medication.principio_ativo,
          id_prescricao: idPrescricao ?? null, id_paciente: idPaciente ?? null,
        });
      });
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [JSON.stringify({ cr: patient.creatinina_serica, etfg: patient.etfg, dial: patient.em_hemodialise, child: patient.child_pugh }), result.alerts.length]);

  if (!aplicavel) return null;

  const renalAusente = result.clcr == null && !patient.em_hemodialise && !patient.dialise_peritoneal;
  const principal = result.alerts.find((a) => a.gravidade === "alto") ?? result.alerts[0];

  return (
    <div className="rounded-md border bg-muted/20 p-2.5 space-y-2 text-xs">
      <button onClick={() => setExpanded((v) => !v)} className="w-full flex items-center justify-between gap-2 text-left">
        <span className="flex items-center gap-1.5 font-medium">
          <Activity className="h-3.5 w-3.5 text-canon-blue" />
          Função renal/hepática
          {result.clcr != null && <Badge variant="outline" className="text-[10px]">ClCr {fmtNum(result.clcr, 0)} mL/min</Badge>}
          <Badge variant="outline" className={`text-[10px] ${classBadge(result.classificacao)}`}>{classifyLabel(result.classificacao)}</Badge>
          {renal.exige_ajuste_funcao_renal && <Badge variant="outline" className="text-[10px]">Ajuste renal</Badge>}
          {renal.risco_nefrotoxicidade && <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Nefrotoxicidade</Badge>}
          {renalAusente && renal.exige_ajuste_funcao_renal && <Badge variant="outline" className="text-[10px] border-warning/40 text-warning">Função renal ausente</Badge>}
          {hepatic.exige_ajuste_funcao_hepatica && <Badge variant="outline" className="text-[10px]">Atenção hepática</Badge>}
          {result.alerts.some((a) => a.tipo === "creatinina_desatualizada") && <Badge variant="outline" className="text-[10px]">Creatinina desatualizada</Badge>}
        </span>
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {!expanded && principal && (
        <p className={`flex items-start gap-1 ${sevTone(principal.gravidade)}`}>
          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
          <span>{principal.mensagem}</span>
        </p>
      )}

      {expanded && (
        <>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-0.5">
            <Row label="ClCr / eTFG" value={result.clcr != null ? `${fmtNum(result.clcr, 1)} mL/min` : "—"} />
            <Row label="Classificação" value={classifyLabel(result.classificacao)} />
            <Row label="Método" value={
              result.metodo === "cockcroft_gault" ? "Cockcroft-Gault"
              : result.metodo === "etfg_informada" ? "eTFG informada"
              : result.metodo === "manual" ? "ClCr informado"
              : "—"
            } />
            {patient.creatinina_serica != null && (
              <Row label="Creatinina" value={`${fmtNum(patient.creatinina_serica, 2)} ${patient.unidade_creatinina ?? "mg/dL"}`} />
            )}
            {result.dias_creatinina != null && <Row label="Idade do exame" value={`${result.dias_creatinina} dia(s)`} />}
            {(patient.em_hemodialise || patient.dialise_peritoneal) && <Row label="Diálise" value="sim" />}
          </dl>

          {result.alerts.length > 0 && (
            <ul className="space-y-1 pt-1 border-t">
              {result.alerts.map((a, i) => (
                <li key={i} className={`flex items-start gap-1.5 ${sevTone(a.gravidade)}`}>
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{a.mensagem}{a.exige_justificativa && " (justificativa exigida)"}{a.bloqueia && " (bloqueio)"}</span>
                </li>
              ))}
            </ul>
          )}

          <button type="button" onClick={() => setDetailed((v) => !v)} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
            {detailed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {detailed ? "Ocultar detalhes" : "Ver mais"}
          </button>

          {detailed && (
            <div className="space-y-1 border-t pt-1.5">
              {result.faixa_orientacao && <Row label="Orientação por faixa" value={result.faixa_orientacao} />}
              {renal.observacao_ajuste_renal && <Row label="Obs. renal" value={renal.observacao_ajuste_renal} />}
              {renal.fonte_ajuste_renal && <Row label="Fonte renal" value={renal.fonte_ajuste_renal} />}
              {hepatic.observacao_ajuste_hepatico && <Row label="Obs. hepático" value={hepatic.observacao_ajuste_hepatico} />}
              {hepatic.fonte_ajuste_hepatico && <Row label="Fonte hepático" value={hepatic.fonte_ajuste_hepatico} />}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-0.5 pt-1 border-t">
                {patient.ast != null && <Row label="AST" value={fmtNum(patient.ast)} />}
                {patient.alt != null && <Row label="ALT" value={fmtNum(patient.alt)} />}
                {patient.bilirrubina_total != null && <Row label="Bilir. total" value={fmtNum(patient.bilirrubina_total, 2)} />}
                {patient.albumina != null && <Row label="Albumina" value={fmtNum(patient.albumina, 2)} />}
                {patient.inr != null && <Row label="INR" value={fmtNum(patient.inr, 2)} />}
                {patient.child_pugh && <Row label="Child-Pugh" value={patient.child_pugh} />}
              </div>
            </div>
          )}

          <p className="flex items-start gap-1 text-[10px] italic text-muted-foreground pt-1 border-t">
            <Info className="h-2.5 w-2.5 mt-0.5 shrink-0" />
            Estimativas de função renal/hepática são ferramentas de apoio. Validar dados laboratoriais, condição clínica, peso usado, método de cálculo e protocolo institucional.
          </p>
        </>
      )}
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
