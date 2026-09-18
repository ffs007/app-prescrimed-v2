import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function BetaBadge({ className }: { className?: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`text-[10px] uppercase tracking-wide bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400 cursor-help ${className ?? ""}`}
          >
            Beta
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs">
          Versão beta em validação. Revise cuidadosamente todas as prescrições, doses, alertas e documentos antes de usar.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
