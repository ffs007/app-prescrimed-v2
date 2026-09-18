import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ContraindicationRecord } from "../lib/clinicalAlertsCalc";

export function useContraindicationsBase(onlyReviewed: boolean = true) {
  const [data, setData] = useState<ContraindicationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      let q = supabase.from("base_contraindicacoes_medicamentos").select("*");
      if (onlyReviewed) q = q.eq("status_revisao", "revisado");
      else q = q.neq("status_revisao", "inativo");
      const { data, error } = await q;
      if (!active) return;
      if (!error && data) setData(data as unknown as ContraindicationRecord[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [onlyReviewed]);

  return { data, loading };
}
