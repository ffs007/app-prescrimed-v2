import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Copy, Loader2, Search, Stethoscope, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

const LOTE_ID = "medflow_ps_v1";

const LINHAS = [
  { value: "primeira_linha", label: "1ª linha" },
  { value: "segunda_linha", label: "2ª linha" },
  { value: "complementar", label: "Complementar" },
] as const;

const FINALIDADES = [
  { value: "diagnostico", label: "Diagnóstico" },
  { value: "gravidade", label: "Gravidade" },
  { value: "monitoramento", label: "Monitoramento" },
  { value: "exclusao", label: "Exclusão" },
];

const rotuloLinha = (v: string | null) => LINHAS.find((l) => l.value === v)?.label ?? v ?? "—";
const rotuloFinalidade = (v: string | null) => FINALIDADES.find((f) => f.value === v)?.label ?? v ?? "—";

interface Patologia { id: string; nome_patologia: string | null; cid10: string | null; is_emergencia: string | null }
interface Exame { id: string; nome_exame: string | null; sigla: string | null; categoria: string | null; tipo_exame: string | null }
interface Vinculo {
  id: string;
  nome_patologia: string | null;
  nome_exame: string | null;
  linha_recomendacao: string | null;
  finalidade: string | null;
}

export default function VinculoExamesPage() {
  const qc = useQueryClient();
  const [buscaPat, setBuscaPat] = useState("");
  const [buscaExame, setBuscaExame] = useState("");
  const [selecionada, setSelecionada] = useState<string | null>(null);

  const { data: patologias = [], isLoading: loadingPat } = useQuery({
    queryKey: ["stg-patologias-vinculo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stg_patologias")
        .select("id, nome_patologia, cid10, is_emergencia")
        .order("nome_patologia");
      if (error) throw error;
      return (data ?? []) as Patologia[];
    },
  });

  const { data: exames = [], isLoading: loadingEx } = useQuery({
    queryKey: ["stg-exames-vinculo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stg_exames")
        .select("id, nome_exame, sigla, categoria, tipo_exame")
        .order("nome_exame");
      if (error) throw error;
      return (data ?? []) as Exame[];
    },
  });

  const { data: vinculos = [], isLoading: loadingVin } = useQuery({
    queryKey: ["stg-vinculos", selecionada],
    enabled: !!selecionada,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stg_patologia_exames")
        .select("id, nome_patologia, nome_exame, linha_recomendacao, finalidade")
        .eq("nome_patologia", selecionada as string);
      if (error) throw error;
      return (data ?? []) as Vinculo[];
    },
  });

  const vinculoPorExame = useMemo(() => {
    const map = new Map<string, Vinculo>();
    vinculos.forEach((v) => v.nome_exame && map.set(v.nome_exame, v));
    return map;
  }, [vinculos]);

  // Exames duplicados (mesmo exame associado mais de uma vez à patologia)
  const duplicados = useMemo(() => {
    const cont = new Map<string, Vinculo[]>();
    vinculos.forEach((v) => {
      if (!v.nome_exame) return;
      cont.set(v.nome_exame, [...(cont.get(v.nome_exame) ?? []), v]);
    });
    return [...cont.entries()].filter(([, arr]) => arr.length > 1);
  }, [vinculos]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["stg-vinculos", selecionada] });

  const adicionar = useMutation({
    mutationFn: async (exame: Exame) => {
      if (!selecionada || !exame.nome_exame) throw new Error("Selecione uma patologia.");
      // Validação anti-duplicidade direto na base (evita corrida entre abas)
      const { data: existente, error: errCheck } = await supabase
        .from("stg_patologia_exames")
        .select("id")
        .eq("nome_patologia", selecionada)
        .eq("nome_exame", exame.nome_exame)
        .limit(1);
      if (errCheck) throw errCheck;
      if (existente && existente.length > 0) {
        throw new Error(`"${exame.nome_exame}" já está associado a esta patologia.`);
      }
      const { error } = await supabase.from("stg_patologia_exames").insert({
        lote_id: LOTE_ID,
        nome_patologia: selecionada,
        nome_exame: exame.nome_exame,
        linha_recomendacao: "primeira_linha",
        finalidade: "diagnostico",
        subtipo: "",
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Exame associado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stg_patologia_exames").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Exame removido"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const atualizar = useMutation({
    mutationFn: async ({ id, campo, valor }: { id: string; campo: "linha_recomendacao" | "finalidade"; valor: string }) => {
      const patch =
        campo === "linha_recomendacao" ? { linha_recomendacao: valor } : { finalidade: valor };
      const { error } = await supabase.from("stg_patologia_exames").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  // ---------- Copiar recomendações de outra patologia ----------
  const [copiarAberto, setCopiarAberto] = useState(false);
  const [origem, setOrigem] = useState<string | null>(null);
  const [modoConflito, setModoConflito] = useState<"manter" | "sobrescrever">("manter");

  useEffect(() => {
    if (!copiarAberto) { setOrigem(null); setModoConflito("manter"); }
  }, [copiarAberto]);

  const { data: vinculosOrigem = [], isLoading: loadingOrigem } = useQuery({
    queryKey: ["stg-vinculos-origem", origem],
    enabled: !!origem,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stg_patologia_exames")
        .select("id, nome_patologia, nome_exame, linha_recomendacao, finalidade")
        .eq("nome_patologia", origem as string);
      if (error) throw error;
      return (data ?? []) as Vinculo[];
    },
  });

  const analise = useMemo(() => {
    const novos: Vinculo[] = [];
    const iguais: Vinculo[] = [];
    const conflitos: { origem: Vinculo; destino: Vinculo }[] = [];
    const vistos = new Set<string>();
    vinculosOrigem.forEach((v) => {
      if (!v.nome_exame || vistos.has(v.nome_exame)) return;
      vistos.add(v.nome_exame);
      const atual = vinculoPorExame.get(v.nome_exame);
      if (!atual) { novos.push(v); return; }
      const mesmoConteudo =
        (atual.linha_recomendacao ?? "") === (v.linha_recomendacao ?? "") &&
        (atual.finalidade ?? "") === (v.finalidade ?? "");
      if (mesmoConteudo) iguais.push(v);
      else conflitos.push({ origem: v, destino: atual });
    });
    return { novos, iguais, conflitos };
  }, [vinculosOrigem, vinculoPorExame]);

  const copiar = useMutation({
    mutationFn: async () => {
      if (!selecionada || !origem) throw new Error("Selecione a patologia de origem.");
      if (origem === selecionada) throw new Error("A origem deve ser diferente da patologia atual.");
      if (analise.novos.length === 0 && !(modoConflito === "sobrescrever" && analise.conflitos.length > 0)) {
        throw new Error("Nada a copiar: todos os exames já estão associados.");
      }
      if (analise.novos.length > 0) {
        const { error } = await supabase.from("stg_patologia_exames").insert(
          analise.novos.map((v) => ({
            lote_id: LOTE_ID,
            nome_patologia: selecionada,
            nome_exame: v.nome_exame,
            linha_recomendacao: v.linha_recomendacao ?? "primeira_linha",
            finalidade: v.finalidade ?? "diagnostico",
            subtipo: "",
          })),
        );
        if (error) throw error;
      }
      if (modoConflito === "sobrescrever") {
        for (const c of analise.conflitos) {
          const { error } = await supabase
            .from("stg_patologia_exames")
            .update({
              linha_recomendacao: c.origem.linha_recomendacao,
              finalidade: c.origem.finalidade,
            })
            .eq("id", c.destino.id);
          if (error) throw error;
        }
      }
      return {
        inseridos: analise.novos.length,
        atualizados: modoConflito === "sobrescrever" ? analise.conflitos.length : 0,
        ignorados: analise.iguais.length + (modoConflito === "manter" ? analise.conflitos.length : 0),
      };
    },
    onSuccess: (r) => {
      invalidate();
      setCopiarAberto(false);
      toast.success(`${r.inseridos} copiados · ${r.atualizados} atualizados · ${r.ignorados} ignorados`);
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const patologiasFiltradas = patologias.filter((p) =>
    (p.nome_patologia ?? "").toLowerCase().includes(buscaPat.toLowerCase()),
  );
  const examesFiltrados = exames.filter((e) =>
    `${e.nome_exame ?? ""} ${e.sigla ?? ""}`.toLowerCase().includes(buscaExame.toLowerCase()),
  );

  const contagemPorLinha = (linha: string) =>
    vinculos.filter((v) => v.linha_recomendacao === linha).length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Helmet>
        <title>Exames por patologia | PrescriMed Admin</title>
        <meta name="description" content="Associe exames às patologias de emergência e defina a linha de recomendação de cada exame." />
      </Helmet>

      <main className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/app"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link>
          </Button>
        </div>

        <header className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <Stethoscope className="h-6 w-6 text-primary" />
            Exames por patologia
          </h1>
          <p className="text-sm text-muted-foreground">
            Selecione uma patologia de emergência, marque os exames indicados e defina a linha de recomendação.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Patologias</CardTitle>
              <CardDescription>{patologias.length} cadastradas</CardDescription>
              <div className="relative pt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar patologia..."
                  value={buscaPat}
                  onChange={(e) => setBuscaPat(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingPat ? (
                <div className="flex justify-center p-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <ScrollArea className="h-[520px]">
                  <ul className="divide-y">
                    {patologiasFiltradas.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => setSelecionada(p.nome_patologia)}
                          className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-muted ${
                            selecionada === p.nome_patologia ? "bg-muted font-medium text-primary" : "text-foreground"
                          }`}
                        >
                          <span className="block">{p.nome_patologia}</span>
                          {p.cid10 && <span className="text-xs text-muted-foreground">CID-10 {p.cid10}</span>}
                        </button>
                      </li>
                    ))}
                    {patologiasFiltradas.length === 0 && (
                      <li className="p-4 text-sm text-muted-foreground">Nenhuma patologia encontrada.</li>
                    )}
                  </ul>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <CardTitle className="text-base">
                  {selecionada ?? "Selecione uma patologia"}
                </CardTitle>
                {selecionada && (
                  <Dialog open={copiarAberto} onOpenChange={setCopiarAberto}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Copy className="mr-2 h-4 w-4" />Copiar de outra patologia
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Copiar recomendações de exames</DialogTitle>
                        <DialogDescription>
                          Copia os exames de outra patologia para <strong>{selecionada}</strong>, mantendo linha e finalidade.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <Select value={origem ?? undefined} onValueChange={setOrigem}>
                          <SelectTrigger><SelectValue placeholder="Patologia de origem" /></SelectTrigger>
                          <SelectContent className="max-h-72">
                            {patologias
                              .filter((p) => p.nome_patologia && p.nome_patologia !== selecionada)
                              .map((p) => (
                                <SelectItem key={p.id} value={p.nome_patologia as string}>
                                  {p.nome_patologia}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>

                        {origem && (loadingOrigem ? (
                          <div className="flex justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">{analise.novos.length} novos</Badge>
                              <Badge variant="outline">{analise.iguais.length} já idênticos</Badge>
                              <Badge variant={analise.conflitos.length ? "destructive" : "outline"}>
                                {analise.conflitos.length} conflitos
                              </Badge>
                            </div>

                            {analise.conflitos.length > 0 && (
                              <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Conflitos de linha/finalidade</AlertTitle>
                                <AlertDescription>
                                  <ScrollArea className="max-h-40 pr-2">
                                    <ul className="mt-1 space-y-1 text-xs">
                                      {analise.conflitos.map((c) => (
                                        <li key={c.destino.id}>
                                          <strong>{c.origem.nome_exame}</strong>: atual{" "}
                                          {rotuloLinha(c.destino.linha_recomendacao)} / {rotuloFinalidade(c.destino.finalidade)}
                                          {" → "}
                                          origem {rotuloLinha(c.origem.linha_recomendacao)} / {rotuloFinalidade(c.origem.finalidade)}
                                        </li>
                                      ))}
                                    </ul>
                                  </ScrollArea>
                                </AlertDescription>
                              </Alert>
                            )}

                            {analise.conflitos.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Ao salvar, em caso de conflito:</p>
                                <Select value={modoConflito} onValueChange={(v) => setModoConflito(v as "manter" | "sobrescrever")}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="manter">Manter configuração atual</SelectItem>
                                    <SelectItem value="sobrescrever">Sobrescrever com a da origem</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <DialogFooter>
                        <Button variant="ghost" onClick={() => setCopiarAberto(false)}>Cancelar</Button>
                        <Button
                          onClick={() => copiar.mutate()}
                          disabled={!origem || loadingOrigem || copiar.isPending}
                        >
                          {copiar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Copiar exames
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <CardDescription className="flex flex-wrap gap-2 pt-1">
                {selecionada ? (
                  <>
                    <Badge variant="secondary">{vinculos.length} exames</Badge>
                    {LINHAS.map((l) => (
                      <Badge key={l.value} variant="outline">{l.label}: {contagemPorLinha(l.value)}</Badge>
                    ))}
                  </>
                ) : (
                  "Escolha uma patologia na lista ao lado para associar exames."
                )}
              </CardDescription>
              {selecionada && (
                <div className="relative pt-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar exame..."
                    value={buscaExame}
                    onChange={(e) => setBuscaExame(e.target.value)}
                  />
                </div>
              )}
            </CardHeader>
            <CardContent>
              {selecionada && duplicados.length > 0 && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Exames duplicados</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p className="text-xs">
                      {duplicados.length} exame(s) aparecem mais de uma vez nesta patologia. Remova as cópias extras.
                    </p>
                    <ul className="space-y-1 text-xs">
                      {duplicados.map(([nome, arr]) => (
                        <li key={nome} className="flex items-center justify-between gap-2">
                          <span>{nome} ({arr.length}x)</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => arr.slice(1).forEach((v) => remover.mutate(v.id))}
                          >
                            Remover extras
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {!selecionada ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  Nenhuma patologia selecionada.
                </p>
              ) : loadingEx || loadingVin ? (
                <div className="flex justify-center p-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <ScrollArea className="h-[520px] pr-2">
                  <ul className="space-y-2">
                    {examesFiltrados.map((exame) => {
                      const vinculo = exame.nome_exame ? vinculoPorExame.get(exame.nome_exame) : undefined;
                      const ativo = !!vinculo;
                      return (
                        <li
                          key={exame.id}
                          className={`flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center ${
                            ativo ? "border-primary/40 bg-primary/5" : "border-border"
                          }`}
                        >
                          <div className="flex flex-1 items-start gap-3">
                            <Checkbox
                              checked={ativo}
                              onCheckedChange={(checked) => {
                                if (checked) adicionar.mutate(exame);
                                else if (vinculo) remover.mutate(vinculo.id);
                              }}
                              aria-label={`Associar ${exame.nome_exame}`}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{exame.nome_exame}</p>
                              <p className="text-xs text-muted-foreground">
                                {[exame.sigla, exame.categoria, exame.tipo_exame].filter(Boolean).join(" · ")}
                              </p>
                            </div>
                          </div>

                          {ativo && vinculo && (
                            <div className="flex flex-wrap items-center gap-2">
                              <Select
                                value={vinculo.linha_recomendacao ?? "primeira_linha"}
                                onValueChange={(valor) =>
                                  atualizar.mutate({ id: vinculo.id, campo: "linha_recomendacao", valor })
                                }
                              >
                                <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Linha" /></SelectTrigger>
                                <SelectContent>
                                  {LINHAS.map((l) => (
                                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={vinculo.finalidade ?? "diagnostico"}
                                onValueChange={(valor) =>
                                  atualizar.mutate({ id: vinculo.id, campo: "finalidade", valor })
                                }
                              >
                                <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Finalidade" /></SelectTrigger>
                                <SelectContent>
                                  {FINALIDADES.map((f) => (
                                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => remover.mutate(vinculo.id)}
                                aria-label="Remover associação"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                    {examesFiltrados.length === 0 && (
                      <li className="p-4 text-sm text-muted-foreground">Nenhum exame encontrado.</li>
                    )}
                  </ul>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
