// Etapa 19 — Match de medicamento extraído contra a base IV.
import { supabase } from "@/integrations/supabase/client";

export interface MedCandidate {
  id: string;
  rotulo: string;
  principio_ativo: string;
}

const HIGH_RISK_HINTS = [
  "anfotericina", "amiodarona", "noradrenalina", "vancomicina",
  "insulina", "heparina", "fentanil", "propofol", "potassio",
  "lidocaina", "midazolam",
];

const isHighRiskName = (name: string): boolean => {
  const k = name.toLowerCase();
  return HIGH_RISK_HINTS.some((h) => k.includes(h));
};

/**
 * Tenta encontrar candidatos via princípio ativo / sinônimos / nomes comerciais.
 * Retorna sempre uma lista de candidatos (0..n).
 * Não escolhe automaticamente: a UI decide.
 */
export async function findMedicationCandidates(rawName: string): Promise<MedCandidate[]> {
  if (!rawName.trim()) return [];
  const term = rawName.trim();

  const { data } = await supabase
    .from("iv_medications")
    .select("id, principio_ativo, nome_comercial_referencia, apresentacao, nomes_comerciais, sinonimos, termos_busca")
    .or(
      [
        `principio_ativo.ilike.%${term}%`,
        `nome_comercial_referencia.ilike.%${term}%`,
      ].join(","),
    )
    .limit(10);

  return (data ?? []).map((m) => ({
    id: m.id,
    principio_ativo: m.principio_ativo,
    rotulo: [m.principio_ativo, m.apresentacao, m.nome_comercial_referencia]
      .filter(Boolean)
      .join(" — "),
  }));
}

/** True quando o sistema deve forçar desambiguação (ambíguo OU alto risco). */
export function requiresManualPick(candidates: MedCandidate[], extractedName: string): boolean {
  if (candidates.length > 1) return true;
  if (candidates.length === 1 && isHighRiskName(candidates[0].principio_ativo)) return true;
  if (isHighRiskName(extractedName)) return true;
  return false;
}
