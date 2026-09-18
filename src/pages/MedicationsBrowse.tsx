import { useEffect, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChevronLeft, ChevronRight, Loader2, Search, TriangleAlert } from "lucide-react";
import { describeSupabaseError } from "@/lib/supabaseError";
import { normalizeClinical } from "@/modules/prescription/services/clinicalSuggestions";

const PAGE_SIZE = 24;

interface MedRow {
  id: string;
  principio_ativo: string;
  nome_comercial_referencia: string | null;
  apresentacao: string | null;
  concentracao: string | null;
  via_administracao: string | null;
  classe_terapeutica: string | null;
  dose_adulto: string | null;
  frequencia: string | null;
  tipo_receita: string | null;
  alto_risco: boolean | null;
  antimicrobiano: boolean | null;
}

// Fonte única: visão consolidada (cadastro + apresentações + doses).
const COLS =
  "id, principio_ativo, nome_comercial_referencia, apresentacao, concentracao, via_administracao, classe_terapeutica, dose_adulto, frequencia, tipo_receita, alto_risco, antimicrobiano";

const RECEITA_LABEL: Record<string, string> = {
  comum: "Receita comum",
  especial_a: "Notificação A",
  especial_b: "Notificação B",
  antimicrobiano: "Antimicrobiano",
};

function useDebounced<T>(value: T, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function MedicationsBrowse() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const term = useDebounced(q.trim());

  useEffect(() => { setPage(0); }, [term]);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["vw_medicamento_completo", term, page],
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      let query = supabase
        .from("vw_medicamento_completo" as never)
        .select(COLS, { count: "exact" })
        .eq("ativo", true)
        .neq("status_revisao", "inativo")
        .order("principio_ativo", { ascending: true })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      // Busca normalizada: cada palavra precisa estar presente (sem acento/caixa).
      for (const token of normalizeClinical(term).split(" ").filter((t) => t.length >= 2)) {
        query = query.ilike("busca_normalizada", `%${token}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: (data ?? []) as unknown as MedRow[], count: count ?? 0 };
    },
  });

  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
  const rangeLabel = useMemo(() => {
    if (!total) return "0 medicamento";
    const from = page * PAGE_SIZE + 1;
    const to = Math.min(total, (page + 1) * PAGE_SIZE);
    return `${from}–${to} de ${total} medicamentos`;
  }, [page, total]);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 space-y-4">
      <Helmet>
        <title>Medicamentos | PrescriMed</title>
        <meta name="description" content="Consulta rápida à base clínica de medicamentos com dose, via e tipo de receita." />
      </Helmet>

      <header>
        <h1 className="text-2xl font-bold">Medicamentos</h1>
        <p className="text-sm text-muted-foreground">
          Base Geral de Medicamentos — consulta direta ao banco clínico.
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
        <Input
          className="pl-8"
          placeholder="Buscar princípio ativo, nome comercial ou classe…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar medicamento"
        />
        {isFetching && !isLoading && (
          <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar os medicamentos</AlertTitle>
          <AlertDescription>{describeSupabaseError(error as { message?: string; code?: string })}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{rangeLabel}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {rows.map((m) => (
              <Card key={m.id}>
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-sm flex items-start justify-between gap-2">
                    <span className="truncate">
                      {[m.principio_ativo, m.concentracao].filter(Boolean).join(" ")}
                    </span>
                    <span className="flex shrink-0 gap-1">
                      {m.alto_risco && <Badge variant="destructive" className="text-[10px]">Alto risco</Badge>}
                      {m.antimicrobiano && <Badge variant="outline" className="text-[10px]">ATB</Badge>}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 text-xs text-muted-foreground space-y-0.5">
                  {m.nome_comercial_referencia && <div>{m.nome_comercial_referencia}</div>}
                  {m.apresentacao && <div>{m.apresentacao}</div>}
                  {m.dose_adulto ? (
                    <div>Dose adulto: {m.dose_adulto}{m.frequencia ? ` · ${m.frequencia}` : ""}</div>
                  ) : (
                    <div className="text-amber-600">Dose não cadastrada</div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {m.via_administracao && <span>Via: {m.via_administracao}</span>}
                    {m.classe_terapeutica && <span>· {m.classe_terapeutica}</span>}
                    {m.tipo_receita && <span>· {RECEITA_LABEL[m.tipo_receita] ?? m.tipo_receita}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {rows.length === 0 && !error && (
              <p className="col-span-full text-center text-sm text-muted-foreground py-6">
                Nenhum medicamento encontrado.
              </p>
            )}
          </div>

          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
              <span className="text-xs text-muted-foreground">Página {page + 1} de {lastPage + 1}</span>
              <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage((p) => Math.min(lastPage, p + 1))}>
                Próxima <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
