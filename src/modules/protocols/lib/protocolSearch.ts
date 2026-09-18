import type { Protocolo } from "./types";

export function normalize(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 .]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeCid(s: string): string {
  return (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function searchProtocols(items: Protocolo[], query: string): Protocolo[] {
  if (!query || !query.trim()) return items;
  const q = normalize(query);
  const qCid = normalizeCid(query);
  const tokens = q.split(" ").filter(Boolean);

  return items
    .map((p) => {
      const haystack = [
        p.nome_protocolo,
        p.area_clinica ?? "",
        p.populacao_alvo ?? "",
        ...(p.queixas_relacionadas || []),
        ...(p.sindromes_relacionadas || []),
        ...(p.palavras_chave || []),
        ...(p.diagnosticos_diferenciais || []),
      ].map(normalize).join(" ");
      const cidHay = (p.cids_relacionados || []).map(normalizeCid).join(" ");

      let score = 0;
      tokens.forEach((t) => { if (haystack.includes(t)) score += 2; });
      if (qCid && cidHay.includes(qCid)) score += 5;
      if (normalize(p.nome_protocolo).startsWith(q)) score += 3;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}
