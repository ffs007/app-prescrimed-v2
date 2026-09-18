import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logBetaEvent } from "../../beta/lib/eventLog";

export interface DocumentoLink {
  id: string;
  id_documento: string;
  token: string;
  status: "ativo" | "expirado" | "revogado";
  expira_em: string;
  numero_acessos: number;
  enviado_para: string | null;
  canal_envio: string | null;
  data_envio: string | null;
  created_at: string;
}

const generateToken = (): string => {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(36).padStart(2, "0")).join("").slice(0, 32);
};

export const buildPublicUrl = (token: string): string => `${window.location.origin}/d/${token}`;

export const useDocumentoLinks = (id_documento?: string) => {
  const [links, setLinks] = useState<DocumentoLink[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let q = supabase.from("documento_links_publicos").select("*").order("created_at", { ascending: false });
    if (id_documento) q = q.eq("id_documento", id_documento);
    const { data } = await q;
    if (data) setLinks(data as DocumentoLink[]);
    setLoading(false);
  }, [id_documento]);
  useEffect(() => { load(); }, [load]);

  const create = useCallback(async (params: {
    id_documento: string; expiraDays?: number; enviado_para?: string; canal?: string;
  }) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const expira = new Date(Date.now() + (params.expiraDays ?? 30) * 86400000).toISOString();
    const token = generateToken();
    const { data, error } = await supabase.from("documento_links_publicos").insert({
      id_documento: params.id_documento,
      token,
      expira_em: expira,
      enviado_para: params.enviado_para ?? null,
      canal_envio: params.canal ?? null,
      data_envio: params.canal ? new Date().toISOString() : null,
      criado_por: auth.user.id,
    }).select().maybeSingle();
    if (!error && data) {
      logBetaEvent("link_criado", { id_documento: params.id_documento, token });
      if (params.canal) logBetaEvent("link_enviado", { token, canal: params.canal });
      load();
      return data as DocumentoLink;
    }
    return null;
  }, [load]);

  const revoke = useCallback(async (id: string) => {
    await supabase.from("documento_links_publicos").update({ status: "revogado" }).eq("id", id);
    logBetaEvent("link_revogado", { id });
    load();
  }, [load]);

  return { links, loading, reload: load, create, revoke };
};
