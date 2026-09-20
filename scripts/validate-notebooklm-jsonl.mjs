import { readFile } from "node:fs/promises";

const [table, file] = process.argv.slice(2);
const supportedTables = new Set([
  "stg_patologias",
  "stg_exames",
  "stg_patologia_exames",
  "stg_med_principio",
  "stg_med_apresentacao",
  "stg_med_dose",
  "stg_med_populacao",
  "stg_med_interacao",
  "stg_med_contraindicacao",
  "stg_med_iv",
  "stg_med_regulatorio",
]);
const generatedFields = new Set([
  "id",
  "created_at",
  "updated_at",
  "importado_em",
  "processado",
  "revisado_em",
  "revisado_por",
  "versao",
]);
const requiredFields = {
  stg_patologias: ["lote_id", "nome_patologia", "fonte_id", "trecho_citado"],
  stg_exames: ["lote_id", "nome_exame", "fonte_id", "trecho_citado"],
  stg_patologia_exames: ["lote_id", "nome_patologia", "nome_exame", "fonte_id", "trecho_citado"],
  stg_med_principio: ["lote_id", "principio_ativo", "fonte_id", "trecho_citado"],
  stg_med_apresentacao: ["lote_id", "principio_ativo", "fonte_id", "trecho_citado"],
  stg_med_dose: ["lote_id", "principio_ativo", "fonte_id", "trecho_citado"],
  stg_med_populacao: ["lote_id", "principio_ativo", "fonte_id", "trecho_citado"],
  stg_med_interacao: ["lote_id", "principio_ativo_1", "principio_ativo_2", "fonte_id", "trecho_citado"],
  stg_med_contraindicacao: ["lote_id", "principio_ativo", "fonte_id", "trecho_citado"],
  stg_med_iv: ["lote_id", "principio_ativo", "fonte_id", "trecho_citado"],
  stg_med_regulatorio: ["lote_id", "principio_ativo", "fonte_id", "trecho_citado"],
};
const identityFields = {
  stg_patologias: ["nome_patologia", "subtipo"],
  stg_exames: ["nome_exame", "sigla"],
  stg_patologia_exames: ["nome_patologia", "subtipo", "nome_exame"],
  stg_med_principio: ["principio_ativo"],
  stg_med_apresentacao: ["principio_ativo", "forma_farmaceutica", "via", "concentracao_texto"],
  stg_med_dose: ["principio_ativo", "via", "indicacao", "populacao", "dose_tipo"],
  stg_med_populacao: ["principio_ativo", "populacao", "condicao"],
  stg_med_interacao: ["principio_ativo_1", "principio_ativo_2", "tipo_interacao"],
  stg_med_contraindicacao: ["principio_ativo", "tipo", "condicao"],
  stg_med_iv: ["principio_ativo", "concentracao_maxima_mg_ml", "concentracao_usual_mg_ml"],
  stg_med_regulatorio: ["principio_ativo", "lista", "familia_receituario"],
};

if (!table || !file || !supportedTables.has(table)) {
  console.error(`Uso: node scripts/validate-notebooklm-jsonl.mjs <${[...supportedTables].join("|")}> <arquivo.jsonl>`);
  process.exit(2);
}

function extractRowFields(typeSource, tableName) {
  const tableStart = typeSource.indexOf(`${tableName}: {`);
  if (tableStart < 0) throw new Error(`Tabela ${tableName} não encontrada em types.ts.`);
  const rowStart = typeSource.indexOf("Row: {", tableStart);
  if (rowStart < 0) throw new Error(`Definição Row ausente para ${tableName} em types.ts.`);
  const bodyStart = rowStart + "Row: {".length;
  let depth = 1;
  let cursor = bodyStart;
  while (depth > 0 && cursor < typeSource.length) {
    if (typeSource[cursor] === "{") depth++;
    if (typeSource[cursor] === "}") depth--;
    cursor++;
  }
  if (depth !== 0) throw new Error(`Definição Row incompleta para ${tableName}.`);
  return new Set(
    [...typeSource.slice(bodyStart, cursor - 1).matchAll(/^\s{10}([a-z][a-z0-9_]*):/gm)]
      .map((match) => match[1])
      .filter((field) => !generatedFields.has(field)),
  );
}

const normalize = (value) => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const readStdin = () => new Promise((resolve) => {
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => { input += chunk; });
  process.stdin.on("end", () => resolve(input));
});

try {
  const [typeSource, jsonl] = await Promise.all([
    readFile("src/integrations/supabase/types.ts", "utf8"),
    file === "-" ? readStdin() : readFile(file, "utf8"),
  ]);
  const allowedFields = extractRowFields(typeSource, table);
  const errors = [];
  const warnings = [];
  const seen = new Map();
  let records = 0;

  for (const [index, rawLine] of jsonl.split(/\r?\n/).entries()) {
    if (!rawLine.trim()) continue;
    const lineNumber = index + 1;
    let row;
    try {
      row = JSON.parse(rawLine);
    } catch {
      errors.push(`linha ${lineNumber}: JSON inválido`);
      continue;
    }
    records++;
    if (!row || Array.isArray(row) || typeof row !== "object") {
      errors.push(`linha ${lineNumber}: esperado objeto JSON`);
      continue;
    }

    for (const key of Object.keys(row)) {
      if (!allowedFields.has(key)) errors.push(`linha ${lineNumber}: coluna não importável ou inexistente: ${key}`);
      if (row[key] !== null && typeof row[key] !== "string") {
        errors.push(`linha ${lineNumber}: ${key} deve ser texto ou null`);
      }
    }
    for (const key of requiredFields[table]) {
      if (typeof row[key] !== "string" || !row[key].trim()) {
        errors.push(`linha ${lineNumber}: campo obrigatório vazio/ausente: ${key}`);
      }
    }

    const identityValues = identityFields[table].map((field) => normalize(row[field]));
    if (table === "stg_med_interacao") {
      identityValues.splice(0, 2, ...identityValues.slice(0, 2).sort());
    }
    const identity = identityValues.join("|");
    if (identity && identity.replaceAll("|", "")) {
      if (seen.has(identity)) warnings.push(`linhas ${seen.get(identity)} e ${lineNumber}: possível duplicata (${identity})`);
      else seen.set(identity, lineNumber);
    }
  }

  console.log(`Tabela: ${table}`);
  console.log(`Registros lidos: ${records}`);
  console.log(`Colunas aceitas: ${allowedFields.size} (tipos Supabase locais)`);
  for (const warning of warnings) console.warn(`AVISO: ${warning}`);
  for (const error of errors) console.error(`ERRO: ${error}`);
  console.log(errors.length ? `REPROVADO: ${errors.length} erro(s), ${warnings.length} aviso(s)` : `APROVADO: ${warnings.length} aviso(s) de possível duplicata`);
  if (errors.length) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
