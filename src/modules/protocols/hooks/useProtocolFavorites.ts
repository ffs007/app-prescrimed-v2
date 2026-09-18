import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function useProtocolFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) { setFavorites([]); return; }
      const { data, error } = await (supabase.from("protocolos_favoritos") as any)
        .select("id_protocolo").eq("user_id", u.user.id);
      if (error) {
        console.error("[useProtocolFavorites] falha ao carregar favoritos:", error);
        toast.error("Não foi possível carregar os protocolos favoritos.");
        return;
      }
      setFavorites(((data as { id_protocolo: string }[]) || []).map((r) => r.id_protocolo));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function toggle(id_protocolo: string) {
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) return;
    if (favorites.includes(id_protocolo)) {
      const { error } = await (supabase.from("protocolos_favoritos") as any).delete().eq("user_id", u.user.id).eq("id_protocolo", id_protocolo);
      if (error) {
        console.error("[useProtocolFavorites] falha ao remover favorito:", error);
        toast.error("Não foi possível remover o protocolo dos favoritos.");
        return;
      }
      setFavorites((f) => f.filter((x) => x !== id_protocolo));
    } else {
      const { error } = await (supabase.from("protocolos_favoritos") as any).insert({ user_id: u.user.id, id_protocolo });
      if (error) {
        console.error("[useProtocolFavorites] falha ao adicionar favorito:", error);
        toast.error("Não foi possível adicionar o protocolo aos favoritos.");
        return;
      }
      setFavorites((f) => [...f, id_protocolo]);
    }
  }
  return { favorites, loading, toggle, reload: load };
}
