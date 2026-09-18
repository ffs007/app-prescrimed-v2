export type ChecklistStatus =
  | "pendente"
  | "aprovado"
  | "precisa_ajuste"
  | "bloqueante"
  | "nao_aplicavel";

export const STATUS_LABEL: Record<ChecklistStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  precisa_ajuste: "Precisa ajuste",
  bloqueante: "Bloqueante",
  nao_aplicavel: "Não aplicável",
};

export const STATUS_OPTIONS: ChecklistStatus[] = [
  "pendente", "aprovado", "precisa_ajuste", "bloqueante", "nao_aplicavel",
];

export type ChecklistItem = {
  id: string;
  secao: string;
  titulo: string;
  descricao: string | null;
  status: ChecklistStatus;
  criticidade: "alta" | "media" | "baixa";
  bloqueante: boolean;
  ordem: number;
  responsavel: string | null;
  observacao: string | null;
  atualizado_em: string;
};

export const SECOES: { key: string; label: string }[] = [
  { key: "A_Produto", label: "A. Produto" },
  { key: "B_Prescricao", label: "B. Prescrição" },
  { key: "C_Seguranca", label: "C. Segurança" },
  { key: "D_Medicamentos", label: "D. Medicamentos" },
  { key: "E_Documentos", label: "E. Documentos" },
  { key: "F_Digital", label: "F. Digital" },
  { key: "G_Logs", label: "G. Logs" },
  { key: "H_Beta", label: "H. Beta" },
];

export function statusBadgeClass(s: ChecklistStatus): string {
  switch (s) {
    case "aprovado":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400";
    case "bloqueante":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "precisa_ajuste":
      return "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400";
    case "nao_aplicavel":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-foreground border-border";
  }
}

export type LaunchDecision = {
  status: "nao_pronto" | "atencao" | "quase_pronto" | "pronto";
  label: string;
  color: string;
  canRelease: boolean;
  noGoItems: ChecklistItem[];
  pendenciasNaoCriticas: ChecklistItem[];
  totais: { aprovado: number; pendente: number; precisa_ajuste: number; bloqueante: number; nao_aplicavel: number };
};

export function computeDecision(items: ChecklistItem[]): LaunchDecision {
  const totais = { aprovado: 0, pendente: 0, precisa_ajuste: 0, bloqueante: 0, nao_aplicavel: 0 };
  const noGoItems: ChecklistItem[] = [];
  const pendenciasNaoCriticas: ChecklistItem[] = [];

  for (const it of items) {
    totais[it.status]++;
    const isCritical = it.bloqueante || it.criticidade === "alta";
    if (isCritical && (it.status === "bloqueante" || it.status === "precisa_ajuste")) {
      noGoItems.push(it);
    } else if (!isCritical && (it.status === "pendente" || it.status === "precisa_ajuste")) {
      pendenciasNaoCriticas.push(it);
    } else if (isCritical && it.status === "pendente") {
      noGoItems.push(it);
    }
  }

  if (noGoItems.length > 0) {
    return {
      status: "nao_pronto",
      label: "Bloqueio crítico encontrado",
      color: "text-destructive",
      canRelease: false,
      noGoItems,
      pendenciasNaoCriticas,
      totais,
    };
  }
  const total = items.length;
  const aprovados = totais.aprovado + totais.nao_aplicavel;
  if (aprovados === total) {
    return {
      status: "pronto",
      label: "Pronto para beta",
      color: "text-emerald-600 dark:text-emerald-400",
      canRelease: true,
      noGoItems,
      pendenciasNaoCriticas,
      totais,
    };
  }
  if (pendenciasNaoCriticas.length > 0) {
    return {
      status: "quase_pronto",
      label: "Quase pronto — pendências não críticas",
      color: "text-blue-600 dark:text-blue-400",
      canRelease: true,
      noGoItems,
      pendenciasNaoCriticas,
      totais,
    };
  }
  return {
    status: "atencao",
    label: "Atenção",
    color: "text-amber-600 dark:text-amber-400",
    canRelease: false,
    noGoItems,
    pendenciasNaoCriticas,
    totais,
  };
}
