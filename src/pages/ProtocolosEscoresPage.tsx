/**
 * Hub central de Protocolos & Escores.
 *
 * Reúne protocolos, escores, trials e fluxogramas num único lugar, com filtros
 * por especialidade, gravidade, ambiente clínico e patologia — e geração de
 * lista .md das lacunas para pesquisa posterior.
 */
import { useMemo, useState } from "react";
import { BookOpen, Calculator, ClipboardList, Download, GitBranch, Globe, Loader2, Search, Sparkles } from "lucide-react";
import PageMeta from "@/components/seo/PageMeta";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useClinicalLibrary } from "@/modules/library/hooks/useClinicalLibrary";
import {
  ENVIRONMENT_LABEL,
  KIND_LABEL,
  SEVERITY_LABEL,
  normalizeText,
  type LibraryItem,
  type LibraryKind,
} from "@/modules/library/lib/types";
import {
  buildMissingItemsMarkdown,
  downloadMarkdown,
  findMissingItems,
} from "@/modules/library/lib/missingItems";
import type { ClinicalEnvironment, ClinicalSeverity } from "@/modules/prescription/types/prescription";
import { describeSupabaseError } from "@/lib/supabaseError";

const KIND_ICON: Record<LibraryKind, typeof ClipboardList> = {
  protocolo: ClipboardList,
  escore: Calculator,
  trial: Sparkles,
  fluxograma: GitBranch,
};

const ALL = "__all__";

export default function ProtocolosEscoresPage() {
  const { items, isLoading, error, discovery } = useClinicalLibrary();
  const [term, setTerm] = useState("");
  const [kind, setKind] = useState<LibraryKind | typeof ALL>(ALL);
  const [specialty, setSpecialty] = useState<string>(ALL);
  const [severity, setSeverity] = useState<string>(ALL);
  const [environment, setEnvironment] = useState<string>(ALL);
  const [pathology, setPathology] = useState("");

  const specialties = useMemo(
    () =>
      Array.from(new Set(items.map((i) => i.specialty).filter(Boolean) as string[])).sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    [items],
  );

  const filtered = useMemo(() => {
    const q = normalizeText(term);
    const p = normalizeText(pathology);
    return items.filter((i) => {
      if (kind !== ALL && i.kind !== kind) return false;
      if (specialty !== ALL && i.specialty !== specialty) return false;
      if (severity !== ALL && i.severity !== severity) return false;
      if (environment !== ALL && !i.environments.includes(environment as ClinicalEnvironment))
        return false;
      if (p) {
        const hay = normalizeText(`${i.name} ${i.description} ${i.pathologies.join(" ")}`);
        if (!hay.includes(p)) return false;
      }
      if (q) {
        const hay = normalizeText(`${i.name} ${i.description} ${i.specialty ?? ""} ${i.reference ?? ""}`);
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, term, kind, specialty, severity, environment, pathology]);

  const grouped = useMemo(() => {
    const map = new Map<LibraryKind, LibraryItem[]>();
    for (const i of filtered) {
      const arr = map.get(i.kind) ?? [];
      arr.push(i);
      map.set(i.kind, arr);
    }
    return map;
  }, [filtered]);

  const handleMissing = () => {
    const missing = findMissingItems(items);
    if (missing.length === 0) {
      toast.success("Nenhuma lacuna encontrada na curadoria atual.");
      return;
    }
    downloadMarkdown(
      `itens-faltantes-${new Date().toISOString().slice(0, 10)}.md`,
      buildMissingItemsMarkdown(missing),
    );
    toast.success(`${missing.length} itens listados para pesquisa.`);
  };

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      <PageMeta
        title="Protocolos & Escores | PrescriMed"
        description="Hub central de protocolos, escores, trials e fluxogramas clínicos, filtráveis por especialidade, gravidade, ambiente e patologia."
        path="/app/protocolos-escores"
      />

      <header className="mb-5">
        <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
          Biblioteca clínica
        </div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink">
          Protocolos &amp; Escores
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Tudo o que apoia a decisão em um só lugar — e vinculado às patologias do atendimento.
        </p>
      </header>

      <div className="mb-4 space-y-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar por nome, guideline ou especialidade"
            className="pl-9"
            aria-label="Buscar na biblioteca clínica"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Select value={kind} onValueChange={(v) => setKind(v as LibraryKind | typeof ALL)}>
            <SelectTrigger aria-label="Categoria">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas as categorias</SelectItem>
              {(Object.keys(KIND_LABEL) as LibraryKind[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {KIND_LABEL[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={specialty} onValueChange={setSpecialty}>
            <SelectTrigger aria-label="Especialidade">
              <SelectValue placeholder="Especialidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas as especialidades</SelectItem>
              {specialties.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger aria-label="Gravidade">
              <SelectValue placeholder="Gravidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas as gravidades</SelectItem>
              {(Object.keys(SEVERITY_LABEL) as ClinicalSeverity[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {SEVERITY_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={environment} onValueChange={setEnvironment}>
            <SelectTrigger aria-label="Ambiente clínico">
              <SelectValue placeholder="Ambiente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os ambientes</SelectItem>
              {(Object.keys(ENVIRONMENT_LABEL) as ClinicalEnvironment[]).map((e) => (
                <SelectItem key={e} value={e}>
                  {ENVIRONMENT_LABEL[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={pathology}
            onChange={(e) => setPathology(e.target.value)}
            placeholder="Patologia"
            aria-label="Filtrar por patologia"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-ink-muted">
            {isLoading ? "Carregando..." : `${filtered.length} itens`}
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={discovery.search.isPending}
              onClick={() => {
                const tema = pathology.trim() || term.trim();
                if (!tema) {
                  toast.error("Digite uma patologia ou um termo para buscar online.");
                  return;
                }
                discovery.search.mutate(tema, {
                  onSuccess: (r) =>
                    toast.success(
                      r.inseridos
                        ? `${r.inseridos} itens oficiais adicionados à biblioteca.`
                        : "Nenhum item novo encontrado.",
                    ),
                  onError: (e) =>
                    toast.error(e instanceof Error ? e.message : "Busca online indisponível no momento."),
                });
              }}
            >
              {discovery.search.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Globe className="h-3.5 w-3.5" />
              )}
              Buscar protocolos oficiais online
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleMissing}>
              <Download className="h-3.5 w-3.5" />
              Gerar lista de itens faltantes (.md)
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Não foi possível carregar a biblioteca</AlertTitle>
          <AlertDescription>{describeSupabaseError(error)}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-ink-soft bg-card p-6 text-center text-sm text-ink-muted">
          Nenhum item encontrado com esses filtros.
        </p>
      ) : (
        <div className="space-y-6">
          {(Object.keys(KIND_LABEL) as LibraryKind[]).map((k) => {
            const list = grouped.get(k);
            if (!list || list.length === 0) return null;
            const Icon = KIND_ICON[k];
            return (
              <section key={k}>
                <h2 className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-editorial text-ink-faint">
                  <Icon className="h-3.5 w-3.5" />
                  {KIND_LABEL[k]} · {list.length}
                </h2>
                <div className="space-y-1.5">
                  {list.slice(0, 200).map((item) => (
                    <article
                      key={item.id}
                      className="rounded-md border border-ink-soft bg-card p-3 shadow-paper"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-sm font-medium leading-tight text-ink">{item.name}</h3>
                        <div className="flex flex-wrap gap-1">
                          {item.severity && (
                            <Badge variant="outline" className="text-[10px]">
                              {SEVERITY_LABEL[item.severity]}
                            </Badge>
                          )}
                          {item.environments.map((e) => (
                            <Badge key={e} variant="secondary" className="text-[10px]">
                              {ENVIRONMENT_LABEL[e]}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {item.description && (
                        <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                          {item.description}
                        </p>
                      )}
                      {item.pathologies.length > 0 && (
                        <p className="mt-1 text-[11px] text-ink-muted">
                          Patologias: {Array.from(new Set(item.pathologies)).slice(0, 6).join(", ")}
                        </p>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-editorial text-ink-faint">
                        {item.specialty && <span>{item.specialty}</span>}
                        {item.reference && (
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {item.reference}
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
