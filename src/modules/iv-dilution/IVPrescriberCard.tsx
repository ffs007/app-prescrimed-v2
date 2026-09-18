import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Droplets, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import IVMedicationDetailDialog from "./IVMedicationDetailDialog";
import IVPreparationDialog from "./IVPreparationDialog";
import type { IVMedication } from "./IVDilutionAdminPage";
import { buildNursingCopyText } from "./lib/ivFormatters";
import { logIVView } from "./lib/ivViewLog";
import IVCalcSection from "./IVCalcSection";
import PediatricCalcCard from "./PediatricCalcCard";
import type { PatientPed } from "./lib/pediatricCalc";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

const tone = (n: IVMedication["nivel_alerta"]) =>
  n === "alto" ? "border-destructive/30 bg-destructive/5"
  : n === "medio" ? "border-warning/40 bg-warning/5"
  : "border-canon-blue/30 bg-canon-blue/5";

const badge = (n: IVMedication["nivel_alerta"]) =>
  n === "alto" ? "bg-destructive/10 text-destructive border-destructive/30"
  : n === "medio" ? "bg-warning/15 text-warning border-warning/40"
  : "bg-canon-blue/10 text-canon-blue border-canon-blue/30";

const label = (n: IVMedication["nivel_alerta"]) =>
  n === "alto" ? "alto" : n === "medio" ? "médio" : "baixo";

interface Props {
  medication: IVMedication;
  /** Quando true, mostra texto longo de orientação no card. Padrão: false. */
  showLongOrientation?: boolean;
  perfil?: string;
  /** Dados do paciente para cálculo pediátrico (opcional). */
  patient?: PatientPed;
  /** Dose prescrita (numérica) e unidade — para cálculo pediátrico/mg/kg. */
  dosePrescrita?: number | null;
  unidadePrescrita?: string | null;
  frequenciaTexto?: string | null;
  concentracaoApresentacao?: number | null;
}

/**
 * Card compacto "Segurança IV" para o prescritor.
 * - Recolhido por padrão em mobile (mostra cabeçalho + badges).
 * - Expandido mostra dados essenciais e ações.
 * - "Ver detalhes" abre modal completo. "Preparo/Administração" abre visão técnica.
 */
export default function IVPrescriberCard({
  medication: m, showLongOrientation = false, perfil,
  patient, dosePrescrita, unidadePrescrita, frequenciaTexto, concentracaoApresentacao,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [details, setDetails] = useState(false);
  const [prep, setPrep] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildNursingCopyText(m));
      toast.success("Orientação copiada");
      logIVView({ principio_ativo: m.principio_ativo, tipo_visualizacao: "card_medico", acao_realizada: "copiou_orientacao", perfil_usuario: perfil });
    } catch { toast.error("Não foi possível copiar"); }
  };

  return (
    <div className={cn("mt-2 rounded-md border p-2.5 text-[12px] space-y-1.5", tone(m.nivel_alerta))}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-1.5 font-semibold text-ink">
          <Droplets className="h-3.5 w-3.5 text-canon-blue" />
          Segurança IV
          <Badge variant="outline" className={cn("ml-1 text-[10px]", badge(m.nivel_alerta))}>{label(m.nivel_alerta)}</Badge>
        </span>
        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-ink-faint" /> : <ChevronDown className="h-3.5 w-3.5 text-ink-faint" />}
      </button>

      {expanded && (
        <>
          <dl className="grid grid-cols-1 gap-x-3 gap-y-0.5 sm:grid-cols-2">
            {m.solucoes_compativeis?.length > 0 && <Row label="Diluição" value={m.solucoes_compativeis.join(" ou ")} />}
            {m.volume_diluicao && <Row label="Volume" value={m.volume_diluicao} />}
            {m.concentracao_maxima && <Row label="Máx." value={m.concentracao_maxima} />}
            {m.tempo_minimo_infusao && <Row label="Infusão" value={`≥ ${m.tempo_minimo_infusao}`} />}
          </dl>

          {m.alerta_medico && (
            <p className="text-[11px] text-ink leading-snug"><strong>Atenção:</strong> {m.alerta_medico}</p>
          )}

          <div className="flex flex-wrap gap-1">
            {m.concentracao_maxima && <Badge variant="secondary" className="text-[10px]">conc. máx.</Badge>}
            {m.tempo_minimo_infusao && <Badge variant="secondary" className="text-[10px]">tempo mín.</Badge>}
            {m.exige_fotoprotecao && <Badge variant="secondary" className="text-[10px]">fotoproteção</Badge>}
            {m.exige_filtro && <Badge variant="secondary" className="text-[10px]">filtro</Badge>}
            {m.incompatibilidades?.length > 0 && <Badge variant="secondary" className="text-[10px]">incompatibilidade</Badge>}
          </div>

          {showLongOrientation && m.alerta_enfermagem_farmacia && (
            <p className="text-[11px] text-ink-faint leading-snug">{m.alerta_enfermagem_farmacia}</p>
          )}

          <div className="flex flex-wrap gap-1.5 pt-1">
            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => { setDetails(true); logIVView({ principio_ativo: m.principio_ativo, tipo_visualizacao: "card_medico", acao_realizada: "expandiu_detalhes", perfil_usuario: perfil }); }}>
              Ver detalhes
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => { setPrep(true); logIVView({ principio_ativo: m.principio_ativo, tipo_visualizacao: "orientacao_enfermagem_farmacia", acao_realizada: "visualizou", perfil_usuario: perfil }); }}>
              Preparo/Administração
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={copy}>
              <Copy className="h-3 w-3 mr-1" /> Copiar orientação
            </Button>
          </div>

          <IVCalcSection medication={m} />

          {patient && (
            <PediatricCalcCard
              medication={m as any}
              patient={patient}
              dose_prescrita={dosePrescrita ?? null}
              unidade_prescrita={unidadePrescrita ?? null}
              frequencia_texto={frequenciaTexto ?? null}
              concentracao_apresentacao={concentracaoApresentacao ?? null}
            />
          )}

          <p className="flex items-start gap-1 text-[10px] italic text-ink-faint pt-0.5">
            <Info className="h-2.5 w-2.5 mt-0.5 shrink-0" />
            Informação de apoio. Validar conforme protocolo institucional.
          </p>
        </>
      )}

      {details && <IVMedicationDetailDialog medication={m} open={details} onClose={() => setDetails(false)} />}
      {prep && <IVPreparationDialog medication={m} open={prep} onClose={() => setPrep(false)} perfil={perfil} />}
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
