/**
 * Gestão de CIDs por patologia.
 *
 * - `cid_preferencias`: a lista que cada médico usa para cada patologia
 *   (CID principal, associados e sugeridos removidos da prática local).
 * - `cid_combos`: conjuntos de CIDs frequentemente usados, salvos com nome.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CidPreference {
  patologia_chave: string;
  patologia_nome: string | null;
  cid_principal: string | null;
  cids_associados: string[];
  cids_removidos: string[];
}

export interface CidCombo {
  id: string;
  nome: string;
  cid_principal: string | null;
  cids_associados: string[];
  contexto: string | null;
  usos: number;
}

export const cidKey = (name: string) =>
  (name ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "geral";

export function useCidPreference(pathologyName: string) {
  const key = cidKey(pathologyName);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["cid-preferencia", key],
    queryFn: async (): Promise<CidPreference | null> => {
      const { data, error } = await supabase
        .from("cid_preferencias")
        .select("patologia_chave, patologia_nome, cid_principal, cids_associados, cids_removidos")
        .eq("patologia_chave", key)
        .maybeSingle();
      if (error) throw error;
      return (data as CidPreference | null) ?? null;
    },
    staleTime: 60_000,
  });

  const save = useMutation({
    mutationFn: async (input: Omit<CidPreference, "patologia_chave">) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Sessão expirada. Entre novamente para salvar seus CIDs.");
      const { error } = await supabase.from("cid_preferencias").upsert(
        {
          user_id: userId,
          patologia_chave: key,
          patologia_nome: input.patologia_nome,
          cid_principal: input.cid_principal,
          cids_associados: input.cids_associados,
          cids_removidos: input.cids_removidos,
        },
        { onConflict: "user_id,patologia_chave" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cid-preferencia", key] }),
  });

  return { preference: query.data ?? null, isLoading: query.isLoading, save };
}

export function useCidCombos() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["cid-combos"],
    queryFn: async (): Promise<CidCombo[]> => {
      const { data, error } = await supabase
        .from("cid_combos")
        .select("id, nome, cid_principal, cids_associados, contexto, usos")
        .order("usos", { ascending: false })
        .order("nome");
      if (error) throw error;
      return (data ?? []) as CidCombo[];
    },
    staleTime: 60_000,
  });

  const create = useMutation({
    mutationFn: async (input: { nome: string; cid_principal: string | null; cids_associados: string[]; contexto?: string | null }) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Sessão expirada. Entre novamente para salvar o combo.");
      const { error } = await supabase.from("cid_combos").insert({ ...input, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cid-combos"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cid_combos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cid-combos"] }),
  });

  const registerUse = useMutation({
    mutationFn: async (combo: CidCombo) => {
      const { error } = await supabase
        .from("cid_combos")
        .update({ usos: combo.usos + 1 })
        .eq("id", combo.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cid-combos"] }),
  });

  return { combos: query.data ?? [], isLoading: query.isLoading, create, remove, registerUse };
}
