/**
 * PathologyGate — Bloco 0 do atendimento.
 *
 * Fluxo do pronto-socorro: ambiente → queixa/síndrome → condição específica.
 * A busca fica sempre visível e atravessa síndromes e doenças (inclusive as
 * raras). A lista completa aparece agrupada por sistema, em grupos recolhíveis.
 */
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Stethoscope,
  Ambulance,
  Siren,
  PenLine,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Star,
  RefreshCw,
  ListTree,
} from "lucide-react";
import type { ClinicalEnvironment, Pathology } from "../types/prescription";
import type { Syndrome } from "@/modules/syndromes/lib/types";

import { usePathologyMemory } from "../hooks/usePathologyMemory";
import { useReadyConditions } from "@/modules/medications/hooks/useClinicalLinks";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

export const ENVIRONMENTS: Array<{
  id: ClinicalEnvironment;
  label: string;
  hint: string;
  icon: typeof Stethoscope;
}> = [
  { id: "ambulatorial", label: "Ambulatorial", hint: "Consultório e crônicos", icon: Stethoscope },
  { id: "urgencia", label: "Urgências / PS", hint: "Pronto atendimento", icon: Ambulance },
  { id: "emergencia", label: "Emergências / SV", hint: "Sala vermelha", icon: Siren },
];

/** Rótulos dos grupos por sistema/aparelho. */
const SYSTEM_LABEL: Record<string, string> = {
  cardiovascular: "Cardiovascular",
  respiratorio: "Respiratório",
  infeccioso: "Infeccioso",
  neurologico: "Neurológico",
  gastrointestinal: "Gastrointestinal",
  geniturinario: "Geniturinário",
  endocrino_metabolico: "Endócrino e metabólico",
  musculoesqueletico: "Musculoesquelético",
  dermatologico: "Dermatológico",
  psiquiatrico: "Saúde mental",
  gineco_obstetrico: "Ginecologia e obstetrícia",
  pediatria: "Pediatria",
  trauma: "Trauma",
  toxicologia: "Toxicologia",
  hematologico: "Hematologia",
  otorrino_oftalmo: "Olhos, ouvidos e vias aéreas",
  outros: "Outras condições",
};

const systemLabel = (key?: string) => SYSTEM_LABEL[key ?? "outros"] ?? SYSTEM_LABEL.outros;

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const matches = (p: Pathology, q: string) => {
  if (!q) return true;
  const n = normalize(q);
  return (
    normalize(p.name).includes(n) ||
    (p.synonyms ?? []).some((s) => normalize(s).includes(n)) ||
    normalize(p.cid ?? "").includes(n)
  );
};

const SEVERITY_TONE: Record<string, string> = {
  leve: "bg-success/10 text-success border-success/30",
  moderada: "bg-warning/10 text-warning border-warning/30",
  grave: "bg-destructive/10 text-destructive border-destructive/30",
  critica: "bg-destructive text-destructive-foreground border-destructive",
};

interface Props {
  pathologies: Pathology[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  environment: ClinicalEnvironment;
  onEnvironmentChange: (env: ClinicalEnvironment) => void;
  onSelect: (p: Pathology) => void;
  /** Segue sem patologia definida (receita/documento em branco). */
  onSkip: () => void;
  /** Queixas/síndromes de entrada. */
  syndromes?: Syndrome[];
  syndromesLoading?: boolean;
  onSelectSyndrome?: (s: Syndrome) => void;
  /** Código da síndrome → nomes normalizados das condições ligadas a ela. */
  syndromePathologies?: Map<string, Set<string>>;
}

const PathologyGate = ({
  pathologies,
  isLoading,
  isError,
  onRetry,
  environment,
  onEnvironmentChange,
  onSelect,
  onSkip,
  syndromes = [],
  syndromesLoading,
  onSelectSyndrome,
  syndromePathologies,
}: Props) => {
  const [query, setQuery] = useState("");
  const [syndrome, setSyndrome] = useState<Syndrome | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const { favorites, recents, toggleFavorite, isFavorite } = usePathologyMemory();

  /**
   * Quadros que já têm tratamento revisado com dose e apresentação utilizáveis.
   * Aparecem primeiro e recebem selo — é o caminho mais rápido da prescrição.
   */
  const readyQuery = useReadyConditions();
  const readyByType = useMemo(() => {
    const pathology = new Set<string>();
    const syndromeSet = new Set<string>();
    for (const r of readyQuery.data ?? []) {
      (r.conditionType === "sindrome" ? syndromeSet : pathology).add(normalize(r.conditionName));
    }
    return { pathology, syndrome: syndromeSet };
  }, [readyQuery.data]);

  const isReadyPathology = (p: Pathology) => readyByType.pathology.has(normalize(p.name));
  const isReadySyndrome = (s: Syndrome) => readyByType.syndrome.has(normalize(s.nome));

  const inEnvironment = useMemo(
    () => pathologies.filter((p) => (p.environments ?? []).includes(environment)),
    [pathologies, environment],
  );

  const sortByUse = useMemo(() => {
    const favSet = new Set(favorites);
    const recentIdx = new Map(recents.map((id, i) => [id, i] as const));
    const ready = readyByType.pathology;
    return (a: Pathology, b: Pathology) => {
      const fa = Number(favSet.has(a.id));
      const fb = Number(favSet.has(b.id));
      if (fa !== fb) return fb - fa;
      const ta = Number(ready.has(normalize(a.name)));
      const tb = Number(ready.has(normalize(b.name)));
      if (ta !== tb) return tb - ta;
      const ra = recentIdx.get(a.id) ?? 999;
      const rb = recentIdx.get(b.id) ?? 999;
      if (ra !== rb) return ra - rb;
      const freq =
        (b.frequencyByEnvironment?.[environment] ?? b.frequency ?? 0) -
        (a.frequencyByEnvironment?.[environment] ?? a.frequency ?? 0);
      if (freq !== 0) return freq;
      return a.name.localeCompare(b.name, "pt-BR");
    };
  }, [favorites, recents, environment, readyByType]);

  /** Resultados da busca livre (atravessa toda a base do ambiente). */
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return inEnvironment.filter((p) => matches(p, query)).sort(sortByUse);
  }, [inEnvironment, query, sortByUse]);

  const syndromeList = useMemo(() => {
    const n = normalize(query);
    return syndromes
      .filter((s) => s.ambientes.length === 0 || s.ambientes.includes(environment))
      .filter(
        (s) =>
          !n ||
          normalize(s.nome).includes(n) ||
          s.sinonimos.some((x) => normalize(x).includes(n)),
      )
      .sort((a, b) => {
        const ra = Number(readyByType.syndrome.has(normalize(a.nome)));
        const rb = Number(readyByType.syndrome.has(normalize(b.nome)));
        if (ra !== rb) return rb - ra;
        return a.nome.localeCompare(b.nome, "pt-BR");
      });
  }, [syndromes, environment, query, readyByType]);

  /** Quantos quadros deste ambiente já têm tratamento revisado. */
  const readyCount = useMemo(
    () =>
      inEnvironment.filter(isReadyPathology).length +
      syndromeList.filter(isReadySyndrome).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inEnvironment, syndromeList, readyByType],
  );

  /** Condições ligadas à síndrome escolhida, dentro do ambiente. */
  const syndromeConditions = useMemo(() => {
    if (!syndrome) return [];
    const keys = syndromePathologies?.get(syndrome.codigo);
    if (!keys || keys.size === 0) return [];
    return inEnvironment.filter((p) => keys.has(normalize(p.name))).sort(sortByUse);
  }, [syndrome, syndromePathologies, inEnvironment, sortByUse]);

  /** Lista completa agrupada por sistema. */
  const grouped = useMemo(() => {
    const map = new Map<string, Pathology[]>();
    for (const p of inEnvironment) {
      const key = p.system ?? "outros";
      map.set(key, [...(map.get(key) ?? []), p]);
    }
    return [...map.entries()]
      .map(([key, items]) => ({ key, label: systemLabel(key), items: items.sort(sortByUse) }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [inEnvironment, sortByUse]);

  const searching = query.trim().length > 0;

  const renderRow = (p: Pathology) => {
    const severity = p.severityByEnvironment?.[environment] ?? p.severity;
    return (
    <div
      key={p.id}
      className="group flex items-center gap-2 rounded-md border border-ink-soft bg-paper-alt/30 pr-2 transition hover:border-canon-blue/40 hover:bg-paper-alt/70"
    >
      <button
        type="button"
        onClick={() => onSelect(p)}
        className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
          {p.cid && <span className="block truncate text-[10px] text-ink-muted">CID {p.cid}</span>}
        </span>
        {isReadyPathology(p) && (
          <span className="hidden shrink-0 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-editorial text-success sm:inline">
            tratamento pronto
          </span>
        )}
        {(severity === "grave" || severity === "critica") && (
          <span
            className={cn(
              "hidden shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-editorial sm:inline",
              SEVERITY_TONE[severity],
            )}
          >
            {severity}
          </span>
        )}
        <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
      </button>
      <button
        type="button"
        aria-label={isFavorite(p.id) ? "Remover dos favoritos" : "Favoritar"}
        onClick={() => toggleFavorite(p.id)}
        className="shrink-0 rounded p-1 text-ink-faint hover:text-warning"
      >
        <Star className={cn("h-3.5 w-3.5", isFavorite(p.id) && "fill-warning text-warning")} />
      </button>
    </div>
    );
  };

  const stageTitle = searching
    ? "Resultados da busca"
    : syndrome
      ? syndrome.nome
      : showAll
        ? "Todas as condições"
        : "Qual é a queixa?";

  return (
    <div className="rounded-lg border border-ink-soft bg-card p-4 shadow-paper sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
            Passo 1
          </div>
          <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">{stageTitle}</h2>
          {readyCount > 0 && (
            <p className="mt-0.5 text-[11px] text-ink-muted">
              <span className="font-semibold text-success">{readyCount}</span> quadro(s) deste ambiente
              já com tratamento revisado, dose e apresentação — aparecem primeiro.
            </p>
          )}
        </div>
        {(syndrome || showAll) && !searching && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => {
              setSyndrome(null);
              setShowAll(false);
            }}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Voltar
          </Button>
        )}
      </div>

      {/* Ambientes */}
      <div role="radiogroup" aria-label="Ambiente de atendimento" className="grid grid-cols-3 gap-2">
        {ENVIRONMENTS.map(({ id, label, hint, icon: Icon }) => {
          const active = id === environment;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                onEnvironmentChange(id);
                setSyndrome(null);
              }}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition",
                active
                  ? "border-canon-blue bg-canon-blue/5 ring-1 ring-canon-blue/20"
                  : "border-ink-soft bg-paper-alt/30 hover:border-canon-blue/40 hover:bg-paper-alt/60",
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-canon-blue" : "text-ink-muted")} />
              <span className="text-xs font-semibold leading-tight text-ink">{label}</span>
              <span className="text-[10px] leading-snug text-ink-muted">{hint}</span>
            </button>
          );
        })}
      </div>

      {/* Busca — atravessa queixas e doenças, inclusive as raras */}
      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar queixa, doença, sinônimo ou CID…"
          className="pl-9"
          aria-label="Buscar queixa ou doença"
        />
      </div>

      {isLoading && (
        <div className="mt-3 space-y-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-paper-alt" />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <div className="mt-3 flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-xs text-destructive">
            Não foi possível carregar as condições deste ambiente.
          </p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar novamente
            </Button>
          )}
        </div>
      )}

      {/* Busca ativa: queixas + doenças em lista única */}
      {!isLoading && !isError && searching && (
        <div className="mt-3 max-h-[24rem] space-y-1.5 overflow-y-auto pr-1">
          {onSelectSyndrome &&
            syndromeList.slice(0, 4).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSyndrome(s);
                  setQuery("");
                }}
                className="flex w-full items-center gap-2 rounded-md border border-canon-blue/30 bg-canon-blue/5 px-3 py-2 text-left"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{s.nome}</span>
                <span className="shrink-0 text-[10px] uppercase tracking-editorial text-canon-blue">
                  queixa
                </span>
              </button>
            ))}
          {searchResults.map(renderRow)}
          {searchResults.length === 0 && syndromeList.length === 0 && (
            <p className="py-6 text-center text-xs text-ink-muted">
              Nada encontrado neste ambiente.
            </p>
          )}
        </div>
      )}

      {/* Etapa 1: queixas */}
      {!isLoading && !isError && !searching && !syndrome && !showAll && (
        <>
          <div className="mt-3 grid max-h-[22rem] grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-3">
            {syndromesLoading &&
              Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-md bg-paper-alt" />
              ))}
            {!syndromesLoading &&
              syndromeList.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSyndrome(s)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-3 py-2.5 text-left text-sm font-medium text-ink transition hover:border-canon-blue/40 hover:bg-paper-alt/70",
                    isReadySyndrome(s)
                      ? "border-success/40 bg-success/5"
                      : "border-ink-soft bg-paper-alt/30",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{s.nome}</span>
                  {isReadySyndrome(s) && (
                    <span aria-label="Tratamento pronto" className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                  )}
                </button>
              ))}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="flex items-center gap-2 rounded-md border border-ink-soft bg-paper-alt/30 px-3 py-2.5 text-left transition hover:border-canon-blue/40"
            >
              <ListTree className="h-4 w-4 shrink-0 text-canon-blue" />
              <span className="min-w-0 flex-1 text-sm font-medium text-ink">
                Ver todas as condições ({inEnvironment.length})
              </span>
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="flex items-center gap-2 rounded-md border border-dashed border-canon-blue/40 bg-canon-blue/5 px-3 py-2.5 text-left transition hover:border-canon-blue"
            >
              <PenLine className="h-4 w-4 shrink-0 text-canon-blue" />
              <span className="min-w-0 flex-1 text-sm font-medium text-ink">
                Documento em branco
              </span>
            </button>
          </div>
        </>
      )}

      {/* Etapa 2: condições da queixa escolhida */}
      {!isLoading && !isError && !searching && syndrome && (
        <>
          <div className="mt-3 max-h-[22rem] space-y-1.5 overflow-y-auto pr-1">
            {syndromeConditions.map(renderRow)}
            {syndromeConditions.length === 0 && (
              <p className="py-6 text-center text-xs text-ink-muted">
                Nenhuma condição ligada a esta queixa neste ambiente. Siga com a queixa ou veja
                todas as condições.
              </p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink-soft pt-3">
            {onSelectSyndrome && (
              <Button variant="outline" size="sm" onClick={() => onSelectSyndrome(syndrome)}>
                Seguir só com a queixa
              </Button>
            )}
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setShowAll(true)}>
              <ListTree className="h-3.5 w-3.5" />
              Ver todas as condições
            </Button>
          </div>
        </>
      )}

      {/* Lista completa agrupada por sistema */}
      {!isLoading && !isError && !searching && showAll && (
        <div className="mt-3 max-h-[26rem] space-y-1.5 overflow-y-auto pr-1">
          {grouped.map((group) => {
            const open = openGroups[group.key] ?? false;
            return (
              <div key={group.key} className="rounded-md border border-ink-soft">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenGroups((prev) => ({ ...prev, [group.key]: !open }))}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left"
                >
                  <ChevronDown
                    className={cn("h-4 w-4 shrink-0 text-ink-faint transition-transform", !open && "-rotate-90")}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                    {group.label}
                  </span>
                  <span className="shrink-0 text-[11px] text-ink-muted">{group.items.length}</span>
                </button>
                {open && <div className="space-y-1.5 border-t border-ink-soft p-2">{group.items.map(renderRow)}</div>}
              </div>
            );
          })}
          {grouped.length === 0 && (
            <p className="py-6 text-center text-xs text-ink-muted">
              Nenhuma condição classificada neste ambiente.
            </p>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-ink-soft pt-3">
            <p className="text-[11px] text-ink-muted">{inEnvironment.length} condição(ões)</p>
            <Button variant="outline" size="sm" onClick={onSkip} className="gap-1.5">
              <PenLine className="h-3.5 w-3.5" />
              Documento em branco
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PathologyGate;
