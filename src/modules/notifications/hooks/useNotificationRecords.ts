/**
 * Histórico de notificações compulsórias emitidas, com situação de envio
 * (pendente, enviado, confirmado). Guardado no backend por médico.
 */
import { useCallback, useEffect, useState } from "react";
import { recordCriticalEvent } from "@/modules/security/lib/auditClient";
import { AUDIT_ACTIONS } from "@/modules/security/lib/auditActions";
import { supabaseUntyped } from "@/integrations/supabase/untyped";
import type { NotifData } from "../lib/notificationSpec";

export type NotifStatus = "pendente" | "enviado" | "confirmado";

export const STATUS_LABEL: Record<NotifStatus, string> = {
  pendente: "Pendente de envio",
  enviado: "Enviado à vigilância",
  confirmado: "Recebimento confirmado",
};

export interface NotifRecord {
  id: string;
  agravo_id: string;
  agravo: string;
  paciente_nome: string | null;
  cid: string | null;
  classificacao: string | null;
  imediata: boolean;
  prazo_horas: number | null;
  data_sintomas: string | null;
  status: NotifStatus;
  enviado_em: string | null;
  protocolo_vigilancia: string | null;
  dados: NotifData;
  texto: string | null;
  created_at: string;
}

export interface NewNotifRecord {
  agravo_id: string;
  agravo: string;
  paciente_nome?: string;
  cid?: string;
  classificacao?: string;
  imediata: boolean;
  prazo_horas: number;
  data_sintomas?: string | null;
  dados: NotifData;
  texto?: string;
}

const TABLE = "notificacoes_compulsorias";

export const useNotificationRecords = () => {
  const [records, setRecords] = useState<NotifRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabaseUntyped
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) setError(error.message);
    else {
      setError(null);
      setRecords((data ?? []) as NotifRecord[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(
    async (rec: NewNotifRecord) => {
      const { data, error } = await supabaseUntyped
        .from(TABLE)
        .insert({ ...rec, data_sintomas: rec.data_sintomas || null, status: "pendente" })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      await recordCriticalEvent({
        acao: AUDIT_ACTIONS.NOTIFICACAO_EMITIDA,
        modulo: "notificacoes",
        entidade: (rec as { agravo?: string }).agravo ?? "notificacao",
        entidadeId: (data as { id?: string })?.id ?? null,
        severidade: "alerta",
      });
      setRecords((prev) => [data as NotifRecord, ...prev]);
      return data as NotifRecord;
    },
    [],
  );

  const setStatus = useCallback(
    async (id: string, status: NotifStatus, protocolo?: string) => {
      const patch: Record<string, unknown> = {
        status,
        enviado_em: status === "pendente" ? null : new Date().toISOString(),
      };
      if (protocolo !== undefined) patch.protocolo_vigilancia = protocolo;
      const { error } = await supabaseUntyped.from(TABLE).update(patch).eq("id", id);
      if (error) throw new Error(error.message);
      setRecords((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status, enviado_em: patch.enviado_em as string | null, protocolo_vigilancia: protocolo ?? r.protocolo_vigilancia }
            : r,
        ),
      );
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    const { error } = await supabaseUntyped.from(TABLE).delete().eq("id", id);
    if (error) throw new Error(error.message);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { records, loading, error, reload: load, create, setStatus, remove };
};
