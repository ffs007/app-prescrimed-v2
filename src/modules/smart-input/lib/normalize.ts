// Etapa 19 — Normalização de termos médicos comuns.
const VIA_MAP: Record<string, string> = {
  ev: "IV", iv: "IV", endovenoso: "IV", intravenoso: "IV",
  vo: "VO", "via oral": "VO", oral: "VO",
  sc: "SC", subcutaneo: "SC", "subcutâneo": "SC",
  im: "IM", intramuscular: "IM",
  sl: "SL", sublingual: "SL",
  in: "IN", intranasal: "IN",
  retal: "Retal", topica: "Tópica", "tópica": "Tópica",
};

const CONDICAO_MAP: Record<string, string> = {
  sn: "se necessário", sos: "se necessário", "se necessario": "se necessário",
  acm: "a critério médico", "a criterio medico": "a critério médico",
};

const FREQ_MAP: Record<string, string> = {
  "12/12h": "a cada 12 horas",
  "8/8h": "a cada 8 horas",
  "6/6h": "a cada 6 horas",
  "4/4h": "a cada 4 horas",
  "24/24h": "uma vez ao dia",
  "1x/dia": "uma vez ao dia",
  "2x/dia": "duas vezes ao dia",
  "3x/dia": "três vezes ao dia",
  "4x/dia": "quatro vezes ao dia",
};

const UNIDADES_VALIDAS = new Set([
  "g", "mg", "mcg", "µg", "ng",
  "ml", "mL", "L", "l",
  "ui", "UI",
  "meq", "mEq", "mmol",
  "gota", "gotas",
  "ampola", "ampolas",
  "frasco", "frascos",
  "comprimido", "comprimidos", "comp",
  "capsula", "cápsula", "capsulas", "cápsulas",
  "puff", "puffs", "%",
]);

const norm = (s: string) =>
  s.trim().toLowerCase().replace(/\s+/g, " ");

export function normalizeViaText(text: string | null | undefined): string | null {
  if (!text) return null;
  const k = norm(text);
  return VIA_MAP[k] ?? text.trim();
}

export function normalizeFrequency(text: string | null | undefined): string | null {
  if (!text) return null;
  const k = norm(text).replace(/\s/g, "");
  return FREQ_MAP[k] ?? text.trim();
}

export function normalizeCondicao(text: string | null | undefined): string | null {
  if (!text) return null;
  const k = norm(text);
  return CONDICAO_MAP[k] ?? text.trim();
}

export function isValidUnit(unit: string | null | undefined): boolean {
  if (!unit) return false;
  return UNIDADES_VALIDAS.has(unit.trim()) || UNIDADES_VALIDAS.has(unit.trim().toLowerCase());
}
