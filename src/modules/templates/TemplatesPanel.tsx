// Etapa 17 — Painel para uso na tela de prescrição:
// abas Favoritos / Modelos / Kits / Conjuntos. Standalone para futura integração.
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, FileText, Package, Layers } from "lucide-react";
import { useFavoritosMedicamentos } from "./hooks/useFavoritosMedicamentos";
import { useModelosPrescricao } from "./hooks/useModelosPrescricao";
import { useKitsRapidos } from "./hooks/useKitsRapidos";
import { useConjuntosRapidos } from "./hooks/useConjuntosRapidos";
import { computeModeloBadges } from "./lib/templateBadges";
import FavoritoReviewDialog from "./FavoritoReviewDialog";
import ModeloApplyReviewDialog from "./ModeloApplyReviewDialog";
import type { AnyTemplateItem, TemplateItemAlert } from "./lib/types";
import type { FavoritoMedicamento } from "./hooks/useFavoritosMedicamentos";
import type { ModeloPrescricao } from "./hooks/useModelosPrescricao";

interface Props {
  pacienteWeight?: number | null;
  onAddItems: (itens: AnyTemplateItem[]) => void;
  getAlertsForItem?: (item: AnyTemplateItem) => TemplateItemAlert[];
  getAlertsForFavorito?: (fav: FavoritoMedicamento) => string[];
}

export default function TemplatesPanel({
  pacienteWeight, onAddItems, getAlertsForItem, getAlertsForFavorito,
}: Props) {
  const { items: favoritos } = useFavoritosMedicamentos();
  const { items: modelos } = useModelosPrescricao("todos");
  const { items: kits } = useKitsRapidos();
  const { items: conjuntos } = useConjuntosRapidos();

  const [favRev, setFavRev] = useState<FavoritoMedicamento | null>(null);
  const [modeloRev, setModeloRev] = useState<ModeloPrescricao | null>(null);

  return (
    <Card>
      <CardContent className="pt-4">
        <Tabs defaultValue="favoritos">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="favoritos"><Star className="h-3 w-3 mr-1" />Favoritos</TabsTrigger>
            <TabsTrigger value="modelos"><FileText className="h-3 w-3 mr-1" />Modelos</TabsTrigger>
            <TabsTrigger value="kits"><Package className="h-3 w-3 mr-1" />Kits</TabsTrigger>
            <TabsTrigger value="conjuntos"><Layers className="h-3 w-3 mr-1" />Conjuntos</TabsTrigger>
          </TabsList>

          <TabsContent value="favoritos" className="pt-3 space-y-2">
            {favoritos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum favorito.</p>}
            {favoritos.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded border border-border p-2">
                <div>
                  <p className="text-sm font-medium">{f.nome_medicamento ?? f.principio_ativo}</p>
                  <p className="text-xs text-muted-foreground">{f.dose_padrao} {f.unidade_dose} · {f.via} · {f.frequencia_padrao}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setFavRev(f)}>Revisar e adicionar</Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="modelos" className="pt-3 space-y-2">
            {modelos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum modelo.</p>}
            {modelos.map((m) => {
              const itens = [
                ...((m.itens_prescricao as any[]) ?? []),
                ...((m.exames_sugeridos as any[]) ?? []),
                ...((m.orientacoes_paciente as any[]) ?? []),
                ...((m.cuidados_enfermagem as any[]) ?? []),
              ];
              return (
                <div key={m.id} className="rounded border border-border p-2 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{m.nome_modelo}</p>
                      <p className="text-xs text-muted-foreground">{m.contexto_atendimento} · {itens.length} itens · v{m.versao_modelo}</p>
                    </div>
                    <Button size="sm" onClick={() => setModeloRev(m)}>Revisar e aplicar</Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {computeModeloBadges(m).map((b) => (
                      <Badge key={b} variant="secondary" className="text-[10px]">{b}</Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="kits" className="pt-3 space-y-2">
            {kits.length === 0 && <p className="text-sm text-muted-foreground">Nenhum kit.</p>}
            {kits.map((k) => (
              <div key={k.id} className="flex items-center justify-between rounded border border-border p-2">
                <div>
                  <p className="text-sm font-medium">{k.nome}</p>
                  <p className="text-xs text-muted-foreground">{k.categoria ?? "—"} · {k.contexto}</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">{k.status_revisao}</Badge>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="conjuntos" className="pt-3 space-y-2">
            {conjuntos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum conjunto.</p>}
            {conjuntos.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded border border-border p-2">
                <div>
                  <p className="text-sm font-medium">{c.nome_conjunto}</p>
                  <p className="text-xs text-muted-foreground">{c.categoria} · {c.contexto_atendimento}</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">{c.visibilidade}</Badge>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <FavoritoReviewDialog
          open={!!favRev}
          onClose={() => setFavRev(null)}
          favorito={favRev}
          alerts={favRev && getAlertsForFavorito ? getAlertsForFavorito(favRev) : []}
          onAdd={(med) => {
            const item: AnyTemplateItem = {
              id: crypto.randomUUID(),
              tipo_item: "medicamento",
              ...med,
            };
            onAddItems([item]);
          }}
        />
        <ModeloApplyReviewDialog
          open={!!modeloRev}
          onClose={() => setModeloRev(null)}
          modelo={modeloRev}
          pacienteWeight={pacienteWeight}
          onApply={onAddItems}
          getAlertsForItem={getAlertsForItem}
        />
      </CardContent>
    </Card>
  );
}
