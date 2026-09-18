import { useState, useMemo } from "react";
import { Eye, Sparkles, RefreshCw } from "lucide-react";
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
  /** Etapa 2 — tipo de documento já escolhido nesta sessão de atendimento. */
  const [docChosen, setDocChosen] = useState(false);
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
  const [printOpen, setPrintOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
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

  // Histórico de emissões persistido
  const emissionHistory = useEmissionHistory();

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
    setDocChosen(false);
    pathologyMemory.pushRecent(pathology.id);
    pathologyMemory.registerUse(pathologyKey(pathology.name));
    prefillDocuments(pathology.name, pathology.cid);
  };

  /** Camada 2 — entra no atendimento por síndrome (sem diagnóstico fechado). */
  const handleSelectSyndrome = (s: Syndrome) => {
    setActiveSyndrome(s);
    setActivePathology(null);
    setGatePassed(true);
    setDocChosen(false);
    prefillDocuments(s.nome, s.cid);
    toast.success(`Síndrome "${s.nome}" carregada`);
  };

  /** Segue o atendimento sem patologia definida (documento em branco). */
  const handleSkipPathology = () => {
    setActivePathology(null);
    setActiveSyndrome(null);
    setGatePassed(true);
    setDocChosen(false);
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
    clinicInfo,
    signatureConfig,
    ...extra,
  });

  const handlePrint = () => {
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

  /** Registra a receita emitida para revisão na tela de Prescrições. */
  const recordPrescription = (group: RegulatoryGroup) => {
    void savePrescriptionRecord({
      patientName,
      environment,
      conditionName: activePathology?.name ?? activeSyndrome?.nome ?? null,
      conditionType: activePathology ? "patologia" : activeSyndrome ? "sindrome" : null,
      cid: activePathology?.cid ?? activeSyndrome?.cid ?? null,
      regulatoryLabel: group.rules.label,
      items: group.items.map((it) => ({ nome: it.selected.name, posologia: it.selected.text })),
    });
  };

  /** Imprime apenas um grupo regulatório (filtra SelectedMeds). */
  const handlePrintGroup = (group: RegulatoryGroup) => {
    setActiveGroup(group);
    setPrintOpen(true);
    emissionHistory.add(
      buildSnapshot({
        regulatoryLabel: group.rules.label,
        selectedFilter: group.items.map((it) => it.selected.id),
      }),
    );
    recordPrescription(group);
    setTimeout(() => window.print(), 300);
  };

  /** Gera PDF apenas do grupo selecionado, usando html2pdf no nó .prescription-print-area. */
  const handleDownloadGroup = async (group: RegulatoryGroup): Promise<void> => {
    setActiveGroup(group);
    setPrintOpen(true);
    // Aguarda render do PrintArea filtrado antes de capturar
    await new Promise((r) => setTimeout(r, 350));
    const node = document.querySelector(".prescription-print-area") as HTMLElement | null;
    if (!node) {
      toast.error("Não foi possível preparar o documento");
      return;
    }
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const sufix = group.subTotal && group.subTotal > 1 ? `_${group.subIndex}de${group.subTotal}` : "";
      const filename = `Receita_${group.rules.label.replace(/\s+/g, "_")}${sufix}_${(patientName || "paciente").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
      const isLandscape = group.family === "controle-especial" || group.family === "antimicrobiano";
      await html2pdf()
        .set({
          margin: isLandscape ? 5 : 10,
          filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: isLandscape ? "landscape" : "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(node)
        .save();
      emissionHistory.add(
        buildSnapshot({
          regulatoryLabel: group.rules.label,
          selectedFilter: group.items.map((it) => it.selected.id),
        }),
      );
      recordPrescription(group);
      toast.success(`PDF "${group.rules.label}" salvo`);
    } catch (err) {
      console.error(err);
      toast.error("Falha ao gerar PDF");
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

  // Print with validation + clinical safety gate
  const handleEmit = () => {
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
    // Persistir no histórico de emissões — apenas para documentos não-receita
    // (receita é registrada por grupo regulatório em handlePrintGroup/handleDownloadGroup)
    if (action !== "receita") {
      emissionHistory.add(buildSnapshot());
    }
    handlePrint();
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

  const handleHistoryPrint = (record: EmissionRecord) => {
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
      await html2pdf()
        .set({
          margin: isLandscape ? 5 : 10,
          filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: isLandscape ? "landscape" : "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(node)
        .save();
      toast.success("PDF salvo");
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
    clinicInfo,
    onPrint: handlePrint,
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
          gatePassed && docChosen ? "lg:grid-cols-[1.05fr_0.95fr]" : "max-w-3xl",
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
        ) : !docChosen ? (
          /* Etapa 2 — escolha do tipo de documento */
          <section className="space-y-5">
            <div className="flex items-center gap-3 rounded-lg border border-ink-soft bg-card px-4 py-3 shadow-paper">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
                  Passo 2 · {ENVIRONMENTS.find((e) => e.id === environment)?.label}
                  {activeSyndrome ? " · Síndrome" : ""}
                </div>
                <div className="truncate font-serif text-base font-semibold text-ink">
                  {activePathology?.name ?? activeSyndrome?.nome ?? "Documento em branco"}
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
                onClick={() => setGatePassed(false)}
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
              />
            )}

            <ActionGrid
              active={action}
              onSelect={(a) => { setAction(a); setDocChosen(true); }}
              drafts={drafts}
              patient={{
                hasName: !!patientName.trim(),
                hasWeight: !!weight.trim(),
                isPediatric,
                isPregnant,
                hasAllergies: patient.hasAllergies,
              }}
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
              <BuilderShell
                patient={patient}
                validation={validation}
                onReview={() => setReviewOpen(true)}
                onClear={handleClear}
                reviewLabel={`Revisar e emitir`}
                safetyPanel={
                  action === "receita" && (assessment.alerts.length > 0 || selected.length > 0) ? (
                    <SafetyPanel
                      assessment={assessment}
                      overrides={safetyOverride.overrides}
                      onAcknowledge={handleAcknowledge}
                      onRequestJustify={(a) => setPendingJustifyAlert(a)}
                      onRevoke={safetyOverride.revoke}
                    />
                  ) : undefined
                }
              >
                {renderEditor()}
              </BuilderShell>
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


      {/* Mobile FAB — só depois da escolha da patologia */}
      <div className={cnDash("fixed bottom-4 left-4 right-4 z-30 lg:hidden print:hidden", (!gatePassed || !docChosen) && "hidden")}>

        {draftCount > 1 && (
          <div className="mb-2 mx-auto w-fit inline-flex items-center gap-1.5 bg-card border border-ink-soft text-ink-muted text-[10px] font-medium uppercase tracking-editorial px-3 py-1 rounded-full shadow-paper">
            <Sparkles className="h-3 w-3 text-canon-blue" />
            {draftCount} documentos em rascunho
          </div>
        )}
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
          clinicInfo,
        })}
        onPrint={handleEmit}
        preview={<DocumentPreview {...previewProps} hideActions />}
        regulatoryPanel={
          action === "receita" && regulatoryResult.groups.length > 0 ? (
            <RegulatoryReviewPanel
              result={regulatoryResult}
              onPrintGroup={handlePrintGroup}
              onDownloadGroup={handleDownloadGroup}
              canEmit={validation.canEmit && assessment.status !== "blocked"}
            />
          ) : undefined
        }
      />

      {/* Print modal — usa replayRecord quando reabrindo do histórico */}
      <PrintArea
        open={printOpen}
        onClose={() => { setPrintOpen(false); setActiveGroup(null); setReplayRecord(null); }}
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
        clinicInfo={replayRecord?.clinicInfo ?? clinicInfo}
        signatureConfig={replayRecord?.signatureConfig ?? signatureConfig}
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

      <ManualMedicationDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        onConfirm={handleAddManualMedication}
      />
    </div>
  );
};

export default Dashboard;
