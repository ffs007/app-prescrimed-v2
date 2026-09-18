/**
 * Etapa 2 — Seleção de apresentação + posologia compatível.
 *
 * Regras:
 *  - Só exibe o que está cadastrado no banco. Nada é inventado.
 *  - Auto-seleciona apenas quando existe UMA apresentação utilizável.
 *  - Posologia não revisada aparece marcada e continua editável no documento.
 */
import { useEffect, useMemo, useState } from "react";
import {
  pickAutoPresentation,
  pickPosology,
  useMedicationPresentations,
  type MedicationPresentation,
  type PosologyOption,
} from "../hooks/useLinkedMedications";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

interface Props {
  medicationId: string;
  isPediatric: boolean;
  /** Aplica a escolha no documento (texto editável depois). */
  onApply: (choice: { presentation: MedicationPresentation; posology: PosologyOption | null }) => void;
}

const MedicationPresentationPicker = ({ medicationId, isPediatric, onApply }: Props) => {
  const { data, isLoading, isError, refetch } = useMedicationPresentations(medicationId);
  const list = useMemo(() => data ?? [], [data]);
  const [presentationId, setPresentationId] = useState<string | null>(null);
  const [doseId, setDoseId] = useState<string | null>(null);

  useEffect(() => {
    const auto = pickAutoPresentation(list);
    setPresentationId(auto?.id ?? null);
    setDoseId(null);
  }, [list]);

  const presentation = list.find((p) => p.id === presentationId) ?? null;
  const posologies = presentation?.posologies ?? [];
  const suggested = pickPosology(presentation, isPediatric);
  const posology = posologies.find((p) => p.doseId === doseId) ?? suggested;

  if (isLoading) return <p className="text-[10px] text-ink-muted">Carregando apresentações…</p>;
  if (isError)
    return (
      <button
        type="button"
        onClick={() => refetch()}
        className="rounded-md border border-ink-soft px-2 py-1 text-[10px] font-semibold text-ink-muted hover:text-ink"
      >
        Falha ao carregar apresentações — tentar novamente
      </button>
    );

  if (list.length === 0)
    return (
      <p className="text-[10px] font-semibold text-amber-600">
        Apresentação não cadastrada — preencher manualmente antes de emitir.
      </p>
    );

  return (
    <div className="space-y-1.5 rounded-md border border-ink-soft bg-paper-alt/40 p-2">
      <div className="text-[10px] font-semibold uppercase tracking-editorial text-ink-faint">
        Apresentação{list.length > 1 ? ` · ${list.length} opções` : ""}
      </div>
      <div className="flex flex-wrap gap-1">
        {list.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setPresentationId(p.id);
              setDoseId(null);
            }}
            aria-pressed={p.id === presentationId}
            className={cn(
              "rounded-md border px-2 py-1 text-[10px] transition",
              p.id === presentationId
                ? "border-canon-blue/40 bg-canon-blue/10 text-canon-blue"
                : "border-ink-soft text-ink-muted hover:text-ink",
              !p.usable && "opacity-70",
            )}
          >
            {p.label}
            {!p.reviewed && <span className="ml-1 text-amber-600">•</span>}
          </button>
        ))}
      </div>

      {presentation && (
        <>
          {posologies.length === 0 ? (
            <p className="text-[10px] font-semibold text-amber-600">
              Posologia não cadastrada para esta apresentação — preencher manualmente.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {posologies.map((d) => (
                <button
                  key={d.doseId}
                  type="button"
                  onClick={() => setDoseId(d.doseId)}
                  aria-pressed={d.doseId === posology?.doseId}
                  className={cn(
                    "rounded-md border px-2 py-1 text-left text-[10px] transition",
                    d.doseId === posology?.doseId
                      ? "border-canon-blue/40 bg-canon-blue/10 text-canon-blue"
                      : "border-ink-soft text-ink-muted hover:text-ink",
                  )}
                >
                  <span className="font-medium">{d.text ?? "Dose não cadastrada"}</span>
                  {d.population && <span className="ml-1 text-ink-faint">({d.population})</span>}
                </button>
              ))}
            </div>
          )}

          {(!presentation.reviewed || (posology && !posology.reviewed)) && (
            <p className="text-[10px] font-semibold text-amber-600">
              Dado pendente de revisão — confira antes de emitir.
            </p>
          )}

          <button
            type="button"
            onClick={() => onApply({ presentation, posology })}
            className="rounded-md bg-canon-blue px-2.5 py-1 text-[10px] font-semibold text-primary-foreground hover:bg-canon-blue/90"
          >
            Usar esta apresentação
          </button>
        </>
      )}
    </div>
  );
};

export default MedicationPresentationPicker;
