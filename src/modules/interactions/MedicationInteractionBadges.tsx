import { Badge } from "@/components/ui/badge";
import type { AnalysisResult, PrescItem } from "./lib/interactionsCalc";

interface Props {
  item: PrescItem;
  analysis: AnalysisResult;
  onClick?: () => void;
}

export default function MedicationInteractionBadges({ item, analysis, onClick }: Props) {
  const hasInteraction = analysis.interacoes.some(
    (f) => f.itemA.id === item.id || f.itemB.id === item.id
  );
  const inDuplicate = analysis.duplicidades.some((d) => d.itens.some((x) => x.id === item.id));
  const risksThisItem = analysis.riscos_acumulados.filter((r) =>
    r.contribuintes.some((c) => c.id === item.id) && (r.classificacao === "alto" || r.classificacao === "muito_alto")
  );

  if (!hasInteraction && !inDuplicate && risksThisItem.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1" onClick={onClick}>
      {hasInteraction && (
        <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/30">
          Interação
        </Badge>
      )}
      {inDuplicate && (
        <Badge variant="outline" className="text-[10px] bg-warning/15 text-warning border-warning/40">
          Duplicidade
        </Badge>
      )}
      {risksThisItem.slice(0, 3).map((r) => (
        <Badge key={r.categoria} variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/30">
          Risco {r.label.toLowerCase()}
        </Badge>
      ))}
    </div>
  );
}
