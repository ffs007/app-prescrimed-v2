/**
 * PathologyLibrary — Bloco C v2 (UX patologia-primeiro).
 *
 * Filosofia: o médico pensa em PATOLOGIA, não em CID.
 *  - Lista limpa, sem CID na primeira vista.
 *  - Tabs: Emergências | Favoritos | Recentes | Todas.
 *  - Clique direto em patologia sem subtipo → abre prescrição (1 clique).
 *  - Clique em patologia com subtipos → expande inline (2 cliques).
 *  - CID aparece discreto, em segunda linha, depois da seleção.
 *  - Busca aceita sinônimos ("ITU", "olho vermelho", "pressão alta").
 */
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Star, Zap, Clock, LayoutGrid, ChevronRight, PenLine, Plus } from "lucide-react";
import type { ClinicalEnvironment, Medication, Pathology, PathologySubtype } from "../types/prescription";
import { usePathologyMemory } from "../hooks/usePathologyMemory";
import type { PatientContext, Suggestion } from "../services/suggestionEngine";
import MedicationExplorer from "./MedicationExplorer";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

interface Props {
  pathologies: Pathology[];
  allMedications: Medication[];
  selected: Array<{ id: number }>;
  patient: PatientContext;
  /**
   * Contexto de atendimento atual.
   * - "urgencia": exibe medicamentos orais (prescritos para casa).
   * - "hospitalar": exibe medicamentos intra-hospitalares (EV/IM) de `hospitalMeds`.
   */
  context: "hospitalar" | "urgencia";
  /** Ambiente clínico real, usado para não misturar condutas entre cenários. */
  environment: ClinicalEnvironment;
  /** Adiciona um medicamento "puro" (fluxo legado, ainda usado por patologias sem protocolo). */
  onAddMedication: (med: Medication) => void;
  /** Adiciona uma sugestão estruturada (com dose/posologia já calculadas). */
  onAddSuggestion: (suggestion: Suggestion, source: Medication) => void;
  /** Adiciona um item parenteral (string) vindo de `hospitalMeds`. */
  onAddHospitalMedText: (text: string) => void;
  /** Carrega patologia (ou subtipo aplicado sobre patologia pai) na receita. */
  onLoadPathology: (pathology: Pathology) => void;
  /** Abre o diálogo de medicamento manual (livre). */
  onOpenManual: () => void;
  /** Catálogo de patologias ainda carregando do banco. */
  isLoading?: boolean;
  /** Condição já escolhida no passo 1 — evita pedir a escolha de novo. */
  focusPathologyId?: number | null;
  /** Nome da condição/queixa já escolhida (mostrado no cabeçalho). */
  focusLabel?: string | null;
}

type TabKey = "emergency" | "favorites" | "recent" | "all";

const TABS: Array<{ key: TabKey; label: string; icon: typeof Star }> = [
  { key: "emergency", label: "Emergências", icon: Zap },
  { key: "favorites", label: "Favoritos", icon: Star },
  { key: "recent", label: "Recentes", icon: Clock },
  { key: "all", label: "Todas", icon: LayoutGrid },
];

/**
 * Aplica um subtipo sobre a patologia pai, retornando uma Pathology composta
 * com CID e meds do subtipo (e fallback para os do pai).
 */
const applySubtype = (parent: Pathology, sub: PathologySubtype): Pathology => ({
  ...parent,
  name: `${parent.name} ${sub.name}`,
  cid: sub.cid ?? parent.cid,
  meds: sub.meds && sub.meds.length > 0 ? sub.meds : parent.meds,
  hospitalMeds: sub.hospitalMeds ?? parent.hospitalMeds,
});

/* -------- Busca local com sinônimos -------- */

const matchesQuery = (p: Pathology, q: string): boolean => {
  if (!q) return true;
  const haystack = [p.name, p.cid ?? "", p.category ?? "", ...(p.synonyms ?? []), ...(p.subtypes?.map((s) => s.name) ?? [])]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
};

const PathologyLibrary = ({
  pathologies,
  allMedications,
  selected,
  patient,
  context,
  environment,
  onAddMedication,
  onAddSuggestion,
  onAddHospitalMedText,
  onLoadPathology,
  onOpenManual,
  isLoading = false,
  focusPathologyId = null,
  focusLabel = null,
}: Props) => {
  const isPregnant = patient.isPregnant;
  const isPediatric = patient.isPediatric;
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabKey>("all");
  const [expanded, setExpanded] = useState<number | null>(focusPathologyId);
  const [browseAll, setBrowseAll] = useState(false);
  const memory = usePathologyMemory();

  /** Condição já definida no passo 1: a lista fica focada nela. */
  const focused =
    !!focusLabel && !browseAll && !search.trim()
      ? pathologies.find((p) => p.id === focusPathologyId) ?? null
      : null;
  const isFocusMode = !!focusLabel && !browseAll && !search.trim();

  const q = search.trim().toLowerCase();

  /* Comparador alfabético estável, case/acento-insensível. */
  const byName = (a: Pathology, b: Pathology) =>
    a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });

  /* Filtra pela aba ativa + busca. Quando há busca, ignora a aba.
   * Listagem padrão (sem busca) sempre em ordem alfabética; "Recentes"
   * mantém a ordem cronológica de uso (relevância temporal).
   * Com busca ativa, preservamos a ordem retornada pelo filtro (relevância). */
  const visible = useMemo(() => {
    if (isFocusMode) return focused ? [focused] : [];
    let list = pathologies;
    if (!q) {
      if (tab === "emergency") list = list.filter((p) => p.isEmergency);
      else if (tab === "favorites") list = list.filter((p) => memory.favorites.includes(p.id));
      else if (tab === "recent") {
        const order = new Map(memory.recents.map((id, i) => [id, i]));
        return list.filter((p) => order.has(p.id)).sort((a, b) => (order.get(a.id)! - order.get(b.id)!));
      }
      return [...list].sort(byName);
    }
    return list.filter((p) => matchesQuery(p, q));
  }, [pathologies, q, tab, memory.favorites, memory.recents, isFocusMode, focused]);

  /* Conta itens por aba para o badge. */
  const counts = useMemo(
    () => ({
      emergency: pathologies.filter((p) => p.isEmergency).length,
      favorites: memory.favorites.length,
      recent: memory.recents.length,
      all: pathologies.length,
    }),
    [pathologies, memory.favorites, memory.recents],
  );

  /**
   * UX patologia-primeiro:
   * Sempre expande a linha — nada é carregado automaticamente.
   * O médico vê as sugestões clicáveis e decide item a item
   * (ou usa "Carregar todas" / subtipo).
   */
  const handlePathologyClick = (p: Pathology) => {
    memory.pushRecent(p.id);
    setExpanded(expanded === p.id ? null : p.id);
  };

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-lg border border-ink-soft bg-card p-4 shadow-paper sm:p-5">
      {/* Cabeçalho */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
            Bloco C · construção
          </div>
          <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">
            {isFocusMode ? `Sugestões para ${focusLabel}` : "Qual o quadro clínico?"}
          </h2>
          <p className="text-xs text-ink-muted">
            {isFocusMode
              ? "Já vem da condição escolhida. Edite, remova ou adicione o que faltar."
              : "Toque para ver sugestões. Edite ou adicione manualmente quando precisar."}
          </p>
        </div>
        <Button
          onClick={onOpenManual}
          variant="outline"
          size="sm"
          className="h-9 shrink-0 gap-1.5 border-canon-blue/40 bg-canon-blue/5 text-[11px] text-canon-blue hover:bg-canon-blue/10"
        >
          <PenLine className="h-3.5 w-3.5" />
          Manual
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Buscar — ex: "ITU", "olho vermelho", "pressão alta"'
          className="h-11 bg-paper-alt/40 border-ink-soft pl-10"
        />
      </div>

      {isFocusMode && (
        <button
          type="button"
          onClick={() => setBrowseAll(true)}
          className="mt-2 text-[11px] font-medium text-canon-blue underline-offset-2 hover:underline"
        >
          Adicionar outra condição
        </button>
      )}

      {/* Tabs */}
      {!q && !isFocusMode && (
        <div
          className="mt-3 flex w-full max-w-full gap-1 overflow-x-auto overflow-y-hidden rounded-md border border-ink-soft bg-paper-alt/40 p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            const count = counts[key];
            return (
              <button
                key={key}
                onClick={() => {
                  setTab(key);
                  setExpanded(null);
                }}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition sm:gap-1.5 sm:px-3 sm:text-[11px]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canon-blue",
                  active
                    ? "bg-card text-ink shadow-paper"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                <Icon className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5", key === "emergency" && active && "text-destructive")} />
                {label}
                <span
                  className={cn(
                    "rounded-full px-1 py-0.5 text-[9px] font-semibold sm:px-1.5",
                    active ? "bg-canon-blue/10 text-canon-blue" : "bg-ink-soft/60 text-ink-faint",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Resultados */}
      <div className="mt-4 space-y-2">
        {isLoading && visible.length === 0 && (
          <div className="space-y-2" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        )}

        {!isLoading && visible.length === 0 && isFocusMode && (
          <div className="space-y-2">
            <p className="text-[11px] text-ink-muted">
              Medicamentos para a queixa “{focusLabel}”. Nada é adicionado sozinho — revise e escolha.
            </p>
            <MedicationExplorer
              conditionName={null}
              syndromeName={focusLabel}
              environment={environment}
              selected={selected}
              isPediatric={isPediatric}
              isPregnant={isPregnant}
              onAddMedication={onAddMedication}
            />
          </div>
        )}


        {!isLoading && visible.length === 0 && !isFocusMode && (
          <EmptyState tab={tab} hasQuery={!!q} onOpenManual={onOpenManual} />
        )}

        {visible.map((p) => (
          <PathologyRow
            key={p.id}
            pathology={p}
            isExpanded={expanded === p.id}
            isFavorite={memory.isFavorite(p.id)}
            onToggleFavorite={() => memory.toggleFavorite(p.id)}
            onClick={() => handlePathologyClick(p)}
            allMedications={allMedications}
            selected={selected}
            patient={patient}
            context={context}
            environment={environment}
            onAddMedication={onAddMedication}
            onOpenManual={onOpenManual}
          />
        ))}
      </div>
    </div>
  );
};


/* ============ Linha da patologia ============ */

const PathologyRow = ({
  pathology: p,
  isExpanded,
  isFavorite,
  onToggleFavorite,
  onClick,
  allMedications,
  selected,
  patient,
  context,
  environment,
  onAddMedication,
  onOpenManual,
}: {
  pathology: Pathology;
  isExpanded: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClick: () => void;
  allMedications: Medication[];
  selected: Array<{ id: number }>;
  patient: PatientContext;
  context: "hospitalar" | "urgencia";
  environment: ClinicalEnvironment;
  onAddMedication: (med: Medication) => void;
  onOpenManual: () => void;
}) => {
  const hasSubtypes = !!p.subtypes && p.subtypes.length > 0;
  /** Subtipo escolhido para visualizar sugestões inline (sem carregar). */
  const [pickedSubtype, setPickedSubtype] = useState<PathologySubtype | null>(null);

  /** Patologia composta (com subtipo aplicado) usada no preview. */
  const previewPathology: Pathology | null = (() => {
    if (!isExpanded) return null;
    if (!hasSubtypes) return p;
    if (pickedSubtype) return applySubtype(p, pickedSubtype);
    return null;
  })();

  return (
    <div
      className={cn(
        "group rounded-lg border bg-card transition",
        p.isEmergency
          ? "border-destructive/25 hover:border-destructive/45"
          : "border-ink-soft hover:border-ink/25",
        isExpanded && "ring-1 ring-canon-blue/30",
      )}
    >
      <div className="flex items-stretch">
        <button
          onClick={() => {
            // Reset subtype picker quando colapsa
            if (isExpanded) setPickedSubtype(null);
            onClick();
          }}
          className="flex-1 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canon-blue rounded-l-lg"
        >
          <div className="flex items-center gap-2.5">
            {p.isEmergency && (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                <Zap className="h-3.5 w-3.5" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-ink">{p.name}</span>
                {p.isCustom && <span className="text-[10px] font-normal text-canon-blue">(modelo)</span>}
              </div>
              {/* CID discreto quando há um único; subtipos mostram contagem. */}
              {!hasSubtypes && p.cid && (
                <div className="mt-0.5 text-[11px] text-ink-faint">CID {p.cid}</div>
              )}
              {hasSubtypes && (
                <div className="mt-0.5 text-[11px] text-ink-faint">
                  {p.subtypes!.length} subtipos · escolha o quadro
                </div>
              )}
            </div>
            <ChevronRight
              className={cn(
                "h-4 w-4 shrink-0 text-ink-faint transition",
                isExpanded && "rotate-90 text-canon-blue",
              )}
            />
          </div>
        </button>

        {/* Botão favoritar */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label={isFavorite ? "Remover dos favoritos" : "Favoritar"}
          className={cn(
            "flex w-10 shrink-0 items-center justify-center rounded-r-lg border-l border-ink-soft/70 transition",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canon-blue",
            isFavorite ? "text-warning" : "text-ink-faint hover:text-ink-muted",
          )}
        >
          <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
        </button>
      </div>

      {/* Submenu de subtipos — só quando ainda não foi escolhido */}
      {isExpanded && hasSubtypes && !pickedSubtype && (
        <div className="border-t border-ink-soft/60 px-3 py-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-editorial text-ink-faint">
            Escolha o quadro
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {p.subtypes!.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setPickedSubtype(sub)}
                className="rounded-md border border-ink-soft bg-paper-alt/40 px-3 py-2.5 text-left transition hover:border-canon-blue/40 hover:bg-canon-blue/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canon-blue"
              >
                <div className="text-sm font-semibold text-ink">{sub.name}</div>
                {sub.hint && <div className="mt-0.5 text-[11px] text-ink-muted">{sub.hint}</div>}
                {sub.cid && <div className="mt-0.5 text-[10px] text-ink-faint">CID {sub.cid}</div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Painel de sugestões — sem subtipo OU subtipo já escolhido */}
      {previewPathology && (
        <>
          {/* Breadcrumb do subtipo escolhido (permite voltar) */}
          {pickedSubtype && (
            <div className="flex items-center justify-between border-t border-ink-soft/60 bg-paper-alt/30 px-4 py-2 text-[11px]">
              <div className="text-ink-muted">
                <span className="font-semibold text-ink">{pickedSubtype.name}</span>
                {previewPathology.cid && <span className="ml-2 text-ink-faint">CID {previewPathology.cid}</span>}
              </div>
              <button
                onClick={() => setPickedSubtype(null)}
                className="text-canon-blue hover:underline"
              >
                trocar quadro
              </button>
            </div>
          )}
          <PathologyMedsPreview
            pathology={previewPathology}
            allMedications={allMedications}
            selected={selected}
            patient={patient}
            context={context}
            environment={environment}
            onAddMedication={onAddMedication}
            onOpenManual={onOpenManual}
          />
        </>
      )}
    </div>
  );
};


/* ============ Preview de medicamentos (atalho compatível com fluxo antigo) ============ */

const PathologyMedsPreview = ({
  pathology,
  allMedications,
  selected,
  patient,
  context,
  environment,
  onAddMedication,
  onOpenManual,
}: {
  pathology: Pathology;
  allMedications: Medication[];
  selected: Array<{ id: number }>;
  patient: PatientContext;
  context: "hospitalar" | "urgencia";
  environment: ClinicalEnvironment;
  onAddMedication: (med: Medication) => void;
  onOpenManual: () => void;
}) => {
  return (
    <div className="border-t border-ink-soft/60 px-3 py-3 space-y-3">
      {/* Única fonte automática: vínculo revisado por condição e ambiente. */}
      <MedicationExplorer
        conditionName={pathology.name}
        syndromeName={(pathology as { syndrome?: string }).syndrome ?? null}
        environment={environment}
        selected={selected}
        isPediatric={!!patient.isPediatric}
        isPregnant={!!patient.isPregnant}
        onAddMedication={onAddMedication}
      />

      {/* Rodapé sempre visível: opção manual */}
      <button
        onClick={onOpenManual}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-ink-soft px-3 py-2 text-[11px] font-medium text-ink-muted transition hover:border-canon-blue/50 hover:bg-canon-blue/5 hover:text-canon-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canon-blue"
      >
        <Plus className="h-3.5 w-3.5" />
        Não encontrou? Adicionar medicamento manualmente
      </button>
    </div>
  );
};

/* ============ Empty state ============ */

const EmptyState = ({
  tab,
  hasQuery,
  onOpenManual,
}: {
  tab: TabKey;
  hasQuery: boolean;
  onOpenManual: () => void;
}) => {
  let msg = "Nenhuma patologia encontrada.";
  if (!hasQuery) {
    if (tab === "favorites") msg = "Você ainda não favoritou patologias. Toque na ★ ao lado.";
    else if (tab === "recent") msg = "Sem patologias recentes. Use uma para aparecer aqui.";
    else if (tab === "emergency") msg = "Sem emergências cadastradas.";
  }
  return (
    <div className="space-y-3 rounded-lg border border-dashed border-ink-soft bg-paper-alt/30 px-4 py-6 text-center">
      <div className="text-xs text-ink-faint">{msg}</div>
      <Button
        onClick={onOpenManual}
        size="sm"
        variant="outline"
        className="h-8 gap-1.5 border-canon-blue/40 bg-canon-blue/5 text-[11px] text-canon-blue hover:bg-canon-blue/10"
      >
        <Plus className="h-3.5 w-3.5" />
        Adicionar medicamento manualmente
      </Button>
    </div>
  );
};

export default PathologyLibrary;

