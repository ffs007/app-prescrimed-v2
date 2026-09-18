// Etapa 17 — Mini revisão antes de adicionar favorito à prescrição.
import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { FavoritoMedicamento } from "./hooks/useFavoritosMedicamentos";

interface Props {
  open: boolean;
  onClose: () => void;
  favorito: FavoritoMedicamento | null;
  onAdd: (item: {
    principio_ativo: string; nome_medicamento?: string; apresentacao?: string;
    via?: string; dose?: string; unidade_dose?: string; frequencia?: string;
    duracao?: string; observacoes?: string;
  }) => void;
  alerts?: string[];
}

export default function FavoritoReviewDialog({ open, onClose, favorito, onAdd, alerts = [] }: Props) {
  const [form, setForm] = useState({
    dose: "", unidade: "", frequencia: "", duracao: "", obs: "", via: "",
  });
  useEffect(() => {
    if (favorito) {
      setForm({
        dose: favorito.dose_padrao ?? "",
        unidade: favorito.unidade_dose ?? "",
        frequencia: favorito.frequencia_padrao ?? "",
        duracao: favorito.duracao_padrao ?? "",
        obs: favorito.observacoes_padrao ?? "",
        via: favorito.via ?? "",
      });
    }
  }, [favorito, open]);

  if (!favorito) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Revisar antes de adicionar</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">{favorito.nome_medicamento ?? favorito.principio_ativo}</p>
            <p className="text-xs text-muted-foreground">{favorito.apresentacao}</p>
          </div>
          {alerts.length > 0 && (
            <div className="rounded border border-destructive/40 bg-destructive/5 p-2 text-xs">
              <p className="font-medium text-destructive mb-1">Alertas para o paciente:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {alerts.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Dose</Label><Input value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} /></div>
            <div><Label>Unidade</Label><Input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} /></div>
            <div><Label>Via</Label><Input value={form.via} onChange={(e) => setForm({ ...form, via: e.target.value })} /></div>
            <div><Label>Frequência</Label><Input value={form.frequencia} onChange={(e) => setForm({ ...form, frequencia: e.target.value })} /></div>
            <div className="col-span-2"><Label>Duração</Label><Input value={form.duracao} onChange={(e) => setForm({ ...form, duracao: e.target.value })} /></div>
          </div>
          <div><Label>Observações</Label><Textarea value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => {
            onAdd({
              principio_ativo: favorito.principio_ativo,
              nome_medicamento: favorito.nome_medicamento ?? undefined,
              apresentacao: favorito.apresentacao ?? undefined,
              via: form.via,
              dose: form.dose,
              unidade_dose: form.unidade,
              frequencia: form.frequencia,
              duracao: form.duracao,
              observacoes: form.obs,
            });
            onClose();
          }}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
