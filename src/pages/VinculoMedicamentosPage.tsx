/**
 * Curadoria dos vínculos doença/síndrome → medicamento.
 * Permite filtrar, editar, remover e criar vínculos, além de acompanhar a
 * cobertura por ambiente (quantas doenças já têm primeira escolha).
 */
import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const AMBIENTES = ["ambulatorial", "urgencia", "emergencia"] as const;
const LINHAS = ["primeira", "alternativa", "sintomatico", "suporte"] as const;
const LINHA_LABEL: Record<string, string> = {
  primeira: "1ª escolha",
  alternativa: "Alternativa",
  sintomatico: "Sintomático",
  suporte: "Suporte",
};

interface Vinculo {
  id: string;
  patologia_nome: string;
  medicamento_nome: string;
  ambiente: string;
  linha: string;
  via: string | null;
  dose_adulto: string | null;
  dose_pediatrica: string | null;
  duracao: string | null;
  status_revisao: string;
}

const VinculoMedicamentosPage = () => {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [ambiente, setAmbiente] = useState<string>("todos");
  const [novo, setNovo] = useState({
    patologia: "",
    medicamento: "",
    ambiente: "urgencia",
    linha: "primeira",
    via: "",
    dose_adulto: "",
    dose_pediatrica: "",
    duracao: "",
  });

  const vinculos = useQuery({
    queryKey: ["admin-vinculos-med", busca, ambiente],
    queryFn: async (): Promise<Vinculo[]> => {
      let q = supabase
        .from("patologia_medicamento" as any)
        .select(
          "id, patologia_nome, medicamento_nome, ambiente, linha, via, dose_adulto, dose_pediatrica, duracao, status_revisao",
        )
        .order("patologia_nome", { ascending: true })
        .order("prioridade", { ascending: true })
        .limit(400);
      if (ambiente !== "todos") q = q.eq("ambiente", ambiente);
      if (busca.trim().length >= 2) {
        const t = busca.trim();
        q = q.or(`patologia_nome.ilike.%${t}%,medicamento_nome.ilike.%${t}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return ((data as any) ?? []) as Vinculo[];
    },
  });

  const cobertura = useQuery({
    queryKey: ["admin-vinculos-cobertura"],
    queryFn: async () => {
      const [links, doencas] = await Promise.all([
        supabase
          .from("patologia_medicamento" as any)
          .select("patologia_normalizada, ambiente, linha")
          .eq("linha", "primeira")
          .limit(5000),
        supabase.from("patologia_ambiente" as any).select("nome_patologia, ambiente").limit(5000),
      ]);
      if (links.error) throw links.error;
      if (doencas.error) throw doencas.error;
      const cobertas = new Set(
        ((links.data as any) ?? []).map((r: any) => `${r.ambiente}|${r.patologia_normalizada}`),
      );
      const out: Record<string, { total: number; com: number }> = {};
      for (const r of ((doencas.data as any) ?? []) as any[]) {
        const amb = r.ambiente as string;
        out[amb] = out[amb] ?? { total: 0, com: 0 };
        out[amb].total += 1;
        if (cobertas.has(`${amb}|${String(r.nome_patologia).toLowerCase()}`)) out[amb].com += 1;
      }
      return out;
    },
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("patologia_medicamento" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vínculo removido");
      qc.invalidateQueries({ queryKey: ["admin-vinculos-med"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Não foi possível remover"),
  });

  const criar = useMutation({
    mutationFn: async () => {
      if (novo.patologia.trim().length < 3 || novo.medicamento.trim().length < 3) {
        throw new Error("Informe a doença e o medicamento");
      }
      const { error } = await supabase.from("patologia_medicamento" as any).insert({
        patologia_nome: novo.patologia.trim(),
        patologia_normalizada: novo.patologia.trim().toLowerCase(),
        medicamento_nome: novo.medicamento.trim(),
        ambiente: novo.ambiente,
        linha: novo.linha,
        via: novo.via || null,
        dose_adulto: novo.dose_adulto || null,
        dose_pediatrica: novo.dose_pediatrica || null,
        duracao: novo.duracao || null,
        fonte: "Curadoria manual",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vínculo criado");
      setNovo({ ...novo, medicamento: "", via: "", dose_adulto: "", dose_pediatrica: "", duracao: "" });
      qc.invalidateQueries({ queryKey: ["admin-vinculos-med"] });
      qc.invalidateQueries({ queryKey: ["admin-vinculos-cobertura"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Não foi possível criar"),
  });

  const lista = useMemo(() => vinculos.data ?? [], [vinculos.data]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4">
      <Helmet>
        <title>Curadoria de medicamentos por doença | PrescriMed</title>
        <meta
          name="description"
          content="Gerencie os vínculos entre doenças, síndromes e medicamentos, com dose, via e linha de escolha."
        />
      </Helmet>

      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/app">
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Medicamentos por doença</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Cobertura</CardTitle>
          <CardDescription>Doenças com pelo menos uma primeira escolha cadastrada.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {AMBIENTES.map((amb) => {
            const c = cobertura.data?.[amb];
            return (
              <Badge key={amb} variant="outline" className="text-xs">
                {amb}: {c ? `${c.com}/${c.total}` : "—"}
              </Badge>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Novo vínculo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <Input
            placeholder="Doença (nome exato do catálogo)"
            value={novo.patologia}
            onChange={(e) => setNovo({ ...novo, patologia: e.target.value })}
          />
          <Input
            placeholder="Medicamento"
            value={novo.medicamento}
            onChange={(e) => setNovo({ ...novo, medicamento: e.target.value })}
          />
          <Select value={novo.ambiente} onValueChange={(v) => setNovo({ ...novo, ambiente: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {AMBIENTES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={novo.linha} onValueChange={(v) => setNovo({ ...novo, linha: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LINHAS.map((l) => <SelectItem key={l} value={l}>{LINHA_LABEL[l]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Via" value={novo.via} onChange={(e) => setNovo({ ...novo, via: e.target.value })} />
          <Input placeholder="Duração" value={novo.duracao} onChange={(e) => setNovo({ ...novo, duracao: e.target.value })} />
          <Input placeholder="Dose adulto" value={novo.dose_adulto} onChange={(e) => setNovo({ ...novo, dose_adulto: e.target.value })} />
          <Input placeholder="Dose pediátrica" value={novo.dose_pediatrica} onChange={(e) => setNovo({ ...novo, dose_pediatrica: e.target.value })} />
          <div className="sm:col-span-2">
            <Button size="sm" onClick={() => criar.mutate()} disabled={criar.isPending}>
              {criar.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Vínculos cadastrados</CardTitle>
          <CardDescription>Mostrando até 400 registros por filtro.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Buscar doença ou medicamento"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Select value={ambiente} onValueChange={setAmbiente}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os ambientes</SelectItem>
                {AMBIENTES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[420px] pr-2">
            {vinculos.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
            {!vinculos.isLoading && lista.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum vínculo encontrado.</p>
            )}
            <div className="space-y-2">
              {lista.map((v) => (
                <div key={v.id} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{v.patologia_nome}</div>
                    <div className="text-muted-foreground">
                      {v.medicamento_nome} · {LINHA_LABEL[v.linha] ?? v.linha} · {v.ambiente}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {[v.via, v.dose_adulto, v.dose_pediatrica, v.duracao].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Remover vínculo"
                    onClick={() => remover.mutate(v.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default VinculoMedicamentosPage;
