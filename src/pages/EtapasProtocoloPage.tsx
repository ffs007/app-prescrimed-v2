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
import { Skeleton } from "@/components/ui/skeleton";
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
import { Pencil, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

type Etapa = {
  id: string;
  protocolo_id: string | null;
  ordem: number;
  fase: string | null;
  titulo: string;
  instrucao: string | null;
  tempo_alvo_min: number | null;
  obrigatorio: boolean | null;
};

type FormState = {
  id?: string;
  ordem: string;
  fase: string;
  titulo: string;
  instrucao: string;
  tempo_alvo_min: string;
  obrigatorio: boolean;
};

const emptyForm: FormState = {
  ordem: "",
  fase: "",
  titulo: "",
  instrucao: "",
  tempo_alvo_min: "",
  obrigatorio: true,
};

export default function EtapasProtocoloPage() {
  const qc = useQueryClient();
  const [protocoloId, setProtocoloId] = useState<string>("");
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [excluir, setExcluir] = useState<Etapa | null>(null);

  const { data: protocolos, isLoading: loadingProtocolos } = useQuery({
    queryKey: ["protocolos-ps-lista"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("protocolos_ps")
        .select("id, codigo_protocolo, nome")
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const protocoloAtual = protocoloId || protocolos?.[0]?.id || "";

  const { data: etapas, isLoading } = useQuery({
    queryKey: ["protocolo-etapas", protocoloAtual],
    enabled: !!protocoloAtual,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("protocolo_etapas")
        .select("id, protocolo_id, ordem, fase, titulo, instrucao, tempo_alvo_min, obrigatorio")
        .eq("protocolo_id", protocoloAtual)
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as Etapa[];
    },
  });

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return etapas ?? [];
    return (etapas ?? []).filter(
      (e) =>
        e.titulo.toLowerCase().includes(termo) ||
        (e.fase ?? "").toLowerCase().includes(termo) ||
        (e.instrucao ?? "").toLowerCase().includes(termo),
    );
  }, [etapas, busca]);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["protocolo-etapas", protocoloAtual] });

  const traduzErro = (error: { message?: string; code?: string }) => {
    const msg = error?.message ?? "";
    if (msg.includes("uq_protocolo_etapas_protocolo_ordem"))
      return "Já existe uma etapa com essa ordem neste protocolo.";
    if (msg.includes("uq_protocolo_etapas_protocolo_titulo"))
      return "Já existe uma etapa com esse título neste protocolo.";
    if (msg.includes("protocolo_etapas_ordem_positiva"))
      return "A ordem deve ser um número maior que zero.";
    return msg || "Não foi possível salvar a etapa.";
  };

  const salvar = useMutation({
    mutationFn: async (f: FormState) => {
      const payload = {
        protocolo_id: protocoloAtual,
        ordem: Number(f.ordem),
        fase: f.fase.trim() || null,
        titulo: f.titulo.trim(),
        instrucao: f.instrucao.trim() || null,
        tempo_alvo_min: f.tempo_alvo_min ? Number(f.tempo_alvo_min) : null,
        obrigatorio: f.obrigatorio,
      };
      if (f.id) {
        const { error } = await supabase.from("protocolo_etapas").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("protocolo_etapas").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Etapa salva.");
      setForm(null);
      invalidate();
    },
    onError: (e: { message?: string }) => toast.error(traduzErro(e)),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("protocolo_etapas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Etapa removida.");
      setExcluir(null);
      invalidate();
    },
    onError: (e: { message?: string }) => toast.error(e?.message ?? "Erro ao remover."),
  });

  const trocarOrdem = useMutation({
    mutationFn: async ({ a, b }: { a: Etapa; b: Etapa }) => {
      // usa ordem temporária negativa para não violar a unicidade
      const temp = -Math.abs(a.ordem);
      const steps = [
        supabase.from("protocolo_etapas").update({ ordem: temp }).eq("id", a.id),
        supabase.from("protocolo_etapas").update({ ordem: a.ordem }).eq("id", b.id),
        supabase.from("protocolo_etapas").update({ ordem: b.ordem }).eq("id", a.id),
      ];
      for (const s of steps) {
        const { error } = await s;
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
    onError: (e: { message?: string }) => toast.error(e?.message ?? "Erro ao reordenar."),
  });

  const proximaOrdem = (etapas?.length ? Math.max(...etapas.map((e) => e.ordem)) : 0) + 1;

  const nomeProtocolo = protocolos?.find((p) => p.id === protocoloAtual)?.nome ?? "";

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Etapas de Protocolos | PrescriMed</title>
        <meta
          name="description"
          content="Gerencie as etapas dos protocolos de pronto-socorro: ordem, fase, título e instrução."
        />
        <link rel="canonical" href="/app/protocolos-etapas" />
      </Helmet>

      <header>
        <h1 className="text-2xl font-semibold">Etapas de Protocolos</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre e reorganize as etapas de cada protocolo. Ordem e título são únicos por protocolo.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seleção</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Protocolo</Label>
            {loadingProtocolos ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={protocoloAtual} onValueChange={setProtocoloId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um protocolo" />
                </SelectTrigger>
                <SelectContent>
                  {(protocolos ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.codigo_protocolo} — {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="busca-etapa">Buscar</Label>
            <Input
              id="busca-etapa"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Título, fase ou instrução"
            />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={!protocoloAtual}
              onClick={() => setForm({ ...emptyForm, ordem: String(proximaOrdem) })}
            >
              <Plus className="mr-2 h-4 w-4" /> Nova etapa
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Etapas {nomeProtocolo && `— ${nomeProtocolo}`}{" "}
            <Badge variant="secondary">{filtradas.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtradas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma etapa cadastrada para este protocolo.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Ordem</TableHead>
                    <TableHead className="w-40">Fase</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Instrução</TableHead>
                    <TableHead className="w-24">Tempo</TableHead>
                    <TableHead className="w-40 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtradas.map((e, idx) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.ordem}</TableCell>
                      <TableCell>
                        {e.fase ? <Badge variant="outline">{e.fase}</Badge> : "—"}
                      </TableCell>
                      <TableCell>
                        {e.titulo}
                        {!e.obrigatorio && (
                          <Badge variant="secondary" className="ml-2">
                            opcional
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md text-sm text-muted-foreground">
                        {e.instrucao ?? "—"}
                      </TableCell>
                      <TableCell>{e.tempo_alvo_min ? `${e.tempo_alvo_min} min` : "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Mover para cima"
                            disabled={idx === 0 || !!busca || trocarOrdem.isPending}
                            onClick={() => trocarOrdem.mutate({ a: e, b: filtradas[idx - 1] })}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Mover para baixo"
                            disabled={idx === filtradas.length - 1 || !!busca || trocarOrdem.isPending}
                            onClick={() => trocarOrdem.mutate({ a: e, b: filtradas[idx + 1] })}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Editar etapa"
                            onClick={() =>
                              setForm({
                                id: e.id,
                                ordem: String(e.ordem),
                                fase: e.fase ?? "",
                                titulo: e.titulo,
                                instrucao: e.instrucao ?? "",
                                tempo_alvo_min: e.tempo_alvo_min ? String(e.tempo_alvo_min) : "",
                                obrigatorio: e.obrigatorio ?? true,
                              })
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Excluir etapa"
                            onClick={() => setExcluir(e)}
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

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form?.id ? "Editar etapa" : "Nova etapa"}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ordem">Ordem</Label>
                  <Input
                    id="ordem"
                    type="number"
                    min={1}
                    value={form.ordem}
                    onChange={(e) => setForm({ ...form, ordem: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fase">Fase</Label>
                  <Input
                    id="fase"
                    value={form.fase}
                    onChange={(e) => setForm({ ...form, fase: e.target.value })}
                    placeholder="Ex.: reconhecimento"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instrucao">Instrução</Label>
                <Textarea
                  id="instrucao"
                  rows={4}
                  value={form.instrucao}
                  onChange={(e) => setForm({ ...form, instrucao: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 items-end gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tempo">Tempo alvo (min)</Label>
                  <Input
                    id="tempo"
                    type="number"
                    min={0}
                    value={form.tempo_alvo_min}
                    onChange={(e) => setForm({ ...form, tempo_alvo_min: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch
                    id="obrigatorio"
                    checked={form.obrigatorio}
                    onCheckedChange={(v) => setForm({ ...form, obrigatorio: v })}
                  />
                  <Label htmlFor="obrigatorio">Obrigatória</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button
              disabled={
                !form?.titulo.trim() || !form?.ordem || Number(form?.ordem) < 1 || salvar.isPending
              }
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
            <AlertDialogTitle>Excluir etapa?</AlertDialogTitle>
            <AlertDialogDescription>
              A etapa "{excluir?.titulo}" será removida permanentemente deste protocolo.
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
