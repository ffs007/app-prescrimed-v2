import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Star, Search, ChevronRight } from "lucide-react";
import { useProtocolsBase } from "./hooks/useProtocolsBase";
import { useProtocolSearch, getRecentProtocolIds, pushRecentProtocol } from "./hooks/useProtocolSearch";
import { useProtocolFavorites } from "./hooks/useProtocolFavorites";
import { useProtocolsSettings } from "./hooks/useProtocolsSettings";
import ProtocolDetailDialog from "./ProtocolDetailDialog";
import { qualityBadges } from "./lib/protocolQuality";
import type { Protocolo, ProtocolContext } from "./lib/types";

interface Props {
  patientCtx?: { idade_anos?: number; gestante?: boolean; contexto?: ProtocolContext };
  onAddPrescription?: (med: { principio_ativo: string; dose?: string; via?: string; frequencia?: string; duracao?: string }) => void;
  onAddExams?: (exames: string[]) => void;
  onAddOrientations?: (texto: string) => void;
}

const toneClass = (tone: string) =>
  tone === "success" ? "bg-success/10 text-success border-success/30"
  : tone === "warning" ? "bg-warning/10 text-warning border-warning/30"
  : tone === "destructive" ? "bg-destructive/10 text-destructive border-destructive/30"
  : "bg-muted text-muted-foreground";

export default function ProtocolsCard({ patientCtx, onAddPrescription, onAddExams, onAddOrientations }: Props) {
  const { settings } = useProtocolsSettings();
  const { items, loading } = useProtocolsBase({ onlyReviewed: settings.usar_apenas_revisados });
  const { favorites, toggle } = useProtocolFavorites();
  const [query, setQuery] = useState("");
  const { results } = useProtocolSearch(items, query);
  const [opened, setOpened] = useState<Protocolo | null>(null);

  const recentIds = getRecentProtocolIds();
  const recent = useMemo(() => recentIds.map((id) => items.find((p) => p.id === id)).filter(Boolean) as Protocolo[], [items, recentIds]);
  const favs = useMemo(() => items.filter((p) => favorites.includes(p.id)), [items, favorites]);

  function open(p: Protocolo) {
    pushRecentProtocol(p.id);
    setOpened(p);
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Protocolos e Sugestões
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por queixa, CID ou diagnóstico…"
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {query.trim() ? (
            <Section title={`Resultados (${results.length})`}>
              {loading ? <Empty>Carregando…</Empty>
                : results.length === 0 ? <Empty>Nenhum protocolo encontrado.</Empty>
                : results.slice(0, 8).map((p) => (
                  <ItemRow key={p.id} p={p} fav={favorites.includes(p.id)} onToggleFav={() => toggle(p.id)} onOpen={() => open(p)} />
                ))}
            </Section>
          ) : (
            <>
              {settings.permitir_favoritos && favs.length > 0 && (
                <Section title="Favoritos">
                  {favs.slice(0, 5).map((p) => (
                    <ItemRow key={p.id} p={p} fav onToggleFav={() => toggle(p.id)} onOpen={() => open(p)} />
                  ))}
                </Section>
              )}
              {recent.length > 0 && (
                <Section title="Recentes">
                  {recent.slice(0, 5).map((p) => (
                    <ItemRow key={p.id} p={p} fav={favorites.includes(p.id)} onToggleFav={() => toggle(p.id)} onOpen={() => open(p)} />
                  ))}
                </Section>
              )}
              {favs.length === 0 && recent.length === 0 && (
                <Empty>Use a busca acima para encontrar um protocolo.</Empty>
              )}
            </>
          )}

          <p className="text-[11px] text-muted-foreground border-t pt-2">
            Protocolos são ferramentas de apoio à decisão clínica. Validar diagnóstico, gravidade, alergias, função renal/hepática, gestação, idade, contexto clínico e protocolos institucionais antes de aplicar.
          </p>
        </CardContent>
      </Card>

      {opened && (
        <ProtocolDetailDialog
          protocolo={opened}
          open={!!opened}
          onClose={() => setOpened(null)}
          patientCtx={patientCtx}
          onAddPrescription={onAddPrescription}
          onAddExams={onAddExams}
          onAddOrientations={onAddOrientations}
        />
      )}
    </>
  );

  function ItemRow({ p, fav, onToggleFav, onOpen }: { p: Protocolo; fav: boolean; onToggleFav: () => void; onOpen: () => void }) {
    const badges = qualityBadges(p);
    return (
      <div className="flex items-center gap-2 py-1.5 border-b last:border-0">
        <button onClick={onToggleFav} className="text-muted-foreground hover:text-warning" aria-label="Favoritar">
          <Star className={`h-4 w-4 ${fav ? "fill-warning text-warning" : ""}`} />
        </button>
        <button onClick={onOpen} className="flex-1 text-left min-w-0">
          <div className="text-sm font-medium truncate">{p.nome_protocolo}</div>
          <div className="flex flex-wrap gap-1 mt-0.5">
            <Badge variant="outline" className="text-[10px]">{p.tipo_protocolo}</Badge>
            <Badge variant="outline" className="text-[10px]">{p.contexto_atendimento}</Badge>
            {badges.slice(0, 2).map((b, i) => (
              <Badge key={i} variant="outline" className={`text-[10px] ${toneClass(b.tone)}`}>{b.label}</Badge>
            ))}
          </div>
        </button>
        <Button size="sm" variant="ghost" onClick={onOpen}>
          Abrir <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
    );
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{title}</h4>
      <div>{children}</div>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground py-2">{children}</p>;
}
