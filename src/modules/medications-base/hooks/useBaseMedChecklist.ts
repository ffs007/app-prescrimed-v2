import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ChecklistItem = {
  id: string;
  chave: string;
  label: string;
  status: string;
  observacao: string | null;
  ordem: number;
};

export function useBaseMedChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("base_medicamentos_checklist" as any)
      .select("*")
      .order("ordem", { ascending: true });
    setItems((data as any) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string, observacao?: string) => {
    const { error } = await supabase
      .from("base_medicamentos_checklist" as any)
      .update({ status, observacao: observacao ?? null, atualizado_em: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) { toast.error("Erro ao atualizar checklist"); return; }
    await load();
  };

  return { items, loading, updateStatus };
}
