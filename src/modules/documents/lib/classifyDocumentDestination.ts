// Etapa 20 — Classifica cada item do atendimento em um tipo de documento.
import type {
  AtendimentoItem,
  DocumentoTipo,
  DocumentosSettings,
  ItemMedicamento,
} from "./types";

export interface ClassifyOptions {
  hospitalar?: boolean;
  settings?: DocumentosSettings | null;
}

/**
 * Determina o tipo_destino_documento de um item.
 * Se a regra legal não estiver disponível, cai em receita_comum (médico pode reclassificar).
 */
export function classifyItem(item: AtendimentoItem, opts: ClassifyOptions = {}): DocumentoTipo {
  switch (item.kind) {
    case "exame":
      return "solicitacao_exames";
    case "orientacao":
      return "orientacoes_paciente";
    case "atestado":
      return "atestado";
    case "declaracao":
      return "declaracao";
    case "encaminhamento":
      return "encaminhamento";
    case "relatorio":
      return "relatorio";
    case "cuidado_enfermagem":
      return "prescricao_hospitalar";
    case "medicamento":
      return classifyMedicamento(item, opts);
  }
}

function classifyMedicamento(
  m: ItemMedicamento,
  opts: ClassifyOptions,
): DocumentoTipo {
  const hospitalar = m.hospitalar || opts.hospitalar;
  if (hospitalar) return "prescricao_hospitalar";

  if (m.tipo_receita === "controle_especial" || m.exige_receita_especial)
    return "receita_controle_especial";

  if (
    m.tipo_receita === "azul" ||
    m.tipo_receita === "amarela" ||
    m.tipo_receita === "branca_duas_vias"
  )
    return "receita_controlado_especifico";

  const separarAntimicrobianos =
    opts.settings?.separar_antimicrobianos ?? true;
  if ((m.antimicrobiano || m.tipo_receita === "antimicrobiano") && separarAntimicrobianos)
    return "receita_antimicrobiano";

  return "receita_comum";
}
