import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PED_DEFAULTS, type PedSettings } from "../lib/pediatricCalc";

let cache: { id: string; settings: PedSettings } | null = null;

export function usePediatricSettings() {
  const [settings, setSettings] = useState<PedSettings>(cache?.settings ?? PED_DEFAULTS);
  const [id, setId] = useState<string | null>(cache?.id ?? null);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("iv_pediatric_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      if (data) {
        const s: PedSettings = {
          exigir_peso_pediatrico: data.exigir_peso_pediatrico,
          exigir_just_dose_acima_faixa: data.exigir_just_dose_acima_faixa,
          bloquear_dose_2x_maxima: data.bloquear_dose_2x_maxima,
          alertar_volume_abaixo_05ml: data.alertar_volume_abaixo_05ml,
          bloquear_volume_abaixo_01ml: data.bloquear_volume_abaixo_01ml,
          mostrar_calc_sempre_menor_18: data.mostrar_calc_sempre_menor_18,
          permitir_calc_pediatrico_adulto: data.permitir_calc_pediatrico_adulto,
        };
        cache = { id: data.id, settings: s };
        setSettings(s);
        setId(data.id);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const save = async (next: PedSettings) => {
    if (!id) return { error: new Error("Sem registro de configurações pediátricas") };
    const { error } = await supabase
      .from("iv_pediatric_settings")
      .update(next as any)
      .eq("id", id);
    if (!error) {
      cache = { id, settings: next };
      setSettings(next);
    }
    return { error };
  };

  return { settings, loading, save };
}
