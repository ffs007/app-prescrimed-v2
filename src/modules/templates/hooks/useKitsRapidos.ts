// Etapa 17 — Hook de kits rápidos por situação clínica.
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type KitRapido = Database["public"]["Tables"]["kits_rapidos"]["Row"];
export type KitRapidoInsert = Database["public"]["Tables"]["kits_rapidos"]["Insert"];

export function useKitsRapidos() {
  const [items, setItems] = useState<KitRapido[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("kits_rapidos")
      .select("*")
      .eq("ativo", true)
      .order("atualizado_em", { ascending: false });
    if (!error && data) setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (
    input: Omit<KitRapidoInsert, "criado_por"> & { id?: string },
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sem usuário");
    if (input.id) {
      const { id, ...patch } = input;
      const { error } = await supabase.from("kits_rapidos").update(patch).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("kits_rapidos").insert({
        ...input,
        criado_por: user.id,
      });
      if (error) throw error;
    }
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("kits_rapidos")
      .update({ ativo: false })
      .eq("id", id);
    if (error) throw error;
    await load();
  }, [load]);

  return { items, loading, save, remove, reload: load };
}
