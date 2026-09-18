// Etapa 17 — Hook de favoritos pessoais de medicamentos.
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type FavoritoMedicamento =
  Database["public"]["Tables"]["favoritos_medicamentos"]["Row"];
export type FavoritoMedicamentoInsert =
  Database["public"]["Tables"]["favoritos_medicamentos"]["Insert"];

export function useFavoritosMedicamentos() {
  const [items, setItems] = useState<FavoritoMedicamento[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setItems([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("favoritos_medicamentos")
      .select("*")
      .eq("id_usuario", user.id)
      .eq("ativo", true)
      .order("atualizado_em", { ascending: false });
    if (!error && data) setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async (input: Omit<FavoritoMedicamentoInsert, "id_usuario">) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sem usuário");
    const { error } = await supabase.from("favoritos_medicamentos").insert({
      ...input,
      id_usuario: user.id,
    });
    if (error) throw error;
    await load();
  }, [load]);

  const update = useCallback(async (id: string, patch: Partial<FavoritoMedicamento>) => {
    const { error } = await supabase.from("favoritos_medicamentos").update(patch).eq("id", id);
    if (error) throw error;
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("favoritos_medicamentos")
      .update({ ativo: false })
      .eq("id", id);
    if (error) throw error;
    await load();
  }, [load]);

  return { items, loading, create, update, remove, reload: load };
}
