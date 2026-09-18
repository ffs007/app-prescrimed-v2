import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRightLeft,
  CheckCircle2,
  Database,
  Loader2,
  PlayCircle,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const LOTE_PADRAO = "medflow_ps_v1";

const ETAPAS = [
  { chave: "med_principio", nome: "Medicamentos (princípios)", origem: "stg_med_principio", destino: "base_medicamentos_geral" },
  { chave: "med_dose", nome: "Doses", origem: "stg_med_dose", destino: "base_medicamentos_dose" },
  { chave: "med_iv", nome: "Diluição IV", origem: "stg_med_iv", destino: "base_iv_diluicao" },
  { chave: "med_interacao", nome: "Interações", origem: "stg_med_interacao", destino: "base_medicamentos_interacoes" },
  { chave: "med_contraindicacao", nome: "Contraindicações", origem: "stg_med_contraindicacao", destino: "base_medicamentos_contraindicacoes" },
  { chave: "med_monitoramento", nome: "Monitoramento", origem: "stg_med_monitoramento", destino: "base_medicamentos_monitoramento" },
  { chave: "med_equivalencia", nome: "Equivalências", origem: "stg_med_equivalencia", destino: "base_medicamentos_equivalencia" },
  { chave: "patologias", nome: "Patologias", origem: "stg_patologias", destino: "base_patologias_ref" },
] as const;

type EtapaResultado = {
  etapa: string;
  status: string;
  lidos: number;
  inseridos: number;
  atualizados: number;
  rejeitados: number;
  duracao_ms: number;
  erro: string | null;
};

type LogRow = EtapaResultado & {
  id: string;
  lote_id: string;
  tabela_origem: string;
  tabela_destino: string;
  created_at: string;
};

type ConsistenciaRow = {
  tabela_origem: string;
  tabela_destino: string;
  total_staging: number;
  total_base: number;
  diferenca: number;
  pct_promovido: number | null;
  status: string;
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    sucesso: { label: "Sucesso", variant: "default" },
    ok: { label: "Completo", variant: "default" },
    parcial: { label: "Parcial", variant: "secondary" },
    nao_promovido: { label: "Não promovido", variant: "destructive" },
    vazio: { label: "Sem dados", variant: "outline" },
    erro: { label: "Erro", variant: "destructive" },
  };
  const cfg = map[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export default function PromocaoBasePage() {
  const queryClient = useQueryClient();
  const [lote, setLote] = useState(LOTE_PADRAO);
  const [etapaAtual, setEtapaAtual] = useState<string | null>(null);
  const [resultados, setResultados] = useState<EtapaResultado[]>([]);

  const { data: consistencia = [], isLoading: loadingCons } = useQuery({
    queryKey: ["etl-consistencia"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_etl_consistencia" as never)
        .select("*");
      if (error) throw error;
      return (data ?? []) as unknown as ConsistenciaRow[];
    },
  });

  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ["etl-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("etl_promocao_log" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as unknown as LogRow[];
    },
  });

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ["etl-consistencia"] });
    queryClient.invalidateQueries({ queryKey: ["etl-logs"] });
  };

  const promoverEtapa = useMutation({
    mutationFn: async (etapa: string) => {
      setEtapaAtual(etapa);
      const { data, error } = await supabase.rpc("fn_etl_promover_etapa" as never, {
        p_etapa: etapa,
        p_lote: lote,
      } as never);
      if (error) throw error;
      return (data ?? []) as unknown as EtapaResultado[];
    },
    onSuccess: (rows) => {
      setResultados((prev) => [...rows, ...prev].slice(0, 30));
      const r = rows[0];
      if (r?.status === "erro") toast.error(`Falha na etapa ${r.etapa}: ${r.erro}`);
      else toast.success(`${r?.etapa}: ${r?.inseridos} inseridos, ${r?.atualizados} atualizados`);
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setEtapaAtual(null),
  });

  const promoverTudo = useMutation({
    mutationFn: async () => {
      setEtapaAtual("__todas__");
      const { data, error } = await supabase.rpc("fn_etl_promover_tudo" as never, {
        p_lote: lote,
      } as never);
      if (error) throw error;
      return (data ?? []) as unknown as EtapaResultado[];
    },
    onSuccess: (rows) => {
      setResultados(rows);
      const erros = rows.filter((r) => r.status === "erro").length;
      if (erros > 0) toast.warning(`Pipeline concluído com ${erros} etapa(s) em erro`);
      else toast.success("Pipeline concluído com sucesso");
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setEtapaAtual(null),
  });

  const executando = promoverEtapa.isPending || promoverTudo.isPending;

  const resumo = useMemo(() => {
    const total = consistencia.reduce((acc, c) => acc + Number(c.total_staging || 0), 0);
    const promovido = consistencia.reduce((acc, c) => acc + Number(c.total_base || 0), 0);
    const pendentes = consistencia.filter((c) => c.status === "nao_promovido" || c.status === "parcial").length;
    return {
      total,
      promovido,
      pendentes,
      pct: total > 0 ? Math.min(100, Math.round((promovido / total) * 100)) : 0,
    };
  }, [consistencia]);

  const resultadoPorEtapa = useMemo(() => {
    const m = new Map<string, EtapaResultado>();
    resultados.forEach((r) => {
      if (!m.has(r.etapa)) m.set(r.etapa, r);
    });
    return m;
  }, [resultados]);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <Helmet>
        <title>Promoção Staging → Base | PrescriMed</title>
        <meta
          name="description"
          content="Painel administrativo para executar e acompanhar a promoção de dados clínicos das tabelas de importação para as tabelas definitivas."
        />
      </Helmet>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link to="/app">
              <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
            </Link>
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <ArrowRightLeft className="h-6 w-6 text-primary" />
            Promoção Staging → Base
          </h1>
          <p className="text-sm text-muted-foreground">
            Pipeline de limpeza, validação e carga incremental dos dados clínicos.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={invalidar} disabled={executando}>
          <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
        </Button>
      </header>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Execução do pipeline</CardTitle>
          <CardDescription>
            Escolha o lote e execute todas as etapas ou uma etapa isolada. A carga é incremental:
            registros existentes são atualizados, sem duplicar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-64">
              <Label htmlFor="lote">Lote</Label>
              <Input
                id="lote"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                placeholder="medflow_ps_v1"
                disabled={executando}
              />
            </div>
            <Button onClick={() => promoverTudo.mutate()} disabled={executando || !lote.trim()}>
              {promoverTudo.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="mr-2 h-4 w-4" />
              )}
              Executar todas as etapas
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Cobertura geral (staging → base): {resumo.promovido} de {resumo.total} registros
              </span>
              <span className="font-medium">{resumo.pct}%</span>
            </div>
            <Progress value={resumo.pct} />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Etapas</CardTitle>
          <CardDescription>Execute e acompanhe cada rotina individualmente.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {ETAPAS.map((etapa) => {
              const r = resultadoPorEtapa.get(etapa.chave);
              const rodando = etapaAtual === etapa.chave || etapaAtual === "__todas__";
              return (
                <div
                  key={etapa.chave}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium">{etapa.nome}</span>
                      {r && <StatusBadge status={r.status} />}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {etapa.origem} → {etapa.destino}
                    </p>
                    {r && (
                      <p className="mt-1 text-xs">
                        {r.lidos} lidos · {r.inseridos} inseridos · {r.atualizados} atualizados ·{" "}
                        {r.rejeitados} rejeitados · {r.duracao_ms} ms
                      </p>
                    )}
                    {r?.erro && (
                      <p className="mt-1 text-xs text-destructive">{r.erro}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => promoverEtapa.mutate(etapa.chave)}
                    disabled={executando || !lote.trim()}
                  >
                    {rodando && executando ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PlayCircle className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Relatório de consistência</CardTitle>
          <CardDescription>
            Comparação de contagens entre cada tabela de importação e sua tabela definitiva.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCons ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Origem</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead className="text-right">Staging</TableHead>
                    <TableHead className="text-right">Base</TableHead>
                    <TableHead className="text-right">Diferença</TableHead>
                    <TableHead className="text-right">% promovido</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consistencia.map((c) => (
                    <TableRow key={c.tabela_origem}>
                      <TableCell className="font-mono text-xs">{c.tabela_origem}</TableCell>
                      <TableCell className="font-mono text-xs">{c.tabela_destino}</TableCell>
                      <TableCell className="text-right">{c.total_staging}</TableCell>
                      <TableCell className="text-right">{c.total_base}</TableCell>
                      <TableCell className="text-right">{c.diferenca}</TableCell>
                      <TableCell className="text-right">
                        {c.pct_promovido === null ? "—" : `${c.pct_promovido}%`}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={c.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de execuções</CardTitle>
          <CardDescription>Últimas 60 execuções registradas, com contagens por etapa.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma execução registrada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead className="text-right">Lidos</TableHead>
                    <TableHead className="text-right">Inseridos</TableHead>
                    <TableHead className="text-right">Atualizados</TableHead>
                    <TableHead className="text-right">Rejeitados</TableHead>
                    <TableHead className="text-right">Duração</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(l.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-xs">{l.etapa}</TableCell>
                      <TableCell className="font-mono text-xs">{l.lote_id}</TableCell>
                      <TableCell className="text-right">{l.lidos}</TableCell>
                      <TableCell className="text-right">{l.inseridos}</TableCell>
                      <TableCell className="text-right">{l.atualizados}</TableCell>
                      <TableCell className="text-right">{l.rejeitados}</TableCell>
                      <TableCell className="text-right">{l.duracao_ms} ms</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          {l.status === "erro" ? (
                            <XCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                          <StatusBadge status={l.status} />
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
