// Etapa 18 — Detalhe de prescrição anterior.
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { PrescriptionHistoryRow } from "./lib/types";

interface Props {
  row: PrescriptionHistoryRow | null;
  onClose: () => void;
}

export default function PrescriptionDetailDialog({ row, onClose }: Props) {
  if (!row) return null;
  const itens = (row.itens as unknown as Array<Record<string, unknown>>) ?? [];
  const alertas = (row.alertas_registrados as unknown as Array<Record<string, unknown>>) ?? [];
  const justificativas = (row.justificativas as unknown as Array<Record<string, unknown>>) ?? [];
  const snap = (row.dados_paciente_snapshot as unknown as Record<string, unknown>) ?? {};

  const dataStr = new Date(row.criado_em).toLocaleString("pt-BR");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prescrição de {dataStr}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            {row.profissional_nome && <div>Profissional: <span className="text-foreground">{row.profissional_nome}</span></div>}
            {row.contexto_atendimento && <div>Contexto: <span className="text-foreground">{row.contexto_atendimento}</span></div>}
            {row.cid && <div>CID: <span className="text-foreground">{row.cid}</span></div>}
            {row.diagnostico && <div>Diagnóstico: <span className="text-foreground">{row.diagnostico}</span></div>}
          </div>

          <Separator />

          <section>
            <h4 className="text-xs font-semibold mb-2">Dados do paciente na época</h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {Object.entries(snap).map(([k, v]) => (
                <div key={k} className="text-muted-foreground">
                  <span className="capitalize">{k.replace(/_/g, " ")}: </span>
                  <span className="text-foreground">
                    {Array.isArray(v) ? v.join(", ") : String(v ?? "—")}
                  </span>
                </div>
              ))}
              {Object.keys(snap).length === 0 && (
                <div className="text-muted-foreground">Sem dados registrados.</div>
              )}
            </div>
          </section>

          <Separator />

          <section>
            <h4 className="text-xs font-semibold mb-2">Itens prescritos</h4>
            <div className="space-y-1">
              {itens.map((it, i) => (
                <div key={i} className="text-xs rounded border p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{String(it.titulo ?? it.principio_ativo ?? "Item")}</span>
                    <Badge variant="outline" className="text-[10px]">{String(it.kind ?? "")}</Badge>
                  </div>
                  <div className="text-muted-foreground mt-1">
                    {[it.dose, it.via, it.frequencia, it.duracao].filter(Boolean).join(" • ")}
                  </div>
                  {it.observacoes && (
                    <p className="text-muted-foreground mt-1">{String(it.observacoes)}</p>
                  )}
                </div>
              ))}
              {itens.length === 0 && <div className="text-xs text-muted-foreground">Nenhum item.</div>}
            </div>
          </section>

          {alertas.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold mb-2">Alertas registrados</h4>
              <div className="space-y-1">
                {alertas.map((a, i) => (
                  <div key={i} className="text-xs rounded border bg-warning/5 border-warning/30 p-2">
                    {String(a.mensagem ?? a.tipo ?? JSON.stringify(a))}
                  </div>
                ))}
              </div>
            </section>
          )}

          {justificativas.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold mb-2">Justificativas</h4>
              <div className="space-y-1">
                {justificativas.map((j, i) => (
                  <div key={i} className="text-xs rounded border p-2">
                    {String(j.texto ?? JSON.stringify(j))}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
