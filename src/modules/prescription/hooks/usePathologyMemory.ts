/**
 * usePathologyMemory — favoritos e recentes do Bloco C.
 *
 * Persiste em localStorage:
 *  - favoritos: lista de pathologyIds marcados pelo médico
 *  - recentes: últimos N pathologyIds carregados (ordem de uso)
 *
 * Mantemos a lógica simples: tudo identificado por id numérico para
 * compatibilidade com Pathology.id. Subtipos não são memorizados
 * separadamente — favoritar/recentar opera no nível da patologia pai.
 */
import { useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const RECENT_LIMIT = 8;

export const usePathologyMemory = () => {
  const [favorites, setFavorites] = useLocalStorage<number[]>("prescrimed.pathology.favorites", []);
  const [recents, setRecents] = useLocalStorage<number[]>("prescrimed.pathology.recents", []);
  const [usage, setUsage] = useLocalStorage<Record<string, number>>(
    "prescrimed.pathology.usage",
    {},
  );

  const isFavorite = useCallback((id: number) => favorites.includes(id), [favorites]);

  const toggleFavorite = useCallback(
    (id: number) => {
      setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    },
    [setFavorites],
  );

  const pushRecent = useCallback(
    (id: number) => {
      setRecents((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, RECENT_LIMIT));
    },
    [setRecents],
  );

  const clearRecents = useCallback(() => setRecents([]), [setRecents]);

  /** Conta um uso da patologia (por chave de nome), para ordenar por frequência. */
  const registerUse = useCallback(
    (key: string) => {
      setUsage((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
    },
    [setUsage],
  );

  const useCount = useCallback((key: string) => usage[key] ?? 0, [usage]);

  return {
    favorites,
    recents,
    isFavorite,
    toggleFavorite,
    pushRecent,
    clearRecents,
    usage,
    registerUse,
    useCount,
  };
};
