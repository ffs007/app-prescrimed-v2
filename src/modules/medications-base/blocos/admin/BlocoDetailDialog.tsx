import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { useBlocoDetalhe } from "../hooks/useBlocoDetalhe";
import { useBaseMedicamentos } from "../../hooks/useBaseMedicamentos";
import MedicamentoFormDialog from "../../admin/MedicamentoFormDialog";
import BlocoChecklistList from "./BlocoChecklistList";
import { BLOCO_STATUS_LABEL, type BlocoStatus, type BlocoClinico } from "../lib/types";

type Props = {
  bloco: BlocoClinico | null;
  onClose: () => void;
  onUpdateStatus: (slug: string, status: BlocoStatus) => Promise<boolean>;
};

export default function BlocoDetailDialog({ bloco, onClose, onUpdateStatus }: Props) {
  const { planejados, checklist, loading, reload, upsertChecklist } = useBlocoDetalhe(bloco?.slug ?? null);
  const { upsert } = useBaseMedicamentos();
  const [createPrefill, setCreatePrefill] = useState<{ principio_ativo: string; categoria_clinica: string } | null>(null);

  if (!bloco) return null;

  const handleCreate = (principio: string) => {
    setCreatePrefill({ principio_ativo: principio, categoria_clinica: bloco.categoria_clinica ?? "dor_febre" });
  };

  const handleSaveMed = async (data: any) => {
    const ok = await upsert(data);
    if (ok) {
      setCreatePrefill(null);
      await reload();
    }
    return ok;
  };

  return (
    <Dialog open={!!bloco} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bloco.nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Status do bloco:</span>
            <Select value={bloco.status_bloco} onValueChange={(v) => onUpdateStatus(bloco.slug, v as BlocoStatus)}>
              <SelectTrigger className="w-56 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(BLOCO_STATUS_LABEL) as BlocoStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{BLOCO_STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <section>
            <h3 className="text-sm font-semibold mb-3">Medicamentos planejados</h3>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : (
              <div className="space-y-1.5">
                {planejados.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 py-2 px-3 rounded-md border border-border/40 hover:bg-muted/30">
                    <div className="flex items-center gap-2 min-w-0">
                      {p.medicamento_id ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <span className="text-sm truncate">{p.principio_ativo}</span>
                      {p.medicamento_id && (
                        <Badge variant="outline" className="text-[10px]">
                          {p.status_revisao === "revisado" ? "revisado" : (p.status_revisao ?? "rascunho")}
                        </Badge>
                      )}
                      {p.medicamento_id && p.apresentacoes_count > 0 && (
                        <Badge variant="outline" className="text-[10px]">{p.apresentacoes_count} apr.</Badge>
                      )}
                    </div>
                    {!p.medicamento_id && (
                      <Button size="sm" variant="outline" onClick={() => handleCreate(p.principio_ativo)}>
                        <Plus className="w-3 h-3 mr-1" /> Cadastrar
                      </Button>
                    )}
                  </div>
                ))}
                {!planejados.length && (
                  <p className="text-sm text-muted-foreground">Nenhum medicamento planejado.</p>
                )}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold mb-3">Checklist do bloco</h3>
            <BlocoChecklistList
              items={checklist}
              onChange={async (chave, status) => { await upsertChecklist(chave, status); }}
            />
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>

        {createPrefill && (
          <MedicamentoFormDialog
            open={!!createPrefill}
            initial={createPrefill as any}
            onClose={() => setCreatePrefill(null)}
            onSave={handleSaveMed}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
