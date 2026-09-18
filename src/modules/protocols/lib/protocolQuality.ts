import type { Protocolo } from "./types";

const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

export function semFonte(p: Protocolo): boolean {
  return !p.fonte_referencia || !p.fonte_referencia.trim();
}
export function semRevisao(p: Protocolo): boolean {
  return p.status_revisao !== "revisado" || !p.revisado_em;
}
export function revisarFonte(p: Protocolo): boolean {
  if (!p.revisado_em) return false;
  return Date.now() - new Date(p.revisado_em).getTime() > TWELVE_MONTHS_MS;
}

export function qualityBadges(p: Protocolo): { label: string; tone: "muted"|"warning"|"success"|"destructive" }[] {
  const out: { label: string; tone: "muted"|"warning"|"success"|"destructive" }[] = [];
  if (p.status_revisao === "revisado") out.push({ label: "Revisado", tone: "success" });
  if (semRevisao(p)) out.push({ label: "Aguardando revisão", tone: "warning" });
  if (semFonte(p)) out.push({ label: "Sem fonte", tone: "warning" });
  if (revisarFonte(p)) out.push({ label: "Revisar fonte", tone: "warning" });
  return out;
}
