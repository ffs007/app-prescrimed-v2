import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type BaseMedIndicators = {
  total: number;
  revisados: number;
  aguardando: number;
  essenciais: number;
  essenciaisRevisados: number;
  apresentacoes: number;
  comContexto: number;
  semFonte: number;
  inativos: number;
  antimicrobianos: number;
  controlados: number;
  injetaveisVinculadosIv: number;
};

export function useBaseMedIndicators() {
  const [data, setData] = useState<BaseMedIndicators | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const c = (filter: any) =>
        supabase.from("base_medicamentos_geral" as any).select("*", { count: "exact", head: true }).match(filter);
      const sb = supabase.from("base_medicamentos_geral" as any);

      const [
        total, revisados, aguardando, essenciais, essRev, apres, ctx,
        semFonte, inativos, antimicro, controlados, injIv,
      ] = await Promise.all([
        sb.select("*", { count: "exact", head: true }),
        c({ status_revisao: "revisado" }),
        c({ status_revisao: "aguardando_revisao" }),
        c({ prioridade_mvp: "essencial" }),
        c({ prioridade_mvp: "essencial", status_revisao: "revisado" }),
        supabase.from("base_apresentacoes_medicamentos" as any).select("*", { count: "exact", head: true }),
        supabase.from("medicamento_contexto_clinico" as any).select("id_medicamento", { count: "exact", head: true }),
        sb.select("*", { count: "exact", head: true }).is("fonte_referencia", null),
        c({ ativo: false }),
        c({ antimicrobiano: true }),
        c({ medicamento_controlado: true }),
        sb.select("*", { count: "exact", head: true }).not("vinculo_iv_medication_id", "is", null),
      ]);
      if (!alive) return;
      const results = [total, revisados, aguardando, essenciais, essRev, apres, ctx, semFonte, inativos, antimicro, controlados, injIv];
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) {
        console.error("[useBaseMedIndicators] falha ao carregar indicadores:", firstError);
        toast.error("Não foi possível carregar os indicadores de medicamentos.");
        setLoading(false);
        return;
      }
      setData({
        total: total.count ?? 0,
        revisados: revisados.count ?? 0,
        aguardando: aguardando.count ?? 0,
        essenciais: essenciais.count ?? 0,
        essenciaisRevisados: essRev.count ?? 0,
        apresentacoes: apres.count ?? 0,
        comContexto: ctx.count ?? 0,
        semFonte: semFonte.count ?? 0,
        inativos: inativos.count ?? 0,
        antimicrobianos: antimicro.count ?? 0,
        controlados: controlados.count ?? 0,
        injetaveisVinculadosIv: injIv.count ?? 0,
      });
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  return { data, loading };
}
