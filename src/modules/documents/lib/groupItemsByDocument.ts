// Etapa 20 — Agrupa itens em "bundles" prontos para virar PDFs.
import type {
  AtendimentoItem,
  DocumentBundle,
  DocumentoTipo,
  DocumentosSettings,
  ItemMedicamento,
} from "./types";
import { classifyItem } from "./classifyDocumentDestination";

const TITULOS: Record<DocumentoTipo, string> = {
  receita_comum: "Receita Médica",
  receita_controle_especial: "Receita de Controle Especial",
  receita_antimicrobiano: "Receita de Antimicrobiano",
  receita_controlado_especifico: "Receita de Medicamento Controlado",
  solicitacao_exames: "Solicitação de Exames",
  atestado: "Atestado Médico",
  encaminhamento: "Encaminhamento Médico",
  relatorio: "Relatório Médico",
  declaracao: "Declaração de Comparecimento",
  orientacoes_paciente: "Orientações ao Paciente",
  prescricao_hospitalar: "Prescrição Hospitalar",
  orientacoes_enfermagem_farmacia: "Orientações de Preparo e Administração",
  anexo_tecnico_iv: "Anexo Técnico — Diluição e Administração IV",
  plano_terapeutico: "Plano Terapêutico",
  resumo_atendimento: "Resumo do Atendimento",
  aih: "Laudo de Internação (AIH)",
  apac: "Laudo APAC",
  notificacao_compulsoria: "Notificação Compulsória",
  procedimento: "Solicitação de Procedimento",
};

export function groupItemsByDocument(
  itens: AtendimentoItem[],
  options: {
    hospitalar?: boolean;
    settings?: DocumentosSettings | null;
    incluirAnexoIV?: boolean;
  } = {},
): DocumentBundle[] {
  const buckets = new Map<DocumentoTipo, AtendimentoItem[]>();

  for (const it of itens) {
    const tipo = classifyItem(it, { hospitalar: options.hospitalar, settings: options.settings });
    if (!buckets.has(tipo)) buckets.set(tipo, []);
    buckets.get(tipo)!.push(it);
  }

  // Anexo técnico IV: gerado a partir de medicamentos IV com diluição quando solicitado.
  if (options.incluirAnexoIV) {
    const ivItens = itens.filter(
      (i): i is ItemMedicamento => i.kind === "medicamento" && Boolean(i.via_iv && i.diluicao_iv),
    );
    if (ivItens.length > 0) buckets.set("anexo_tecnico_iv", ivItens);
  }

  // Orientações de enfermagem/farmácia: somente em contexto hospitalar com itens IV.
  if (options.hospitalar) {
    const ivItens = itens.filter(
      (i): i is ItemMedicamento => i.kind === "medicamento" && Boolean(i.via_iv),
    );
    if (ivItens.length > 0) {
      buckets.set("orientacoes_enfermagem_farmacia", ivItens);
    }
  }

  const ordemPreferida: DocumentoTipo[] = [
    "receita_comum",
    "receita_controle_especial",
    "receita_antimicrobiano",
    "receita_controlado_especifico",
    "prescricao_hospitalar",
    "solicitacao_exames",
    "atestado",
    "declaracao",
    "encaminhamento",
    "relatorio",
    "orientacoes_paciente",
    "orientacoes_enfermagem_farmacia",
    "anexo_tecnico_iv",
    "plano_terapeutico",
    "resumo_atendimento",
  ];

  return ordemPreferida
    .filter((t) => buckets.has(t))
    .map<DocumentBundle>((tipo) => ({
      tipo,
      titulo: TITULOS[tipo],
      itens: buckets.get(tipo)!,
      incluir: true,
    }));
}

export const DOCUMENTO_TITULOS = TITULOS;
