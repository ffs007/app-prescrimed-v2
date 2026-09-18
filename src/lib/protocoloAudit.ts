import { supabase } from "@/integrations/supabase/client";

export type SessaoProtocolo = {
  atendimentoId: string;
  inicio: string; // ISO
  etapas: Record<string, string>; // etapaId -> ISO conclusão
};

export const sessaoStorageKey = (codigo: string) => `protocolo-sessao:${codigo}`;

export function novaSessao(atendimentoId: string): SessaoProtocolo {
  return { atendimentoId, inicio: new Date().toISOString(), etapas: {} };
}

export function carregarSessao(codigo: string): SessaoProtocolo | null {
  try {
    const raw = localStorage.getItem(sessaoStorageKey(codigo));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessaoProtocolo;
    if (!parsed?.inicio || typeof parsed.etapas !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function salvarSessao(codigo: string, sessao: SessaoProtocolo) {
  localStorage.setItem(sessaoStorageKey(codigo), JSON.stringify(sessao));
}

export function limparSessao(codigo: string) {
  localStorage.removeItem(sessaoStorageKey(codigo));
}

export function minutosDecorridos(inicio: string, fim: Date = new Date()) {
  return Math.max(0, Math.round((fim.getTime() - new Date(inicio).getTime()) / 60000));
}

export function dentroDoPrazo(tempoAlvo: number | null, realizado: number) {
  if (tempoAlvo === null || tempoAlvo === undefined) return true;
  return realizado <= tempoAlvo;
}

export async function registrarExecucaoEtapa(params: {
  protocoloId: string;
  atendimentoId: string;
  etapaOrdem: number;
  etapaTitulo: string;
  tempoPrevistoMin: number | null;
  tempoRealizadoMin: number;
}) {
  const { data: auth } = await supabase.auth.getUser();
  const profissionalId = auth.user?.id ?? null;

  const { error } = await supabase.from("audit_protocolo_execucao").insert({
    protocolo_id: params.protocoloId,
    atendimento_id: params.atendimentoId,
    etapa_ordem: params.etapaOrdem,
    etapa_titulo: params.etapaTitulo,
    tempo_previsto_min: params.tempoPrevistoMin,
    tempo_realizado_min: params.tempoRealizadoMin,
    dentro_prazo: dentroDoPrazo(params.tempoPrevistoMin, params.tempoRealizadoMin),
    profissional_id: profissionalId,
  });
  if (error) throw error;
}
