export type TesteStatusV2 =
  | "pendente"
  | "aprovado"
  | "reprovado"
  | "precisa_ajuste"
  | "corrigido"
  | "ignorado";

export const STATUS_LABEL: Record<TesteStatusV2, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  precisa_ajuste: "Precisa ajuste",
  corrigido: "Corrigido",
  ignorado: "Ignorado c/ justificativa",
};

export const STATUS_TONE: Record<TesteStatusV2, string> = {
  pendente: "bg-muted text-muted-foreground",
  aprovado: "bg-primary/10 text-primary border-primary/30",
  reprovado: "bg-destructive/10 text-destructive border-destructive/30",
  precisa_ajuste: "bg-secondary text-secondary-foreground",
  corrigido: "bg-primary/10 text-primary border-primary/30",
  ignorado: "bg-muted text-muted-foreground",
};

export const CATEGORIA_LABEL: Record<string, string> = {
  alergia: "Alergia",
  pediatria: "Pediatria",
  segurança_iv: "Segurança IV",
  concentração: "Concentração",
  tempo_infusão: "Tempo infusão",
  velocidade_infusão: "Velocidade infusão",
  interação: "Interação",
  duplicidade: "Duplicidade",
  renal: "Renal",
  gestação_lactação: "Gestação/Lactação",
  controlado: "Controlado",
  antimicrobiano: "Antimicrobiano",
  documentos: "Documentos",
  pdf: "PDF",
  assinatura_digital: "Assinatura digital",
  link_paciente: "Link paciente",
  histórico: "Histórico",
  modelo_rapido: "Modelo rápido",
  entrada_inteligente: "Entrada inteligente",
  fluxo_completo: "Fluxo completo",
};

export type ProntidaoBeta = "critico" | "atencao" | "quase_pronto" | "pronto";

export function calcularProntidao(items: { status_teste: string; critico: boolean }[]): ProntidaoBeta {
  const criticos = items.filter((i) => i.critico);
  const criticosReprovados = criticos.filter((i) => i.status_teste === "reprovado").length;
  if (criticosReprovados > 0) return "critico";
  const criticosPendentes = criticos.filter((i) => ["pendente", "precisa_ajuste"].includes(i.status_teste)).length;
  if (criticosPendentes > 0) return "atencao";
  const pendentesMedios = items.filter((i) => !i.critico && ["pendente", "precisa_ajuste", "reprovado"].includes(i.status_teste)).length;
  if (pendentesMedios > 0) return "quase_pronto";
  return "pronto";
}

export const PRONTIDAO_LABEL: Record<ProntidaoBeta, string> = {
  critico: "Crítico",
  atencao: "Atenção",
  quase_pronto: "Quase pronto",
  pronto: "Pronto para beta",
};

export const PRONTIDAO_TONE: Record<ProntidaoBeta, string> = {
  critico: "bg-destructive/10 text-destructive border-destructive/30",
  atencao: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  quase_pronto: "bg-secondary text-secondary-foreground",
  pronto: "bg-primary/10 text-primary border-primary/30",
};
