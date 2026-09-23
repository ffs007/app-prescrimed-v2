/**
 * Auditoria read-only do staging + base no banco de produção.
 * Uso: node --env-file=.env scripts/audit-staging.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SECRET_KEY ausentes no .env");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

async function probe(table, label) {
  try {
    const { data, error } = await db.from(table).select("*").limit(5000);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    console.log(`${table} — ${rows.length} linhas`);
    return rows;
  } catch (e) {
    console.log(`${table} — INACESSÍVEL: ${e.message}`);
    return null;
  }
}

function show(rows, field) {
  if (!rows) return;
  const acc = {};
  for (const r of rows) {
    const k = r?.[field] == null || r?.[field] === "" ? "(vazio)" : String(r[field]);
    acc[k] = (acc[k] ?? 0) + 1;
  }
  const entries = Object.entries(acc).sort((a, b) => b[1] - a[1]);
  if (entries.length) console.log(`    ${field}: ${entries.map(([k, v]) => `${k}=${v}`).join(" · ")}`);
}

console.log("=== STAGING (lotes) ===");
const lotes = await probe("stg_lotes_importacao");
if (lotes) {
  show(lotes, "numero_lote");
  show(lotes, "status");
  for (const l of lotes.slice(0, 10)) {
    console.log(`    lote: ${l.numero_lote ?? l.id} | status=${l.status} | importado_em=${l.importado_em ?? l.created_at}`);
  }
}

console.log("\n=== STAGING (conteúdo) ===");
for (const t of [
  "stg_patologias", "stg_patologia_exames", "stg_exames", "stg_rastreamentos",
  "stg_sinais_alarme", "stg_escores", "stg_escore_itens", "stg_protocolos",
  "stg_med_principio", "stg_med_dose", "stg_med_apresentacao", "stg_med_interacao",
  "stg_med_contraindicacao", "stg_med_iv", "stg_med_regulatorio",
]) {
  const rows = await probe(t);
  if (rows && rows[0] && "status" in rows[0]) show(rows, "status");
}

console.log("\n=== BASE (destino da promoção) ===");
for (const t of [
  "base_patologias_ref", "base_patologias_clinicas", "base_sindromes",
  "patologia_ambiente", "sindrome_patologia", "patologia_medicamento",
  "base_medicamentos_geral", "base_medicamentos_dose", "base_escores_clinicos",
  "base_protocolos_clinicos", "base_sinais_alarme",
]) {
  const rows = await probe(t);
  if (rows && rows[0] && "status_revisao" in rows[0]) show(rows, "status_revisao");
}

console.log("\n=== ETL / curadoria ===");
await probe("etl_promocao_log");
await probe("curadoria_decisoes");

console.log("\n=== fim ===");
