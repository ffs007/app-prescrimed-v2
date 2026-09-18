// Mirror of public.iv_normalize_text for client-side search/dedupe
export function normalizeSearch(input: string | null | undefined): string {
  if (!input) return "";
  const map: Record<string, string> = {
    á: "a", à: "a", â: "a", ã: "a", ä: "a",
    é: "e", è: "e", ê: "e", ë: "e",
    í: "i", ì: "i", î: "i", ï: "i",
    ó: "o", ò: "o", ô: "o", õ: "o", ö: "o",
    ú: "u", ù: "u", û: "u", ü: "u",
    ç: "c", ñ: "n",
  };
  return input
    .toLowerCase()
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
