import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RH_DEFAULTS, type RHSettings } from "../lib/renalHepaticCalc";

let cache: { id: string; settings: RHSettings } | null = null;

export function useRenalHepaticSettings() {
  const [settings, setSettings] = useState<RHSettings>(cache?.settings ?? RH_DEFAULTS);
  const [id, setId] = useState<string | null>(cache?.id ?? null);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("iv_renal_hepatic_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      if (data) {
        const s: RHSettings = {
          metodo_renal_padrao: (data.metodo_renal_padrao ?? "cockcroft_gault") as RHSettings["metodo_renal_padrao"],
          exigir_just_clcr_lt30_ajuste_renal: data.exigir_just_clcr_lt30_ajuste_renal,
          exigir_just_nefrotoxico_clcr_lt30: data.exigir_just_nefrotoxico_clcr_lt30,
          exigir_funcao_renal_alerta_alto: data.exigir_funcao_renal_alerta_alto,
          alertar_creatinina_desatualizada: data.alertar_creatinina_desatualizada,
          bloquear_contraind_renal_grave: data.bloquear_contraind_renal_grave,
          bloquear_contraind_hepatico_grave: data.bloquear_contraind_hepatico_grave,
        };
        cache = { id: data.id, settings: s };
        setSettings(s); setId(data.id);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const save = async (next: RHSettings) => {
    if (!id) return { error: new Error("Sem registro de configurações renal/hepático") };
    const { error } = await supabase.from("iv_renal_hepatic_settings").update(next as any).eq("id", id);
    if (!error) { cache = { id, settings: next }; setSettings(next); }
    return { error };
  };

  return { settings, loading, save };
}
