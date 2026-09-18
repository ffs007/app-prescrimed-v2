// Etapa 19 — Hook do singleton de configurações da Entrada Inteligente.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SmartInputSettings } from "../lib/types";

export function useSmartInputSettings() {
  const [settings, setSettings] = useState<SmartInputSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("entrada_inteligente_settings").select("*").limit(1).maybeSingle();
    setSettings(data); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = useCallback(async (patch: Partial<SmartInputSettings>) => {
    if (!settings) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("entrada_inteligente_settings")
      .update({ ...patch, updated_by: user?.id ?? null })
      .eq("id", settings.id);
    if (error) throw error;
    await load();
  }, [settings, load]);

  return { settings, loading, update, reload: load };
}
