import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { IVMedication } from "./IVDilutionAdminPage";
import { matchMedication, shouldAutoAssociate, type MatchResult } from "./lib/ivMatcher";

const ROUTE_RE = /\biv\b|intravenos|endovenos/i;

export function isIVRoute(route?: string | null) {
  if (!route) return false;
  return ROUTE_RE.test(route);
}

export function useIVMedicationLookup(medicationName: string | undefined | null) {
  const [data, setData] = useState<IVMedication | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!medicationName) {
      setData(null);
      setMatch(null);
      setChecked(false);
      return;
    }
    let active = true;
    setLoading(true);
    setChecked(false);

    (async () => {
      const { data: rows, error } = await supabase
        .from("iv_medications")
        .select("*");
      if (!active) return;
      if (error || !rows) {
        setData(null);
        setMatch(null);
        setLoading(false);
        setChecked(true);
        return;
      }
      const result = matchMedication(medicationName, rows as IVMedication[]);
      setMatch(result);
      setData(shouldAutoAssociate(result) ? result.best!.med : null);
      setLoading(false);
      setChecked(true);
    })();

    return () => {
      active = false;
    };
  }, [medicationName]);

  return { data, match, loading, checked };
}
