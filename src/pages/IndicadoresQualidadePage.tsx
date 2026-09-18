import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";

type Indicador = {
  id: number;
  lote_id: string;
  codigo_indicador: string;
  nome: string;
  descricao: string | null;
  tipo: string | null;
  formula_numerador: string | null;
  formula_denominador: string | null;
  meta_pct: string | null;
  meta_operador: string;
  periodicidade: string | null;
  protocolo_id: string | null;
  fonte_id: string | null;
  criterio: string;
  limite_min: number | null;
  etapa_ordem: number | null;
  etapa_titulo_match: string | null;
  ativo: boolean;
};

type Mensal = {
  indicador_id: number | null;
  codigo_indicador: string | null;
  nome: string | null;
  codigo_protocolo: string | null;
  protocolo_nome: string | null;
  mes: string | null;
  numerador: number | null;
  denominador: number | null;
  percentual: number | null;
  meta_valor: number | null;
  meta_operador: string | null;
};

type Form = Omit<Indicador, "id"> & { id?: number };

const novoForm = (lote: string): Form => ({
  lote_id: lote,
  codigo_indicador: "",
  nome: "",
  descricao: "",
  tipo: "processo",
  formula_numerador: "",
  formula_denominador: "",
  meta_pct: "",
  meta_operador: ">=",
  periodicidade: "mensal",
  protocolo_id: null,
  fonte_id: null,
  criterio: "dentro_prazo",
  limite_min: null,
  etapa_ordem: null,
  etapa_titulo_match: "",
  ativo: true,
});

const mesLabel = (m: string | null) =>
  m ? new Date(m + "T00:00:00").toLocaleDateString("pt-BR", { month: "short", year: "numeric" }) : "—";

const metaAtingida = (r: Mensal) => {
  if (r.meta_valor == null || r.percentual == null) return null;
  return r.meta_operador === "<=" ? r.percentual <= r.meta_valor : r.percentual >= r.meta_valor;
};

export default function IndicadoresQualidadePage() {
  const qc = useQueryClient();
  const [filtroProtocolo, setFiltroProtocolo] = useState("todos");
  const [filtroFonte, setFiltroFonte] = useState("todas");
  const [form, setForm] = useState<Form | null>(null);
  const [excluir, setExcluir] = useState<Indicador | null>(null);

  const { data: protocolos } = useQuery({
    queryKey: ["protocolos-ps-lista"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("protocolos_ps").select("id, codigo_protocolo, nome").order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: fontes } = useQuery({
    queryKey: ["referencias-clinicas-lista"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("base_referencias_clinicas").select("id, codigo_fonte, titulo").order("codigo_fonte");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: indicadores, isLoading } = useQuery({
    queryKey: ["indicadores-qualidade"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("indicadores_qualidade_ps").select("*").order("id");
      if (error) throw error;
      return (data ?? []) as unknown as Indicador[];
    },
  });

  const { data: mensal, isLoading: loadingMensal } = useQuery({
    queryKey: ["indicadores-mensal"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_indicadores_ps_mensal").select("*").order("mes", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Mensal[];
    },
  });

  const nomeProtocolo = (id: string | null) =>
    protocolos?.find((p) => p.id === id)?.codigo_protocolo ?? "—";
  const nomeFonte = (id: string | null) =>
    fontes?.find((f) => f.id === id)?.codigo_fonte ?? "—";

  const filtrados = useMemo(
    () =>
      (indicadores ?? []).filter(
        (i) =>
          (filtroProtocolo === "todos" || i.protocolo_id === filtroProtocolo) &&
          (filtroFonte === "todas" || i.fonte_id === filtroFonte),
      ),
    [indicadores, filtroProtocolo, filtroFonte],
  );

  const mensalFiltrado = useMemo(() => {
    const ids = new Set(filtrados.map((i) => i.id));
    return (mensal ?? []).filter((m) => m.indicador_id != null && ids.has(m.indicador_id));
  }, [mensal, filtrados]);

  const traduzErro = (e: { message?: string }) => {
    const m = e?.message ?? "";
    if (m.includes("indicadores_qualidade_ps_lote_codigo_key"))
      return "Já existe um indicador com esse código neste lote.";
    if (m.includes("criterio_check")) return "Critério de cálculo inválido.";
    if (m.includes("meta_operador_check")) return "Operador da meta inválido.";
    return m || "Não foi possível salvar o indicador.";
  };

  const salvar = useMutation({
    mutationFn: async (f: Form) => {
      const payload = {
        lote_id: f.lote_id.trim(),
        codigo_indicador: f.codigo_indicador.trim(),
        nome: f.nome.trim(),
        descricao: f.descricao?.trim() || null,
        tipo: f.tipo || null,
        formula_numerador: f.formula_numerador?.trim() || null,
        formula_denominador: f.formula_denominador?.trim() || null,
        meta_pct: f.meta_pct?.trim() || null,
        meta_operador: f.meta_operador,
        periodicidade: f.periodicidade || null,
        protocolo_id: f.protocolo_id,
        fonte_id: f.fonte_id,
        criterio: f.criterio,
        limite_min: f.limite_min ?? null,
        etapa_ordem: f.etapa_ordem ?? null,
        etapa_titulo_match: f.etapa_titulo_match?.trim() || null,
        ativo: f.ativo,
      };
      if (f.id) {
        const { error } = await supabase.from("indicadores_qualidade_ps").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("indicadores_qualidade_ps").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Indicador salvo.");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["indicadores-qualidade"] });
      qc.invalidateQueries({ queryKey: ["indicadores-mensal"] });
    },
    onError: (e: { message?: string }) => toast.error(traduzErro(e)),
  });

  const remover = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("indicadores_qualidade_ps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Indicador removido.");
      setExcluir(null);
      qc.invalidateQueries({ queryKey: ["indicadores-qualidade"] });
      qc.invalidateQueries({ queryKey: ["indicadores-mensal"] });
    },
    onError: (e: { message?: string }) => toast.error(e?.message ?? "Erro ao remover."),
  });

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Indicadores de Qualidade | PrescriMed</title>
        <meta
          name="description"
          content="Dashboard mensal e gestão dos indicadores de qualidade do pronto-socorro por protocolo e fonte."
        />
        <link rel="canonical" href="/app/indicadores-qualidade" />
      </Helmet>

      <header>
        <h1 className="text-2xl font-semibold">Indicadores de Qualidade</h1>
        <p className="text-sm text-muted-foreground">
          Progresso mensal calculado a partir das execuções auditadas de protocolos.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Protocolo</Label>
            <Select value={filtroProtocolo} onValueChange={setFiltroProtocolo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {(protocolos ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.codigo_protocolo} — {p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fonte</Label>
            <Select value={filtroFonte} onValueChange={setFiltroFonte}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {(fontes ?? []).map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.codigo_fonte}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={() => setForm(novoForm("medflow_ps_v1"))}>
              <Plus className="mr-2 h-4 w-4" /> Novo indicador
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard mensal</TabsTrigger>
          <TabsTrigger value="gerenciar">Gerenciar</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          {loadingMensal ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : mensalFiltrado.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Ainda não há execuções auditadas de protocolo para calcular os indicadores.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {mensalFiltrado.map((r) => {
                const ok = metaAtingida(r);
                return (
                  <Card key={`${r.indicador_id}-${r.mes}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-start justify-between gap-2 text-base">
                        <span>
                          {r.codigo_indicador} — {r.nome}
                        </span>
                        {ok !== null && (
                          <Badge variant={ok ? "default" : "destructive"}>
                            {ok ? "Meta atingida" : "Abaixo da meta"}
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {r.codigo_protocolo} · {mesLabel(r.mes)}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-semibold">{r.percentual ?? 0}%</span>
                        <span className="text-sm text-muted-foreground">
                          meta {r.meta_operador} {r.meta_valor ?? "—"}%
                        </span>
                      </div>
                      <Progress value={Math.min(Number(r.percentual ?? 0), 100)} />
                      <p className="text-xs text-muted-foreground">
                        {r.numerador ?? 0} de {r.denominador ?? 0} registros
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="gerenciar" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Indicadores <Badge variant="secondary">{filtrados.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : filtrados.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum indicador encontrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="w-28">Protocolo</TableHead>
                        <TableHead className="w-20">Fonte</TableHead>
                        <TableHead className="w-28">Critério</TableHead>
                        <TableHead className="w-24">Meta</TableHead>
                        <TableHead className="w-24 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtrados.map((i) => (
                        <TableRow key={i.id}>
                          <TableCell className="font-medium">{i.codigo_indicador}</TableCell>
                          <TableCell>
                            {i.nome}
                            {!i.ativo && <Badge variant="secondary" className="ml-2">inativo</Badge>}
                          </TableCell>
                          <TableCell>{nomeProtocolo(i.protocolo_id)}</TableCell>
                          <TableCell>{nomeFonte(i.fonte_id)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {i.criterio}
                            {i.limite_min ? ` ≤${i.limite_min}min` : ""}
                          </TableCell>
                          <TableCell>{i.meta_operador} {i.meta_pct ?? "—"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon" variant="ghost" aria-label="Editar indicador"
                                onClick={() => setForm({ ...i })}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon" variant="ghost" aria-label="Excluir indicador"
                                onClick={() => setExcluir(i)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Editar indicador" : "Novo indicador"}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="lote">Lote</Label>
                  <Input id="lote" value={form.lote_id}
                    onChange={(e) => setForm({ ...form, lote_id: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input id="codigo" value={form.codigo_indicador}
                    onChange={(e) => setForm({ ...form, codigo_indicador: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={form.tipo ?? "processo"}
                    onValueChange={(v) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger id="tipo"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="processo">Processo</SelectItem>
                      <SelectItem value="resultado">Resultado</SelectItem>
                      <SelectItem value="estrutura">Estrutura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea id="descricao" rows={2} value={form.descricao ?? ""}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="num">Fórmula — numerador</Label>
                  <Input id="num" value={form.formula_numerador ?? ""}
                    onChange={(e) => setForm({ ...form, formula_numerador: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="den">Fórmula — denominador</Label>
                  <Input id="den" value={form.formula_denominador ?? ""}
                    onChange={(e) => setForm({ ...form, formula_denominador: e.target.value })} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Protocolo</Label>
                  <Select value={form.protocolo_id ?? "nenhum"}
                    onValueChange={(v) => setForm({ ...form, protocolo_id: v === "nenhum" ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhum">Sem protocolo</SelectItem>
                      {(protocolos ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.codigo_protocolo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fonte</Label>
                  <Select value={form.fonte_id ?? "nenhuma"}
                    onValueChange={(v) => setForm({ ...form, fonte_id: v === "nenhuma" ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhuma">Sem fonte</SelectItem>
                      {(fontes ?? []).map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.codigo_fonte}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Critério de cálculo</Label>
                  <Select value={form.criterio}
                    onValueChange={(v) => setForm({ ...form, criterio: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dentro_prazo">Dentro do prazo</SelectItem>
                      <SelectItem value="limite_min">Limite de tempo (min)</SelectItem>
                      <SelectItem value="executado">Executado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="limite">Limite (min)</Label>
                  <Input id="limite" type="number" min={0} value={form.limite_min ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, limite_min: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="etapaordem">Etapa (ordem)</Label>
                  <Input id="etapaordem" type="number" min={1} value={form.etapa_ordem ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, etapa_ordem: e.target.value ? Number(e.target.value) : null })} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="match">Filtro do título da etapa</Label>
                  <Input id="match" value={form.etapa_titulo_match ?? ""}
                    onChange={(e) => setForm({ ...form, etapa_titulo_match: e.target.value })}
                    placeholder="Ex.: ECG" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta">Meta (%)</Label>
                  <Input id="meta" value={form.meta_pct ?? ""}
                    onChange={(e) => setForm({ ...form, meta_pct: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Operador da meta</Label>
                  <Select value={form.meta_operador}
                    onValueChange={(v) => setForm({ ...form, meta_operador: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value=">=">No mínimo (≥)</SelectItem>
                      <SelectItem value="<=">No máximo (≤)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="periodicidade">Periodicidade</Label>
                  <Input id="periodicidade" value={form.periodicidade ?? ""}
                    onChange={(e) => setForm({ ...form, periodicidade: e.target.value })} />
                </div>
                <div className="flex items-center gap-2 pb-2 pt-6">
                  <Switch id="ativo" checked={form.ativo}
                    onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
                  <Label htmlFor="ativo">Ativo</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>Cancelar</Button>
            <Button
              disabled={!form?.nome.trim() || !form?.codigo_indicador.trim() || !form?.lote_id.trim() || salvar.isPending}
              onClick={() => form && salvar.mutate(form)}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluir} onOpenChange={(o) => !o && setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir indicador?</AlertDialogTitle>
            <AlertDialogDescription>
              O indicador "{excluir?.codigo_indicador} — {excluir?.nome}" será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => excluir && remover.mutate(excluir.id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
