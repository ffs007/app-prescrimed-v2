// Etapa 20 — Hook das configurações de documentos.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DocumentosSettings } from "../lib/types";

export function useDocumentsSettings() {
  const [settings, setSettings] = useState<DocumentosSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("documentos_settings").select("*").limit(1).maybeSingle();
    setSettings(data); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = useCallback(async (patch: Partial<DocumentosSettings>) => {
    if (!settings) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("documentos_settings")
      .update({ ...patch, updated_by: user?.id ?? null })
      .eq("id", settings.id);
    if (error) throw error;
    await load();
  }, [settings, load]);

  return { settings, loading, update, reload: load };
}
