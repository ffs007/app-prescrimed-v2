import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { IV_CALC_DEFAULTS, type IVCalcSettings } from "../lib/ivCalc";

let cache: { id: string; settings: IVCalcSettings } | null = null;

export function useIVCalcSettings() {
  const [settings, setSettings] = useState<IVCalcSettings>(cache?.settings ?? IV_CALC_DEFAULTS);
  const [id, setId] = useState<string | null>(cache?.id ?? null);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("iv_calc_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      if (data) {
        const s: IVCalcSettings = {
          bloquear_concentracao_2x: data.bloquear_concentracao_2x,
          exigir_just_velocidade: data.exigir_just_velocidade,
          exigir_just_tempo: data.exigir_just_tempo,
          permitir_calculo_incompleto: data.permitir_calculo_incompleto,
          exigir_peso_vasoativos: data.exigir_peso_vasoativos,
        };
        cache = { id: data.id, settings: s };
        setSettings(s);
        setId(data.id);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const save = async (next: IVCalcSettings) => {
    if (!id) return { error: new Error("Sem registro de configurações") };
    const { error } = await supabase
      .from("iv_calc_settings")
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
