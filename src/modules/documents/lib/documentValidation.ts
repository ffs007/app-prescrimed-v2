// Etapa 20 — Validações para documentos críticos.
import type {
  DocumentBundle,
  DocumentosSettings,
  PacienteInfo,
  AssinaturaPerfil,
} from "./types";

export interface ValidationResult {
  ok: boolean;
  pendencias: string[];
}

export function validateBundle(
  bundle: DocumentBundle,
  paciente: PacienteInfo,
  perfil: AssinaturaPerfil | null,
  settings: DocumentosSettings | null,
): ValidationResult {
  const pend: string[] = [];

  if (!perfil) pend.push("Perfil de assinatura não selecionado.");
  if (!perfil?.nome_profissional) pend.push("Nome do profissional ausente.");
  if (!perfil?.registro) pend.push("Registro profissional (CRM/UF) ausente.");

  if (!paciente?.nome) pend.push("Nome do paciente ausente.");

  if (
    bundle.tipo === "receita_controle_especial" &&
    settings?.exigir_dados_completos_controle_especial
  ) {
    if (!paciente.documento) pend.push("Documento do paciente exigido na receita de controle especial.");
    if (!paciente.endereco) pend.push("Endereço do paciente exigido na receita de controle especial.");
  }

  if (bundle.tipo === "atestado") {
    const atest = bundle.itens.find((i) => i.kind === "atestado");
    if (!atest) pend.push("Item de atestado ausente.");
  }

  if (bundle.itens.length === 0) pend.push("Documento sem itens.");

  return { ok: pend.length === 0, pendencias: pend };
}
