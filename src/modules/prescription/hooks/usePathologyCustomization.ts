/**
 * usePathologyCustomization — ajustes do médico sobre qualquer patologia
 * (do catálogo clínico ou personalizada).
 *
 * Guarda em `patologia_personalizacao` (RLS por user_id) os conteúdos padrão
 * ajustados — anamnese, exames, condutas, prescrições-modelo — e os recursos
 * vinculados (protocolos, guidelines, modelos de documento e arquivos).
 */
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseUntyped } from "@/integrations/supabase/untyped";
import { supabase } from "@/integrations/supabase/client";

export const pathologyCustomizationQueryKey = ["patologia-personalizacao"] as const;

export type ResourceKind = "protocolo" | "guideline" | "modelo" | "arquivo";

export interface PathologyResource {
  id: string;
  tipo: ResourceKind;
  titulo: string;
  /** URL externa (guideline, protocolo institucional) — opcional. */
  url?: string;
  /** Caminho no armazenamento privado quando é arquivo enviado. */
  storagePath?: string;
  nota?: string;
}

export interface PathologyCustomizationInput {
  patologia_key: string;
  patologia_nome: string;
  especialidade?: string;
  favorito?: boolean;
  anamnese: string[];
  exames: string[];
  condutas: string[];
  prescricoes_modelo: string[];
  recursos: PathologyResource[];
  observacoes?: string;
}

export interface PathologyCustomizationRow extends PathologyCustomizationInput {
  id: string;
  favorito: boolean;
  updated_at: string;
}

/** Chave estável por nome — funciona para catálogo e patologias próprias. */
export const pathologyKey = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const asList = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [];

const asResources = (v: unknown): PathologyResource[] =>
  Array.isArray(v) ? (v as PathologyResource[]).filter((r) => r && r.titulo) : [];

export function usePathologyCustomizationsQuery() {
  return useQuery({
    queryKey: pathologyCustomizationQueryKey,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<PathologyCustomizationRow[]> => {
      const { data, error } = await supabaseUntyped
        .from("patologia_personalizacao")
        .select(
          "id, patologia_key, patologia_nome, especialidade, favorito, anamnese, exames, condutas, prescricoes_modelo, recursos, observacoes, updated_at",
        )
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        patologia_key: String(r.patologia_key),
        patologia_nome: String(r.patologia_nome),
        especialidade: (r.especialidade as string | null) ?? undefined,
        favorito: Boolean(r.favorito),
        anamnese: asList(r.anamnese),
        exames: asList(r.exames),
        condutas: asList(r.condutas),
        prescricoes_modelo: asList(r.prescricoes_modelo),
        recursos: asResources(r.recursos),
        observacoes: (r.observacoes as string | null) ?? undefined,
        updated_at: String(r.updated_at),
      }));
    },
  });
}

/** Mapa por chave da patologia, para leitura rápida na UI. */
export function usePathologyCustomizationMap() {
  const { data, isLoading } = usePathologyCustomizationsQuery();
  const map = useMemo(() => {
    const m = new Map<string, PathologyCustomizationRow>();
    for (const row of data ?? []) m.set(row.patologia_key, row);
    return m;
  }, [data]);
  return { map, rows: data ?? [], isLoading };
}

export function usePathologyCustomizationMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: pathologyCustomizationQueryKey });
  };

  const save = useMutation({
    mutationFn: async (input: PathologyCustomizationInput) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Sessão expirada. Entre novamente.");
      const { error } = await supabaseUntyped
        .from("patologia_personalizacao")
        .upsert(
          {
            user_id: userId,
            patologia_key: input.patologia_key,
            patologia_nome: input.patologia_nome,
            especialidade: input.especialidade?.trim() || null,
            favorito: input.favorito ?? false,
            anamnese: input.anamnese.filter((s) => s.trim()),
            exames: input.exames.filter((s) => s.trim()),
            condutas: input.condutas.filter((s) => s.trim()),
            prescricoes_modelo: input.prescricoes_modelo.filter((s) => s.trim()),
            recursos: input.recursos,
            observacoes: input.observacoes?.trim() || null,
          },
          { onConflict: "user_id,patologia_key" },
        );
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseUntyped
        .from("patologia_personalizacao")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { save, remove };
}

/** Envia um arquivo de protocolo para a pasta privada do médico. */
export async function uploadProtocolFile(file: File): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Sessão expirada. Entre novamente.");
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${userId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from("protocolos-usuario").upload(path, file);
  if (error) throw error;
  return path;
}

/** Link temporário para abrir um arquivo enviado. */
export async function getProtocolFileUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("protocolos-usuario")
    .createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}
