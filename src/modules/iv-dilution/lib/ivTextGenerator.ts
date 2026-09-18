// Pure text-generation helpers for the IV dilution module.
// Produces 5 standardized texts from the medication record fields.
import type { IVMedication } from "../IVDilutionAdminPage";

const has = (v?: string | null) => !!v && v.trim() !== "" && !/não informad/i.test(v);
const arr = (v?: string[] | null) => (v ?? []).filter(Boolean);

/** A. Alerta para o médico — curto e objetivo. Máx 2 frases. */
export function genAlertaMedico(m: Partial<IVMedication>): string {
  const pa = m.principio_ativo ?? "Medicamento";
  const incomp = arr(m.incompatibilidades);
  const reasons: string[] = [];

  if (incomp.length) {
    return `Atenção: ${pa} IV possui incompatibilidades cadastradas. Não administrar com ${incomp.slice(0, 2).join(" / ")} devido ao risco de precipitação ou inativação.`;
  }
  if (has(m.concentracao_maxima)) reasons.push(`concentração máxima de ${m.concentracao_maxima}`);
  if (has(m.velocidade_maxima_infusao)) reasons.push(`velocidade máxima de ${m.velocidade_maxima_infusao}`);
  if (has(m.tempo_minimo_infusao)) reasons.push(`tempo mínimo de infusão de ${m.tempo_minimo_infusao}`);
  if (m.exige_filtro) reasons.push("uso obrigatório de filtro");
  if (m.exige_fotoprotecao || m.exige_equipo_fotossensivel) reasons.push("proteção da luz durante preparo e administração");
  if (m.risco_flebite) reasons.push("risco de flebite — atenção ao acesso venoso");

  if (!reasons.length) {
    return `Atenção: ${pa} IV possui dados de segurança incompletos na base. Validar protocolo institucional antes de finalizar.`;
  }
  const main = reasons[0];
  const tail = reasons.length > 1 ? ` Verifique também ${reasons.slice(1, 3).join(" e ")}.` : "";
  return `Atenção: ${pa} IV requer ${main}. Verifique dose, diluição e protocolo institucional antes de finalizar.${tail}`.trim();
}

/** B. Orientação operacional para enfermagem/farmácia. */
export function genAlertaEnfermagemFarmacia(m: Partial<IVMedication>): string {
  const pa = m.principio_ativo ?? "Medicamento";
  const parts: string[] = [];

  if (has(m.volume_reconstituicao) || has(m.diluente_reconstituicao)) {
    const r = [has(m.volume_reconstituicao) ? `${m.volume_reconstituicao}` : null, has(m.diluente_reconstituicao) ? `de ${m.diluente_reconstituicao}` : null]
      .filter(Boolean).join(" ");
    parts.push(`reconstituir com ${r}`);
  }
  const sols = arr(m.solucoes_compativeis);
  if (sols.length) parts.push(`diluir em ${sols.join(" ou ")}`);
  if (has(m.volume_diluicao)) parts.push(`volume recomendado ${m.volume_diluicao}`);
  if (has(m.concentracao_maxima)) parts.push(`concentração máxima ${m.concentracao_maxima}`);
  if (has(m.tempo_minimo_infusao)) parts.push(`infundir em no mínimo ${m.tempo_minimo_infusao}`);
  else if (has(m.velocidade_maxima_infusao)) parts.push(`velocidade máxima ${m.velocidade_maxima_infusao}`);

  let base = parts.length
    ? `Preparar ${pa} IV conforme orientação: ${parts.join(", ")}.`
    : `Preparar ${pa} IV conforme orientação cadastrada.`;

  const incomp = arr(m.incompatibilidades);
  if (incomp.length) base += ` Não administrar com ${incomp.slice(0, 3).join(" / ")} devido ao risco de precipitação.`;
  if (m.exige_fotoprotecao) base += " Usar proteção da luz durante preparo/administração.";
  if (m.exige_equipo_fotossensivel) base += " Utilizar equipo fotossensível conforme orientação cadastrada.";
  if (m.exige_filtro) base += " Utilizar filtro conforme orientação cadastrada.";
  if (m.risco_flebite) base += " Avaliar acesso venoso, diluição e velocidade devido ao risco de flebite.";
  base += " Validar estabilidade e protocolo institucional.";
  return base;
}

/** C. Orientação resumida para o card da prescrição. */
export function genOrientacaoResumidaPrescricao(m: Partial<IVMedication>): string {
  const sols = arr(m.solucoes_compativeis);
  const parts: string[] = [];
  if (sols.length) parts.push(`Diluir em ${sols.join(" ou ")}`);
  if (has(m.volume_diluicao)) parts.push(`volume ${m.volume_diluicao}`);
  let s = parts.join(", ");
  if (has(m.concentracao_maxima)) s += `${s ? ". " : ""}Máx: ${m.concentracao_maxima}`;
  if (has(m.tempo_minimo_infusao)) s += `${s ? ". " : ""}Infundir em ≥ ${m.tempo_minimo_infusao}`;
  const incomp = arr(m.incompatibilidades);
  if (incomp.length) s += `${s ? ". " : ""}Evitar: ${incomp.slice(0, 2).join(", ")}`;
  return (s || "Sem dados de diluição cadastrados.") + ".";
}

/** D. Orientação para impressão (PDF). */
export function genOrientacaoParaImpressao(m: Partial<IVMedication>): string {
  const pa = m.principio_ativo ?? "Medicamento";
  const pratico = genAlertaEnfermagemFarmacia(m)
    .replace(/^Preparar [^:]+: /, "")
    .replace(/^Preparar [^.]+\./, "");
  return `Orientação de preparo/administração IV — ${pa}: ${pratico} Informações de apoio à decisão clínica. Validar conforme protocolo institucional.`;
}

/** E. Mensagem para a Revisão de Segurança IV. */
export function genMensagemRevisaoSeguranca(m: Partial<IVMedication>): string {
  const pa = m.principio_ativo ?? "Medicamento";
  const points: string[] = [];
  if (arr(m.incompatibilidades).length) points.push("incompatibilidades cadastradas");
  if (has(m.concentracao_maxima)) points.push("concentração máxima");
  if (has(m.tempo_minimo_infusao)) points.push("tempo mínimo de infusão");
  if (has(m.velocidade_maxima_infusao)) points.push("velocidade máxima");
  if (m.exige_filtro) points.push("necessidade de filtro");
  if (m.exige_fotoprotecao || m.exige_equipo_fotossensivel) points.push("proteção da luz");
  if (m.risco_flebite) points.push("risco de flebite");
  const main = points.slice(0, 3).join(", ") || "dados de segurança";
  return `${pa}: revisar ${main}.`;
}

export type GeneratedTexts = {
  alerta_medico: string;
  alerta_enfermagem_farmacia: string;
  orientacao_resumida_prescricao: string;
  orientacao_para_impressao: string;
  mensagem_revisao_seguranca_iv: string;
};

export function generateAllTexts(m: Partial<IVMedication>): GeneratedTexts {
  return {
    alerta_medico: genAlertaMedico(m),
    alerta_enfermagem_farmacia: genAlertaEnfermagemFarmacia(m),
    orientacao_resumida_prescricao: genOrientacaoResumidaPrescricao(m),
    orientacao_para_impressao: genOrientacaoParaImpressao(m),
    mensagem_revisao_seguranca_iv: genMensagemRevisaoSeguranca(m),
  };
}

/** Quality checks specific to the generated texts. */
export type TextIssue = { code: string; message: string };
export function computeTextIssues(m: any): TextIssue[] {
  const issues: TextIssue[] = [];
  const lc = (s?: string | null) => (s ?? "").toLowerCase();
  if (m.nivel_alerta === "alto" && !has(m.alerta_medico))
    issues.push({ code: "alerta_alto_sem_alerta_medico", message: "Alerta alto sem alerta médico" });
  if (m.exige_filtro && !/filtro/i.test(lc(m.alerta_enfermagem_farmacia)))
    issues.push({ code: "filtro_sem_mencao", message: "Exige filtro mas a orientação não menciona" });
  if ((m.exige_fotoprotecao || m.exige_equipo_fotossensivel) && !/(luz|fotop|fotossens)/i.test(lc(m.alerta_enfermagem_farmacia)))
    issues.push({ code: "foto_sem_mencao", message: "Exige fotoproteção mas não está nas orientações" });
  if (has(m.concentracao_maxima) && !/(máx|max|concentra)/i.test(lc(m.orientacao_resumida_prescricao)))
    issues.push({ code: "conc_max_sem_resumo", message: "Sem concentração máx. no resumo" });
  if (has(m.tempo_minimo_infusao) && !/(infund|tempo|min)/i.test(lc(m.orientacao_resumida_prescricao)))
    issues.push({ code: "tempo_sem_resumo", message: "Sem tempo de infusão no resumo" });
  if ((m.incompatibilidades?.length ?? 0) > 0 && !/incompat|evitar|precipit/i.test(lc(m.mensagem_revisao_seguranca_iv)))
    issues.push({ code: "incomp_sem_revisao", message: "Sem menção a incompatibilidade na revisão" });
  if (m.texto_gerado_automaticamente && m.status_texto !== "revisado")
    issues.push({ code: "texto_nao_revisado", message: "Texto automático ainda não revisado" });
  return issues;
}
