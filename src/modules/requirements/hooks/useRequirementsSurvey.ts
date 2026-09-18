import { useCallback, useEffect, useState } from "react";
import { SURVEY_VERSION } from "../lib/questionnaire";
import type { SurveyAnswer, SurveyResponse } from "../lib/types";

const STORAGE_KEY = "prescrimed:requirements-survey:v1";

const initial = (): SurveyResponse => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SurveyResponse;
  } catch {
    /* ignora leitura inválida */
  }
  return { version: SURVEY_VERSION, updatedAt: "", respondent: {}, answers: {} };
};

export function useRequirementsSurvey() {
  const [response, setResponse] = useState<SurveyResponse>(initial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(response));
    } catch {
      /* armazenamento indisponível */
    }
  }, [response]);

  const setAnswer = useCallback((id: string, value: SurveyAnswer) => {
    setResponse((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      answers: { ...prev.answers, [id]: value },
    }));
  }, []);

  const toggleMulti = useCallback((id: string, option: string) => {
    setResponse((prev) => {
      const current = Array.isArray(prev.answers[id]) ? (prev.answers[id] as string[]) : [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        answers: { ...prev.answers, [id]: next },
      };
    });
  }, []);

  const setRespondent = useCallback((patch: Partial<SurveyResponse["respondent"]>) => {
    setResponse((prev) => ({ ...prev, respondent: { ...prev.respondent, ...patch } }));
  }, []);

  const reset = useCallback(() => {
    setResponse({ version: SURVEY_VERSION, updatedAt: "", respondent: {}, answers: {} });
  }, []);

  return { response, setAnswer, toggleMulti, setRespondent, reset };
}
