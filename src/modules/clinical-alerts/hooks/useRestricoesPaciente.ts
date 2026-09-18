import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RestrictionRecord } from "../lib/clinicalAlertsCalc";

export function useRestricoesPaciente(idPaciente: string | null | undefined) {
  const [data, setData] = useState<RestrictionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idPaciente) { setData([]); setLoading(false); return; }
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("restricoes_paciente")
        .select("*").eq("id_paciente", idPaciente).eq("ativa", true);
      if (!active) return;
      if (!error && data) setData(data as unknown as RestrictionRecord[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [idPaciente]);

  return { data, loading };
}
