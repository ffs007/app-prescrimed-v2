import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Copy, ShieldAlert, ShieldCheck, AlertTriangle, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  analyzeIVPrescription,
  parseFirstNumber,
  type IVAlert,
  type IVPrescriptionInput,
} from "./ivSafetyEngine";
import { logIVAlert } from "./ivAlertHistory";
import { buildOrientationText } from "./IVDilutionCard";
import type { IVMedication } from "./IVDilutionAdminPage";
import { Baby } from "lucide-react";
import {
  computePediatricCalc, specFromMedication, isPediatric, calcIdadeAnos, fmtNum,
  type PatientPed,
} from "./lib/pediatricCalc";
import { usePediatricSettings } from "./hooks/usePediatricSettings";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

export interface IVReviewMedication {
  medication: IVMedication;
  /** Dose textual prescrita (ex: "1 g"). */
  doseLabel?: string;
  prescription: IVPrescriptionInput;
}

interface Props {
  open: boolean;
  onClose: () => void;
  medications: IVReviewMedication[];
  /** Chamado quando o usuário finaliza com sucesso (sem bloqueios). */
  onFinalize: () => void;
  idPrescricao?: string;
  idPaciente?: string;
  /** Dados pediátricos opcionais para a Revisão Pediátrica. */
  patient?: PatientPed;
}

interface MedReviewState {
  prescription: IVPrescriptionInput;
  justifications: Record<string, string>;
  expanded: boolean;
}

const sevTone = (s: IVAlert["severity"]) =>
  s === "blocker"
    ? "border-destructive/30 bg-destructive/5 text-destructive"
    : s === "warning"
    ? "border-warning/40 bg-warning/5 text-warning"
    : "border-ink-soft bg-paper-alt/40 text-ink-muted";

const cardTone = (status: "blocker" | "warning" | "info" | "ok") =>
  status === "blocker"
    ? "border-destructive/30 bg-destructive/5"
    : status === "warning"
    ? "border-warning/40 bg-warning/5"
    : status === "info"
    ? "border-canon-blue/30 bg-canon-blue/5"
    : "border-emerald-500/30 bg-emerald-500/5";

const summarizeMed = (med: IVMedication, p: IVPrescriptionInput) => {
  const parts: string[] = [`${med.principio_ativo}:`];
  const detail: string[] = [];
  if (med.solucoes_compativeis.length) detail.push(`Diluir em ${med.solucoes_compativeis.join(" ou ")}`);
  if (p.diluentVolumeMl) detail.push(`volume: ${p.diluentVolumeMl} mL`);
  else if (med.volume_diluicao) detail.push(`volume recomendado: ${med.volume_diluicao}`);
  if (med.concentracao_maxima) detail.push(`concentração máxima: ${med.concentracao_maxima}`);
  if (p.infusionTimeMin) detail.push(`infundir em ${p.infusionTimeMin} min`);
  else if (med.tempo_minimo_infusao) detail.push(`infundir em no mínimo ${med.tempo_minimo_infusao}`);
  if (med.exige_fotoprotecao) detail.push("proteger da luz");
  if (med.exige_filtro) detail.push("usar filtro em linha");
  if (med.incompatibilidades.length) detail.push(`evitar: ${med.incompatibilidades.join(", ")}`);
  parts.push(detail.join(", ") + ".");
  if (med.alerta_enfermagem_farmacia) parts.push(med.alerta_enfermagem_farmacia);
  return parts.join(" ");
};

export default function IVSafetyReviewDialog({
  open, onClose, medications, onFinalize, idPrescricao, idPaciente, patient,
}: Props) {
  const [state, setState] = useState<MedReviewState[]>(() =>
    medications.map((m) => ({
      prescription: m.prescription,
      justifications: {},
      expanded: false,
    })),
  );
  const [copied, setCopied] = useState(false);

  // Re-sincroniza se a lista de medicamentos mudar
  useMemo(() => {
    setState((prev) =>
      medications.map((m, i) => prev[i] ?? { prescription: m.prescription, justifications: {}, expanded: false }),
    );
  }, [medications.length]);

  const analyses = useMemo(
    () =>
      medications.map((m, i) =>
        analyzeIVPrescription(m.medication, state[i]?.prescription ?? m.prescription),
      ),
    [medications, state],
  );

  // Resumo
  const summary = useMemo(() => {
    let high = 0, mid = 0, info = 0, blockers = 0, hardBlocks = 0;
    analyses.forEach((a) => {
      a.alerts.forEach((al) => {
        if (al.severity === "blocker") {
          blockers++;
          if (al.hardBlock) hardBlocks++;
        }
        if (al.severity === "warning") mid++;
        if (al.severity === "info") info++;
      });
      a.alerts.forEach((al) => {
        if (al.severity === "blocker" || (al.severity === "warning" && al.requiresJustification)) high++;
      });
    });
    return { high, mid, info, blockers, hardBlocks };
  }, [analyses]);

  // Pendências de justificativa
  const pendingJustifications = analyses.flatMap((a, idx) =>
    a.alerts
      .filter((al) => al.requiresJustification && !al.hardBlock && !state[idx]?.justifications[al.type])
      .map((al) => ({ medIndex: idx, alert: al })),
  );

  const canFinalize = summary.hardBlocks === 0 && pendingJustifications.length === 0;

  const updateField = (i: number, patch: Partial<IVPrescriptionInput>) =>
    setState((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, prescription: { ...s.prescription, ...patch } } : s)),
    );

  const toggleExpand = (i: number) =>
    setState((prev) => prev.map((s, idx) => (idx === i ? { ...s, expanded: !s.expanded } : s)));

  const setJustification = (i: number, type: string, j: string) =>
    setState((prev) =>
      prev.map((s, idx) =>
        idx === i ? { ...s, justifications: { ...s.justifications, [type]: j } } : s,
      ),
    );

  const fullOrientationText = () => {
    const parts = ["Orientações de administração IV:"];
    medications.forEach((m, i) => {
      parts.push("");
      parts.push(summarizeMed(m.medication, state[i]?.prescription ?? m.prescription));
    });
    parts.push("");
    parts.push("Validar conforme protocolo institucional.");
    return parts.join("\n");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullOrientationText());
      setCopied(true);
      toast.success("Orientações copiadas");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const persistReview = async (
    status:
      | "finalizada_sem_alertas"
      | "finalizada_com_alertas_informativos"
      | "finalizada_com_justificativa"
      | "bloqueada_pelo_sistema"
      | "retornou_para_edicao",
  ) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const justList = state.flatMap((s, i) =>
      Object.entries(s.justifications).map(([type, j]) => ({
        principio_ativo: medications[i].medication.principio_ativo,
        tipo_alerta: type,
        justificativa: j,
      })),
    );
    const { error: historyError } = await supabase.from("historico_revisao_seguranca_iv").insert({
      usuario_responsavel: session.user.id,
      id_prescricao: idPrescricao ?? null,
      id_paciente: idPaciente ?? null,
      medicamentos_iv_revisados: medications.map((m) => m.medication.principio_ativo),
      quantidade_alertas_altos: summary.high,
      quantidade_alertas_medios: summary.mid,
      quantidade_alertas_informativos: summary.info,
      bloqueios_identificados: summary.blockers,
      bloqueios_corrigidos: 0,
      justificativas_registradas: justList,
      orientacoes_copiadas: copied,
      status_finalizacao: status,
    });
    if (historyError) throw historyError;
  };

  const handleFinalize = async () => {
    if (!canFinalize) return;
    const status = summary.high > 0
      ? "finalizada_com_justificativa"
      : summary.mid > 0 || summary.info > 0
      ? "finalizada_com_alertas_informativos"
      : "finalizada_sem_alertas";
    await persistReview(status as any);
    onFinalize();
  };

  const handleBack = async () => {
    if (medications.length > 0) await persistReview("retornou_para_edicao");
    onClose();
  };

  const blockerItems = analyses.flatMap((a, idx) =>
    a.alerts.filter((al) => al.hardBlock).map((al) => ({ med: medications[idx].medication, alert: al })),
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleBack()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 sm:p-5 border-b sticky top-0 bg-card z-10">
          <DialogTitle className="text-base sm:text-lg">Revisão de Segurança IV</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Confira os principais pontos de diluição e administração antes de finalizar.
          </p>
        </DialogHeader>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <SummaryStat label="Medicamentos IV" value={medications.length} tone="info" />
            <SummaryStat label="Alertas altos" value={summary.high} tone={summary.high ? "blocker" : "ok"} />
            <SummaryStat label="Alertas médios" value={summary.mid} tone={summary.mid ? "warning" : "ok"} />
            <SummaryStat label="Informativos" value={summary.info} tone="info" />
            <SummaryStat label="Bloqueios" value={summary.hardBlocks} tone={summary.hardBlocks ? "blocker" : "ok"} />
          </div>

          {/* Bloqueios pendentes */}
          {blockerItems.length > 0 && (
            <section className={cn("rounded-md border p-3 space-y-2", cardTone("blocker"))}>
              <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <ShieldAlert className="h-4 w-4" />
                Pendências antes de finalizar
              </div>
              <p className="text-[11px] text-ink-muted">
                Existem pendências que precisam ser corrigidas antes de finalizar.
              </p>
              <ul className="space-y-1.5">
                {blockerItems.map((b, i) => (
                  <li key={i} className="rounded bg-card/60 p-2 text-[11px]">
                    <div className="font-semibold text-ink">{b.med.principio_ativo}</div>
                    <div><span className="text-ink-faint">Problema:</span> {b.alert.message}</div>
                    <div><span className="text-ink-faint">Ação necessária:</span> alterar a prescrição antes de finalizar.</div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <PediatricReviewSection medications={medications} patient={patient} />


          {/* Alertas que exigem confirmação */}
          {pendingJustifications.length > 0 && (
            <section className={cn("rounded-md border p-3 space-y-2", cardTone("warning"))}>
              <div className="flex items-center gap-2 text-sm font-semibold text-warning">
                <AlertTriangle className="h-4 w-4" />
                Alertas que exigem confirmação
              </div>
              <ul className="space-y-2">
                {pendingJustifications.map(({ medIndex, alert }, i) => (
                  <li key={i} className="rounded bg-card/60 p-2 text-[11px] space-y-1">
                    <div className="font-semibold text-ink">{medications[medIndex].medication.principio_ativo}</div>
                    <div><span className="text-ink-faint">Alerta:</span> {alert.message}</div>
                    {alert.prescribedValue && (
                      <div><span className="text-ink-faint">Prescrito:</span> {alert.prescribedValue}</div>
                    )}
                    {alert.recommendedValue && (
                      <div><span className="text-ink-faint">Recomendado:</span> {alert.recommendedValue}</div>
                    )}
                    <Textarea
                      rows={2}
                      placeholder="Justificativa clínica para manter a prescrição (obrigatório)"
                      className="text-[11px]"
                      value={state[medIndex]?.justifications[alert.type] ?? ""}
                      onChange={(e) => setJustification(medIndex, alert.type, e.target.value)}
                      onBlur={() => {
                        const j = state[medIndex]?.justifications[alert.type]?.trim();
                        if (j)
                          logIVAlert({
                            alert,
                            principio_ativo: medications[medIndex].medication.principio_ativo,
                            acao: "confirmou_com_justificativa",
                            justificativa: j,
                            id_prescricao: idPrescricao,
                            id_paciente: idPaciente,
                          });
                      }}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Cards por medicamento */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Medicamentos IV ({medications.length})
            </h3>
            {medications.map((m, i) => {
              const a = analyses[i];
              const top: "blocker" | "warning" | "info" | "ok" =
                a.alerts.some((al) => al.severity === "blocker")
                  ? "blocker"
                  : a.alerts.some((al) => al.severity === "warning")
                  ? "warning"
                  : a.alerts.length > 0
                  ? "info"
                  : "ok";
              const expanded = state[i]?.expanded;
              const main = a.alerts[0];
              return (
                <article key={i} className={cn("rounded-md border", cardTone(top))}>
                  <button
                    type="button"
                    onClick={() => toggleExpand(i)}
                    className="w-full flex items-center justify-between gap-2 p-3 text-left"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-ink truncate">{m.medication.principio_ativo}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className="text-[9px]">
                          {m.medication.nivel_alerta === "alto" ? "Alerta alto" : m.medication.nivel_alerta === "medio" ? "Alerta médio" : "Alerta baixo"}
                        </Badge>
                        {m.medication.exige_fotoprotecao && <Badge variant="secondary" className="text-[9px]">Fotoproteção</Badge>}
                        {m.medication.exige_equipo_fotossensivel && <Badge variant="secondary" className="text-[9px]">Equipo fotossensível</Badge>}
                        {m.medication.exige_filtro && <Badge variant="secondary" className="text-[9px]">Exige filtro</Badge>}
                        {m.medication.risco_flebite && <Badge variant="secondary" className="text-[9px]">Risco de flebite</Badge>}
                        {m.medication.incompatibilidades.length > 0 && <Badge variant="secondary" className="text-[9px]">Incompatibilidade</Badge>}
                        {a.alerts.some((al) => al.type === "concentracao_acima_max") && <Badge variant="outline" className="text-[9px] border-destructive/40 text-destructive">Concentração acima da máx.</Badge>}
                        {a.alerts.some((al) => al.type === "tempo_infusao_baixo") && <Badge variant="outline" className="text-[9px] border-warning/40 text-warning">Tempo abaixo</Badge>}
                        {a.alerts.some((al) => al.type === "velocidade_infusao_alta") && <Badge variant="outline" className="text-[9px] border-destructive/40 text-destructive">Velocidade acima</Badge>}
                        {a.alerts.some((al) => al.type === "dados_incompletos") && <Badge variant="outline" className="text-[9px]">Dados incompletos</Badge>}
                      </div>
                      {!expanded && main && (
                        <div className="text-[11px] text-ink-muted mt-1 truncate">
                          {main.message}
                        </div>
                      )}
                    </div>
                    {expanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                  </button>

                  {expanded && (
                    <div className="border-t p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <ReadOnly label="Dose prescrita" value={m.doseLabel ?? (state[i]?.prescription.doseValueMg ? `${state[i].prescription.doseValueMg} mg` : undefined)} />
                        <EditableField
                          label="Solução escolhida"
                          value={state[i]?.prescription.selectedSolution ?? ""}
                          onChange={(v) => updateField(i, { selectedSolution: v })}
                          placeholder={m.medication.solucoes_compativeis.join(" / ") || "ex: SF 0,9%"}
                        />
                        <EditableNum
                          label="Volume diluição (mL)"
                          value={state[i]?.prescription.diluentVolumeMl ?? null}
                          onChange={(v) => updateField(i, { diluentVolumeMl: v })}
                          placeholder={m.medication.volume_diluicao ?? ""}
                        />
                        <EditableNum
                          label="Dose (mg)"
                          value={state[i]?.prescription.doseValueMg ?? null}
                          onChange={(v) => updateField(i, { doseValueMg: v })}
                        />
                        <ReadOnly
                          label="Concentração calculada"
                          value={
                            state[i]?.prescription.doseValueMg && state[i]?.prescription.diluentVolumeMl
                              ? `${(state[i]!.prescription.doseValueMg! / state[i]!.prescription.diluentVolumeMl!).toFixed(2)} mg/mL`
                              : "—"
                          }
                        />
                        <ReadOnly label="Concentração máxima" value={m.medication.concentracao_maxima ?? "—"} />
                        <EditableNum
                          label="Tempo de infusão (min)"
                          value={state[i]?.prescription.infusionTimeMin ?? null}
                          onChange={(v) => updateField(i, { infusionTimeMin: v })}
                          placeholder={m.medication.tempo_minimo_infusao ?? ""}
                        />
                        <ReadOnly label="Tempo mínimo recomendado" value={m.medication.tempo_minimo_infusao ?? "—"} />
                        <EditableField
                          label="Velocidade informada"
                          value={state[i]?.prescription.infusionRate ?? ""}
                          onChange={(v) => updateField(i, { infusionRate: v })}
                          placeholder="ex: 30 mg/min"
                        />
                          <ReadOnly label="Velocidade máxima" value={m.medication.velocidade_maxima_infusao ?? "—"} />
                        </div>
                        {(() => {
                          const p = state[i]?.prescription;
                          const missing: string[] = [];
                          if (!p?.diluentVolumeMl) missing.push("volume");
                          if (!p?.infusionTimeMin) missing.push("tempo");
                          if (missing.length) return (
                            <p className="text-[11px] text-muted-foreground italic">
                              Cálculo IV incompleto. Dados ausentes: {missing.join(", ")}.
                            </p>
                          );
                          return null;
                        })()}

                      {a.alerts.length > 0 && (
                        <ul className="space-y-1.5">
                          {a.alerts.map((al, k) => (
                            <li key={k} className={cn("rounded border px-2 py-1.5 text-[11px]", sevTone(al.severity))}>
                              <div className="flex items-center gap-1.5">
                                {al.severity === "blocker" ? <ShieldAlert className="h-3 w-3" /> : al.severity === "warning" ? <AlertTriangle className="h-3 w-3" /> : <Info className="h-3 w-3" />}
                                <span className="text-ink">{al.message}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}

                      {m.medication.alerta_enfermagem_farmacia && (
                        <div className="rounded bg-card/60 p-2 text-[11px]">
                          <div className="text-[9px] font-semibold uppercase tracking-wider text-ink-faint mb-0.5">
                            Orientação enfermagem / farmácia
                          </div>
                          <p className="text-ink-muted">{m.medication.alerta_enfermagem_farmacia}</p>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </section>

          <p className="text-[10px] italic text-ink-faint border-t pt-2">
            Esta revisão é uma ferramenta de apoio à decisão clínica. As informações devem ser
            validadas conforme protocolo institucional, farmácia clínica e condições do paciente.
          </p>
        </div>

        <footer className="sticky bottom-0 bg-card border-t p-3 flex flex-wrap gap-2 justify-end z-10">
          <Button variant="outline" onClick={handleBack}>Voltar e editar prescrição</Button>
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5 mr-1" /> Copiar orientações
          </Button>
          <Button onClick={handleFinalize} disabled={!canFinalize}>
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            {summary.hardBlocks > 0
              ? "Bloqueado pelo sistema"
              : pendingJustifications.length > 0
              ? "Justificar pendências"
              : "Finalizar prescrição"}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone: "blocker" | "warning" | "info" | "ok" }) {
  return (
    <div className={cn("rounded-md border p-2 text-center", cardTone(tone))}>
      <div className="text-lg font-bold text-ink">{value}</div>
      <div className="text-[10px] text-ink-muted leading-tight">{label}</div>
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-0.5">
      <Label className="text-[9px] uppercase tracking-wider text-ink-faint">{label}</Label>
      <div className="text-ink truncate">{value || "—"}</div>
    </div>
  );
}

function EditableField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-0.5">
      <Label className="text-[9px] uppercase tracking-wider text-ink-faint">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-7 text-[11px]" />
    </div>
  );
}

function EditableNum({ label, value, onChange, placeholder }: { label: string; value: number | null; onChange: (v: number | null) => void; placeholder?: string }) {
  return (
    <div className="space-y-0.5">
      <Label className="text-[9px] uppercase tracking-wider text-ink-faint">{label}</Label>
      <Input
        value={value == null ? "" : String(value)}
        onChange={(e) => {
          const v = e.target.value.replace(",", ".");
          if (!v) onChange(null);
          else {
            const n = parseFloat(v);
            onChange(isNaN(n) ? null : n);
          }
        }}
        placeholder={placeholder}
        className="h-7 text-[11px]"
        inputMode="decimal"
      />
    </div>
  );
}

// Re-export para conveniência
export { parseFirstNumber };

function PediatricReviewSection({
  medications, patient,
}: { medications: IVReviewMedication[]; patient?: PatientPed }) {
  const { settings } = usePediatricSettings();
  if (!patient || !isPediatric(patient)) return null;

  const idade = calcIdadeAnos(patient);
  const items = medications
    .map((m) => {
      const med = m.medication as any;
      const spec = specFromMedication(med);
      const dosePrescNum = parseFirstNumber(m.doseLabel ?? "");
      const result = computePediatricCalc({
        patient, spec,
        dose_prescrita: dosePrescNum,
        unidade_prescrita: "mg",
        frequencia_texto: null,
      }, settings);
      return { med, spec, result, doseLabel: m.doseLabel };
    });

  const pendentes = items.filter((it) => it.result.bloqueios.length || it.result.pendencias_justificativa.length);

  return (
    <section className="rounded-md border border-canon-blue/30 bg-canon-blue/5 p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Baby className="h-4 w-4 text-canon-blue" />
        Revisão Pediátrica
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <div><span className="text-ink-faint">Pediátrico:</span> sim</div>
        <div><span className="text-ink-faint">Idade:</span> {idade != null ? `${fmtNum(idade, 1)} anos` : "—"}</div>
        <div><span className="text-ink-faint">Peso:</span> {patient.peso_kg ? `${fmtNum(patient.peso_kg)} kg` : "—"}</div>
        <div><span className="text-ink-faint">Medicamentos:</span> {items.length}</div>
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="rounded bg-card/60 p-2 text-[11px] space-y-0.5">
            <div className="font-semibold">{it.med.principio_ativo}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3">
              <span><span className="text-ink-faint">Dose:</span> {it.doseLabel ?? "—"}</span>
              <span><span className="text-ink-faint">mg/kg:</span> {it.result.dose_mg_kg != null ? fmtNum(it.result.dose_mg_kg, 3) : "—"}</span>
              <span><span className="text-ink-faint">Faixa:</span> {it.spec.dose_pediatrica_min != null || it.spec.dose_pediatrica_max != null ? `${fmtNum(it.spec.dose_pediatrica_min)}–${fmtNum(it.spec.dose_pediatrica_max)} ${it.spec.unidade_dose_pediatrica ?? ""}` : "não cadastrada"}</span>
              <span><span className="text-ink-faint">Máx./adm.:</span> {it.spec.dose_maxima_por_administracao != null ? fmtNum(it.spec.dose_maxima_por_administracao) : "—"}</span>
            </div>
            {it.result.alerts.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {it.result.alerts.map((a, j) => (
                  <li key={j} className={a.gravidade === "alto" ? "text-destructive" : a.gravidade === "medio" ? "text-warning" : "text-ink-faint"}>
                    • {a.mensagem}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {pendentes.length > 0 && (
        <p className="text-xs font-medium text-destructive">
          Existem pendências pediátricas antes de finalizar.
        </p>
      )}
    </section>
  );
}
