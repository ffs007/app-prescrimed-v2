import { CATEGORIAS_CLINICAS, PRIORIDADES_MVP, TIPOS_RECEITA } from "./constants";

const TEMPLATE_HEADERS = [
  "principio_ativo", "principio_ativo_dcb", "nome_comercial_referencia",
  "nomes_comerciais", "sinonimos", "classe_terapeutica", "subclasse_terapeutica",
  "categoria_clinica", "forma_farmaceutica", "apresentacao", "concentracao",
  "via_administracao", "uso_principal", "uso_em_urgencia", "uso_emergencia",
  "uso_ambulatorial_rapido", "medicamento_injetavel", "medicamento_oral",
  "medicamento_topico", "medicamento_inalatorio", "medicamento_controlado",
  "antimicrobiano", "tipo_receita", "dose_adulto_padrao", "dose_pediatrica_padrao",
  "dose_maxima_adulto", "dose_maxima_pediatrica", "frequencia_padrao",
  "duracao_padrao", "observacao_posologia", "exige_peso", "exige_ajuste_renal",
  "exige_ajuste_hepatico", "alerta_gestacao", "alerta_lactacao",
  "cid_relacionados", "queixas_relacionadas", "protocolos_relacionados",
  "modelos_rapidos_relacionados", "prioridade_mvp", "fonte_referencia",
  "status_revisao",
];

export function buildCsvTemplate(): string {
  const example = [
    "Exemplo - dipirona", "DIPIRONA SODICA", "Novalgina",
    "Novalgina;Anador", "metamizol;dipirona sódica", "Analgésico", "Não opioide",
    "dor_febre", "comprimido", "comprimido 500 mg", "500 mg",
    "VO", "Dor leve a moderada e febre", "sim", "nao",
    "sim", "nao", "sim",
    "nao", "nao", "nao",
    "nao", "comum", "", "",
    "", "", "",
    "", "Não exceder 4 g/dia em adultos", "nao", "nao",
    "nao", "sem_dados", "sem_dados",
    "R50.9", "dor;febre", "",
    "", "essencial", "Bulário Anvisa",
    "aguardando_revisao",
  ];
  return [TEMPLATE_HEADERS.join(","), example.join(",")].join("\n");
}

function toBool(v: string | undefined): boolean {
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return s === "sim" || s === "true" || s === "1" || s === "yes";
}

function toArray(v: string | undefined): string[] {
  if (!v) return [];
  return v.split(";").map((s) => s.trim()).filter(Boolean);
}

function pickEnum<T extends string>(value: string | undefined, allowed: readonly { value: T }[], fallback: T): T {
  if (!value) return fallback;
  const v = value.trim() as T;
  return allowed.some((o) => o.value === v) ? v : fallback;
}

export type ParsedRow = {
  ok: boolean;
  errors: string[];
  data: Record<string, unknown>;
};

export function parseCsv(text: string): { rows: ParsedRow[]; headerErrors: string[] } {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim().length);
  if (lines.length === 0) return { rows: [], headerErrors: ["Arquivo vazio"] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const headerErrors: string[] = [];
  if (!headers.includes("principio_ativo")) headerErrors.push("Cabeçalho obrigatório ausente: principio_ativo");

  const rows: ParsedRow[] = lines.slice(1).map((line, idx) => {
    const cells = line.split(",");
    const record: Record<string, string> = {};
    headers.forEach((h, i) => { record[h] = cells[i]?.trim() ?? ""; });
    const errors: string[] = [];
    if (!record.principio_ativo) errors.push(`Linha ${idx + 2}: princípio ativo obrigatório`);

    const fonte = record.fonte_referencia?.trim();
    let status = pickEnum(record.status_revisao, [
      { value: "rascunho" }, { value: "aguardando_revisao" },
      { value: "revisado" }, { value: "precisa_corrigir" }, { value: "inativo" },
    ] as const, "aguardando_revisao");
    if (status === "revisado" && !fonte) status = "aguardando_revisao";

    return {
      ok: errors.length === 0,
      errors,
      data: {
        principio_ativo: record.principio_ativo,
        principio_ativo_dcb: record.principio_ativo_dcb || null,
        nome_comercial_referencia: record.nome_comercial_referencia || null,
        nomes_comerciais: toArray(record.nomes_comerciais),
        sinonimos: toArray(record.sinonimos),
        classe_terapeutica: record.classe_terapeutica || null,
        subclasse_terapeutica: record.subclasse_terapeutica || null,
        categoria_clinica: pickEnum(record.categoria_clinica, CATEGORIAS_CLINICAS, "dor_febre"),
        forma_farmaceutica: record.forma_farmaceutica || null,
        apresentacao: record.apresentacao || null,
        concentracao: record.concentracao || null,
        via_administracao: record.via_administracao || null,
        uso_principal: record.uso_principal || null,
        uso_em_urgencia: toBool(record.uso_em_urgencia),
        uso_emergencia: toBool(record.uso_emergencia),
        uso_ambulatorial_rapido: toBool(record.uso_ambulatorial_rapido),
        medicamento_injetavel: toBool(record.medicamento_injetavel),
        medicamento_oral: toBool(record.medicamento_oral),
        medicamento_topico: toBool(record.medicamento_topico),
        medicamento_inalatorio: toBool(record.medicamento_inalatorio),
        medicamento_controlado: toBool(record.medicamento_controlado),
        antimicrobiano: toBool(record.antimicrobiano),
        tipo_receita: pickEnum(record.tipo_receita, TIPOS_RECEITA, "comum"),
        dose_adulto_padrao: record.dose_adulto_padrao || null,
        dose_pediatrica_padrao: record.dose_pediatrica_padrao || null,
        dose_maxima_adulto: record.dose_maxima_adulto || null,
        dose_maxima_pediatrica: record.dose_maxima_pediatrica || null,
        frequencia_padrao: record.frequencia_padrao || null,
        duracao_padrao: record.duracao_padrao || null,
        observacao_posologia: record.observacao_posologia || null,
        exige_peso: toBool(record.exige_peso),
        exige_ajuste_renal: toBool(record.exige_ajuste_renal),
        exige_ajuste_hepatico: toBool(record.exige_ajuste_hepatico),
        alerta_gestacao: pickEnum(record.alerta_gestacao, [
          { value: "seguro" }, { value: "cautela" }, { value: "evitar" },
          { value: "contraindicado" }, { value: "sem_dados" },
        ] as const, "sem_dados"),
        alerta_lactacao: pickEnum(record.alerta_lactacao, [
          { value: "seguro" }, { value: "cautela" }, { value: "evitar" },
          { value: "contraindicado" }, { value: "sem_dados" },
        ] as const, "sem_dados"),
        cid_relacionados: toArray(record.cid_relacionados),
        queixas_relacionadas: toArray(record.queixas_relacionadas),
        protocolos_relacionados: toArray(record.protocolos_relacionados),
        modelos_rapidos_relacionados: toArray(record.modelos_rapidos_relacionados),
        prioridade_mvp: pickEnum(record.prioridade_mvp, PRIORIDADES_MVP, "media"),
        fonte_referencia: fonte || null,
        status_revisao: status,
      },
    };
  });

  return { rows, headerErrors };
}
