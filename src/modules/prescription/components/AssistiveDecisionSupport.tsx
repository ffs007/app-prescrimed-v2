/**
 * Suporte à decisão clínica da receita em construção.
 *
 * Reúne os painéis assistenciais que analisam os medicamentos selecionados contra a base
 * `iv_medications`: interações/duplicidade/risco acumulado, alertas por perfil do paciente
 * (gestação, lactação, nefropatia, hepatopatia...), diluição IV e histórico do paciente.
 * Medicamentos sem correspondência na base ficam fora da análise (aviso explícito na tela).
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { SelectedMed } from "../types/prescription";
import InteractionsRiskCard from "@/modules/interactions/InteractionsRiskCard";
import { useInteractionsBase } from "@/modules/interactions/hooks/useInteractionsBase";
import { useInteractionsSettings } from "@/modules/interactions/hooks/useInteractionsSettings";
import { RISK_CATEGORIES, type PrescItem, type RiskLevel } from "@/modules/interactions/lib/interactionsCalc";
import ClinicalAlertsCard from "@/modules/clinical-alerts/ClinicalAlertsCard";
import MedicationClinicalBadges from "@/modules/clinical-alerts/MedicationClinicalBadges";
import PatientProfileFields from "@/modules/clinical-alerts/PatientProfileFields";
import { useContraindicationsBase } from "@/modules/clinical-alerts/hooks/useContraindicationsBase";
import { useClinicalAlertsSettings } from "@/modules/clinical-alerts/hooks/useClinicalAlertsSettings";
import {
  analyzePrescription,
  type MedicationInfo,
  type PatientProfile,
} from "@/modules/clinical-alerts/lib/clinicalAlertsCalc";
import IVPrescriberCard from "@/modules/iv-dilution/IVPrescriberCard";
import IVMatchHint from "@/modules/iv-dilution/IVMatchHint";
import { IVDilutionMissingHint } from "@/modules/iv-dilution/IVDilutionCard";
import type { IVMedication } from "@/modules/iv-dilution/IVDilutionAdminPage";
import { matchMedication, shouldAutoAssociate } from "@/modules/iv-dilution/lib/ivMatcher";
import PatientHistoryPanel from "@/modules/patient-history/PatientHistoryPanel";
import type { ReuseItem } from "@/modules/patient-history/lib/types";

const IV_ROUTE_RE = /\b(iv|ev)\b|intraven|endoven/i;

const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

const toPrescItem = (m: IVMedication): PrescItem => {
  const row = m as unknown as Record<string, unknown>;
  const riscos: PrescItem["riscos"] = {};
  for (const { key, medField } of RISK_CATEGORIES) {
    const v = row[medField];
    if (typeof v === "string") riscos[key] = v as RiskLevel;
  }
  return {
    id: m.id,
    principio_ativo: m.principio_ativo,
    principio_ativo_normalizado: (row.principio_ativo_normalizado as string | null | undefined) ?? null,
    classe_terapeutica: (row.classe_terapeutica as string | null | undefined) ?? null,
    subclasse_terapeutica: (row.subclasse_terapeutica as string | null | undefined) ?? null,
    permite_duplicidade_mesma_classe: Boolean(row.permite_duplicidade_mesma_classe),
    observacao_duplicidade: (row.observacao_duplicidade as string | null | undefined) ?? null,
    nomes_comerciais: (row.nomes_comerciais as string[] | undefined) ?? undefined,
    sinonimos: (row.sinonimos as string[] | undefined) ?? undefined,
    riscos,
  };
};

interface Props {
  selected: SelectedMed[];
  patientName: string;
  isPediatric: boolean;
  isPregnant: boolean;
  ageInYears: number | null;
  weightKg: number | null;
  allergies: string;
  onAddReuseItems: (items: ReuseItem[]) => void;
}

export default function AssistiveDecisionSupport({
  selected, patientName, isPediatric, isPregnant, ageInYears, weightKg, allergies, onAddReuseItems,
}: Props) {
  const [manualIv, setManualIv] = useState<Record<number, IVMedication>>({});
  const [extraProfile, setExtraProfile] = useState<PatientProfile | null>(null);

  const { data: ivAll = [], isError: ivError } = useQuery({
    queryKey: ["iv-medications-all"],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<IVMedication[]> => {
      const { data, error } = await supabase.from("iv_medications").select("*");
      if (error) throw error;
      return (data ?? []) as unknown as IVMedication[];
    },
  });
  useEffect(() => {
    if (ivError) toast.error("Não foi possível carregar a base de medicamentos para a análise clínica.");
  }, [ivError]);

  const { settings: interactionSettings } = useInteractionsSettings();
  const { data: interactionsBase } = useInteractionsBase(interactionSettings.usar_apenas_revisadas);
  const { settings: alertSettings } = useClinicalAlertsSettings();
  const { data: contraindications } = useContraindicationsBase(alertSettings.usar_apenas_revisadas);

  const matches = useMemo(
    () =>
      selected.map((med) => {
        const match = matchMedication(med.name, ivAll);
        const iv = manualIv[med.id] ?? (shouldAutoAssociate(match) ? match.best!.med : null);
        return { med, match, iv, isIV: IV_ROUTE_RE.test(med.text) };
      }),
    [selected, ivAll, manualIv],
  );

  const matched = useMemo(
    () => matches.filter((m): m is typeof m & { iv: IVMedication } => m.iv !== null),
    [matches],
  );
  const prescItems = useMemo(() => matched.map((m) => toPrescItem(m.iv)), [matched]);
  const medInfos = useMemo(
    () => matched.map((m) => m.iv as unknown as MedicationInfo),
    [matched],
  );

  const profile: PatientProfile = useMemo(() => {
    const base: PatientProfile = extraProfile ?? {
      id_paciente: patientName.trim() || "sem-identificacao",
      alergias_medicamentosas: [],
      alergias_classes_medicamentosas: [],
      alergias_outros: [],
      gestante: false,
      lactante: false,
      comorbidades: [],
      diagnosticos_cid: [],
      condicoes_clinicas_relevantes: [],
      restricoes_medicamentosas: [],
    };
    const declared = csv(allergies).map((principio_ativo) => ({
      principio_ativo,
      tipo_registro: "alergia_confirmada" as const,
      gravidade: "desconhecida" as const,
    }));
    const known = new Set(declared.map((a) => a.principio_ativo.toLowerCase()));
    return {
      ...base,
      id_paciente: patientName.trim() || base.id_paciente,
      gestante: isPregnant || base.gestante,
      idade_anos: ageInYears ?? base.idade_anos ?? null,
      alergias_medicamentosas: [
        ...declared,
        ...base.alergias_medicamentosas.filter((a) => !known.has(a.principio_ativo.toLowerCase())),
      ],
    };
  }, [extraProfile, patientName, allergies, isPregnant, ageInYears]);

  const alertAnalysis = useMemo(
    () => analyzePrescription({ meds: medInfos, patient: profile, base: contraindications, restrictions: [], settings: alertSettings }),
    [medInfos, profile, contraindications, alertSettings],
  );

  if (selected.length === 0) return null;

  const historyKey = patientName.trim() || null;

  return (
    <section className="space-y-3 print:hidden" aria-label="Suporte à decisão clínica">
      <h3 className="text-xs font-semibold uppercase tracking-editorial text-ink-muted">Suporte à decisão clínica</h3>
      <p className="text-xs text-ink-muted">
        {matched.length} de {selected.length} medicamento(s) com cadastro na base foram analisados.
        Os demais precisam de conferência manual.
      </p>

      {prescItems.length > 0 && (
        <InteractionsRiskCard
          items={prescItems}
          base={interactionsBase}
          settings={interactionSettings}
          patient={{ idade_anos: ageInYears }}
        />
      )}

      {medInfos.length > 0 && (
        <>
          <ClinicalAlertsCard
            meds={medInfos}
            patient={profile}
            base={contraindications}
            restrictions={[]}
            settings={alertSettings}
          />
          <ul className="space-y-1">
            {matched.map((m, i) => (
              <li key={m.med.id} className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium">{m.med.name}</span>
                <MedicationClinicalBadges result={alertAnalysis.por_medicamento[i]} />
              </li>
            ))}
          </ul>
        </>
      )}

      <PatientProfileFields profile={profile} onSave={setExtraProfile} />

      {matches.filter((m) => m.isIV).map((m) => (
        <div key={m.med.id} className="space-y-2">
          <p className="text-xs font-medium">{m.med.name} — diluição IV</p>
          {m.iv ? (
            <IVPrescriberCard
              medication={m.iv}
              patient={{ idade_anos: ageInYears, peso_kg: weightKg, paciente_pediatrico: isPediatric }}
            />
          ) : (
            <IVDilutionMissingHint />
          )}
          {!shouldAutoAssociate(m.match) && m.match.candidates.length > 0 && (
            <IVMatchHint
              query={m.med.name}
              match={m.match}
              onConfirm={(iv) => setManualIv((prev) => ({ ...prev, [m.med.id]: iv }))}
            />
          )}
        </div>
      ))}

      <PatientHistoryPanel
        idPaciente={historyKey}
        pacienteAtual={{
          peso_kg: weightKg ?? undefined,
          idade_anos: ageInYears ?? undefined,
          gestante: isPregnant,
          alergias: csv(allergies),
        }}
        onAddItems={(items) => onAddReuseItems(items)}
      />
    </section>
  );
}
