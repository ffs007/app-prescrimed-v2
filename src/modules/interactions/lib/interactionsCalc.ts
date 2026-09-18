// Interactions analysis engine (pure functions)

export type RiskLevel = "nenhum" | "baixo" | "moderado" | "alto" | "desconhecido";
export type InteractionSeverity = "leve" | "moderada" | "grave" | "contraindicada";
export type InteractionAlertLevel = "informativo" | "atencao" | "alto" | "critico";
export type InteractionType =
  | "farmacocinetica" | "farmacodinamica" | "duplicidade_terapeutica" | "qt_longo"
  | "nefrotoxicidade_somada" | "hepatotoxicidade_somada" | "risco_hemorragico"
  | "depressao_respiratoria" | "sedacao_somada" | "serotoninergico" | "hipercalemia"
  | "hipocalemia" | "hipotensao" | "bradicardia" | "hipertensao" | "glicemia" | "outro";

export type RiskCategory =
  | "qt" | "nefrotoxico" | "hepatotoxico" | "hemorragico" | "sedacao"
  | "depressao_respiratoria" | "serotoninergico" | "hipercalemia" | "hipocalemia"
  | "hipotensao" | "bradicardia" | "glicemia";

export const RISK_CATEGORIES: { key: RiskCategory; label: string; medField: string }[] = [
  { key: "qt", label: "QT longo", medField: "risco_qt" },
  { key: "nefrotoxico", label: "Nefrotoxicidade", medField: "risco_nefrotoxico" },
  { key: "hepatotoxico", label: "Hepatotoxicidade", medField: "risco_hepatotoxico" },
  { key: "hemorragico", label: "Sangramento", medField: "risco_hemorragico" },
  { key: "sedacao", label: "Sedação", medField: "risco_sedacao" },
  { key: "depressao_respiratoria", label: "Depressão respiratória", medField: "risco_depressao_respiratoria" },
  { key: "serotoninergico", label: "Serotoninérgico", medField: "risco_serotoninergico" },
  { key: "hipercalemia", label: "Hipercalemia", medField: "risco_hipercalemia" },
  { key: "hipocalemia", label: "Hipocalemia", medField: "risco_hipocalemia" },
  { key: "hipotensao", label: "Hipotensão", medField: "risco_hipotensao" },
  { key: "bradicardia", label: "Bradicardia", medField: "risco_bradicardia" },
  { key: "glicemia", label: "Glicemia", medField: "risco_glicemia" },
];

export interface PrescItem {
  id: string;
  principio_ativo: string;
  principio_ativo_normalizado?: string | null;
  classe_terapeutica?: string | null;
  subclasse_terapeutica?: string | null;
  permite_duplicidade_mesma_classe?: boolean;
  observacao_duplicidade?: string | null;
  nomes_comerciais?: string[];
  sinonimos?: string[];
  riscos: Partial<Record<RiskCategory, RiskLevel>>;
}

export interface InteractionRecord {
  id: string;
  medicamento_a?: string | null;
  medicamento_b?: string | null;
  principio_ativo_a?: string | null;
  principio_ativo_b?: string | null;
  principio_ativo_a_normalizado?: string | null;
  principio_ativo_b_normalizado?: string | null;
  classe_a?: string | null;
  classe_b?: string | null;
  tipo_interacao: InteractionType;
  mecanismo?: string | null;
  gravidade: InteractionSeverity;
  nivel_alerta: InteractionAlertLevel;
  conduta_sugerida?: string | null;
  mensagem_medico?: string | null;
  mensagem_enfermagem_farmacia?: string | null;
  exige_justificativa: boolean;
  bloqueio_absoluto: boolean;
  monitorizacao_recomendada?: string | null;
  exames_monitorar?: string[] | null;
  populacoes_maior_risco?: string[] | null;
  fonte_referencia?: string | null;
  status_revisao: string;
}

export interface InteractionsSettings {
  usar_apenas_revisadas: boolean;
  exigir_just_interacao_grave: boolean;
  bloquear_contraindicada: boolean;
  alertar_duplicidade: boolean;
  exigir_just_duplicidade_alto_risco: boolean;
  mostrar_risco_acumulado: boolean;
  exigir_just_risco_muito_alto: boolean;
  ignorar_alertas_leves_revisao: boolean;
}

export const DEFAULT_SETTINGS: InteractionsSettings = {
  usar_apenas_revisadas: true,
  exigir_just_interacao_grave: true,
  bloquear_contraindicada: true,
  alertar_duplicidade: true,
  exigir_just_duplicidade_alto_risco: true,
  mostrar_risco_acumulado: true,
  exigir_just_risco_muito_alto: true,
  ignorar_alertas_leves_revisao: false,
};

export interface PatientCtx {
  idade_anos?: number | null;
  clcr?: number | null;
  potassio?: number | null;
  inr?: number | null;
  plaquetas?: number | null;
  pressao_sistolica?: number | null;
  freq_cardiaca?: number | null;
  doenca_respiratoria?: boolean;
}

export interface PairInteractionFinding {
  itemA: PrescItem;
  itemB: PrescItem;
  record: InteractionRecord;
}

export interface DuplicateFinding {
  itens: PrescItem[];
  classe: string;
  subclasse?: string | null;
  observacao?: string | null;
}

export interface AccumulatedRisk {
  categoria: RiskCategory;
  label: string;
  soma: number;
  classificacao: "baixo" | "moderado" | "alto" | "muito_alto";
  contribuintes: { id: string; principio_ativo: string; nivel: RiskLevel }[];
  desconhecidos: { id: string; principio_ativo: string }[];
}

export interface GeneralAlert {
  id: string;
  categoria?: RiskCategory;
  nivel: InteractionAlertLevel;
  mensagem: string;
  exige_justificativa?: boolean;
  detalhes?: string[];
}

export interface AnalysisResult {
  interacoes: PairInteractionFinding[];
  duplicidades: DuplicateFinding[];
  riscos_acumulados: AccumulatedRisk[];
  alertas_gerais: GeneralAlert[];
  monitorizacao_sugerida: string[];
  bloqueios: { mensagem: string; itens: string[] }[];
  pendencias_justificativa: { mensagem: string; itens: string[] }[];
  contadores: {
    interacoes: number;
    duplicidades: number;
    alertas_altos: number;
    criticos: number;
  };
}

const RISK_VALUE: Record<RiskLevel, number | null> = {
  nenhum: 0, baixo: 1, moderado: 2, alto: 3, desconhecido: null,
};

export function normalize(s?: string | null): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function itemMatches(item: PrescItem, principio?: string | null, nomeComercial?: string | null): boolean {
  const norm = item.principio_ativo_normalizado || normalize(item.principio_ativo);
  const targets: string[] = [];
  if (principio) targets.push(normalize(principio));
  if (nomeComercial) targets.push(normalize(nomeComercial));
  if (!targets.length) return false;
  if (targets.includes(norm)) return true;
  for (const nc of item.nomes_comerciais || []) if (targets.includes(normalize(nc))) return true;
  for (const sn of item.sinonimos || []) if (targets.includes(normalize(sn))) return true;
  return false;
}

function classMatches(item: PrescItem, classe?: string | null): boolean {
  if (!classe) return false;
  const c = normalize(classe);
  return normalize(item.classe_terapeutica) === c || normalize(item.subclasse_terapeutica) === c;
}

export function findPairInteraction(
  a: PrescItem, b: PrescItem, base: InteractionRecord[], settings: InteractionsSettings
): InteractionRecord | null {
  const filtered = settings.usar_apenas_revisadas
    ? base.filter((r) => r.status_revisao === "revisado")
    : base.filter((r) => r.status_revisao !== "inativo");

  for (const rec of filtered) {
    const direct =
      (itemMatches(a, rec.principio_ativo_a, rec.medicamento_a) &&
        itemMatches(b, rec.principio_ativo_b, rec.medicamento_b)) ||
      (itemMatches(b, rec.principio_ativo_a, rec.medicamento_a) &&
        itemMatches(a, rec.principio_ativo_b, rec.medicamento_b));
    if (direct) return rec;

    const byClass =
      (classMatches(a, rec.classe_a) && classMatches(b, rec.classe_b)) ||
      (classMatches(b, rec.classe_a) && classMatches(a, rec.classe_b));
    if (byClass && (rec.classe_a || rec.classe_b)) return rec;
  }
  return null;
}

export function detectDuplicates(items: PrescItem[]): DuplicateFinding[] {
  const groups = new Map<string, PrescItem[]>();
  for (const it of items) {
    if (it.permite_duplicidade_mesma_classe) continue;
    const key = normalize(it.subclasse_terapeutica || it.classe_terapeutica || "");
    if (!key) continue;
    const arr = groups.get(key) || [];
    arr.push(it);
    groups.set(key, arr);
  }
  const out: DuplicateFinding[] = [];
  for (const arr of groups.values()) {
    if (arr.length >= 2) {
      out.push({
        itens: arr,
        classe: arr[0].classe_terapeutica || "",
        subclasse: arr[0].subclasse_terapeutica || null,
        observacao: arr.find((x) => x.observacao_duplicidade)?.observacao_duplicidade || null,
      });
    }
  }
  return out;
}

function classify(soma: number): AccumulatedRisk["classificacao"] {
  if (soma >= 6) return "muito_alto";
  if (soma >= 4) return "alto";
  if (soma >= 2) return "moderado";
  return "baixo";
}

export function aggregateCategoryRisk(items: PrescItem[]): AccumulatedRisk[] {
  return RISK_CATEGORIES.map(({ key, label }) => {
    let soma = 0;
    const contribuintes: AccumulatedRisk["contribuintes"] = [];
    const desconhecidos: AccumulatedRisk["desconhecidos"] = [];
    for (const it of items) {
      const lvl = it.riscos[key] || "desconhecido";
      const v = RISK_VALUE[lvl];
      if (v === null) {
        desconhecidos.push({ id: it.id, principio_ativo: it.principio_ativo });
      } else if (v > 0) {
        soma += v;
        contribuintes.push({ id: it.id, principio_ativo: it.principio_ativo, nivel: lvl });
      }
    }
    return { categoria: key, label, soma, classificacao: classify(soma), contribuintes, desconhecidos };
  });
}

function severityToAlertLevel(sev: InteractionSeverity): InteractionAlertLevel {
  if (sev === "contraindicada") return "critico";
  if (sev === "grave") return "alto";
  if (sev === "moderada") return "atencao";
  return "informativo";
}

export function analyzePrescription(args: {
  items: PrescItem[];
  base: InteractionRecord[];
  settings?: InteractionsSettings;
  patient?: PatientCtx;
}): AnalysisResult {
  const settings = args.settings || DEFAULT_SETTINGS;
  const patient = args.patient || {};
  const items = args.items;

  // Pair interactions
  const interacoes: PairInteractionFinding[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const rec = findPairInteraction(items[i], items[j], args.base, settings);
      if (rec) interacoes.push({ itemA: items[i], itemB: items[j], record: rec });
    }
  }

  const duplicidades = settings.alertar_duplicidade ? detectDuplicates(items) : [];
  const riscos = aggregateCategoryRisk(items);

  const alertas_gerais: GeneralAlert[] = [];
  const monitorizacao_sugerida: string[] = [];
  const bloqueios: AnalysisResult["bloqueios"] = [];
  const pendencias_justificativa: AnalysisResult["pendencias_justificativa"] = [];

  // Specific interaction → alerts/blocks/justifications
  for (const f of interacoes) {
    const lvl = f.record.nivel_alerta || severityToAlertLevel(f.record.gravidade);
    const msg = f.record.mensagem_medico
      ? `Interação relevante entre ${f.itemA.principio_ativo} e ${f.itemB.principio_ativo}: ${f.record.mensagem_medico}`
      : `Interação ${f.record.gravidade} entre ${f.itemA.principio_ativo} e ${f.itemB.principio_ativo}.`;
    alertas_gerais.push({
      id: `int-${f.record.id}`,
      nivel: lvl,
      mensagem: msg,
      exige_justificativa:
        f.record.exige_justificativa ||
        (settings.exigir_just_interacao_grave && (f.record.gravidade === "grave" || f.record.gravidade === "contraindicada")),
    });
    if (f.record.monitorizacao_recomendada) monitorizacao_sugerida.push(f.record.monitorizacao_recomendada);
    const itens = [f.itemA.principio_ativo, f.itemB.principio_ativo];
    if (f.record.bloqueio_absoluto && f.record.gravidade === "contraindicada" && settings.bloquear_contraindicada) {
      bloqueios.push({ mensagem: msg, itens });
    } else if (f.record.exige_justificativa || (settings.exigir_just_interacao_grave && f.record.gravidade === "grave")) {
      pendencias_justificativa.push({ mensagem: msg, itens });
    }
  }

  // Duplicates
  for (const d of duplicidades) {
    alertas_gerais.push({
      id: `dup-${d.classe}-${d.subclasse || ""}`,
      nivel: "atencao",
      mensagem: `Possível duplicidade terapêutica (${d.subclasse || d.classe}): ${d.itens.map((i) => i.principio_ativo).join(" + ")}.`,
      detalhes: d.observacao ? [d.observacao] : undefined,
      exige_justificativa: settings.exigir_just_duplicidade_alto_risco && /opioide|benzodiazepin|anticoagulante|antiarritmico/i.test(d.subclasse || d.classe || ""),
    });
  }

  // Accumulated risks (blocks 7–13)
  if (settings.mostrar_risco_acumulado) {
    for (const r of riscos) {
      if (r.classificacao !== "alto" && r.classificacao !== "muito_alto") continue;
      const baseDetails: string[] = [];
      let nivel: InteractionAlertLevel = r.classificacao === "muito_alto" ? "alto" : "atencao";
      let mensagem = `Risco acumulado de ${r.label.toLowerCase()}: ${r.classificacao.replace("_", " ")}.`;

      if (r.categoria === "qt") {
        mensagem = "Prescrição com risco acumulado de prolongamento do QT. Avaliar fatores de risco, ECG e eletrólitos conforme contexto clínico.";
        if (patient.potassio == null) baseDetails.push("Eletrólitos não informados para avaliação de risco de QT.");
      }
      if (r.categoria === "nefrotoxico") {
        mensagem = "Risco nefrotóxico acumulado. Avaliar função renal, hidratação, dose, tempo de uso e monitorização.";
        if (patient.clcr != null && patient.clcr < 30) {
          mensagem = "Risco nefrotóxico acumulado em paciente com função renal reduzida.";
          nivel = "critico";
        }
      }
      if (r.categoria === "hemorragico") {
        mensagem = "Risco hemorrágico acumulado. Revisar associação medicamentosa, indicação, INR/plaquetas e sinais de sangramento.";
        if (patient.inr == null && patient.plaquetas == null)
          baseDetails.push("Exames laboratoriais relevantes não informados para avaliação de risco hemorrágico.");
      }
      if (r.categoria === "sedacao" || r.categoria === "depressao_respiratoria") {
        mensagem = "Risco acumulado de sedação/depressão respiratória. Avaliar dose, associação, idade, comorbidades, nível de consciência e monitorização.";
        if ((patient.idade_anos != null && (patient.idade_anos >= 65 || patient.idade_anos < 12)) || patient.doenca_respiratoria) {
          nivel = "critico";
        }
      }
      if (r.categoria === "serotoninergico") {
        mensagem = "Risco serotoninérgico acumulado. Revisar associação medicamentosa e monitorar sinais clínicos conforme contexto.";
      }
      if (r.categoria === "hipercalemia") {
        mensagem = "Risco acumulado de hipercalemia. Avaliar potássio, função renal e medicamentos associados.";
        if (patient.potassio != null && patient.potassio > 5.0) nivel = "critico";
      }
      if (r.categoria === "hipocalemia") {
        mensagem = "Risco acumulado de hipocalemia. Avaliar potássio e necessidade de monitorização.";
      }
      if (r.categoria === "hipotensao" || r.categoria === "bradicardia") {
        mensagem = "Risco acumulado de hipotensão/bradicardia. Avaliar sinais vitais, dose, associação medicamentosa e monitorização.";
        if (patient.pressao_sistolica != null) baseDetails.push(`PA sistólica: ${patient.pressao_sistolica} mmHg`);
        if (patient.freq_cardiaca != null) baseDetails.push(`FC: ${patient.freq_cardiaca} bpm`);
      }

      alertas_gerais.push({
        id: `risk-${r.categoria}`,
        categoria: r.categoria,
        nivel,
        mensagem,
        detalhes: baseDetails.length ? baseDetails : undefined,
        exige_justificativa: settings.exigir_just_risco_muito_alto && r.classificacao === "muito_alto",
      });
      if (r.classificacao === "muito_alto" && settings.exigir_just_risco_muito_alto) {
        pendencias_justificativa.push({
          mensagem: `Justificativa para risco acumulado muito alto: ${r.label}.`,
          itens: r.contribuintes.map((c) => c.principio_ativo),
        });
      }
    }
  }

  const altos = alertas_gerais.filter((a) => a.nivel === "alto").length;
  const criticos = alertas_gerais.filter((a) => a.nivel === "critico").length;

  return {
    interacoes,
    duplicidades,
    riscos_acumulados: riscos,
    alertas_gerais,
    monitorizacao_sugerida: Array.from(new Set(monitorizacao_sugerida)),
    bloqueios,
    pendencias_justificativa,
    contadores: {
      interacoes: interacoes.length,
      duplicidades: duplicidades.length,
      alertas_altos: altos,
      criticos,
    },
  };
}
