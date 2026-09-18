import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Stethoscope } from "lucide-react";
import type { ProcedimentoData } from "../services/documentValidation";

export type { ProcedimentoData } from "../services/documentValidation";

const PROCEDIMENTOS_SUGERIDOS = [
  // Curativos & enfermagem
  "Curativo simples",
  "Curativo complexo",
  "Curativo com desbridamento",
  "Retirada de pontos",
  "Troca de sonda vesical de demora",
  "Sondagem vesical de alívio",
  "Cateterismo intermitente",
  "Troca de gastrostomia",
  "Aplicação de medicação IM",
  "Aplicação de medicação EV",
  "Aplicação de medicação SC",
  "Hidratação venosa",
  "Nebulização",
  "Oxigenoterapia domiciliar",
  // Reabilitação
  "Fisioterapia motora",
  "Fisioterapia respiratória",
  "Fisioterapia neurofuncional",
  "Fisioterapia pélvica",
  "Reabilitação cardiovascular",
  "Reabilitação pulmonar",
  "Terapia ocupacional",
  "Fonoaudiologia",
  "Psicoterapia",
  "Nutrição clínica",
  "Acupuntura",
  "Drenagem linfática",
  "RPG (Reeducação Postural Global)",
  "Pilates terapêutico",
  // Pequenos procedimentos ambulatoriais
  "Sutura de pele simples",
  "Exérese de lesão de pele",
  "Cauterização química de verruga",
  "Crioterapia",
  "Infiltração articular",
  "Bloqueio anestésico",
  "Tamponamento nasal anterior",
  "Lavagem otológica",
  "Remoção de cerúmen",
  "Eletrocardiograma à beira do leito",
  "Glicemia capilar seriada",
];

interface Props {
  data: ProcedimentoData;
  onChange: (data: ProcedimentoData) => void;
}

const ProcedimentoForm = ({ data, onChange }: Props) => {
  const update = <K extends keyof ProcedimentoData>(key: K, value: ProcedimentoData[K]) =>
    onChange({ ...data, [key]: value });

  return (
    <div className="rounded-lg border border-ink-soft bg-card p-4 shadow-paper sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-canon-blue/10 text-canon-blue">
          <Stethoscope className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
            Bloco C · construção
          </div>
          <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">
            Solicitação de procedimento
          </h2>
          <p className="mt-1 text-xs text-ink-muted">
            Curativos, terapias e condutas complementares.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-ink">
            Tipo de procedimento <span className="text-destructive">*</span>
          </Label>
          <Input
            value={data.tipo}
            onChange={(e) => update("tipo", e.target.value)}
            placeholder="Ex: Curativo complexo, fisioterapia motora..."
            className="h-11 bg-paper-alt/40 border-ink-soft"
            list="procedimentos-sugeridos"
          />
          <datalist id="procedimentos-sugeridos">
            {PROCEDIMENTOS_SUGERIDOS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {PROCEDIMENTOS_SUGERIDOS.slice(0, 5).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => update("tipo", p)}
                className="rounded-md border border-ink-soft bg-paper-alt/30 px-2 py-1 text-[10px] text-ink-muted hover:border-canon-blue/30 hover:bg-paper-alt/60 hover:text-ink"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-ink">
            Justificativa clínica <span className="text-destructive">*</span>
          </Label>
          <Textarea
            value={data.justificativa}
            onChange={(e) => update("justificativa", e.target.value)}
            placeholder="Indicação clínica do procedimento solicitado"
            rows={3}
            className="resize-none bg-paper-alt/40 border-ink-soft text-sm"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-ink">Contexto / frequência</Label>
            <Input
              value={data.contexto}
              onChange={(e) => update("contexto", e.target.value)}
              placeholder="Ex: 3x/semana por 4 semanas"
              className="h-11 bg-paper-alt/40 border-ink-soft"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-ink">Observações</Label>
            <Input
              value={data.observacoes}
              onChange={(e) => update("observacoes", e.target.value)}
              placeholder="Cuidados, materiais ou detalhes"
              className="h-11 bg-paper-alt/40 border-ink-soft"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcedimentoForm;
