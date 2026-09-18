/**
 * Levantamento de lacunas do hub: protocolos, escores, trials e fluxogramas
 * citados na curadoria das patologias mas ainda ausentes da biblioteca.
 *
 * A saída em Markdown é feita para alimentar pesquisa externa (Perplexity)
 * e voltar como atualização da base.
 */
import { KNOWLEDGE_RULES } from "@/modules/prescription/data/pathologyKnowledge";
import { normalizeText, type LibraryItem, type LibraryKind } from "./types";

export interface MissingEntry {
  pathology: string;
  kind: LibraryKind;
  name: string;
}

const tokens = (s: string) =>
  normalizeText(s)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4);

const isCovered = (name: string, haystack: string[]) => {
  const n = normalizeText(name);
  if (haystack.some((h) => h.includes(n) || n.includes(h))) return true;
  const ts = tokens(name);
  if (ts.length === 0) return false;
  return haystack.some((h) => ts.every((t) => h.includes(t)));
};

export function findMissingItems(items: LibraryItem[]): MissingEntry[] {
  const byKind: Record<LibraryKind, string[]> = {
    protocolo: [],
    escore: [],
    trial: [],
    fluxograma: [],
  };
  for (const it of items) {
    byKind[it.kind].push(normalizeText(`${it.name} ${it.description} ${it.pathologies.join(" ")}`));
  }

  const out: MissingEntry[] = [];
  for (const rule of KNOWLEDGE_RULES) {
    for (const p of rule.protocolos) {
      if (!isCovered(p, byKind.protocolo))
        out.push({ pathology: rule.label, kind: "protocolo", name: p });
    }
    for (const e of rule.escores) {
      if (!isCovered(e, byKind.escore)) out.push({ pathology: rule.label, kind: "escore", name: e });
    }
    const hasTrial = byKind.trial.some((t) => tokens(rule.label).some((k) => t.includes(k)));
    if (!hasTrial)
      out.push({ pathology: rule.label, kind: "trial", name: `Trials de referência para ${rule.label}` });
    const hasFlow = byKind.fluxograma.some((t) => tokens(rule.label).some((k) => t.includes(k)));
    if (!hasFlow)
      out.push({ pathology: rule.label, kind: "fluxograma", name: `Fluxograma de manejo de ${rule.label}` });
  }
  return out;
}

const KIND_TITLE: Record<LibraryKind, string> = {
  protocolo: "Protocolos",
  escore: "Escores",
  trial: "Trials",
  fluxograma: "Fluxogramas",
};

export function buildMissingItemsMarkdown(missing: MissingEntry[]): string {
  const date = new Date().toLocaleDateString("pt-BR");
  const byPathology = new Map<string, MissingEntry[]>();
  for (const m of missing) {
    const arr = byPathology.get(m.pathology) ?? [];
    arr.push(m);
    byPathology.set(m.pathology, arr);
  }

  const lines: string[] = [
    "# Itens faltantes — Protocolos & Escores",
    "",
    `Gerado em ${date} pelo PrescriMed.`,
    "",
    "Para cada item abaixo, buscar: referência/guideline atual, ano da última revisão,",
    "critérios de aplicação, população-alvo e conduta associada. Priorizar diretrizes",
    "brasileiras (SBC, AMB, Ministério da Saúde) e, na ausência, internacionais.",
    "",
  ];

  for (const [pathology, entries] of byPathology) {
    lines.push(`## ${pathology}`, "");
    for (const kind of ["protocolo", "escore", "trial", "fluxograma"] as LibraryKind[]) {
      const list = entries.filter((e) => e.kind === kind);
      if (list.length === 0) continue;
      lines.push(`### ${KIND_TITLE[kind]}`);
      for (const l of list) lines.push(`- [ ] ${l.name}`);
      lines.push("");
    }
  }

  lines.push("---", "", `Total de lacunas: ${missing.length}.`);
  return lines.join("\n");
}

export function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
