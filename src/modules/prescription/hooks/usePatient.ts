import { useCallback, useState } from "react";

export type AgeUnit = "meses" | "anos";
export type Sex = "" | "feminino" | "masculino" | "outro";
export type RenalFunction = "" | "normal" | "leve" | "moderada" | "grave";

export interface PatientState {
  patientName: string;
  isPediatric: boolean;
  isPregnant: boolean;
  ageValue: string;
  ageUnit: AgeUnit;
  weight: string;
  sex: Sex;
  allergies: string;
  renalFunction: RenalFunction;
  notes: string;
}

export interface PatientActions {
  setPatientName: (v: string) => void;
  setIsPediatric: (v: boolean) => void;
  setIsPregnant: (v: boolean) => void;
  setAgeValue: (v: string) => void;
  setAgeUnit: (v: AgeUnit) => void;
  setWeight: (v: string) => void;
  setSex: (v: Sex) => void;
  setAllergies: (v: string) => void;
  setRenalFunction: (v: RenalFunction) => void;
  setNotes: (v: string) => void;
  reset: () => void;
}

export type UsePatientReturn = PatientState & PatientActions & {
  /** Idade normalizada em anos (decimal). null se não preenchida. */
  ageInYears: number | null;
  /** Peso em kg como número. null se não preenchido/ inválido. */
  weightKg: number | null;
  /** true se há alergias preenchidas (heurística simples: texto não vazio e ≠ "nega"). */
  hasAllergies: boolean;
  /** true se função renal indica comprometimento (moderada/grave). */
  hasRenalImpairment: boolean;
};

const INITIAL: PatientState = {
  patientName: "",
  isPediatric: false,
  isPregnant: false,
  ageValue: "",
  ageUnit: "anos",
  weight: "",
  sex: "",
  allergies: "",
  renalFunction: "",
  notes: "",
};

/**
 * Estado isolado do paciente atual da prescrição.
 * Mantém pediátrico/gestante, demografia e fatores clínicos (alergias, função renal)
 * que alimentam todos os documentos e a futura camada de segurança clínica.
 */
export const usePatient = (): UsePatientReturn => {
  const [state, setState] = useState<PatientState>(INITIAL);

  const setField = useCallback(
    <K extends keyof PatientState>(key: K, v: PatientState[K]) =>
      setState((s) => ({ ...s, [key]: v })),
    [],
  );

  // Derived
  const ageNum = parseFloat(state.ageValue.replace(",", "."));
  const ageInYears = Number.isFinite(ageNum)
    ? state.ageUnit === "meses" ? ageNum / 12 : ageNum
    : null;

  const weightNum = parseFloat(state.weight.replace(",", "."));
  const weightKg = Number.isFinite(weightNum) && weightNum > 0 ? weightNum : null;

  const allergiesNormalized = state.allergies.trim().toLowerCase();
  const hasAllergies =
    allergiesNormalized.length > 0 &&
    !["nega", "nao", "não", "n", "nenhuma", "nega alergia", "nega alergias"].includes(
      allergiesNormalized,
    );

  const hasRenalImpairment =
    state.renalFunction === "moderada" || state.renalFunction === "grave";

  return {
    ...state,
    setPatientName: useCallback((v: string) => setField("patientName", v), [setField]),
    setIsPediatric: useCallback((v: boolean) => setField("isPediatric", v), [setField]),
    setIsPregnant: useCallback((v: boolean) => setField("isPregnant", v), [setField]),
    setAgeValue: useCallback((v: string) => setField("ageValue", v), [setField]),
    setAgeUnit: useCallback((v: AgeUnit) => setField("ageUnit", v), [setField]),
    setWeight: useCallback((v: string) => setField("weight", v), [setField]),
    setSex: useCallback((v: Sex) => setField("sex", v), [setField]),
    setAllergies: useCallback((v: string) => setField("allergies", v), [setField]),
    setRenalFunction: useCallback((v: RenalFunction) => setField("renalFunction", v), [setField]),
    setNotes: useCallback((v: string) => setField("notes", v), [setField]),
    reset: useCallback(() => setState(INITIAL), []),
    ageInYears,
    weightKg,
    hasAllergies,
    hasRenalImpairment,
  };
};
