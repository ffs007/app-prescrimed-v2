import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, Wand2 } from "lucide-react";
import ReferralModal from "./ReferralModal";

export type UrgenciaNivel = "eletivo" | "prioritario" | "urgente";

export interface EncaminhamentoData {
  especialidade: string;
  hipotese: string;
  resumoClinico: string;
  exames: string;
  urgencia: UrgenciaNivel;
  cid: string;
}

const ESPECIALIDADES = [
  "Cardiologia", "Endocrinologia", "Neurologia", "Ortopedia", "Dermatologia",
  "Gastroenterologia", "Ginecologia", "Pneumologia", "Psiquiatria", "Reumatologia",
  "Urologia", "Otorrinolaringologia", "Oftalmologia", "Pediatria", "Cirurgia geral",
];

const URGENCIA_INFO: Record<UrgenciaNivel, { label: string; desc: string; color: string }> = {
  eletivo: { label: "Eletivo", desc: "Sem urgência clínica", color: "border-ink-soft bg-paper-alt/40 text-ink" },
  prioritario: { label: "Prioritário", desc: "Avaliação em até 30 dias", color: "border-amber-300 bg-amber-50 text-amber-900" },
  urgente: { label: "Urgente", desc: "Avaliação imediata", color: "border-destructive/40 bg-destructive/10 text-destructive" },
};

interface Props {
  data: EncaminhamentoData;
  onChange: (data: EncaminhamentoData) => void;
  /** Patologia ativa do atendimento — habilita o modelo pré-preenchido. */
  pathologyName?: string;
  category?: string;
  /** Propaga os CIDs escolhidos para prescrição, exames e AIH. */
  onCidsSelected?: (principal: string, associados: string[]) => void;
}

const EncaminhamentoForm = ({ data, onChange, pathologyName, category, onCidsSelected }: Props) => {
  const [modalOpen, setModalOpen] = useState(false);
  const update = <K extends keyof EncaminhamentoData>(key: K, value: EncaminhamentoData[K]) =>
    onChange({ ...data, [key]: value });

  return (
    <div className="rounded-lg border border-ink-soft bg-card p-4 shadow-paper sm:p-5 space-y-5">
      <div>
        <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
          Bloco C · construção
        </div>
        <h2 className="font-serif text-lg font-semibold tracking-tight text-ink flex items-center gap-2">
          <Send className="h-5 w-5 text-canon-blue" />
          Encaminhamento
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Especialidade de destino, hipótese diagnóstica e nível de urgência.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 gap-1.5"
          onClick={() => setModalOpen(true)}
        >
          <Wand2 className="h-3.5 w-3.5" />
          Modelo por patologia e CIDs
        </Button>
      </div>

      <ReferralModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        pathologyName={pathologyName ?? ""}
        category={category}
        onApply={({ texto, cidPrincipal, cidsAssociados, destino }) => {
          const cidTexto = [cidPrincipal, ...cidsAssociados].filter(Boolean).join(", ");
          onChange({
            ...data,
            resumoClinico: texto || data.resumoClinico,
            especialidade: destino || data.especialidade,
            hipotese: data.hipotese || pathologyName || "",
            cid: cidTexto || data.cid,
          });
          onCidsSelected?.(cidPrincipal, cidsAssociados);
        }}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-ink">Especialidade de destino *</Label>
          <Input
            value={data.especialidade}
            onChange={(e) => update("especialidade", e.target.value)}
            placeholder="Ex: Cardiologia"
            list="especialidades-list"
            className="h-11 bg-paper-alt/40 border-ink-soft"
          />
          <datalist id="especialidades-list">
            {ESPECIALIDADES.map((s) => <option key={s} value={s} />)}
          </datalist>
          <div className="flex flex-wrap gap-1 pt-1">
            {ESPECIALIDADES.slice(0, 6).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => update("especialidade", s)}
                className="text-[10px] px-2 py-0.5 rounded-full border border-ink-soft text-ink-muted hover:border-canon-blue/40 hover:text-canon-blue transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-ink">CID-10 (opcional)</Label>
          <Input
            value={data.cid}
            onChange={(e) => update("cid", e.target.value)}
            placeholder="Ex: I10"
            className="h-11 bg-paper-alt/40 border-ink-soft"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-ink">Nível de urgência</Label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(URGENCIA_INFO) as UrgenciaNivel[]).map((nivel) => {
            const info = URGENCIA_INFO[nivel];
            const isActive = data.urgencia === nivel;
            return (
              <button
                key={nivel}
                type="button"
                onClick={() => update("urgencia", nivel)}
                className={`rounded-md border p-2.5 text-left transition ${
                  isActive ? `${info.color} ring-2 ring-canon-blue/30` : "border-ink-soft bg-card text-ink-muted hover:border-canon-blue/30"
                }`}
              >
                <div className="text-xs font-semibold">{info.label}</div>
                <div className="text-[10px] mt-0.5 opacity-80">{info.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-ink">Hipótese diagnóstica *</Label>
        <Textarea
          value={data.hipotese}
          onChange={(e) => update("hipotese", e.target.value)}
          placeholder="Hipótese principal e diagnósticos diferenciais"
          className="min-h-[70px] bg-paper-alt/40 border-ink-soft resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-ink">Resumo clínico</Label>
        <Textarea
          value={data.resumoClinico}
          onChange={(e) => update("resumoClinico", e.target.value)}
          placeholder="História clínica relevante, achados ao exame físico, evolução, comorbidades..."
          className="min-h-[120px] bg-paper-alt/40 border-ink-soft resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-ink">Exames já realizados (opcional)</Label>
        <Textarea
          value={data.exames}
          onChange={(e) => update("exames", e.target.value)}
          placeholder="Ex: ECG (12/03): ritmo sinusal. Eco (15/03): FE 55%. Hemograma normal."
          className="min-h-[80px] bg-paper-alt/40 border-ink-soft resize-none"
        />
      </div>
    </div>
  );
};

export default EncaminhamentoForm;
