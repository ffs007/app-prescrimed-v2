import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface IndicatorCounts {
  prescricoes: number;
  documentos: number;
  alertas_total: number;
  alertas_criticos: number;
  alertas_medios: number;
  justificativas: number;
  prescricoes_iv: number;
  links_criados: number;
  links_enviados: number;
  testes_aprovados: number;
  testes_reprovados: number;
  testes_pendentes: number;
}

const ZERO: IndicatorCounts = {
  prescricoes: 0, documentos: 0, alertas_total: 0, alertas_criticos: 0, alertas_medios: 0,
  justificativas: 0, prescricoes_iv: 0, links_criados: 0, links_enviados: 0,
  testes_aprovados: 0, testes_reprovados: 0, testes_pendentes: 0,
};

const head = (table: string) => supabase.from(table as never).select("*", { count: "exact", head: true });
const headEq = (table: string, col: string, val: string) =>
  supabase.from(table as never).select("*", { count: "exact", head: true }).eq(col, val);

export const useIndicators = () => {
  const [counts, setCounts] = useState<IndicatorCounts>(ZERO);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [
        docs, alertas, alCrit, alMed, ivRev, links, linksEnv,
        tApr, tRep, tPend, evPresc,
      ] = await Promise.all([
        head("documentos_gerados"),
        head("historico_alertas_iv"),
        headEq("historico_alertas_iv", "gravidade", "alta"),
        headEq("historico_alertas_iv", "gravidade", "media"),
        head("historico_revisao_seguranca_iv"),
        head("documento_links_publicos"),
        supabase.from("documento_links_publicos").select("*", { count: "exact", head: true }).not("data_envio", "is", null),
        headEq("testes_clinicos", "status", "aprovado"),
        headEq("testes_clinicos", "status", "reprovado"),
        headEq("testes_clinicos", "status", "pendente"),
        supabase.from("eventos_beta_log").select("*", { count: "exact", head: true }).eq("tipo_evento", "prescricao_criada"),
      ]);

      setCounts({
        prescricoes: evPresc.count ?? 0,
        documentos: docs.count ?? 0,
        alertas_total: alertas.count ?? 0,
        alertas_criticos: alCrit.count ?? 0,
        alertas_medios: alMed.count ?? 0,
        justificativas: 0,
        prescricoes_iv: ivRev.count ?? 0,
        links_criados: links.count ?? 0,
        links_enviados: linksEnv.count ?? 0,
        testes_aprovados: tApr.count ?? 0,
        testes_reprovados: tRep.count ?? 0,
        testes_pendentes: tPend.count ?? 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return { counts, loading, reload: load };
};
