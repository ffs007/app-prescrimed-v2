/**
 * MedicationExplorer — bloco de medicamentos contextual (Etapa 4).
 *
 * Três abas: Sugeridos (vínculos do quadro no ambiente, ordenados por papel
 * terapêutico e revisão), Meus atalhos (favoritos e recentes) e Buscar na base.
 * Tudo vem do motor único `services/clinicalSuggestions`. Nada é adicionado
 * automaticamente, nenhuma dose é inventada e nada não revisado aparece antes
 * do que já foi revisado.
 */
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Clock, Search, Sparkles, Star } from "lucide-react";
import type { Medication } from "@/types/prescription";
import type { ClinicalEnvironment } from "../types/prescription";
import {
  GROUP_LABELS,
  ROLE_LABELS,
  recordToMedication,
  suggestionToMedication,
  useClinicalSuggestions,
  useFavoriteMedications,
  useMedicationBaseCount,
  useMedicationSearch,
  useRecentMedications,
  type ClinicalSuggestion,
  type SuggestionGroup,
} from "../hooks/useLinkedMedications";
import { filterRelevant, pushRecentMedication, type QuickMedication } from "../services/quickAccess";
import MedicationPresentationPicker from "./MedicationPresentationPicker";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

type TabKey = "sugeridos" | "atalhos" | "base";

const GROUP_ORDER: SuggestionGroup[] = [1, 2, 3, 4];

interface Props {
  conditionName?: string | null;
  syndromeName?: string | null;
  environment: ClinicalEnvironment;
  selected: Array<{ id: number }>;
  isPediatric: boolean;
  isPregnant: boolean;
  onAddMedication: (med: Medication) => void;
}

const MedRow = ({
  med,
  hint,
  badge,
  isSelected,
  unsafe,
  warning,
  incomplete,
  pendingReview,
  onAdd,
}: {
  med: Medication;
  hint?: string | null;
  badge?: string | null;
  isSelected: boolean;
  unsafe: boolean;
  warning?: string | null;
  incomplete?: boolean;
  pendingReview?: boolean;
  onAdd: () => void;
}) => (
  <div
    className={cn(
      "flex items-start gap-2 rounded-md border p-2 text-xs",
      unsafe
        ? "border-destructive/30 bg-destructive/5"
        : isSelected
        ? "border-canon-blue/30 bg-canon-blue/5"
        : "border-ink-soft bg-paper-alt/30",
    )}
  >
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-medium text-ink">{med.name}</span>
        {badge && (
          <span className="rounded border border-ink-soft px-1 py-px text-[9px] font-semibold uppercase tracking-editorial text-ink-faint">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-ink-muted">{med.dosage}</p>
      {hint && <p className="mt-0.5 text-[10px] text-ink-faint">{hint}</p>}
      {pendingReview && (
        <p className="mt-0.5 text-[10px] font-semibold text-amber-600">
          Vínculo ainda não revisado — conferir antes de prescrever
        </p>
      )}
      {incomplete && (
        <p className="mt-0.5 text-[10px] font-semibold text-amber-600">Dose não cadastrada — revisar antes de emitir</p>
      )}
      {unsafe && warning && <p className="mt-0.5 text-[10px] font-semibold text-destructive">{warning}</p>}
    </div>
    <button
      type="button"
      onClick={onAdd}
      disabled={isSelected}
      aria-label={`Adicionar ${med.name}`}
      className={cn(
        "shrink-0 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        isSelected
          ? "border border-canon-blue/30 bg-canon-blue/10 text-canon-blue"
          : "bg-canon-blue text-primary-foreground hover:bg-canon-blue/90",
      )}
    >
      {isSelected ? "✓" : "+"}
    </button>
  </div>
);

const quickToMedication = (q: QuickMedication): Medication => ({
  id: Math.abs(Array.from(q.name).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 7)),
  name: q.name,
  category: "Meus atalhos",
  dosage: q.dose ?? "Dose não cadastrada — preencher manualmente",
  instructions: [q.presentation, q.route, q.frequency, q.duration, q.notes].filter(Boolean).join(" · "),
});

const MedicationExplorer = ({
  conditionName,
  syndromeName,
  environment,
  selected,
  isPediatric,
  isPregnant,
  onAddMedication,
}: Props) => {
  const [tab, setTab] = useState<TabKey>("sugeridos");
  const [term, setTerm] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const suggestionsQuery = useClinicalSuggestions({
    condition: conditionName,
    syndrome: syndromeName,
    environment,
    patient: { isPediatric, isPregnant },
  });
  const search = useMedicationSearch(term);
  const baseCount = useMedicationBaseCount();
  const favorites = useFavoriteMedications();
  const { recents, remember } = useRecentMedications();

  const suggestions = suggestionsQuery.data?.suggestions ?? [];
  const byGroup = useMemo(() => {
    const out: Record<SuggestionGroup, ClinicalSuggestion[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const s of suggestions) out[s.group].push(s);
    return out;
  }, [suggestions]);

  const suggestionNames = useMemo(() => suggestions.map((s) => s.name), [suggestions]);
  const relevantFavorites = useMemo(
    () => filterRelevant(favorites.data ?? [], suggestionNames),
    [favorites.data, suggestionNames],
  );
  const relevantRecents = useMemo(() => filterRelevant(recents, suggestionNames), [recents, suggestionNames]);

  const isSelected = (id: number) => selected.some((s) => s.id === id);
  const loading = suggestionsQuery.isLoading;
  const total = suggestions.length;
  const shortcuts = relevantFavorites.length + relevantRecents.length;

  const searchMeds = (search.data ?? []).map((r) => ({ record: r, med: recordToMedication(r, isPediatric) }));

  const add = (med: Medication, quick?: QuickMedication) => {
    onAddMedication(med);
    const entry: QuickMedication =
      quick ??
      {
        medicationId: null,
        name: med.name,
        activeIngredient: null,
        presentation: null,
        route: null,
        dose: med.dosage ?? null,
        frequency: null,
        duration: null,
        notes: null,
      };
    remember(pushRecentMedication(entry));
  };

  const TABS: Array<{ key: TabKey; label: string; icon: typeof Sparkles }> = [
    { key: "sugeridos", label: `Sugeridos${total ? ` · ${total}` : ""}`, icon: Sparkles },
    { key: "atalhos", label: `Meus atalhos${shortcuts ? ` · ${shortcuts}` : ""}`, icon: Star },
    { key: "base", label: `Buscar na base${baseCount.data ? ` · ${baseCount.data}` : ""}`, icon: Search },
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold transition",
              tab === key
                ? "border-canon-blue/40 bg-canon-blue/10 text-canon-blue"
                : "border-ink-soft text-ink-muted hover:text-ink",
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {tab === "sugeridos" && (
        <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
          {loading && <p className="text-[11px] text-ink-muted">Carregando sugestões…</p>}
          {suggestionsQuery.isError && !loading && (
            <div className="space-y-1">
              <p className="text-[11px] text-destructive">Não foi possível carregar as sugestões.</p>
              <button
                type="button"
                onClick={() => suggestionsQuery.refetch()}
                className="rounded-md border border-ink-soft px-2 py-1 text-[10px] font-semibold text-ink-muted hover:text-ink"
              >
                Tentar novamente
              </button>
            </div>
          )}
          {!loading && !suggestionsQuery.isError && total === 0 && (
            <p className="text-[11px] text-ink-muted">
              Ainda não há conduta medicamentosa cadastrada para este quadro e ambiente. Use a busca na base para
              inclusão manual.
            </p>
          )}
          {GROUP_ORDER.map((group) => {
            const items = byGroup[group];
            if (!items || items.length === 0) return null;
            return (
              <div key={group} className="space-y-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-editorial text-ink-faint">
                  {GROUP_LABELS[group]} · {items.length}
                </div>
                {items.map((s) => {
                  const med = suggestionToMedication(s, isPediatric);
                  return (
                    <MedRow
                      key={s.linkId}
                      med={med}
                      badge={ROLE_LABELS[s.role]}
                      hint={[s.presentation, s.duration, s.notes, ...s.patientAlerts]
                        .filter(Boolean)
                        .join(" · ")}
                      isSelected={isSelected(med.id)}
                      unsafe={s.flags.unsafeForPatient}
                      warning={
                        isPregnant && s.flags.avoidInPregnancy
                          ? "Evitar na gestação"
                          : s.flags.renalAdjustment
                          ? "Requer ajuste renal"
                          : s.flags.hepaticAdjustment
                          ? "Requer ajuste hepático"
                          : null
                      }
                      incomplete={s.flags.incompleteDose}
                      pendingReview={!s.linkReviewed}
                      onAdd={() =>
                        add(med, {
                          medicationId: s.medicationId,
                          name: s.name,
                          activeIngredient: s.activeIngredient,
                          presentation: s.presentation,
                          route: s.route,
                          dose: isPediatric ? s.pediatricDose ?? s.adultDose : s.adultDose,
                          frequency: s.frequency,
                          duration: s.duration,
                          notes: s.notes,
                        })
                      }
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {tab === "atalhos" && (
        <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
          {shortcuts === 0 && (
            <p className="text-[11px] text-ink-muted">
              Sem favoritos ou uso recente ainda. Os medicamentos que você usar aparecem aqui.
            </p>
          )}
          {relevantFavorites.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-editorial text-ink-faint">
                <Star className="h-3 w-3" /> Favoritos · {relevantFavorites.length}
              </div>
              {relevantFavorites.map((q, i) => {
                const med = quickToMedication(q);
                return (
                  <MedRow
                    key={`fav-${q.name}-${i}`}
                    med={med}
                    hint={[q.presentation, q.route, q.frequency].filter(Boolean).join(" · ")}
                    isSelected={isSelected(med.id)}
                    unsafe={false}
                    onAdd={() => add(med, q)}
                  />
                );
              })}
            </div>
          )}
          {relevantRecents.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-editorial text-ink-faint">
                <Clock className="h-3 w-3" /> Usados recentemente · {relevantRecents.length}
              </div>
              {relevantRecents.map((q, i) => {
                const med = quickToMedication(q);
                return (
                  <MedRow
                    key={`rec-${q.name}-${i}`}
                    med={med}
                    hint={[q.presentation, q.route, q.frequency].filter(Boolean).join(" · ")}
                    isSelected={isSelected(med.id)}
                    unsafe={false}
                    onAdd={() => add(med, q)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "base" && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Princípio ativo, classe… (mín. 2 letras)"
              aria-label="Buscar medicamento na base"
              className="h-8 pl-7 text-xs"
            />
          </div>
          <div className="space-y-1.5 max-h-[26rem] overflow-y-auto pr-1">
            {search.isFetching && <p className="text-[11px] text-ink-muted">Buscando…</p>}
            {search.isError && !search.isFetching && (
              <p className="text-[11px] text-destructive">Falha na busca. Tente novamente.</p>
            )}
            {!search.isFetching && term.trim().length >= 2 && searchMeds.length === 0 && !search.isError && (
              <p className="text-[11px] text-ink-muted">Nenhum medicamento encontrado.</p>
            )}
            {searchMeds.map(({ record, med }) => (
              <div key={record.id} className="space-y-1">
                <MedRow
                  med={med}
                  hint={[record.therapeuticClass, record.presentation].filter(Boolean).join(" · ")}
                  isSelected={isSelected(med.id)}
                  unsafe={false}
                  incomplete={record.incompleteDose}
                  onAdd={() => add(med)}
                />
                <button
                  type="button"
                  onClick={() => setOpenId(openId === record.id ? null : record.id)}
                  className="text-[10px] font-semibold text-canon-blue hover:underline"
                >
                  {openId === record.id ? "Ocultar apresentações" : "Escolher apresentação e dose"}
                </button>
                {openId === record.id && (
                  <MedicationPresentationPicker
                    medicationId={record.id}
                    isPediatric={isPediatric}
                    onApply={({ presentation, posology }) =>
                      add({
                        ...med,
                        dosage: posology?.text ?? "Dose não cadastrada — preencher manualmente",
                        instructions: [presentation.label, posology?.duration, posology?.notes]
                          .filter(Boolean)
                          .join(" · "),
                      })
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationExplorer;
