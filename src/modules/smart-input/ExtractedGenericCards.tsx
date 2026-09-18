// Etapa 19 — Cards genéricos de revisão para itens não-medicamento.
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import ConfidenceBadge from "./ConfidenceBadge";
import MissingFieldsBadges from "./MissingFieldsBadges";
import type {
  ExtractedExam,
  ExtractedOrientation,
  ExtractedDocument,
  ExtractedCare,
  ExtractedDiagnosis,
  ExtractedItem,
} from "./lib/types";

interface BaseProps<T extends ExtractedItem> {
  item: T;
  onToggle: () => void;
  onEdit: (patch: Partial<T>) => void;
  onRemove: () => void;
}

function Wrapper({
  item,
  onToggle,
  onRemove,
  title,
  children,
}: {
  item: ExtractedItem;
  onToggle: () => void;
  onRemove: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border p-3 space-y-2">
      <div className="flex items-start gap-2">
        <Checkbox checked={item.selecionado} onCheckedChange={onToggle} className="mt-1" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{title}</span>
            <ConfidenceBadge score={item.confianca} />
            <MissingFieldsBadges fields={item.campos_faltantes} />
          </div>
          <div className="text-[11px] text-muted-foreground italic">"{item.texto_original}"</div>
          {children}
        </div>
        <Button size="sm" variant="ghost" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function ExtractedExamCard({ item, onToggle, onEdit, onRemove }: BaseProps<ExtractedExam>) {
  return (
    <Wrapper item={item} onToggle={onToggle} onRemove={onRemove} title={item.nome || "Exame"}>
      <div className="grid grid-cols-2 gap-2">
        <Input value={item.nome ?? ""} placeholder="Nome do exame"
          onChange={(e) => onEdit({ nome: e.target.value })} />
        <Input value={item.prioridade ?? ""} placeholder="Prioridade"
          onChange={(e) => onEdit({ prioridade: e.target.value })} />
        <Input value={item.justificativa ?? ""} placeholder="Justificativa" className="col-span-2"
          onChange={(e) => onEdit({ justificativa: e.target.value })} />
      </div>
    </Wrapper>
  );
}

export function ExtractedOrientationCard({ item, onToggle, onEdit, onRemove }: BaseProps<ExtractedOrientation>) {
  return (
    <Wrapper item={item} onToggle={onToggle} onRemove={onRemove} title="Orientação">
      <Textarea value={item.texto ?? ""} rows={2}
        onChange={(e) => onEdit({ texto: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <Input value={item.sinais_alerta ?? ""} placeholder="Sinais de alerta"
          onChange={(e) => onEdit({ sinais_alerta: e.target.value })} />
        <Input value={item.retorno ?? ""} placeholder="Retorno"
          onChange={(e) => onEdit({ retorno: e.target.value })} />
      </div>
    </Wrapper>
  );
}

export function ExtractedDocumentCard({ item, onToggle, onEdit, onRemove }: BaseProps<ExtractedDocument>) {
  return (
    <Wrapper item={item} onToggle={onToggle} onRemove={onRemove} title={`Documento: ${item.subtipo}`}>
      <Textarea value={item.conteudo ?? ""} rows={3}
        onChange={(e) => onEdit({ conteudo: e.target.value })} />
      {item.subtipo === "atestado" && (
        <Input
          type="number"
          value={item.duracao_dias ?? ""}
          placeholder="Duração (dias)"
          onChange={(e) => onEdit({ duracao_dias: e.target.value ? Number(e.target.value) : null })}
        />
      )}
    </Wrapper>
  );
}

export function ExtractedCareCard({ item, onToggle, onEdit, onRemove }: BaseProps<ExtractedCare>) {
  return (
    <Wrapper item={item} onToggle={onToggle} onRemove={onRemove} title="Cuidado de enfermagem">
      <div className="grid grid-cols-2 gap-2">
        <Input value={item.cuidado ?? ""} placeholder="Cuidado" className="col-span-2"
          onChange={(e) => onEdit({ cuidado: e.target.value })} />
        <Input value={item.frequencia ?? ""} placeholder="Frequência"
          onChange={(e) => onEdit({ frequencia: e.target.value })} />
        <Input value={item.condicao ?? ""} placeholder="Condição"
          onChange={(e) => onEdit({ condicao: e.target.value })} />
        <Input value={item.observacao ?? ""} placeholder="Observação" className="col-span-2"
          onChange={(e) => onEdit({ observacao: e.target.value })} />
      </div>
    </Wrapper>
  );
}

export function ExtractedDiagnosisCard({ item, onToggle, onEdit, onRemove }: BaseProps<ExtractedDiagnosis>) {
  return (
    <Wrapper item={item} onToggle={onToggle} onRemove={onRemove} title={item.hipotese || "Diagnóstico"}>
      <div className="grid grid-cols-2 gap-2">
        <Input value={item.hipotese ?? ""} placeholder="Hipótese diagnóstica"
          onChange={(e) => onEdit({ hipotese: e.target.value })} />
        <Input value={item.cid ?? ""} placeholder="CID"
          onChange={(e) => onEdit({ cid: e.target.value })} />
        <Input value={item.queixa ?? ""} placeholder="Queixa principal" className="col-span-2"
          onChange={(e) => onEdit({ queixa: e.target.value })} />
      </div>
    </Wrapper>
  );
}
