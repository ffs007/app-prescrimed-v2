/**
 * Auditoria read-only do banco de produção (service key do .env).
 * Uso: node --env-file=.env scripts/audit-base-clinica.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SECRET_KEY ausentes no .env");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

async function probe(table) {
  try {
    const { data, error } = await db.from(table).select("*").limit(5000);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    console.log(`\n### ${table} — ${rows.length} linhas`);
    if (rows[0]) console.log(`    colunas: ${Object.keys(rows[0]).slice(0, 25).join(", ")}`);
    return rows;
  } catch (e) {
    console.log(`\n### ${table} — INACESSÍVEL: ${e.message}`);
    return null;
  }
}

function byField(rows, field) {
  const acc = {};
  for (const r of rows) {
    const k = r?.[field] == null || r?.[field] === "" ? "(vazio)" : String(r[field]);
    acc[k] = (acc[k] ?? 0) + 1;
  }
  return acc;
}

function show(title, acc) {
  const entries = Object.entries(acc).sort((a, b) => b[1] - a[1]);
  console.log(`    ${title}: ${entries.map(([k, v]) => `${k}=${v}`).join(" · ") || "(sem linhas)"}`);
}

/* 1. Fonte única de medicamentos */
const vw = await probe("vw_medicamento_completo");
if (vw) {
  const comDose = vw.filter((r) => r.dose_adulto || r.dose_adulto_padrao);
  const comConc = vw.filter((r) => r.concentracao);
  const comApres = vw.filter((r) => r.apresentacao);
  const comPed = vw.filter((r) => r.dose_pediatrica);
  console.log(`    -> com dose adulto: ${comDose.length} · com concentração: ${comConc.length} · com apresentação: ${comApres.length} · com dose pediátrica: ${comPed.length}`);
  show("ativo", byField(vw, "ativo"));
  show("status_revisao", byField(vw, "status_revisao"));
}

/* 2. Tabelas satélite que alimentam a view */
await probe("base_medicamentos_geral");
const doses = await probe("base_medicamentos_dose");
if (doses) show("por campo dose", { "com dose": doses.filter((r) => r.dose || r.dose_texto).length });
await probe("base_apresentacoes_medicamentos");

/* 3. Vínculos clínicos (sugestões) */
for (const t of ["patologia_medicamento", "sindrome_medicamento", "clinical_condition_medication", "medicamento_grupo_vinculo"]) {
  const rows = await probe(t);
  if (rows) {
    show("status_revisao", byField(rows, "status_revisao"));
    if (rows[0] && "ambiente" in rows[0]) show("ambiente", byField(rows, "ambiente"));
    if (rows[0] && "linha" in rows[0]) show("linha", byField(rows, "linha"));
  }
}

/* 4. Patologias, síndromes e ambientes */
await probe("base_patologias_clinicas");
await probe("base_patologias_ref");
await probe("base_sindromes");
const amb = await probe("patologia_ambiente");
if (amb) show("ambiente", byField(amb, "ambiente"));
const sp = await probe("sindrome_patologia");
if (sp) console.log(`    -> pares síndrome→patologia: ${sp.length}`);

/* 5. Revisão clínica e lacunas */
const rev = await probe("medicamento_revisao_clinica");
if (rev) show("status", byField(rev, "status"));
const lac = await probe("auditoria_sugestoes_lacunas");
if (lac) {
  console.log(`    -> lacunas registradas: ${lac.length}`);
  show("por motivo", byField(lac, "motivo"));
}

console.log("\n=== fim da auditoria ===");
