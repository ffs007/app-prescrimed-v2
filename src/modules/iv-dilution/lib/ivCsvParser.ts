import * as XLSX from "xlsx";
import type { IVMedication } from "../IVDilutionAdminPage";

export const IV_COLUMNS = [
  "principio_ativo","nome_comercial_referencia","apresentacao","via_administracao",
  "volume_reconstituicao","diluente_reconstituicao","estabilidade_apos_reconstituicao",
  "solucoes_compativeis","volume_diluicao","estabilidade_apos_diluicao","concentracao_maxima",
  "tempo_minimo_infusao","velocidade_maxima_infusao","ph","observacoes_gerais",
  "risco_flebite","exige_fotoprotecao","exige_equipo_fotossensivel","exige_filtro",
  "incompatibilidades","volume_expansao_pos_reconstituicao","nivel_alerta",
  "alerta_medico","alerta_enfermagem_farmacia","fonte_referencia","data_atualizacao","status_revisao",
] as const;

const BOOL_FIELDS = new Set([
  "risco_flebite","exige_fotoprotecao","exige_equipo_fotossensivel","exige_filtro",
]);
const ARRAY_FIELDS = new Set(["solucoes_compativeis","incompatibilidades"]);

const parseBool = (v: any): boolean => {
  if (typeof v === "boolean") return v;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return ["sim","s","yes","y","true","verdadeiro","1"].includes(s);
};

const parseArray = (v: any): string[] => {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (v == null || v === "") return [];
  return String(v).split(/[;,]/).map((s) => s.trim()).filter(Boolean);
};

export type ParsedRow = {
  index: number;
  data: Partial<IVMedication> & { status_revisao?: string };
  errors: string[];
};

export async function parseFileToRows(file: File): Promise<ParsedRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

  return json.map((row, i) => {
    const out: any = {};
    const errors: string[] = [];
    for (const col of IV_COLUMNS) {
      const raw = row[col];
      if (raw === "" || raw == null) continue;
      if (BOOL_FIELDS.has(col)) out[col] = parseBool(raw);
      else if (ARRAY_FIELDS.has(col)) out[col] = parseArray(raw);
      else out[col] = String(raw).trim();
    }
    // Defaults
    if (!out.principio_ativo) errors.push("Princípio ativo obrigatório");
    if (!out.via_administracao) out.via_administracao = "IV";
    if (!out.fonte_referencia) out.fonte_referencia = "Fonte não informada";
    if (!out.status_revisao) out.status_revisao = "aguardando_revisao";
    if (out.nivel_alerta && !["baixo","medio","alto"].includes(out.nivel_alerta))
      out.nivel_alerta = "baixo";
    if (!out.nivel_alerta) out.nivel_alerta = "baixo";
    return { index: i, data: out, errors };
  });
}

export function buildTemplateCsv(): string {
  return IV_COLUMNS.join(",") + "\n";
}
