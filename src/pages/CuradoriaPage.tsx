import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, Merge, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface LoteOption { lote_id: string; destino: string; created_at: string }

interface Orfao {
  id: string;
  lote_id: string | null;
  nome_patologia: string | null;
  nome_exame: string | null;
  patologia_orfa: boolean | null;
  exame_orfao: boolean | null;
}

interface Conflito {
  lote_id: string | null;
  nome_patologia: string | null;
  nome_exame: string | null;
  id_a: string;
  id_b: string;
  obrigatoriedade_a: string | null;
  obrigatoriedade_b: string | null;
  nivel_evidencia_a: string | null;
  nivel_evidencia_b: string | null;
  conduta_a: string | null;
  conduta_b: string | null;
  fonte_a: string | null;
  fonte_b: string | null;
  data_a: string;
  data_b: string;
}

interface QuaseDuplicado {
  lote_id: string | null;
  id_a: string;
  nome_a: string | null;
  sigla_a: string | null;
  id_b: string;
  nome_b: string | null;
  sigla_b: string | null;
}

interface Decisao { tipo: string; chave: string; decisao: string }

interface Contagens {
  exames: number;
  patologias: number;
  vinculos: number;
  semFonte: number;
  semJustificativa: number;
  emConflito: number;
  semEvidencia: number;
}

const VAZIO = (v: string | null) => !v || !v.trim() || v.trim() === "NAO_NA_FONTE";

export default function CuradoriaPage() {
  const qc = useQueryClient();
  const [lote, setLote] = useState<string>("");
  const [nomesEditados, setNomesEditados] = useState<Record<string, { patologia: string; exame: string }>>({});
  const [resultado, setResultado] = useState<string | null>(null);

  const { data: lotes = [] } = useQuery({
    queryKey: ["curadoria-lotes"],
    queryFn: async (): Promise<LoteOption[]> => {
      const { data, error } = await supabase
        .from("stg_import_lotes")
        .select("lote_id,destino,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const unicos = new Map<string, LoteOption>();
      (data ?? []).forEach((l) => { if (!unicos.has(l.lote_id)) unicos.set(l.lote_id, l as LoteOption); });
      return Array.from(unicos.values());
    },
  });

  const enabled = lote.length > 0;

  const { data: contagens } = useQuery({
    queryKey: ["curadoria-contagens", lote],
    enabled,
    queryFn: async (): Promise<Contagens> => {
      const [ex, pat, vin, conf] = await Promise.all([
        supabase.from("stg_exames").select("id", { count: "exact", head: true }).eq("lote_id", lote),
        supabase.from("stg_patologias").select("id", { count: "exact", head: true }).eq("lote_id", lote),
        supabase.from("stg_patologia_exames")
          .select("id,fonte_id,justificativa_padrao,nivel_evidencia,conflito").eq("lote_id", lote),
        supabase.from("vw_stg_conflitos").select("id_a").eq("lote_id", lote),
      ]);
      if (vin.error) throw vin.error;
      const linhas = vin.data ?? [];
      return {
        exames: ex.count ?? 0,
        patologias: pat.count ?? 0,
        vinculos: linhas.length,
        semFonte: linhas.filter((l) => VAZIO(l.fonte_id)).length,
        semJustificativa: linhas.filter((l) => VAZIO(l.justificativa_padrao)).length,
        semEvidencia: linhas.filter((l) => VAZIO(l.nivel_evidencia)).length,
        emConflito: conf.data?.length ?? 0,
      };
    },
  });

  const { data: orfaos = [] } = useQuery({
    queryKey: ["curadoria-orfaos", lote],
    enabled,
    queryFn: async (): Promise<Orfao[]> => {
      const { data, error } = await supabase
        .from("vw_stg_orfaos")
        .select("id,lote_id,nome_patologia,nome_exame,patologia_orfa,exame_orfao")
        .eq("lote_id", lote);
      if (error) throw error;
      return ((data ?? []) as Orfao[]).filter((o) => o.patologia_orfa || o.exame_orfao);
    },
  });

  const { data: conflitos = [] } = useQuery({
    queryKey: ["curadoria-conflitos", lote],
    enabled,
    queryFn: async (): Promise<Conflito[]> => {
      const { data, error } = await supabase.from("vw_stg_conflitos").select("*").eq("lote_id", lote);
      if (error) throw error;
      return (data ?? []) as Conflito[];
    },
  });

  const { data: duplicados = [] } = useQuery({
    queryKey: ["curadoria-duplicados", lote],
    enabled,
    queryFn: async (): Promise<QuaseDuplicado[]> => {
      const { data, error } = await supabase
        .from("vw_exames_quase_duplicados").select("*").eq("lote_id", lote);
      if (error) throw error;
      return (data ?? []) as QuaseDuplicado[];
    },
  });

  const { data: decisoes = [] } = useQuery({
    queryKey: ["curadoria-decisoes", lote],
    enabled,
    queryFn: async (): Promise<Decisao[]> => {
      const { data, error } = await supabase
        .from("curadoria_decisoes").select("tipo,chave,decisao").eq("lote_id", lote);
      if (error) throw error;
      return (data ?? []) as Decisao[];
    },
  });

  const decidido = useMemo(() => {
    const set = new Set<string>();
    decisoes.forEach((d) => set.add(`${d.tipo}:${d.chave}`));
    return set;
  }, [decisoes]);

  const conflitosPendentes = conflitos.filter((c) => !decidido.has(`conflito_par:${c.id_a}:${c.id_b}`));
  const duplicadosPendentes = duplicados.filter((d) => !decidido.has(`duplicado:${d.id_a}:${d.id_b}`));

  const registrarDecisao = useMutation({
    mutationFn: async (args: { tipo: string; chave: string; decisao: string; detalhe?: string }) => {
      const { error } = await supabase.from("curadoria_decisoes").upsert(
        { lote_id: lote, tipo: args.tipo, chave: args.chave, decisao: args.decisao, detalhe: args.detalhe ?? null },
        { onConflict: "lote_id,tipo,chave" },
      );
      if (error) throw error;
    },
  });

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["curadoria-decisoes", lote] });
    qc.invalidateQueries({ queryKey: ["curadoria-orfaos", lote] });
    qc.invalidateQueries({ queryKey: ["curadoria-conflitos", lote] });
    qc.invalidateQueries({ queryKey: ["curadoria-duplicados", lote] });
    qc.invalidateQueries({ queryKey: ["curadoria-contagens", lote] });
  };

  const casarNovamente = useMutation({
    mutationFn: async (o: Orfao) => {
      const edit = nomesEditados[o.id];
      const { error } = await supabase
        .from("stg_patologia_exames")
        .update({
          nome_patologia: edit?.patologia ?? o.nome_patologia,
          nome_exame: edit?.exame ?? o.nome_exame,
        })
        .eq("id", o.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Nome atualizado. Recalculando…"); invalidar(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const decidirConflito = useMutation({
    mutationFn: async (args: { c: Conflito; escolha: "primeira" | "segunda" | "ambas" }) => {
      const { c, escolha } = args;
      if (escolha !== "ambas") {
        const descartar = escolha === "primeira" ? c.id_b : c.id_a;
        await registrarDecisao.mutateAsync({ tipo: "conflito", chave: descartar, decisao: "descartar" });
      }
      await registrarDecisao.mutateAsync({
        tipo: "conflito_par", chave: `${c.id_a}:${c.id_b}`, decisao: escolha,
      });
    },
    onSuccess: () => { toast.success("Decisão registrada."); invalidar(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const decidirDuplicado = useMutation({
    mutationFn: async (args: { d: QuaseDuplicado; fundir: boolean }) => {
      const { d, fundir } = args;
      if (fundir) {
        if (d.nome_a && d.nome_b) {
          const { error: upErr } = await supabase
            .from("stg_patologia_exames")
            .update({ nome_exame: d.nome_a })
            .eq("lote_id", lote)
            .eq("nome_exame", d.nome_b);
          if (upErr) throw upErr;
        }
        const { error } = await supabase.from("stg_exames").delete().eq("id", d.id_b);
        if (error) throw error;
      }
      await registrarDecisao.mutateAsync({
        tipo: "duplicado", chave: `${d.id_a}:${d.id_b}`, decisao: fundir ? "fundir" : "ignorar",
      });
    },
    onSuccess: () => { toast.success("Decisão registrada."); invalidar(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const promover = useMutation({
    mutationFn: async () => {
      const p = await supabase.rpc("promover_stg_patologias", { _lote_id: lote });
      if (p.error) throw p.error;
      const e = await supabase.rpc("promover_stg_exames", { _lote_id: lote });
      if (e.error) throw e.error;
      const v = await supabase.rpc("promover_stg_patologia_exames", { _lote_id: lote });
      if (v.error) throw v.error;
      const r = await supabase.rpc("promover_stg_rastreamentos", { _lote_id: lote });
      if (r.error) throw r.error;
      return { patologias: p.data ?? 0, exames: e.data ?? 0, vinculos: v.data ?? 0, rastreamentos: r.data ?? 0 };
    },
    onSuccess: (res) => {
      setResultado(
        `Promovidos: ${res.patologias} patologias, ${res.exames} exames, ${res.vinculos} vínculos, ${res.rastreamentos} rastreamentos.`,
      );
      toast.success("Promoção concluída.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const aprovar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("aprovar_lote", { _lote_id: lote });
      if (error) throw error;
      return data ?? 0;
    },
    onSuccess: (n) => {
      setResultado(`${n} linha(s) marcada(s) como aprovadas — já disponíveis na prescrição.`);
      toast.success("Lote aprovado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const podePromover = enabled && orfaos.length === 0 && conflitosPendentes.length === 0;

  const cards: { label: string; valor: number; alerta?: boolean }[] = [
    { label: "Exames detectados", valor: contagens?.exames ?? 0 },
    { label: "Patologias", valor: contagens?.patologias ?? 0 },
    { label: "Vínculos", valor: contagens?.vinculos ?? 0 },
    { label: "Sem fonte", valor: contagens?.semFonte ?? 0, alerta: true },
    { label: "Sem justificativa", valor: contagens?.semJustificativa ?? 0, alerta: true },
    { label: "Em conflito", valor: contagens?.emConflito ?? 0, alerta: true },
    { label: "Sem nível de evidência", valor: contagens?.semEvidencia ?? 0, alerta: true },
  ];

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/app"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Curadoria de lote clínico</h1>
          <p className="text-sm text-muted-foreground">
            Revise órfãos, conflitos e duplicatas antes de promover para a base definitiva.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Lote</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Label>Selecione o lote</Label>
          <Select value={lote} onValueChange={(v) => { setLote(v); setResultado(null); }}>
            <SelectTrigger><SelectValue placeholder="Escolha um lote importado" /></SelectTrigger>
            <SelectContent>
              {lotes.map((l) => (
                <SelectItem key={l.lote_id} value={l.lote_id}>
                  {l.lote_id} — {l.destino}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {enabled && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {cards.map((c) => (
              <Card key={c.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className={`text-2xl font-semibold ${c.alerta && c.valor > 0 ? "text-destructive" : ""}`}>
                    {c.valor}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Órfãos ({orfaos.length})</CardTitle>
              <CardDescription>Vínculos cujo nome não casou com nenhum registro.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {orfaos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum órfão pendente.</p>
              ) : orfaos.map((o) => {
                const edit = nomesEditados[o.id] ?? {
                  patologia: o.nome_patologia ?? "", exame: o.nome_exame ?? "",
                };
                return (
                  <div key={o.id} className="space-y-2 rounded-md border p-3">
                    <div className="flex flex-wrap gap-2">
                      {o.patologia_orfa && <Badge variant="destructive">patologia sem par</Badge>}
                      {o.exame_orfao && <Badge variant="destructive">exame sem par</Badge>}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Patologia</Label>
                        <Input
                          value={edit.patologia}
                          onChange={(e) => setNomesEditados((s) => ({ ...s, [o.id]: { ...edit, patologia: e.target.value } }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Exame</Label>
                        <Input
                          value={edit.exame}
                          onChange={(e) => setNomesEditados((s) => ({ ...s, [o.id]: { ...edit, exame: e.target.value } }))}
                        />
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => casarNovamente.mutate(o)}>
                      <RefreshCw className="mr-2 h-4 w-4" /> Tentar casar de novo
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conflitos pendentes ({conflitosPendentes.length})</CardTitle>
              <CardDescription>Linhas divergentes sobre o mesmo par patologia-exame.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {conflitosPendentes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum conflito sem decisão.</p>
              ) : conflitosPendentes.map((c) => (
                <div key={`${c.id_a}-${c.id_b}`} className="space-y-3 rounded-md border p-3">
                  <p className="text-sm font-medium">{c.nome_patologia} × {c.nome_exame}</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      { titulo: "Primeira", obr: c.obrigatoriedade_a, ev: c.nivel_evidencia_a, cond: c.conduta_a, fonte: c.fonte_a, data: c.data_a },
                      { titulo: "Segunda", obr: c.obrigatoriedade_b, ev: c.nivel_evidencia_b, cond: c.conduta_b, fonte: c.fonte_b, data: c.data_b },
                    ].map((v) => (
                      <div key={v.titulo} className="space-y-1 rounded-md bg-muted/50 p-3 text-xs">
                        <p className="text-sm font-medium">{v.titulo}</p>
                        <p>Obrigatoriedade: {v.obr ?? "—"}</p>
                        <p>Nível de evidência: {v.ev ?? "—"}</p>
                        <p>Conduta: {v.cond ?? "—"}</p>
                        <p className="text-muted-foreground">
                          Fonte: {v.fonte ?? "—"} · Ano: {new Date(v.data).getFullYear()}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => decidirConflito.mutate({ c, escolha: "primeira" })}>
                      Manter a primeira
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => decidirConflito.mutate({ c, escolha: "segunda" })}>
                      Manter a segunda
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => decidirConflito.mutate({ c, escolha: "ambas" })}>
                      Manter as duas
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quase-duplicatas de exame ({duplicadosPendentes.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {duplicadosPendentes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma quase-duplicata pendente.</p>
              ) : duplicadosPendentes.map((d) => (
                <div key={`${d.id_a}-${d.id_b}`} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm">
                    <p>{d.nome_a} {d.sigla_a ? `(${d.sigla_a})` : ""}</p>
                    <p className="text-muted-foreground">{d.nome_b} {d.sigla_b ? `(${d.sigla_b})` : ""}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => decidirDuplicado.mutate({ d, fundir: true })}>
                      <Merge className="mr-2 h-4 w-4" /> São o mesmo, fundir
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => decidirDuplicado.mutate({ d, fundir: false })}>
                      São diferentes, ignorar
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Promoção e aprovação</CardTitle>
              <CardDescription>
                {podePromover
                  ? "Nenhum órfão pendente e nenhum conflito sem decisão."
                  : "Resolva os órfãos e os conflitos para liberar a promoção."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button disabled={!podePromover || promover.isPending} onClick={() => promover.mutate()}>
                  {promover.isPending
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <ShieldCheck className="mr-2 h-4 w-4" />}
                  Promover para a base definitiva
                </Button>
                <Button variant="secondary" disabled={aprovar.isPending} onClick={() => aprovar.mutate()}>
                  {aprovar.isPending
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Aprovar lote
                </Button>
              </div>
              {resultado && <p className="text-sm text-muted-foreground">{resultado}</p>}
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
