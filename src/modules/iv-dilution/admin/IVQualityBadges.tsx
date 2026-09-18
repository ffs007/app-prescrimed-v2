import { Badge } from "@/components/ui/badge";
import { computeQualityIssues } from "../lib/ivQualityRules";
import type { IVMedication } from "../IVDilutionAdminPage";

export function IVQualityBadges({ med, max = 2 }: { med: Partial<IVMedication>; max?: number }) {
  const issues = computeQualityIssues(med);
  if (!issues.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {issues.slice(0, max).map((i) => (
        <Badge
          key={i.code}
          variant="outline"
          className={
            i.code === "fonte_desatualizada"
              ? "border-amber-500/40 text-amber-700 dark:text-amber-400 text-[10px]"
              : "border-destructive/40 text-destructive text-[10px]"
          }
        >
          {i.message}
        </Badge>
      ))}
      {issues.length > max && (
        <Badge variant="outline" className="text-[10px]">+{issues.length - max}</Badge>
      )}
    </div>
  );
}

export const reviewStatusLabel = (s?: string | null) => ({
  rascunho: "Rascunho",
  aguardando_revisao: "Aguardando revisão",
  revisado: "Revisado",
  precisa_corrigir: "Precisa corrigir",
  inativo: "Inativo",
}[s ?? ""] ?? s ?? "—");

export function IVReviewStatusBadge({ status }: { status?: string | null }) {
  const cls =
    status === "revisado" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
    : status === "aguardando_revisao" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
    : status === "precisa_corrigir" ? "bg-destructive/10 text-destructive border-destructive/30"
    : status === "inativo" ? "bg-muted text-muted-foreground border-border"
    : "bg-secondary text-secondary-foreground border-border";
  return <Badge variant="outline" className={cls}>{reviewStatusLabel(status)}</Badge>;
}
