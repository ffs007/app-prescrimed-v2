import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, CheckCircle2, History, Loader2, Save, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { validarLote, type DoseRegistro } from "@/lib/doseValidation";

const LOTE_ID = "medflow_ps_v1";

const CAMPOS_EDITAVEIS = [
  "principio_ativo",
  "via",
  "indicacao",
  "populacao",
  "dose_tipo",
  "dose_min",
  "dose_max",
  "dose_unidade",
  "fonte_id",
] as const;

type CampoEditavel = (typeof CAMPOS_EDITAVEIS)[number];

export default function RevisaoDosesPage() {
  const queryClient = useQueryClient();
  const [filtroPrincipio, setFiltroPrincipio] = useState("");
  const [filtroLinha, setFiltroLinha] = useState("");
  const [somenteInconsistentes, setSomenteInconsistentes] = useState(false);
  const [editando, setEditando] = useState<DoseRegistro | null>(null);
  const [rascunho, setRascunho] = useState<Partial<Record<CampoEditavel, string>>>({});
  const [motivo, setMotivo] = useState("");
  const [historicoDe, setHistoricoDe] = useState<DoseRegistro | null>(null);

  const { data: doses = [], isLoading } = useQuery({
    queryKey: ["revisao-doses", LOTE_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stg_med_dose")
        .select("*")
        .eq("lote_id", LOTE_ID)
        .order("principio_ativo", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as DoseRegistro[];
    },
  });

  const { data: historico = [] } = useQuery({
    queryKey: ["dose-historico", historicoDe?.id],
    enabled: !!historicoDe,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stg_med_dose_historico")
        .select("*")
        .eq("dose_id", historicoDe!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const validacao = useMemo(() => validarLote(doses), [doses]);

  const filtradas = useMemo(() => {
    const pa = filtroPrincipio.trim().toLowerCase();
    const linha = filtroLinha.trim().toLowerCase();
    return doses.filter((d) => {
      if (pa && !(d.principio_ativo ?? "").toLowerCase().includes(pa)) return false;
      if (linha && !(d.linha_origem ?? "").toLowerCase().includes(linha)) return false;
      if (somenteInconsistentes && !(validacao.porDose[d.id]?.length > 0)) return false;
      return true;
    });
  }, [doses, filtroPrincipio, filtroLinha, somenteInconsistentes, validacao]);

  const abrirEdicao = (d: DoseRegistro) => {
    setEditando(d);
    setMotivo("");
    setRascunho(
      Object.fromEntries(CAMPOS_EDITAVEIS.map((c) => [c, (d[c] as string | null) ?? ""])) as Record<CampoEditavel, string>,
    );
  };

  const salvar = useMutation({
    mutationFn: async () => {
      if (!editando) return;
      const anteriores = Object.fromEntries(CAMPOS_EDITAVEIS.map((c) => [c, editando[c] ?? null]));
      const novos = Object.fromEntries(
        CAMPOS_EDITAVEIS.map((c) => [c, (rascunho[c] ?? "").trim() === "" ? null : (rascunho[c] as string).trim()]),
      );
      const mudou = CAMPOS_EDITAVEIS.some((c) => (anteriores[c] ?? null) !== (novos[c] ?? null));
      if (!mudou) throw new Error("Nenhuma alteração para salvar.");

      const versaoAnterior = editando.versao ?? 1;
      const versaoNova = versaoAnterior + 1;
      const { data: userData } = await supabase.auth.getUser();

      const { error: upErr } = await supabase
        .from("stg_med_dose")
        .update({
          ...novos,
          versao: versaoNova,
          revisado_por: userData.user?.id ?? null,
          revisado_em: new Date().toISOString(),
          status_revisao: "revisado",
        })
        .eq("id", editando.id);
      if (upErr) throw upErr;

      const { error: histErr } = await supabase.from("stg_med_dose_historico").insert({
        dose_id: editando.id,
        lote_id: LOTE_ID,
        versao_anterior: versaoAnterior,
        versao_nova: versaoNova,
        alterado_por: userData.user?.id ?? null,
        motivo: motivo.trim() || null,
        dados_anteriores: anteriores,
        dados_novos: novos,
      });
      if (histErr) throw histErr;
    },
    onSuccess: () => {
      toast.success("Dose atualizada com nova versão registrada.");
      setEditando(null);
      queryClient.invalidateQueries({ queryKey: ["revisao-doses", LOTE_ID] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Helmet>
        <title>Revisão de Doses | PrescriMed</title>
        <meta name="description" content="Revisão, versionamento e validação automática das doses do lote clínico." />
      </Helmet>

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/protocolo-checklist" aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Revisão de Doses</h1>
            <p className="text-sm text-muted-foreground">
              Lote {LOTE_ID} · correção com controle de versão, histórico e validação automática.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Doses no lote</CardDescription>
              <CardTitle className="text-2xl">{doses.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Erros bloqueantes</CardDescription>
              <CardTitle className="text-2xl text-destructive">{validacao.erros}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Alertas</CardDescription>
              <CardTitle className="text-2xl">{validacao.alertas}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Princípio ativo..."
                value={filtroPrincipio}
                onChange={(e) => setFiltroPrincipio(e.target.value)}
              />
            </div>
            <Input
              placeholder="linha_origem (ex.: 21)"
              value={filtroLinha}
              onChange={(e) => setFiltroLinha(e.target.value)}
            />
            <Button
              variant={somenteInconsistentes ? "default" : "outline"}
              onClick={() => setSomenteInconsistentes((v) => !v)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Somente inconsistentes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Doses ({filtradas.length})</CardTitle>
            <CardDescription>
              {validacao.erros === 0
                ? "Nenhum erro bloqueante — protocolo pode ser publicado."
                : "Corrija os erros antes de publicar o protocolo."}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Linha</TableHead>
                    <TableHead>Princípio ativo</TableHead>
                    <TableHead>Via</TableHead>
                    <TableHead>População</TableHead>
                    <TableHead>Dose</TableHead>
                    <TableHead>Validação</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtradas.map((d) => {
                    const problemas = validacao.porDose[d.id] ?? [];
                    const temErro = problemas.some((p) => p.severidade === "erro");
                    return (
                      <TableRow key={d.id}>
                        <TableCell>{d.linha_origem ?? "—"}</TableCell>
                        <TableCell className="font-medium">{d.principio_ativo ?? "—"}</TableCell>
                        <TableCell>{d.via ?? "—"}</TableCell>
                        <TableCell>{d.populacao ?? "—"}</TableCell>
                        <TableCell>
                          {d.dose_min ?? "?"}–{d.dose_max ?? "?"} {d.dose_unidade ?? ""}
                        </TableCell>
                        <TableCell className="max-w-[280px]">
                          {problemas.length === 0 ? (
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" /> ok
                            </Badge>
                          ) : (
                            <div className="space-y-1">
                              {problemas.map((p, i) => (
                                <p
                                  key={i}
                                  className={`text-xs ${p.severidade === "erro" ? "text-destructive" : "text-muted-foreground"}`}
                                >
                                  {p.mensagem}
                                </p>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={temErro ? "destructive" : "secondary"}>v{d.versao ?? 1}</Badge>
                        </TableCell>
                        <TableCell className="space-x-2 text-right">
                          <Button size="sm" variant="outline" onClick={() => setHistoricoDe(d)}>
                            <History className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={() => abrirEdicao(d)}>
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtradas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                        Nenhuma dose encontrada com esses filtros.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Corrigir dose</DialogTitle>
            <DialogDescription>
              Linha {editando?.linha_origem ?? "—"} · versão atual v{editando?.versao ?? 1}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {CAMPOS_EDITAVEIS.map((campo) => (
              <div key={campo} className="grid gap-1.5">
                <Label htmlFor={campo} className="capitalize">
                  {campo.replace(/_/g, " ")}
                </Label>
                {campo === "dose_tipo" ? (
                  <Select
                    value={rascunho.dose_tipo ?? ""}
                    onValueChange={(v) => setRascunho((p) => ({ ...p, dose_tipo: v }))}
                  >
                    <SelectTrigger id={campo}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixa">fixa</SelectItem>
                      <SelectItem value="peso">peso</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={campo}
                    value={rascunho[campo] ?? ""}
                    onChange={(e) => setRascunho((p) => ({ ...p, [campo]: e.target.value }))}
                  />
                )}
              </div>
            ))}
            <div className="grid gap-1.5">
              <Label htmlFor="motivo">Motivo da alteração</Label>
              <Textarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
              {salvar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar nova versão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historicoDe} onOpenChange={(o) => !o && setHistoricoDe(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de alterações</DialogTitle>
            <DialogDescription>{historicoDe?.principio_ativo}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {historico.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma alteração registrada.</p>
            )}
            {historico.map((h: Record<string, unknown>) => {
              const antes = (h.dados_anteriores ?? {}) as Record<string, string | null>;
              const depois = (h.dados_novos ?? {}) as Record<string, string | null>;
              const mudados = Object.keys(depois).filter((k) => (antes[k] ?? null) !== (depois[k] ?? null));
              return (
                <div key={String(h.id)} className="rounded-md border p-3 text-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="outline">
                      v{String(h.versao_anterior)} → v{String(h.versao_nova)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(String(h.created_at)).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  {h.motivo ? <p className="mb-2 text-xs text-muted-foreground">Motivo: {String(h.motivo)}</p> : null}
                  <ul className="space-y-1 text-xs">
                    {mudados.map((k) => (
                      <li key={k}>
                        <span className="font-medium">{k.replace(/_/g, " ")}:</span> {antes[k] ?? "—"} → {depois[k] ?? "—"}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
