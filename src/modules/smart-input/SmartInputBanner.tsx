// Etapa 19 — Avisos padrão.
import { Info, AlertTriangle } from "lucide-react";

export default function SmartInputBanner({ kind = "default" }: {
  kind?: "default" | "review" | "image" | "voice";
}) {
  const msg = {
    default: "A entrada inteligente ajuda a estruturar informações, mas não substitui revisão médica.",
    review: "Revise itens, doses, vias, frequências, durações e alertas antes de adicionar à prescrição.",
    image: "A extração de texto pode conter erros. Confira o conteúdo antes de usar.",
    voice: "Confira a transcrição antes de interpretar o comando.",
  }[kind];
  const Icon = kind === "default" ? Info : AlertTriangle;
  const tone = kind === "default"
    ? "bg-muted/50 text-muted-foreground border-border"
    : "bg-warning/10 text-warning border-warning/30";
  return (
    <div className={`flex items-start gap-2 rounded-md border p-2 text-xs ${tone}`}>
      <Icon className="h-4 w-4 mt-0.5 shrink-0" /><p>{msg}</p>
    </div>
  );
}
