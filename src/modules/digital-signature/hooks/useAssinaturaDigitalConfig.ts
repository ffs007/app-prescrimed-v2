import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logBetaEvent } from "../../beta/lib/eventLog";

export interface AssinaturaConfig {
  id: string;
  tipo_assinatura: string;
  modo_assinatura: string;
  provedor_assinatura: string | null;
  ambiente: string;
  status_integracao: string;
  certificado_configurado: boolean;
  api_assinatura_url: string | null;
  api_key_configurada: boolean;
  ultimo_teste_assinatura: string | null;
}

export const useAssinaturaDigitalConfig = () => {
  const [config, setConfig] = useState<AssinaturaConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from("assinatura_digital_config").select("*").limit(1).maybeSingle();
    if (data) setConfig(data as AssinaturaConfig);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const update = useCallback(async (patch: Partial<AssinaturaConfig>) => {
    if (!config) return;
    const { data, error } = await supabase
      .from("assinatura_digital_config")
      .update(patch as never)
      .eq("id", config.id)
      .select()
      .maybeSingle();
    if (!error && data) {
      setConfig(data as AssinaturaConfig);
      logBetaEvent("configuracao_alterada", { area: "assinatura_digital", patch });
    }
  }, [config]);

  return { config, loading, update };
};

export const isSignatureConfigured = (c: AssinaturaConfig | null): boolean =>
  !!c && c.tipo_assinatura !== "sem_assinatura_digital" &&
  (c.status_integracao === "configurado" || c.status_integracao === "producao");
