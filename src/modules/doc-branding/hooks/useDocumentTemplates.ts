import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeBranding } from "../lib/defaults";
import type { DocTypeKey, DocumentBranding, DocumentTemplateRecord } from "../lib/types";

type Row = Record<string, unknown>;

const toRecord = (r: Row): DocumentTemplateRecord => ({
  id: String(r.id),
  user_id: String(r.user_id ?? ""),
  nome: String(r.nome ?? ""),
  descricao: (r.descricao as string) ?? null,
  documento_tipo: (r.documento_tipo as DocTypeKey) ?? "todos",
  is_galeria: Boolean(r.is_galeria),
  visibilidade: (r.visibilidade as DocumentTemplateRecord["visibilidade"]) ?? "privado",
  instituicao: (r.instituicao as string) ?? null,
  config: normalizeBranding(r.config),
  created_at: String(r.created_at ?? ""),
  updated_at: String(r.updated_at ?? ""),
});

export interface SaveTemplateInput {
  nome: string;
  descricao?: string;
  documento_tipo: DocTypeKey;
  visibilidade: DocumentTemplateRecord["visibilidade"];
  instituicao?: string;
  config: DocumentBranding;
}

/** CRUD dos modelos de documento (salvar, duplicar, compartilhar). */
export function useDocumentTemplates() {
  const [templates, setTemplates] = useState<DocumentTemplateRecord[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    setUserId(auth.user?.id ?? null);
    const { data, error } = await supabase
      .from("documento_templates")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) setTemplates((data as Row[]).map(toRecord));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(
    async (input: SaveTemplateInput) => {
      const { error } = await supabase.from("documento_templates").insert({
        nome: input.nome,
        descricao: input.descricao ?? null,
        documento_tipo: input.documento_tipo,
        visibilidade: input.visibilidade,
        instituicao: input.instituicao ?? null,
        config: JSON.parse(JSON.stringify(input.config)),
      });
      if (error) throw error;
      await load();
    },
    [load],
  );

  const update = useCallback(
    async (id: string, patch: Partial<SaveTemplateInput>) => {
      const { error } = await supabase
        .from("documento_templates")
        .update({
          ...(patch.nome !== undefined ? { nome: patch.nome } : {}),
          ...(patch.descricao !== undefined ? { descricao: patch.descricao } : {}),
          ...(patch.documento_tipo !== undefined ? { documento_tipo: patch.documento_tipo } : {}),
          ...(patch.visibilidade !== undefined ? { visibilidade: patch.visibilidade } : {}),
          ...(patch.instituicao !== undefined ? { instituicao: patch.instituicao } : {}),
          ...(patch.config !== undefined
            ? { config: JSON.parse(JSON.stringify(patch.config)) }
            : {}),
        })
        .eq("id", id);
      if (error) throw error;
      await load();
    },
    [load],
  );

  const duplicate = useCallback(
    async (tpl: DocumentTemplateRecord) => {
      await save({
        nome: `${tpl.nome} (cópia)`,
        descricao: tpl.descricao ?? undefined,
        documento_tipo: tpl.documento_tipo,
        visibilidade: "privado",
        instituicao: tpl.instituicao ?? undefined,
        config: tpl.config,
      });
    },
    [save],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("documento_templates").delete().eq("id", id);
      if (error) throw error;
      await load();
    },
    [load],
  );

  return { templates, userId, loading, reload: load, save, update, duplicate, remove };
}
