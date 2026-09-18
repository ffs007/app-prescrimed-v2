// Etapa 19 — Tela de revisão obrigatória da Entrada Inteligente.
import { useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import SmartInputBanner from "./SmartInputBanner";
import ExtractedMedicationCard from "./ExtractedMedicationCard";
import {
  ExtractedExamCard,
  ExtractedOrientationCard,
  ExtractedDocumentCard,
  ExtractedCareCard,
  ExtractedDiagnosisCard,
} from "./ExtractedGenericCards";
import { useExtractedItems } from "./hooks/useExtractedItems";
import type {
  ExtractedItem,
  EntradaItemTipo,
  SmartInputResult,
  SmartInputSettings,
} from "./lib/types";

type ExtractedItemTipoLocal = EntradaItemTipo;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: SmartInputResult | null;
  settings: SmartInputSettings | null;
  onConfirm: (selecionados: ExtractedItem[]) => void;
}

const tabConfig: { value: ExtractedItemTipoLocal; label: string }[] = [
  { value: "medicamento", label: "Medicamentos" },
  { value: "exame", label: "Exames" },
  { value: "orientacao", label: "Orientações" },
  { value: "documento", label: "Documentos" },
  { value: "cuidado_enfermagem", label: "Cuidados" },
  { value: "diagnostico", label: "Diagnósticos" },
  { value: "nao_reconhecido", label: "Não reconhecido" },
];

export default function SmartInputReviewDialog({
  open, onOpenChange, result, settings, onConfirm,
}: Props) {
  const initial = useMemo(() => result?.itens ?? [], [result]);
  const { items, toggle, edit, remove, selecionados } = useExtractedItems(initial, settings);

  const grouped = useMemo(() => {
    const g: Record<string, ExtractedItem[]> = {};
    for (const it of items) (g[it.tipo] ||= []).push(it);
    return g;
  }, [items]);

  const firstWithItems =
    tabConfig.find((t) => (grouped[t.value] ?? []).length > 0)?.value ?? "medicamento";

  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Revisar entrada inteligente</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <SmartInputBanner kind="review" />
          {result.alertas_ia.length > 0 && (
            <div className="rounded border border-warning/30 bg-warning/10 text-warning text-xs p-2 space-y-1">
              {result.alertas_ia.map((a, i) => <div key={i}>• {a}</div>)}
            </div>
          )}
        </div>

        <Tabs defaultValue={firstWithItems} className="flex-1 min-h-0 flex flex-col mt-2">
          <TabsList className="flex flex-wrap h-auto">
            {tabConfig.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="text-xs">
                {t.label} ({(grouped[t.value] ?? []).length})
              </TabsTrigger>
            ))}
          </TabsList>

          {tabConfig.map((t) => (
            <TabsContent key={t.value} value={t.value} className="flex-1 min-h-0">
              <ScrollArea className="h-[50vh] pr-3">
                <div className="space-y-2 py-2">
                  {(grouped[t.value] ?? []).length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-6">
                      Nenhum item identificado nesta categoria.
                    </div>
                  ) : (
                    grouped[t.value].map((it) => {
                      const common = {
                        onToggle: () => toggle(it.id),
                        onRemove: () => remove(it.id),
                      };
                      if (it.tipo === "medicamento")
                        return <ExtractedMedicationCard key={it.id} item={it}
                          onEdit={(p) => edit(it.id, p)} {...common} />;
                      if (it.tipo === "exame")
                        return <ExtractedExamCard key={it.id} item={it}
                          onEdit={(p) => edit(it.id, p)} {...common} />;
                      if (it.tipo === "orientacao")
                        return <ExtractedOrientationCard key={it.id} item={it}
                          onEdit={(p) => edit(it.id, p)} {...common} />;
                      if (it.tipo === "documento")
                        return <ExtractedDocumentCard key={it.id} item={it}
                          onEdit={(p) => edit(it.id, p)} {...common} />;
                      if (it.tipo === "cuidado_enfermagem")
                        return <ExtractedCareCard key={it.id} item={it}
                          onEdit={(p) => edit(it.id, p)} {...common} />;
                      if (it.tipo === "diagnostico")
                        return <ExtractedDiagnosisCard key={it.id} item={it}
                          onEdit={(p) => edit(it.id, p)} {...common} />;
                      return (
                        <div key={it.id} className="rounded border p-3 text-xs text-muted-foreground">
                          {it.texto_original}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter className="border-t pt-3">
          <div className="flex-1 text-xs text-muted-foreground">
            {selecionados.length} item(ns) selecionado(s)
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={selecionados.length === 0}
            onClick={() => { onConfirm(selecionados); onOpenChange(false); }}
          >
            Adicionar à prescrição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Mantém o tipo importado para compatibilidade futura.
export type { EntradaItemTipo };
