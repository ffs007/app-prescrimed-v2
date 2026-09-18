import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAuditLogger } from "./useAuditLog";
import { AUDIT_ACTIONS } from "../lib/auditActions";

export interface RetentionPolicy {
  id: string;
  modulo: string;
  descricao: string;
  meses_retencao: number;
  base_legal: string;
  anonimizar_ao_expirar: boolean;
}

export interface DataRequest {
  id: string;
  tipo: string;
  status: string;
  descricao: string | null;
  resposta: string | null;
  prazo_legal: string;
  criado_em: string;
}

export const REQUEST_TYPES = [
  { value: "exclusao", label: "Exclusão dos meus dados" },
  { value: "portabilidade", label: "Portabilidade / cópia dos dados" },
  { value: "anonimizacao", label: "Anonimização" },
  { value: "correcao", label: "Correção de dados" },
  { value: "acesso", label: "Relatório de tratamento de dados" },
];

export const REQUEST_STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  em_analise: "Em análise",
  concluida: "Concluída",
  recusada: "Recusada",
};

export function useRetentionPolicies() {
  return useQuery({
    queryKey: ["lgpd-retencao"],
    queryFn: async (): Promise<RetentionPolicy[]> => {
      const { data, error } = await supabase
        .from("lgpd_politicas_retencao")
        .select("*")
        .order("modulo");
      if (error) throw error;
      return (data ?? []) as unknown as RetentionPolicy[];
    },
  });
}

export function useDataRequests() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const log = useAuditLogger();

  const list = useQuery({
    queryKey: ["lgpd-solicitacoes"],
    queryFn: async (): Promise<DataRequest[]> => {
      const { data, error } = await supabase
        .from("lgpd_solicitacoes")
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DataRequest[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: { tipo: string; descricao: string }) => {
      if (!user) throw new Error("Sessão expirada.");
      const { data, error } = await supabase
        .from("lgpd_solicitacoes")
        .insert({ user_id: user.id, tipo: input.tipo, descricao: input.descricao })
        .select("id")
        .single();
      if (error) throw error;
      await log({
        acao: AUDIT_ACTIONS.SOLICITACAO_LGPD,
        modulo: "conformidade",
        entidade: "lgpd_solicitacoes",
        entidadeId: data.id,
        severidade: "alerta",
        detalhes: { tipo: input.tipo },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lgpd-solicitacoes"] }),
  });

  return { list, create };
}

export function useConsents(version: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const log = useAuditLogger();

  const list = useQuery({
    queryKey: ["lgpd-consentimentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lgpd_consentimentos")
        .select("documento, versao, criado_em");
      if (error) throw error;
      return data ?? [];
    },
  });

  const accept = useMutation({
    mutationFn: async (documento: "termos_de_uso" | "politica_privacidade") => {
      if (!user) throw new Error("Sessão expirada.");
      const { error } = await supabase
        .from("lgpd_consentimentos")
        .upsert(
          { user_id: user.id, documento, versao: version, aceito: true },
          { onConflict: "user_id,documento,versao" },
        );
      if (error) throw error;
      await log({
        acao: AUDIT_ACTIONS.CONSENTIMENTO,
        modulo: "conformidade",
        entidade: documento,
        detalhes: { versao: version },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lgpd-consentimentos"] }),
  });

  const hasAccepted = (documento: string) =>
    (list.data ?? []).some((c) => c.documento === documento && c.versao === version);

  return { list, accept, hasAccepted };
}
