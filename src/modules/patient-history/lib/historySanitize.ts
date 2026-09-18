// Etapa 18 — Sanitização de PII ao duplicar documentos antigos como base.
const PII_KEYS = [
  "paciente_nome",
  "paciente_cpf",
  "paciente_rg",
  "paciente_endereco",
  "paciente_telefone",
  "paciente_email",
  "paciente_data_nascimento",
  "paciente_id",
  "id_paciente",
  "responsavel_nome",
  "responsavel_cpf",
];

export function stripPatientPII<T extends Record<string, unknown>>(doc: T): T {
  const clone: Record<string, unknown> = { ...doc };
  for (const k of PII_KEYS) delete clone[k];
  return clone as T;
}

export function sanitizeText(text: string | null | undefined): string {
  if (!text) return "";
  // remove CPF / RG / telefone simples
  return text
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[CPF removido]")
    .replace(/\b\d{2}\.?\d{3}\.?\d{3}-?\d{1,2}\b/g, "[RG removido]")
    .replace(/\(\d{2}\)\s?\d{4,5}-?\d{4}/g, "[telefone removido]");
}
