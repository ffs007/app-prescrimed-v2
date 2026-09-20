import { useMemo, useState } from "react";
import { Loader2, Calculator, RotateCcw, ClipboardCopy, FilePlus2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { describeSupabaseError } from "@/lib/supabaseError";
import { reportError } from "@/lib/reportError";
import { LIST_SIZES, paramLabel, paramOptions, type ScoreDefinition } from "./lib/scoreCatalog";
import {
  buildArgs,
  initialValues,
  outcomeToText,
  runServerScore,
  type FormValues,
  type ScoreOutcome,
} from "./lib/scoreRunner";

const NONE = "__none__";

const TONE_STYLE: Record<ScoreOutcome["tone"], string> = {
  ok: "border-emerald-500/40 bg-emerald-500/5",
  warning: "border-amber-500/50 bg-amber-500/10",
  blocked: "border-destructive/50 bg-destructive/5",
};

const TONE_LABEL: Record<ScoreOutcome["tone"], string> = {
  ok: "Calculado e auditado",
  warning: "Atenção",
  blocked: "Bloqueado",
};

interface Props {
  def: ScoreDefinition;
  atendimentoId: string;
  defaultAge?: number | null;
  onUseResult?: (title: string, text: string) => void;
}

export default function ScoreFunctionForm({ def, atendimentoId, defaultAge, onUseResult }: Props) {
  const [values, setValues] = useState<FormValues>(() => initialValues(def));
  const [age, setAge] = useState(defaultAge != null ? String(defaultAge) : "");
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<ScoreOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);

  const set = (name: string, value: string | boolean | string[]) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setOutcome(null);
  };

  const built = useMemo(() => buildArgs(def, { atendimentoId, ageYears: age }, values), [def, atendimentoId, age, values]);

  const reset = () => {
    setValues(initialValues(def));
    setOutcome(null);
    setError(null);
    setMissing([]);
  };

  const calculate = async () => {
    setError(null);
    setMissing(built.missing);
    if (built.missing.length > 0) {
      setOutcome(null);
      return;
    }
    setBusy(true);
    try {
      setOutcome(await runServerScore(def, built.args));
    } catch (e) {
      setOutcome(null);
      reportError(`score:${def.fn}`, e);
      setError(describeSupabaseError(e));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!outcome) return;
    try {
      await navigator.clipboard.writeText(outcomeToText(def, outcome));
      toast.success("Resultado copiado");
    } catch (e) {
      reportError("score:copy", e, "Não foi possível copiar o resultado.");
    }
  };

  const renderField = (name: string, kind: string) => {
    const label = paramLabel(name);
    const spec = def.params.find((p) => p.name === name)!;
    const options = paramOptions(def.id, name);
    const id = `${def.id}-${name}`;

    if (kind === "boolean") {
      return (
        <div key={name} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
          <Label htmlFor={id} className="text-sm font-normal">{label}</Label>
          <Switch id={id} checked={values[name] === true} onCheckedChange={(v) => set(name, v)} />
        </div>
      );
    }

    if (kind === "list") {
      const cells = (values[name] as string[]) ?? [];
      const listLabel = name === "p_itens" ? "Item" : "Domínio";
      return (
        <div key={name} className="space-y-2 sm:col-span-2">
          <Label className="text-sm">{label}{spec.required && " *"}</Label>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: LIST_SIZES[name] ?? cells.length }, (_, i) => (
              <Input
                key={i}
                inputMode="numeric"
                aria-label={`${listLabel} ${i + 1}`}
                placeholder={`${listLabel} ${i + 1}`}
                value={cells[i] ?? ""}
                onChange={(e) => {
                  const next = [...cells];
                  next[i] = e.target.value;
                  set(name, next);
                }}
              />
            ))}
          </div>
        </div>
      );
    }

    if (options) {
      const current = typeof values[name] === "string" ? (values[name] as string) : "";
      return (
        <div key={name} className="space-y-1.5">
          <Label htmlFor={id} className="text-sm">{label}{spec.required && " *"}</Label>
          <Select value={current || NONE} onValueChange={(v) => set(name, v === NONE ? "" : v)}>
            <SelectTrigger id={id}><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {!spec.required && <SelectItem value={NONE}>Não informado</SelectItem>}
              {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div key={name} className="space-y-1.5">
        <Label htmlFor={id} className="text-sm">{label}{spec.required && " *"}</Label>
        <Input
          id={id}
          inputMode={kind === "number" ? "decimal" : "text"}
          value={typeof values[name] === "string" ? (values[name] as string) : ""}
          onChange={(e) => set(name, e.target.value)}
        />
      </div>
    );
  };

  const booleans = def.params.filter((p) => p.kind === "boolean");
  const others = def.params.filter((p) => p.kind !== "boolean");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {def.ageParam && (
          <div className="space-y-1.5">
            <Label htmlFor={`${def.id}-age`} className="text-sm">Idade (anos) *</Label>
            <Input id={`${def.id}-age`} inputMode="numeric" value={age} onChange={(e) => { setAge(e.target.value); setOutcome(null); }} />
          </div>
        )}
        {others.map((p) => renderField(p.name, p.kind))}
      </div>

      {booleans.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">{booleans.map((p) => renderField(p.name, p.kind))}</div>
      )}

      <p className="text-xs text-muted-foreground">
        Campos com * são obrigatórios. Os limites de cada campo são validados no servidor, que devolve a
        mensagem em caso de valor fora da faixa. Cada cálculo fica registrado na auditoria de escores.
      </p>

      {missing.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Preencha os campos obrigatórios</AlertTitle>
          <AlertDescription>{missing.join(", ")}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível calcular</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void calculate()} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
          Calcular no servidor
        </Button>
        <Button variant="outline" onClick={reset} disabled={busy}>
          <RotateCcw className="mr-2 h-4 w-4" /> Limpar
        </Button>
      </div>

      {outcome && (
        <div className={`space-y-3 rounded-lg border p-4 ${TONE_STYLE[outcome.tone]}`} role="status">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={outcome.tone === "ok" ? "secondary" : outcome.tone === "blocked" ? "destructive" : "outline"}>
              {TONE_LABEL[outcome.tone]}
            </Badge>
            {outcome.status !== "CALCULATED" && <span className="text-xs font-mono">{outcome.status}</span>}
            {outcome.versao && <span className="text-xs text-muted-foreground">versão {outcome.versao}</span>}
          </div>

          {outcome.total !== null && <p className="text-3xl font-semibold tabular-nums">{outcome.total} pontos</p>}
          {outcome.categoria && <p className="text-sm font-medium">{outcome.categoria.replace(/_/g, " ")}</p>}
          {outcome.resposta && <p className="text-sm">{outcome.resposta}</p>}

          {outcome.extras.length > 0 && (
            <dl className="grid gap-1 text-sm sm:grid-cols-2">
              {outcome.extras.map((e) => (
                <div key={e.label} className="flex justify-between gap-2 border-b border-border/50 py-0.5">
                  <dt className="text-muted-foreground">{e.label}</dt>
                  <dd className="font-medium">{e.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {outcome.populacaoValidada === false && (
            <p className="text-xs text-amber-700 dark:text-amber-400">População fora da faixa validada para este escore.</p>
          )}
          {outcome.limitacoes && <p className="text-xs text-muted-foreground">Limitações: {outcome.limitacoes}</p>}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => void copy()}>
              <ClipboardCopy className="mr-2 h-4 w-4" /> Copiar
            </Button>
            {onUseResult && outcome.tone !== "blocked" && (
              <Button size="sm" onClick={() => onUseResult(def.title, outcomeToText(def, outcome))}>
                <FilePlus2 className="mr-2 h-4 w-4" /> Usar no documento
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
