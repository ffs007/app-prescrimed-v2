// Etapa 17 — Revisão obrigatória antes de aplicar modelo à prescrição.
// Lista todos os itens com checkbox; permite editar dose/freq/duração/obs;
// mostra badges de alerta (alimentados por callback externo `getAlertsForItem`).
import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { ModeloPrescricao } from "./hooks/useModelosPrescricao";
import type { AnyTemplateItem, MedicationTemplateItem, TemplateItemAlert } from "./lib/types";
import { logTemplateUse } from "./lib/templateLog";
import { useTemplatesSettings } from "./hooks/useTemplatesSettings";

interface Props {
  open: boolean;
  onClose: () => void;
  modelo: ModeloPrescricao | null;
  pacienteWeight?: number | null;
  onApply: (itens: AnyTemplateItem[]) => void;
  /** Callback opcional para cruzar item com módulos de segurança. */
  getAlertsForItem?: (item: AnyTemplateItem) => TemplateItemAlert[];
}

export default function ModeloApplyReviewDialog({
  open, onClose, modelo, pacienteWeight, onApply, getAlertsForItem,
}: Props) {
  const { settings } = useTemplatesSettings();
  const [items, setItems] = useState<AnyTemplateItem[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [weight, setWeight] = useState<string>(pacienteWeight ? String(pacienteWeight) : "");

  useEffect(() => {
    if (!modelo) return;
    const all: AnyTemplateItem[] = [
      ...((modelo.itens_prescricao as any[]) ?? []),
      ...((modelo.exames_sugeridos as any[]) ?? []),
      ...((modelo.orientacoes_paciente as any[]) ?? []),
      ...((modelo.cuidados_enfermagem as any[]) ?? []),
    ];
    setItems(all);
    const initial: Record<string, boolean> = {};
    for (const it of all) initial[it.id] = it.obrigatorio !== false;
    // Bloqueio absoluto: desmarcado por padrão
    if (getAlertsForItem) {
      for (const it of all) {
        const alerts = getAlertsForItem(it);
        if (alerts.some((a) => a.nivel === "bloqueio")) initial[it.id] = false;
      }
    }
    setSelected(initial);
    void logTemplateUse({
      acao: "aberto",
      id_modelo: modelo.id,
      nome_modelo: modelo.nome_modelo,
      versao_modelo: modelo.versao_modelo,
      tipo_modelo: modelo.tipo_modelo,
      itens_visualizados: all.map((i) => ({ id: i.id, tipo: i.tipo_item })),
    });
  }, [modelo, getAlertsForItem]);

  const itemsWithAlerts = useMemo(() => {
    return items.map((it) => {
      const alerts = getAlertsForItem?.(it) ?? [];
      const maxLevel: TemplateItemAlert["nivel"] | null = alerts.length
        ? alerts.reduce((acc, a) => {
            const order = { informativo: 0, medio: 1, alto: 2, bloqueio: 3 } as const;
            return order[a.nivel] > order[acc] ? a.nivel : acc;
          }, "informativo" as TemplateItemAlert["nivel"])
        : null;
      return { item: it, alerts, maxLevel };
    });
  }, [items, getAlertsForItem]);

  const needsWeight = useMemo(
    () => items.some((it) => it.tipo_item === "medicamento" && /mg\/kg|kg/i.test((it as MedicationTemplateItem).unidade_dose ?? "")),
    [items],
  );

  function update(id: string, patch: Partial<MedicationTemplateItem>) {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, ...patch } as AnyTemplateItem : it));
  }

  async function handleApply() {
    const out = items.filter((it) => selected[it.id]);
    // Bloqueio absoluto
    if (settings?.bloquear_alerta_critico && getAlertsForItem) {
      for (const it of out) {
        if (getAlertsForItem(it).some((a) => a.nivel === "bloqueio")) {
          toast.error(`"${(it as any).principio_ativo ?? (it as any).nome_exame ?? "Item"}" possui bloqueio absoluto. Corrija ou desmarque.`);
          return;
        }
      }
    }
    // Justificativa para alerta alto
    if (settings?.exigir_just_alerta_alto && getAlertsForItem) {
      for (const it of out) {
        const hasHigh = getAlertsForItem(it).some((a) => a.nivel === "alto");
        if (hasHigh) {
          const j = window.prompt(`Justificativa obrigatória para alerta alto em "${(it as any).principio_ativo ?? "Item"}":`);
          if (!j) { toast.error("Justificativa necessária."); return; }
        }
      }
    }
    if (needsWeight && !weight) {
      toast.error("Peso necessário para cálculo seguro.");
      return;
    }
    onApply(out);
    void logTemplateUse({
      acao: "aplicado",
      id_modelo: modelo?.id,
      nome_modelo: modelo?.nome_modelo,
      versao_modelo: modelo?.versao_modelo,
      tipo_modelo: modelo?.tipo_modelo as any,
      itens_adicionados: out.map((i) => ({ id: i.id, tipo: i.tipo_item })),
    });
    onClose();
  }

  if (!modelo) return null;

  const levelStyle = (lvl: TemplateItemAlert["nivel"] | null) => {
    if (lvl === "bloqueio") return "border-destructive bg-destructive/10";
    if (lvl === "alto") return "border-destructive/60 bg-destructive/5";
    if (lvl === "medio") return "border-yellow-500/50 bg-yellow-500/5";
    return "border-border";
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisar modelo antes de aplicar</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded border border-border bg-muted/40 p-2 text-xs">
            <p className="font-medium">{modelo.nome_modelo}</p>
            <p className="text-muted-foreground">{modelo.descricao}</p>
            <p className="text-muted-foreground mt-1">
              Revise os itens selecionados antes de adicionar à prescrição.
            </p>
          </div>

          {needsWeight && (
            <div className="flex items-end gap-2 rounded border border-border p-2">
              <div className="flex-1">
                <Label>Peso do paciente (kg) *</Label>
                <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground pb-2">Necessário para cálculo seguro.</p>
            </div>
          )}

          {itemsWithAlerts.length === 0 && (
            <p className="text-sm text-muted-foreground">Modelo sem itens cadastrados.</p>
          )}

          {itemsWithAlerts.map(({ item, alerts, maxLevel }) => {
            const med = item.tipo_item === "medicamento" ? (item as MedicationTemplateItem) : null;
            return (
              <div key={item.id} className={`rounded border p-2 space-y-2 ${levelStyle(maxLevel)}`}>
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={!!selected[item.id]}
                    onCheckedChange={(v) => setSelected((p) => ({ ...p, [item.id]: !!v }))}
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-sm font-medium">
                        {item.tipo_item === "medicamento" && (item as MedicationTemplateItem).principio_ativo}
                        {item.tipo_item === "exame" && (item as any).nome_exame}
                        {item.tipo_item === "orientacao" && "Orientação"}
                        {item.tipo_item === "cuidado_enfermagem" && "Cuidado de enfermagem"}
                      </span>
                      <Badge variant="outline" className="text-[10px]">{item.tipo_item}</Badge>
                      {item.obrigatorio && <Badge variant="secondary" className="text-[10px]">obrigatório</Badge>}
                      {alerts.map((a, i) => (
                        <Badge key={i} variant={a.nivel === "bloqueio" || a.nivel === "alto" ? "destructive" : "secondary"} className="text-[10px]">
                          <AlertTriangle className="h-3 w-3 mr-1" />{a.tipo}
                        </Badge>
                      ))}
                    </div>
                    {med && item.editavel !== false && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        <Input placeholder="Dose" value={med.dose ?? ""} onChange={(e) => update(item.id, { dose: e.target.value })} />
                        <Input placeholder="Unidade" value={med.unidade_dose ?? ""} onChange={(e) => update(item.id, { unidade_dose: e.target.value })} />
                        <Input placeholder="Frequência" value={med.frequencia ?? ""} onChange={(e) => update(item.id, { frequencia: e.target.value })} />
                        <Input placeholder="Duração" value={med.duracao ?? ""} onChange={(e) => update(item.id, { duracao: e.target.value })} />
                        <Input placeholder="Observações" value={med.observacoes ?? ""} onChange={(e) => update(item.id, { observacoes: e.target.value })} className="col-span-2 md:col-span-4" />
                      </div>
                    )}
                    {item.tipo_item === "orientacao" && (
                      <p className="text-xs text-muted-foreground mt-1">{(item as any).texto}</p>
                    )}
                    {item.tipo_item === "cuidado_enfermagem" && (
                      <p className="text-xs text-muted-foreground mt-1">{(item as any).descricao}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleApply}>Adicionar selecionados</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
