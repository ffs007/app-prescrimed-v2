import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { InteractionRecord } from "../lib/interactionsCalc";

export function useInteractionsBase(onlyReviewed: boolean = false) {
  const [data, setData] = useState<InteractionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      let q = supabase.from("base_interacoes_medicamentosas").select("*");
      if (onlyReviewed) q = q.eq("status_revisao", "revisado");
      else q = q.neq("status_revisao", "inativo");
      const { data, error } = await q;
      if (!active) return;
      if (!error && data) setData(data as unknown as InteractionRecord[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [onlyReviewed]);

  return { data, loading };
}
