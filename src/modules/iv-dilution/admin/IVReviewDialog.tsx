import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { IVMedication } from "../IVDilutionAdminPage";
import { computeQualityIssues } from "../lib/ivQualityRules";
import { IVReviewStatusBadge } from "./IVQualityBadges";
import { logIVAction } from "../lib/ivAuditLog";

type Med = IVMedication & { status_revisao?: string | null; observacao_revisao?: string | null };

export default function IVReviewDialog({ medication, open, onClose, onSaved }: {
  medication: Med; open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [obs, setObs] = useState(medication.observacao_revisao ?? "");
  const [busy, setBusy] = useState(false);
  const issues = useMemo(() => computeQualityIssues(medication), [medication]);

  const update = async (status: "revisado" | "precisa_corrigir" | "inativo", action: "aprovou" | "solicitou_correcao" | "inativou") => {
    setBusy(true);
    const { data: { session } } = await supabase.auth.getSession();
    const patch: any = {
      status_revisao: status,
      observacao_revisao: obs || null,
      ...(status === "revisado" ? { revisado_por: session?.user.id, data_revisao: new Date().toISOString() } : {}),
    };
    const { error } = await supabase.from("iv_medications").update(patch).eq("id", medication.id);
    setBusy(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    await logIVAction({
      id_medicamento: medication.id, principio_ativo: medication.principio_ativo, tipo_acao: action,
      campo_alterado: "status_revisao", valor_anterior: medication.status_revisao ?? null, valor_novo: status,
    });
    toast.success("Atualizado.");
    onSaved();
    onClose();
  };

  const Row = ({ label, value }: { label: string; value: any }) => (
    <div className="grid grid-cols-3 gap-2 text-sm py-1 border-b border-border/40">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="col-span-2">{value || <span className="text-muted-foreground italic">—</span>}</div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Revisar: {medication.principio_ativo} <IVReviewStatusBadge status={medication.status_revisao} />
          </DialogTitle>
        </DialogHeader>

        {issues.length > 0 && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-3 space-y-1">
              <div className="text-xs font-medium text-amber-700 dark:text-amber-400">Verificações automáticas</div>
              <ul className="text-xs space-y-0.5">
                {issues.map((i) => <li key={i.code}>• {i.message}</li>)}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="space-y-1">
          <Row label="Apresentação" value={medication.apresentacao} />
          <Row label="Reconstituição" value={`${medication.volume_reconstituicao ?? ""} ${medication.diluente_reconstituicao ?? ""}`.trim()} />
          <Row label="Soluções compatíveis" value={medication.solucoes_compativeis?.join(", ")} />
          <Row label="Volume diluição" value={medication.volume_diluicao} />
          <Row label="Concentração máx." value={medication.concentracao_maxima} />
          <Row label="Tempo mín. infusão" value={medication.tempo_minimo_infusao} />
          <Row label="Velocidade máx." value={medication.velocidade_maxima_infusao} />
          <Row label="Incompatibilidades" value={medication.incompatibilidades?.join(", ")} />
          <Row label="Alerta médico" value={medication.alerta_medico} />
          <Row label="Alerta enfermagem/farmácia" value={medication.alerta_enfermagem_farmacia} />
          <Row label="Fonte" value={medication.fonte_referencia} />
          <Row label="Atualizado em" value={medication.data_atualizacao} />
          <Row label="Sinais" value={
            <div className="flex flex-wrap gap-1">
              {medication.exige_fotoprotecao && <Badge variant="secondary">Fotoproteção</Badge>}
              {medication.exige_filtro && <Badge variant="secondary">Filtro</Badge>}
              {medication.exige_equipo_fotossensivel && <Badge variant="secondary">Equipo fotossensível</Badge>}
              {medication.risco_flebite && <Badge variant="secondary">Risco flebite</Badge>}
            </div>
          } />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Observação do revisor</label>
          <Textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Notas, correções pedidas, fontes adicionais…" />
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button variant="destructive" onClick={() => update("inativo", "inativou")} disabled={busy}>Inativar</Button>
          <Button variant="secondary" onClick={() => update("precisa_corrigir", "solicitou_correcao")} disabled={busy}>Solicitar correção</Button>
          <Button onClick={() => update("revisado", "aprovou")} disabled={busy}>Aprovar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
