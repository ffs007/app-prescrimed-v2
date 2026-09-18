import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Download, RotateCcw, TimerReset, TriangleAlert } from "lucide-react";
import {
  carregarSessao,
  dentroDoPrazo,
  limparSessao,
  minutosDecorridos,
  novaSessao,
  registrarExecucaoEtapa,
  salvarSessao,
  type SessaoProtocolo,
} from "@/lib/protocoloAudit";

type Etapa = {
  id: string;
  ordem: number;
  fase: string | null;
  titulo: string;
  instrucao: string | null;
  tempo_alvo_min: number | null;
  obrigatorio: boolean | null;
};

const FASE_LABEL: Record<string, string> = {
  reconhecimento: "Reconhecimento",
  diagnostico: "Diagnóstico",
  tratamento: "Tratamento",
  suporte: "Suporte",
  reavaliacao: "Reavaliação",
  definicao_destino: "Definição de destino",
};

const faseLabel = (f: string | null) =>
  f ? FASE_LABEL[f] ?? f.replace(/_/g, " ") : "Etapas";

const fmtRelogio = (segundos: number) => {
  const s = Math.abs(Math.round(segundos));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
};

export default function ProtocoloPSPage() {
  const { codigo = "SCA" } = useParams();
  const codigoProtocolo = codigo.toUpperCase();

  const [sessao, setSessao] = useState<SessaoProtocolo | null>(null);
  const [atendimentoInput, setAtendimentoInput] = useState("");
  const [agora, setAgora] = useState(() => Date.now());
  const [alertados, setAlertados] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["protocolo-ps", codigoProtocolo],
    queryFn: async () => {
      const { data: protocolo, error } = await supabase
        .from("protocolos_ps")
        .select("id, codigo_protocolo, nome, tipo, contexto, tempo_critico, janela_terapeutica_min")
        .eq("codigo_protocolo", codigoProtocolo)
        .maybeSingle();
      if (error) throw error;
      if (!protocolo) return null;
      const { data: etapas, error: e2 } = await supabase
        .from("protocolo_etapas")
        .select("id, ordem, fase, titulo, instrucao, tempo_alvo_min, obrigatorio")
        .eq("protocolo_id", protocolo.id)
        .order("ordem", { ascending: true });
      if (e2) throw e2;
      return { protocolo, etapas: (etapas ?? []) as Etapa[] };
    },
  });

  useEffect(() => {
    setSessao(carregarSessao(codigoProtocolo));
    setAlertados([]);
  }, [codigoProtocolo]);

  useEffect(() => {
    if (!sessao) return;
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [sessao]);

  const etapas = data?.etapas ?? [];
  const total = etapas.length;
  const concluidas = sessao ? etapas.filter((e) => sessao.etapas[e.id]).length : 0;
  const pct = total ? Math.round((concluidas / total) * 100) : 0;

  const decorridoSeg = sessao
    ? Math.max(0, (agora - new Date(sessao.inicio).getTime()) / 1000)
    : 0;

  // Alertas de estouro de tempo-alvo
  useEffect(() => {
    if (!sessao) return;
    for (const e of etapas) {
      if (sessao.etapas[e.id]) continue;
      if (e.tempo_alvo_min === null || e.tempo_alvo_min === undefined) continue;
      if (decorridoSeg > e.tempo_alvo_min * 60 && !alertados.includes(e.id)) {
        setAlertados((prev) => [...prev, e.id]);
        toast.warning(`Tempo-alvo excedido: ${e.ordem}. ${e.titulo}`, {
          description: `Alvo de ${e.tempo_alvo_min} min já ultrapassado.`,
        });
      }
    }
  }, [decorridoSeg, sessao, etapas, alertados]);

  const iniciar = () => {
    const id = atendimentoInput.trim();
    if (!id) {
      toast.error("Informe o ID do atendimento para iniciar.");
      return;
    }
    const s = novaSessao(id);
    salvarSessao(codigoProtocolo, s);
    setSessao(s);
    setAlertados([]);
  };

  const reset = () => {
    limparSessao(codigoProtocolo);
    setSessao(null);
    setAlertados([]);
  };

  const toggle = async (etapa: Etapa) => {
    if (!sessao || !data?.protocolo) return;
    const jaFeita = Boolean(sessao.etapas[etapa.id]);
    const next: SessaoProtocolo = {
      ...sessao,
      etapas: { ...sessao.etapas },
    };
    if (jaFeita) {
      delete next.etapas[etapa.id];
      salvarSessao(codigoProtocolo, next);
      setSessao(next);
      return;
    }

    const conclusao = new Date();
    next.etapas[etapa.id] = conclusao.toISOString();
    salvarSessao(codigoProtocolo, next);
    setSessao(next);

    const realizado = minutosDecorridos(sessao.inicio, conclusao);
    try {
      await registrarExecucaoEtapa({
        protocoloId: data.protocolo.id,
        atendimentoId: sessao.atendimentoId,
        etapaOrdem: etapa.ordem,
        etapaTitulo: etapa.titulo,
        tempoPrevistoMin: etapa.tempo_alvo_min,
        tempoRealizadoMin: realizado,
      });
      if (!dentroDoPrazo(etapa.tempo_alvo_min, realizado)) {
        toast.warning(`Etapa registrada fora do prazo (${realizado} min).`);
      }
    } catch {
      toast.error("Etapa marcada, mas não foi possível registrar a auditoria.");
    }
  };

  const grupos = useMemo(() => {
    const out: { fase: string | null; etapas: Etapa[] }[] = [];
    for (const e of etapas) {
      const last = out[out.length - 1];
      if (last && last.fase === e.fase) last.etapas.push(e);
      else out.push({ fase: e.fase, etapas: [e] });
    }
    return out;
  }, [etapas]);

  const gerarPDF = () => {
    if (!sessao || !data?.protocolo) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margem = 40;
    let y = margem;

    doc.setFontSize(15);
    doc.text(`Protocolo ${codigoProtocolo} — ${data.protocolo.nome ?? ""}`, margem, y);
    y += 20;
    doc.setFontSize(10);
    doc.text(`Atendimento: ${sessao.atendimentoId}`, margem, y);
    y += 14;
    doc.text(`Início: ${new Date(sessao.inicio).toLocaleString("pt-BR")}`, margem, y);
    y += 14;
    doc.text(
      `Etapas concluídas: ${concluidas}/${total} (${pct}%) — Tempo total: ${minutosDecorridos(
        sessao.inicio,
      )} min`,
      margem,
      y,
    );
    y += 22;

    for (const e of etapas) {
      if (y > 780) {
        doc.addPage();
        y = margem;
      }
      const ts = sessao.etapas[e.id];
      const realizado = ts ? minutosDecorridos(sessao.inicio, new Date(ts)) : null;
      doc.setFontSize(11);
      doc.text(`${ts ? "[X]" : "[ ]"} ${e.ordem}. ${e.titulo}`, margem, y);
      y += 14;
      doc.setFontSize(9);
      const detalhe = ts
        ? `Concluída às ${new Date(ts).toLocaleTimeString("pt-BR")} (${realizado} min) — ${
            dentroDoPrazo(e.tempo_alvo_min, realizado ?? 0) ? "no prazo" : "fora do prazo"
          }`
        : "Não concluída";
      const alvo =
        e.tempo_alvo_min !== null && e.tempo_alvo_min !== undefined
          ? ` | Alvo: ${e.tempo_alvo_min} min`
          : "";
      doc.text(`${detalhe}${alvo}`, margem + 14, y);
      y += 18;
    }

    doc.save(`protocolo-${codigoProtocolo}-${sessao.atendimentoId}.pdf`);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-6">
      <Helmet>
        <title>{`Protocolo ${codigoProtocolo} — Etapas | PrescriMed`}</title>
        <meta
          name="description"
          content={`Execução passo a passo do protocolo ${codigoProtocolo} no pronto-socorro, com cronômetro, tempos-alvo, auditoria e PDF.`}
        />
      </Helmet>

      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {data?.protocolo?.nome ?? `Protocolo ${codigoProtocolo}`}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{codigoProtocolo}</Badge>
          {data?.protocolo?.contexto && (
            <Badge variant="outline">{data.protocolo.contexto}</Badge>
          )}
          {data?.protocolo?.tempo_critico && (
            <Badge variant="destructive">Tempo crítico</Badge>
          )}
        </div>

        {!sessao && total > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Iniciar execução</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="atendimento">ID do atendimento</Label>
                <Input
                  id="atendimento"
                  value={atendimentoInput}
                  onChange={(e) => setAtendimentoInput(e.target.value)}
                  placeholder="Ex.: PS-2026-0142"
                />
              </div>
              <Button onClick={iniciar}>
                <TimerReset className="mr-2 h-4 w-4" /> Iniciar protocolo
              </Button>
            </CardContent>
          </Card>
        )}

        {sessao && total > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>
                Atendimento <span className="font-mono">{sessao.atendimentoId}</span> ·{" "}
                {concluidas} de {total} etapas · {fmtRelogio(decorridoSeg)} decorridos
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={gerarPDF}>
                  <Download className="mr-2 h-4 w-4" /> PDF
                </Button>
                <Button variant="ghost" size="sm" onClick={reset}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar
                </Button>
              </div>
            </div>
            <Progress value={pct} />
          </div>
        )}
      </header>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      )}

      {!isLoading && !data && (
        <p className="text-sm text-muted-foreground">Protocolo não encontrado.</p>
      )}

      {!isLoading && data && total === 0 && (
        <p className="text-sm text-muted-foreground">
          Este protocolo ainda não possui etapas cadastradas.
        </p>
      )}

      <main className="space-y-6">
        {grupos.map((g, i) => (
          <section key={`${g.fase}-${i}`} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
              {faseLabel(g.fase)}
            </h2>
            {g.etapas.map((e) => {
              const ts = sessao?.etapas[e.id];
              const checked = Boolean(ts);
              const realizado = ts ? minutosDecorridos(sessao!.inicio, new Date(ts)) : null;
              const temAlvo = e.tempo_alvo_min !== null && e.tempo_alvo_min !== undefined;
              const restanteSeg = temAlvo ? e.tempo_alvo_min! * 60 - decorridoSeg : 0;
              const atrasada = Boolean(sessao) && !checked && temAlvo && restanteSeg < 0;
              return (
                <Card
                  key={e.id}
                  className={
                    atrasada
                      ? "border-destructive/50"
                      : checked
                        ? "border-primary/40 bg-muted/40"
                        : undefined
                  }
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-start gap-3 text-base">
                      <Checkbox
                        id={`etapa-${e.id}`}
                        checked={checked}
                        disabled={!sessao}
                        onCheckedChange={() => toggle(e)}
                        aria-label={`Marcar etapa ${e.ordem} como concluída`}
                        className="mt-1"
                      />
                      <label
                        htmlFor={`etapa-${e.id}`}
                        className={`flex-1 cursor-pointer font-medium ${
                          checked ? "text-muted-foreground line-through" : ""
                        }`}
                      >
                        {e.ordem}. {e.titulo}
                      </label>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pl-12">
                    {e.instrucao && (
                      <p className="text-sm text-muted-foreground">{e.instrucao}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      {temAlvo && (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {e.tempo_alvo_min === 0
                            ? "Imediato"
                            : `Alvo: ${e.tempo_alvo_min} min`}
                        </Badge>
                      )}
                      <Badge variant={e.obrigatorio ? "secondary" : "outline"}>
                        {e.obrigatorio ? "Obrigatória" : "Opcional"}
                      </Badge>
                      {sessao && !checked && temAlvo && (
                        <Badge variant={atrasada ? "destructive" : "secondary"} className="gap-1">
                          {atrasada ? (
                            <TriangleAlert className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {atrasada
                            ? `Atrasada há ${fmtRelogio(restanteSeg)}`
                            : `Restam ${fmtRelogio(restanteSeg)}`}
                        </Badge>
                      )}
                      {checked && ts && (
                        <Badge
                          variant={
                            dentroDoPrazo(e.tempo_alvo_min, realizado ?? 0)
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          Concluída {new Date(ts).toLocaleTimeString("pt-BR")} ({realizado} min)
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        ))}
      </main>
    </div>
  );
}
