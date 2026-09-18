import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X, AlertTriangle } from "lucide-react";

export interface OrientacoesData {
  diagnostico: string;
  cuidadosGerais: string;
  sinaisAlarme: string[];
  retornoData: string;
  retornoCondicao: string;
}

interface Props {
  data: OrientacoesData;
  onChange: (data: OrientacoesData) => void;
}

const SUGESTOES_ALARME = [
  "Febre persistente acima de 39°C",
  "Falta de ar ou dificuldade para respirar",
  "Dor torácica",
  "Sangramento ativo",
  "Confusão mental ou sonolência excessiva",
  "Vômitos persistentes",
];

const OrientacoesForm = ({ data, onChange }: Props) => {
  const [novoAlarme, setNovoAlarme] = useState("");

  const update = <K extends keyof OrientacoesData>(key: K, value: OrientacoesData[K]) =>
    onChange({ ...data, [key]: value });

  const addAlarme = (texto: string) => {
    const t = texto.trim();
    if (!t || data.sinaisAlarme.includes(t)) return;
    update("sinaisAlarme", [...data.sinaisAlarme, t]);
    setNovoAlarme("");
  };

  const removeAlarme = (i: number) =>
    update("sinaisAlarme", data.sinaisAlarme.filter((_, idx) => idx !== i));

  return (
    <div className="rounded-lg border border-ink-soft bg-card p-4 shadow-paper sm:p-5">
      <div className="mb-4">
        <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
          Bloco C · construção
        </div>
        <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">
          Orientações & plano de retorno
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Texto claro para o paciente, com sinais de alarme destacados.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-ink">Diagnóstico / condição (opcional)</Label>
          <Input
            value={data.diagnostico}
            onChange={(e) => update("diagnostico", e.target.value)}
            placeholder="Ex: Faringite viral"
            className="h-11 bg-paper-alt/40 border-ink-soft"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-ink">Cuidados gerais</Label>
          <Textarea
            value={data.cuidadosGerais}
            onChange={(e) => update("cuidadosGerais", e.target.value)}
            placeholder="Hidratação adequada, repouso, dieta leve..."
            className="min-h-[100px] bg-paper-alt/40 border-ink-soft resize-none text-sm"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <Label className="text-xs font-medium text-ink">Sinais de alarme — procurar pronto-atendimento</Label>
          </div>

          {data.sinaisAlarme.length > 0 && (
            <ul className="space-y-1.5">
              {data.sinaisAlarme.map((s, i) => (
                <li key={i} className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
                  <span className="text-destructive font-bold text-xs mt-0.5">!</span>
                  <span className="flex-1 text-sm text-ink leading-snug">{s}</span>
                  <button
                    onClick={() => removeAlarme(i)}
                    className="text-ink-faint hover:text-destructive shrink-0"
                    aria-label="Remover"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <Input
              value={novoAlarme}
              onChange={(e) => setNovoAlarme(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAlarme(novoAlarme))}
              placeholder="Adicionar sinal de alarme"
              className="h-10 bg-paper-alt/40 border-ink-soft text-sm"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => addAlarme(novoAlarme)}
              className="h-10 bg-canon-blue text-primary-foreground hover:bg-canon-blue/90 shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {SUGESTOES_ALARME.filter((s) => !data.sinaisAlarme.includes(s)).map((s) => (
              <button
                key={s}
                onClick={() => addAlarme(s)}
                className="text-[11px] px-2 py-1 rounded-full border border-ink-soft bg-paper-alt/40 text-ink-muted hover:border-canon-blue hover:text-canon-blue transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-ink">Data de retorno (opcional)</Label>
            <Input
              type="date"
              value={data.retornoData}
              onChange={(e) => update("retornoData", e.target.value)}
              className="h-11 bg-paper-alt/40 border-ink-soft"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-ink">Condição de retorno</Label>
            <Input
              value={data.retornoCondicao}
              onChange={(e) => update("retornoCondicao", e.target.value)}
              placeholder="Ex: se mantiver sintomas em 48h"
              className="h-11 bg-paper-alt/40 border-ink-soft"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrientacoesForm;
