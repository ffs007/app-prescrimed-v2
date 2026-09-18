import type { IVMedication } from "../IVDilutionAdminPage";

export type QualityIssue = {
  code: string;
  severity: "warn" | "info";
  message: string;
};

const MONTHS_12_MS = 1000 * 60 * 60 * 24 * 365;

export function computeQualityIssues(m: Partial<IVMedication> & { data_atualizacao?: string | null }): QualityIssue[] {
  const issues: QualityIssue[] = [];
  if (!m.fonte_referencia || m.fonte_referencia.trim() === "" || /n[ãa]o informada/i.test(m.fonte_referencia))
    issues.push({ code: "sem_fonte", severity: "warn", message: "Sem fonte de referência" });
  if (!m.concentracao_maxima) issues.push({ code: "sem_concentracao", severity: "warn", message: "Sem concentração máxima" });
  if (!m.tempo_minimo_infusao) issues.push({ code: "sem_tempo", severity: "warn", message: "Sem tempo mínimo de infusão" });
  if (m.nivel_alerta === "alto" && (!m.incompatibilidades || m.incompatibilidades.length === 0))
    issues.push({ code: "alto_sem_incomp", severity: "warn", message: "Alerta alto sem incompatibilidades cadastradas" });
  if ((m.exige_filtro || m.exige_fotoprotecao || m.exige_equipo_fotossensivel) && !m.alerta_enfermagem_farmacia)
    issues.push({ code: "sem_alerta_enf", severity: "warn", message: "Exige cuidado especial sem alerta para enfermagem/farmácia" });
  if (m.nivel_alerta === "alto" && !m.alerta_medico)
    issues.push({ code: "alto_sem_med", severity: "warn", message: "Alerta alto sem orientação ao médico" });
  if (m.data_atualizacao) {
    const d = new Date(m.data_atualizacao).getTime();
    if (!isNaN(d) && Date.now() - d > MONTHS_12_MS)
      issues.push({ code: "fonte_desatualizada", severity: "info", message: "Revisar fonte (>12 meses)" });
  }
  return issues;
}

export const isIncomplete = (m: Partial<IVMedication>) =>
  computeQualityIssues(m).some((i) => i.severity === "warn");
export const isOutdated = (m: Partial<IVMedication>) =>
  computeQualityIssues(m).some((i) => i.code === "fonte_desatualizada");
