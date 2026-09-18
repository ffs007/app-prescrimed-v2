import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface AtestadoData {
  days: string;
  cid: string;
  reason: string;
  showCid: boolean;
}

interface Props {
  data: AtestadoData;
  onChange: (data: AtestadoData) => void;
}

const AtestadoForm = ({ data, onChange }: Props) => {
  const update = <K extends keyof AtestadoData>(key: K, value: AtestadoData[K]) =>
    onChange({ ...data, [key]: value });

  return (
    <div className="rounded-lg border border-ink-soft bg-card p-4 shadow-paper sm:p-5">
      <div className="mb-4">
        <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
          Bloco C · construção
        </div>
        <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">
          Atestado médico
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Preencha o período e revise no preview ao lado.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-ink">Dias de afastamento</Label>
          <Input
            value={data.days}
            onChange={(e) => update("days", e.target.value)}
            placeholder="Ex: 3"
            type="number"
            min="1"
            className="h-11 bg-paper-alt/40 border-ink-soft"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-ink">CID-10 (opcional)</Label>
          <Input
            value={data.cid}
            onChange={(e) => update("cid", e.target.value)}
            placeholder="Ex: J03"
            className="h-11 bg-paper-alt/40 border-ink-soft"
          />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-xs font-medium text-ink">Motivo / diagnóstico</Label>
          <Textarea
            value={data.reason}
            onChange={(e) => update("reason", e.target.value)}
            placeholder="Diagnóstico ou motivo clínico"
            className="min-h-[80px] bg-paper-alt/40 border-ink-soft resize-none"
          />
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={data.showCid}
          onChange={(e) => update("showCid", e.target.checked)}
          className="rounded border-ink-soft"
        />
        <span className="text-xs text-ink-muted">Exibir CID no atestado impresso</span>
      </label>
    </div>
  );
};

export default AtestadoForm;
