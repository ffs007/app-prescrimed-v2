import * as XLSX from "xlsx";
import { IV_COLUMNS } from "./ivCsvParser";

const EXAMPLES: Record<string, string | number>[] = [
  {
    principio_ativo: "Ceftriaxona", nome_comercial_referencia: "Rocefin", apresentacao: "Frasco 1 g",
    via_administracao: "IV", volume_reconstituicao: "10 mL", diluente_reconstituicao: "Água destilada",
    estabilidade_apos_reconstituicao: "Não informado", solucoes_compativeis: "SF 0,9%; SG 5%",
    volume_diluicao: "100 mL", estabilidade_apos_diluicao: "Não informado", concentracao_maxima: "40 mg/mL",
    tempo_minimo_infusao: "30 min", velocidade_maxima_infusao: "Não informado", ph: "Não informado",
    observacoes_gerais: "Incompatível com soluções contendo cálcio.",
    risco_flebite: "não", exige_fotoprotecao: "não", exige_equipo_fotossensivel: "não", exige_filtro: "não",
    incompatibilidades: "Ringer Lactato; Gluconato de cálcio", volume_expansao_pos_reconstituicao: "Não informado",
    nivel_alerta: "alto", alerta_medico: "Risco fatal de precipitação com cálcio em neonatos.",
    alerta_enfermagem_farmacia: "Não administrar em Y com soluções contendo cálcio.",
    fonte_referencia: "Bula do fabricante", data_atualizacao: new Date().toISOString().slice(0, 10),
    status_revisao: "aguardando revisão",
  },
  {
    principio_ativo: "Aciclovir", nome_comercial_referencia: "Zovirax", apresentacao: "Frasco 250 mg",
    via_administracao: "IV", volume_reconstituicao: "10 mL", diluente_reconstituicao: "Água destilada",
    estabilidade_apos_reconstituicao: "Não informado", solucoes_compativeis: "SF 0,9%; SG 5%",
    volume_diluicao: "100 mL", estabilidade_apos_diluicao: "Não informado", concentracao_maxima: "5 mg/mL",
    tempo_minimo_infusao: "1 hora", velocidade_maxima_infusao: "Não informado", ph: "Não informado",
    observacoes_gerais: "Hidratação adequada para reduzir nefrotoxicidade.",
    risco_flebite: "sim", exige_fotoprotecao: "não", exige_equipo_fotossensivel: "não", exige_filtro: "não",
    incompatibilidades: "Não informado", volume_expansao_pos_reconstituicao: "Não informado",
    nivel_alerta: "médio", alerta_medico: "Hidratar paciente para evitar cristalúria.",
    alerta_enfermagem_farmacia: "Infundir em no mínimo 1 hora.",
    fonte_referencia: "Bula do fabricante", data_atualizacao: new Date().toISOString().slice(0, 10),
    status_revisao: "aguardando revisão",
  },
  {
    principio_ativo: "Adenosina", nome_comercial_referencia: "Adenocard", apresentacao: "Ampola 6 mg/2 mL",
    via_administracao: "IV", volume_reconstituicao: "Não requer", diluente_reconstituicao: "Não informado",
    estabilidade_apos_reconstituicao: "Não informado", solucoes_compativeis: "SF 0,9%",
    volume_diluicao: "Bolus puro seguido de flush 20 mL SF", estabilidade_apos_diluicao: "Não informado",
    concentracao_maxima: "Não informado", tempo_minimo_infusao: "Bolus rápido (1-2 s)",
    velocidade_maxima_infusao: "Não informado", ph: "Não informado",
    observacoes_gerais: "Administrar em acesso central ou veia calibrosa proximal, seguido de flush imediato.",
    risco_flebite: "não", exige_fotoprotecao: "não", exige_equipo_fotossensivel: "não", exige_filtro: "não",
    incompatibilidades: "Não informado", volume_expansao_pos_reconstituicao: "Não informado",
    nivel_alerta: "alto", alerta_medico: "Monitorização ECG contínua obrigatória.",
    alerta_enfermagem_farmacia: "Bolus rápido + flush imediato 20 mL SF.",
    fonte_referencia: "Bula do fabricante", data_atualizacao: new Date().toISOString().slice(0, 10),
    status_revisao: "aguardando revisão",
  },
  {
    principio_ativo: "Amiodarona", nome_comercial_referencia: "Ancoron", apresentacao: "Ampola 150 mg/3 mL",
    via_administracao: "IV", volume_reconstituicao: "Não requer", diluente_reconstituicao: "Não informado",
    estabilidade_apos_reconstituicao: "Não informado", solucoes_compativeis: "SG 5%",
    volume_diluicao: "Conforme protocolo", estabilidade_apos_diluicao: "Não informado",
    concentracao_maxima: "2 mg/mL em acesso periférico", tempo_minimo_infusao: "Conforme protocolo",
    velocidade_maxima_infusao: "Não informado", ph: "Não informado",
    observacoes_gerais: "Preferir acesso central para infusão prolongada. Diluir apenas em SG 5%.",
    risco_flebite: "sim", exige_fotoprotecao: "não", exige_equipo_fotossensivel: "não", exige_filtro: "não",
    incompatibilidades: "SF 0,9%", volume_expansao_pos_reconstituicao: "Não informado",
    nivel_alerta: "alto", alerta_medico: "Monitorizar PA e ECG durante infusão.",
    alerta_enfermagem_farmacia: "Diluir somente em SG 5%; preferir acesso central.",
    fonte_referencia: "Bula do fabricante", data_atualizacao: new Date().toISOString().slice(0, 10),
    status_revisao: "aguardando revisão",
  },
  {
    principio_ativo: "Fenitoína", nome_comercial_referencia: "Hidantal", apresentacao: "Ampola 250 mg/5 mL",
    via_administracao: "IV", volume_reconstituicao: "Não requer", diluente_reconstituicao: "Não informado",
    estabilidade_apos_reconstituicao: "Não informado", solucoes_compativeis: "SF 0,9%",
    volume_diluicao: "Conforme protocolo", estabilidade_apos_diluicao: "Usar imediatamente",
    concentracao_maxima: "Não informado", tempo_minimo_infusao: "Não exceder 50 mg/min em adultos",
    velocidade_maxima_infusao: "50 mg/min", ph: "Alcalino",
    observacoes_gerais: "Não diluir em soluções glicosadas (precipitação). Monitorização cardíaca.",
    risco_flebite: "sim", exige_fotoprotecao: "não", exige_equipo_fotossensivel: "não", exige_filtro: "sim",
    incompatibilidades: "SG 5%", volume_expansao_pos_reconstituicao: "Não informado",
    nivel_alerta: "alto", alerta_medico: "Monitorização cardíaca contínua durante infusão.",
    alerta_enfermagem_farmacia: "Diluir apenas em SF 0,9%; usar filtro em linha; não exceder 50 mg/min.",
    fonte_referencia: "Bula do fabricante", data_atualizacao: new Date().toISOString().slice(0, 10),
    status_revisao: "aguardando revisão",
  },
];

const FILE_BASE = "modelo_importacao_diluicao_iv_prescrimed";

export function downloadIVTemplateCsv() {
  const lines = [IV_COLUMNS.join(",")];
  for (const ex of EXAMPLES) {
    lines.push(IV_COLUMNS.map((c) => {
      const v = String((ex as any)[c] ?? "");
      return v.includes(",") || v.includes('"') || v.includes("\n") ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(","));
  }
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${FILE_BASE}.csv`);
}

export function downloadIVTemplateXlsx() {
  const wb = XLSX.utils.book_new();

  // Aba 1: Medicamentos IV
  const headerRow = IV_COLUMNS as unknown as string[];
  const dataRows = EXAMPLES.map((ex) => IV_COLUMNS.map((c) => (ex as any)[c] ?? ""));
  const ws1 = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  // Largura das colunas
  ws1["!cols"] = IV_COLUMNS.map((c) => ({ wch: Math.max(18, Math.min(36, c.length + 4)) }));
  // Congelar primeira linha
  ws1["!freeze"] = { xSplit: 0, ySplit: 1 } as any;
  (ws1 as any)["!views"] = [{ state: "frozen", ySplit: 1 }];

  // Estilo de cabeçalho (negrito) — xlsx community não estiliza, mas mantemos hint
  for (let i = 0; i < headerRow.length; i++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: i });
    if (ws1[addr]) ws1[addr].s = { font: { bold: true } };
  }

  // Validação de dados (dropdowns) — propriedade !dataValidation lida por alguns visualizadores
  const colIdx = (name: string) => IV_COLUMNS.indexOf(name as any);
  const range = (col: number, fromRow = 1, toRow = 500) =>
    `${XLSX.utils.encode_col(col)}${fromRow + 1}:${XLSX.utils.encode_col(col)}${toRow + 1}`;

  (ws1 as any)["!dataValidation"] = [
    { sqref: range(colIdx("nivel_alerta")), type: "list", formula1: '"baixo,médio,alto"' },
    { sqref: range(colIdx("status_revisao")), type: "list", formula1: '"rascunho,aguardando revisão,revisado,precisa corrigir,inativo"' },
    { sqref: range(colIdx("risco_flebite")), type: "list", formula1: '"sim,não"' },
    { sqref: range(colIdx("exige_fotoprotecao")), type: "list", formula1: '"sim,não"' },
    { sqref: range(colIdx("exige_equipo_fotossensivel")), type: "list", formula1: '"sim,não"' },
    { sqref: range(colIdx("exige_filtro")), type: "list", formula1: '"sim,não"' },
  ];

  XLSX.utils.book_append_sheet(wb, ws1, "Medicamentos IV");

  // Aba 2: Instruções
  const instr = [
    ["Instruções de preenchimento"],
    [""],
    ["• Preencha um medicamento por linha."],
    ["• O campo principio_ativo é obrigatório."],
    ["• Use via_administracao como IV."],
    ["• Para listas (solucoes_compativeis, incompatibilidades), separe por ponto e vírgula."],
    ["• Para campos verdadeiro/falso, use sim ou não."],
    ["• Não altere os nomes dos cabeçalhos."],
    ['• Campos não conhecidos podem ser preenchidos como "Não informado".'],
    ['• Medicamentos importados entram inicialmente como "aguardando revisão", salvo se o administrador definir outro status.'],
    ["• Dados extraídos ou importados devem ser revisados antes de uso clínico."],
    ["• A fonte deve ser informada sempre que possível."],
    [""],
    ["Aviso:"],
    ["Esta planilha é usada para apoio à decisão clínica."],
    ["As informações devem ser revisadas conforme protocolo institucional, farmácia clínica e fonte oficial."],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(instr);
  ws2["!cols"] = [{ wch: 100 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Instruções");

  // Aba 3: Valores permitidos
  const vals = [
    ["nivel_alerta", "status_revisao", "campos_booleanos", "exemplos_solucoes"],
    ["baixo", "rascunho", "sim", "SF 0,9%"],
    ["médio", "aguardando revisão", "não", "SG 5%"],
    ["alto", "revisado", "", "Água destilada"],
    ["", "precisa corrigir", "", "Ringer Lactato"],
    ["", "inativo", "", "Ringer simples"],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(vals);
  ws3["!cols"] = [{ wch: 20 }, { wch: 24 }, { wch: 20 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Valores permitidos");

  XLSX.writeFile(wb, `${FILE_BASE}.xlsx`);
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ---------- Pré-validação ----------

const NIVEL_OK = new Set(["baixo", "médio", "medio", "alto"]);
const STATUS_OK = new Set(["rascunho", "aguardando revisão", "aguardando_revisao", "revisado", "precisa corrigir", "precisa_corrigir", "inativo"]);
const BOOL_OK = new Set(["sim", "não", "nao", "true", "false", "verdadeiro", "1", "0", ""]);
const BOOL_FIELDS = ["risco_flebite", "exige_fotoprotecao", "exige_equipo_fotossensivel", "exige_filtro"];

export type CellIssue = { line: number; field: string; problem: string; suggestion: string };

export function validateHeaders(headers: string[]): { ok: boolean; missing: string[]; extra: string[] } {
  const set = new Set(headers.map((h) => h.trim()));
  const required = IV_COLUMNS as unknown as string[];
  const missing = required.filter((c) => !set.has(c));
  const extra = headers.filter((h) => !(required as string[]).includes(h.trim()));
  return { ok: missing.length === 0, missing, extra };
}

export function validateRowsValues(rows: Record<string, any>[]): CellIssue[] {
  const issues: CellIssue[] = [];
  rows.forEach((r, i) => {
    const line = i + 2; // +1 header, +1 1-based
    if (!String(r.principio_ativo ?? "").trim())
      issues.push({ line, field: "principio_ativo", problem: "campo obrigatório vazio", suggestion: "preencher o princípio ativo antes de importar" });
    if (r.nivel_alerta && !NIVEL_OK.has(String(r.nivel_alerta).trim().toLowerCase()))
      issues.push({ line, field: "nivel_alerta", problem: `valor "${r.nivel_alerta}" não é aceito`, suggestion: "usar baixo, médio ou alto" });
    if (r.status_revisao && !STATUS_OK.has(String(r.status_revisao).trim().toLowerCase()))
      issues.push({ line, field: "status_revisao", problem: `valor "${r.status_revisao}" não é aceito`, suggestion: "usar rascunho, aguardando revisão, revisado, precisa corrigir ou inativo" });
    for (const b of BOOL_FIELDS) {
      const v = r[b];
      if (v == null) continue;
      const s = String(v).trim().toLowerCase();
      if (!BOOL_OK.has(s) && typeof v !== "boolean")
        issues.push({ line, field: b, problem: `valor "${v}" não é aceito`, suggestion: "usar sim/não, true/false ou 1/0" });
    }
  });
  return issues;
}
