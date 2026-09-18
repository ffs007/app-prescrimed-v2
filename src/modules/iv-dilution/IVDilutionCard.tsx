import { useMemo, useState } from "react";
import { Copy, Droplets, Info, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import IVMedicationDetailDialog from "./IVMedicationDetailDialog";
import IVAlertList from "./IVAlertList";
import { analyzeIVPrescription, type IVPrescriptionInput } from "./ivSafetyEngine";
import type { IVMedication } from "./IVDilutionAdminPage";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

const toneByLevel = (n: IVMedication["nivel_alerta"]) =>
  n === "alto"
    ? "border-destructive/30 bg-destructive/5"
    : n === "medio"
    ? "border-warning/40 bg-warning/5"
    : "border-canon-blue/30 bg-canon-blue/5";

const alertBadge = (n: IVMedication["nivel_alerta"]) =>
  n === "alto"
    ? "bg-destructive/10 text-destructive border-destructive/30"
    : n === "medio"
    ? "bg-warning/15 text-warning border-warning/40"
    : "bg-canon-blue/10 text-canon-blue border-canon-blue/30";

const alertLabel = (n: IVMedication["nivel_alerta"]) =>
  n === "alto" ? "Alerta alto" : n === "medio" ? "Alerta médio" : "Alerta baixo";

export function buildOrientationText(m: IVMedication) {
  const parts: string[] = [];
  if (m.solucoes_compativeis.length) parts.push(`Diluir em ${m.solucoes_compativeis.join(" ou ")}`);
  if (m.volume_diluicao) parts.push(`volume recomendado: ${m.volume_diluicao}`);
  if (m.concentracao_maxima) parts.push(`concentração máxima: ${m.concentracao_maxima}`);
  if (m.tempo_minimo_infusao) parts.push(`infundir em no mínimo ${m.tempo_minimo_infusao}`);
  if (m.velocidade_maxima_infusao) parts.push(`velocidade máxima: ${m.velocidade_maxima_infusao}`);

  const extras: string[] = [];
  if (m.exige_fotoprotecao) extras.push("proteger da luz");
  if (m.exige_equipo_fotossensivel) extras.push("usar equipo fotossensível");
  if (m.exige_filtro) extras.push("usar filtro em linha");
  if (m.incompatibilidades.length) extras.push(`evitar: ${m.incompatibilidades.join(", ")}`);

  let text = parts.join(", ") + ".";
  if (extras.length) text += " " + extras.join("; ") + ".";
  if (m.alerta_medico) text += " " + m.alerta_medico;
  text += " Validar conforme protocolo institucional.";
  return text;
}

interface Props {
  medication: IVMedication;
}

export default function IVDilutionCard({ medication: m }: Props) {
  const [open, setOpen] = useState(false);
  const [checkOpen, setCheckOpen] = useState(false);
  const [solution, setSolution] = useState("");
  const [doseMg, setDoseMg] = useState("");
  const [volumeMl, setVolumeMl] = useState("");
  const [timeMin, setTimeMin] = useState("");
  const [rate, setRate] = useState("");
  const [justifications, setJustifications] = useState<Record<string, string>>({});

  const input: IVPrescriptionInput = {
    selectedSolution: solution || null,
    doseValueMg: doseMg ? parseFloat(doseMg.replace(",", ".")) : null,
    diluentVolumeMl: volumeMl ? parseFloat(volumeMl.replace(",", ".")) : null,
    infusionTimeMin: timeMin ? parseFloat(timeMin.replace(",", ".")) : null,
    infusionRate: rate || null,
  };

  // Sempre roda — para alertas baseados só nas características (foto, filtro, etc).
  const { alerts } = useMemo(() => analyzeIVPrescription(m, input), [m, solution, doseMg, volumeMl, timeMin, rate]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildOrientationText(m));
      toast.success("Orientação copiada");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <div className={cn("mt-2 rounded-md border p-2.5 text-[12px] space-y-2", toneByLevel(m.nivel_alerta))}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-ink">
          <Droplets className="h-3.5 w-3.5 text-canon-blue" />
          Diluição e Administração IV
        </div>
        <Badge variant="outline" className={alertBadge(m.nivel_alerta)}>
          {alertLabel(m.nivel_alerta)}
        </Badge>
      </div>

      <dl className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
        {m.solucoes_compativeis.length > 0 && (
          <Row label="Soluções compatíveis" value={m.solucoes_compativeis.join(", ")} />
        )}
        {m.volume_diluicao && <Row label="Volume de diluição" value={m.volume_diluicao} />}
        {m.concentracao_maxima && <Row label="Concentração máxima" value={m.concentracao_maxima} />}
        {m.tempo_minimo_infusao && <Row label="Tempo mínimo" value={m.tempo_minimo_infusao} />}
      </dl>

      <div className="flex flex-wrap gap-1">
        {m.exige_fotoprotecao && <Badge variant="secondary" className="text-[10px]">Fotoproteção</Badge>}
        {m.exige_equipo_fotossensivel && <Badge variant="secondary" className="text-[10px]">Equipo fotossensível</Badge>}
        {m.exige_filtro && <Badge variant="secondary" className="text-[10px]">Exige filtro</Badge>}
        {m.risco_flebite && <Badge variant="secondary" className="text-[10px]">Risco de flebite</Badge>}
        {m.incompatibilidades.length > 0 && <Badge variant="secondary" className="text-[10px]">Incompatibilidade</Badge>}
      </div>

      {/* Alertas embutidos (sem inputs) — fotoproteção, filtro, flebite, incompat. cadastradas, dados incompletos */}
      {alerts.length > 0 && (
        <IVAlertList
          alerts={alerts}
          principioAtivo={m.principio_ativo}
          justifications={justifications}
          onConfirmJustification={(t, j) => setJustifications((prev) => ({ ...prev, [t]: j }))}
        />
      )}

      <div className="flex flex-wrap gap-1.5 pt-1">
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setOpen(true)}>
          Ver detalhes
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={handleCopy}>
          <Copy className="h-3 w-3 mr-1" /> Copiar orientação
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setCheckOpen((v) => !v)}>
          <ShieldCheck className="h-3 w-3 mr-1" /> {checkOpen ? "Fechar checagem" : "Checar segurança"}
        </Button>
      </div>

      {checkOpen && (
        <div className="mt-1 rounded-md border bg-card/60 p-2 grid grid-cols-2 gap-2">
          <FieldMini label="Solução / diluente">
            <Input value={solution} onChange={(e) => setSolution(e.target.value)} placeholder="ex: SF 0,9%" className="h-7 text-[11px]" />
          </FieldMini>
          <FieldMini label="Dose total (mg)">
            <Input value={doseMg} onChange={(e) => setDoseMg(e.target.value)} placeholder="ex: 1000" className="h-7 text-[11px]" inputMode="decimal" />
          </FieldMini>
          <FieldMini label="Volume diluição (mL)">
            <Input value={volumeMl} onChange={(e) => setVolumeMl(e.target.value)} placeholder="ex: 100" className="h-7 text-[11px]" inputMode="decimal" />
          </FieldMini>
          <FieldMini label="Tempo de infusão (min)">
            <Input value={timeMin} onChange={(e) => setTimeMin(e.target.value)} placeholder="ex: 60" className="h-7 text-[11px]" inputMode="decimal" />
          </FieldMini>
          <FieldMini label="Velocidade (numérica)" full>
            <Input value={rate} onChange={(e) => setRate(e.target.value)} placeholder="ex: 30 mg/min" className="h-7 text-[11px]" />
          </FieldMini>
        </div>
      )}

      <p className="flex items-start gap-1 text-[10px] italic text-ink-faint pt-0.5">
        <Info className="h-2.5 w-2.5 mt-0.5 shrink-0" />
        Informações de apoio à decisão. Validar conforme protocolo institucional.
      </p>

      {open && (
        <IVMedicationDetailDialog medication={m} open={open} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

function FieldMini({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2 space-y-0.5" : "space-y-0.5"}>
      <Label className="text-[9px] uppercase tracking-wider text-ink-faint">{label}</Label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-ink-faint shrink-0">{label}:</dt>
      <dd className="text-ink min-w-0 break-words">{value}</dd>
    </div>
  );
}

export function IVDilutionMissingHint() {
  return (
    <p className="mt-2 text-[10px] italic text-ink-faint">
      Informações de diluição IV ainda não cadastradas para este medicamento.
    </p>
  );
}
