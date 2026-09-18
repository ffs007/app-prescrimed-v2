// Clinical alerts analysis engine (pure functions)

export type AllergyRecordType = "alergia_confirmada" | "suspeita_alergia" | "intolerancia" | "efeito_adverso" | "desconhecido";
export type AllergySeverity = "leve" | "moderada" | "grave" | "anafilaxia" | "desconhecida";
export type AllergyReactionType = "rash_urticaria" | "angioedema" | "broncoespasmo" | "anafilaxia" | "nausea_intolerancia" | "reacao_cutanea_grave" | "desconhecida" | "outro";
export type ContraindicationType =
  | "alergia_principio_ativo" | "alergia_classe" | "gestacao" | "lactacao" | "idade"
  | "comorbidade" | "diagnostico_cid" | "condicao_clinica" | "funcao_renal" | "funcao_hepatica"
  | "historico_reacao_adversa" | "outro";
export type PregnancyAlertLevel = "nao_cadastrado" | "permitido_com_criterio" | "atencao" | "evitar" | "contraindicado";
export type LactationAlertLevel = "nao_cadastrado" | "compativel" | "usar_com_cautela" | "evitar" | "contraindicado";
export type ClinicalAlertKind =
  | "alergia_principio_ativo" | "alergia_classe" | "reacao_cruzada" | "gestacao" | "lactacao"
  | "idade" | "comorbidade" | "cid" | "restricao_paciente" | "historico_reacao_adversa";
export type AlertLevel = "informativo" | "atencao" | "alto" | "critico";
export type Severity = "leve" | "moderada" | "grave" | "contraindicada";
export type RiskLevel = "nenhum" | "baixo" | "moderado" | "alto" | "desconhecido";

export interface PatientAllergy {
  principio_ativo?: string | null;
  tipo_registro?: AllergyRecordType;
  gravidade?: AllergySeverity;
  tipo_reacao?: AllergyReactionType;
  data?: string | null;
  observacao?: string | null;
}

export interface PatientProfile {
  id_paciente: string;
  alergias_medicamentosas: PatientAllergy[];
  alergias_classes_medicamentosas: string[];
  alergias_outros: string[];
  gestante: boolean;
  trimestre_gestacional?: "qualquer" | "primeiro" | "segundo" | "terceiro" | "nao_aplicavel" | null;
  lactante: boolean;
  idade_anos?: number | null;
  comorbidades: string[];
  diagnosticos_cid: string[];
  condicoes_clinicas_relevantes: string[];
  restricoes_medicamentosas: string[];
  observacoes_clinicas_paciente?: string | null;
}

export interface MedicationInfo {
  id: string;
  principio_ativo: string;
  principio_ativo_normalizado?: string | null;
  classe_terapeutica?: string | null;
  subclasse_terapeutica?: string | null;
  familia_medicamentosa?: string | null;
  grupo_alergia?: string | null;
  risco_reacao_cruzada?: RiskLevel;
  observacao_reacao_cruzada?: string | null;
  contraindicado_gestacao?: boolean;
  alerta_gestacao?: PregnancyAlertLevel;
  exige_justificativa_gestacao?: boolean;
  observacao_gestacao?: string | null;
  contraindicado_lactacao?: boolean;
  alerta_lactacao?: LactationAlertLevel;
  exige_justificativa_lactacao?: boolean;
  observacao_lactacao?: string | null;
  idade_minima?: number | null;
  idade_maxima?: number | null;
  contraindicado_abaixo_idade?: boolean;
  contraindicado_acima_idade?: boolean;
  observacao_idade?: string | null;
  nomes_comerciais?: string[];
  sinonimos?: string[];
}

export interface ContraindicationRecord {
  id: string;
  principio_ativo?: string | null;
  principio_ativo_normalizado?: string | null;
  nomes_comerciais?: string[];
  classe_terapeutica?: string | null;
  tipo_contraindicacao: ContraindicationType;
  condicao_clinica?: string | null;
  cid_relacionado?: string | null;
  grupo_cid?: string | null;
  gravidade: Severity;
  nivel_alerta: AlertLevel;
  mecanismo_ou_motivo?: string | null;
  mensagem_medico?: string | null;
  conduta_sugerida?: string | null;
  exige_justificativa: boolean;
  bloqueio_absoluto: boolean;
  populacoes_afetadas?: string[];
  idade_min?: number | null;
  idade_max?: number | null;
  fonte_referencia?: string | null;
  status_revisao: string;
}

export interface RestrictionRecord {
  id: string;
  id_paciente: string;
  principio_ativo?: string | null;
  classe_terapeutica?: string | null;
  grupo_alergia?: string | null;
  texto_restricao: string;
  gravidade: Severity;
  motivo?: string | null;
  ativa: boolean;
}

export interface ClinicalSettings {
  usar_apenas_revisadas: boolean;
  bloquear_alergia_grave_pa: boolean;
  exigir_just_alergia_suspeita: boolean;
  diferenciar_intolerancia_alergia: boolean;
  exigir_just_gestacao: boolean;
  exigir_just_lactacao: boolean;
  exigir_just_comorbidade_grave: boolean;
  ocultar_sem_fonte_uso_clinico: boolean;
  permitir_restricoes_paciente: boolean;
}

export const DEFAULT_CLINICAL_SETTINGS: ClinicalSettings = {
  usar_apenas_revisadas: true,
  bloquear_alergia_grave_pa: true,
  exigir_just_alergia_suspeita: true,
  diferenciar_intolerancia_alergia: true,
  exigir_just_gestacao: true,
  exigir_just_lactacao: true,
  exigir_just_comorbidade_grave: true,
  ocultar_sem_fonte_uso_clinico: true,
  permitir_restricoes_paciente: true,
};

export interface ClinicalAlert {
  id: string;
  med_id: string;
  tipo: ClinicalAlertKind;
  nivel: AlertLevel;
  gravidade: Severity;
  mensagem: string;
  detalhes?: string[];
  exige_justificativa?: boolean;
  bloqueia?: boolean;
  fonte?: string | null;
}

export interface MedAlertResult {
  med_id: string;
  alertas: ClinicalAlert[];
  badges: string[];
  bloqueios: ClinicalAlert[];
  pendencias_justificativa: ClinicalAlert[];
}

export interface PrescAlertResult {
  por_medicamento: MedAlertResult[];
  todos_alertas: ClinicalAlert[];
  bloqueios: ClinicalAlert[];
  pendencias_justificativa: ClinicalAlert[];
  contadores: {
    alergias: number;
    contraindicacoes: number;
    altos: number;
    criticos: number;
  };
}

export function normalize(s?: string | null): string {
  if (!s) return "";
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

function eq(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return normalize(a) === normalize(b);
}

function listIncludes(list: string[] | undefined, target?: string | null): boolean {
  if (!list?.length || !target) return false;
  const t = normalize(target);
  return list.some((x) => normalize(x) === t);
}

function severityToLevel(sev: AllergySeverity): AlertLevel {
  if (sev === "anafilaxia" || sev === "grave") return "critico";
  if (sev === "moderada") return "alto";
  return "atencao";
}

function recordSeverity(sev: AllergySeverity): Severity {
  if (sev === "anafilaxia" || sev === "grave") return "contraindicada";
  if (sev === "moderada") return "grave";
  return "moderada";
}

export function analyzeMedication(args: {
  med: MedicationInfo;
  patient: PatientProfile;
  base: ContraindicationRecord[];
  restrictions: RestrictionRecord[];
  settings?: ClinicalSettings;
}): MedAlertResult {
  const { med, patient } = args;
  const settings = args.settings || DEFAULT_CLINICAL_SETTINGS;
  const baseFiltered = settings.usar_apenas_revisadas
    ? args.base.filter((r) => r.status_revisao === "revisado")
    : args.base.filter((r) => r.status_revisao !== "inativo");

  const alertas: ClinicalAlert[] = [];
  const badges = new Set<string>();
  const principio = med.principio_ativo_normalizado || normalize(med.principio_ativo);

  // 5. Alergia ao princípio ativo / nomes comerciais
  for (const al of patient.alergias_medicamentosas || []) {
    if (!al.principio_ativo) continue;
    const targetMatch = eq(al.principio_ativo, med.principio_ativo)
      || listIncludes(med.nomes_comerciais, al.principio_ativo)
      || listIncludes(med.sinonimos, al.principio_ativo);
    if (!targetMatch) continue;

    const tipo = al.tipo_registro || "desconhecido";
    const gravidade = al.gravidade || "desconhecida";
    let nivel: AlertLevel = severityToLevel(gravidade);
    let mensagem = `Paciente possui alergia registrada a ${al.principio_ativo}. Revise antes de finalizar.`;
    let bloqueia = false;
    let exige = false;

    if (tipo === "alergia_confirmada" && (gravidade === "grave" || gravidade === "anafilaxia")) {
      bloqueia = settings.bloquear_alergia_grave_pa;
      exige = !bloqueia;
    } else if (tipo === "suspeita_alergia") {
      nivel = "alto";
      exige = settings.exigir_just_alergia_suspeita;
    } else if (tipo === "intolerancia" && settings.diferenciar_intolerancia_alergia) {
      nivel = "atencao";
      mensagem = `Paciente registrou intolerância a ${al.principio_ativo}. Avaliar antes de prescrever.`;
    }

    alertas.push({
      id: `alergia-pa-${med.id}-${normalize(al.principio_ativo)}`,
      med_id: med.id, tipo: "alergia_principio_ativo",
      nivel, gravidade: recordSeverity(gravidade),
      mensagem,
      detalhes: [
        `Tipo de reação: ${al.tipo_reacao || "—"}`,
        `Gravidade: ${gravidade}`,
        al.data ? `Data: ${al.data}` : "",
        al.observacao ? `Obs: ${al.observacao}` : "",
      ].filter(Boolean),
      exige_justificativa: exige,
      bloqueia,
    });
    badges.add("Alergia");
  }

  // 6. Alergia por classe / grupo
  if (med.classe_terapeutica && listIncludes(patient.alergias_classes_medicamentosas, med.classe_terapeutica)) {
    alertas.push({
      id: `alergia-classe-${med.id}`,
      med_id: med.id, tipo: "alergia_classe", nivel: "alto", gravidade: "grave",
      mensagem: `Paciente possui alergia registrada à classe ${med.classe_terapeutica}.`,
      exige_justificativa: true,
    });
    badges.add("Alergia");
  }
  // Reação cruzada por grupo_alergia (apenas se houver risco cadastrado)
  if (med.grupo_alergia && (med.risco_reacao_cruzada && med.risco_reacao_cruzada !== "desconhecido")) {
    if (listIncludes(patient.alergias_classes_medicamentosas, med.grupo_alergia)) {
      const r = med.risco_reacao_cruzada;
      const nivel: AlertLevel = r === "alto" ? "alto" : r === "moderado" ? "atencao" : "informativo";
      alertas.push({
        id: `reacao-cruzada-${med.id}`,
        med_id: med.id, tipo: "reacao_cruzada", nivel,
        gravidade: r === "alto" ? "grave" : r === "moderado" ? "moderada" : "leve",
        mensagem: `Paciente tem alergia ao grupo ${med.grupo_alergia}. Risco de reação cruzada: ${r}.`,
        detalhes: med.observacao_reacao_cruzada ? [med.observacao_reacao_cruzada] : undefined,
        exige_justificativa: r === "alto",
      });
      badges.add("Alergia");
    }
  }

  // 7. Gestação
  if (patient.gestante) {
    if (med.contraindicado_gestacao || med.alerta_gestacao === "contraindicado" || med.alerta_gestacao === "evitar") {
      alertas.push({
        id: `gestacao-${med.id}`,
        med_id: med.id, tipo: "gestacao",
        nivel: med.contraindicado_gestacao ? "critico" : "alto",
        gravidade: med.contraindicado_gestacao ? "contraindicada" : "grave",
        mensagem: "Medicamento possui contraindicação/alerta importante na gestação conforme cadastro.",
        detalhes: med.observacao_gestacao ? [med.observacao_gestacao] : undefined,
        exige_justificativa: med.exige_justificativa_gestacao || settings.exigir_just_gestacao,
        bloqueia: false,
      });
      badges.add("Gestação");
    } else if (med.alerta_gestacao === "nao_cadastrado") {
      alertas.push({
        id: `gestacao-info-${med.id}`,
        med_id: med.id, tipo: "gestacao", nivel: "informativo", gravidade: "leve",
        mensagem: "Informação de gestação não cadastrada para este medicamento. Validar manualmente.",
      });
    }
  }

  // 8. Lactação
  if (patient.lactante) {
    if (med.contraindicado_lactacao || med.alerta_lactacao === "contraindicado" || med.alerta_lactacao === "evitar") {
      alertas.push({
        id: `lactacao-${med.id}`,
        med_id: med.id, tipo: "lactacao",
        nivel: med.contraindicado_lactacao ? "critico" : "alto",
        gravidade: med.contraindicado_lactacao ? "contraindicada" : "grave",
        mensagem: "Medicamento possui contraindicação/alerta importante na lactação conforme cadastro.",
        detalhes: med.observacao_lactacao ? [med.observacao_lactacao] : undefined,
        exige_justificativa: med.exige_justificativa_lactacao || settings.exigir_just_lactacao,
      });
      badges.add("Lactação");
    } else if (med.alerta_lactacao === "nao_cadastrado") {
      alertas.push({
        id: `lactacao-info-${med.id}`,
        med_id: med.id, tipo: "lactacao", nivel: "informativo", gravidade: "leve",
        mensagem: "Informação de lactação não cadastrada para este medicamento. Validar manualmente.",
      });
    }
  }

  // 9. Idade
  if (patient.idade_anos != null) {
    const minOk = med.idade_minima == null || patient.idade_anos >= med.idade_minima;
    const maxOk = med.idade_maxima == null || patient.idade_anos <= med.idade_maxima;
    if (!minOk || !maxOk) {
      const bloqueia = (!minOk && !!med.contraindicado_abaixo_idade) || (!maxOk && !!med.contraindicado_acima_idade);
      alertas.push({
        id: `idade-${med.id}`,
        med_id: med.id, tipo: "idade",
        nivel: bloqueia ? "alto" : "atencao",
        gravidade: bloqueia ? "grave" : "moderada",
        mensagem: `Paciente fora da faixa etária cadastrada para este medicamento (idade ${patient.idade_anos} anos; faixa ${med.idade_minima ?? "—"}–${med.idade_maxima ?? "—"}).`,
        detalhes: med.observacao_idade ? [med.observacao_idade] : undefined,
        exige_justificativa: bloqueia,
      });
      badges.add("Idade");
    }
  }

  // 10/11. Comorbidades / CID via base de contraindicações
  for (const rec of baseFiltered) {
    const matchesMed =
      eq(rec.principio_ativo, med.principio_ativo) ||
      eq(rec.classe_terapeutica, med.classe_terapeutica) ||
      listIncludes(rec.nomes_comerciais, med.principio_ativo);
    if (!matchesMed) continue;

    let matchedCondition: string | null = null;
    let kind: ClinicalAlertKind | null = null;

    if (rec.tipo_contraindicacao === "comorbidade" || rec.tipo_contraindicacao === "condicao_clinica") {
      const found = (patient.comorbidades.concat(patient.condicoes_clinicas_relevantes))
        .find((c) => eq(c, rec.condicao_clinica));
      if (found) { matchedCondition = found; kind = "comorbidade"; }
    } else if (rec.tipo_contraindicacao === "diagnostico_cid") {
      const found = patient.diagnosticos_cid.find((c) => eq(c, rec.cid_relacionado));
      if (found) { matchedCondition = found; kind = "cid"; }
    } else if (rec.tipo_contraindicacao === "gestacao" && patient.gestante) {
      matchedCondition = "gestação"; kind = "gestacao";
    } else if (rec.tipo_contraindicacao === "lactacao" && patient.lactante) {
      matchedCondition = "lactação"; kind = "lactacao";
    } else if (rec.tipo_contraindicacao === "idade" && patient.idade_anos != null) {
      const out = (rec.idade_min != null && patient.idade_anos < rec.idade_min) ||
        (rec.idade_max != null && patient.idade_anos > rec.idade_max);
      if (out) { matchedCondition = `${patient.idade_anos} anos`; kind = "idade"; }
    } else if (rec.tipo_contraindicacao === "alergia_principio_ativo") {
      const hit = patient.alergias_medicamentosas.find((a) => eq(a.principio_ativo, rec.principio_ativo));
      if (hit) { matchedCondition = `alergia a ${rec.principio_ativo}`; kind = "alergia_principio_ativo"; }
    } else if (rec.tipo_contraindicacao === "alergia_classe") {
      if (listIncludes(patient.alergias_classes_medicamentosas, rec.classe_terapeutica)) {
        matchedCondition = `alergia à classe ${rec.classe_terapeutica}`; kind = "alergia_classe";
      }
    }

    if (matchedCondition && kind) {
      const exige = rec.exige_justificativa ||
        (kind === "comorbidade" && settings.exigir_just_comorbidade_grave && (rec.gravidade === "grave" || rec.gravidade === "contraindicada"));
      alertas.push({
        id: `contra-${rec.id}-${med.id}`,
        med_id: med.id, tipo: kind, nivel: rec.nivel_alerta, gravidade: rec.gravidade,
        mensagem: rec.mensagem_medico
          || `Medicamento possui alerta cadastrado para paciente com ${matchedCondition}.`,
        detalhes: [
          rec.mecanismo_ou_motivo ? `Motivo: ${rec.mecanismo_ou_motivo}` : "",
          rec.conduta_sugerida ? `Conduta: ${rec.conduta_sugerida}` : "",
          rec.fonte_referencia ? `Fonte: ${rec.fonte_referencia}` : "",
        ].filter(Boolean),
        exige_justificativa: exige,
        bloqueia: rec.bloqueio_absoluto,
        fonte: rec.fonte_referencia || null,
      });
      if (kind === "comorbidade") badges.add("Comorbidade");
      if (kind === "cid") badges.add("CID");
      if (kind === "gestacao") badges.add("Gestação");
      if (kind === "lactacao") badges.add("Lactação");
      if (kind === "idade") badges.add("Idade");
      if (kind === "alergia_principio_ativo" || kind === "alergia_classe") badges.add("Alergia");
    }
  }

  // 12. Restrições do paciente
  if (settings.permitir_restricoes_paciente) {
    for (const r of args.restrictions) {
      if (!r.ativa || r.id_paciente !== patient.id_paciente) continue;
      const match =
        eq(r.principio_ativo, med.principio_ativo) ||
        eq(r.classe_terapeutica, med.classe_terapeutica) ||
        eq(r.grupo_alergia, med.grupo_alergia);
      if (!match) continue;
      alertas.push({
        id: `restr-${r.id}-${med.id}`,
        med_id: med.id, tipo: "restricao_paciente",
        nivel: r.gravidade === "contraindicada" ? "critico" : r.gravidade === "grave" ? "alto" : "atencao",
        gravidade: r.gravidade,
        mensagem: `Paciente possui restrição específica cadastrada: ${r.texto_restricao}.`,
        detalhes: r.motivo ? [r.motivo] : undefined,
        exige_justificativa: r.gravidade === "grave" || r.gravidade === "contraindicada",
      });
      badges.add("Restrição");
    }
  }

  const bloqueios = alertas.filter((a) => a.bloqueia);
  const pendencias_justificativa = alertas.filter((a) => a.exige_justificativa && !a.bloqueia);

  return { med_id: med.id, alertas, badges: Array.from(badges), bloqueios, pendencias_justificativa };
}

export function analyzePrescription(args: {
  meds: MedicationInfo[];
  patient: PatientProfile;
  base: ContraindicationRecord[];
  restrictions: RestrictionRecord[];
  settings?: ClinicalSettings;
}): PrescAlertResult {
  const por_medicamento = args.meds.map((med) => analyzeMedication({ ...args, med }));
  const todos = por_medicamento.flatMap((m) => m.alertas);
  const altos = todos.filter((a) => a.nivel === "alto").length;
  const criticos = todos.filter((a) => a.nivel === "critico").length;
  const alergias = todos.filter((a) => a.tipo === "alergia_principio_ativo" || a.tipo === "alergia_classe" || a.tipo === "reacao_cruzada").length;
  const contraindicacoes = todos.filter((a) => a.tipo === "comorbidade" || a.tipo === "cid" || a.tipo === "gestacao" || a.tipo === "lactacao" || a.tipo === "idade").length;
  return {
    por_medicamento,
    todos_alertas: todos,
    bloqueios: por_medicamento.flatMap((m) => m.bloqueios),
    pendencias_justificativa: por_medicamento.flatMap((m) => m.pendencias_justificativa),
    contadores: { alergias, contraindicacoes, altos, criticos },
  };
}
