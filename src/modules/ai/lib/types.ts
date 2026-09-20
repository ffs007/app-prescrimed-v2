// Tipos compartilhados do módulo de integrações de IA.

export type AIProvider = "openrouter" | "perplexity" | "gateway";

/** As chaves chegam mascaradas (ex.: "sk-o••••a1b2"): o valor real nunca é exposto ao navegador. */
export interface AICredentials {
  perplexity_key: string | null;
  openrouter_key: string | null;
  modelo_preferido: string;
  atualizacoes_automaticas: boolean;
}

export type UpdateStatus = "pendente" | "aceito" | "recusado";

export interface PendingUpdate {
  id: string;
  patologia: string;
  tipo: string;
  titulo: string;
  resumo: string | null;
  conteudo_novo: string | null;
  conteudo_anterior: string | null;
  fonte: string | null;
  referencia: string | null;
  url: string | null;
  provedor: string | null;
  status: UpdateStatus;
  created_at: string;
  revisado_em: string | null;
}

export interface ProtocolVersion {
  id: string;
  patologia: string;
  protocolo: string;
  versao: number;
  conteudo: string;
  origem: string;
  referencia: string | null;
  url: string | null;
  created_at: string;
}

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const AI_DISCLAIMER =
  "Conteúdo de apoio: não substitui o julgamento clínico do médico responsável.";

/** Modelos sugeridos no OpenRouter, com Claude como preferência. */
export const OPENROUTER_MODELS = [
  { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4 (recomendado)" },
  { id: "anthropic/claude-3.7-sonnet", label: "Claude 3.7 Sonnet" },
  { id: "anthropic/claude-3.5-haiku", label: "Claude 3.5 Haiku (mais rápido)" },
  { id: "openai/gpt-4o", label: "GPT-4o" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
];
