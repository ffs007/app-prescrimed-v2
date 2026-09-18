import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logBetaEvent } from "../lib/eventLog";

export interface BetaSettings {
  id: string;
  modo_beta_ativo: boolean;
  entrada_voz: boolean;
  link_paciente: boolean;
  assinatura_digital: boolean;
  seguranca_iv: boolean;
  calculo_pediatrico: boolean;
  ajuste_renal: boolean;
  interacoes: boolean;
  modelos_rapidos: boolean;
  protocolos: boolean;
}

export const useBetaSettings = () => {
  const [settings, setSettings] = useState<BetaSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from("beta_settings").select("*").limit(1).maybeSingle();
    if (data) setSettings(data as BetaSettings);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = useCallback(async (patch: Partial<BetaSettings>) => {
    if (!settings) return;
    const { data, error } = await supabase
      .from("beta_settings")
      .update(patch)
      .eq("id", settings.id)
      .select()
      .maybeSingle();
    if (!error && data) {
      setSettings(data as BetaSettings);
      logBetaEvent("configuracao_alterada", { area: "beta_settings", patch });
    }
    return { data, error };
  }, [settings]);

  return { settings, loading, update, reload: load };
};
