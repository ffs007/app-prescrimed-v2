// Etapa 20 — Hook de perfis de assinatura.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AssinaturaPerfil } from "../lib/types";

export function useSignatureProfiles() {
  const [profiles, setProfiles] = useState<AssinaturaPerfil[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("assinatura_perfis").select("*").order("padrao", { ascending: false });
    setProfiles((data ?? []) as AssinaturaPerfil[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const upsert = useCallback(async (patch: Partial<AssinaturaPerfil> & { perfil_nome: string; nome_profissional: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("not authenticated");
    if (patch.id) {
      const { error } = await supabase.from("assinatura_perfis").update(patch).eq("id", patch.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("assinatura_perfis").insert({ ...patch, id_usuario: user.id });
      if (error) throw error;
    }
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("assinatura_perfis").delete().eq("id", id);
    if (error) throw error;
    await load();
  }, [load]);

  return { profiles, loading, upsert, remove, reload: load };
}
