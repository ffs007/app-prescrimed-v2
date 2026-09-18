import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TesteStatusV2 } from "../lib/status";

export type TesteClinicoV2 = {
  id: string;
  codigo: string;
  nome_teste: string;
  categoria_teste: string;
  descricao: string | null;
  critico: boolean;
  ordem: number;
  alerta_esperado: string | null;
  comportamento_esperado: string | null;
  resultado_obtido: string | null;
  status_teste: TesteStatusV2;
  observacao: string | null;
  justificativa_ignorar: string | null;
  testado_por: string | null;
  data_hora_teste: string | null;
};

export type TestesConfig = {
  exigir_criticos_aprovados: boolean;
  permitir_ignorar_com_justificativa: boolean;
  gerar_log_execucao: boolean;
  mostrar_no_menu_lateral: boolean;
  mostrar_resumo_prontidao_beta: boolean;
};

export function useTestesClinicosV2() {
  const [items, setItems] = useState<TesteClinicoV2[]>([]);
  const [config, setConfig] = useState<TestesConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: tests }, { data: cfg }] = await Promise.all([
      supabase.from("testes_clinicos_v2").select("*").order("ordem"),
      supabase.from("testes_clinicos_configs").select("*").eq("id", 1).maybeSingle(),
    ]);
    setItems((tests ?? []) as TesteClinicoV2[]);
    if (cfg) setConfig(cfg as TestesConfig);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const logAction = useCallback(async (
    t: TesteClinicoV2,
    acao: string,
    status_anterior: string | null,
    status_novo: string | null,
    observacao: string | null,
    resultado_obtido: string | null,
  ) => {
    if (config && !config.gerar_log_execucao) return;
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("log_testes_clinicos").insert({
      teste_id: t.id,
      codigo_teste: t.codigo,
      nome_teste: t.nome_teste,
      categoria_teste: t.categoria_teste,
      acao,
      status_anterior,
      status_novo,
      resultado_esperado: t.alerta_esperado,
      resultado_obtido,
      observacao,
      usuario_responsavel: userData.user?.id ?? null,
    });
  }, [config]);

  const setResult = useCallback(async (
    t: TesteClinicoV2,
    status: TesteStatusV2,
    observacao: string,
    resultado_obtido: string,
    justificativa?: string,
  ) => {
    const { data: userData } = await supabase.auth.getUser();
    const patch = {
      status_teste: status,
      observacao: observacao || null,
      resultado_obtido: resultado_obtido || null,
      testado_por: userData.user?.id ?? null,
      data_hora_teste: new Date().toISOString(),
      justificativa_ignorar: status === "ignorado" ? (justificativa || null) : null,
    };
    const { error } = await supabase.from("testes_clinicos_v2").update(patch).eq("id", t.id);
    if (error) throw error;
    const acao =
      status === "aprovado" ? "teste_aprovado" :
      status === "reprovado" ? "teste_reprovado" :
      status === "corrigido" ? "teste_corrigido" :
      status === "ignorado" ? "teste_ignorado_com_justificativa" :
      "teste_executado";
    await logAction(t, acao, t.status_teste, status, observacao || justificativa || null, resultado_obtido);
    await load();
  }, [load, logAction]);

  const updateConfig = useCallback(async (patch: Partial<TestesConfig>) => {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("testes_clinicos_configs").update({ ...patch, updated_by: userData.user?.id ?? null }).eq("id", 1);
    await load();
  }, [load]);

  return { items, config, loading, setResult, updateConfig, reload: load, logAction };
}
