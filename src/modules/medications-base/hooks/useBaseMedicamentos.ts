import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type BaseMedicamento = {
  id: string;
  principio_ativo: string;
  principio_ativo_dcb: string | null;
  nome_comercial_referencia: string | null;
  nomes_comerciais: string[];
  sinonimos: string[];
  classe_terapeutica: string | null;
  subclasse_terapeutica: string | null;
  categoria_clinica: string;
  forma_farmaceutica: string | null;
  apresentacao: string | null;
  concentracao: string | null;
  via_administracao: string | null;
  uso_principal: string | null;
  uso_em_urgencia: boolean;
  uso_emergencia: boolean;
  uso_ambulatorial_rapido: boolean;
  medicamento_injetavel: boolean;
  medicamento_oral: boolean;
  medicamento_topico: boolean;
  medicamento_inalatorio: boolean;
  medicamento_controlado: boolean;
  antimicrobiano: boolean;
  tipo_receita: string;
  exige_receita_especial: boolean;
  exige_retencao_receita: boolean;
  dose_adulto_padrao: string | null;
  dose_pediatrica_padrao: string | null;
  dose_maxima_adulto: string | null;
  dose_maxima_pediatrica: string | null;
  unidade_dose: string | null;
  frequencia_padrao: string | null;
  duracao_padrao: string | null;
  observacao_posologia: string | null;
  exige_peso: boolean;
  exige_ajuste_renal: boolean;
  exige_ajuste_hepatico: boolean;
  alerta_gestacao: string;
  alerta_lactacao: string;
  alerta_alergia_classe: string | null;
  risco_interacao_relevante: boolean;
  risco_duplicidade: boolean;
  vinculo_iv_medication_id: string | null;
  cid_relacionados: string[];
  queixas_relacionadas: string[];
  protocolos_relacionados: string[];
  modelos_rapidos_relacionados: string[];
  termos_busca: string[];
  abreviacoes: string[];
  nomes_populares: string[];
  prioridade_mvp: string;
  prioridade_busca: number;
  status_revisao: string;
  fonte_referencia: string | null;
  data_atualizacao: string;
  ativo: boolean;
  // Campos adicionados na unificação com a estrutura clínica
  lote_id: string;
  principio_ativo_normalizado: string | null;
  principio_ativo_en: string | null;
  nomes_comerciais_br: string | null;
  subclasse: string | null;
  mecanismo_acao: string | null;
  codigo_atc: string | null;
  codigo_dcb: string | null;
  na_rename: boolean | null;
  alto_risco: boolean | null;
  observacoes: string | null;
};

export const baseMedicamentosKey = ["base_medicamentos_geral", "list"] as const;

export function useBaseMedicamentos() {
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: baseMedicamentosKey,
    queryFn: async (): Promise<BaseMedicamento[]> => {
      const { data, error } = await supabase
        .from("base_medicamentos_geral" as any)
        .select("*")
        .order("principio_ativo", { ascending: true });
      if (error) throw error;
      return ((data as any) ?? []) as BaseMedicamento[];
    },
    staleTime: 60 * 1000,
    meta: { errorMessage: "Erro ao carregar base de medicamentos" },
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: baseMedicamentosKey });
    qc.invalidateQueries({ queryKey: ["catalog", "base_medicamentos_geral"] });
  }, [qc]);

  const upsertMutation = useMutation({
    mutationFn: async (payload: Partial<BaseMedicamento>) => {
      const { id, ...rest } = payload;
      const op = id
        ? supabase.from("base_medicamentos_geral" as any).update(rest as any).eq("id", id)
        : supabase.from("base_medicamentos_geral" as any).insert(rest as any);
      const { error } = await op;
      if (error) throw error;
      return !!id;
    },
    onSuccess: (wasUpdate) => {
      toast.success(wasUpdate ? "Medicamento atualizado" : "Medicamento criado");
      invalidate();
    },
    onError: (e: any) => toast.error(`Erro ao salvar: ${e?.message ?? "desconhecido"}`),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("base_medicamentos_geral" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Excluído");
      invalidate();
    },
    onError: () => toast.error("Erro ao excluir"),
  });

  const upsert = async (payload: Partial<BaseMedicamento>) => {
    try {
      await upsertMutation.mutateAsync(payload);
      return true;
    } catch {
      return false;
    }
  };

  const remove = async (id: string) => {
    try {
      await removeMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  return {
    items: data ?? [],
    loading: isLoading,
    reload: async () => { await refetch(); },
    upsert,
    remove,
  };
}
