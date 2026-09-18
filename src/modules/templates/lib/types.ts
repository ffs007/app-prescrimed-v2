// Etapa 17 — Tipos de itens dos modelos/conjuntos/kits
// Cobertura: medicamento, exame, orientação, cuidado de enfermagem.

export type TemplateItemKind =
  | "medicamento"
  | "exame"
  | "orientacao"
  | "cuidado_enfermagem";

export interface BaseTemplateItem {
  id: string;
  tipo_item: TemplateItemKind;
  obrigatorio?: boolean;
  editavel?: boolean;
}

export interface MedicationTemplateItem extends BaseTemplateItem {
  tipo_item: "medicamento";
  principio_ativo: string;
  nome_medicamento?: string;
  apresentacao?: string;
  dose?: string;
  unidade_dose?: string;
  via?: string;
  frequencia?: string;
  duracao?: string;
  diluente?: string;
  volume_diluicao?: string;
  tempo_infusao?: string;
  observacoes?: string;
}

export interface ExamTemplateItem extends BaseTemplateItem {
  tipo_item: "exame";
  nome_exame: string;
  categoria?: string;
  indicacao?: string;
  prioridade?: "rotina" | "urgente" | "stat";
}

export interface OrientationTemplateItem extends BaseTemplateItem {
  tipo_item: "orientacao";
  texto: string;
  linguagem_paciente?: boolean;
}

export interface NursingCareTemplateItem extends BaseTemplateItem {
  tipo_item: "cuidado_enfermagem";
  descricao: string;
  frequencia?: string;
  condicao?: string;
}

export type AnyTemplateItem =
  | MedicationTemplateItem
  | ExamTemplateItem
  | OrientationTemplateItem
  | NursingCareTemplateItem;

export type TemplateAlertLevel =
  | "informativo"
  | "medio"
  | "alto"
  | "bloqueio";

export interface TemplateItemAlert {
  tipo: string; // "alergia" | "contraindicacao" | "interacao" | "iv" ...
  nivel: TemplateAlertLevel;
  mensagem: string;
}
