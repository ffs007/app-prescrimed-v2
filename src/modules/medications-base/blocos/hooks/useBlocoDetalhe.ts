import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { BlocoChecklistItem, BlocoMedicamentoPlanejado, ChecklistItemChave, ChecklistItemStatus } from "../lib/types";

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

export type PlanejadoComMed = BlocoMedicamentoPlanejado & {
  medicamento_id: string | null;
  status_revisao: string | null;
  apresentacoes_count: number;
  tem_vinculo: boolean;
};

export function useBlocoDetalhe(slug: string | null) {
  const [planejados, setPlanejados] = useState<PlanejadoComMed[]>([]);
  const [checklist, setChecklist] = useState<BlocoChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    const [planRes, medsRes, apresRes, checkRes] = await Promise.all([
      supabase.from("base_blocos_medicamentos_planejados" as any).select("*").eq("bloco_slug", slug).order("ordem"),
      supabase.from("base_medicamentos_geral" as any).select("id, principio_ativo, nome_normalizado, status_revisao, cid_relacionados, queixas_relacionadas"),
      supabase.from("base_apresentacoes_medicamentos" as any).select("id_medicamento"),
      supabase.from("base_blocos_checklist_itens" as any).select("*").eq("bloco_slug", slug),
    ]);

    const meds = (medsRes.data ?? []) as any[];
    const apres = (apresRes.data ?? []) as any[];
    const apresMap = new Map<string, number>();
    apres.forEach((a) => apresMap.set(a.id_medicamento, (apresMap.get(a.id_medicamento) ?? 0) + 1));
    const medByNorm = new Map<string, any>();
    meds.forEach((m) => {
      const k = m.nome_normalizado || norm(m.principio_ativo || "");
      if (k) medByNorm.set(k, m);
    });

    const planos = (planRes.data ?? []) as unknown as BlocoMedicamentoPlanejado[];
    const enriched: PlanejadoComMed[] = planos.map((p) => {
      const k = p.principio_ativo_normalizado || norm(p.principio_ativo);
      const med = medByNorm.get(k);
      return {
        ...p,
        medicamento_id: med?.id ?? null,
        status_revisao: med?.status_revisao ?? null,
        apresentacoes_count: med ? apresMap.get(med.id) ?? 0 : 0,
        tem_vinculo: med ? ((med.cid_relacionados?.length ?? 0) > 0 || (med.queixas_relacionadas?.length ?? 0) > 0) : false,
      };
    });

    setPlanejados(enriched);
    setChecklist(((checkRes.data ?? []) as unknown) as BlocoChecklistItem[]);
    setLoading(false);
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const upsertChecklist = async (item_chave: ChecklistItemChave, status: ChecklistItemStatus, nota?: string) => {
    if (!slug) return false;
    const existing = checklist.find((c) => c.item_chave === item_chave && !c.medicamento_id);
    const op = existing
      ? supabase.from("base_blocos_checklist_itens" as any).update({ status, nota: nota ?? null }).eq("id", existing.id)
      : supabase.from("base_blocos_checklist_itens" as any).insert({ bloco_slug: slug, item_chave, status, nota: nota ?? null });
    const { error } = await op;
    if (error) {
      toast.error(`Erro: ${error.message}`);
      return false;
    }
    await load();
    return true;
  };

  return { planejados, checklist, loading, reload: load, upsertChecklist };
}
