import type { BlocoClinico, BlocoStatus } from "./types";

export function calcularStatusDerivado(
  bloco: BlocoClinico,
  cadastrados: number,
  revisados: number,
  pendentes: number,
): BlocoStatus {
  // override manual sempre vence
  if (bloco.status_bloco !== "nao_iniciado") return bloco.status_bloco;
  if (cadastrados === 0) return "nao_iniciado";
  if (cadastrados < bloco.total_previsto) return "em_cadastro";
  if (revisados === 0) return "em_cadastro";
  if (pendentes > 0) return "em_revisao";
  return "pronto_beta";
}

export function statusVariantClass(s: BlocoStatus): string {
  switch (s) {
    case "pronto_beta":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400";
    case "em_revisao":
      return "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400";
    case "em_cadastro":
      return "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400";
    case "precisa_ajuste":
      return "bg-destructive/10 text-destructive border-destructive/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}
