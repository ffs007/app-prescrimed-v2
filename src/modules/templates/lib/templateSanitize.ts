// Etapa 17 — Remove dados identificáveis do paciente ao salvar prescrição como modelo.

import type { AnyTemplateItem } from "./types";

const PII_KEYS = [
  "nome_paciente",
  "paciente",
  "patient",
  "patient_name",
  "idade",
  "age",
  "peso",
  "weight",
  "documento",
  "cpf",
  "rg",
  "id_paciente",
  "patient_id",
  "endereco",
  "telefone",
  "email",
];

export function sanitizeItemForTemplate<T extends Record<string, any>>(item: T): T {
  const clone: Record<string, any> = { ...item };
  for (const k of Object.keys(clone)) {
    if (PII_KEYS.includes(k.toLowerCase())) delete clone[k];
  }
  // Observações específicas do caso: limpar se contiver indicadores
  if (typeof clone.observacoes === "string") {
    if (/paciente|sr\.?|sra\.?|cpf|rg/i.test(clone.observacoes)) {
      clone.observacoes = "";
    }
  }
  return clone as T;
}

export function sanitizePrescriptionToTemplate(
  itens: AnyTemplateItem[],
): AnyTemplateItem[] {
  return itens.map((it) => sanitizeItemForTemplate(it));
}
