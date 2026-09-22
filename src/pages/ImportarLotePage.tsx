import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Play, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { STG_TABLES, StgTable, TABLE_DEFS } from "@/modules/import-lotes/schema";
import {
  AnalysisResult, Formato, analyze, sugerirLoteId,
} from "@/modules/import-lotes/parsers";

interface LoteHistorico {
  id: string;
  lote_id: string;
  destino: string;
  formato: string;
  linhas_aceitas: number;
  linhas_rejeitadas: number;
  created_at: string;
}

const FORMATOS: { value: Formato; label: string }[] = [
  { value: "jsonl", label: "JSONL (um objeto por linha)" },
  { value: "sql", label: "SQL pronto" },
  { value: "markdown", label: "Tabela markdown" },
  { value: "pipe", label: "Texto livre delimitado por barra vertical" },
];

export default function ImportarLotePage() {
  const qc = useQueryClient();
  const [texto, setTexto] = useState("");
  const [formato, setFormato] = useState<Formato>("pipe");
  const [destino, setDestino] = useState<StgTable>("stg_patologias");
  const [loteId, setLoteId] = useState(() => sugerirLoteId("lote"));
  const [overrides, setOverrides] = useState<Record<string, string | null>>({});
  const [analise, setAnalise] = useState<AnalysisResult | null>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);

  const def = TABLE_DEFS[destino];

  const resetAnalise = () => setAnalise(null);

  const preview = useMemo(() => analise?.rows.slice(0, 5) ?? [], [analise]);

  const { data: historico = [], isLoading: loadingHist } = useQuery({
    queryKey: ["stg-import-lotes"],
    queryFn: async (): Promise<LoteHistorico[]> => {
      const { data, error } = await supabase
        .from("stg_import_lotes")
        .select("id,lote_id,destino,formato,linhas_aceitas,linhas_rejeitadas,created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as LoteHistorico[];
    },
  });

  const importar = useMutation({
    mutationFn: async () => {
      if (!analise) throw new Error("Rode a análise antes de importar.");
      const aceitas = analise.rows.filter((r) => r.problems.length === 0);
      if (aceitas.length === 0) throw new Error("Nenhuma linha válida para importar.");
      const rows = aceitas.map((r) => ({
        ...r.data,
        lote_id: loteId,
        linha_bruta: r.raw,
        linha_origem: String(r.index),
      }));
      const { error } = await supabase.from(destino).insert(rows as never);
      if (error) throw error;
      const { data: userData } = await supabase.auth.getUser();
      const { error: logError } = await supabase.from("stg_import_lotes").insert({
        lote_id: loteId,
        destino,
        formato,
        linhas_aceitas: aceitas.length,
        linhas_rejeitadas: analise.rejeitadas,
        created_by: userData.user?.id ?? null,
      });
      if (logError) throw logError;
      return aceitas.length;
    },
    onSuccess: (n) => {
      toast.success(`${n} linha(s) importada(s) no lote ${loteId}`);
      qc.invalidateQueries({ queryKey: ["stg-import-lotes"] });
      setAnalise(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const desfazer = useMutation({
    mutationFn: async (lote: LoteHistorico) => {
      const { error } = await supabase
        .from(lote.destino as StgTable)
        .delete()
        .eq("lote_id", lote.lote_id);
      if (error) throw error;
      const { error: delError } = await supabase
        .from("stg_import_lotes")
        .delete()
        .eq("id", lote.id);
      if (delError) throw delError;
    },
    onSuccess: () => {
      toast.success("Lote desfeito do staging.");
      qc.invalidateQueries({ queryKey: ["stg-import-lotes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const runAnalise = () => {
    if (!texto.trim()) {
      toast.error("Cole o conteúdo antes de analisar.");
      return;
    }
    const result = analyze(texto, formato, def, overrides);
    setAnalise(result);
    if (result.total === 0) toast.error("Nenhuma linha detectada.");
  };

  const colunasPreview = def.columns.map((c) => c.name);

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/app"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Importação de lotes clínicos</h1>
          <p className="text-sm text-muted-foreground">
            Grava apenas em tabelas de staging (stg_). Nada é escrito nas bases oficiais.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conteúdo bruto</CardTitle>
          <CardDescription>Cole o lote completo abaixo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <input
              ref={arquivoRef}
              type="file"
              accept=".md,.txt,.jsonl,.sql,text/markdown,text/plain,application/sql"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) {
                  toast.error("O arquivo deve ter até 5 MB.");
                  return;
                }
                const content = await file.text();
                setTexto(content);
                setFormato(/\.jsonl$/i.test(file.name)
                  ? "jsonl"
                  : /\.sql$/i.test(file.name) || /^\s*insert\s+into\b/i.test(content)
                    ? "sql"
                    : "markdown");
                setOverrides({});
                setAnalise(null);
              }}
            />
            <Button type="button" variant="outline" onClick={() => arquivoRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Abrir arquivo
            </Button>
          </div>
          <Textarea
            value={texto}
            onChange={(e) => { setTexto(e.target.value); resetAnalise(); }}
            placeholder="Cole o conteúdo ou abra um arquivo Markdown, TXT, JSONL ou SQL."
            className="min-h-[220px] font-mono text-xs"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Formato</Label>
              <Select
                value={formato}
                onValueChange={(v) => { setFormato(v as Formato); resetAnalise(); }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMATOS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Destino (staging)</Label>
              <Select
                value={destino}
                onValueChange={(v) => { setDestino(v as StgTable); setOverrides({}); resetAnalise(); }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STG_TABLES.map((t) => (
                    <SelectItem key={t.table} value={t.table}>
                      {t.label} ({t.table})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="lote">lote_id</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="lote"
                  value={loteId}
                  onChange={(e) => setLoteId(e.target.value)}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLoteId(sugerirLoteId(def.label))}
                >
                  Sugerir
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Formato AAAAMMDD_slug.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={runAnalise} variant="secondary" className="sm:w-auto">
              <Play className="mr-2 h-4 w-4" /> Analisar antes de importar
            </Button>
            <Button
              onClick={() => importar.mutate()}
              disabled={!analise || analise.aceitas === 0 || importar.isPending}
            >
              {importar.isPending
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <Upload className="mr-2 h-4 w-4" />}
              Importar
            </Button>
          </div>
        </CardContent>
      </Card>

      {analise && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Análise (nada foi gravado)</CardTitle>
            <CardDescription>
              {analise.total} linha(s) detectada(s) — {analise.aceitas} passariam,{" "}
              {analise.rejeitadas} seriam rejeitadas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {analise.headerMapping.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Mapeamento proposto do cabeçalho</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {analise.headerMapping.map((m) => (
                    <div key={m.origem} className="flex items-center gap-2 text-sm">
                      <span className="min-w-0 flex-1 truncate font-mono text-xs">{m.origem}</span>
                      <span className="text-muted-foreground">→</span>
                      <Select
                        value={m.destino ?? "__ignorar__"}
                        onValueChange={(v) => {
                          const next = { ...overrides, [m.origem]: v === "__ignorar__" ? null : v };
                          setOverrides(next);
                          setAnalise(analyze(texto, formato, def, next));
                        }}
                      >
                        <SelectTrigger className="h-8 w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__ignorar__">(ignorar)</SelectItem>
                          {def.columns.map((c) => (
                            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Primeiras 5 linhas mapeadas</h3>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">#</TableHead>
                      {colunasPreview.map((c) => (
                        <TableHead key={c} className="whitespace-nowrap">{c}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((r) => (
                      <TableRow key={r.index}>
                        <TableCell className="whitespace-nowrap">
                          {r.index}{" "}
                          {r.problems.length > 0 && (
                            <Badge variant="destructive" className="ml-1">erro</Badge>
                          )}
                        </TableCell>
                        {colunasPreview.map((c) => (
                          <TableCell key={c} className="max-w-[220px] truncate text-xs">
                            {r.data[c] ?? "—"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">
                Problemas encontrados ({analise.problemas.length})
              </h3>
              {analise.problemas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum problema detectado.</p>
              ) : (
                <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
                  {analise.problemas.map((p, i) => (
                    <li key={`${p.linha}-${i}`} className="text-destructive">
                      Linha {p.linha}: {p.mensagem}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos 20 lotes importados</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHist ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : historico.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum lote importado ainda.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>lote_id</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead className="text-right">Aceitas</TableHead>
                    <TableHead className="text-right">Rejeitadas</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(l.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{l.lote_id}</TableCell>
                      <TableCell className="text-xs">{l.destino}</TableCell>
                      <TableCell className="text-right">{l.linhas_aceitas}</TableCell>
                      <TableCell className="text-right">{l.linhas_rejeitadas}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={desfazer.isPending}
                          onClick={() => desfazer.mutate(l)}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" /> Desfazer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
