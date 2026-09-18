import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, TriangleAlert } from "lucide-react";
import { describeSupabaseError } from "@/lib/supabaseError";

type QuickItem = {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  contexto: string | null;
  visibilidade: string | null;
  status: string | null;
  itens: number;
};

const countItens = (v: unknown) => (Array.isArray(v) ? v.length : 0);

function useQuickTemplates() {
  return useQuery({
    queryKey: ["quick-templates"],
    queryFn: async () => {
      const [modelos, kits, conjuntos] = await Promise.all([
        supabase
          .from("modelos_prescricao")
          .select("id, nome_modelo, descricao, area_clinica, contexto_atendimento, visibilidade, status_revisao, itens_prescricao")
          .eq("ativo", true)
          .order("atualizado_em", { ascending: false }),
        supabase
          .from("kits_rapidos")
          .select("id, nome, categoria, contexto, visibilidade, status_revisao, itens")
          .eq("ativo", true)
          .order("atualizado_em", { ascending: false }),
        supabase
          .from("conjuntos_rapidos")
          .select("id, nome_conjunto, descricao, categoria, contexto_atendimento, visibilidade, status_revisao, itens")
          .eq("ativo", true)
          .order("atualizado_em", { ascending: false }),
      ]);

      const err = modelos.error ?? kits.error ?? conjuntos.error;
      if (err) throw err;

      return {
        modelos: (modelos.data ?? []).map((m): QuickItem => ({
          id: m.id,
          nome: m.nome_modelo,
          descricao: m.descricao,
          categoria: m.area_clinica,
          contexto: m.contexto_atendimento,
          visibilidade: m.visibilidade,
          status: m.status_revisao,
          itens: countItens(m.itens_prescricao),
        })),
        kits: (kits.data ?? []).map((k): QuickItem => ({
          id: k.id,
          nome: k.nome,
          descricao: null,
          categoria: k.categoria,
          contexto: k.contexto,
          visibilidade: k.visibilidade,
          status: k.status_revisao,
          itens: countItens(k.itens),
        })),
        conjuntos: (conjuntos.data ?? []).map((c): QuickItem => ({
          id: c.id,
          nome: c.nome_conjunto,
          descricao: c.descricao,
          categoria: c.categoria,
          contexto: c.contexto_atendimento,
          visibilidade: c.visibilidade,
          status: c.status_revisao,
          itens: countItens(c.itens),
        })),
      };
    },
    staleTime: 60 * 1000,
  });
}

function ItemList({ items, loading }: { items: QuickItem[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Nenhum registro cadastrado no banco para esta categoria.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/app/prescricao/nova">Criar a partir de uma prescrição</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {items.map((i) => (
        <Card key={i.id}>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm flex items-start justify-between gap-2">
              <span className="truncate">{i.nome}</span>
              <Badge variant="outline" className="shrink-0 text-[10px]">{i.itens} item(ns)</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-xs text-muted-foreground space-y-1">
            {i.descricao && <p className="line-clamp-2">{i.descricao}</p>}
            <div className="flex flex-wrap gap-2">
              {i.categoria && <span>{i.categoria}</span>}
              {i.contexto && <span>· {i.contexto}</span>}
              {i.visibilidade && <span>· {i.visibilidade}</span>}
              {i.status && <span>· {i.status.replace(/_/g, " ")}</span>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function QuickTemplates() {
  const [q, setQ] = useState("");
  const { data, isLoading, error } = useQuickTemplates();

  const filter = (list: QuickItem[] = []) => {
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter((i) =>
      [i.nome, i.descricao ?? "", i.categoria ?? ""].join(" ").toLowerCase().includes(term),
    );
  };

  const modelos = useMemo(() => filter(data?.modelos), [data, q]);
  const kits = useMemo(() => filter(data?.kits), [data, q]);
  const conjuntos = useMemo(() => filter(data?.conjuntos), [data, q]);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 space-y-4">
      <Helmet>
        <title>Modelos Rápidos | PrescriMed</title>
        <meta name="description" content="Modelos de prescrição, kits e conjuntos rápidos cadastrados na base clínica." />
      </Helmet>

      <header>
        <h1 className="text-2xl font-bold">Modelos Rápidos</h1>
        <p className="text-sm text-muted-foreground">
          Modelos, kits e conjuntos carregados diretamente do banco clínico. Sempre revise antes de aplicar.
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
        <Input
          className="pl-8"
          placeholder="Buscar modelo, kit ou conjunto…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar modelo"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar os modelos</AlertTitle>
          <AlertDescription>{describeSupabaseError(error as { message?: string; code?: string })}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="modelos">
        <TabsList>
          <TabsTrigger value="modelos">Modelos ({data?.modelos.length ?? 0})</TabsTrigger>
          <TabsTrigger value="kits">Kits ({data?.kits.length ?? 0})</TabsTrigger>
          <TabsTrigger value="conjuntos">Conjuntos ({data?.conjuntos.length ?? 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="modelos" className="mt-4"><ItemList items={modelos} loading={isLoading} /></TabsContent>
        <TabsContent value="kits" className="mt-4"><ItemList items={kits} loading={isLoading} /></TabsContent>
        <TabsContent value="conjuntos" className="mt-4"><ItemList items={conjuntos} loading={isLoading} /></TabsContent>
      </Tabs>
    </div>
  );
}
