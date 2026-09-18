import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type TesteStatus = "pendente" | "aprovado" | "reprovado" | "precisa_ajuste" | "corrigido";

export interface TesteClinico {
  id: string;
  nome_do_teste: string;
  descricao: string | null;
  categoria: string | null;
  paciente_simulado: Record<string, unknown>;
  medicamentos_prescritos: Array<Record<string, unknown>>;
  exames_documentos: Array<Record<string, unknown>>;
  alerta_esperado: Record<string, unknown>;
  resultado_obtido: Record<string, unknown> | null;
  status: TesteStatus;
  observacoes: string | null;
  testado_por: string | null;
  data_hora_execucao: string | null;
  created_at: string;
}

export const useTestesClinicos = () => {
  const [items, setItems] = useState<TesteClinico[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("testes_clinicos").select("*").order("created_at", { ascending: false });
      if (error) {
        console.error("[useTestesClinicos] falha ao carregar testes:", error);
        toast.error("Não foi possível carregar os testes clínicos.");
        return;
      }
      setItems((data ?? []) as unknown as TesteClinico[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const upsert = useCallback(async (t: Partial<TesteClinico> & { nome_do_teste: string }) => {
    const { data: auth } = await supabase.auth.getUser();
    const payload = { ...t, criado_por: t.id ? undefined : auth.user?.id };
    const { error } = t.id
      ? await supabase.from("testes_clinicos").update(payload as never).eq("id", t.id)
      : await supabase.from("testes_clinicos").insert(payload as never);
    if (error) {
      console.error("[useTestesClinicos] falha ao salvar teste:", error);
      toast.error("Não foi possível salvar o teste clínico.");
      return;
    }
    load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("testes_clinicos").delete().eq("id", id);
    if (error) {
      console.error("[useTestesClinicos] falha ao remover teste:", error);
      toast.error("Não foi possível remover o teste clínico.");
      return;
    }
    load();
  }, [load]);

  const setResult = useCallback(async (
    id: string,
    resultado_obtido: Record<string, unknown>,
    status: TesteStatus,
    observacoes?: string,
  ) => {
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("testes_clinicos").update({
      resultado_obtido: resultado_obtido as never,
      status,
      observacoes: observacoes ?? null,
      testado_por: auth.user?.id ?? null,
      data_hora_execucao: new Date().toISOString(),
    }).eq("id", id);
    if (error) {
      console.error("[useTestesClinicos] falha ao salvar resultado:", error);
      toast.error("Não foi possível salvar o resultado do teste.");
      return;
    }
    load();
  }, [load]);

  return { items, loading, reload: load, upsert, remove, setResult };
};
