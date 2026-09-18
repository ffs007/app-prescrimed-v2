// Pure formatters used by prescriber/nursing/pharmacy views and PDF annex.
import type { IVMedication } from "../IVDilutionAdminPage";

const has = (v?: string | null) => !!v && v.trim() !== "";

/** Texto formal usado no anexo do PDF. */
export function buildPdfAnnexLine(m: IVMedication): string {
  const parts: string[] = [];
  if (m.solucoes_compativeis?.length) parts.push(`diluir em ${m.solucoes_compativeis.join(" ou ")}`);
  if (has(m.volume_diluicao)) parts.push(`volume ${m.volume_diluicao}`);
  if (has(m.concentracao_maxima)) parts.push(`concentração máxima ${m.concentracao_maxima}`);
  if (has(m.tempo_minimo_infusao)) parts.push(`infundir em no mínimo ${m.tempo_minimo_infusao}`);
  const obs: string[] = [];
  if (m.exige_fotoprotecao) obs.push("proteção da luz");
  if (m.exige_filtro) obs.push("uso de filtro");
  if (m.incompatibilidades?.length) obs.push(`incompatível com ${m.incompatibilidades.slice(0, 3).join(", ")}`);
  let text = `${m.principio_ativo} IV: ${parts.join(", ") || "seguir orientação cadastrada"}.`;
  if (obs.length) text += ` Observar ${obs.join("; ")}, quando aplicável.`;
  text += " Validar conforme protocolo institucional.";
  return text;
}

/** Texto copiável para enfermagem/farmácia (mais detalhado). */
export function buildNursingCopyText(m: IVMedication): string {
  const lines: string[] = [`Orientações IV — ${m.principio_ativo}:`];
  const prep: string[] = [];
  if (has(m.diluente_reconstituicao) || has(m.volume_reconstituicao)) {
    prep.push(`reconstituir com ${[m.volume_reconstituicao, m.diluente_reconstituicao].filter(Boolean).join(" de ")}`);
  } else {
    prep.push("reconstituir conforme orientação cadastrada");
  }
  if (m.solucoes_compativeis?.length) prep.push(`diluir em ${m.solucoes_compativeis.join(" ou ")}`);
  if (has(m.volume_diluicao)) prep.push(`volume recomendado ${m.volume_diluicao}`);
  if (has(m.concentracao_maxima)) prep.push(`respeitar concentração máxima de ${m.concentracao_maxima}`);
  if (has(m.tempo_minimo_infusao)) prep.push(`infundir em no mínimo ${m.tempo_minimo_infusao}`);
  if (has(m.velocidade_maxima_infusao)) prep.push(`velocidade máxima ${m.velocidade_maxima_infusao}`);
  lines.push(prep.join(", ") + ".");
  const cuid: string[] = [];
  if (m.exige_fotoprotecao) cuid.push("proteger da luz");
  if (m.exige_equipo_fotossensivel) cuid.push("usar equipo fotossensível");
  if (m.exige_filtro) cuid.push("usar filtro em linha");
  if (m.risco_flebite) cuid.push("avaliar acesso venoso (risco de flebite)");
  if (m.incompatibilidades?.length) cuid.push(`evitar: ${m.incompatibilidades.join(", ")}`);
  if (cuid.length) lines.push("Cuidados: " + cuid.join("; ") + ".");
  if (has(m.alerta_enfermagem_farmacia)) lines.push(m.alerta_enfermagem_farmacia!);
  lines.push("Validar estabilidade e protocolo institucional.");
  return lines.join("\n");
}
