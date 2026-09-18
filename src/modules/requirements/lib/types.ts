export type SurveyAnswer = string | string[] | number | null;

export interface SurveyResponse {
  version: string;
  updatedAt: string;
  respondent: {
    nome?: string;
    instituicao?: string;
    email?: string;
  };
  answers: Record<string, SurveyAnswer>;
}

export const EMPTY_RESPONSE: SurveyResponse = {
  version: "1.0",
  updatedAt: "",
  respondent: {},
  answers: {},
};
