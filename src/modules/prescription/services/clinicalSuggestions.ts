/**
 * Etapa 1 — Motor único de sugestões e busca clínica.
 *
 * Porta ÚNICA de acesso a medicamentos para toda a plataforma:
 *   - `getClinicalSuggestions` → vínculos revisados (condição/síndrome + ambiente)
 *   - `searchMedications`      → busca normalizada em toda a base
 *
 * Regras invioláveis:
 *   1. Nada é inventado. Se dose/apresentação não existem no banco, o item vem
 *      marcado como incompleto — nunca preenchido por adivinhação.
 *   2. Nenhum fallback por classe terapêutica ou lista genérica.
 *   3. Toda lacuna é registrada internamente para orientar a curadoria.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Medication } from "@/types/prescription";
import type { ClinicalEnvironment } from "../types/prescription";
import { stableNumericId } from "../hooks/useMedications";
import { reportError } from "@/lib/reportError";

/* ============================ Tipos ============================ */

export type LinkLine = "primeira" | "alternativa" | "sintomatico" | "suporte";

export const LINK_LINE_ORDER: LinkLine[] = ["primeira", "alternativa", "sintomatico", "suporte"];
export const LINK_LINE_LABELS: Record<LinkLine, string> = {
  primeira: "Primeira escolha",
  alternativa: "Alternativas",
  sintomatico: "Sintomáticos",
  suporte: "Suporte",
};

/* ---------- Etapa 4 — papel terapêutico do vínculo ---------- */

export type SuggestionRole =
  | "primeira_linha"
  | "alternativa"
  | "adjuvante"
  | "sintomatico"
  | "resgate"
  | "hospitalar"
  | "situacao_especifica";

export const ROLE_LABELS: Record<SuggestionRole, string> = {
  primeira_linha: "Primeira linha",
  alternativa: "Alternativa",
  adjuvante: "Adjuvante",
  sintomatico: "Sintomático",
  resgate: "Resgate / urgência",
  hospitalar: "Hospitalar",
  situacao_especifica: "Situação específica",
};

/** Grupos de exibição devolvidos pelo motor (1 = mais pertinente). */
export type SuggestionGroup = 1 | 2 | 3 | 4;

export const GROUP_LABELS: Record<SuggestionGroup, string> = {
  1: "Sugestões principais",
  2: "Alternativas revisadas",
  3: "Sintomáticos e adjuvantes",
  4: "Vínculo pendente de revisão",
};

const ROLE_TO_LINE: Record<SuggestionRole, LinkLine> = {
  primeira_linha: "primeira",
  resgate: "primeira",
  alternativa: "alternativa",
  hospitalar: "alternativa",
  situacao_especifica: "alternativa",
  sintomatico: "sintomatico",
  adjuvante: "suporte",
};

const LINE_TO_ROLE: Record<LinkLine, SuggestionRole> = {
  primeira: "primeira_linha",
  alternativa: "alternativa",
  sintomatico: "sintomatico",
  suporte: "adjuvante",
};

export interface PatientContext {
  isPediatric?: boolean;
  isPregnant?: boolean;
  hasRenalImpairment?: boolean;
  hasHepaticImpairment?: boolean;
  /** Peso em kg, quando informado — usado para sinalizar doses peso-dependentes. */
  weightKg?: number | null;
  ageYears?: number | null;
  allergies?: string[];
}

/** Retorno padronizado — mesmo formato em todas as telas. */
export interface ClinicalSuggestion {
  /** Chave estável do vínculo (para React keys e rastreabilidade). */
  linkId: string;
  origin: "patologia" | "sindrome";
  medicationId: string | null;
  /** ID numérico derivado, usado pelo fluxo legado de prescrição. */
  numericId: number;
  name: string;
  activeIngredient: string | null;
  presentation: string | null;
  concentration: string | null;
  route: string | null;
  adultDose: string | null;
  pediatricDose: string | null;
  frequency: string | null;
  duration: string | null;
  line: LinkLine;
  /** Papel terapêutico formal do vínculo (Etapa 4). */
  role: SuggestionRole;
  /** Grupo de exibição: 1 principais · 2 alternativas · 3 adjuvantes · 4 não revisados. */
  group: SuggestionGroup;
  /** Contexto do vínculo: ambulatorial, urgencia, emergencia, hospitalar ou qualquer. */
  careContext: string;
  /** O vínculo condição→medicamento foi formalmente revisado. */
  linkReviewed: boolean;
  /** O medicamento tem apresentação + dose liberadas na revisão clínica (Etapa 3). */
  medicationReleased: boolean;
  /** Avisos calculados a partir do contexto do paciente. */
  patientAlerts: string[];
  priority: number;
  notes: string | null;
  prescriptionClass: string | null;
  /** Sinalizações de segurança vindas do banco. */
  flags: {
    avoidInPregnancy: boolean;
    renalAdjustment: boolean;
    hepaticAdjustment: boolean;
    highRisk: boolean;
    /** Dose ausente no banco: exibir, mas exigir preenchimento manual. */
    incompleteDose: boolean;
    /** Alerta ativo para este paciente específico. */
    unsafeForPatient: boolean;
  };
}

export interface MedicationRecord {
  id: string;
  name: string;
  activeIngredient: string | null;
  commercialName: string | null;
  presentation: string | null;
  concentration: string | null;
  route: string | null;
  therapeuticClass: string | null;
  adultDose: string | null;
  pediatricDose: string | null;
  frequency: string | null;
  duration: string | null;
  prescriptionClass: string | null;
  highRisk: boolean;
  incompleteDose: boolean;
  incompletePresentation: boolean;
}

/* ======================= Normalização ======================= */

/** Espelha `public.clin_normalize` — minúsculas, sem acento, sem pontuação. */
export function normalizeClinical(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ==================== Sugestões clínicas ==================== */

const VIEW_COLS =
  "id, principio_ativo, nome_comercial_referencia, classe_terapeutica, tipo_receita, alto_risco, " +
  "apresentacao, concentracao, via_administracao, dose_adulto, dose_pediatrica, frequencia, duracao, " +
  "dose_incompleta, apresentacao_incompleta, busca_normalizada, ativo, status_revisao";

type RpcRow = Record<string, any>;

const ROLE_KEYS = Object.keys(ROLE_LABELS) as SuggestionRole[];

function toSuggestion(row: RpcRow, patient: PatientContext): ClinicalSuggestion {
  const avoidInPregnancy = !!row.evitar_gestante;
  const renalAdjustment = !!row.ajuste_renal;
  const hepaticAdjustment = !!row.ajuste_hepatico;

  // Aceita tanto o formato novo (papel) quanto o legado (linha).
  const role: SuggestionRole = ROLE_KEYS.includes(row.papel)
    ? (row.papel as SuggestionRole)
    : LINE_TO_ROLE[(LINK_LINE_ORDER.includes(row.linha) ? row.linha : "suporte") as LinkLine];
  const line = ROLE_TO_LINE[role];

  const linkReviewed = row.vinculo_revisado === undefined ? true : !!row.vinculo_revisado;
  const medicationReleased = !!row.medicamento_liberado;
  const group = (
    [1, 2, 3, 4].includes(Number(row.grupo))
      ? Number(row.grupo)
      : !linkReviewed
      ? 4
      : role === "primeira_linha" || role === "resgate"
      ? 1
      : role === "sintomatico" || role === "adjuvante"
      ? 3
      : 2
  ) as SuggestionGroup;

  const dbAlerts: string[] = Array.isArray(row.alertas_paciente) ? row.alertas_paciente.filter(Boolean) : [];
  const localAlerts = [
    patient.isPregnant && avoidInPregnancy ? "Alerta na gestação" : null,
    patient.hasRenalImpairment && renalAdjustment ? "Requer ajuste renal" : null,
    patient.hasHepaticImpairment && hepaticAdjustment ? "Requer ajuste hepático" : null,
    patient.isPediatric && !row.dose_pediatrica ? "Sem dose pediátrica cadastrada" : null,
  ].filter(Boolean) as string[];
  const patientAlerts = Array.from(new Set([...dbAlerts, ...localAlerts]));

  return {
    linkId: String(row.vinculo_id ?? row.id),
    origin: row.origem === "sindrome" ? "sindrome" : "patologia",
    medicationId: row.medicamento_id ?? null,
    numericId: stableNumericId(row.medicamento_id ?? String(row.vinculo_id ?? row.id)),
    name: row.medicamento_nome ?? row.principio_ativo ?? "—",
    activeIngredient: row.principio_ativo ?? null,
    presentation: row.apresentacao ?? null,
    concentration: row.concentracao ?? null,
    route: row.via ?? null,
    adultDose: row.dose_adulto ?? null,
    pediatricDose: row.dose_pediatrica ?? null,
    frequency: row.frequencia ?? null,
    duration: row.duracao ?? null,
    line,
    role,
    group,
    careContext: row.care_context ?? "qualquer",
    linkReviewed,
    medicationReleased,
    patientAlerts,
    priority: row.prioridade ?? 100,
    notes: row.notas ?? row.observacao ?? null,
    prescriptionClass: row.tipo_receita ?? null,
    flags: {
      avoidInPregnancy,
      renalAdjustment,
      hepaticAdjustment,
      highRisk: !!row.alto_risco,
      incompleteDose: !!row.dose_incompleta,
      unsafeForPatient:
        (!!patient.isPregnant && avoidInPregnancy) ||
        (!!patient.hasRenalImpairment && renalAdjustment) ||
        (!!patient.hasHepaticImpairment && hepaticAdjustment),
    },
  };
}

/**
 * Ordenação canônica das sugestões (função pura, testável).
 *
 * Regra inviolável: item não revisado NUNCA fica acima de um revisado, e
 * alternativa/sintomático nunca ficam acima da primeira linha do mesmo nível.
 */
export function rankSuggestions(list: ClinicalSuggestion[]): ClinicalSuggestion[] {
  return [...list].sort(
    (a, b) =>
      a.group - b.group ||
      (a.medicationReleased ? 0 : 1) - (b.medicationReleased ? 0 : 1) ||
      a.priority - b.priority ||
      a.name.localeCompare(b.name),
  );
}

export interface SuggestionsQuery {
  condition?: string | null;
  syndrome?: string | null;
  environment?: ClinicalEnvironment | null;
  patient?: PatientContext;
}

export interface SuggestionsResult {
  suggestions: ClinicalSuggestion[];
  /** Sugestões por grupo, prontas para a interface. */
  byGroup: Record<SuggestionGroup, ClinicalSuggestion[]>;
  /** Rastreabilidade (modo dev/admin): quantos vieram e quantos foram descartados. */
  diagnostics: {
    returnedByService: number;
    displayed: number;
    droppedNoDose: number;
    origin: "patologia" | "sindrome" | "nenhuma";
  };
}

function emptyGroups(): Record<SuggestionGroup, ClinicalSuggestion[]> {
  return { 1: [], 2: [], 3: [], 4: [] };
}

/**
 * Consulta única de sugestões (Etapa 4). Prioriza vínculos da condição; só cai
 * para a síndrome quando a condição não tem nenhum vínculo cadastrado.
 * O contexto do paciente é enviado ao banco para calcular alertas.
 */
export async function getClinicalSuggestions({
  condition,
  syndrome,
  environment,
  patient = {},
}: SuggestionsQuery): Promise<SuggestionsResult> {
  const conditionName = (condition ?? "").trim();
  const syndromeName = (syndrome ?? "").trim();
  if (!conditionName && !syndromeName) {
    return {
      suggestions: [],
      byGroup: emptyGroups(),
      diagnostics: { returnedByService: 0, displayed: 0, droppedNoDose: 0, origin: "nenhuma" },
    };
  }

  const { data, error } = await supabase.rpc("fn_sugestoes_terapeuticas" as any, {
    p_condicao: conditionName || null,
    p_sindrome: syndromeName || null,
    p_contexto: environment ?? null,
    p_paciente: {
      gestante: !!patient.isPregnant,
      pediatrico: !!patient.isPediatric,
      renal: !!patient.hasRenalImpairment,
      hepatico: !!patient.hasHepaticImpairment,
      peso: patient.weightKg ?? null,
      idade: patient.ageYears ?? null,
      alergias: patient.allergies ?? [],
    },
  });
  if (error) throw error;

  const rows = ((data as any) ?? []) as RpcRow[];
  const all = rows.map((r) => toSuggestion(r, patient));

  // Deduplicação por medicamento + papel, preservando a melhor colocação.
  const seen = new Set<string>();
  const suggestions: ClinicalSuggestion[] = [];
  for (const s of rankSuggestions(all)) {
    const key = `${normalizeClinical(s.name)}|${s.role}`;
    if (seen.has(key)) continue;
    seen.add(key);
    suggestions.push(s);
  }

  const byGroup = emptyGroups();
  for (const s of suggestions) byGroup[s.group].push(s);

  return {
    suggestions,
    byGroup,
    diagnostics: {
      returnedByService: all.length,
      displayed: suggestions.length,
      droppedNoDose: suggestions.filter((s) => s.flags.incompleteDose).length,
      origin: suggestions[0]?.origin ?? "nenhuma",
    },
  };
}

/* ================= Busca normalizada na base ================= */

function rowToRecord(row: RpcRow): MedicationRecord {
  return {
    id: String(row.id),
    name: [row.principio_ativo, row.concentracao].filter(Boolean).join(" ").trim() || String(row.principio_ativo ?? "—"),
    activeIngredient: row.principio_ativo ?? null,
    commercialName: row.nome_comercial_referencia ?? null,
    presentation: row.apresentacao ?? null,
    concentration: row.concentracao ?? null,
    route: row.via_administracao ?? null,
    therapeuticClass: row.classe_terapeutica ?? null,
    adultDose: row.dose_adulto ?? null,
    pediatricDose: row.dose_pediatrica ?? null,
    frequency: row.frequencia ?? null,
    duration: row.duracao ?? null,
    prescriptionClass: row.tipo_receita ?? null,
    highRisk: !!row.alto_risco,
    incompleteDose: !!row.dose_incompleta,
    incompletePresentation: !!row.apresentacao_incompleta,
  };
}

/**
 * Busca tolerante a acento, maiúscula, hífen e ordem das palavras.
 * "amoxicilina clavulanato", "clavulanato" e "AMOXI-CILINA" chegam ao mesmo registro.
 */
export async function searchMedications(term: string, limit = 40): Promise<MedicationRecord[]> {
  const tokens = normalizeClinical(term).split(" ").filter((t) => t.length >= 2);
  if (tokens.length === 0) return [];

  let query = supabase
    .from("vw_medicamento_completo" as any)
    .select(VIEW_COLS)
    .eq("ativo", true)
    .neq("status_revisao", "inativo");

  // Todos os tokens precisam estar presentes (AND) — busca previsível.
  for (const t of tokens) query = query.ilike("busca_normalizada", `%${t}%`);

  const { data, error } = await query.order("principio_ativo", { ascending: true }).limit(limit);
  if (error) throw error;
  return (((data as any) ?? []) as RpcRow[]).map(rowToRecord);
}

export async function getMedicationById(id: string): Promise<MedicationRecord | null> {
  const { data, error } = await supabase
    .from("vw_medicamento_completo" as any)
    .select(VIEW_COLS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToRecord(data as RpcRow) : null;
}

/* ============ Etapa 2 — Apresentações e posologias ============ */

export interface PosologyOption {
  doseId: string;
  population: string | null;
  route: string | null;
  /** Texto pronto (ex.: "500–1000 mg/dose VO 6/6h por 7 dias"). */
  text: string | null;
  frequency: string | null;
  duration: string | null;
  maxPerDay: string | null;
  notes: string | null;
  /** Revisada e liberada para preenchimento automático. */
  reviewed: boolean;
  pending: boolean;
}

export interface MedicationPresentation {
  id: string;
  label: string;
  pharmaceuticalForm: string | null;
  concentration: string | null;
  route: string | null;
  volume: string | null;
  adultUse: boolean;
  pediatricUse: boolean;
  /** Tem forma + concentração: pode ser usada na prescrição. */
  usable: boolean;
  reviewed: boolean;
  posologies: PosologyOption[];
}

function toPosology(row: RpcRow): PosologyOption {
  return {
    doseId: String(row.dose_id),
    population: row.populacao ?? null,
    route: row.via ?? null,
    text: row.posologia ?? null,
    frequency: row.frequencia ?? null,
    duration: row.duracao ?? null,
    maxPerDay: row.dose_maxima_dia || null,
    notes: row.observacao ?? null,
    reviewed: !!row.revisada,
    pending: !!row.pendente,
  };
}

function toPresentation(row: RpcRow): MedicationPresentation {
  const posologies = (Array.isArray(row.posologias) ? row.posologias : []).map(toPosology);
  return {
    id: String(row.apresentacao_id),
    label: row.rotulo ?? "Apresentação sem rótulo",
    pharmaceuticalForm: row.forma_farmaceutica ?? null,
    concentration: row.concentracao ?? null,
    route: row.via ?? null,
    volume: row.volume ? [row.volume, row.unidade_volume].filter(Boolean).join(" ") : null,
    adultUse: row.uso_adulto !== false,
    pediatricUse: !!row.uso_pediatrico,
    usable: !!row.utilizavel,
    reviewed: !!row.revisada,
    posologies,
  };
}

/**
 * Apresentações ativas de um medicamento, cada uma com as posologias
 * compatíveis (mesma apresentação ou mesma via canônica).
 * Nada é inventado: apresentação/posologia ausente permanece vazia.
 */
export async function getMedicationPresentations(medicationId: string): Promise<MedicationPresentation[]> {
  if (!medicationId) return [];
  const { data, error } = await supabase.rpc("fn_apresentacoes_medicamento" as any, {
    p_medicamento_id: medicationId,
  });
  if (error) throw error;
  return (((data as any) ?? []) as RpcRow[]).map(toPresentation);
}

/**
 * Etapa 3 — só auto-seleciona quando existe exatamente uma apresentação
 * utilizável E clinicamente revisada. Dado tecnicamente completo, porém sem
 * revisão formal, continua visível e escolhível — apenas não é aplicado sozinho.
 */
export function pickAutoPresentation(list: MedicationPresentation[]): MedicationPresentation | null {
  const usable = list.filter((p) => p.usable);
  if (usable.length !== 1) return null;
  return usable[0].reviewed ? usable[0] : null;
}

/** Posologia sugerida para o paciente — nunca adivinha quando não há dado. */
export function pickPosology(
  presentation: MedicationPresentation | null,
  isPediatric: boolean,
): PosologyOption | null {
  if (!presentation) return null;
  const wanted = presentation.posologies.filter((p) =>
    isPediatric ? /pedi/i.test(p.population ?? "") : !/pedi/i.test(p.population ?? ""),
  );
  const pool = wanted.length > 0 ? wanted : presentation.posologies;
  return pool.find((p) => p.reviewed) ?? pool[0] ?? null;
}

export async function getMedicationBaseCount(): Promise<number> {
  const { count, error } = await supabase
    .from("vw_medicamento_completo" as any)
    .select("id", { count: "exact", head: true })
    .eq("ativo", true);
  if (error) throw error;
  return count ?? 0;
}

/* ================= Conversão para o fluxo atual ================= */

export function suggestionToMedication(s: ClinicalSuggestion, isPediatric: boolean): Medication {
  const dose = (isPediatric ? s.pediatricDose : s.adultDose) ?? s.adultDose;
  return {
    id: s.numericId,
    name: s.name,
    // Sem dose no banco → texto explícito, nunca uma dose inventada.
    dosage: [s.route, dose ?? "Dose não cadastrada — preencher manualmente"].filter(Boolean).join(" — "),
    instructions: [s.presentation, s.frequency, s.duration, s.notes].filter(Boolean).join(" · "),
    category: LINK_LINE_LABELS[s.line],
    pediatricDose: s.pediatricDose ?? undefined,
    safeForPregnant: s.flags.avoidInPregnancy ? false : undefined,
  };
}

export function recordToMedication(r: MedicationRecord, isPediatric: boolean): Medication {
  const dose = (isPediatric ? r.pediatricDose : r.adultDose) ?? r.adultDose;
  return {
    id: stableNumericId(r.id),
    name: r.name,
    dosage: [r.route, dose ?? "Dose não cadastrada — preencher manualmente"].filter(Boolean).join(" — "),
    instructions: [r.presentation, r.frequency, r.duration].filter(Boolean).join(" · "),
    category: r.therapeuticClass ?? "Base geral",
  };
}

/* ==================== Registro de lacunas ==================== */

export type GapKind = "sem_sugestao" | "busca_sem_resultado" | "dose_ausente" | "apresentacao_ausente";

/** Registro silencioso (nunca bloqueia a tela nem aparece para o médico). */
export async function logSuggestionGap(input: {
  tipo: GapKind;
  condicao?: string | null;
  sindrome?: string | null;
  ambiente?: string | null;
  termo?: string | null;
  detalhe?: string | null;
}): Promise<void> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;
    const { error: writeError } = await supabase.from("auditoria_sugestoes_lacunas" as any).insert({
      user_id: auth.user.id,
      tipo: input.tipo,
      condicao: input.condicao ?? null,
      sindrome: input.sindrome ?? null,
      ambiente: input.ambiente ?? null,
      termo_buscado: input.termo ?? null,
      detalhe: input.detalhe ?? null,
    });
    if (writeError) throw writeError;
  } catch (error) {
    reportError("clinicalSuggestions.auditoria", error, "Não foi possível registrar a auditoria das sugestões clínicas.");
  }
}

/* ================ Rastreabilidade em modo dev ================ */

const DEBUG_KEY = "prescrimed:debug-sugestoes";

export function isSuggestionDebugEnabled(): boolean {
  try {
    return localStorage.getItem(DEBUG_KEY) === "1";
  } catch {
    return false;
  }
}

export function traceSuggestions(label: string, result: SuggestionsResult): void {
  if (!isSuggestionDebugEnabled()) return;
  // eslint-disable-next-line no-console
  console.info("[PrescriMed · sugestões]", label, result.diagnostics);
}
