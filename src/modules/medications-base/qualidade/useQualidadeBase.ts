import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  analisarMedicamento, analisarModelos, calcularSaude, detectarDuplicidades,
  norm, type Duplicidade, type Finding, type MedFull, type Modelo, type ModeloItem,
} from "./qualidadeLogic";

export type Config = {
  id: string;
  revisao_ao_importar: boolean;
  revisao_ao_editar: boolean;
  bloquear_beta_com_erro_critico: boolean;
  bloquear_revisado_sem_fonte: boolean;
  permitir_ignorar_com_justificativa: boolean;
  sugerir_termos_busca: boolean;
  criar_tarefa_para_critico: boolean;
};

export type Ignorada = {
  id: string;
  finding_key: string;
  rule_code: string;
  justificativa: string;
  created_at: string;
};

export function useQualidadeBase() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [meds, setMeds] = useState<MedFull[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [itens, setItens] = useState<ModeloItem[]>([]);
  const [ignoradas, setIgnoradas] = useState<Ignorada[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true); setErro(null);
      try {
        const [medRes, mRes, iRes, igRes, cfgRes] = await Promise.all([
          supabase.from("base_medicamentos_geral").select("*"),
          supabase.from("base_modelos_rapidos").select("id,nome_modelo,categoria_modelo,contexto,fonte_referencia,status_revisao,ativo"),
          supabase.from("base_modelos_rapidos_itens").select("id,id_modelo,id_medicamento,principio_ativo,dose,fonte_referencia"),
          supabase.from("qualidade_base_ignoradas").select("id,finding_key,rule_code,justificativa,created_at"),
          supabase.from("qualidade_base_configs").select("*").maybeSingle(),
        ]);
        for (const r of [medRes, mRes, iRes, igRes, cfgRes]) if (r.error) throw r.error;
        setMeds((medRes.data ?? []) as unknown as MedFull[]);
        setModelos((mRes.data ?? []) as unknown as Modelo[]);
        setItens((iRes.data ?? []) as unknown as ModeloItem[]);
        setIgnoradas((igRes.data ?? []) as unknown as Ignorada[]);
        setConfig((cfgRes.data ?? null) as unknown as Config | null);
      } catch (e: any) {
        setErro(e.message ?? "Erro ao carregar");
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshKey]);

  const ignoredSet = useMemo(() => new Set(ignoradas.map(i => i.finding_key)), [ignoradas]);

  const medsById = useMemo(() => new Map(meds.map(m => [m.id, m] as const)), [meds]);
  const medsByNorm = useMemo(() => {
    const map = new Map<string, MedFull>();
    for (const m of meds) {
      const k = m.nome_normalizado || norm(m.principio_ativo);
      if (k && !map.has(k)) map.set(k, m);
    }
    return map;
  }, [meds]);

  const findingsMed = useMemo(() => meds.flatMap(analisarMedicamento), [meds]);
  const findingsModelos = useMemo(
    () => analisarModelos(modelos, itens, medsById, medsByNorm),
    [modelos, itens, medsById, medsByNorm]
  );
  const duplicidades: Duplicidade[] = useMemo(() => detectarDuplicidades(meds), [meds]);

  const findings: Finding[] = useMemo(() => {
    const all = [...findingsMed, ...findingsModelos];
    return all.filter(f => !ignoredSet.has(f.key));
  }, [findingsMed, findingsModelos, ignoredSet]);

  const saude = useMemo(() => calcularSaude(findings, meds), [findings, meds]);

  const resumo = useMemo(() => {
    const total = meds.length;
    const ativos = meds.filter(m => m.ativo !== false);
    const rev = ativos.filter(m => m.status_revisao === "revisado").length;
    const rasc = ativos.filter(m => m.status_revisao === "rascunho").length;
    const aguard = ativos.filter(m => m.status_revisao === "aguardando_revisao").length;
    const incompletos = new Set(findings.filter(f => f.gravidade === "critico" && f.medicamento_id).map(f => f.medicamento_id!)).size;
    const critMedIds = new Set(findings.filter(f => f.gravidade === "critico" && f.medicamento_id).map(f => f.medicamento_id!));
    const altoRiscoPend = ativos.filter(m => {
      const n = norm(m.principio_ativo);
      const isAlto = ["adrenalina","noradrenalina","insulina","potassio","magnesio","amiodarona","morfina","fentanila","midazolam","diazepam","heparina"].some(p => n.includes(p));
      return isAlto && findings.some(f => f.medicamento_id === m.id);
    }).length;
    const semFonte = ativos.filter(m => !m.fonte_referencia).length;
    const dupPossiveis = duplicidades.length;
    const prontosBeta = ativos.filter(m =>
      (m.status_revisao === "aguardando_revisao" || m.status_revisao === "revisado") &&
      !critMedIds.has(m.id) &&
      !!m.apresentacao && !!m.via_administracao
    ).length;
    return {
      total, revisados: rev, rascunho: rasc, aguardando: aguard,
      incompletos, criticos: critMedIds.size, altoRiscoPend,
      semFonte, dupPossiveis, prontosBeta,
    };
  }, [meds, findings, duplicidades]);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const ignorar = useCallback(async (f: Finding, justificativa: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("qualidade_base_ignoradas").insert({
      finding_key: f.key,
      medicamento_id: f.medicamento_id,
      rule_code: f.rule_code,
      ref_id: f.ref_id ?? null,
      justificativa,
      usuario_id: userData.user?.id ?? null,
    });
    if (error) throw error;
    await supabase.from("log_qualidade_base_medicamentosa").insert({
      medicamento_id: f.medicamento_id,
      principio_ativo: f.principio_ativo,
      rule_code: f.rule_code,
      tipo_problema: f.categoria,
      gravidade: f.gravidade,
      mensagem: f.mensagem,
      acao: "ignorado_com_justificativa",
      justificativa,
      usuario_id: userData.user?.id ?? null,
    });
    refresh();
  }, [refresh]);

  const salvarConfig = useCallback(async (patch: Partial<Config>) => {
    if (!config) return;
    const { error } = await supabase.from("qualidade_base_configs").update(patch).eq("id", config.id);
    if (error) throw error;
    setConfig({ ...config, ...patch });
  }, [config]);

  return {
    loading, erro, meds, modelos, itens, findings, duplicidades, saude, resumo,
    config, salvarConfig, ignorar, refresh,
  };
}
