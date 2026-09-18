import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface DeclaracaoData {
  data: string;
  horaInicio: string;
  horaFim: string;
  acompanhante: string;
  finalidade: string;
}

interface Props {
  data: DeclaracaoData;
  onChange: (data: DeclaracaoData) => void;
}

const DeclaracaoForm = ({ data, onChange }: Props) => {
  const update = <K extends keyof DeclaracaoData>(key: K, value: DeclaracaoData[K]) =>
    onChange({ ...data, [key]: value });

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="rounded-lg border border-ink-soft bg-card p-4 shadow-paper sm:p-5">
      <div className="mb-4">
        <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
          Bloco C · construção
        </div>
        <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">
          Declaração de comparecimento
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Registre data, horário e finalidade do atendimento.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-xs font-medium text-ink">Data do atendimento</Label>
          <Input
            type="date"
            value={data.data || today}
            onChange={(e) => update("data", e.target.value)}
            className="h-11 bg-paper-alt/40 border-ink-soft"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-ink">Hora de início</Label>
          <Input
            type="time"
            value={data.horaInicio}
            onChange={(e) => update("horaInicio", e.target.value)}
            className="h-11 bg-paper-alt/40 border-ink-soft"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-ink">Hora de término</Label>
          <Input
            type="time"
            value={data.horaFim}
            onChange={(e) => update("horaFim", e.target.value)}
            className="h-11 bg-paper-alt/40 border-ink-soft"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-xs font-medium text-ink">Acompanhante (opcional)</Label>
          <Input
            value={data.acompanhante}
            onChange={(e) => update("acompanhante", e.target.value)}
            placeholder="Nome do acompanhante, se houver"
            className="h-11 bg-paper-alt/40 border-ink-soft"
          />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-xs font-medium text-ink">Finalidade (opcional)</Label>
          <Textarea
            value={data.finalidade}
            onChange={(e) => update("finalidade", e.target.value)}
            placeholder="Ex: consulta médica de rotina, retorno, exame..."
            className="min-h-[70px] bg-paper-alt/40 border-ink-soft resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default DeclaracaoForm;
