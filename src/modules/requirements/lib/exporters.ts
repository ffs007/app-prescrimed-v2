/** Exportação estruturada das respostas do questionário de requisitos. */
import { ALL_QUESTIONS, SURVEY_SECTIONS, SURVEY_VERSION } from "./questionnaire";
import type { SurveyAnswer, SurveyResponse } from "./types";

const answerToText = (value: SurveyAnswer): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join("; ") : "—";
  if (typeof value === "number") return String(value);
  return value;
};

export const completionRate = (response: SurveyResponse): number => {
  const total = ALL_QUESTIONS.length;
  const filled = ALL_QUESTIONS.filter((q) => {
    const v = response.answers[q.id];
    if (Array.isArray(v)) return v.length > 0;
    return v !== null && v !== undefined && v !== "";
  }).length;
  return total === 0 ? 0 : Math.round((filled / total) * 100);
};

export const missingRequired = (response: SurveyResponse) =>
  ALL_QUESTIONS.filter((q) => {
    if (!q.required) return false;
    const v = response.answers[q.id];
    if (Array.isArray(v)) return v.length === 0;
    return v === null || v === undefined || v === "";
  });

export function toStructuredJson(response: SurveyResponse) {
  return {
    schema: "prescrimed.requirements-survey",
    version: SURVEY_VERSION,
    exportedAt: new Date().toISOString(),
    respondent: response.respondent,
    completion: completionRate(response),
    sections: SURVEY_SECTIONS.map((s) => ({
      id: s.id,
      title: s.title,
      purpose: s.purpose,
      answers: s.questions.map((q) => ({
        id: q.id,
        question: q.label,
        type: q.type,
        value: response.answers[q.id] ?? null,
      })),
    })),
  };
}

export function toMarkdown(response: SurveyResponse): string {
  const lines: string[] = [
    "# Especificação de requisitos — PrescriMed",
    "",
    `Versão do questionário: ${SURVEY_VERSION}`,
    `Exportado em: ${new Date().toLocaleString("pt-BR")}`,
    `Preenchimento: ${completionRate(response)}%`,
    "",
    "## Respondente",
    `- Nome: ${response.respondent.nome || "—"}`,
    `- Instituição: ${response.respondent.instituicao || "—"}`,
    `- Contato: ${response.respondent.email || "—"}`,
    "",
  ];
  for (const section of SURVEY_SECTIONS) {
    lines.push(`## ${section.title}`, `_${section.purpose}_`, "");
    for (const q of section.questions) {
      lines.push(`- **${q.label}**: ${answerToText(response.answers[q.id] ?? null)}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function toCsv(response: SurveyResponse): string {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows = [["secao", "pergunta_id", "pergunta", "tipo", "resposta"]];
  for (const section of SURVEY_SECTIONS) {
    for (const q of section.questions) {
      rows.push([section.title, q.id, q.label, q.type, answerToText(response.answers[q.id] ?? null)]);
    }
  }
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
