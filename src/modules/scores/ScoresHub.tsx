/**
 * Central de escores calculados no servidor.
 * Lista todas as funções `fn_calcular_*` por especialidade, com busca, e abre o formulário
 * do escore escolhido. Usada na página /app/escores e no diálogo do atendimento.
 */
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SCORE_DEFINITIONS, SCORE_GROUPS, type ScoreGroup } from "./lib/scoreCatalog";
import ScoreFunctionForm from "./ScoreFunctionForm";

interface Props {
  /** Identificador do atendimento (agrupa a auditoria). Sem ele, gera um avulso para a sessão. */
  atendimentoId?: string;
  defaultAge?: number | null;
  onUseResult?: (title: string, text: string) => void;
  initialScoreId?: string | null;
}

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function ScoresHub({ atendimentoId, defaultAge, onUseResult, initialScoreId = null }: Props) {
  const [term, setTerm] = useState("");
  const [group, setGroup] = useState<ScoreGroup | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(initialScoreId);
  const sessionAtendimento = useMemo(() => atendimentoId ?? `avulso-${crypto.randomUUID()}`, [atendimentoId]);

  const filtered = useMemo(() => {
    const q = normalize(term.trim());
    return SCORE_DEFINITIONS.filter(
      (s) => (group === "all" || s.group === group) && (q === "" || normalize(`${s.title} ${s.id} ${s.group}`).includes(q)),
    );
  }, [term, group]);

  const selected = SCORE_DEFINITIONS.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={`Buscar entre ${SCORE_DEFINITIONS.length} escores (nome, sigla, especialidade)`}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          aria-label="Buscar escore"
        />
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por especialidade">
        {(["all", ...SCORE_GROUPS] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroup(g)}
            aria-pressed={group === g}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              group === g ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {g === "all" ? "Todas" : g}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelectedId(s.id)}
            aria-pressed={selectedId === s.id}
            className={cn(
              "rounded-lg border p-3 text-left transition-colors hover:bg-muted/60",
              selectedId === s.id && "border-primary bg-primary/5",
            )}
          >
            <p className="text-sm font-medium">{s.title}</p>
            <Badge variant="outline" className="mt-1 text-[10px] font-normal">{s.group}</Badge>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-6 text-center text-sm text-muted-foreground">Nenhum escore encontrado.</p>
        )}
      </div>

      {selected && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{selected.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreFunctionForm
              key={selected.id}
              def={selected}
              atendimentoId={sessionAtendimento}
              defaultAge={defaultAge}
              onUseResult={onUseResult}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
