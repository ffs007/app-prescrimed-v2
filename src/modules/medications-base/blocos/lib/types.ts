export type BlocoStatus = "nao_iniciado" | "em_cadastro" | "em_revisao" | "pronto_beta" | "precisa_ajuste";
export type ChecklistItemStatus = "pendente" | "em_andamento" | "revisado" | "nao_aplicavel";
export type ChecklistItemChave =
  | "principio_ativo" | "apresentacoes" | "via_oral" | "via_injetavel"
  | "dose_adulto" | "dose_pediatrica" | "dose_maxima" | "tipo_receita"
  | "controlado_marcado" | "alertas" | "vinculo_cid_queixa" | "vinculo_modelos"
  | "fonte" | "status_revisao";

export type BlocoClinico = {
  id: string;
  slug: string;
  nome: string;
  ordem: number;
  descricao: string | null;
  total_previsto: number;
  categoria_clinica: string | null;
  status_bloco: BlocoStatus;
  observacao: string | null;
};

export type BlocoMedicamentoPlanejado = {
  id: string;
  bloco_slug: string;
  principio_ativo: string;
  principio_ativo_normalizado: string | null;
  prioridade: string;
  observacao: string | null;
  ordem: number;
};

export type BlocoChecklistItem = {
  id: string;
  bloco_slug: string;
  medicamento_id: string | null;
  item_chave: ChecklistItemChave;
  status: ChecklistItemStatus;
  nota: string | null;
};

export type BlocoAgregado = {
  bloco: BlocoClinico;
  cadastrados: number;
  revisados: number;
  pendentes: number;
  apresentacoes: number;
  vinculos: number;
  checklist_pendentes: number;
  checklist_total: number;
  status_calculado: BlocoStatus;
};

export const ITEM_CHAVES: { value: ChecklistItemChave; label: string }[] = [
  { value: "principio_ativo", label: "Princípio ativo cadastrado" },
  { value: "apresentacoes", label: "Apresentações principais" },
  { value: "via_oral", label: "Via oral (se aplicável)" },
  { value: "via_injetavel", label: "Via injetável (se aplicável)" },
  { value: "dose_adulto", label: "Dose adulto padrão" },
  { value: "dose_pediatrica", label: "Dose pediátrica" },
  { value: "dose_maxima", label: "Dose máxima" },
  { value: "tipo_receita", label: "Tipo de receita definido" },
  { value: "controlado_marcado", label: "Antimicrobiano/controlado marcado" },
  { value: "alertas", label: "Alertas básicos cadastrados" },
  { value: "vinculo_cid_queixa", label: "Vínculo com CID/queixa" },
  { value: "vinculo_modelos", label: "Vínculo com modelos rápidos" },
  { value: "fonte", label: "Fonte informada" },
  { value: "status_revisao", label: "Status de revisão definido" },
];

export const BLOCO_STATUS_LABEL: Record<BlocoStatus, string> = {
  nao_iniciado: "Não iniciado",
  em_cadastro: "Em cadastro",
  em_revisao: "Em revisão",
  pronto_beta: "Pronto para beta",
  precisa_ajuste: "Precisa ajuste",
};

export const CHECKLIST_STATUS_LABEL: Record<ChecklistItemStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  revisado: "Revisado",
  nao_aplicavel: "Não aplicável",
};
