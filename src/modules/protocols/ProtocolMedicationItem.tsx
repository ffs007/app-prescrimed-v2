import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Plus } from "lucide-react";
import ProtocolMedicationReviewDialog from "./ProtocolMedicationReviewDialog";
import type { MedicamentoSugerido, ProtocolContext } from "./lib/types";

interface Props {
  med: MedicamentoSugerido;
  patientCtx?: { idade_anos?: number; gestante?: boolean; contexto?: ProtocolContext };
  cruzarSeguranca?: boolean;
  exigirRevisao?: boolean;
  onAdd: (payload: { principio_ativo: string; dose?: string; via?: string; frequencia?: string; duracao?: string; observacao?: string }) => void;
}

export default function ProtocolMedicationItem({ med, patientCtx, cruzarSeguranca, exigirRevisao, onAdd }: Props) {
  const [reviewing, setReviewing] = useState(false);

  // Badges informativos baseados em contexto (cruzamento real fica nos módulos respectivos)
  const flags: { label: string; tone: "warning"|"destructive"|"muted" }[] = [];
  if (cruzarSeguranca) {
    if (patientCtx?.gestante) flags.push({ label: "Verificar gestação", tone: "warning" });
    if (patientCtx?.idade_anos !== undefined && patientCtx.idade_anos < 12) flags.push({ label: "Dose pediátrica", tone: "warning" });
    if (med.via && /iv|endovenosa|intravenosa/i.test(med.via)) flags.push({ label: "Segurança IV", tone: "warning" });
  }
  const semFonte = !med.fonte || !med.fonte.trim();
  const naoRevisado = exigirRevisao && med.status_revisao !== "revisado";

  return (
    <>
      <div className="border rounded-md p-2 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">
              {med.principio_ativo}
              {med.nome_sugestao && <span className="text-muted-foreground font-normal"> · {med.nome_sugestao}</span>}
            </div>
            <div className="text-xs text-muted-foreground">
              {[med.dose_sugerida && `${med.dose_sugerida}${med.unidade_dose ? " " + med.unidade_dose : ""}`, med.via, med.frequencia, med.duracao].filter(Boolean).join(" · ")}
            </div>
            {med.indicacao_no_protocolo && <div className="text-xs text-muted-foreground italic">{med.indicacao_no_protocolo}</div>}
          </div>
          <Button size="sm" onClick={() => setReviewing(true)}>
            <Plus className="h-3 w-3 mr-1" /> Adicionar
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {med.nivel_recomendacao && <Badge variant="outline" className="text-[10px]">{med.nivel_recomendacao}</Badge>}
          {semFonte && <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/30">Sem fonte</Badge>}
          {naoRevisado && <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/30">Aguardando revisão</Badge>}
          {flags.map((f, i) => (
            <Badge key={i} variant="outline" className={`text-[10px] ${f.tone === "destructive" ? "bg-destructive/10 text-destructive border-destructive/30" : f.tone === "warning" ? "bg-warning/10 text-warning border-warning/30" : "bg-muted text-muted-foreground"}`}>
              <AlertTriangle className="h-2.5 w-2.5 mr-1 inline" />{f.label}
            </Badge>
          ))}
        </div>
      </div>

      {reviewing && (
        <ProtocolMedicationReviewDialog
          open={reviewing}
          med={med}
          onClose={() => setReviewing(false)}
          onConfirm={(payload) => { onAdd(payload); setReviewing(false); }}
        />
      )}
    </>
  );
}
