// Etapa 17 — Hook de modelos de prescrição.
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ModeloPrescricao =
  Database["public"]["Tables"]["modelos_prescricao"]["Row"];
export type ModeloPrescricaoInsert =
  Database["public"]["Tables"]["modelos_prescricao"]["Insert"];

export type ModeloFilter = "todos" | "meus" | "institucionais" | "recentes";

export function useModelosPrescricao(filter: ModeloFilter = "todos") {
  const [items, setItems] = useState<ModeloPrescricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    let q = supabase
      .from("modelos_prescricao")
      .select("*")
      .eq("ativo", true)
      .order("atualizado_em", { ascending: false });

    if (filter === "meus" && user) q = q.eq("criado_por", user.id);
    if (filter === "institucionais") q = q.eq("visibilidade", "institucional");
    if (filter === "recentes") q = q.limit(20);

    const { data, error } = await q;
    if (!error && data) setItems(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (
    input: Omit<ModeloPrescricaoInsert, "criado_por"> & { id?: string },
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sem usuário");
    if (input.id) {
      const { id, ...patch } = input;
      const { error } = await supabase.from("modelos_prescricao").update(patch).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("modelos_prescricao").insert({
        ...input,
        criado_por: user.id,
      });
      if (error) throw error;
    }
    await load();
  }, [load]);

  const newVersion = useCallback(async (origem: ModeloPrescricao, motivo: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sem usuário");
    const { id, criado_em, atualizado_em, revisado_em, revisado_por, ...rest } = origem;
    const { error } = await supabase.from("modelos_prescricao").insert({
      ...rest,
      criado_por: user.id,
      versao_modelo: (origem.versao_modelo ?? 1) + 1,
      modelo_origem: origem.id,
      motivo_alteracao: motivo,
      status_revisao: "aguardando_revisao",
    });
    if (error) throw error;
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("modelos_prescricao")
      .update({ ativo: false })
      .eq("id", id);
    if (error) throw error;
    await load();
  }, [load]);

  return { items, loading, userId, save, newVersion, remove, reload: load };
}
