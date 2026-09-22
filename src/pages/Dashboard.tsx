import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Calculator, Eye, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useMedicationsCatalog } from "@/modules/prescription/hooks/useMedicationsCatalog";
import { usePathologiesCatalog } from "@/modules/prescription/hooks/usePathologiesCatalog";
import SettingsModal from "@/components/dashboard/SettingsModal";

import type {
  Medication, Pathology, ClinicInfo, SignatureConfig, PrescriptionTemplate, ClinicalEnvironment,
} from "@/modules/prescription/types/prescription";
import { isMedicationSafeForPregnancy } from "@/modules/prescription/services/medicationSafety";
import { usePatient } from "@/modules/prescription/hooks/usePatient";
import { usePediatricDose } from "@/modules/prescription/hooks/usePediatricDose";
import { usePrescription, MedicationContraindicatedError } from "@/modules/prescription/hooks/usePrescription";
import { usePathologyMemory } from "@/modules/prescription/hooks/usePathologyMemory";
import { pathologyKey } from "@/modules/prescription/hooks/usePathologyCustomization";

import ContextHeader, { type CareContext } from "@/modules/prescription/components/ContextHeader";
import PatientBlock from "@/modules/prescription/components/PatientBlock";
import ActionGrid, { type DocumentAction } from "@/modules/prescription/components/ActionGrid";
import PathologyGate, { ENVIRONMENTS } from "@/modules/prescription/components/PathologyGate";
import PathologyContextPanel from "@/modules/prescription/components/PathologyContextPanel";
import PathologyCorrelationPanel from "@/modules/prescription/components/PathologyCorrelationPanel";
import {
  getPathologyKnowledge, deriveProfiles, isHighSeverity,
} from "@/modules/prescription/data/pathologyKnowledge";
import DoseCalculatorPanel from "@/modules/prescription/components/DoseCalculatorPanel";
import ClinicalCalculatorsPanel from "@/modules/calculators/ClinicalCalculatorsPanel";
import ClinicalAIPanel from "@/modules/prescription/components/ClinicalAIPanel";
import ClinicalSupportPanel from "@/modules/prescription/components/ClinicalSupportPanel";
import SyndromePanel from "@/modules/syndromes/SyndromePanel";
import { useSyndromes } from "@/modules/syndromes/hooks/useSyndromes";
import { useSyndromePathologies } from "@/modules/prescription/hooks/useSyndromePathologies";
import type { Syndrome } from "@/modules/syndromes/lib/types";

import PathologyLibrary from "@/modules/prescription/components/PathologyLibrary";
import { useCustomPathologies } from "@/modules/prescription/hooks/useCustomPathologies";
import AtestadoForm, { type AtestadoData } from "@/modules/prescription/components/AtestadoForm";
import ExamesForm, { type ExamesData } from "@/modules/prescription/components/ExamesForm";
import EncaminhamentoForm, { type EncaminhamentoData } from "@/modules/prescription/components/EncaminhamentoForm";
import DeclaracaoForm, { type DeclaracaoData } from "@/modules/prescription/components/DeclaracaoForm";
import RelatorioForm, { type RelatorioData } from "@/modules/prescription/components/RelatorioForm";
import OrientacoesForm, { type OrientacoesData } from "@/modules/prescription/components/OrientacoesForm";
import ProcedimentoForm, { type ProcedimentoData } from "@/modules/prescription/components/ProcedimentoForm";
import ComingSoonModule from "@/modules/prescription/components/ComingSoonModule";
import StructuredDocumentForm from "@/modules/prescription/components/StructuredDocumentForm";
import {
  AIH_FIELDS, APAC_FIELDS, NOTIFICACAO_FIELDS,
  EMPTY_AIH, EMPTY_APAC, EMPTY_NOTIFICACAO,
  hasStructuredContent, type StructuredData,
} from "@/modules/prescription/services/regulatoryForms";
import { BedDouble, FileSpreadsheet, Siren } from "lucide-react";
import DocumentPreview from "@/modules/prescription/components/DocumentPreview";
import PrintArea from "@/modules/prescription/components/PrintArea";
import BuilderShell from "@/modules/prescription/components/BuilderShell";
import SafetyPanel from "@/modules/prescription/components/SafetyPanel";
import SafetyOverrideDialog from "@/modules/prescription/components/SafetyOverrideDialog";
import ReviewScreen from "@/modules/prescription/components/ReviewScreen";
import ManualMedicationDialog, { buildManualMedText, type ManualMedicationData } from "@/modules/prescription/components/ManualMedicationDialog";
import { validateDocument } from "@/modules/prescription/services/documentValidation";
import { assessSafety, type ClinicalAlert } from "@/modules/prescription/services/clinicalSafety";
import { safetyLog, hashPatient } from "@/modules/prescription/services/safetyLog";
import { serializeDocument } from "@/modules/prescription/services/documentText";
import { useSafetyOverride } from "@/modules/prescription/hooks/useSafetyOverride";
import { buildRegulatoryGroups, type RegulatoryGroup } from "@/modules/prescription/services/regulatoryGrouping";
import RegulatoryReviewPanel from "@/modules/prescription/components/RegulatoryReviewPanel";
import EmissionHistoryDrawer from "@/modules/prescription/components/EmissionHistoryDrawer";
import { useEmissionHistory, type EmissionRecord, type NewEmissionRecord } from "@/modules/prescription/hooks/useEmissionHistory";
import { savePrescriptionRecord } from "@/modules/prescription/services/prescriptionRecords";
import { attachDocumentPdf, persistEmission, resolveDocumentoTipo } from "@/modules/documents/lib/persistEmission";
import { runEmissionFailClosed } from "@/modules/documents/lib/emissionFailClosed";
import { logDocumentAction } from "@/modules/documents/lib/documentSave";
import { useDocumentsSettings } from "@/modules/documents/hooks/useDocumentsSettings";
import { useSignatureProfiles } from "@/modules/documents/hooks/useSignatureProfiles";
import { mergeClinicInfo, mergeSignatureConfig } from "@/modules/documents/lib/applySignatureProfile";
import { buildPdfOptions, downloadBlob } from "@/modules/documents/lib/pdfPrint";
import PatientProfileFields from "@/modules/clinical-alerts/PatientProfileFields";
import IVPrescriberCard from "@/modules/iv-dilution/IVPrescriberCard";
import InteractionsRiskCard from "@/modules/interactions/InteractionsRiskCard";
import { useInteractionsBase } from "@/modules/interactions/hooks/useInteractionsBase";
import type { PatientCtx as InteractionsPatientCtx, PrescItem } from "@/modules/interactions/lib/interactionsCalc";
import SmartInputDialog from "@/modules/smart-input/SmartInputDialog";
import ScoresDialog from "@/modules/scores/ScoresDialog";
import AssistiveDecisionSupport from "@/modules/prescription/components/AssistiveDecisionSupport";
import type { ReuseItem } from "@/modules/patient-history/lib/types";
import type { ExtractedItem } from "@/modules/smart-input/lib/types";
import type { ReceiptFamily } from "@/modules/prescription/services/regulatoryTaxonomy";

const EMPTY_CLINIC: ClinicInfo = { clinicName: "", doctorName: "", crm: "", specialty: "", address: "", phone: "", email: "" };
const EMPTY_SIGNATURE: SignatureConfig = { signatureText: "", signatureImageUrl: "" };
const EMPTY_ATESTADO: AtestadoData = { days: "", cid: "", reason: "", showCid: false };
const EMPTY_EXAMES: ExamesData = { itens: [], justificativa: "", cid: "", urgente: false, observacoes: "" };
const EMPTY_ENCAMINHAMENTO: EncaminhamentoData = { especialidade: "", hipotese: "", resumoClinico: "", exames: "", urgencia: "eletivo", cid: "" };
const EMPTY_DECLARACAO: DeclaracaoData = { data: "", horaInicio: "", horaFim: "", acompanhante: "", finalidade: "" };
const EMPTY_RELATORIO: RelatorioData = { conteudo: "", cid: "", destinatario: "" };
import { getPathologyCombo } from "@/modules/prescription/data/pathologyAutomation";
const EMPTY_ORIENTACOES: OrientacoesData = { diagnostico: "", cuidadosGerais: "", sinaisAlarme: [], retornoData: "", retornoCondicao: "" };
const EMPTY_PROCEDIMENTO: ProcedimentoData = { tipo: "", justificativa: "", observacoes: "", contexto: "" };

const DOC_TITLES: Record<DocumentAction, string> = {
  receita: "Receita médica",
  atestado: "Atestado médico",
  exames: "Solicitação de exames",
  encaminhamento: "Encaminhamento",
  declaracao: "Declaração de comparecimento",
  relatorio: "Relatório de atendimento",
  orientacoes: "Orientações & retorno",
  procedimento: "Solicitação de procedimento",
  aih: "Laudo de internação (AIH)",
  apac: "Laudo APAC",
  notificacao: "Notificação compulsória",
};
const cnDash = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");


const Dashboard = () => {
  // Context (where) + Action (what)
  const [context, setContext] = useState<CareContext>("hospitalar");
  const [action, setAction] = useState<DocumentAction>("receita");

  // Passo 1 — ambiente + patologia (fluxo patologia-primeiro)
  const [environment, setEnvironment] = useState<ClinicalEnvironment>("urgencia");
  const [activePathology, setActivePathology] = useState<Pathology | null>(null);
  const [activeSyndrome, setActiveSyndrome] = useState<Syndrome | null>(null);
  const [gatePassed, setGatePassed] = useState(false);
  /**
   * UX OPERACIONAL: etapa "docChosen" foi unificada com a etapa de builder.
   * ActionGrid + BuilderShell coexistem na mesma coluna após a patologia ser
   * escolhida, evitando 1 transição / 1 clique obrigatório por atendimento.
   *
   * Legado preservado: propriedade de estado permanece porque ActionGrid ainda
   * usa "selecionado vs rascunhos" e o mobile FAB ainda depende dela (nunca
   * mais usada como gate de renderização).
   */
  const [docChosen, setDocChosen] = useState(true);
  const pathologyMemory = usePathologyMemory();
  const { syndromes, isLoading: syndromesLoading } = useSyndromes();
  const { bySyndrome: syndromePathologies } = useSyndromePathologies();



  // Patient
  const patient = usePatient();
  const { isPediatric, isPregnant, weight, ageValue, ageUnit, patientName } = patient;

  // Persistence
  const [clinicInfo, setClinicInfo] = useLocalStorage<ClinicInfo>("clinic-info", EMPTY_CLINIC);
  const [signatureConfig, setSignatureConfig] = useLocalStorage<SignatureConfig>("signature-config", EMPTY_SIGNATURE);
  const [customMedications, setCustomMedications] = useLocalStorage<Medication[]>("custom-medications", []);
  const [customTemplates, setCustomTemplates] = useLocalStorage<PrescriptionTemplate[]>("custom-templates", []);

  /* ============================================================
   * Etapa 0.7 — perfil de assinatura (assinatura_perfis) e gate de
   * revisão final (documentos_settings.exigir_revisao_final_concluida),
   * religados sobre a emissão real (ReviewScreen + PrintArea).
   * ============================================================ */
  const { settings: documentsSettings } = useDocumentsSettings();
  const { profiles: signatureProfiles } = useSignatureProfiles();
  const [signatureProfileId, setSignatureProfileId] = useState<string>("");
  const [finalReviewConfirmed, setFinalReviewConfirmed] = useState(false);

  useEffect(() => {
    if (signatureProfileId || signatureProfiles.length === 0) return;
    const padrao = signatureProfiles.find((p) => p.padrao) ?? signatureProfiles[0];
    setSignatureProfileId(padrao.id);
  }, [signatureProfiles, signatureProfileId]);

  const selectedSignatureProfile = useMemo(
    () => signatureProfiles.find((p) => p.id === signatureProfileId) ?? null,
    [signatureProfiles, signatureProfileId],
  );

  /** Assinatura/carimbo e dados da unidade que vão no PrintArea — perfil escolhido, com o Settings local como fallback. */
  const resolvedSignatureConfig = useMemo(
    () => mergeSignatureConfig(signatureConfig, selectedSignatureProfile),
    [selectedSignatureProfile, signatureConfig],
  );
  const resolvedClinicInfo = useMemo(
    () => mergeClinicInfo(clinicInfo, selectedSignatureProfile),
    [selectedSignatureProfile, clinicInfo],
  );

  const requireFinalReview = documentsSettings?.exigir_revisao_final_concluida ?? true;
  const finalReviewOk = !requireFinalReview || finalReviewConfirmed;

  // Module-specific state
  const [atestado, setAtestado] = useState<AtestadoData>(EMPTY_ATESTADO);
  const [exames, setExames] = useState<ExamesData>(EMPTY_EXAMES);
  const [encaminhamento, setEncaminhamento] = useState<EncaminhamentoData>(EMPTY_ENCAMINHAMENTO);
  const [declaracao, setDeclaracao] = useState<DeclaracaoData>(EMPTY_DECLARACAO);
  const [relatorio, setRelatorio] = useState<RelatorioData>(EMPTY_RELATORIO);
  const [orientacoes, setOrientacoes] = useState<OrientacoesData>(EMPTY_ORIENTACOES);
  const [procedimento, setProcedimento] = useState<ProcedimentoData>(EMPTY_PROCEDIMENTO);
  const [aih, setAih] = useState<StructuredData>(EMPTY_AIH);
  const [apac, setApac] = useState<StructuredData>(EMPTY_APAC);
  const [notificacao, setNotificacao] = useState<StructuredData>(EMPTY_NOTIFICACAO);

  // UI state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  // Cada abertura da revisão final exige nova confirmação — não herda de uma sessão anterior.
  useEffect(() => { if (reviewOpen) setFinalReviewConfirmed(false); }, [reviewOpen]);
  const [printOpen, setPrintOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [smartOpen, setSmartOpen] = useState(() => searchParams.get("smart") === "1");
  const [scoresOpen, setScoresOpen] = useState(false);
  const atendimentoId = useRef(`atd-${crypto.randomUUID()}`);
  /** Grupo regulatório atualmente sendo emitido (para filtrar PrintArea). */
  const [activeGroup, setActiveGroup] = useState<RegulatoryGroup | null>(null);
  /** Resumo da automação aplicada ao carregar a última patologia (para feedback + desfazer). */
  const [appliedCombo, setAppliedCombo] = useState<{
    pathologyName: string;
    examIds: string[];
    examCount: number;
    redFlags: string[];
  } | null>(null);
  /** Registro de histórico em modo replay — quando definido, PrintArea usa estes dados em vez do estado atual. */
  const [replayRecord, setReplayRecord] = useState<EmissionRecord | null>(null);
  const [printedDocumentoId, setPrintedDocumentoId] = useState<string | null>(null);

  const emissionHistory = useEmissionHistory();

  // --- MÓDULO FANTASMA #3 — interações medicamentosas ativas no prescritor
  // Dados carregados da base de interações + configurações padrão
  const { records: interactionsBase, settings: interactionsSettings } = useInteractionsBase();

  // --- Derivados de UI OPERACIONAL (módulos fantasmas reconectados) ---
  const interactionsPatientCtx = useMemo<InteractionsPatientCtx>(() => {
    const years = patient.ageInYears;
    return {
      age_years: typeof years === "number" ? years : undefined,
      weight_kg: patient.weightKg ?? undefined,
      pregnant: !!isPregnant,
      lactating: false,
      renal: patient.hasRenalImpairment,
    };
  }, [patient.ageInYears, patient.weightKg, isPregnant, patient.hasRenalImpairment]);

  /**
   * Detecta injetáveis (EV/IV/IM/SC) no texto da prescrição para ativar o card
   * de diluição IV — MÓDULO FANTASMA #2.
   */
  const hasInjectables = useMemo(() => {
    if (action !== "receita") return false;
    const rx = /\b(EV|IV|IM|SC|VENOSA|INJETA|INJETÁVEL|BOLUS|INFUSÃO)\b/i;
    return selected.some((m) => rx.test(m.name) || rx.test(m.text || ""));
  }, [action, selected]);

  const prescItems: PrescItem[] = useMemo(
    () => selected.map((m) => ({ id: String(m.id), nome: m.name, texto: m.text || m.name })),
    [selected],
  );

  const showInteractionRisk =
    action === "receita" &&
    (prescItems.length > 0 || assessment.alerts.length > 0) &&
    interactionsBase.length > 0;

  const showIVDilution = action === "receita" && (hasInjectables || selected.length > 0);

  // Prescription
  const { getMedText } = usePediatricDose({ isPediatric, weight });
  const {
    selected, setMeds, clear: clearPrescription,
    addMedication: addMedicationPure, removeMedication, updateMedText,
  } = usePrescription();

  // Derived
  // Catálogo unificado: banco legado + Base Geral (backend, via React Query) + customizados
  const { medications: allMedications } = useMedicationsCatalog(customMedications);
  const { pathologies: userPathologies } = useCustomPathologies();
  const customPathologies: Pathology[] = useMemo(
    () => [
      ...customTemplates.map((t) => ({
        id: t.id + 1000,
        name: t.name,
        meds: t.meds.map((m) => m.id),
        isCustom: true,
      })),
      ...userPathologies,
    ],
    [customTemplates, userPathologies]
  );
  // Patologias vêm do banco clínico (base_patologias_ref / base_patologias_clinicas).
  const {
    pathologies: allPathologies,
    isLoading: pathologiesLoading,
    isError: pathologiesError,
    refetch: refetchPathologies,
  } =
    usePathologiesCatalog(customPathologies);

  // Map of which actions currently have draft content (drives indicator dots + FAB hint)
  const drafts = useMemo<Partial<Record<DocumentAction, boolean>>>(() => ({
    receita: selected.length > 0,
    atestado: !!(atestado.days || atestado.cid || atestado.reason),
    exames: exames.itens.length > 0 || !!exames.justificativa || !!exames.cid,
    encaminhamento: !!(encaminhamento.especialidade || encaminhamento.hipotese || encaminhamento.resumoClinico),
    declaracao: !!(declaracao.data || declaracao.horaInicio || declaracao.acompanhante || declaracao.finalidade),
    relatorio: !!(relatorio.conteudo || relatorio.destinatario),
    orientacoes: !!(orientacoes.diagnostico || orientacoes.cuidadosGerais || orientacoes.sinaisAlarme.length > 0 || orientacoes.retornoData || orientacoes.retornoCondicao),
    procedimento: !!(procedimento.tipo || procedimento.justificativa || procedimento.observacoes || procedimento.contexto),
    aih: hasStructuredContent(AIH_FIELDS, aih),
    apac: hasStructuredContent(APAC_FIELDS, apac),
    notificacao: hasStructuredContent(NOTIFICACAO_FIELDS, notificacao),
  }), [selected, atestado, exames, encaminhamento, declaracao, relatorio, orientacoes, procedimento, aih, apac, notificacao]);

  const draftCount = Object.values(drafts).filter(Boolean).length;

  // Validation of the active document
  const validation = useMemo(
    () => validateDocument({
      action,
      patient: { patientName, isPediatric, weight },
      selected, atestado, exames, encaminhamento, declaracao, relatorio, orientacoes, procedimento,
      aih, apac, notificacao,
    }),
    [action, patientName, isPediatric, weight, selected, atestado, exames, encaminhamento, declaracao, relatorio, orientacoes, procedimento, aih, apac, notificacao],
  );

  // Clinical safety overrides + dialog state
  const safetyOverride = useSafetyOverride();
  const [pendingJustifyAlert, setPendingJustifyAlert] = useState<ClinicalAlert | null>(null);

  // Clinical safety assessment (currently scoped to Receita; extensible per module)
  const assessment = useMemo(
    () => assessSafety(
      {
        action,
        patient: {
          patientName,
          isPediatric,
          isPregnant,
          weightKg: patient.weightKg,
          ageInYears: patient.ageInYears,
          allergiesText: patient.allergies,
          hasAllergies: patient.hasAllergies,
          renalFunction: patient.renalFunction,
          hasRenalImpairment: patient.hasRenalImpairment,
        },
        selected,
        allMedications,
      },
      safetyOverride.acknowledgedIds,
    ),
    [action, patientName, isPediatric, isPregnant, patient.weightKg, patient.ageInYears, patient.allergies, patient.hasAllergies, patient.renalFunction, patient.hasRenalImpairment, selected, allMedications, safetyOverride.acknowledgedIds],
  );

  // Add medication with toast orchestration
  const addMedication = (med: Medication) => {
    try {
      const wasPresent = selected.some((s) => s.id === med.id);
      addMedicationPure(med, { isPregnant, getMedText });
      if (!wasPresent) toast.success(`${med.name} adicionado`);
    } catch (err) {
      if (err instanceof MedicationContraindicatedError) {
        toast.error(`${err.medication.name} não é seguro para gestantes!`);
      } else { throw err; }
    }
  };

  /**
   * Adiciona medicamento manual à receita em construção.
   * Gera um id sintético negativo (evita colidir com Medication.id reais)
   * e injeta diretamente na lista de SelectedMed.
   */
  const handleAddManualMedication = (data: ManualMedicationData) => {
    const text = buildManualMedText(data);
    const tempId = -Date.now();
    setMeds([...selected, { id: tempId, name: data.name.trim(), text }]);
    toast.success(`${data.name.trim()} adicionado`);
  };


  /** Reaproveita itens de atendimentos anteriores (já revisados no painel de histórico). */
  const handleReuseItems = (items: ReuseItem[]) => {
    const stamp = Date.now();
    const newMeds = items
      .filter((it) => it.kind === "medicamento")
      .map((it, idx) => {
        const name = (it.principio_ativo ?? it.titulo).trim();
        return {
          id: -(stamp + idx),
          name,
          text: buildManualMedText({
            name,
            presentation: "",
            dose: it.dose ?? "",
            posology: [it.via, it.frequencia].filter(Boolean).join(" — "),
            duration: it.duracao ?? "",
            notes: it.observacoes ?? "",
          }),
        };
      });
    const newExams = items.filter((it) => it.kind === "exame");
    if (newMeds.length > 0) setMeds([...selected, ...newMeds]);
    if (newExams.length > 0) {
      setExames((prev) => ({
        ...prev,
        itens: [
          ...prev.itens,
          ...newExams.map((it, idx) => ({ id: `reuse-${stamp}-${idx}`, tipo: "laboratorial" as const, nome: it.titulo })),
        ],
      }));
    }
    const ignored = items.length - newMeds.length - newExams.length;
    toast.success(`${newMeds.length + newExams.length} item(ns) reaproveitado(s) — revise antes de emitir`);
    if (ignored > 0) toast.info(`${ignored} item(ns) de outros tipos não foram reaproveitados.`);
  };

  /** Aplica os itens extraídos (e revisados pelo médico) aos formulários do atendimento. */
  const handleSmartInputConfirm = (items: ExtractedItem[]) => {
    const stamp = Date.now();
    const newMeds: { id: number; name: string; text: string }[] = [];
    let applied = 0;
    const skipped: string[] = [];
    items.forEach((it, idx) => {
      switch (it.tipo) {
        case "medicamento": {
          const name = (it.principio_ativo ?? it.nome_comercial ?? it.texto_original).trim();
          newMeds.push({
            id: -(stamp + idx),
            name,
            text: buildManualMedText({
              name,
              presentation: "",
              dose: [it.dose, it.unidade].filter(Boolean).join(" "),
              posology: [it.via, it.frequencia].filter(Boolean).join(" — "),
              duration: it.duracao ?? "",
              notes: it.observacoes ?? "",
            }),
          });
          applied++;
          break;
        }
        case "exame":
          setExames((prev) => ({
            ...prev,
            itens: [...prev.itens, { id: `smart-${stamp}-${idx}`, tipo: "laboratorial", nome: it.nome }],
          }));
          applied++;
          break;
        case "orientacao":
          setOrientacoes((prev) => ({
            ...prev,
            cuidadosGerais: [prev.cuidadosGerais, it.texto].filter(Boolean).join("\n"),
            sinaisAlarme: it.sinais_alerta ? Array.from(new Set([...prev.sinaisAlarme, it.sinais_alerta])) : prev.sinaisAlarme,
            retornoCondicao: prev.retornoCondicao || it.retorno || "",
          }));
          applied++;
          break;
        case "documento":
          if (it.subtipo === "atestado") {
            setAtestado((a) => ({ ...a, days: it.duracao_dias ? String(it.duracao_dias) : a.days, reason: a.reason || it.conteudo }));
          } else if (it.subtipo === "encaminhamento") {
            setEncaminhamento((e) => ({ ...e, resumoClinico: [e.resumoClinico, it.conteudo].filter(Boolean).join("\n") }));
          } else if (it.subtipo === "declaracao") {
            setDeclaracao((d) => ({ ...d, finalidade: d.finalidade || it.conteudo }));
          } else if (it.subtipo === "solicitacao") {
            setProcedimento((p) => ({ ...p, justificativa: [p.justificativa, it.conteudo].filter(Boolean).join("\n") }));
          } else {
            setRelatorio((r) => ({ ...r, conteudo: [r.conteudo, it.conteudo].filter(Boolean).join("\n") }));
          }
          applied++;
          break;
        default:
          skipped.push(it.texto_original);
      }
    });
    if (newMeds.length > 0) setMeds([...selected, ...newMeds]);
    if (applied > 0) toast.success(`${applied} ${applied === 1 ? "item aplicado" : "itens aplicados"} — revise antes de emitir`);
    if (skipped.length > 0) toast.info(`${skipped.length} item(ns) sem destino no atendimento foram ignorados.`);
  };

  const loadPathologyMeds = (pathology: Pathology) => {
    const meds = pathology.meds
      .map((id) => allMedications.find((m) => m.id === id))
      .filter(Boolean) as Medication[];
    const unsafeMeds = isPregnant ? meds.filter((m) => !isMedicationSafeForPregnancy(m)) : [];
    const safeMeds = isPregnant ? meds.filter((m) => isMedicationSafeForPregnancy(m)) : meds;
    // Patologias personalizadas guardam medicamentos como texto livre em `hospitalMeds`.
    const customLines =
      pathology.isCustom && meds.length === 0 ? pathology.hospitalMeds ?? [] : [];
    const customItems = customLines.map((text, idx) => ({
      id: -(Date.now() + idx),
      name: text.split("—")[0].trim() || text,
      text,
    }));
    setMeds([
      ...safeMeds.map((med) => ({ id: med.id, name: med.name, text: getMedText(med) })),
      ...customItems,
    ]);
    if (unsafeMeds.length > 0) {
      toast.warning(`${unsafeMeds.map((m) => m.name).join(", ")} removidos (contraindicados na gestação)`);
    } else {
      toast.success(`Receita "${pathology.name}" carregada`);
    }
    if (pathology.cid) {
      setAtestado((a) => ({ ...a, cid: pathology.cid || "", reason: pathology.name }));
    }

    // --- Automação por patologia: combo de exames + sinais de alarme ---
    const combo = getPathologyCombo({
      name: pathology.name,
      synonyms: (pathology as { synonyms?: string[] }).synonyms,
      category: (pathology as { category?: string }).category,
    });

    const stamp = Date.now();
    const addedExamIds: string[] = [];

    setExames((prev) => {
      const existing = new Set(prev.itens.map((i) => i.nome.toLowerCase()));
      const novos = [
        ...combo.labs.map((nome) => ({ tipo: "laboratorial" as const, nome })),
        ...combo.imaging.map((nome) => ({ tipo: "imagem" as const, nome })),
      ]
        .filter((i) => !existing.has(i.nome.toLowerCase()))
        .map((i, idx) => {
          const id = `auto-${stamp}-${idx}`;
          addedExamIds.push(id);
          return { id, ...i };
        });
      return {
        ...prev,
        itens: [...prev.itens, ...novos],
        cid: prev.cid || pathology.cid || "",
        justificativa: prev.justificativa || pathology.name,
      };
    });

    const addedRedFlags = combo.redFlags.filter((f) => !orientacoes.sinaisAlarme.includes(f));

    setOrientacoes((prev) => ({
      ...prev,
      diagnostico: prev.diagnostico || pathology.name,
      sinaisAlarme: Array.from(new Set([...prev.sinaisAlarme, ...combo.redFlags])),
    }));

    if (addedExamIds.length > 0 || addedRedFlags.length > 0) {
      setAppliedCombo({
        pathologyName: pathology.name,
        examIds: addedExamIds,
        examCount: addedExamIds.length,
        redFlags: addedRedFlags,
      });
    } else {
      setAppliedCombo(null);
    }
  };

  /** Desfaz a automação aplicada ao carregar a patologia (exames + sinais de alarme). */
  /** Patologias do ambiente ativo (Bloco C só mostra o que faz sentido ali). */
  const environmentPathologies = useMemo(() => {
    const byName = new Map<string, Pathology>();
    for (const pathology of allPathologies) {
      if (!(pathology.environments ?? []).includes(environment)) continue;
      const key = pathology.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
      if (!byName.has(key)) byName.set(key, pathology);
    }
    return [...byName.values()];
  }, [allPathologies, environment]);

  /**
   * Leva a condição escolhida no passo 1 para todos os documentos, evitando
   * que o médico precise digitar/escolher a mesma coisa de novo.
   */
  const prefillDocuments = (nome: string, cid?: string | null) => {
    setAtestado((a) => ({ ...a, cid: a.cid || cid || "", reason: a.reason || nome }));
    setExames((prev) => ({
      ...prev,
      cid: prev.cid || cid || "",
      justificativa: prev.justificativa || nome,
    }));
    setEncaminhamento((prev) => ({
      ...prev,
      hipotese: prev.hipotese || nome,
      cid: prev.cid || cid || "",
    }));
    setRelatorio((prev) => ({ ...prev, cid: prev.cid || cid || "" }));
    setOrientacoes((prev) => ({ ...prev, diagnostico: prev.diagnostico || nome }));
    setProcedimento((prev) => ({ ...prev, justificativa: prev.justificativa || nome }));
  };

  /** Passo 1 → escolhe a patologia e libera o restante do atendimento. */
  const handleSelectPathology = (pathology: Pathology) => {
    setActivePathology(pathology);
    setActiveSyndrome(null);
    setGatePassed(true);
    pathologyMemory.pushRecent(pathology.id);
    pathologyMemory.registerUse(pathologyKey(pathology.name));
    prefillDocuments(pathology.name, pathology.cid);
  };

  /** Camada 2 — entra no atendimento por síndrome (sem diagnóstico fechado). */
  const handleSelectSyndrome = (s: Syndrome) => {
    setActiveSyndrome(s);
    setActivePathology(null);
    setGatePassed(true);
    prefillDocuments(s.nome, s.cid);
    toast.success(`Síndrome "${s.nome}" carregada`);
  };

  /** Segue o atendimento sem patologia definida (documento em branco). */
  const handleSkipPathology = () => {
    setActivePathology(null);
    setActiveSyndrome(null);
    setGatePassed(true);
  };

  /** Etapa 3 — conteúdo correlacionado à patologia (vazio no fluxo em branco). */
  const knowledge = useMemo(
    () =>
      activePathology
        ? getPathologyKnowledge({
            name: activePathology.name,
            synonyms: activePathology.synonyms,
            category: activePathology.category,
          })
        : activeSyndrome
        ? getPathologyKnowledge({ name: activeSyndrome.nome, synonyms: activeSyndrome.sinonimos })
        : null,
    [activePathology, activeSyndrome],
  );

  const activeProfiles = useMemo(
    () =>
      deriveProfiles({
        isPediatric,
        isPregnant,
        ageInYears: patient.ageInYears,
        hasRenalImpairment: patient.hasRenalImpairment,
      }),
    [isPediatric, isPregnant, patient.ageInYears, patient.hasRenalImpairment],
  );

  const highSeverity = useMemo(
    () =>
      (!!activePathology || !!activeSyndrome) &&
      isHighSeverity(
        environment,
        (activePathology?.severity ?? activeSyndrome?.gravidade) as never,
        activePathology?.isEmergency,
      ),
    [activePathology, activeSyndrome, environment],
  );




  /** Troca o ambiente clínico e alinha o contexto de prescrição. */
  const handleEnvironmentChange = (env: ClinicalEnvironment) => {
    setEnvironment(env);
    setContext(env === "emergencia" ? "hospitalar" : "urgencia");
  };

  const undoAppliedCombo = () => {
    if (!appliedCombo) return;
    const { examIds, redFlags } = appliedCombo;
    setExames((prev) => ({ ...prev, itens: prev.itens.filter((i) => !examIds.includes(i.id)) }));
    setOrientacoes((prev) => ({
      ...prev,
      sinaisAlarme: prev.sinaisAlarme.filter((f) => !redFlags.includes(f)),
    }));
    setAppliedCombo(null);
    toast.success("Automação desfeita");
  };

  /** Captura o estado atual completo da emissão, para reabrir/reimprimir mais tarde. */
  const buildSnapshot = (
    extra: Partial<NewEmissionRecord> = {},
  ): NewEmissionRecord => ({
    action,
    documentTitle: DOC_TITLES[action],
    patientName,
    isPediatric,
    isPregnant,
    ageValue,
    ageUnit,
    weight,
    context,
    selected,
    atestado,
    exames,
    encaminhamento,
    declaracao,
    relatorio,
    orientacoes,
    procedimento,
    aih,
    apac,
    notificacao,
    clinicInfo: resolvedClinicInfo,
    signatureConfig: resolvedSignatureConfig,
    ...extra,
  });

  /**
   * Abre o diálogo de impressão do navegador.
   *
   * Recebe um `pdfBlob` opcional quando chamamos de handleEmit (fluxo fail-closed):
   * nesse caso o PDF já foi gerado, enviado para o bucket e persistido no banco
   * ANTES de chegarmos aqui — setar printOpen=true apenas revela o PrintArea
   * no DOM (ele já existe no React quando a flag sobe), então o setTimeout
   * garante que o CSS da impressora renderizou antes do window.print().
   * Se não vier blob, volta para o fluxo legado: só abre a impressora e a
   * geração do PDF ficará a cargo do PrintArea handler "Salvar PDF" (que é
   * o mesmo de sempre e também passa por bucket).
   */
  const handlePrint = (_opts?: { pdfBlob?: Blob }) => {
    setPrintOpen(true);
    setTimeout(() => window.print(), 300);
  };

  /* ============================================================
   * Camada regulatória — agrupamento por tipo de receituário
   * ============================================================ */
  const regulatoryResult = useMemo(
    () => buildRegulatoryGroups(selected, allMedications),
    [selected, allMedications],
  );

  /** Registra a receita emitida para revisão na tela de Prescrições. Falha visível, sem bloquear a emissão. */
  const recordPrescription = (group: RegulatoryGroup) => {
    savePrescriptionRecord({
      patientName,
      environment,
      conditionName: activePathology?.name ?? activeSyndrome?.nome ?? null,
      conditionType: activePathology ? "patologia" : activeSyndrome ? "sindrome" : null,
      cid: activePathology?.cid ?? activeSyndrome?.cid ?? null,
      regulatoryLabel: group.rules.label,
      items: group.items.map((it) => ({ nome: it.selected.name, posologia: it.selected.text })),
    }).catch((err) => {
      console.error("Falha ao registrar receita em prescricoes_historico", err);
      toast.error("A receita não foi registrada no histórico de prescrições.");
    });
  };

  /**
   * Registra o documento em documentos_gerados (+ log + auditoria).
   * Retorna o id, ou null após avisar o usuário: nesse caso o documento NÃO deve sair.
   */
  const persistOrWarn = async (
    snapshot: NewEmissionRecord,
    acao: "imprimiu" | "gerou_pdf",
    family?: ReceiptFamily | null,
  ): Promise<string | null> => {
    try {
      const documentoId = await persistEmission({ snapshot, family, acao });
      setPrintedDocumentoId(documentoId);
      return documentoId;
    } catch (err) {
      console.error("Falha ao registrar documento emitido", err);
      toast.error("Documento não registrado — emissão cancelada", {
        description: "Verifique a conexão e tente novamente. Nenhum documento é emitido sem registro.",
      });
      return null;
    }
  };

  /** Anexa ao documento registrado o PDF gerado pelo botão "Salvar PDF" do modal de impressão. */
  const handlePrintAreaPdf = async (pdf: Blob): Promise<void> => {
    const documentoId = replayRecord ? replayRecord.documentoId : printedDocumentoId;
    if (!documentoId) return;
    try {
      await attachDocumentPdf(documentoId, pdf);
    } catch (err) {
      console.error("Falha ao anexar PDF ao documento", err);
      toast.warning("PDF salvo, mas não foi anexado ao link público do documento.");
    }
  };

  const groupSnapshot = (group: RegulatoryGroup) =>
    buildSnapshot({
      regulatoryLabel: group.rules.label,
      selectedFilter: group.items.map((it) => it.selected.id),
    });

  /**
   * Helper FAIL-CLOSED para grupos regulatórios (Receitas).
   *
   * Sequência obrigatória (qualquer throw aborta a entrega):
   *   1) persistEmission → documentos_gerados + auditoria
   *   2) savePrescriptionRecord → prescricoes_historico
   *   3) html2pdf → Blob binário do nó do PrintArea filtrado
   *   4) attachDocumentPdf → Storage `documentos-pdf`
   *   5) emissionHistory.add → cache do navegador
   */
  const runGroupEmissionFailClosed = async (
    group: RegulatoryGroup,
    acao: "imprimiu" | "gerou_pdf",
  ) => {
    const snapshot = groupSnapshot(group);
    setActiveGroup(group);
    setPrintOpen(true);
    // Aguarda render do PrintArea com o grupo aplicado (filtro selecionado)
    await new Promise((r) => setTimeout(r, 350));
    const node = document.querySelector(".prescription-print-area") as HTMLElement | null;
    if (!node) {
      setPrintOpen(false);
      setActiveGroup(null);
      toast.error("Não foi possível preparar o documento");
      return null;
    }
    const isLandscape = group.family === "controle-especial" || group.family === "antimicrobiano";
    const filename = `Receita_${group.rules.label.replace(/\s+/g, "_")}${group.subTotal && group.subTotal > 1 ? `_${group.subIndex}de${group.subTotal}` : ""}_${(patientName || "paciente").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;

    let historicoJaRodou = false;
    const runWorkflow = await runEmissionFailClosed({
      snapshot,
      acao,
      family: group.family,
      persistDocumento: async (p) => {
        const id = await persistEmission(p);
        setPrintedDocumentoId(id);
        return id;
      },
      persistHistorico: async () => {
        await savePrescriptionRecord({
          patientName,
          environment,
          careContext: context,
          conditionName: activePathology?.name ?? activeSyndrome?.nome ?? null,
          conditionType: activePathology ? "patologia" : activeSyndrome ? "sindrome" : null,
          cid: activePathology?.cid ?? activeSyndrome?.cid ?? null,
          regulatoryLabel: group.rules.label,
          items: (snapshot.selectedFilter
            ? snapshot.selected.filter((m) => snapshot.selectedFilter!.includes(m.id))
            : snapshot.selected
          ).map((m) => ({ nome: m.name, posologia: m.text || "" })),
        });
        historicoJaRodou = true;
      },
      generatePdf: async () => {
        const html2pdf = (await import("html2pdf.js")).default;
        return html2pdf()
          .set(buildPdfOptions(filename, isLandscape))
          .from(node)
          .outputPdf("blob") as Promise<Blob>;
      },
      uploadPdfBucket: attachDocumentPdf,
      saveLocalHistory: (documentoId) => {
        emissionHistory.add({ ...snapshot, documentoId });
      },
    });

    if (!runWorkflow.allowDelivery) {
      setPrintOpen(false);
      setActiveGroup(null);
      const detail = runWorkflow.error
        ? `Motivo: ${runWorkflow.error}`
        : "Verifique a conexão e tente novamente.";
      toast.error("Emissão clínica bloqueada", {
        description: `${detail} Nenhum documento foi entregue sem registro.`,
      });
      return {
        allowDelivery: false as const,
        historicoJaRodou,
      };
    }
    return {
      allowDelivery: true as const,
      documentoId: runWorkflow.documentoId!,
      pdfBlob: runWorkflow.pdfBlob!,
      filename,
      historicoJaRodou,
    };
  };

  /** Imprime apenas um grupo regulatório (filtra SelectedMeds). */
  const handlePrintGroup = async (group: RegulatoryGroup): Promise<void> => {
    if (blockIfReviewPending()) return;
    const result = await runGroupEmissionFailClosed(group, "imprimiu");
    if (!result?.allowDelivery) return;
    // IMPORTANTE: savePrescriptionRecord já rodou DENTRO do workflow fail-closed.
    // Chamar recordPrescription() aqui duplicaria a linha em `prescricoes_historico`.
    window.setTimeout(() => {
      try { window.print(); } finally {
        window.setTimeout(() => {
          setPrintOpen(false);
          setActiveGroup(null);
        }, 400);
      }
    }, 250);
  };

  /** Gera PDF apenas do grupo selecionado, usando html2pdf no nó .prescription-print-area. */
  const handleDownloadGroup = async (group: RegulatoryGroup): Promise<void> => {
    if (blockIfReviewPending()) return;
    const result = await runGroupEmissionFailClosed(group, "gerou_pdf");
    if (!result?.allowDelivery) return;
    // savePrescriptionRecord já executou no workflow (fail-closed). Duplicar aqui quebraria auditoria.
    try {
      downloadBlob(result.pdfBlob, result.filename);
      toast.success(`PDF "${group.rules.label}" salvo e registrado`);
    } catch (err) {
      console.error(err);
      toast.error("Falha ao baixar PDF");
    } finally {
      setPrintOpen(false);
      setActiveGroup(null);
    }
  };

  const handleClear = () => {
    if (action === "receita") {
      clearPrescription();
      toast.success("Receita limpa");
    } else if (action === "atestado") {
      setAtestado(EMPTY_ATESTADO);
      toast.success("Atestado limpo");
    } else if (action === "exames") {
      setExames(EMPTY_EXAMES);
      toast.success("Solicitação limpa");
    } else if (action === "encaminhamento") {
      setEncaminhamento(EMPTY_ENCAMINHAMENTO);
      toast.success("Encaminhamento limpo");
    } else if (action === "declaracao") {
      setDeclaracao(EMPTY_DECLARACAO);
      toast.success("Declaração limpa");
    } else if (action === "relatorio") {
      setRelatorio(EMPTY_RELATORIO);
      toast.success("Relatório limpo");
    } else if (action === "orientacoes") {
      setOrientacoes(EMPTY_ORIENTACOES);
      toast.success("Orientações limpas");
    } else if (action === "procedimento") {
      setProcedimento(EMPTY_PROCEDIMENTO);
      toast.success("Solicitação limpa");
    } else if (action === "aih") {
      setAih(EMPTY_AIH);
      toast.success("Laudo de internação limpo");
    } else if (action === "apac") {
      setApac(EMPTY_APAC);
      toast.success("Laudo APAC limpo");
    } else if (action === "notificacao") {
      setNotificacao(EMPTY_NOTIFICACAO);
      toast.success("Notificação limpa");
    }
    safetyOverride.clearAll();
  };

  /**
   * Helper FAIL-CLOSED para impressão geral (não é grupo regulatório isolado).
   * Roda: persistEmission → (receita:) savePrescriptionRecord × cada grupo →
   *       html2pdf da página inteira → attachDocumentPdf da primeira receita.
   * Se qualquer etapa throw, o documento NÃO sai da impressora e NÃO baixa.
   */
  const runWholePrintWorkflowFailClosed = async (): Promise<
    | { allowDelivery: true; idsByGroup: Map<string, string>; lastDocumentoId: string; pdfBlob: Blob }
    | { allowDelivery: false }
  > => {
    // Prepara PrintArea com todos os documentos
    setActiveGroup(null);
    setReplayRecord(null);
    setPrintOpen(true);
    await new Promise((r) => setTimeout(r, 400));
    const node = document.querySelector(".prescription-print-area") as HTMLElement | null;
    if (!node) {
      setPrintOpen(false);
      toast.error("Não foi possível preparar o documento");
      return { allowDelivery: false };
    }
    const filename = `${DOC_TITLES[action].replace(/\s+/g, "_")}_${(patientName || "paciente").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
    const isLandscape =
      action === "receita" &&
      regulatoryResult.groups.some((g) => g.family === "controle-especial" || g.family === "antimicrobiano");

    let lastDocumentoId: string | null = null;
    const idsByGroup = new Map<string, string>();

    // --- PASSO 1: persistEmission para TODOS os grupos receita (ou 1 snapshot para outros docs)
    const persistAll = async (): Promise<void> => {
      if (action === "receita" && regulatoryResult.groups.length > 0) {
        for (const group of regulatoryResult.groups) {
          const snapshot = groupSnapshot(group);
          const id = await persistEmission({ snapshot, family: group.family, acao: "imprimiu" });
          idsByGroup.set(group.rules.label, id);
          lastDocumentoId = id;
          setPrintedDocumentoId(id);
        }
        return;
      }
      const snapshot = buildSnapshot();
      const id = await persistEmission({ snapshot, acao: "imprimiu" });
      lastDocumentoId = id;
      setPrintedDocumentoId(id);
    };

    // --- PASSO 2: savePrescriptionRecord para TODAS as receitas (pula outros docs)
    const persistHistory = async (): Promise<void> => {
      if (action !== "receita") return;
      for (const group of regulatoryResult.groups) {
        const items = (group.items ?? []).map((it) => ({
          nome: it.selected.name,
          posologia: it.selected.text || "",
        }));
        if (items.length === 0) continue;
        await savePrescriptionRecord({
          patientName,
          environment,
          careContext: context,
          conditionName: activePathology?.name ?? activeSyndrome?.nome ?? null,
          conditionType: activePathology ? "patologia" : activeSyndrome ? "sindrome" : null,
          cid: activePathology?.cid ?? activeSyndrome?.cid ?? null,
          regulatoryLabel: group.rules.label,
          items,
        });
      }
    };

    // --- PASSO 3: Blob PDF
    const generatePdf = async (): Promise<Blob> => {
      const html2pdf = (await import("html2pdf.js")).default;
      return html2pdf()
        .set(buildPdfOptions(filename, isLandscape))
        .from(node)
        .outputPdf("blob") as Promise<Blob>;
    };

    // --- PASSO 4: upload para bucket (1 documento = 1 upload. Multi-grupo, attach no primeiro grupo)
    const upload = async (id: string, blob: Blob) => attachDocumentPdf(id, blob);

    // --- PASSO 5: emissionHistory.add (só se tudo passar)
    const saveLocal = () => {
      if (action === "receita" && regulatoryResult.groups.length > 0) {
        for (const group of regulatoryResult.groups) {
          const snapshot = groupSnapshot(group);
          const id = idsByGroup.get(group.rules.label);
          if (id) emissionHistory.add({ ...snapshot, documentoId: id });
        }
        return;
      }
      if (lastDocumentoId) emissionHistory.add({ ...buildSnapshot(), documentoId: lastDocumentoId });
    };

    try {
      await persistAll();
      await persistHistory();
      const pdfBlob = await generatePdf();
      if (!lastDocumentoId) throw new Error("sem documento após persistência — abortado");
      await upload(lastDocumentoId, pdfBlob);
      saveLocal();
      return { allowDelivery: true as const, idsByGroup, lastDocumentoId, pdfBlob };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err ?? "erro desconhecido");
      setPrintOpen(false);
      setActiveGroup(null);
      setReplayRecord(null);
      toast.error("Emissão clínica bloqueada", {
        description: `Motivo: ${detail}. Nenhum documento foi entregue sem registro.`,
      });
      return { allowDelivery: false as const };
    }
  };

  // Print with validation + clinical safety gate
  const handleEmit = async (): Promise<void> => {
    // Camada 0: revisão final concluída (documentos_settings), quando exigida.
    if (blockIfReviewPending()) return;
    // Camada 1: validação estrutural
    if (!validation.canEmit) {
      toast.error("Não é possível emitir", {
        description: `Faltam: ${validation.blockers.join(", ")}`,
      });
      return;
    }
    // Camada 2: segurança clínica
    if (assessment.status === "blocked") {
      const pHash = hashPatient(patientName);
      assessment.pendingCritical.forEach((a) => {
        safetyLog.push({
          type: "emission-blocked",
          action,
          alertId: a.id,
          alertCategory: a.category,
          severity: a.severity,
          patientHash: pHash,
        });
      });
      toast.error("Emissão bloqueada por alerta clínico", {
        description: assessment.pendingCritical[0]?.title ?? "Resolva os alertas críticos para emitir.",
      });
      return;
    }
    // Liberado — registra
    safetyLog.push({
      type: "emission-allowed",
      action,
      patientHash: hashPatient(patientName),
    });

    // FAIL-CLOSED: todas as etapas de persistência + bucket rodam ANTES do handlePrint.
    // Se qualquer etapa throw, o workflow retorna allowDelivery=false e o médico NÃO vê a impressora.
    const workflow = await runWholePrintWorkflowFailClosed();
    if (!workflow.allowDelivery) return;

    // savePrescriptionRecord (prescricoes_historico) já executou DENTRO do workflow.
    // Não chamar recordPrescription() aqui para não duplicar linhas.
    handlePrint({ pdfBlob: workflow.pdfBlob });
  };

  /* ============================================================
   * Replay de histórico — reabrir, reimprimir ou baixar PDF
   * de uma emissão anterior, sem alterar o estado atual.
   * ============================================================ */
  const handleHistoryView = (record: EmissionRecord) => {
    setReplayRecord(record);
    setActiveGroup(null);
    setPrintOpen(true);
    setHistoryOpen(false);
  };

  const logReplay = (record: EmissionRecord, acao: "imprimiu" | "baixou") => {
    if (!record.documentoId) return;
    logDocumentAction({
      id_documento: record.documentoId,
      tipo_documento: resolveDocumentoTipo(record.action, null),
      acao,
    }).catch((err) => {
      console.error("Falha ao registrar reabertura do documento", err);
      toast.error("A ação não foi registrada no log de documentos.");
    });
  };

  const handleHistoryPrint = (record: EmissionRecord) => {
    logReplay(record, "imprimiu");
    setReplayRecord(record);
    setActiveGroup(null);
    setPrintOpen(true);
    setHistoryOpen(false);
    setTimeout(() => window.print(), 350);
  };

  const handleHistoryDownload = async (record: EmissionRecord) => {
    setReplayRecord(record);
    setActiveGroup(null);
    setPrintOpen(true);
    setHistoryOpen(false);
    await new Promise((r) => setTimeout(r, 400));
    const node = document.querySelector(".prescription-print-area") as HTMLElement | null;
    if (!node) {
      toast.error("Não foi possível preparar o documento");
      return;
    }
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const isLandscape = !!record.regulatoryLabel;
      const baseTitle = record.regulatoryLabel
        ? `Receita_${record.regulatoryLabel.replace(/\s+/g, "_")}`
        : record.documentTitle.replace(/\s+/g, "_");
      const filename = `${baseTitle}_${(record.patientName || "paciente").replace(/\s+/g, "_")}_${record.emittedAt.slice(0, 10)}.pdf`;
      const pdf: Blob = await html2pdf()
        .set(buildPdfOptions(filename, isLandscape))
        .from(node)
        .outputPdf("blob");
      downloadBlob(pdf, filename);
      logReplay(record, "baixou");
      if (record.documentoId) {
        try {
          await attachDocumentPdf(record.documentoId, pdf);
          toast.success("PDF salvo e vinculado ao documento");
        } catch (err) {
          console.error("Falha ao anexar PDF ao documento", err);
          toast.warning("PDF salvo, mas não foi anexado ao link público do documento.");
        }
      } else {
        toast.success("PDF salvo");
      }
    } catch (err) {
      console.error(err);
      toast.error("Falha ao gerar PDF");
    } finally {
      setPrintOpen(false);
      setReplayRecord(null);
    }
  };

  // Safety override handlers
  const handleAcknowledge = (alertId: string) => {
    const a = assessment.alerts.find((x) => x.id === alertId);
    safetyOverride.acknowledge(alertId);
    if (a) {
      safetyLog.push({
        type: "alert-overridden",
        action,
        alertId: a.id,
        alertCategory: a.category,
        severity: a.severity,
        patientHash: hashPatient(patientName),
      });
    }
  };

  const handleConfirmJustify = (justification: string) => {
    if (!pendingJustifyAlert) return;
    const a = pendingJustifyAlert;
    safetyOverride.justify(a.id, justification);
    safetyLog.push({
      type: "alert-overridden",
      action,
      alertId: a.id,
      alertCategory: a.category,
      severity: a.severity,
      justification,
      patientHash: hashPatient(patientName),
    });
    setPendingJustifyAlert(null);
  };

  // Render the editor for the active action
  const renderEditor = () => {
    if (action === "receita") {
      return (
        <div className="space-y-3">
        {appliedCombo && (
          <div className="rounded-lg border border-canon-blue/30 bg-canon-blue/5 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink">
                  Automação aplicada · {appliedCombo.pathologyName}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">
                  {appliedCombo.examCount} exame(s) adicionados · {appliedCombo.redFlags.length} sinal(is) de alarme
                </p>
              </div>
              <button
                onClick={undoAppliedCombo}
                className="shrink-0 rounded-md border border-canon-blue/40 px-2.5 py-1 text-[10px] font-semibold text-canon-blue hover:bg-canon-blue/10"
              >
                Desfazer
              </button>
            </div>
          </div>
        )}
        <PathologyLibrary
          pathologies={environmentPathologies}
          isLoading={pathologiesLoading}
          allMedications={allMedications}
          selected={selected}
          patient={{
            isPediatric,
            isPregnant,
            weightKg: patient.weightKg,
            ageInYears: patient.ageInYears,
            hasAllergies: patient.hasAllergies,
            hasRenalImpairment: patient.hasRenalImpairment,
            allergiesText: patient.allergies,
          }}
          onAddMedication={addMedication}
          onAddSuggestion={(suggestion, source) => {
            // Sugestão estruturada já vem com posologia editada — injeta direto.
            const text = [
              [suggestion.medicationName, suggestion.presentation].filter(Boolean).join(" — "),
              suggestion.posologyText,
            ].filter(Boolean).join("\n");
            const wasPresent = selected.some((s) => s.id === source.id);
            if (wasPresent) return;
            setMeds([...selected, { id: source.id, name: source.name, text }]);
            toast.success(`${suggestion.medicationName} adicionado`);
          }}
          context={context}
          environment={environment}
          onAddHospitalMedText={(text) => {
            // Itens de hospitalMeds são strings prontas (EV/IM). Injetamos como
            // SelectedMed com id sintético negativo, mesmo padrão do manual.
            if (selected.some((s) => s.text === text)) return;
            const tempId = -Date.now() - Math.floor(Math.random() * 1000);
            const name = text.split(/[—-]/)[0].trim() || text;
            setMeds([...selected, { id: tempId, name, text }]);
            toast.success(`${name} adicionado`);
          }}
          onLoadPathology={loadPathologyMeds}
          onOpenManual={() => setManualOpen(true)}
          focusPathologyId={activePathology?.id ?? null}
          focusLabel={activePathology?.name ?? activeSyndrome?.nome ?? null}
        />
        </div>
      );
    }
    if (action === "atestado") {
      return <AtestadoForm data={atestado} onChange={setAtestado} />;
    }
    if (action === "exames") {
      return <ExamesForm data={exames} onChange={setExames} />;
    }
    if (action === "encaminhamento") {
      return (
        <EncaminhamentoForm
          data={encaminhamento}
          onChange={setEncaminhamento}
          pathologyName={activePathology?.name ?? activeSyndrome?.nome ?? ""}
          category={activePathology?.category}
          onCidsSelected={(principal, associados) => {
            const todos = [principal, ...associados].filter(Boolean);
            if (!todos.length) return;
            if (principal) {
              setExames((e) => ({ ...e, cid: e.cid || principal }));
              setAtestado((a) => ({ ...a, cid: a.cid || principal }));
              setAih((prev) => ({ ...prev, cid: (prev.cid as string) || principal, cidSecundario: (prev.cidSecundario as string) || (associados[0] ?? "") }));
              setApac((prev) => ({ ...prev, cid: (prev.cid as string) || principal }));
              setNotificacao((prev) => ({ ...prev, cid: (prev.cid as string) || principal }));
            }
            toast.success(`CIDs aplicados: ${todos.join(", ")}`);
          }}
        />
      );
    }
    if (action === "declaracao") {
      return <DeclaracaoForm data={declaracao} onChange={setDeclaracao} />;
    }
    if (action === "relatorio") {
      return <RelatorioForm data={relatorio} onChange={setRelatorio} />;
    }
    if (action === "orientacoes") {
      return <OrientacoesForm data={orientacoes} onChange={setOrientacoes} />;
    }
    if (action === "procedimento") {
      return <ProcedimentoForm data={procedimento} onChange={setProcedimento} />;
    }
    if (action === "aih") {
      return (
        <StructuredDocumentForm
          title="Laudo para internação (AIH)"
          subtitle="Justificativa clínica da solicitação de internação hospitalar."
          icon={BedDouble}
          notice="Documento de solicitação. A autorização final é do gestor/autorizador do SUS."
          fields={AIH_FIELDS}
          data={aih}
          onChange={setAih}
        />
      );
    }
    if (action === "apac") {
      return (
        <StructuredDocumentForm
          title="Laudo APAC"
          subtitle="Procedimento ambulatorial de alta complexidade ou custo."
          icon={FileSpreadsheet}
          notice="Confira a competência e a quantidade solicitada antes de emitir."
          fields={APAC_FIELDS}
          data={apac}
          onChange={setApac}
        />
      );
    }
    if (action === "notificacao") {
      return (
        <StructuredDocumentForm
          title="Notificação compulsória"
          subtitle="Comunicação de agravo à vigilância epidemiológica."
          icon={Siren}
          notice="Agravos de notificação imediata devem ser comunicados à vigilância em até 24 horas."
          fields={NOTIFICACAO_FIELDS}
          data={notificacao}
          onChange={setNotificacao}
        />
      );
    }
    return <ComingSoonModule action={action} />;
  };

  const previewProps = {
    patientName,
    isPediatric,
    isPregnant,
    ageValue,
    ageUnit,
    weight,
    context,
    action,
    selected,
    allMedications,
    onUpdateMedText: updateMedText,
    onRemoveMed: removeMedication,
    atestado,
    exames,
    encaminhamento,
    declaracao,
    relatorio,
    orientacoes,
    aih,
    apac,
    notificacao,
    // Resolvido com o perfil de assinatura escolhido: o que aparece na prévia é o que sai no PrintArea.
    clinicInfo: resolvedClinicInfo,
    // handleEmit, não handlePrint: o botão do preview lateral (fora da ReviewScreen) tinha o
    // mesmo peso de "emitir" sem passar por validação/segurança/persistEmission/gate de revisão.
    onPrint: handleEmit,
    onClear: handleClear,
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <ContextHeader
        context={context}
        onContextChange={setContext}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        historyCount={emissionHistory.history.length}
      />

      <main
        className={cnDash(
          "mx-auto grid max-w-7xl gap-5 px-4 pb-28 pt-5 sm:px-6 lg:gap-6 lg:pb-5 print:hidden",
          gatePassed ? "lg:grid-cols-[1.05fr_0.95fr]" : "max-w-3xl",
        )}
      >
        {!gatePassed ? (
          <section className="space-y-5">
            <PathologyGate
              pathologies={environmentPathologies}
              isLoading={pathologiesLoading}
              isError={pathologiesError}
              onRetry={() => void refetchPathologies()}
              environment={environment}
              onEnvironmentChange={handleEnvironmentChange}
              onSelect={handleSelectPathology}
              onSkip={handleSkipPathology}
              syndromes={syndromes}
              syndromesLoading={syndromesLoading}
              onSelectSyndrome={handleSelectSyndrome}
              syndromePathologies={syndromePathologies}
            />
          </section>
        ) : (

          <>
            {/* Editor column */}
            <section className="space-y-5">
              {/* Faixa da patologia escolhida — CID só aparece aqui, depois da escolha. */}
              <div className="flex items-center gap-3 rounded-lg border border-ink-soft bg-card px-4 py-3 shadow-paper">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
                    {ENVIRONMENTS.find((e) => e.id === environment)?.label}
                    {activeSyndrome ? " · Síndrome" : ""}
                  </div>
                  <div className="truncate font-serif text-base font-semibold text-ink">
                    {activePathology?.name ?? activeSyndrome?.nome ?? "Sem patologia definida"}
                  </div>
                  {(activePathology?.cid ?? activeSyndrome?.cid) && (
                    <div className="text-[11px] text-ink-muted">
                      CID {activePathology?.cid ?? activeSyndrome?.cid}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => setDocChosen(false)}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Trocar
                </Button>
              </div>

              {knowledge && (
                <PathologyCorrelationPanel
                  knowledge={knowledge}
                  profiles={activeProfiles}
                  highSeverity={highSeverity}
                  environment={environment}
                  severity={activePathology?.severity ?? activeSyndrome?.gravidade ?? null}
                  onAddExam={(nome) => {
                    if (exames.itens.some((i) => i.nome.toLowerCase() === nome.toLowerCase())) return;
                    setExames({
                      ...exames,
                      itens: [...exames.itens, { id: `corr_${Date.now()}`, tipo: "laboratorial", nome }],
                    });
                    toast.success(`${nome} adicionado aos exames`);
                  }}
                  onUseEncaminhamento={(especialidade) => {
                    setEncaminhamento((prev) => ({
                      ...prev,
                      especialidade,
                      hipotese: prev.hipotese || activePathology?.name || activeSyndrome?.nome || "",
                      cid: prev.cid || activePathology?.cid || activeSyndrome?.cid || "",
                    }));
                    toast.success(`Encaminhamento para ${especialidade}`);
                  }}
                />
              )}

              <ClinicalSupportPanel
                sindrome={
                  activeSyndrome ? (
                    <SyndromePanel
                      syndrome={activeSyndrome}
                      isPediatric={isPediatric}
                      isPregnant={isPregnant}
                      isHospital={context === "hospitalar"}
                      onAddMedication={(nome, texto) => {
                        setMeds([...selected, { id: -Date.now(), name: nome, text: `${nome}\n${texto}` }]);
                        toast.success(`${nome} adicionado`);
                      }}
                      onAddExam={(nome) => {
                        setExames((prev) =>
                          prev.itens.some((i) => i.nome.toLowerCase() === nome.toLowerCase())
                            ? prev
                            : {
                                ...prev,
                                itens: [
                                  ...prev.itens,
                                  { id: `sind-${Date.now()}-${prev.itens.length}`, tipo: "laboratorial" as const, nome },
                                ],
                              },
                        );
                        toast.success(`${nome} adicionado aos exames`);
                      }}
                      onAddOrientacoes={(linhas) => {
                        setOrientacoes((prev) => ({
                          ...prev,
                          cuidadosGerais: [prev.cuidadosGerais, ...linhas].filter(Boolean).join("\n"),
                        }));
                        toast.success("Orientações adicionadas");
                      }}
                      onAddSinaisAlerta={(linhas) => {
                        setOrientacoes((prev) => ({
                          ...prev,
                          sinaisAlarme: Array.from(new Set([...prev.sinaisAlarme, ...linhas])),
                        }));
                        toast.success("Sinais de alerta adicionados");
                      }}
                      onFillAtestado={(texto, cid) => {
                        setAtestado((a) => ({ ...a, reason: texto, cid: a.cid || cid || "" }));
                        setAction("atestado");
                      }}
                      onFillEncaminhamento={(destino) => {
                        setEncaminhamento((e) => ({ ...e, especialidade: destino }));
                        setAction("encaminhamento");
                      }}
                    />
                  ) : undefined
                }
                contexto={
                  <PathologyContextPanel
                    pathologyName={activePathology?.name ?? activeSyndrome?.nome}
                    environment={environment}

                    activeAction={action}
                    onSelectAction={setAction}
                  />
                }
                dose={
                  <div className="space-y-4">
                    <DoseCalculatorPanel
                      isPediatric={isPediatric}
                      weightKg={patient.weightKg ?? null}
                      onAdd={(name, text) => {
                        setMeds([...selected, { id: -Date.now(), name, text: `${name}\n${text}` }]);
                        toast.success(`${name} adicionado com dose calculada`);
                      }}
                    />
                    <ClinicalCalculatorsPanel
                      atendimentoId={atendimentoId.current}
                      pathologyName={activePathology?.name ?? activeSyndrome?.nome ?? null}
                      environment={environment}
                      profiles={activeProfiles}
                      medications={selected.map((m) => m.name)}
                      isPediatric={isPediatric}
                      isPregnant={isPregnant}
                      hasRenalImpairment={patient.hasRenalImpairment}
                      ageInYears={patient.ageInYears}
                      weightKg={patient.weightKg ?? null}
                      sex={patient.sex}
                      onUseResult={(title, text) => {
                        setMeds([
                          ...selected,
                          { id: -Date.now(), name: title, text: `${title}\n${text}` },
                        ]);
                        toast.success(`${title} adicionado ao documento`);
                      }}
                    />
                  </div>
                }
                ia={
                  <ClinicalAIPanel
                    pathologyName={activePathology?.name}
                    environment={environment}
                    patient={{
                      idade: ageValue ? `${ageValue} ${ageUnit}` : null,
                      peso: weight || null,
                      pediatrico: isPediatric,
                      gestante: isPregnant,
                      alergias: patient.allergies || null,
                      renal: patient.hasRenalImpairment,
                    }}
                    medicamentos={selected.map((m) => m.text || m.name)}
                    exames={exames.itens.map((i) => i.nome)}
                    onAddMedication={(nome, texto) => {
                      setMeds([...selected, { id: -Date.now(), name: nome, text: `${nome}\n${texto}` }]);
                      toast.success(`${nome} adicionado (sugestão de IA)`);
                    }}
                    onAddExam={(nome) => {
                      if (exames.itens.some((i) => i.nome.toLowerCase() === nome.toLowerCase())) return;
                      setExames({
                        ...exames,
                        itens: [...exames.itens, { id: `ai_${Date.now()}`, tipo: "laboratorial", nome }],
                      });
                      toast.success(`${nome} adicionado aos exames`);
                    }}
                  />
                }
              />

              <PatientBlock patient={patient} />

              {/* MÓDULO FANTASMA #1 — Alertas do perfil do paciente + badges clínicos
                  (Gestante / Lactação / Geriatria ≥60 anos / Nefropatia) */}
              <PatientProfileFields patient={patient} compact />

              <ActionGrid
                active={action}
                onSelect={setAction}
                drafts={drafts}
                patient={{
                  hasName: !!patientName.trim(),
                  hasWeight: !!weight.trim(),
                  isPediatric,
                  isPregnant,
                  hasAllergies: patient.hasAllergies,
                }}
              />

              {/* MÓDULO FANTASMA #2 — Card de diluição IV (injetáveis).
                  Mostra também se já há medicamentos selecionados (ainda que
                  sem marcação EV), para o médico decidir converter via. */}
              {showIVDilution && (
                <IVPrescriberCard
                  key={`iv-${selected.length}-${action}`}
                  selected={selected}
                  medications={allMedications}
                  patient={{
                    weightKg: patient.weightKg ?? null,
                    ageInYears: patient.ageInYears ?? null,
                    isPediatric,
                    isPregnant,
                    hasRenalImpairment: patient.hasRenalImpairment,
                  }}
                  onApplyLine={(textoFinal) => {
                    const nome = textoFinal.split(/[\n—-]/)[0].trim() || "Medicamento EV";
                    const tempId = -Date.now() - Math.floor(Math.random() * 1000);
                    setMeds([...selected, { id: tempId, name: nome, text: textoFinal }]);
                    toast.success("Prescrição IV aplicada");
                  }}
                  highlightInjectables={hasInjectables}
                />
              )}

              <BuilderShell
                patient={patient}
                validation={validation}
                onReview={() => setReviewOpen(true)}
                onClear={handleClear}
                reviewLabel={`Revisar e emitir`}
                safetyPanel={
                  <>
                    {/* MÓDULO FANTASMA #3 — Interações medicamentosas ACIMA do
                        SafetyPanel de segurança clínica tradicional. */}
                    {showInteractionRisk && (
                      <InteractionsRiskCard
                        items={prescItems}
                        base={interactionsBase}
                        settings={interactionsSettings}
                        patient={interactionsPatientCtx}
                        defaultCollapsed={false}
                      />
                    )}
                    {action === "receita" && (assessment.alerts.length > 0 || selected.length > 0) ? (
                      <SafetyPanel
                        assessment={assessment}
                        overrides={safetyOverride.overrides}
                        onAcknowledge={handleAcknowledge}
                        onRequestJustify={(a) => setPendingJustifyAlert(a)}
                        onRevoke={safetyOverride.revoke}
                      />
                    ) : undefined}
                  </>
                }
              >
                {renderEditor()}
              </BuilderShell>
              {action === "receita" && (
                <AssistiveDecisionSupport
                  selected={selected}
                  patientName={patientName}
                  isPediatric={isPediatric}
                  isPregnant={isPregnant}
                  ageInYears={patient.ageInYears}
                  weightKg={patient.weightKg}
                  allergies={patient.allergies}
                  onAddReuseItems={handleReuseItems}
                />
              )}
            </section>

            {/* Preview column — desktop only */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 h-[calc(100vh-7rem)]">
                <DocumentPreview {...previewProps} />
              </div>
            </aside>
          </>
        )}
      </main>


      {/* Mobile FAB — só depois da escolha da patologia (unificado builder + action grid) */}
      <div className={cnDash("fixed bottom-4 left-4 right-4 z-30 lg:hidden print:hidden", !gatePassed && "hidden")}>

        {draftCount > 1 && (
          <div className="mb-2 mx-auto w-fit inline-flex items-center gap-1.5 bg-card border border-ink-soft text-ink-muted text-[10px] font-medium uppercase tracking-editorial px-3 py-1 rounded-full shadow-paper">
            <Sparkles className="h-3 w-3 text-canon-blue" />
            {draftCount} documentos em rascunho
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSmartOpen(true)}
          className="w-full mb-2"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Entrada inteligente (texto ou foto)
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setScoresOpen(true)}
          className="w-full mb-2"
        >
          <Calculator className="h-4 w-4 mr-2" />
          Escores clínicos (todos)
        </Button>
        <Button
          onClick={() => setReviewOpen(true)}
          className="w-full h-12 bg-canon-blue text-primary-foreground hover:bg-canon-blue/90 shadow-paper"
        >
          <Eye className="h-4 w-4 mr-2" />
          Revisar e emitir
        </Button>
      </div>

      {/* Tela cheia de revisão final (mobile + desktop) */}
      <ReviewScreen
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        documentTitle={DOC_TITLES[action]}
        validation={validation}
        assessment={assessment}
        documentText={serializeDocument({
          action, patientName, isPediatric, isPregnant,
          ageValue, ageUnit, weight,
          selected, atestado, exames, encaminhamento,
          declaracao, relatorio, orientacoes, procedimento,
          aih, apac, notificacao,
          clinicInfo: resolvedClinicInfo,
        })}
        onPrint={handleEmit}
        preview={<DocumentPreview {...previewProps} hideActions />}
        regulatoryPanel={
          action === "receita" && regulatoryResult.groups.length > 0 ? (
            <RegulatoryReviewPanel
              result={regulatoryResult}
              onPrintGroup={handlePrintGroup}
              onDownloadGroup={handleDownloadGroup}
              canEmit={validation.canEmit && assessment.status !== "blocked" && finalReviewOk}
            />
          ) : undefined
        }
        signatureProfiles={signatureProfiles}
        selectedProfileId={signatureProfileId}
        onSelectProfile={setSignatureProfileId}
        requireFinalReview={requireFinalReview}
        finalReviewConfirmed={finalReviewConfirmed}
        onToggleFinalReview={setFinalReviewConfirmed}
      />

      {/* Print modal — usa replayRecord quando reabrindo do histórico */}
      <PrintArea
        open={printOpen}
        onClose={() => { setPrintOpen(false); setActiveGroup(null); setReplayRecord(null); }}
        onPdfGenerated={handlePrintAreaPdf}
        patientName={replayRecord?.patientName ?? patientName}
        isPediatric={replayRecord?.isPediatric ?? isPediatric}
        isPregnant={replayRecord?.isPregnant ?? isPregnant}
        ageValue={replayRecord?.ageValue ?? ageValue}
        ageUnit={replayRecord?.ageUnit ?? ageUnit}
        weight={replayRecord?.weight ?? weight}
        action={replayRecord?.action ?? action}
        selected={replayRecord?.selected ?? selected}
        allMedications={allMedications}
        atestado={replayRecord?.atestado ?? atestado}
        exames={replayRecord?.exames ?? exames}
        encaminhamento={replayRecord?.encaminhamento ?? encaminhamento}
        declaracao={replayRecord?.declaracao ?? declaracao}
        relatorio={replayRecord?.relatorio ?? relatorio}
        orientacoes={replayRecord?.orientacoes ?? orientacoes}
        aih={replayRecord?.aih ?? aih}
        apac={replayRecord?.apac ?? apac}
        notificacao={replayRecord?.notificacao ?? notificacao}
        clinicInfo={replayRecord?.clinicInfo ?? resolvedClinicInfo}
        signatureConfig={replayRecord?.signatureConfig ?? resolvedSignatureConfig}
        selectedFilter={
          replayRecord?.selectedFilter
            ?? (activeGroup ? activeGroup.items.map((it) => it.selected.id) : undefined)
        }
        titleOverride={
          replayRecord?.regulatoryLabel
            ? `Receita Médica — ${replayRecord.regulatoryLabel}`
            : activeGroup
              ? `Receita Médica — ${activeGroup.rules.label}`
              : undefined
        }
      />

      <EmissionHistoryDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        history={emissionHistory.history}
        onView={handleHistoryView}
        onPrint={handleHistoryPrint}
        onDownload={handleHistoryDownload}
        onRemove={emissionHistory.remove}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        clinicInfo={clinicInfo}
        setClinicInfo={setClinicInfo}
        signatureConfig={signatureConfig}
        setSignatureConfig={setSignatureConfig}
        customMedications={customMedications}
        setCustomMedications={setCustomMedications}
        customTemplates={customTemplates}
        setCustomTemplates={setCustomTemplates}
        allMedications={allMedications}
      />

      <SafetyOverrideDialog
        alert={pendingJustifyAlert}
        onConfirm={handleConfirmJustify}
        onCancel={() => setPendingJustifyAlert(null)}
      />

      <ScoresDialog
        open={scoresOpen}
        onOpenChange={setScoresOpen}
        atendimentoId={atendimentoId.current}
        ageInYears={patient.ageInYears ?? null}
        onUseResult={(title, text) => {
          setMeds([...selected, { id: -Date.now(), name: title, text: `${title}
${text}` }]);
          toast.success(`${title} adicionado ao documento`);
        }}
      />

      <SmartInputDialog
        open={smartOpen}
        onOpenChange={(open) => {
          setSmartOpen(open);
          if (!open && searchParams.has("smart")) {
            const next = new URLSearchParams(searchParams);
            next.delete("smart");
            setSearchParams(next, { replace: true });
          }
        }}
        tipoEntrada="texto_livre"
        contexto={activePathology?.name ?? activeSyndrome?.nome ?? undefined}
        onConfirm={handleSmartInputConfirm}
      />

      <ManualMedicationDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        onConfirm={handleAddManualMedication}
      />
    </div>
  );
};

export default Dashboard;
