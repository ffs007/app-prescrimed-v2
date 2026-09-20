/**
 * ClinicalCalculatorsPanel — calculadoras clínicas dentro do atendimento.
 *
 * Mostra primeiro as calculadoras sugeridas pelo contexto (patologia, perfil
 * do paciente e medicamentos já escolhidos) e, abaixo, todo o catálogo.
 * O resultado é sempre revisável antes de virar texto do documento.
 */
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Calculator, ChevronDown, Lightbulb, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CALCULATORS,
  CATEGORY_LABEL,
  type CalculatorDef,
  type ResultTone,
} from "./lib/calculators";
import { suggestCalculators, type SuggestionContext } from "./lib/suggestions";
import { hasServerScore, verifyAndAuditScore, type ScoreContext } from "@/modules/scores/lib/serverScoreCheck";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

const TONE_CLASS: Record<ResultTone, string> = {
  neutral: "border-ink-soft bg-paper-alt/40 text-ink",
  info: "border-canon-blue/30 bg-canon-blue/5 text-ink",
  warning: "border-warning/40 bg-warning/5 text-ink",
  danger: "border-destructive/40 bg-destructive/5 text-ink",
};

interface Props extends SuggestionContext {
  /** Injeta o resultado como observação/item do documento. */
  onUseResult?: (title: string, text: string) => void;
  weightKg?: number | null;
  sex?: string;
  /** Atendimento em curso; agrupa a auditoria com os demais escores do mesmo atendimento. */
  atendimentoId?: string;
}

interface CardProps {
  def: CalculatorDef;
  reason?: string;
  autofill: Record<string, string>;
  onUseResult?: (title: string, text: string) => void;
  defaultOpen?: boolean;
  scoreContext: ScoreContext;
}

const CalculatorCard = ({ def, reason, autofill, onUseResult, defaultOpen, scoreContext }: CardProps) => {
  const [open, setOpen] = useState(!!defaultOpen);
  const [auditing, setAuditing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() => ({ ...autofill }));

  const result = useMemo(() => {
    const filled: Record<string, string> = {};
    for (const f of def.fields) filled[f.key] = values[f.key] ?? autofill[f.key] ?? "";
    try {
      return def.compute(filled);
    } catch (error) {
      console.error(`Falha ao calcular ${def.short}`, error);
      return null;
    }
  }, [def, values, autofill]);

  /** Escores com função SQL equivalente são conferidos e auditados no servidor antes de entrar no documento. */
  const useResult = async () => {
    if (!result || !onUseResult) return;
    if (!hasServerScore(def.id)) {
      onUseResult(def.short, result.text);
      return;
    }
    const filled: Record<string, string> = {};
    for (const f of def.fields) filled[f.key] = values[f.key] ?? autofill[f.key] ?? "";
    setAuditing(true);
    try {
      const check = await verifyAndAuditScore(def.id, filled, scoreContext, result.headline);
      if (check.kind === "rejected") {
        toast.error(`${def.short}: cálculo recusado pelo servidor`, { description: check.message });
        return;
      }
      if (check.kind === "divergent") {
        toast.error(`${def.short}: divergência entre o cálculo local e o servidor`, {
          description: `Local: ${check.localTotal} ponto(s) · Servidor: ${check.serverTotal} ponto(s). Revise as entradas.`,
        });
        return;
      }
      if (check.kind === "ok") toast.success(`${def.short} registrado na auditoria de escores`);
      onUseResult(def.short, result.text);
    } catch (error) {
      console.error(`Falha ao auditar ${def.short}`, error);
      toast.error(`${def.short}: não foi possível registrar na auditoria`, {
        description: "O resultado não foi inserido no documento. Tente novamente.",
      });
    } finally {
      setAuditing(false);
    }
  };

  return (
    <div className="rounded-md border border-ink-soft bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left"
      >
        <Calculator className="mt-0.5 h-4 w-4 shrink-0 text-canon-blue" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium leading-tight text-ink">{def.short}</span>
          <span className="mt-0.5 block text-[11px] text-ink-muted">
            {reason ?? `${CATEGORY_LABEL[def.category]} · ${def.name}`}
          </span>
        </span>
        <ChevronDown
          className={cn("mt-0.5 h-4 w-4 shrink-0 text-ink-muted transition", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="border-t border-ink-soft px-3 py-3">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {def.fields.map((f) => (
              <label key={f.key} className="block">
                <span className="mb-1 block text-[11px] font-medium text-ink-muted">
                  {f.label}
                  {f.unit ? ` (${f.unit})` : ""}
                  {f.optional ? " · opcional" : ""}
                </span>
                {f.kind === "select" ? (
                  <Select
                    value={values[f.key] ?? autofill[f.key] ?? ""}
                    onValueChange={(val) => setValues((s) => ({ ...s, [f.key]: val }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {(f.options ?? []).map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    inputMode="decimal"
                    className="h-9"
                    value={values[f.key] ?? autofill[f.key] ?? ""}
                    onChange={(e) => setValues((s) => ({ ...s, [f.key]: e.target.value }))}
                  />
                )}
              </label>
            ))}
          </div>

          {result ? (
            <div className={cn("mt-3 rounded-md border p-3", TONE_CLASS[result.tone])}>
              <div className="text-base font-semibold leading-tight">{result.headline}</div>
              <div className="mt-0.5 text-xs text-ink-muted">{result.interpretation}</div>
              {result.details && result.details.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-ink-muted">
                  {result.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
              {onUseResult && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2.5 h-7 gap-1 px-2 text-[11px]"
                  disabled={auditing}
                  onClick={() => void useResult()}
                >
                  <Plus className="h-3 w-3" />
                  {auditing ? "Registrando…" : "Usar no documento"}
                </Button>
              )}
            </div>
          ) : (
            <p className="mt-3 text-[11px] text-ink-muted">
              Preencha os campos para ver o resultado.
            </p>
          )}

          <p className="mt-2 text-[10px] uppercase tracking-editorial text-ink-faint">
            Referência: {def.reference}
          </p>
        </div>
      )}
    </div>
  );
};

const ClinicalCalculatorsPanel = ({ onUseResult, weightKg, sex, atendimentoId: providedAtendimentoId, ...ctx }: Props) => {
  const [term, setTerm] = useState("");
  const generatedAtendimentoId = useRef(`atd-${crypto.randomUUID()}`);
  const atendimentoId = providedAtendimentoId ?? generatedAtendimentoId.current;

  const suggestions = useMemo(() => suggestCalculators(ctx), [ctx]);
  const suggestedIds = new Set(suggestions.map((s) => s.calculator.id));

  const autofill = useMemo(() => {
    const a: Record<string, string> = {};
    if (weightKg) a.weight = String(weightKg);
    if (ctx.ageInYears) a.age = String(ctx.ageInYears);
    if (sex === "M" || sex === "F") a.sex = sex;
    return a;
  }, [weightKg, ctx.ageInYears, sex]);

  const scoreContext = useMemo<ScoreContext>(
    () => ({ atendimentoId, ageYears: ctx.ageInYears ? Math.floor(ctx.ageInYears) : null }),
    [atendimentoId, ctx.ageInYears],
  );

  const q = term.trim().toLowerCase();
  const rest = CALCULATORS.filter(
    (c) =>
      !suggestedIds.has(c.id) &&
      (!q ||
        c.name.toLowerCase().includes(q) ||
        c.short.toLowerCase().includes(q) ||
        CATEGORY_LABEL[c.category].toLowerCase().includes(q)),
  );

  return (
    <div className="rounded-lg border border-ink-soft bg-card p-4 shadow-paper">
      <div className="mb-3">
        <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
          Calculadoras clínicas
        </div>
        <h3 className="font-serif text-base font-semibold text-ink">
          Cálculos conforme o perfil e a condição
        </h3>
      </div>

      {suggestions.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-editorial text-ink-faint">
            <Lightbulb className="h-3.5 w-3.5 text-warning" />
            Sugeridas para este atendimento
          </div>
          <div className="space-y-1.5">
            {suggestions.slice(0, 4).map((s, i) => (
              <CalculatorCard
                key={s.calculator.id}
                def={s.calculator}
                reason={s.reason}
                autofill={autofill}
                onUseResult={onUseResult}
                defaultOpen={i === 0}
                scoreContext={scoreContext}
              />
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar calculadora — ex: clearance, superfície corporal, Child-Pugh"
          className="pl-9"
          aria-label="Buscar calculadora clínica"
        />
      </div>

      <div className="mt-2.5 space-y-1.5">
        {rest.map((c) => (
          <CalculatorCard key={c.id} def={c} autofill={autofill} onUseResult={onUseResult} scoreContext={scoreContext} />
        ))}
        {rest.length === 0 && (
          <p className="text-xs text-ink-muted">Nenhuma calculadora encontrada para essa busca.</p>
        )}
      </div>
    </div>
  );
};

export default ClinicalCalculatorsPanel;
