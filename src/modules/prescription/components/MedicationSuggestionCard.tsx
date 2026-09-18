/**
 * MedicationSuggestionCard — card rico de sugestão terapêutica.
 *
 * Mostra:
 *  - nome + apresentação
 *  - dose / via / frequência / duração editáveis inline
 *  - badge de linha (1ª, alternativa, sintomático, suporte)
 *  - flags de segurança (gestação, peso pediátrico, renal, controlado)
 *  - botão "Adicionar à receita"
 *
 * O card é totalmente controlado: o pai é dono do estado de edição
 * para permitir múltiplos cards expandidos sem interferência.
 */
import { useState } from "react";
import { Check, ChevronDown, AlertTriangle, Pill, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LINE_LABELS,
  LINE_TOKENS,
  type SuggestionLine,
} from "../data/pathologyProtocols";
import type { Suggestion, SuggestionFlag } from "../services/suggestionEngine";
import { composePosology } from "../services/suggestionEngine";
import { useIVMedicationLookup, isIVRoute } from "@/modules/iv-dilution/useIVMedicationLookup";
import { IVDilutionMissingHint } from "@/modules/iv-dilution/IVDilutionCard";
import IVPrescriberCard from "@/modules/iv-dilution/IVPrescriberCard";
import IVMatchHint from "@/modules/iv-dilution/IVMatchHint";
import type { IVMedication } from "@/modules/iv-dilution/IVDilutionAdminPage";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

interface Props {
  suggestion: Suggestion;
  isSelected: boolean;
  onAdd: (final: Suggestion) => void;
}

const flagTone: Record<SuggestionFlag["kind"], string> = {
  "pregnancy-unsafe": "bg-destructive/10 text-destructive border-destructive/30",
  "needs-weight": "bg-warning/10 text-warning border-warning/30",
  "renal-caution": "bg-warning/10 text-warning border-warning/30",
  controlled: "bg-canon-blue/10 text-canon-blue border-canon-blue/30",
};

const flagLabel: Record<SuggestionFlag["kind"], string> = {
  "pregnancy-unsafe": "Gestação",
  "needs-weight": "Peso",
  "renal-caution": "Renal",
  controlled: "Controlado",
};

const MedicationSuggestionCard = ({ suggestion, isSelected, onAdd }: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Suggestion>(suggestion);

  // Sincroniza quando a sugestão de origem muda (ex: peso/idade alterado).
  // useState inicial não roda de novo — leve hack: comparar key.
  if (draft.key !== suggestion.key) {
    setDraft(suggestion);
  }

  const lineToken = LINE_TOKENS[draft.line as SuggestionLine];
  const blocked = draft.flags.some((f) => f.kind === "pregnancy-unsafe");
  const ivActive = isIVRoute(draft.route);
  const { data: ivAuto, match: ivMatch, checked: ivChecked } = useIVMedicationLookup(
    ivActive ? draft.medicationName : null,
  );
  const [ivManual, setIvManual] = useState<IVMedication | null>(null);
  const ivInfo = ivAuto ?? ivManual;

  const update = <K extends keyof Suggestion>(key: K, value: Suggestion[K]) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      next.posologyText = composePosology({
        dose: next.dose,
        route: next.route,
        frequency: next.frequency,
        duration: next.duration,
      });
      return next;
    });
  };

  const handleAdd = () => {
    if (blocked || isSelected) return;
    onAdd(draft);
  };

  return (
    <div
      className={cn(
        "group rounded-lg border bg-card transition shadow-sm",
        draft.highlight ? "border-canon-blue/40" : "border-ink-soft",
        isSelected && "border-canon-blue/60 bg-canon-blue/5",
        blocked && "border-destructive/30 bg-destructive/5",
        editing && "ring-2 ring-canon-blue/30",
      )}
    >
      {/* Cabeçalho */}
      <div className="flex items-start gap-2.5 p-3">
        <span
          className={cn(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
            blocked ? "bg-destructive/10 text-destructive" : "bg-canon-blue/10 text-canon-blue",
          )}
        >
          <Pill className="h-3.5 w-3.5" />
        </span>

        <div className="min-w-0 flex-1">
          {/* Linha 1: nome + badge linha + highlight */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-ink truncate">{draft.medicationName}</span>
            <span
              className={cn(
                "inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                lineToken.badge,
              )}
            >
              {LINE_LABELS[draft.line as SuggestionLine]}
            </span>
            {draft.highlight && (
              <span className="text-[9px] font-semibold uppercase tracking-wider text-canon-blue">★</span>
            )}
          </div>

          {/* Linha 2: apresentação */}
          {draft.presentation && (
            <div className="mt-0.5 text-[11px] text-ink-faint">{draft.presentation}</div>
          )}

          {/* Linha 3: posologia (modo leitura) */}
          {!editing && (
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              {draft.posologyText || (
                <span className="italic text-ink-faint">Toque em editar para preencher</span>
              )}
            </p>
          )}

          {/* Observação clínica */}
          {draft.note && !editing && (
            <p className="mt-1 text-[11px] italic text-ink-faint">{draft.note}</p>
          )}

          {/* Flags */}
          {draft.flags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {draft.flags.map((f, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium",
                    flagTone[f.kind],
                  )}
                  title={f.message}
                >
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {flagLabel[f.kind]}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Ações: editar + adicionar */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <button
            onClick={() => setEditing((v) => !v)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-ink-muted transition hover:bg-paper-alt hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canon-blue"
            aria-label={editing ? "Fechar edição" : "Editar"}
          >
            <Pencil className="h-3 w-3" />
            {editing ? "Fechar" : "Editar"}
            <ChevronDown className={cn("h-3 w-3 transition", editing && "rotate-180")} />
          </button>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={isSelected || blocked}
            className={cn(
              "h-7 px-2.5 text-[10px] font-semibold",
              isSelected
                ? "border border-canon-blue/40 bg-canon-blue/10 text-canon-blue hover:bg-canon-blue/10"
                : blocked
                ? "bg-destructive/10 text-destructive hover:bg-destructive/10"
                : "bg-canon-blue text-primary-foreground hover:bg-canon-blue/90",
            )}
          >
            {isSelected ? (
              <>
                <Check className="mr-1 h-3 w-3" />
                Adicionado
              </>
            ) : blocked ? (
              "Bloqueado"
            ) : (
              "Usar"
            )}
          </Button>
        </div>
      </div>

      {/* Painel de edição inline */}
      {editing && (
        <div className="border-t border-ink-soft/60 bg-paper-alt/40 p-3 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <Field
              label="Dose"
              value={draft.dose}
              onChange={(v) => update("dose", v)}
              placeholder="ex: 1 comprimido"
            />
            <Field
              label="Via"
              value={draft.route}
              onChange={(v) => update("route", v)}
              placeholder="VO"
            />
            <Field
              label="Frequência"
              value={draft.frequency}
              onChange={(v) => update("frequency", v)}
              placeholder="de 8/8h"
            />
            <Field
              label="Duração"
              value={draft.duration}
              onChange={(v) => update("duration", v)}
              placeholder="por 7 dias"
            />
          </div>
          <Field
            label="Apresentação"
            value={draft.presentation}
            onChange={(v) => update("presentation", v)}
            placeholder="500 mg comprimido"
          />
          <div className="rounded-md border border-canon-blue/20 bg-card px-2.5 py-1.5 text-[11px] text-ink">
            <span className="font-medium text-ink-faint">Prévia: </span>
            {draft.posologyText || <span className="italic text-ink-faint">vazio</span>}
          </div>
        </div>
      )}

      {/* Card de Diluição IV — apenas exibição, não bloqueia */}
      {ivActive && (
        <div className="px-3 pb-3 space-y-2">
          {ivInfo ? (
            <IVPrescriberCard medication={ivInfo} />
          ) : ivChecked ? (
            <IVDilutionMissingHint />
          ) : null}
          {ivChecked && !ivAuto && ivMatch && (
            <IVMatchHint
              query={draft.medicationName}
              match={ivMatch}
              onConfirm={(m) => setIvManual(m)}
            />
          )}
        </div>
      )}
    </div>
  );
};

const Field = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <div className="space-y-1">
    <Label className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
      {label}
    </Label>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-8 text-xs bg-card border-ink-soft"
    />
  </div>
);

export default MedicationSuggestionCard;
