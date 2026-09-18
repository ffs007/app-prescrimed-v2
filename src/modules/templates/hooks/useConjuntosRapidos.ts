// Etapa 17 — Hook de conjuntos rápidos.
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ConjuntoRapido =
  Database["public"]["Tables"]["conjuntos_rapidos"]["Row"];
export type ConjuntoRapidoInsert =
  Database["public"]["Tables"]["conjuntos_rapidos"]["Insert"];

export function useConjuntosRapidos() {
  const [items, setItems] = useState<ConjuntoRapido[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("conjuntos_rapidos")
      .select("*")
      .eq("ativo", true)
      .order("atualizado_em", { ascending: false });
    if (!error && data) setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (
    input: Omit<ConjuntoRapidoInsert, "criado_por"> & { id?: string },
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sem usuário");
    if (input.id) {
      const { id, ...patch } = input;
      const { error } = await supabase.from("conjuntos_rapidos").update(patch).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("conjuntos_rapidos").insert({
        ...input,
        criado_por: user.id,
      });
      if (error) throw error;
    }
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("conjuntos_rapidos")
      .update({ ativo: false })
      .eq("id", id);
    if (error) throw error;
    await load();
  }, [load]);

  return { items, loading, save, remove, reload: load };
}
