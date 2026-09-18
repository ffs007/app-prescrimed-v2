import { Badge } from "@/components/ui/badge";
import type { MedAlertResult } from "./lib/clinicalAlertsCalc";

interface Props { result?: MedAlertResult; onClick?: () => void }

export default function MedicationClinicalBadges({ result, onClick }: Props) {
  if (!result || result.badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1" onClick={onClick}>
      {result.badges.map((b) => (
        <Badge key={b} variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/30">
          {b}
        </Badge>
      ))}
      {result.bloqueios.length > 0 && (
        <Badge className="text-[10px] bg-destructive/10 text-destructive border-destructive/30">
          Contraindicado
        </Badge>
      )}
    </div>
  );
}
