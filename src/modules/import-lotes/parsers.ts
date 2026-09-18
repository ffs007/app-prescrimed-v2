import { ColumnDef, NEUTRO, TableDef } from "./schema";

export type Formato = "sql" | "markdown" | "pipe";

export interface ParsedRow {
  index: number;
  raw: string;
  values: string[];
  /** header names, when the source declares them (markdown / sql) */
  headers?: string[];
  parseError?: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  headers?: string[];
}

export interface MappedRow {
  index: number;
  raw: string;
  data: Record<string, string | null>;
  problems: string[];
}

export interface AnalysisResult {
  total: number;
  aceitas: number;
  rejeitadas: number;
  rows: MappedRow[];
  headerMapping: { origem: string; destino: string | null; score: number }[];
  problemas: { linha: number; mensagem: string }[];
}

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isSeparatorLine(line: string): boolean {
  return /^\|?[\s:|-]+\|?$/.test(line) && line.includes("-");
}

function splitPipe(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((v) => v.trim());
}

/** Texto livre delimitado por barra vertical: sem cabeçalho. */
export function parsePipe(text: string): ParseResult {
  const rows: ParsedRow[] = [];
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !isSeparatorLine(l))
    .forEach((line, i) => {
      rows.push({ index: i + 1, raw: line, values: splitPipe(line) });
    });
  return { rows };
}

/** Tabela markdown: primeira linha útil é o cabeçalho. */
export function parseMarkdown(text: string): ParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !isSeparatorLine(l));
  if (lines.length === 0) return { rows: [] };
  const headers = splitPipe(lines[0]);
  const rows: ParsedRow[] = lines.slice(1).map((line, i) => ({
    index: i + 1,
    raw: line,
    values: splitPipe(line),
    headers,
  }));
  return { rows, headers };
}

function splitSqlValues(tuple: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inStr = false;
  for (let i = 0; i < tuple.length; i++) {
    const ch = tuple[i];
    if (inStr) {
      if (ch === "'" && tuple[i + 1] === "'") {
        cur += "'";
        i++;
      } else if (ch === "'") {
        inStr = false;
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === "'") {
      inStr = true;
    } else if (ch === ",") {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out.map((v) => (v.toUpperCase() === "NULL" ? "" : v));
}

/** SQL pronto: extrai colunas e tuplas de VALUES, sem executar nada. */
export function parseSql(text: string): ParseResult {
  const rows: ParsedRow[] = [];
  let headers: string[] | undefined;
  const stmtRegex =
    /insert\s+into\s+[^\s(]+\s*\(([^)]*)\)\s*values\s*([\s\S]*?)(?=;|insert\s+into|$)/gi;
  let m: RegExpExecArray | null;
  let counter = 0;
  while ((m = stmtRegex.exec(text)) !== null) {
    const cols = m[1]
      .split(",")
      .map((c) => c.trim().replace(/^["`]|["`]$/g, ""))
      .filter(Boolean);
    if (!headers) headers = cols;
    const body = m[2];
    // extrai tuplas de nível superior
    let depth = 0;
    let cur = "";
    let inStr = false;
    for (let i = 0; i < body.length; i++) {
      const ch = body[i];
      if (inStr) {
        cur += ch;
        if (ch === "'" && body[i + 1] === "'") {
          cur += "'";
          i++;
        } else if (ch === "'") inStr = false;
        continue;
      }
      if (ch === "'") {
        inStr = true;
        cur += ch;
      } else if (ch === "(") {
        depth++;
        if (depth === 1) {
          cur = "";
          continue;
        }
        cur += ch;
      } else if (ch === ")") {
        depth--;
        if (depth === 0) {
          counter++;
          rows.push({
            index: counter,
            raw: `(${cur})`,
            values: splitSqlValues(cur),
            headers: cols,
          });
          cur = "";
          continue;
        }
        cur += ch;
      } else if (depth > 0) {
        cur += ch;
      }
    }
  }
  return { rows, headers };
}

export function parse(text: string, formato: Formato): ParseResult {
  if (formato === "sql") return parseSql(text);
  if (formato === "markdown") return parseMarkdown(text);
  return parsePipe(text);
}

function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.replace(/ /g, "") === nb.replace(/ /g, "")) return 0.98;
  if (na.includes(nb) || nb.includes(na)) return 0.8;
  const ta = new Set(na.split(" "));
  const tb = new Set(nb.split(" "));
  let inter = 0;
  ta.forEach((t) => {
    if (tb.has(t)) inter++;
  });
  return inter === 0 ? 0 : inter / Math.max(ta.size, tb.size);
}

export function mapHeaders(
  headers: string[],
  columns: ColumnDef[],
): { origem: string; destino: string | null; score: number }[] {
  const used = new Set<string>();
  return headers.map((h) => {
    let best: string | null = null;
    let bestScore = 0;
    columns.forEach((c) => {
      if (used.has(c.name)) return;
      const s = similarity(h, c.name);
      if (s > bestScore) {
        bestScore = s;
        best = c.name;
      }
    });
    if (best && bestScore >= 0.5) {
      used.add(best);
      return { origem: h, destino: best, score: bestScore };
    }
    return { origem: h, destino: null, score: bestScore };
  });
}

function clean(v: string): string {
  return v.trim().replace(/^["']|["']$/g, "").trim();
}

export function analyze(
  text: string,
  formato: Formato,
  def: TableDef,
  overrides?: Record<string, string | null>,
): AnalysisResult {
  const parsed = parse(text, formato);
  const columns = def.columns;
  let headerMapping: { origem: string; destino: string | null; score: number }[] = [];

  if (parsed.headers && parsed.headers.length > 0) {
    headerMapping = mapHeaders(parsed.headers, columns);
    if (overrides) {
      headerMapping = headerMapping.map((h) =>
        overrides[h.origem] !== undefined
          ? { ...h, destino: overrides[h.origem] }
          : h,
      );
    }
  }

  const problemas: { linha: number; mensagem: string }[] = [];
  const rows: MappedRow[] = parsed.rows.map((row) => {
    const problems: string[] = [];
    const data: Record<string, string | null> = {};

    if (row.headers && row.headers.length > 0) {
      if (row.values.length !== row.headers.length) {
        problems.push(
          `Número de campos (${row.values.length}) diferente do esperado (${row.headers.length})`,
        );
      }
      row.headers.forEach((h, i) => {
        const target =
          headerMapping.find((m) => m.origem === h)?.destino ?? null;
        if (!target) return;
        data[target] = clean(row.values[i] ?? "");
      });
    } else {
      if (row.values.length !== columns.length) {
        problems.push(
          `Número de campos (${row.values.length}) diferente do esperado (${columns.length})`,
        );
      }
      columns.forEach((c, i) => {
        data[c.name] = clean(row.values[i] ?? "");
      });
    }

    columns.forEach((c) => {
      const value = (data[c.name] ?? "").toString().trim();
      if (c.required && (!value || value === NEUTRO)) {
        problems.push(`Campo obrigatório vazio: ${c.name}`);
      }
      if (c.domain && value && value !== NEUTRO) {
        const ok = c.domain.some((d) => normalize(d) === normalize(value));
        if (!ok) {
          problems.push(
            `Valor fora do domínio em ${c.name}: "${value}" (permitidos: ${c.domain.join(", ")})`,
          );
        }
      }
      if (!(c.name in data)) data[c.name] = null;
      else if (data[c.name] === "") data[c.name] = null;
    });

    problems.forEach((p) => problemas.push({ linha: row.index, mensagem: p }));
    return { index: row.index, raw: row.raw, data, problems };
  });

  const aceitas = rows.filter((r) => r.problems.length === 0).length;
  return {
    total: rows.length,
    aceitas,
    rejeitadas: rows.length - aceitas,
    rows,
    headerMapping,
    problemas,
  };
}

export function sugerirLoteId(slug: string): string {
  const d = new Date();
  const data = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}`;
  const s = normalize(slug || "lote").replace(/ /g, "_");
  return `${data}_${s}_v1`;
}
