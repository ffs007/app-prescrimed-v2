import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Registro = {
  id: number;
  protocolo_id: string | null;
  atendimento_id: string;
  etapa_ordem: number;
  etapa_titulo: string | null;
  tempo_previsto_min: number | null;
  tempo_realizado_min: number | null;
  dentro_prazo: boolean | null;
  timestamp_execucao: string;
};

export default function AuditoriaProtocolosPage() {
  const [protocoloId, setProtocoloId] = useState<string>("todos");
  const [atendimento, setAtendimento] = useState("");
  const [busca, setBusca] = useState("");

  const { data: protocolos } = useQuery({
    queryKey: ["protocolos-lista"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("protocolos_ps")
        .select("id, codigo_protocolo, nome")
        .order("codigo_protocolo");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: registros, isLoading } = useQuery({
    queryKey: ["auditoria-protocolo", protocoloId, busca],
    queryFn: async () => {
      let q = supabase
        .from("audit_protocolo_execucao")
        .select(
          "id, protocolo_id, atendimento_id, etapa_ordem, etapa_titulo, tempo_previsto_min, tempo_realizado_min, dentro_prazo, timestamp_execucao",
        )
        .order("timestamp_execucao", { ascending: false })
        .limit(500);
      if (protocoloId !== "todos") q = q.eq("protocolo_id", protocoloId);
      if (busca.trim()) q = q.eq("atendimento_id", busca.trim());
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Registro[];
    },
  });

  const nomeProtocolo = (id: string | null) => {
    const p = protocolos?.find((x) => x.id === id);
    return p ? p.codigo_protocolo : "—";
  };

  const totaisEtapas = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of protocolos ?? []) map.set(p.id, 0);
    return map;
  }, [protocolos]);

  const { data: etapasPorProtocolo } = useQuery({
    queryKey: ["etapas-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("protocolo_etapas")
        .select("protocolo_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const r of data ?? []) {
        counts[r.protocolo_id as string] = (counts[r.protocolo_id as string] ?? 0) + 1;
      }
      return counts;
    },
  });

  const painel = useMemo(() => {
    const grupos = new Map<
      string,
      { protocoloId: string | null; atendimentos: Set<string>; etapas: number; noPrazo: number; tempo: number }
    >();
    for (const r of registros ?? []) {
      const key = `${r.protocolo_id}`;
      const g =
        grupos.get(key) ??
        { protocoloId: r.protocolo_id, atendimentos: new Set<string>(), etapas: 0, noPrazo: 0, tempo: 0 };
      g.atendimentos.add(r.atendimento_id);
      g.etapas += 1;
      if (r.dentro_prazo) g.noPrazo += 1;
      g.tempo = Math.max(g.tempo, r.tempo_realizado_min ?? 0);
      grupos.set(key, g);
    }
    return [...grupos.values()].map((g) => {
      const totalEtapas = (etapasPorProtocolo?.[g.protocoloId ?? ""] ?? 0) * g.atendimentos.size;
      return {
        ...g,
        taxaConclusao: totalEtapas ? Math.round((g.etapas / totalEtapas) * 100) : null,
      };
    });
  }, [registros, etapasPorProtocolo, totaisEtapas]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
      <Helmet>
        <title>Auditoria de Protocolos | PrescriMed</title>
        <meta
          name="description"
          content="Histórico de execução de protocolos de pronto-socorro por atendimento e por protocolo, com tempos realizados e taxa de conclusão."
        />
      </Helmet>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Auditoria de Protocolos</h1>
        <p className="text-sm text-muted-foreground">
          Histórico de etapas concluídas, tempos realizados e aderência aos tempos-alvo.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="filtro-protocolo">Protocolo</Label>
            <Select value={protocoloId} onValueChange={setProtocoloId}>
              <SelectTrigger id="filtro-protocolo">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {(protocolos ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.codigo_protocolo} — {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="filtro-atendimento">Atendimento</Label>
            <div className="flex gap-2">
              <Input
                id="filtro-atendimento"
                value={atendimento}
                onChange={(e) => setAtendimento(e.target.value)}
                placeholder="ID do atendimento"
              />
              <Button onClick={() => setBusca(atendimento)}>Filtrar</Button>
              {busca && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setAtendimento("");
                    setBusca("");
                  }}
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {painel.map((g) => (
          <Card key={`${g.protocoloId}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{nomeProtocolo(g.protocoloId)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>{g.atendimentos.size} atendimento(s)</p>
              <p>{g.etapas} etapa(s) registrada(s)</p>
              <p>
                Taxa de conclusão:{" "}
                <span className="font-medium text-foreground">
                  {g.taxaConclusao === null ? "—" : `${g.taxaConclusao}%`}
                </span>
              </p>
              <p>
                Tempo total (maior): <span className="font-medium text-foreground">{g.tempo} min</span>
              </p>
              <p>
                No prazo: <span className="font-medium text-foreground">{g.noPrazo}/{g.etapas}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Registros</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (registros ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum registro encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Atendimento</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead className="text-right">Previsto</TableHead>
                    <TableHead className="text-right">Realizado</TableHead>
                    <TableHead>Prazo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(registros ?? []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(r.timestamp_execucao).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell>{nomeProtocolo(r.protocolo_id)}</TableCell>
                      <TableCell className="font-mono text-xs">{r.atendimento_id}</TableCell>
                      <TableCell>
                        {r.etapa_ordem}. {r.etapa_titulo}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.tempo_previsto_min ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">{r.tempo_realizado_min ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={r.dentro_prazo ? "secondary" : "destructive"}>
                          {r.dentro_prazo ? "No prazo" : "Atrasado"}
                        </Badge>
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
