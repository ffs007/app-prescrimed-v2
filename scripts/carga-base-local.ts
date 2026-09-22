/**
 * Carga do lote LOTE_BASE_LOCAL_V1 — ativa o catálogo local curado do app
 * (src/data/medications.ts + src/modules/prescription/data/extraPathologies.ts)
 * no banco de produção, via o pipeline próprio: staging → promover_stg_patologias
 * → aprovar_lote.
 *
 * Regras (nenhum conteúdo clínico novo é inventado):
 *  - Patologias: nome, CID-10, categoria, sinônimos e is_emergencia exatamente
 *    como estão no catálogo local.
 *  - patologia_ambiente: apenas para isEmergency=true → ambiente 'emergencia',
 *    gravidade 'critica' (semântica do próprio campo no types/prescription.ts).
 *    Ambulatorial/Urgências ficam vazias (falha fechada) até curadoria própria.
 *  - Medicamentos: mapeamento idêntico ao de src/scripts/syncMedicationsToBase.ts
 *    (upsert por nome normalizado; nunca sobrescreve status_revisao='revisado').
 *
 * Uso: npx -y tsx --env-file=.env scripts/carga-base-local.ts
 */
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_MEDICATIONS, DEFAULT_PATHOLOGIES } from "../src/data/medications";
import { EXTRA_PATHOLOGIES } from "../src/modules/prescription/data/extraPathologies";
import type { Medication, Pathology } from "../src/types/prescription";

const LOTE = "LOTE_BASE_LOCAL_V1";
const FONTE = "BASE-LOCAL-APP";
const TRECHO = "Catálogo local curado do aplicativo (src/data/medications.ts, extraPathologies.ts)";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SECRET_KEY ausentes no .env");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ============ 1. Patologias → stg_patologias → base → aprovar ============ */

const byName = new Map<string, Pathology>();
for (const p of [...DEFAULT_PATHOLOGIES, ...EXTRA_PATHOLOGIES]) {
  const k = normalizeName(p.name);
  if (!k) continue;
  const prev = byName.get(k);
  if (!prev) byName.set(k, p);
  else if (!prev.isEmergency && p.isEmergency) byName.set(k, { ...prev, isEmergency: true });
  else if (!prev.cid && p.cid) byName.set(k, { ...p, meds: prev.meds, isEmergency: prev.isEmergency || p.isEmergency });
}
const patologias = [...byName.values()];
console.log(`Catálogo local: ${patologias.length} patologias únicas (${DEFAULT_PATHOLOGIES.length} base + ${EXTRA_PATHOLOGIES.length} extras).`);

const stgRows = patologias.map((p, i) => ({
  lote_id: LOTE,
  linha_origem: `base-local:${p.id}:${i}`,
  nome_patologia: p.name,
  sinonimos: p.synonyms?.length ? p.synonyms.join("; ") : null,
  cid10: p.cid ?? null,
  categoria_clinica: p.category ?? null,
  is_emergencia: p.isEmergency ? "true" : "false",
  subtipo: p.subtypes?.length ? p.subtypes.map((s) => s.label ?? s.name ?? "").filter(Boolean).join("; ") || null : null,
  fonte_id: FONTE,
  trecho_citado: TRECHO,
}));

// Staging é recarregável: remove tentativas anteriores do MESMO lote antes de inserir.
await db.from("stg_patologias").delete().eq("lote_id", LOTE);
const { error: stgErr } = await db.from("stg_patologias").insert(stgRows);
if (stgErr) {
  console.error("Falha ao inserir staging:", stgErr.message);
  process.exit(1);
}
console.log(`stg_patologias: ${stgRows.length} linhas inseridas (lote ${LOTE}).`);

const promovidas = await db.rpc("promover_stg_patologias", { _lote_id: LOTE });
if (promovidas.error) {
  console.error("Falha na promoção:", promovidas.error.message);
  process.exit(1);
}
console.log(`promover_stg_patologias: ${promovidas.data} linhas em base_patologias_clinicas.`);

const aprovadas = await db.rpc("aprovar_lote", { _lote_id: LOTE });
if (aprovadas.error) {
  console.error("Falha ao aprovar lote:", aprovadas.error.message);
  process.exit(1);
}
console.log(`aprovar_lote: ${aprovadas.data} registros com status 'aprovado'.`);

/* ============ 2. patologia_ambiente — só isEmergency (sem inferência) ============ */

const ambRows = patologias
  .filter((p) => p.isEmergency)
  .map((p) => ({
    nome_patologia: p.name,
    nome_normalizado: normalizeName(p.name),
    ambiente: "emergencia",
    gravidade: "critica",
    especialidade: p.category ?? null,
  }));
console.log(`patologia_ambiente: ${ambRows.length} classificações derivadas de isEmergency (ambiente 'emergencia').`);
const { data: ambExistentes } = await db.from("patologia_ambiente").select("nome_normalizado, ambiente");
const ambChave = new Set((ambExistentes ?? []).map((r) => `${(r as { nome_normalizado: string }).nome_normalizado}|${(r as { ambiente: string }).ambiente}`));
const ambNovas = ambRows.filter((r) => !ambChave.has(`${r.nome_normalizado}|${r.ambiente}`));
for (let i = 0; i < ambNovas.length; i += 50) {
  const chunk = ambNovas.slice(i, i + 50);
  const { error } = await db.from("patologia_ambiente").insert(chunk);
  if (error) {
    console.error("Falha em patologia_ambiente:", error.message);
    process.exit(1);
  }
}
console.log(`patologia_ambiente: ${ambNovas.length} novas inseridas (${ambRows.length - ambNovas.length} já existiam).`);

/* ============ 3. Medicamentos — mapeamento de syncMedicationsToBase.ts ============ */

const CATEGORY_MAP: Record<string, string> = {
  "Antibióticos": "antibioticos",
  "Anti-inflamatórios": "dor_febre",
  "Analgésicos": "dor_febre",
  "Antitérmicos": "dor_febre",
  "Gastro": "gastrointestinal",
  "Gastrointestinal": "gastrointestinal",
  "Antialérgicos": "alergia_anafilaxia",
  "Alergia": "alergia_anafilaxia",
  "Respiratório": "broncoespasmo_respiratorio",
  "Corticoides": "corticoides",
  "Cardiovascular": "cardiovascular",
  "Anti-hipertensivos": "anti_hipertensivos",
  "Neurológico": "neurologico_anticonvulsivante",
  "Psiquiatria": "psiquiatria_agitacao",
  "Hidratação": "hidratacao_eletrolitos",
  "Metabolismo": "endocrino_metabolico",
  "Diabetes": "diabetes_glicemia",
  "Dermatologia": "dermatologia_basica",
  "Otorrino": "otorrino_oftalmo",
  "Emergência": "emergencia",
  "Controlados": "controlados",
  "Pediatria": "pediatria_comum",
};

function mapTipoReceita(m: Medication): string {
  switch (m.prescriptionType) {
    case "azul": return "especial_b";
    case "amarela": return "especial_a";
    case "branca2vias": return "antimicrobiano";
    default: return "comum";
  }
}
function mapCategoria(category?: string): string {
  return (category && CATEGORY_MAP[category]) || "dor_febre";
}
function mapAlertaGestacao(m: Medication): string {
  if (m.safeForPregnant === true) return "seguro";
  if (m.safeForPregnant === false) {
    if (m.pregnancyRisk === "X") return "contraindicado";
    if (m.pregnancyRisk === "D") return "evitar";
    return "cautela";
  }
  return "sem_dados";
}
function medicationToRow(m: Medication): Record<string, unknown> {
  return {
    principio_ativo: m.name,
    categoria_clinica: mapCategoria(m.category),
    classe_terapeutica: m.category,
    subclasse_terapeutica: m.subCategory ?? null,
    dose_adulto_padrao: m.dosage || null,
    dose_pediatrica_padrao: m.pediatricDose ?? null,
    duracao_padrao: m.instructions || null,
    tipo_receita: mapTipoReceita(m),
    exige_receita_especial: m.prescriptionType === "azul" || m.prescriptionType === "amarela",
    exige_retencao_receita: m.prescriptionType === "azul" || m.prescriptionType === "amarela",
    medicamento_controlado: m.prescriptionType === "azul" || m.prescriptionType === "amarela",
    antimicrobiano: m.category === "Antibióticos",
    medicamento_oral: true,
    uso_em_urgencia: true,
    alerta_gestacao: mapAlertaGestacao(m),
    prioridade_mvp: "alta",
    status_revisao: "rascunho",
    fonte_referencia: "sync:src/data/medications.ts",
    ativo: true,
  };
}

/** Réplica de public.clin_normalize: lower(unaccent), remove não-[a-z0-9 ], colapsa espaços. */
function clinNormalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const { data: existingRaw, error: readError } = await db
  .from("base_medicamentos_geral")
  .select("id, principio_ativo, status_revisao");
if (readError) {
  console.error("Falha ao ler base de medicamentos:", readError.message);
  process.exit(1);
}
const existing = new Map<string, { id: string; status_revisao: string | null }>();
for (const row of existingRaw ?? []) {
  const r = row as { id: string; principio_ativo: string; status_revisao: string | null };
  const k = clinNormalize(r.principio_ativo ?? "");
  if (k) existing.set(k, { id: r.id, status_revisao: r.status_revisao });
}

const toInsert: Record<string, unknown>[] = [];
const chavesDoLote = new Set<string>();
let updated = 0, skipped = 0, duplicados = 0;
const errors: string[] = [];

for (const med of DEFAULT_MEDICATIONS) {
  const chave = clinNormalize(med.name);
  if (!chave) continue;
  const row = medicationToRow(med);
  const match = existing.get(chave);
  if (!match) {
    if (chavesDoLote.has(chave)) {
      duplicados++;
      continue; // mesmo princípio já entra neste lote (apresentação repetida): mantém a 1ª
    }
    chavesDoLote.add(chave);
    toInsert.push(row);
    continue;
  }
  if (match.status_revisao === "revisado") {
    skipped++;
    continue;
  }
  const { status_revisao: _drop, ...updatable } = row;
  const { error } = await db.from("base_medicamentos_geral").update(updatable).eq("id", match.id);
  if (error) errors.push(`${med.name}: ${error.message}`);
  else updated++;
}

let inserted = 0;
for (let i = 0; i < toInsert.length; i += 50) {
  const chunk = toInsert.slice(i, i + 50);
  const { error } = await db.from("base_medicamentos_geral").insert(chunk);
  if (error) errors.push(`Lote ${i / 50 + 1}: ${error.message}`);
  else inserted += chunk.length;
}

console.log(`\nMedicamentos: total=${DEFAULT_MEDICATIONS.length} inseridos=${inserted} atualizados=${updated} ignorados(revisado)=${skipped} erros=${errors.length}`);
for (const e of errors.slice(0, 10)) console.log("  ERRO:", e);

/* ============ 4. Verificação final ============ */
const finalPat = await db.from("base_patologias_clinicas").select("id", { count: "exact", head: true });
const finalAmb = await db.from("patologia_ambiente").select("id", { count: "exact", head: true });
const finalMed = await db.from("base_medicamentos_geral").select("id", { count: "exact", head: true });
const finalDose = await db.from("base_medicamentos_geral").select("id", { count: "exact", head: true }).not("dose_adulto_padrao", "is", null);
console.log(`\n=== ESTADO FINAL ===`);
console.log(`base_patologias_clinicas: ${finalPat.count} | patologia_ambiente: ${finalAmb.count} | base_medicamentos_geral: ${finalMed.count} | com dose: ${finalDose.count}`);
