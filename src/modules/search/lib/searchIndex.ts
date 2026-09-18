/**
 * Índice da busca unificada.
 *
 * Resultados são hierárquicos: primeiro o essencial (ações e patologias),
 * depois conteúdo clínico (protocolos, escores) e por fim os detalhes
 * (exames, condutas, encaminhamentos, CIDs de cada patologia).
 */
import { KNOWLEDGE_RULES } from "@/modules/prescription/data/pathologyKnowledge";
import { normalizeText, type LibraryItem } from "@/modules/library/lib/types";

export type ResultTier = "essencial" | "conteudo" | "detalhe";

export type ResultKind =
  | "acao"
  | "patologia"
  | "protocolo"
  | "escore"
  | "trial"
  | "fluxograma"
  | "exame"
  | "conduta"
  | "encaminhamento"
  | "cid";

export interface SearchEntry {
  id: string;
  kind: ResultKind;
  tier: ResultTier;
  title: string;
  subtitle?: string;
  /** Patologia à qual o item pertence, quando aplicável. */
  pathology?: string;
  /** Rota de destino. */
  to: string;
  keywords: string;
}

export const TIER_LABEL: Record<ResultTier, string> = {
  essencial: "Essencial",
  conteudo: "Conteúdo clínico",
  detalhe: "Detalhes",
};

export const KIND_LABEL: Record<ResultKind, string> = {
  acao: "Ação",
  patologia: "Patologia",
  protocolo: "Protocolo",
  escore: "Escore",
  trial: "Trial",
  fluxograma: "Fluxograma",
  exame: "Exame",
  conduta: "Conduta",
  encaminhamento: "Encaminhamento",
  cid: "CID",
};

export const NAV_ENTRIES: SearchEntry[] = [
  { id: "nav-nova", kind: "acao", tier: "essencial", title: "Nova prescrição", to: "/app/prescricao/nova", keywords: "prescrever receita nova prescricao documento" },
  { id: "nav-pacientes", kind: "acao", tier: "essencial", title: "Pacientes", to: "/app/pacientes", keywords: "paciente cadastro" },
  { id: "nav-modelos", kind: "acao", tier: "essencial", title: "Modelos rápidos", to: "/app/modelos", keywords: "modelo template rapido" },
  { id: "nav-medicamentos", kind: "acao", tier: "essencial", title: "Medicamentos", to: "/app/medicamentos", keywords: "farmaco medicamento dose bula" },
  { id: "nav-patologias", kind: "acao", tier: "essencial", title: "Minhas patologias", to: "/app/patologias", keywords: "patologia personalizacao favoritos" },
  { id: "nav-internacoes", kind: "acao", tier: "essencial", title: "Internações (AIH)", to: "/app/internacoes", keywords: "aih internacao sus autorizacao" },
  { id: "nav-notificacoes", kind: "acao", tier: "essencial", title: "Notificações compulsórias", to: "/app/notificacoes", keywords: "notificacao sinan agravo vigilancia" },
  { id: "nav-documentos", kind: "acao", tier: "essencial", title: "Documentos", to: "/app/documentos", keywords: "atestado relatorio laudo encaminhamento" },
  { id: "nav-historico", kind: "acao", tier: "essencial", title: "Histórico", to: "/app/historico", keywords: "historico emissoes" },
  { id: "nav-hub", kind: "acao", tier: "essencial", title: "Protocolos & Escores", to: "/app/protocolos-escores", keywords: "hub protocolo escore trial fluxograma" },
  { id: "nav-trauma", kind: "acao", tier: "essencial", title: "Escores de trauma", to: "/app/escores-trauma", keywords: "rts iss triss trauma" },
  { id: "nav-atualizacoes", kind: "acao", tier: "essencial", title: "Atualizações clínicas", to: "/app/atualizacoes", keywords: "ia atualizacoes diretriz evidencia" },
  { id: "nav-indicadores", kind: "acao", tier: "essencial", title: "Indicadores", to: "/app/indicadores", keywords: "indicador qualidade metrica" },
  { id: "nav-requisitos", kind: "acao", tier: "essencial", title: "Requisitos e novas áreas", to: "/app/requisitos", keywords: "questionario requisitos sugestoes roadmap" },
];

const pathologyRoute = (label: string, from?: string) => {
  const params = new URLSearchParams({ patologia: label });
  if (from) params.set("origem", from);
  return `/app/prescricao/nova?${params.toString()}`;
};

/** Entradas derivadas das regras clínicas por patologia. */
export function buildPathologyEntries(): SearchEntry[] {
  const entries: SearchEntry[] = [];
  for (const rule of KNOWLEDGE_RULES) {
    if (!rule.label) continue;
    const base = pathologyRoute(rule.label);
    entries.push({
      id: `pat-${normalizeText(rule.label)}`,
      kind: "patologia",
      tier: "essencial",
      title: rule.label,
      subtitle: rule.cids.slice(0, 3).join(", ") || undefined,
      pathology: rule.label,
      to: base,
      keywords: [rule.label, ...rule.match, ...rule.cids].join(" "),
    });
    const detail = (kind: ResultKind, list: string[]) =>
      list.slice(0, 8).forEach((item, i) =>
        entries.push({
          id: `${kind}-${normalizeText(rule.label)}-${i}`,
          kind,
          tier: "detalhe",
          title: item,
          subtitle: rule.label,
          pathology: rule.label,
          to: base,
          keywords: `${item} ${rule.label}`,
        }),
      );
    detail("exame", rule.exames);
    detail("conduta", rule.condutas);
    detail("encaminhamento", rule.encaminhamentos);
    detail("cid", rule.cids);
  }
  return entries;
}

export function libraryEntries(items: LibraryItem[]): SearchEntry[] {
  return items.map((it) => ({
    id: `lib-${it.id}`,
    kind: (it.kind as ResultKind) ?? "protocolo",
    tier: "conteudo" as ResultTier,
    title: it.name,
    subtitle: it.description || it.reference || undefined,
    pathology: it.pathologies[0],
    to: `/app/protocolos-escores?q=${encodeURIComponent(it.name)}`,
    keywords: [it.name, it.description, it.specialty ?? "", ...it.pathologies].join(" "),
  }));
}

const TIER_WEIGHT: Record<ResultTier, number> = { essencial: 0, conteudo: 1, detalhe: 2 };

export interface ScoredEntry extends SearchEntry {
  score: number;
}

export function scoreEntries(entries: SearchEntry[], query: string, contextTerms: string[] = []): ScoredEntry[] {
  const q = normalizeText(query.trim());
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const ctx = contextTerms.map(normalizeText).filter(Boolean);
  const out: ScoredEntry[] = [];
  for (const e of entries) {
    const hay = normalizeText(`${e.title} ${e.subtitle ?? ""} ${e.keywords}`);
    const title = normalizeText(e.title);
    if (!terms.every((t) => hay.includes(t))) continue;
    let score = 0;
    if (title === q) score += 60;
    else if (title.startsWith(q)) score += 40;
    else if (title.includes(q)) score += 25;
    score += terms.filter((t) => title.includes(t)).length * 6;
    score += 12 - TIER_WEIGHT[e.tier] * 6;
    if (ctx.some((c) => c && hay.includes(c))) score += 15;
    out.push({ ...e, score });
  }
  return out.sort(
    (a, b) => TIER_WEIGHT[a.tier] - TIER_WEIGHT[b.tier] || b.score - a.score || a.title.localeCompare(b.title),
  );
}

/** Patologias relacionadas: compartilham CID, encaminhamento ou termo de busca. */
export function relatedPathologies(label: string, limit = 5): string[] {
  const rule = KNOWLEDGE_RULES.find((r) => normalizeText(r.label) === normalizeText(label));
  if (!rule) return [];
  const mine = new Set(
    [...rule.cids, ...rule.encaminhamentos, ...rule.protocolos, ...rule.escores].map(normalizeText),
  );
  return KNOWLEDGE_RULES.filter((r) => r.label && normalizeText(r.label) !== normalizeText(label))
    .map((r) => ({
      label: r.label,
      overlap: [...r.cids, ...r.encaminhamentos, ...r.protocolos, ...r.escores].filter((x) =>
        mine.has(normalizeText(x)),
      ).length,
    }))
    .filter((r) => r.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit)
    .map((r) => r.label);
}

export const pathologyTarget = pathologyRoute;
