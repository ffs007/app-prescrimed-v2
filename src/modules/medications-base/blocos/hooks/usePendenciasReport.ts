import { useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { PendenciaItem } from "../lib/pendenciasReport";

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

export function usePendenciasReport() {
  const gerar = useCallback(async (): Promise<PendenciaItem[]> => {
    const [blocosRes, planRes, medsRes, apresRes] = await Promise.all([
      supabase.from("base_blocos_clinicos" as any).select("slug, nome").order("ordem"),
      supabase.from("base_blocos_medicamentos_planejados" as any).select("*"),
      supabase.from("base_medicamentos_geral" as any).select("id, principio_ativo, nome_normalizado, status_revisao, fonte_referencia, cid_relacionados, queixas_relacionadas, dose_pediatrica_padrao, dose_adulto_padrao"),
      supabase.from("base_apresentacoes_medicamentos" as any).select("medicamento_id"),
    ]);
    const firstError = [blocosRes, planRes, medsRes, apresRes].find((r) => r.error)?.error;
    if (firstError) {
      console.error("[usePendenciasReport] falha ao gerar relatório de pendências:", firstError);
      toast.error("Não foi possível gerar o relatório de pendências.");
      return [];
    }
    const blocos = (blocosRes.data ?? []) as any[];
    const blocoMap = new Map(blocos.map((b) => [b.slug, b.nome]));
    const meds = (medsRes.data ?? []) as any[];
    const medByNorm = new Map<string, any>();
    meds.forEach((m) => {
      const k = m.nome_normalizado || norm(m.principio_ativo || "");
      if (k) medByNorm.set(k, m);
    });
    const apresMap = new Map<string, number>();
    ((apresRes.data ?? []) as any[]).forEach((a) =>
      apresMap.set(a.medicamento_id, (apresMap.get(a.medicamento_id) ?? 0) + 1),
    );

    const out: PendenciaItem[] = [];
    ((planRes.data ?? []) as any[]).forEach((p) => {
      const k = p.principio_ativo_normalizado || norm(p.principio_ativo);
      const med = medByNorm.get(k);
      const faltando: string[] = [];
      if (!med) {
        faltando.push("medicamento não cadastrado");
      } else {
        if ((apresMap.get(med.id) ?? 0) === 0) faltando.push("apresentação");
        if (!med.dose_adulto_padrao && !med.dose_pediatrica_padrao) faltando.push("dose");
        if (!med.fonte_referencia) faltando.push("fonte");
        if ((med.cid_relacionados?.length ?? 0) === 0 && (med.queixas_relacionadas?.length ?? 0) === 0)
          faltando.push("vínculo CID/queixa");
        if (med.status_revisao !== "revisado") faltando.push("revisão");
      }
      if (faltando.length) {
        out.push({
          bloco: blocoMap.get(p.bloco_slug) ?? p.bloco_slug,
          medicamento: p.principio_ativo,
          faltando,
        });
      }
    });
    return out;
  }, []);

  return { gerar };
}
