/**
 * Preenchimento inteligente da AIH — sempre como sugestão revisável.
 *
 * Fontes:
 *  - patologia selecionada (CIDs, procedimento e justificativa provável);
 *  - última emissão registrada no histórico (paciente e terapêutica prescrita);
 *  - dados fixos do serviço/médico salvos localmente (campos repetitivos).
 */
import { getPathologyKnowledge } from "@/modules/prescription/data/pathologyKnowledge";
import type { EmissionRecord } from "@/modules/prescription/hooks/useEmissionHistory";
import type { AihData } from "./aihSpec";

const HISTORY_KEY = "prescrimed-emission-history";
const DEFAULTS_KEY = "prescrimed-aih-defaults";

/** Campos repetitivos do serviço e do médico — reaproveitados a cada AIH. */
export const REPEATABLE_KEYS = [
  "estabelecimento",
  "cnesEstabelecimento",
  "municipioEstabelecimento",
  "medicoNome",
  "medicoCrm",
  "medicoCns",
  "medicoEspecialidade",
] as const;

export const loadAihDefaults = (): AihData => {
  try {
    return JSON.parse(localStorage.getItem(DEFAULTS_KEY) ?? "{}") as AihData;
  } catch {
    return {};
  }
};

export const saveAihDefaults = (data: AihData): AihData => {
  const out: AihData = {};
  for (const k of REPEATABLE_KEYS) {
    const v = data[k];
    if (typeof v === "string" && v.trim()) out[k] = v.trim();
  }
  localStorage.setItem(DEFAULTS_KEY, JSON.stringify(out));
  return out;
};

/** Emissões recentes (histórico local do próprio aparelho). */
export const recentEmissions = (limit = 15): EmissionRecord[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    return Array.isArray(raw) ? (raw as EmissionRecord[]).slice(0, limit) : [];
  } catch {
    return [];
  }
};

export interface CidSuggestion {
  code: string;
  origem: string;
}

/** CIDs sugeridos a partir da patologia e de dados clínicos livres. */
export const suggestCids = (pathology: string, clinicalText = ""): CidSuggestion[] => {
  const out: CidSuggestion[] = [];
  const seen = new Set<string>();
  const push = (code: string, origem: string) => {
    const c = code.trim().toUpperCase();
    if (!c || seen.has(c)) return;
    seen.add(c);
    out.push({ code: c, origem });
  };

  if (pathology.trim()) {
    const k = getPathologyKnowledge({ name: pathology });
    k.cids.forEach((c) => push(c, k.label || pathology));
  }

  // CIDs escritos livremente no texto clínico
  for (const m of clinicalText.matchAll(/\b([A-TV-Z][0-9]{2}(?:\.[0-9]{1,2})?)\b/gi)) {
    push(m[1], "citado no texto clínico");
  }

  return out;
};

/** Terapêutica instituída a partir dos medicamentos de uma emissão. */
export const therapyFromEmission = (rec: EmissionRecord): string =>
  (rec.selected ?? [])
    .map((m) => {
      const anyMed = m as unknown as Record<string, unknown>;
      const nome = String(anyMed.name ?? anyMed.nome ?? "").trim();
      const posologia = String(anyMed.posology ?? anyMed.posologia ?? anyMed.dose ?? "").trim();
      return [nome, posologia].filter(Boolean).join(" — ");
    })
    .filter(Boolean)
    .join("\n");

/** Dados do paciente e terapêutica trazidos de uma emissão anterior. */
export const patchFromEmission = (rec: EmissionRecord): AihData => {
  const patch: AihData = {};
  if (rec.patientName) patch.pacienteNome = rec.patientName;
  const terapia = therapyFromEmission(rec);
  if (terapia) patch.terapeutica = terapia;
  const aih = rec.aih as AihData | undefined;
  if (aih) {
    for (const k of ["cidPrincipal", "cid", "procedimento", "sinaisSintomas", "condicoes"]) {
      const v = aih[k];
      if (typeof v === "string" && v.trim()) {
        patch[k === "cid" ? "cidPrincipal" : k] = v;
      }
    }
  }
  return patch;
};

/** Sugestões de conteúdo clínico a partir da patologia. */
export const patchFromPathology = (pathology: string): AihData => {
  const k = getPathologyKnowledge({ name: pathology });
  const patch: AihData = {};
  if (k.cids[0]) patch.cidPrincipal = k.cids[0];
  if (k.cids[1]) patch.cidSecundario = k.cids[1];
  if (k.label) patch.diagnosticoPrincipal = k.label;
  if (k.condutas.length) patch.terapeutica = k.condutas.join("\n");
  if (k.exames.length) patch.resultadosExames = k.exames.map((e) => `${e}: `).join("\n");
  if (k.label) patch.procedimento = `Tratamento de ${k.label.toLowerCase()}`;
  return patch;
};
