import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  avaliar, indexMeds, prontidaoGeral, resumirBlocos,
  type ItemAvaliado, type MedBase, type PacoteItem,
} from "./pacoteBetaLogic";

export function usePacoteBeta() {
  const [loading, setLoading] = useState(true);
  const [itens, setItens] = useState<PacoteItem[]>([]);
  const [meds, setMeds] = useState<MedBase[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErro(null);
      try {
        const [pac, mg] = await Promise.all([
          supabase
            .from("base_beta_pacote_itens")
            .select("id,bloco_slug,bloco_nome,principio_ativo,principio_ativo_normalizado,obrigatoriedade,alto_risco,ordem,ativo")
            .eq("ativo", true)
            .order("bloco_slug", { ascending: true })
            .order("ordem", { ascending: true }),
          supabase
            .from("base_medicamentos_geral")
            .select("id,principio_ativo,nome_normalizado,categoria_clinica,classe_terapeutica,apresentacao,via_administracao,termos_busca,prioridade_mvp,status_revisao,fonte_referencia,antimicrobiano,medicamento_controlado,tipo_receita,dose_adulto_padrao,dose_pediatrica_padrao,alerta_gestacao,alerta_lactacao,alerta_alergia_classe,ativo"),
        ]);
        if (pac.error) throw pac.error;
        if (mg.error) throw mg.error;
        setItens((pac.data ?? []) as unknown as PacoteItem[]);
        setMeds((mg.data ?? []) as unknown as MedBase[]);
      } catch (e: any) {
        setErro(e.message ?? "Erro ao carregar");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const avaliados: ItemAvaliado[] = useMemo(() => {
    const idx = indexMeds(meds);
    return itens.map(p => avaliar(p, idx.get(p.principio_ativo_normalizado ?? "") ?? null));
  }, [itens, meds]);

  const blocos = useMemo(() => resumirBlocos(avaliados), [avaliados]);
  const prontidao = useMemo(() => prontidaoGeral(avaliados), [avaliados]);

  const resumo = useMemo(() => {
    const ob = avaliados.filter(x => x.pacote.obrigatoriedade === "obrigatorio");
    const de = avaliados.filter(x => x.pacote.obrigatoriedade === "desejavel");
    const ok = (x: ItemAvaliado) => x.status === "pronto_beta" || x.status === "revisado";
    return {
      obrig_total: ob.length,
      obrig_prontos: ob.filter(ok).length,
      obrig_pendentes: ob.filter(x => !ok(x)).length,
      desej_prontos: de.filter(ok).length,
      desej_total: de.length,
      blocos_prontos: blocos.filter(b => b.status === "minimo_beta_pronto" || b.status === "completo_beta").length,
      blocos_pendentes: blocos.filter(b => b.status !== "minimo_beta_pronto" && b.status !== "completo_beta").length,
      alto_risco_pendentes: avaliados.filter(x => x.pacote.alto_risco && !ok(x)).length,
    };
  }, [avaliados, blocos]);

  return { loading, erro, avaliados, blocos, prontidao, resumo };
}
