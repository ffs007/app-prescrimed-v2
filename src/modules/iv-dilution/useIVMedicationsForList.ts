import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { IVMedication } from "./IVDilutionAdminPage";
import { isIVRoute } from "./useIVMedicationLookup";

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").trim();

/**
 * Busca em lote os IVs cadastrados para uma lista de itens (nome + via).
 * Retorna apenas os medicamentos IV que tenham correspondência na base.
 */
export function useIVMedicationsForList(items: { name?: string | null; route?: string | null }[]) {
  const [list, setList] = useState<IVMedication[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const ivItems = items.filter((it) => it.name && isIVRoute(it.route));
    if (!ivItems.length) { setList([]); return; }
    setLoading(true);
    (async () => {
      const { data: rows, error } = await supabase.from("iv_medications").select("*");
      if (!active) return;
      if (error) {
        console.error("[useIVMedicationsForList] falha ao carregar medicamentos IV:", error);
        toast.error("Não foi possível carregar os medicamentos IV.");
        setLoading(false);
        return;
      }
      const all = (rows as IVMedication[]) ?? [];
      const found: IVMedication[] = [];
      const seen = new Set<string>();
      for (const it of ivItems) {
        const target = norm(it.name!);
        const m = all.find((x) => {
          const pa = norm(x.principio_ativo);
          const cm = x.nome_comercial_referencia ? norm(x.nome_comercial_referencia) : "";
          return target.includes(pa) || pa.includes(target) || (cm && (target.includes(cm) || cm.includes(target)));
        });
        if (m && !seen.has(m.id)) { seen.add(m.id); found.push(m); }
      }
      setList(found);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [JSON.stringify(items)]);

  return { list, loading };
}
