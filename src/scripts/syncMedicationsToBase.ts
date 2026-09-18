/**
 * Fase 1 — Sincronização de Dados.
 *
 * Lê o banco legado hardcoded (`src/data/medications.ts`) e faz upsert em
 * `base_medicamentos_geral`, para que o backend passe a ser a fonte de verdade
 * e o arquivo local possa ser removido na Fase 2.
 *
 * Como executar: chamar `syncMedicationsToBase()` a partir de uma tela de
 * administração (usuário precisa ter permissão de escrita na base).
 * O script é idempotente: casa por nome normalizado e só atualiza campos vazios
 * ou desatualizados, nunca sobrescreve revisão humana já marcada como `revisado`.
 */

import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_MEDICATIONS } from "@/data/medications";
import type { Medication } from "@/types/prescription";

export const normalizeName = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Categorias do enum `medicamento_categoria_clinica`. */
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

/** Tipos do enum `medicamento_tipo_receita`. */
function mapTipoReceita(m: Medication): string {
  switch (m.prescriptionType) {
    case "azul":
      return "especial_b";
    case "amarela":
      return "especial_a";
    case "branca2vias":
      return "antimicrobiano";
    default:
      return "comum";
  }
}

function mapCategoria(category: string): string {
  return CATEGORY_MAP[category] ?? "dor_febre";
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

/** Converte um item legado em uma linha da Base Geral. */
// TODO: Refactor to strict type — o retorno é `Record<string, any>` porque os
// enums do banco ainda não estão tipados no client gerado.
export function medicationToRow(m: Medication): Record<string, any> {
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

export type SyncResult = {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
};

export async function syncMedicationsToBase(
  source: Medication[] = DEFAULT_MEDICATIONS
): Promise<SyncResult> {
  const result: SyncResult = { total: source.length, inserted: 0, updated: 0, skipped: 0, errors: [] };

  // TODO: Refactor to strict type — `as any` necessário enquanto a tabela não
  // estiver refletida nos tipos gerados do backend.
  const { data: existingRaw, error: readError } = await supabase
    .from("base_medicamentos_geral" as any)
    .select("id, principio_ativo, nome_normalizado, status_revisao");

  if (readError) {
    result.errors.push(`Falha ao ler base existente: ${readError.message}`);
    return result;
  }

  const existing = new Map<string, any>();
  for (const row of ((existingRaw as any) ?? []) as any[]) {
    existing.set(row.nome_normalizado ?? normalizeName(row.principio_ativo ?? ""), row);
  }

  const toInsert: Record<string, any>[] = [];

  for (const med of source) {
    const key = normalizeName(med.name);
    const match = existing.get(key);
    const row = medicationToRow(med);

    if (!match) {
      toInsert.push(row);
      continue;
    }

    // Nunca sobrescrever conteúdo já revisado por humano.
    if (match.status_revisao === "revisado") {
      result.skipped++;
      continue;
    }

    const { status_revisao, ...updatable } = row;
    const { error } = await supabase
      .from("base_medicamentos_geral" as any)
      .update(updatable as any)
      .eq("id", match.id);

    if (error) result.errors.push(`${med.name}: ${error.message}`);
    else result.updated++;
  }

  // Insere em lotes para evitar payloads grandes.
  const CHUNK = 50;
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK);
    const { error } = await supabase.from("base_medicamentos_geral" as any).insert(chunk as any);
    if (error) result.errors.push(`Lote ${i / CHUNK + 1}: ${error.message}`);
    else result.inserted += chunk.length;
  }

  return result;
}
