export type PlanId = "pro_monthly" | "pro_yearly";

export function isPlanId(value: string | null): value is PlanId {
  return value === "pro_monthly" || value === "pro_yearly";
}

export interface PlanDefinition {
  id: PlanId;
  nome: string;
  preco: string;
  periodo: string;
  destaque?: string;
  detalhes: string[];
}

export const PLANS: PlanDefinition[] = [
  {
    id: "pro_monthly",
    nome: "Mensal",
    preco: "R$ 15,99",
    periodo: "por mês nos 3 primeiros meses",
    destaque: "Promoção de lançamento",
    detalhes: [
      "Depois: R$ 25,99 por mês",
      "Cancele quando quiser",
      "Renovação automática",
    ],
  },
  {
    id: "pro_yearly",
    nome: "Anual",
    preco: "R$ 249,50",
    periodo: "por ano",
    destaque: "20% de desconto",
    detalhes: [
      "Equivale a R$ 20,79 por mês",
      "Um pagamento por ano",
      "Cancele quando quiser",
    ],
  },
];

export const PREMIUM_FEATURES = [
  "Assistente de IA e chatbot clínico",
  "Internações e AIH",
  "Notificações compulsórias",
  "Documentos avançados (relatório, laudo, encaminhamento personalizado)",
  "Atualizações clínicas automáticas",
];

export const PLAN_LABEL: Record<string, string> = {
  pro_monthly: "Plano mensal",
  pro_yearly: "Plano anual",
};
