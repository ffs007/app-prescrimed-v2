/**
 * Catálogo de escores clínicos vindo do banco (`stg_escores_clinicos`).
 * Busca server-side com paginação e tratamento de permissão.
 */
import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChevronLeft, ChevronRight, Search, TriangleAlert } from "lucide-react";
import { describeSupabaseError } from "@/lib/supabaseError";

const PAGE_SIZE = 12;

type EscoreRow = {
  id: string;
  nome_escore: string;
  sinonimos: string | null;
  especialidade: string | null;
  populacao_alvo: string | null;
  finalidade: string | null;
  conduta_associada: string | null;
  nao_usar_para: string | null;
  versao: string | null;
};

export default function EscoresCatalogoTab() {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => { setTerm(q.trim()); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["escores-catalogo", term, page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = supabase
        .from("stg_escores_clinicos")
        .select(
          "id, nome_escore, sinonimos, especialidade, populacao_alvo, finalidade, conduta_associada, nao_usar_para, versao",
          { count: "exact" },
        )
        .order("nome_escore", { ascending: true })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (term) {
        const like = `%${term}%`;
        query = query.or(
          `nome_escore.ilike.${like},sinonimos.ilike.${like},especialidade.ilike.${like},finalidade.ilike.${like}`,
        );
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: (data ?? []) as unknown as EscoreRow[], count: count ?? 0 };
    },
  });

  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
        <Input
          className="pl-8"
          placeholder="Buscar escore, especialidade ou finalidade…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar escore clínico"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar os escores</AlertTitle>
          <AlertDescription>{describeSupabaseError(error as { message?: string; code?: string })}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-2 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{total} escore(s) na base clínica</p>
          <div className="grid gap-2 md:grid-cols-2">
            {rows.map((e) => (
              <Card key={e.id}>
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-sm flex items-start justify-between gap-2">
                    <span className="truncate">{e.nome_escore}</span>
                    {e.especialidade && (
                      <Badge variant="outline" className="shrink-0 text-[10px]">{e.especialidade}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 text-xs text-muted-foreground space-y-1">
                  {e.finalidade && <p>{e.finalidade}</p>}
                  {e.populacao_alvo && <p>População: {e.populacao_alvo}</p>}
                  {e.conduta_associada && <p>Conduta: {e.conduta_associada}</p>}
                  {e.nao_usar_para && <p className="text-destructive">Não usar para: {e.nao_usar_para}</p>}
                </CardContent>
              </Card>
            ))}
            {rows.length === 0 && !error && (
              <p className="md:col-span-2 text-center text-sm text-muted-foreground py-6">
                Nenhum escore encontrado.
              </p>
            )}
          </div>

          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-1">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
              <span className="text-xs text-muted-foreground">Página {page + 1} de {lastPage + 1}</span>
              <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>
                Próxima <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
