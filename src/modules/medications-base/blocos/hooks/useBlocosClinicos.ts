import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  BlocoAgregado,
  BlocoChecklistItem,
  BlocoClinico,
  BlocoMedicamentoPlanejado,
} from "../lib/types";
import { calcularStatusDerivado } from "../lib/blocosCalc";

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

export function useBlocosClinicos() {
  const [agregados, setAgregados] = useState<BlocoAgregado[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [blocosRes, planejadosRes, medsRes, apresRes, checkRes] = await Promise.all([
      supabase.from("base_blocos_clinicos" as any).select("*").order("ordem"),
      supabase.from("base_blocos_medicamentos_planejados" as any).select("*"),
      supabase.from("base_medicamentos_geral" as any).select("id, principio_ativo, nome_normalizado, status_revisao, categoria_clinica, cid_relacionados, queixas_relacionadas"),
      supabase.from("base_apresentacoes_medicamentos" as any).select("medicamento_id"),
      supabase.from("base_blocos_checklist_itens" as any).select("bloco_slug, status"),
    ]);

    const blocos = (blocosRes.data ?? []) as unknown as BlocoClinico[];
    const planejados = (planejadosRes.data ?? []) as unknown as BlocoMedicamentoPlanejado[];
    const meds = (medsRes.data ?? []) as any[];
    const apres = (apresRes.data ?? []) as any[];
    const checks = (checkRes.data ?? []) as any[];

    // map medications by normalized name
    const medsByNorm = new Map<string, any>();
    meds.forEach((m) => {
      const k = m.nome_normalizado || norm(m.principio_ativo || "");
      if (k) medsByNorm.set(k, m);
    });

    const apresByMed = new Map<string, number>();
    apres.forEach((a) => {
      apresByMed.set(a.medicamento_id, (apresByMed.get(a.medicamento_id) ?? 0) + 1);
    });

    const result: BlocoAgregado[] = blocos.map((bloco) => {
      const planos = planejados.filter((p) => p.bloco_slug === bloco.slug);
      let cadastrados = 0;
      let revisados = 0;
      let apresentacoes = 0;
      let vinculos = 0;
      planos.forEach((p) => {
        const k = p.principio_ativo_normalizado || norm(p.principio_ativo);
        const med = medsByNorm.get(k);
        if (med) {
          cadastrados += 1;
          if (med.status_revisao === "revisado") revisados += 1;
          apresentacoes += apresByMed.get(med.id) ?? 0;
          if ((med.cid_relacionados?.length ?? 0) > 0 || (med.queixas_relacionadas?.length ?? 0) > 0) vinculos += 1;
        }
      });
      const blocoChecks = checks.filter((c) => c.bloco_slug === bloco.slug);
      const checklist_pendentes = blocoChecks.filter((c) => c.status === "pendente" || c.status === "em_andamento").length;
      const pendentes = (bloco.total_previsto || planos.length) - cadastrados;
      return {
        bloco,
        cadastrados,
        revisados,
        pendentes: Math.max(0, pendentes),
        apresentacoes,
        vinculos,
        checklist_pendentes,
        checklist_total: blocoChecks.length,
        status_calculado: calcularStatusDerivado(bloco, cadastrados, revisados, Math.max(0, pendentes)),
      };
    });

    setAgregados(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatusBloco = async (slug: string, status: BlocoClinico["status_bloco"]) => {
    const { error } = await supabase
      .from("base_blocos_clinicos" as any)
      .update({ status_bloco: status })
      .eq("slug", slug);
    if (error) {
      toast.error(`Erro ao atualizar bloco: ${error.message}`);
      return false;
    }
    toast.success("Status do bloco atualizado");
    await load();
    return true;
  };

  return { agregados, loading, reload: load, updateStatusBloco };
}
