// Regras de qualidade da Base Geral de Medicamentos — puro, sem side effects.

export type Gravidade = "critico" | "alto" | "medio" | "leve" | "sugestao";

export type MedFull = {
  id: string;
  principio_ativo: string;
  principio_ativo_dcb: string | null;
  nome_normalizado: string | null;
  nome_comercial_referencia: string | null;
  nomes_comerciais: string[] | null;
  sinonimos: string[] | null;
  classe_terapeutica: string | null;
  subclasse_terapeutica: string | null;
  categoria_clinica: string | null;
  forma_farmaceutica: string | null;
  apresentacao: string | null;
  concentracao: string | null;
  via_administracao: string | null;
  uso_em_urgencia: boolean | null;
  uso_emergencia: boolean | null;
  medicamento_injetavel: boolean | null;
  medicamento_oral: boolean | null;
  medicamento_controlado: boolean | null;
  antimicrobiano: boolean | null;
  tipo_receita: string | null;
  exige_receita_especial: boolean | null;
  exige_retencao_receita: boolean | null;
  dose_adulto_padrao: string | null;
  dose_pediatrica_padrao: string | null;
  dose_maxima_adulto: string | null;
  dose_maxima_pediatrica: string | null;
  unidade_dose: string | null;
  frequencia_padrao: string | null;
  duracao_padrao: string | null;
  observacao_posologia: string | null;
  exige_peso: boolean | null;
  exige_ajuste_renal: boolean | null;
  exige_ajuste_hepatico: boolean | null;
  alerta_gestacao: string | null;
  alerta_lactacao: string | null;
  alerta_alergia_classe: string | null;
  vinculo_iv_medication_id: string | null;
  cid_relacionados: string[] | null;
  queixas_relacionadas: string[] | null;
  protocolos_relacionados: string[] | null;
  modelos_rapidos_relacionados: string[] | null;
  termos_busca: string[] | null;
  abreviacoes: string[] | null;
  nomes_populares: string[] | null;
  prioridade_mvp: string | null;
  status_revisao: string | null;
  fonte_referencia: string | null;
  ativo: boolean | null;
};

export type ModeloItem = {
  id: string;
  id_modelo: string;
  id_medicamento: string | null;
  principio_ativo: string | null;
  dose: string | null;
  fonte_referencia: string | null;
};
export type Modelo = {
  id: string;
  nome_modelo: string;
  categoria_modelo: string | null;
  contexto: string | null;
  fonte_referencia: string | null;
  status_revisao: string | null;
  ativo: boolean | null;
};

export type Categoria =
  | "erro_critico" | "alerta_alto" | "alerta_medio" | "pendencia_leve"
  | "sugestao" | "duplicidade" | "modelo_rapido" | "alto_risco"
  | "controlado" | "antimicrobiano" | "injetavel_iv";

export type Finding = {
  key: string;
  medicamento_id: string | null;
  principio_ativo: string;
  rule_code: string;
  gravidade: Gravidade;
  categoria: Categoria;
  mensagem: string;
  acao: string;
  ref_id?: string;
  ref_label?: string;
};

// Lista curada de alto risco (ISMP-BR resumida)
export const ALTO_RISCO_PA = [
  "adrenalina","epinefrina","noradrenalina","norepinefrina",
  "nitroprussiato de sodio","amiodarona","adenosina",
  "insulina regular","insulina nph","insulina","cloreto de potassio","potassio cloreto",
  "sulfato de magnesio","magnesio sulfato","bicarbonato de sodio","gluconato de calcio","calcio gluconato",
  "fenitoina","midazolam","diazepam","morfina","tramadol","fenobarbital",
  "fentanila","fentanil","dobutamina","dopamina","vasopressina","heparina","enoxaparina",
  "warfarina","varfarina","metadona","oxicodona","cetamina","propofol",
];

// Antibióticos comuns para sugerir marcação de antimicrobiano
const ANTIBIOTICO_HEURISTICA = [
  "amoxicilina","ampicilina","penicilina","cefalexina","cefaclor","cefuroxima","ceftriaxona",
  "cefepima","cefotaxima","cefazolina","azitromicina","claritromicina","eritromicina",
  "ciprofloxacino","levofloxacino","norfloxacino","moxifloxacino","gentamicina","amicacina",
  "vancomicina","teicoplanina","meropenem","imipenem","ertapenem","piperacilina",
  "sulfametoxazol","trimetoprima","metronidazol","clindamicina","doxiciclina","tetraciclina",
  "nitrofurantoina","fosfomicina","linezolida","daptomicina","tigeciclina","tazobactam",
];

export const norm = (s?: string | null) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tem = (v: any) => v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : typeof v === "string" ? v.trim().length > 0 : true);
const isPreenchido = (s?: string | null) => tem(s) && !/nao informado|não informado|indefinido/i.test(String(s ?? ""));

const mk = (m: MedFull, rule: string, cat: Categoria, gr: Gravidade, msg: string, acao: string, ref?: string): Finding => ({
  key: `${m.id}::${rule}${ref ? "::" + ref : ""}`,
  medicamento_id: m.id,
  principio_ativo: m.principio_ativo,
  rule_code: rule,
  gravidade: gr,
  categoria: cat,
  mensagem: msg,
  acao,
  ref_id: ref,
});

const isAltoRisco = (m: MedFull) => {
  const n = norm(m.principio_ativo);
  return ALTO_RISCO_PA.some(p => n.includes(p));
};

const isProntoBeta = (m: MedFull) =>
  (m.status_revisao === "aguardando_revisao" || m.status_revisao === "revisado") &&
  m.ativo !== false;

export function analisarMedicamento(m: MedFull): Finding[] {
  const out: Finding[] = [];

  // === Erros críticos ===
  if (m.ativo && !tem(m.principio_ativo))
    out.push(mk(m, "critico_sem_principio", "erro_critico", "critico", "Medicamento ativo sem princípio ativo.", "Preencher princípio ativo"));

  if (isProntoBeta(m) && !tem(m.apresentacao))
    out.push(mk(m, "critico_pronto_sem_apresentacao", "erro_critico", "critico",
      "Medicamento marcado como pronto beta, mas sem apresentação principal cadastrada.", "Cadastrar apresentação"));

  if (isProntoBeta(m) && !tem(m.via_administracao))
    out.push(mk(m, "critico_pronto_sem_via", "erro_critico", "critico",
      "Medicamento marcado como pronto beta, mas sem via de administração.", "Definir via"));

  if (m.status_revisao === "revisado" && !tem(m.fonte_referencia))
    out.push(mk(m, "critico_revisado_sem_fonte", "erro_critico", "critico",
      "Medicamento marcado como revisado, mas sem fonte de referência.", "Registrar fonte"));

  const temDose = tem(m.dose_adulto_padrao) || tem(m.dose_pediatrica_padrao) || tem(m.dose_maxima_adulto) || tem(m.dose_maxima_pediatrica);
  if (temDose && !tem(m.fonte_referencia))
    out.push(mk(m, "critico_dose_sem_fonte", "erro_critico", "critico",
      "Dose/posologia preenchida sem fonte de referência.", "Registrar fonte da dose"));

  if (m.medicamento_controlado && !isPreenchido(m.tipo_receita))
    out.push(mk(m, "critico_controlado_sem_tipo_receita", "controlado", "critico",
      "Medicamento controlado sem tipo de receita definido.", "Definir tipo_receita"));

  if (m.antimicrobiano && !(m.tipo_receita === "antimicrobiano" || m.exige_retencao_receita))
    out.push(mk(m, "critico_antimicrobiano_sem_documento", "antimicrobiano", "critico",
      "Antimicrobiano sem configuração de receita/documento.", "Ajustar tipo_receita ou retenção"));

  const alto = isAltoRisco(m);
  if (alto && !tem(m.alerta_alergia_classe) && !tem(m.observacao_posologia))
    out.push(mk(m, "critico_alto_risco_sem_alerta", "alto_risco", "critico",
      "Medicamento de alto risco sem alerta de segurança cadastrado.", "Adicionar alerta de segurança"));

  if (alto && m.medicamento_injetavel && !m.vinculo_iv_medication_id)
    out.push(mk(m, "critico_alto_risco_iv_sem_seguranca", "injetavel_iv", "critico",
      "Medicamento injetável de alto risco sem vínculo com Segurança IV.", "Vincular à Base IV"));

  if (tem(m.dose_pediatrica_padrao) && /kg|\/kg/i.test(String(m.dose_pediatrica_padrao)) && !m.exige_peso)
    out.push(mk(m, "critico_dose_kg_sem_exigir_peso", "erro_critico", "critico",
      "Medicamento com dose por peso não exige peso no cálculo.", "Marcar exige_peso"));

  // === Alertas altos ===
  if (m.status_revisao === "rascunho" && (m.prioridade_mvp === "essencial" || m.prioridade_mvp === "alta"))
    out.push(mk(m, "alto_essencial_em_rascunho", "alerta_alto", "alto",
      "Medicamento essencial/alta prioridade ainda em rascunho seguro.", "Enviar para revisão"));

  if ((m.uso_emergencia) && !(m.prioridade_mvp === "essencial" || m.prioridade_mvp === "alta"))
    out.push(mk(m, "alto_emergencia_sem_prioridade", "alerta_alto", "alto",
      "Medicamento de emergência sem prioridade_mvp essencial/alta.", "Elevar prioridade_mvp"));

  if (alto && !tem(m.observacao_posologia) && !tem(m.alerta_alergia_classe))
    out.push(mk(m, "alto_altorisco_sem_observacao", "alto_risco", "alto",
      "Alto risco sem observação de segurança.", "Adicionar observação clínica"));

  if (!isPreenchido(m.alerta_gestacao) || !isPreenchido(m.alerta_lactacao))
    out.push(mk(m, "alto_alerta_gest_lact_indefinido", "alerta_alto", "alto",
      "Alerta de gestação/lactação não informado.", "Definir status gestação/lactação"));

  if (m.exige_ajuste_renal && !tem(m.observacao_posologia))
    out.push(mk(m, "alto_ajuste_renal_sem_observacao", "alerta_alto", "alto",
      "Exige ajuste renal, mas sem observação de ajuste.", "Descrever ajuste renal"));

  if ((tem(m.dose_maxima_adulto) || tem(m.dose_maxima_pediatrica)) && !tem(m.unidade_dose))
    out.push(mk(m, "alto_dose_max_sem_unidade", "alerta_alto", "alto",
      "Dose máxima preenchida sem unidade clara.", "Preencher unidade_dose"));

  if (m.medicamento_controlado && !isPreenchido(m.tipo_receita))
    out.push(mk(m, "alto_controlado_sem_tipo", "controlado", "alto",
      "Controlado sem tipo de receita informado.", "Definir tipo_receita"));

  // === Alertas médios ===
  if (!tem(m.classe_terapeutica)) out.push(mk(m, "medio_sem_classe", "alerta_medio", "medio", "Sem classe terapêutica.", "Preencher classe"));
  if (!tem(m.subclasse_terapeutica)) out.push(mk(m, "medio_sem_subclasse", "alerta_medio", "medio", "Sem subclasse.", "Preencher subclasse"));
  if (!tem(m.nomes_comerciais)) out.push(mk(m, "medio_sem_comerciais", "alerta_medio", "medio", "Sem nomes comerciais.", "Adicionar nomes comerciais"));
  if (!tem(m.sinonimos)) out.push(mk(m, "medio_sem_sinonimos", "alerta_medio", "medio", "Sem sinônimos.", "Adicionar sinônimos"));
  if (!tem(m.termos_busca)) out.push(mk(m, "medio_sem_termos_busca", "alerta_medio", "medio", "Sem termos de busca.", "Adicionar termos"));
  if (!tem(m.queixas_relacionadas)) out.push(mk(m, "medio_sem_queixa", "alerta_medio", "medio", "Sem vínculo com queixa.", "Vincular queixas"));
  if (!tem(m.modelos_rapidos_relacionados)) out.push(mk(m, "medio_sem_modelo", "alerta_medio", "medio", "Sem vínculo com modelo rápido.", "Vincular modelo"));
  if (!tem(m.cid_relacionados)) out.push(mk(m, "medio_sem_cid", "alerta_medio", "medio", "Sem CID relacionado.", "Vincular CID"));
  if (!tem(m.dose_adulto_padrao)) out.push(mk(m, "medio_sem_dose_adulto", "alerta_medio", "medio", "Sem dose adulta padrão.", "Preencher dose adulto"));
  if (!tem(m.dose_pediatrica_padrao)) out.push(mk(m, "medio_sem_dose_ped", "alerta_medio", "medio", "Sem dose pediátrica.", "Preencher dose pediátrica"));
  if (!tem(m.alerta_alergia_classe)) out.push(mk(m, "medio_sem_alergia_classe", "alerta_medio", "medio", "Sem alerta de alergia por classe.", "Adicionar alerta alergia"));

  // === Pendências leves ===
  if (!tem(m.nome_comercial_referencia)) out.push(mk(m, "leve_sem_comercial_ref", "pendencia_leve", "leve", "Sem nome comercial de referência.", "Definir nome de referência"));
  if (!tem(m.observacao_posologia)) out.push(mk(m, "leve_sem_observacao", "pendencia_leve", "leve", "Sem observação de uso.", "Adicionar observação"));
  if (!tem(m.duracao_padrao)) out.push(mk(m, "leve_sem_duracao", "pendencia_leve", "leve", "Sem duração padrão.", "Definir duração"));
  if (!tem(m.abreviacoes)) out.push(mk(m, "leve_sem_abreviacoes", "pendencia_leve", "leve", "Sem abreviações.", "Adicionar abreviações"));
  if (!tem(m.nomes_populares)) out.push(mk(m, "leve_sem_populares", "pendencia_leve", "leve", "Sem nomes populares.", "Adicionar nomes populares"));
  if (!tem(m.protocolos_relacionados)) out.push(mk(m, "leve_sem_protocolo", "pendencia_leve", "leve", "Sem vinculação com protocolo.", "Vincular protocolo"));

  // === Sugestões ===
  const isAntib = ANTIBIOTICO_HEURISTICA.some(a => norm(m.principio_ativo).includes(a));
  if (isAntib && !m.antimicrobiano)
    out.push(mk(m, "sugestao_possivel_antimicrobiano", "antimicrobiano", "sugestao",
      "Possível antimicrobiano não marcado.", "Revisar marcação de antimicrobiano"));

  if (m.medicamento_injetavel && /(iv|endovenoso|intravenoso)/i.test(m.via_administracao ?? "") && !m.vinculo_iv_medication_id) {
    const grav: Gravidade = alto ? "critico" : (m.prioridade_mvp === "essencial" ? "alto" : "medio");
    out.push(mk(m, "injetavel_iv_sem_seguranca", "injetavel_iv", grav,
      "Injetável IV sem dados de Segurança IV.", "Vincular à Base IV"));
  }

  return out;
}

export function analisarModelos(modelos: Modelo[], itens: ModeloItem[], medsById: Map<string, MedFull>, medsByNorm: Map<string, MedFull>): Finding[] {
  const out: Finding[] = [];
  const modeloById = new Map(modelos.map(m => [m.id, m] as const));

  for (const it of itens) {
    const mdl = modeloById.get(it.id_modelo);
    if (!mdl) continue;
    const paBase: MedFull | undefined =
      (it.id_medicamento && medsById.get(it.id_medicamento)) ||
      medsByNorm.get(norm(it.principio_ativo));

    const stub = {
      id: it.id_medicamento ?? it.id,
      principio_ativo: it.principio_ativo ?? mdl.nome_modelo,
    } as MedFull;

    if (!paBase) {
      out.push(mk(stub, "modelo_med_inexistente", "modelo_rapido", "critico",
        `Modelo "${mdl.nome_modelo}" utiliza medicamento inexistente na base.`, "Corrigir vínculo do modelo", mdl.id));
      continue;
    }
    if (paBase.ativo === false) {
      out.push(mk(paBase, "modelo_med_inativo", "modelo_rapido", "critico",
        `Modelo "${mdl.nome_modelo}" utiliza medicamento inativo.`, "Reativar ou substituir", mdl.id));
    }
    if (paBase.status_revisao !== "revisado" && paBase.status_revisao !== "aguardando_revisao") {
      out.push(mk(paBase, "modelo_med_nao_revisado", "modelo_rapido", "alto",
        `Modelo "${mdl.nome_modelo}" usa medicamento não revisado.`, "Revisar medicamento", mdl.id));
    }
    if (tem(it.dose) && !tem(it.fonte_referencia) && !tem(mdl.fonte_referencia) && !tem(paBase.fonte_referencia)) {
      out.push(mk(paBase, "modelo_dose_sem_fonte", "modelo_rapido", "alto",
        `Modelo "${mdl.nome_modelo}" tem dose sem fonte.`, "Registrar fonte", mdl.id));
    }
  }
  for (const mdl of modelos) {
    if (!mdl.categoria_modelo)
      out.push({ key: `modelo::${mdl.id}::sem_categoria`, medicamento_id: null, principio_ativo: mdl.nome_modelo,
        rule_code: "modelo_sem_categoria", gravidade: "medio", categoria: "modelo_rapido",
        mensagem: `Modelo "${mdl.nome_modelo}" sem categoria.`, acao: "Definir categoria", ref_id: mdl.id });
    if (!mdl.contexto)
      out.push({ key: `modelo::${mdl.id}::sem_contexto`, medicamento_id: null, principio_ativo: mdl.nome_modelo,
        rule_code: "modelo_sem_contexto", gravidade: "medio", categoria: "modelo_rapido",
        mensagem: `Modelo "${mdl.nome_modelo}" sem contexto.`, acao: "Definir contexto", ref_id: mdl.id });
    if (mdl.ativo && !mdl.fonte_referencia)
      out.push({ key: `modelo::${mdl.id}::institucional_sem_fonte`, medicamento_id: null, principio_ativo: mdl.nome_modelo,
        rule_code: "modelo_institucional_sem_fonte", gravidade: "medio", categoria: "modelo_rapido",
        mensagem: `Modelo institucional "${mdl.nome_modelo}" sem fonte.`, acao: "Registrar fonte", ref_id: mdl.id });
  }
  return out;
}

export type Duplicidade = {
  key: string;
  a: MedFull;
  b: MedFull;
  motivo: string;
  score: number;
};

export function detectarDuplicidades(meds: MedFull[]): Duplicidade[] {
  const out: Duplicidade[] = [];
  const buckets = new Map<string, MedFull[]>();
  for (const m of meds) {
    const key = norm(m.principio_ativo_dcb || m.principio_ativo).split(" ")[0]; // 1ª palavra
    if (!key) continue;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(m);
  }
  for (const [, arr] of buckets) {
    for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) {
      const a = arr[i], b = arr[j];
      const na = norm(a.principio_ativo), nb = norm(b.principio_ativo);
      let score = 0;
      const motivos: string[] = [];
      if (na === nb) { score += 3; motivos.push("mesmo princípio ativo normalizado"); }
      else if (na.startsWith(nb) || nb.startsWith(na)) { score += 2; motivos.push("prefixo comum"); }
      if (a.principio_ativo_dcb && b.principio_ativo_dcb && norm(a.principio_ativo_dcb) === norm(b.principio_ativo_dcb)) { score += 2; motivos.push("mesma DCB"); }
      const inter = (a.nomes_comerciais ?? []).map(norm).filter(x => (b.nomes_comerciais ?? []).map(norm).includes(x));
      if (inter.length) { score += 2; motivos.push("nomes comerciais em comum"); }
      const sin = (a.sinonimos ?? []).map(norm).filter(x => (b.sinonimos ?? []).map(norm).includes(x) || norm(b.principio_ativo) === x || (b.nomes_comerciais ?? []).map(norm).includes(x));
      if (sin.length) { score += 1; motivos.push("sinônimo em comum"); }
      if (score >= 3 && norm(a.apresentacao ?? "") === norm(b.apresentacao ?? "") && a.apresentacao) score += 1;
      if (score >= 3) {
        out.push({
          key: `dup::${[a.id, b.id].sort().join("::")}`,
          a, b, motivo: motivos.join("; "), score,
        });
      }
    }
  }
  return out.sort((x, y) => y.score - x.score);
}

// ===== Sugestões de termos por categoria =====
const SUGESTOES_TERMOS: Record<string, string[]> = {
  dor_febre: ["dor","febre","antitermico","analgesico"],
  nauseas_vomitos: ["nausea","vomito","enjoo","antiemetico"],
  alergia_anafilaxia: ["alergia","urticaria","anafilaxia","antihistaminico"],
  infeccao_antibioticos: ["infeccao","antibiotico","antimicrobiano"],
  cardiovascular_urgencia: ["hipertensao","taquicardia","arritmia","angina"],
  neurologico_urgencia: ["convulsao","cefaleia","tontura","avc"],
  respiratorio_urgencia: ["dispneia","broncoespasmo","asma","tosse"],
  gastrointestinal: ["diarreia","dor abdominal","gastrite","refluxo"],
  hidratacao_eletrolitos: ["hidratacao","desidratacao","eletrolito","soro"],
  diabetes_agudo: ["hiperglicemia","hipoglicemia","cetoacidose","diabetes"],
  psiquiatrico_urgencia: ["agitacao","ansiedade","psicose","sedativo"],
  ginecologico_obstetrico: ["sangramento","dismenorreia","obstetrico","gestante"],
  dermatologico: ["prurido","dermatite","picada","alergia cutanea"],
  otorrino_oftalmo: ["ouvido","garganta","conjuntivite","otalgia"],
  toxicologia: ["intoxicacao","antidoto","superdosagem"],
};

export function sugerirTermosBusca(m: MedFull): string[] {
  const cat = String(m.categoria_clinica ?? "");
  const base = SUGESTOES_TERMOS[cat] ?? [];
  const atuais = new Set((m.termos_busca ?? []).map(norm));
  return base.filter(t => !atuais.has(norm(t)));
}

// ===== Resumo / saúde da base =====
export type Saude = "critica" | "atencao" | "boa" | "pronta_beta";

export function calcularSaude(findings: Finding[], meds: MedFull[]): Saude {
  const criticoEmAlto = findings.some(f => f.gravidade === "critico" && f.categoria === "alto_risco");
  const criticoTotal = findings.filter(f => f.gravidade === "critico").length;
  const altos = findings.filter(f => f.gravidade === "alto").length;
  const ativos = meds.filter(m => m.ativo !== false).length || 1;
  if (criticoEmAlto || criticoTotal > ativos * 0.15) return "critica";
  if (criticoTotal > 0 || altos > ativos * 0.3) return "atencao";
  if (altos > 0) return "boa";
  return "pronta_beta";
}

export const SAUDE_LABEL: Record<Saude, string> = {
  critica: "Crítica",
  atencao: "Atenção",
  boa: "Boa",
  pronta_beta: "Pronta para beta",
};

export const gravTone = (g: Gravidade | string) => {
  switch (g) {
    case "critico": return "bg-destructive/10 text-destructive border-destructive/30";
    case "alto": return "bg-amber-500/10 text-amber-700 border-amber-500/30";
    case "medio": return "bg-sky-500/10 text-sky-700 border-sky-500/30";
    case "leve": return "bg-muted text-muted-foreground";
    case "sugestao": return "bg-violet-500/10 text-violet-700 border-violet-500/30";
    default: return "bg-muted text-muted-foreground";
  }
};

export const GRAV_LABEL: Record<Gravidade, string> = {
  critico: "Crítico", alto: "Alto", medio: "Médio", leve: "Leve", sugestao: "Sugestão",
};
