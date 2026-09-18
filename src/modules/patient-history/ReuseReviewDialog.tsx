// Etapa 18 — Tela "Revisar antes de reaproveitar".
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Trash2, Edit2 } from "lucide-react";
import type { ReuseItem, PatientSnapshot, PrescriptionHistoryRow } from "./lib/types";
import { useReuseReview } from "./hooks/useReuseReview";
import { statusBadge, reuseContextBadges } from "./lib/reuseBadges";
import { reuseToneClass } from "./lib/reuseToneClass";
import PatientComparisonSection from "./PatientComparisonSection";
import ReuseAlertBanner from "./ReuseAlertBanner";
import { logReuseAction } from "./lib/reuseLog";

interface Props {
  open: boolean;
  onClose: () => void;
  prescricaoOrigem: PrescriptionHistoryRow | null;
  itensOriginais: ReuseItem[];
  pacienteAtual: PatientSnapshot;
  bloquearAlertaCritico: boolean;
  exigirJustDadosMudaram: boolean;
  onAdd: (itens: ReuseItem[], justificativa?: string) => void;
}

export default function ReuseReviewDialog({
  open, onClose, prescricaoOrigem, itensOriginais,
  pacienteAtual, bloquearAlertaCritico, exigirJustDadosMudaram, onAdd,
}: Props) {
  const pacienteAnterior =
    (prescricaoOrigem?.dados_paciente_snapshot as unknown as PatientSnapshot) ?? {};

  const { items, diffs, toggle, edit, remove, selecionados, temBloqueio } =
    useReuseReview({
      itensOriginais,
      pacienteAnterior,
      pacienteAtual,
      bloquearAlertaCritico,
      exigirJustDadosMudaram,
    });

  const [editing, setEditing] = useState<string | null>(null);
  const [justificativa, setJustificativa] = useState("");

  const exigeJust = items.some((it) =>
    it.selecionado && it.status === "exige_justificativa",
  );

  const handleAdd = async () => {
    if (exigeJust && !justificativa.trim()) return;
    await logReuseAction({
      id_paciente: prescricaoOrigem?.id_paciente ?? "",
      id_prescricao_origem: prescricaoOrigem?.id ?? null,
      data_prescricao_origem: prescricaoOrigem?.criado_em ?? null,
      acao: "item_adicionado",
      itens_visualizados: itensOriginais,
      itens_reaproveitados: selecionados,
      itens_editados: items.filter((i) => i.editado),
      itens_removidos: itensOriginais.filter(
        (o) => !items.find((i) => i.id === o.id),
      ),
      comparacoes_relevantes: diffs,
      justificativas: justificativa ? [{ texto: justificativa }] : [],
    });
    onAdd(selecionados, justificativa);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisar antes de reaproveitar</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <ReuseAlertBanner kind="before-reuse" />
          <PatientComparisonSection diffs={diffs} />

          {temBloqueio && (
            <div className="text-xs rounded-md border bg-destructive/10 text-destructive border-destructive/30 p-2">
              Esta prescrição possui itens que exigem revisão antes de serem reaproveitados.
            </div>
          )}

          <Separator />

          <section className="space-y-2">
            <h4 className="text-xs font-semibold">Itens da prescrição anterior</h4>
            {items.map((it) => {
              const sb = statusBadge(it.status);
              const ctxBadges = reuseContextBadges(it);
              const isEditing = editing === it.id;
              return (
                <div key={it.id} className="rounded border p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={it.selecionado}
                      disabled={it.status === "bloqueado"}
                      onCheckedChange={() => toggle(it.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{it.titulo}</span>
                        <Badge variant="outline" className={`text-[10px] ${reuseToneClass(sb.tone)}`}>
                          {sb.label}
                        </Badge>
                        {ctxBadges.map((b, i) => (
                          <Badge key={i} variant="outline" className={`text-[10px] ${reuseToneClass(b.tone)}`}>
                            {b.label}
                          </Badge>
                        ))}
                        <Badge variant="secondary" className="text-[10px]">{it.kind}</Badge>
                      </div>

                      {!isEditing ? (
                        <div className="text-xs text-muted-foreground mt-1">
                          {[it.dose, it.via, it.frequencia, it.duracao].filter(Boolean).join(" • ") || "—"}
                          {it.observacoes && <p className="mt-0.5">{it.observacoes}</p>}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Input value={it.dose ?? ""} placeholder="Dose"
                            onChange={(e) => edit(it.id, { dose: e.target.value })} />
                          <Input value={it.via ?? ""} placeholder="Via"
                            onChange={(e) => edit(it.id, { via: e.target.value })} />
                          <Input value={it.frequencia ?? ""} placeholder="Frequência"
                            onChange={(e) => edit(it.id, { frequencia: e.target.value })} />
                          <Input value={it.duracao ?? ""} placeholder="Duração"
                            onChange={(e) => edit(it.id, { duracao: e.target.value })} />
                          <Textarea value={it.observacoes ?? ""} placeholder="Observações"
                            className="col-span-2"
                            onChange={(e) => edit(it.id, { observacoes: e.target.value })} />
                        </div>
                      )}

                      {it.alertas_atuais.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {it.alertas_atuais.map((a, i) => (
                            <div key={i} className="text-[11px] rounded bg-warning/10 text-warning border border-warning/30 px-2 py-1">
                              {a}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <Button size="sm" variant="ghost"
                        onClick={() => setEditing(isEditing ? null : it.id)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost"
                        onClick={() => remove(it.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {items.length === 0 && (
              <div className="text-xs text-muted-foreground">Nenhum item disponível.</div>
            )}
          </section>

          {exigeJust && (
            <div className="space-y-1">
              <label className="text-xs font-medium">Justificativa clínica (obrigatória)</label>
              <Textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Justifique o reaproveitamento mesmo com mudanças nos dados."
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleAdd}
            disabled={selecionados.length === 0 || (exigeJust && !justificativa.trim())}
          >
            Adicionar selecionados ({selecionados.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
