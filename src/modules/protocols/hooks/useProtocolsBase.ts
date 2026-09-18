import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Protocolo } from "../lib/types";

export function useProtocolsBase(opts?: { onlyReviewed?: boolean; activeOnly?: boolean }) {
  const [items, setItems] = useState<Protocolo[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    let q: any = (supabase.from("base_protocolos_clinicos") as any).select("*").order("nome_protocolo", { ascending: true });
    if (opts?.activeOnly !== false) q = q.eq("ativo", true);
    if (opts?.onlyReviewed) q = q.eq("status_revisao", "revisado");
    const { data, error } = await q;
    if (!error) setItems((data as Protocolo[]) || []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [opts?.onlyReviewed, opts?.activeOnly]);

  return { items, loading, reload: load };
}
