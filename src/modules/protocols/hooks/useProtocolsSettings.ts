import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ProtocolosSettings {
  id?: string;
  usar_apenas_revisados: boolean;
  mostrar_rascunho_admin: boolean;
  permitir_montar_plano: boolean;
  exigir_revisao_med_sugerido: boolean;
  cruzar_seguranca_med_sugerido: boolean;
  mostrar_gravidade_topo: boolean;
  alertar_sem_revisao_12m: boolean;
  permitir_favoritos: boolean;
}

const DEFAULT: ProtocolosSettings = {
  usar_apenas_revisados: true,
  mostrar_rascunho_admin: true,
  permitir_montar_plano: true,
  exigir_revisao_med_sugerido: true,
  cruzar_seguranca_med_sugerido: true,
  mostrar_gravidade_topo: true,
  alertar_sem_revisao_12m: true,
  permitir_favoritos: true,
};

export function useProtocolsSettings() {
  const [settings, setSettings] = useState<ProtocolosSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await (supabase.from("protocolos_settings") as any).select("*").limit(1).maybeSingle();
    if (data) setSettings(data as ProtocolosSettings);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function update(patch: Partial<ProtocolosSettings>) {
    if (!settings.id) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await (supabase.from("protocolos_settings") as any)
      .update({ ...patch, updated_at: new Date().toISOString(), updated_by: u?.user?.id })
      .eq("id", settings.id);
    if (!error) setSettings((s) => ({ ...s, ...patch }));
    return error;
  }

  return { settings, loading, update, reload: load };
}
