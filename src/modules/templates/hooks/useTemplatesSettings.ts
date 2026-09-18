// Etapa 17 — Hook do singleton de configurações de Modelos/Kits/Favoritos.
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type TemplatesSettings =
  Database["public"]["Tables"]["templates_settings"]["Row"];

export function useTemplatesSettings() {
  const [settings, setSettings] = useState<TemplatesSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("templates_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    setSettings(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = useCallback(async (patch: Partial<TemplatesSettings>) => {
    if (!settings) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("templates_settings")
      .update({ ...patch, updated_by: user?.id ?? null })
      .eq("id", settings.id);
    if (error) throw error;
    await load();
  }, [settings, load]);

  return { settings, loading, update, reload: load };
}
