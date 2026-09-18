import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Estrato, ResultadoEscore } from "@/lib/traumaScores";

export interface ResultadoSalvo {
  id: string;
  escore: string;
  pontuacao: number;
  estrato: Estrato;
  rotulo: string;
  entrada: Record<string, unknown>;
  detalhes: string[];
  observacao: string | null;
  share_token: string;
  created_at: string;
}

export const buildShareUrl = (token: string) => `${window.location.origin}/escore/${token}`;

export function useResultadosTrauma() {
  const [resultados, setResultados] = useState<ResultadoSalvo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("resultados_escores_trauma")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setResultados((data ?? []) as unknown as ResultadoSalvo[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const salvar = useCallback(
    async (escore: string, resultado: ResultadoEscore, entrada: Record<string, unknown>, observacao?: string) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase
        .from("resultados_escores_trauma")
        .insert({
          user_id: auth.user.id,
          escore,
          pontuacao: resultado.pontuacao,
          estrato: resultado.estrato,
          rotulo: resultado.rotulo,
          entrada: entrada as never,
          detalhes: resultado.detalhes as never,
          observacao: observacao ?? null,
        })
        .select()
        .maybeSingle();
      if (error || !data) return null;
      await load();
      return data as unknown as ResultadoSalvo;
    },
    [load],
  );

  const remover = useCallback(
    async (id: string) => {
      await supabase.from("resultados_escores_trauma").delete().eq("id", id);
      await load();
    },
    [load],
  );

  return { resultados, loading, salvar, remover, reload: load };
}
