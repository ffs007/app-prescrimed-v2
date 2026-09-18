// Etapa 18 — Helper de classes para badges de reaproveitamento.
import type { ReuseBadge } from "../lib/reuseBadges";

export const reuseToneClass = (tone: ReuseBadge["tone"]) =>
  tone === "ok"
    ? "bg-success/10 text-success border-success/30"
    : tone === "info"
    ? "bg-muted text-muted-foreground border-border"
    : tone === "atencao"
    ? "bg-warning/10 text-warning border-warning/30"
    : tone === "alerta"
    ? "bg-destructive/10 text-destructive border-destructive/30"
    : tone === "bloqueio"
    ? "bg-destructive text-destructive-foreground border-destructive"
    : "bg-muted text-muted-foreground border-border";
