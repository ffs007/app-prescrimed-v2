import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface RelatorioData {
  /** Texto livre do relatório de atendimento. */
  conteudo: string;
  cid: string;
  destinatario: string;
}

interface Props {
  data: RelatorioData;
  onChange: (data: RelatorioData) => void;
}

const RelatorioForm = ({ data, onChange }: Props) => {
  const update = <K extends keyof RelatorioData>(key: K, value: RelatorioData[K]) =>
    onChange({ ...data, [key]: value });

  return (
    <div className="rounded-lg border border-ink-soft bg-card p-4 shadow-paper sm:p-5">
      <div className="mb-4">
        <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
          Bloco C · construção
        </div>
        <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">
          Relatório de atendimento
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Relatório simples — descreva o atendimento em texto livre.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 mb-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-ink">Destinatário (opcional)</Label>
          <Input
            value={data.destinatario}
            onChange={(e) => update("destinatario", e.target.value)}
            placeholder="Ex: Perícia médica do INSS"
            className="h-11 bg-paper-alt/40 border-ink-soft"
          />
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
        <Label className="text-xs font-medium text-ink">Relatório</Label>
        <Textarea
          value={data.conteudo}
          onChange={(e) => update("conteudo", e.target.value)}
          placeholder="Descreva o quadro clínico, a conduta adotada e as orientações dadas ao paciente..."
          className="min-h-[220px] bg-paper-alt/40 border-ink-soft resize-none text-sm leading-6"
        />
        <p className="text-[10px] text-ink-faint">
          Texto livre — será impresso exatamente como digitado.
        </p>
      </div>
    </div>
  );
};

export default RelatorioForm;
