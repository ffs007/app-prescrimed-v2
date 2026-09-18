export type HardeningStatus =
  | "pendente"
  | "em_teste"
  | "aprovado"
  | "precisa_ajuste"
  | "bloqueante"
  | "nao_aplicavel";

export type HardeningCriticidade = "alta" | "media" | "baixa";

export type HardeningItem = {
  id: string;
  secao: string;
  titulo: string;
  descricao: string | null;
  status: HardeningStatus;
  criticidade: HardeningCriticidade;
  ordem: number;
  responsavel: string | null;
  observacao: string | null;
  evidencia_url: string | null;
  atualizado_em: string;
};

export const SECOES: { key: string; label: string }[] = [
  { key: "fluxo_principal", label: "Fluxo principal" },
  { key: "seguranca_clinica", label: "Segurança clínica" },
  { key: "medicamentos_base", label: "Medicamentos / base" },
  { key: "documentos_pdf", label: "Documentos / PDF" },
  { key: "assinatura_link", label: "Assinatura digital / link" },
  { key: "mobile_responsividade", label: "Mobile / responsividade" },
  { key: "performance", label: "Performance" },
  { key: "permissoes_logs", label: "Permissões / logs" },
  { key: "bugs_conhecidos", label: "Bugs conhecidos" },
  { key: "prontidao_final", label: "Prontidão final" },
];

export const STATUS_LABEL: Record<HardeningStatus, string> = {
  pendente: "Pendente",
  em_teste: "Em teste",
  aprovado: "Aprovado",
  precisa_ajuste: "Precisa ajuste",
  bloqueante: "Bloqueante",
  nao_aplicavel: "Não aplicável",
};

export const CRITICIDADE_LABEL: Record<HardeningCriticidade, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export function statusBadgeClass(s: HardeningStatus): string {
  switch (s) {
    case "aprovado":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400";
    case "bloqueante":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "precisa_ajuste":
      return "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400";
    case "em_teste":
      return "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400";
    case "nao_aplicavel":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-foreground border-border";
  }
}

export function computeProntidao(items: HardeningItem[]): {
  status: "pronto" | "quase_pronto" | "atencao" | "nao_pronto";
  label: string;
  color: string;
  totais: Record<HardeningStatus, number>;
  criticosBloqueantes: number;
  criticosPendentes: number;
} {
  const totais: Record<HardeningStatus, number> = {
    pendente: 0, em_teste: 0, aprovado: 0, precisa_ajuste: 0, bloqueante: 0, nao_aplicavel: 0,
  };
  let criticosBloqueantes = 0;
  let criticosPendentes = 0;
  for (const it of items) {
    totais[it.status]++;
    if (it.criticidade === "alta") {
      if (it.status === "bloqueante" || it.status === "precisa_ajuste") criticosBloqueantes++;
      if (it.status === "pendente" || it.status === "em_teste") criticosPendentes++;
    }
  }
  if (criticosBloqueantes > 0) {
    return { status: "nao_pronto", label: "Não pronto para beta", color: "text-destructive", totais, criticosBloqueantes, criticosPendentes };
  }
  if (criticosPendentes > 0) {
    return { status: "atencao", label: "Atenção — itens críticos pendentes", color: "text-amber-600 dark:text-amber-400", totais, criticosBloqueantes, criticosPendentes };
  }
  const total = items.length;
  const aprovados = totais.aprovado + totais.nao_aplicavel;
  if (aprovados === total) {
    return { status: "pronto", label: "Pronto para beta", color: "text-emerald-600 dark:text-emerald-400", totais, criticosBloqueantes, criticosPendentes };
  }
  return { status: "quase_pronto", label: "Quase pronto para beta", color: "text-blue-600 dark:text-blue-400", totais, criticosBloqueantes, criticosPendentes };
}
