// Etapa 19 — Detecção de campos incompletos / ambíguos por tipo de item.
import type { ExtractedItem, ExtractedMedication, MissingField } from "./types";
import { isValidUnit } from "./normalize";

const msg = (campo: string, mensagem: string): MissingField => ({ campo, mensagem });

export function detectMissingFields(item: ExtractedItem): MissingField[] {
  const out: MissingField[] = [];
  if (item.tipo === "medicamento") {
    const m = item as ExtractedMedication;
    if (!m.dose) out.push(msg("dose", "Dose não informada."));
    if (m.dose && !m.unidade) out.push(msg("unidade", "Dose identificada, mas unidade ausente."));
    if (m.unidade && !isValidUnit(m.unidade))
      out.push(msg("unidade", "Unidade não reconhecida."));
    if (!m.via) out.push(msg("via", "Via não informada."));
    if (!m.frequencia) out.push(msg("frequencia", "Frequência não informada."));
    if (!m.duracao) out.push(msg("duracao", "Duração não informada."));
    // IV específicos
    if ((m.via ?? "").toUpperCase() === "IV") {
      if (!m.diluente) out.push(msg("diluente", "Diluente não informado para medicamento IV."));
      if (!m.volume_diluicao) out.push(msg("volume_diluicao", "Volume de diluição ausente."));
      if (!m.tempo_infusao) out.push(msg("tempo_infusao", "Tempo de infusão ausente."));
    }
  }
  if (item.tipo === "exame" && !(item as { nome?: string }).nome) {
    out.push(msg("nome", "Nome do exame não informado."));
  }
  if (item.tipo === "orientacao" && !(item as { texto?: string }).texto) {
    out.push(msg("texto", "Texto da orientação ausente."));
  }
  return out;
}

export function isCriticalMissing(fields: MissingField[]): boolean {
  return fields.some((f) =>
    ["dose", "via", "frequencia", "diluente", "volume_diluicao", "tempo_infusao"].includes(f.campo),
  );
}
