import * as XLSX from "xlsx";

/**
 * Etapa 22C — Planilha-modelo oficial da Base Geral de Medicamentos.
 * 6 abas: Medicamentos, Apresentações, Vínculos CID/Queixa, Modelos rápidos,
 * Instruções, Valores permitidos.
 *
 * Importante: nada importado entra como "revisado". Tudo entra como rascunho seguro
 * ou aguardando revisão até aprovação manual.
 */

export const TEMPLATE_FILE_BASENAME = "modelo_importacao_base_geral_medicamentos_prescrimed";

const HEADERS_MEDICAMENTOS = [
  "principio_ativo",
  "principio_ativo_dcb",
  "nome_comercial_referencia",
  "nomes_comerciais",
  "sinonimos",
  "classe_terapeutica",
  "subclasse_terapeutica",
  "categoria_clinica",
  "uso_principal",
  "uso_em_urgencia",
  "uso_emergencia",
  "uso_ambulatorial_rapido",
  "medicamento_controlado",
  "antimicrobiano",
  "tipo_receita",
  "exige_receita_especial",
  "exige_retencao_receita",
  "exige_peso",
  "exige_ajuste_renal",
  "exige_ajuste_hepatico",
  "alerta_gestacao",
  "alerta_lactacao",
  "alerta_alergia_classe",
  "risco_interacao_relevante",
  "risco_duplicidade",
  "prioridade_mvp",
  "fonte_referencia",
  "status_revisao",
] as const;

const HEADERS_APRESENTACOES = [
  "principio_ativo",
  "forma_farmaceutica",
  "apresentacao",
  "concentracao",
  "unidade_concentracao",
  "volume",
  "unidade_volume",
  "via_administracao",
  "uso_adulto",
  "uso_pediatrico",
  "medicamento_injetavel",
  "medicamento_oral",
  "medicamento_topico",
  "medicamento_inalatorio",
  "dose_adulto_padrao",
  "dose_pediatrica_padrao",
  "dose_maxima_adulto",
  "dose_maxima_pediatrica",
  "unidade_dose",
  "frequencia_padrao",
  "duracao_padrao",
  "observacao_posologia",
  "fonte_referencia",
  "status_revisao",
] as const;

const HEADERS_VINCULOS = [
  "principio_ativo",
  "cid",
  "descricao_cid",
  "queixa",
  "sindrome",
  "protocolo",
  "contexto",
  "prioridade_sugestao",
  "observacao_uso",
  "fonte_referencia",
  "status_revisao",
] as const;

const HEADERS_MODELOS = [
  "nome_modelo",
  "categoria_modelo",
  "contexto",
  "principio_ativo",
  "apresentacao",
  "dose",
  "unidade_dose",
  "via",
  "frequencia",
  "duracao",
  "observacao",
  "obrigatorio",
  "editavel",
  "fonte_referencia",
  "status_revisao",
] as const;

const EXEMPLO_MEDICAMENTO = [
  "dipirona sódica", "DIPIRONA SODICA", "Novalgina",
  "Novalgina;Anador", "metamizol;dipirona",
  "Analgésico não opioide", "Pirazolonas",
  "dor_febre",
  "Dor leve a moderada e febre",
  "sim", "nao", "sim",
  "nao", "nao", "comum",
  "nao", "nao",
  "nao", "nao", "nao",
  "cautela", "cautela",
  "alergia a pirazolonas",
  "nao", "nao",
  "essencial",
  "Bulário Anvisa - Dipirona",
  "rascunho",
];

const EXEMPLO_APRESENTACAO = [
  "dipirona sódica",
  "comprimido",
  "comprimido 500 mg",
  "500", "mg", "", "",
  "VO",
  "sim", "nao",
  "nao", "sim", "nao", "nao",
  "500-1000 mg", "10-15 mg/kg",
  "4 g/dia", "60 mg/kg/dia",
  "mg",
  "6/6h", "até 5 dias",
  "Não exceder 4 g/dia em adultos",
  "Bulário Anvisa - Dipirona",
  "rascunho",
];

const EXEMPLO_VINCULO = [
  "dipirona sódica",
  "R50.9", "Febre não especificada",
  "dor;febre", "", "",
  "urgencia",
  "alta",
  "1ª escolha em adulto sem alergia a pirazolonas",
  "Diretriz institucional X",
  "aguardando revisão",
];

const EXEMPLO_MODELO = [
  "Dor/febre adulto - protocolo PA",
  "dor_febre",
  "pronto_atendimento",
  "dipirona sódica",
  "comprimido 500 mg",
  "1000", "mg",
  "VO",
  "6/6h",
  "até 5 dias",
  "Reavaliar em 48h",
  "sim", "sim",
  "Protocolo institucional X",
  "aguardando revisão",
];

const INSTRUCOES: string[][] = [
  ["Instruções de importação"],
  [""],
  ["1.", "Preencha primeiro a aba Medicamentos."],
  ["2.", "Use um princípio ativo por linha."],
  ["3.", "Use ponto e vírgula (;) para listas (ex.: nomes_comerciais, sinonimos, queixa)."],
  ["4.", "Não altere os nomes dos cabeçalhos."],
  ["5.", "Apresentações devem estar ligadas a um princípio ativo existente na aba Medicamentos ou já cadastrado."],
  ["6.", "Vínculos com CID/queixa são apenas sugestões cadastradas. Não geram prescrição automática."],
  ["7.", "Doses e posologias só devem ser preenchidas com fonte confiável."],
  ["8.", "Registros importados entram como rascunho seguro ou aguardando revisão."],
  ["9.", "Apenas registros revisados manualmente devem aparecer como recomendação confiável."],
  ["10.", "Medicamentos sem fonte_referencia não podem ser marcados como revisados."],
  ["11.", "Dados clínicos devem ser revisados antes do uso em ambiente assistencial."],
  [""],
  ["AVISO:", "Esta planilha alimenta uma ferramenta de apoio à decisão clínica. Não inserir dados sem fonte quando envolver dose, posologia, contraindicação ou regra legal."],
];

const VALORES_PERMITIDOS: string[][] = [
  ["Campo", "Valor permitido"],
  ["prioridade_mvp", "essencial"],
  ["prioridade_mvp", "alta"],
  ["prioridade_mvp", "média"],
  ["prioridade_mvp", "baixa"],
  ["prioridade_mvp", "futuro"],
  ["", ""],
  ["status_revisao", "rascunho"],
  ["status_revisao", "aguardando revisão"],
  ["status_revisao", "revisado"],
  ["status_revisao", "precisa corrigir"],
  ["status_revisao", "inativo"],
  ["", ""],
  ["booleanos (sim/não)", "sim"],
  ["booleanos (sim/não)", "não"],
  ["", ""],
  ["tipo_receita", "comum"],
  ["tipo_receita", "controle_especial"],
  ["tipo_receita", "antimicrobiano"],
  ["tipo_receita", "azul"],
  ["tipo_receita", "amarela"],
  ["tipo_receita", "branca_duas_vias"],
  ["tipo_receita", "outro"],
  ["tipo_receita", "não informado"],
  ["", ""],
  ["via_administracao", "VO"],
  ["via_administracao", "IV"],
  ["via_administracao", "IM"],
  ["via_administracao", "SC"],
  ["via_administracao", "SL"],
  ["via_administracao", "tópico"],
  ["via_administracao", "inalatório"],
  ["via_administracao", "nasal"],
  ["via_administracao", "oftálmico"],
  ["via_administracao", "otológico"],
  ["via_administracao", "retal"],
  ["via_administracao", "vaginal"],
  ["via_administracao", "outro"],
  ["", ""],
  ["contexto", "urgencia"],
  ["contexto", "emergencia"],
  ["contexto", "pronto_atendimento"],
  ["contexto", "hospitalar"],
  ["contexto", "ambulatorial_rapido"],
  ["contexto", "pediatria"],
  ["contexto", "gestante"],
  ["contexto", "outro"],
  ["", ""],
  ["categoria_clinica", "dor_febre"],
  ["categoria_clinica", "nauseas_vomitos"],
  ["categoria_clinica", "alergia_anafilaxia"],
  ["categoria_clinica", "respiratorio"],
  ["categoria_clinica", "antibioticos"],
  ["categoria_clinica", "gastrointestinal"],
  ["categoria_clinica", "hidratacao_eletrolitos"],
  ["categoria_clinica", "cardiovascular_pressao"],
  ["categoria_clinica", "neurologico_convulsao_agitacao"],
  ["categoria_clinica", "diabetes_glicemia"],
  ["categoria_clinica", "gineco_obstetricia"],
  ["categoria_clinica", "dermatologia"],
  ["categoria_clinica", "otorrino_oftalmo"],
  ["categoria_clinica", "controlados"],
  ["categoria_clinica", "emergencia"],
  ["categoria_clinica", "outro"],
];

function aoa(headers: readonly string[], example: (string | number)[]) {
  return [headers as unknown as string[], example];
}

export function buildTemplateWorkbook(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa(HEADERS_MEDICAMENTOS, EXEMPLO_MEDICAMENTO)), "Medicamentos");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa(HEADERS_APRESENTACOES, EXEMPLO_APRESENTACAO)), "Apresentações");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa(HEADERS_VINCULOS, EXEMPLO_VINCULO)), "Vínculos CID-Queixa");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa(HEADERS_MODELOS, EXEMPLO_MODELO)), "Modelos rápidos");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(INSTRUCOES), "Instruções");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(VALORES_PERMITIDOS), "Valores permitidos");
  return wb;
}

export function downloadTemplateXlsx() {
  const wb = buildTemplateWorkbook();
  XLSX.writeFile(wb, `${TEMPLATE_FILE_BASENAME}.xlsx`);
}

export function downloadTemplateCsv() {
  // CSV só consegue carregar uma aba — exportamos a aba principal (Medicamentos)
  // com um cabeçalho explicativo no topo direcionando ao XLSX completo.
  const lines: string[] = [];
  lines.push(`# ${TEMPLATE_FILE_BASENAME} - aba Medicamentos`);
  lines.push("# Para vincular Apresentações, CID/Queixa e Modelos rápidos use o XLSX completo.");
  lines.push(HEADERS_MEDICAMENTOS.join(","));
  lines.push(EXEMPLO_MEDICAMENTO.map((v) => csvEscape(String(v))).join(","));
  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${TEMPLATE_FILE_BASENAME}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export const TEMPLATE_HEADERS = {
  medicamentos: HEADERS_MEDICAMENTOS,
  apresentacoes: HEADERS_APRESENTACOES,
  vinculos: HEADERS_VINCULOS,
  modelos: HEADERS_MODELOS,
};
