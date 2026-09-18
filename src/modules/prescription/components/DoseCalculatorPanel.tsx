/**
 * DoseCalculatorPanel — calculadora de dose condicionada ao perfil do paciente.
 *
 * Busca o princípio ativo na base clínica (`base_medicamentos_dose`), aplica o
 * peso e a faixa etária do paciente e devolve a dose pronta para virar item da
 * receita.
 */
import { useState } from "react";
import { Calculator, AlertTriangle, Plus, Search, Baby, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDoseReference, computeDose, type DoseRow } from "../hooks/useDoseReference";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

interface Props {
  isPediatric: boolean;
  weightKg: number | null;
  /** Injeta a dose calculada como item manual da receita. */
  onAdd: (name: string, text: string) => void;
}

const buildText = (row: DoseRow, doseLabel: string) =>
  [
    doseLabel,
    row.via ? `via ${row.via}` : "",
    row.frequencia ?? "",
    row.duracao ? `por ${row.duracao}` : "",
  ]
    .filter(Boolean)
    .join(" — ");

const DoseCalculatorPanel = ({ isPediatric, weightKg, onAdd }: Props) => {
  const [term, setTerm] = useState("");
  const { data: rows, isLoading, isError } = useDoseReference(term, isPediatric);

  return (
    <div className="rounded-lg border border-ink-soft bg-card p-4 shadow-paper">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
            Calculadora de dose
          </div>
          <h3 className="font-serif text-base font-semibold text-ink">
            Dose ajustada ao paciente
          </h3>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink-soft bg-paper-alt/50 px-2.5 py-1 text-[10px] font-medium text-ink-muted">
          {isPediatric ? <Baby className="h-3 w-3" /> : <User className="h-3 w-3" />}
          {isPediatric ? "Pediátrico" : "Adulto"}
          {weightKg ? ` · ${weightKg} kg` : ""}
        </span>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder='Princípio ativo — ex: "amoxicilina", "adrenalina"'
          className="pl-9"
          aria-label="Buscar princípio ativo para calcular a dose"
        />
      </div>

      {isPediatric && !weightKg && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-2.5 text-[11px] text-ink">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          Informe o peso no Bloco A para calcular doses por kg.
        </div>
      )}

      <div className="mt-3 space-y-2">
        {term.trim().length >= 2 && isLoading && (
          <div className="h-10 animate-pulse rounded-md bg-paper-alt" />
        )}
        {isError && (
          <p className="text-xs text-destructive">Não foi possível consultar a base de doses.</p>
        )}
        {term.trim().length >= 2 && !isLoading && (rows?.length ?? 0) === 0 && (
          <p className="text-xs text-ink-muted">Nenhuma dose de referência encontrada.</p>
        )}

        {(rows ?? []).map((row) => {
          const dose = computeDose(row, weightKg);
          return (
            <div
              key={row.id}
              className="flex items-start gap-2.5 rounded-md border border-ink-soft bg-paper-alt/30 p-2.5"
            >
              <Calculator className="mt-0.5 h-4 w-4 shrink-0 text-canon-blue" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium leading-tight text-ink">
                  {row.principio_ativo}{" "}
                  <span className="text-[11px] font-normal text-ink-muted">· {row.via}</span>
                </div>
                <div
                  className={cn(
                    "mt-0.5 text-sm font-semibold",
                    dose.exceedsMax ? "text-destructive" : "text-canon-blue",
                  )}
                >
                  {dose.label}
                </div>
                <div className="mt-0.5 text-[11px] text-ink-muted">
                  {[
                    row.indicacao,
                    row.frequencia,
                    row.dose_maxima_dia
                      ? `máx ${row.dose_maxima_dia} ${row.dose_maxima_dia_unidade ?? ""}/dia`
                      : null,
                    row.observacao_dose,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                {(dose.exceedsMax ||
                  row.revisao_farmaceutica_obrigatoria ||
                  row.dose_pendente_de_fonte) && (
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-warning">
                    <AlertTriangle className="h-3 w-3" />
                    {dose.exceedsMax
                      ? "Acima da dose máxima diária — revise."
                      : row.revisao_farmaceutica_obrigatoria
                      ? "Revisão farmacêutica obrigatória."
                      : "Dose ainda pendente de fonte."}
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 shrink-0 gap-1 px-2 text-[11px]"
                disabled={dose.needsWeight}
                onClick={() => onAdd(row.principio_ativo, buildText(row, dose.label))}
              >
                <Plus className="h-3 w-3" />
                Usar
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DoseCalculatorPanel;
