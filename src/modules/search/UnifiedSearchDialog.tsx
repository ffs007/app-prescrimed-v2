/**
 * Busca unificada (Ctrl/Cmd + K).
 *
 * Mostra os resultados em camadas — essencial, conteúdo clínico e detalhes —
 * com sugestões conforme a tela atual e navegação entre patologias
 * relacionadas preservando o contexto da busca.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useUnifiedSearch } from "./hooks/useUnifiedSearch";
import {
  KIND_LABEL,
  TIER_LABEL,
  pathologyTarget,
  relatedPathologies,
  type ResultTier,
  type ScoredEntry,
} from "./lib/searchIndex";

const TIERS: ResultTier[] = ["essencial", "conteudo", "detalhe"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UnifiedSearchDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { results, suggestions, contextPathology, rememberQuery, rememberPathology } =
    useUnifiedSearch(query);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const grouped = useMemo(() => {
    const map = new Map<ResultTier, ScoredEntry[]>();
    for (const tier of TIERS) map.set(tier, []);
    for (const r of results) map.get(r.tier)?.push(r);
    return map;
  }, [results]);

  const focusPathology = results.find((r) => r.kind === "patologia")?.pathology ?? contextPathology;
  const related = useMemo(
    () => (focusPathology ? relatedPathologies(focusPathology) : []),
    [focusPathology],
  );

  const go = (to: string, pathology?: string) => {
    rememberQuery(query);
    if (pathology) rememberPathology(pathology);
    onOpenChange(false);
    navigate(to);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar patologia, protocolo, escore, exame, documento…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[70vh]">
        {query.trim() === "" ? (
          <CommandGroup heading={contextPathology ? `Contexto atual: ${contextPathology}` : "Sugestões para esta tela"}>
            {suggestions.map((s) => (
              <CommandItem key={s} value={s} onSelect={() => setQuery(s)}>
                <Search className="h-4 w-4 mr-2 opacity-60" />
                {s}
              </CommandItem>
            ))}
            {suggestions.length === 0 && (
              <CommandItem disabled value="vazio">Comece a digitar para buscar.</CommandItem>
            )}
          </CommandGroup>
        ) : (
          <>
            <CommandEmpty>Nada encontrado para “{query}”.</CommandEmpty>
            {TIERS.map((tier) => {
              const items = grouped.get(tier) ?? [];
              if (items.length === 0) return null;
              return (
                <CommandGroup key={tier} heading={TIER_LABEL[tier]}>
                  {items.slice(0, tier === "detalhe" ? 12 : 10).map((r) => (
                    <CommandItem
                      key={r.id}
                      value={`${r.title} ${r.subtitle ?? ""} ${r.id}`}
                      onSelect={() => go(r.to, r.pathology)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{r.title}</p>
                        {r.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="ml-2 shrink-0 text-[10px]">
                        {KIND_LABEL[r.kind]}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </>
        )}

        {related.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Patologias relacionadas a ${focusPathology}`}>
              {related.map((label) => (
                <CommandItem
                  key={label}
                  value={`relacionada ${label}`}
                  onSelect={() => go(pathologyTarget(label, focusPathology ?? undefined), label)}
                >
                  <ArrowRight className="h-4 w-4 mr-2 opacity-60" />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
