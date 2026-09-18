import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SETTINGS, type InteractionsSettings } from "../lib/interactionsCalc";

export function useInteractionsSettings() {
  const [settings, setSettings] = useState<InteractionsSettings>(DEFAULT_SETTINGS);
  const [id, setId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("interacoes_settings")
          .select("*")
          .limit(1)
          .maybeSingle();
        if (!active) return;
        if (error) {
          console.error("[useInteractionsSettings] falha ao carregar configurações:", error);
          toast.error("Não foi possível carregar as configurações de interações.");
          return;
        }
        if (data) {
          setId(data.id);
          const { id: _id, updated_at: _u, updated_by: _ub, ...rest } = data as Record<string, unknown>;
          setSettings({ ...DEFAULT_SETTINGS, ...(rest as Partial<InteractionsSettings>) });
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function save(next: Partial<InteractionsSettings>) {
    const merged = { ...settings, ...next };
    setSettings(merged);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (id) {
        const { error } = await supabase.from("interacoes_settings").update({ ...merged, updated_by: user?.id }).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("interacoes_settings")
          .insert({ ...merged, updated_by: user?.id })
          .select("id")
          .maybeSingle();
        if (error) throw error;
        if (data) setId(data.id);
      }
    } catch (error) {
      console.error("[useInteractionsSettings] falha ao salvar configurações:", error);
      toast.error("Não foi possível salvar as configurações de interações.");
    }
  }

  return { settings, save, loading };
}
