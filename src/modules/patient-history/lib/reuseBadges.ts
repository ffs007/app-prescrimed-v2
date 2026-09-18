// Etapa 18 — Badges para itens reaproveitados.
import type { ItemReuseStatus, ReuseItem } from "./types";

export interface ReuseBadge {
  label: string;
  tone: "neutral" | "info" | "atencao" | "alerta" | "bloqueio" | "ok";
}

export function statusBadge(status: ItemReuseStatus): ReuseBadge {
  switch (status) {
    case "seguro_para_revisao":
      return { label: "OK", tone: "ok" };
    case "requer_atencao":
      return { label: "Atenção", tone: "atencao" };
    case "exige_justificativa":
      return { label: "Justificativa", tone: "alerta" };
    case "bloqueado":
      return { label: "Bloqueado", tone: "bloqueio" };
    case "dados_insuficientes":
      return { label: "Dados insuficientes", tone: "atencao" };
    case "desatualizado":
      return { label: "Revisar fonte", tone: "atencao" };
  }
}

export function reuseContextBadges(item: ReuseItem): ReuseBadge[] {
  const out: ReuseBadge[] = [{ label: "Reaproveitado", tone: "info" }];
  if (item.editado) out.push({ label: "Editado", tone: "info" });
  if (item.alertas_atuais.length)
    out.push({ label: "Alerta novo", tone: "alerta" });
  return out;
}
