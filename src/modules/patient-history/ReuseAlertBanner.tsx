// Etapa 18 — Banner de avisos padrão do módulo.
import { AlertTriangle, Info } from "lucide-react";

export function ReuseAlertBanner({ kind = "default" }: { kind?: "default" | "before-reuse" | "comparison" }) {
  const message =
    kind === "before-reuse"
      ? "Revise os dados atuais do paciente antes de reaproveitar itens antigos."
      : kind === "comparison"
      ? "Alterações clínicas desde a prescrição anterior podem exigir ajuste de dose, intervalo, medicamento ou conduta."
      : "O histórico ajuda a recuperar informações anteriores, mas não substitui a revisão clínica atual.";
  const Icon = kind === "default" ? Info : AlertTriangle;
  const tone =
    kind === "default"
      ? "bg-muted/50 text-muted-foreground border-border"
      : "bg-warning/10 text-warning border-warning/30";
  return (
    <div className={`flex items-start gap-2 rounded-md border p-3 text-xs ${tone}`}>
      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

export default ReuseAlertBanner;
