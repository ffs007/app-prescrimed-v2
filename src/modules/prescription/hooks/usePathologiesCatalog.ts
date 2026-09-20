/**
 * usePathologiesCatalog — fonte única de patologias, vinda do backend.
 *
 * Consulta `base_patologias_ref` e `base_patologias_clinicas` via React Query,
 * deduplica por nome normalizado e converte para o tipo `Pathology` da UI.
 *
 * O conteúdo clínico curado (medicamentos sugeridos, condutas hospitalares e
 * subtipos) é aplicado por cima quando o nome bate — as listas locais deixam de
 * ser a fonte da lista e passam a ser apenas enriquecimento de conduta.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { supabaseUntyped } from "@/integrations/supabase/untyped";
import type { ClinicalEnvironment, ClinicalSeverity, Pathology } from "../types/prescription";
import { DEFAULT_PATHOLOGIES } from "@/data/medications";
import { EXTRA_PATHOLOGIES } from "../data/extraPathologies";

export const pathologiesQueryKey = ["pathologies", "base"] as const;
export const pathologyEnvironmentsQueryKey = ["pathologies", "ambientes"] as const;

type EnvRow = {
  nome_patologia: string;
  nome_normalizado: string;
  ambiente: string;
  gravidade: string | null;
  especialidade: string | null;
  sistema: string | null;
  frequencia: number | null;
};

interface EnvMeta {
  environments: ClinicalEnvironment[];
  severity?: ClinicalSeverity;
  specialty?: string;
  system?: string;
  severityByEnv: Partial<Record<ClinicalEnvironment, ClinicalSeverity>>;
  frequencyByEnv: Partial<Record<ClinicalEnvironment, number>>;
  frequency?: number;
}

const SEVERITY_RANK: Record<string, number> = { leve: 1, moderada: 2, grave: 3, critica: 4 };
const ALL_ENVIRONMENTS: ClinicalEnvironment[] = ["ambulatorial", "urgencia", "emergencia"];
const isEnv = (v: string): v is ClinicalEnvironment =>
  v === "ambulatorial" || v === "urgencia" || v === "emergencia";


type Row = {
  id: string;
  nome_patologia: string | null;
  cid10: string | null;
  categoria_clinica: string | null;
  sinonimos: string | null;
  subtipo: string | null;
  is_emergencia: boolean | string | null;
};

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** ID numérico estável (>= 700000) derivado do UUID, sem colidir com o legado. */
function stableId(uuid: string): number {
  let h = 0;
  for (let i = 0; i < uuid.length; i++) h = (h * 31 + uuid.charCodeAt(i)) | 0;
  return 700000 + (Math.abs(h) % 250000);
}

const asBool = (v: boolean | string | null) =>
  v === true || v === "true" || v === "sim" || v === "t" || v === "1";

const splitSyn = (v: string | null) =>
  (v ?? "")
    .split(/[;,|]/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Conteúdo clínico curado indexado por nome normalizado (apenas enriquecimento). */
const CURATED = new Map<string, Pathology>(
  [...EXTRA_PATHOLOGIES, ...DEFAULT_PATHOLOGIES].map((p) => [normalize(p.name), p] as const),
);

function rowToPathology(row: Row): Pathology | null {
  const base = (row.nome_patologia ?? "").trim();
  if (!base) return null;
  const sub = (row.subtipo ?? "").trim();
  const hasSub = sub !== "" && !/^n(a|ã)o[_ ]/i.test(sub) && normalize(sub) !== normalize(base);
  const name = hasSub ? `${base} — ${sub}` : base;
  const curated = CURATED.get(normalize(name)) ?? CURATED.get(normalize(base));
  return {
    id: stableId(row.id),
    name,
    cid: row.cid10 ?? curated?.cid,
    category: row.categoria_clinica ?? curated?.category,
    isEmergency: asBool(row.is_emergencia) || curated?.isEmergency,
    synonyms: [...splitSyn(row.sinonimos), ...(curated?.synonyms ?? [])],
    meds: curated?.meds ?? [],
    hospitalMeds: curated?.hospitalMeds,
    subtypes: hasSub ? undefined : curated?.subtypes,
  };
}

export function usePathologiesQuery() {
  return useQuery({
    queryKey: pathologiesQueryKey,
    queryFn: async (): Promise<Row[]> => {
      const cols = "id, nome_patologia, cid10, categoria_clinica, sinonimos, subtipo, is_emergencia";
      const [ref, clin] = await Promise.all([
        supabase.from("base_patologias_ref").select(cols).order("nome_patologia"),
        supabase.from("base_patologias_clinicas").select(cols).order("nome_patologia"),
      ]);
      // `base_patologias_ref` é a fonte principal; a tabela complementar pode
      // estar restrita por permissão para alguns papéis — nesse caso é ignorada.
      if (ref.error && clin.error) throw ref.error;
      return [...((ref.data ?? []) as unknown as Row[]), ...((clin.data ?? []) as unknown as Row[])];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Curadoria de ambiente clínico (Ambulatorial / Urgências / Emergências). */
export function usePathologyEnvironmentsQuery() {
  return useQuery({
    queryKey: pathologyEnvironmentsQueryKey,
    queryFn: async (): Promise<EnvRow[]> => {
      const { data, error } = await supabaseUntyped
        .from("patologia_ambiente")
        .select("nome_patologia, nome_normalizado, ambiente, gravidade, especialidade, sistema, frequencia");
      if (error) throw error;
      return (data ?? []) as unknown as EnvRow[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * @param extra Patologias adicionais do usuário (modelos personalizados).
 */
export function usePathologiesCatalog(extra: Pathology[] = []) {
  const { data: rows, isLoading, isError, error, refetch } = usePathologiesQuery();
  const {
    data: envRows,
    isLoading: envLoading,
    isError: envIsError,
    error: envError,
    refetch: refetchEnvironments,
  } = usePathologyEnvironmentsQuery();

  const envByKey = useMemo(() => {
    const map = new Map<string, EnvMeta>();
    for (const row of envRows ?? []) {
      if (!isEnv(row.ambiente)) continue;
      for (const key of [row.nome_normalizado, normalize(row.nome_patologia ?? "")]) {
        if (!key) continue;
        const meta = map.get(key) ?? { environments: [], severityByEnv: {}, frequencyByEnv: {} };
        if (!meta.environments.includes(row.ambiente)) meta.environments.push(row.ambiente);
        const sev = row.gravidade as ClinicalSeverity | null;
        if (sev && (!meta.severity || (SEVERITY_RANK[sev] ?? 0) > (SEVERITY_RANK[meta.severity] ?? 0))) {
          meta.severity = sev;
        }
        if (!meta.specialty && row.especialidade) meta.specialty = row.especialidade;
        if (!meta.system && row.sistema) meta.system = row.sistema;
        if (row.gravidade) meta.severityByEnv[row.ambiente] = row.gravidade as ClinicalSeverity;
        meta.frequencyByEnv[row.ambiente] = row.frequencia ?? 0;
        const freq = row.frequencia ?? 0;
        if (freq > (meta.frequency ?? 0)) meta.frequency = freq;
        map.set(key, meta);
      }
    }
    return map;
  }, [envRows]);

  const pathologies = useMemo<Pathology[]>(() => {
    const byName = new Map<string, Pathology>();
    for (const row of rows ?? []) {
      const mapped = rowToPathology(row);
      if (!mapped) continue;
      const key = normalize(mapped.name);
      const existing = byName.get(key);
      if (!existing) byName.set(key, mapped);
      else if (!existing.cid && mapped.cid) existing.cid = mapped.cid;
    }
    for (const [key, pathology] of byName) {
      const meta = envByKey.get(key);
      if (!meta) {
        pathology.environments = [...ALL_ENVIRONMENTS];
        continue;
      }
      pathology.environments = meta.environments;
      pathology.severity = meta.severity;
      pathology.specialty = meta.specialty ?? pathology.category;
      pathology.system = meta.system ?? "outros";
      pathology.frequency = meta.frequency ?? 0;
      pathology.severityByEnvironment = meta.severityByEnv;
      pathology.frequencyByEnvironment = meta.frequencyByEnv;
      if (meta.environments.includes("emergencia")) pathology.isEmergency = true;
    }
    for (const pathology of extra) {
      const key = normalize(pathology.name);
      if (!byName.has(key)) byName.set(key, pathology);
    }
    return [...byName.values()];
  }, [rows, envByKey, extra]);

  const retry = () => Promise.all([refetch(), refetchEnvironments()]);

  return {
    pathologies,
    isLoading: isLoading || envLoading,
    isError: isError || envIsError,
    error: error ?? envError,
    remoteCount: rows?.length ?? 0,
    refetch: retry,
  };
}
