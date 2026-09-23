/**
 * Etapa 22J — Aba consolidada "Revisão Final Beta".
 * Agrega o veredicto GO/NO-GO a partir de todas as áreas já entregues:
 * Lançamento, Hardening, Testes clínicos V2, Pacote beta e Qualidade da base.
 *
 * Regra visual: reaproveita cards, badges e tipografia existentes.
 * Não redesenha, não polui — apenas resume e exporta.
 */

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, RefreshCw, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import * as XLSX from "xlsx";
import {
  computeFinalDecision, sortByStatus,
  summarizeHardening, summarizeLancamento, summarizePacoteBeta,
  summarizeQualidade, summarizeTestesV2,
  SUB_STATUS_LABEL, SUB_STATUS_TONE,
  type SubSystemSummary,
} from "./revisaoFinalLogic";
import { useQualidadeBase } from "@/modules/medications-base/qualidade/useQualidadeBase";
import { usePacoteBeta } from "@/modules/medications-base/beta/usePacoteBeta";

/** Critérios GO/NO-GO explícitos do documento 22J. */
const CRITERIOS_NOGO: string[] = [
  "Fluxo principal quebrado",
  "PDF quebrado",
  "Documentos separados quebrados",
  "Link do paciente abrindo documento errado",
  "Alergia crítica não funcionando",
  "Teste crítico reprovado",
  "Alto risco obrigatório com erro crítico",
  "Rascunho seguro aparecendo como revisado",
  "Entrada inteligente adicionando sem revisão",
  "Mobile inutilizável",
  "Perda de dados em rascunho",
  "Finalizar ignorando bloqueio crítico",
  "Erro técnico visível no fluxo principal",
  "Documento revogado ainda acessível",
];

const CRITERIOS_GO: string[] = [
  "Fluxo principal aprovado",
  "Documentos/PDF aprovados",
  "Link paciente aprovado",
  "Testes críticos aprovados",
  "Base obrigatória sem crítico",
  "Segurança IV essencial funcionando",
  "Cálculo pediátrico básico funcionando",
  "Alergia crítica funcionando",
  "Controlados/antimicrobianos separados",
  "Entrada inteligente exige revisão",
  "Mobile aprovado",
  "Logs essenciais funcionando",
  "Feedback beta ativo",
  "Termos beta aceitos",
  "Assinatura digital configurável ou fallback claro",
];

export default function RevisaoFinalBetaTab() {
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<SubSystemSummary[]>([]);
  const [versao, setVersao] = useState<string>("v0.1.0-beta");
  const qualidade = useQualidadeBase();
  const pacote = usePacoteBeta();

  const load = async () => {
    setLoading(true);
    const [lc, hd, tc, vs] = await Promise.all([
      supabase.from("lancamento_checklist" as any).select("status,criticidade,bloqueante"),
      supabase.from("hardening_beta_itens" as any).select("status,criticidade"),
      supabase.from("testes_clinicos_v2" as any).select("status_teste,critico"),
      supabase.from("lancamento_versoes" as any).select("versao").order("criado_em", { ascending: false }).limit(1),
    ]);
    if (lc.error || hd.error || tc.error) {
      toast.error("Não foi possível carregar a consolidação agora.");
    }
    const arr: SubSystemSummary[] = [
      summarizeLancamento(((lc.data as any[]) ?? []) as any),
      summarizeHardening(((hd.data as any[]) ?? []) as any),
      summarizeTestesV2(((tc.data as any[]) ?? []) as any),
    ];
    setSubs(arr);
    if (vs.data && (vs.data as any[]).length > 0) setVersao((vs.data as any[])[0].versao);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Qualidade da base: derivada do hook (que já calcula)
  const qualSummary = useMemo(() => {
    const criticos = qualidade.findings?.filter((f) => f.gravidade === "critico").length ?? 0;
    const alertas = qualidade.findings?.filter((f) => f.gravidade === "alto" || f.gravidade === "medio").length ?? 0;
    const total = qualidade.findings?.length ?? 0;
    return summarizeQualidade(criticos, alertas, total);
  }, [qualidade.findings]);

  useEffect(() => {
    if (pacote.erro) toast.error("Não foi possível carregar o pacote beta de medicamentos.");
  }, [pacote.erro]);

  const pacoteSummary = useMemo(() => {
    return summarizePacoteBeta(
      pacote.avaliados.map((a) => ({
        status: a.status === "pronto_beta" || a.status === "revisado" ? "revisado" : a.status,
        obrigatorio: a.pacote.obrigatoriedade === "obrigatorio",
      })),
    );
  }, [pacote.avaliados]);

  const allSubs = useMemo(() => sortByStatus([...subs, pacoteSummary, qualSummary]), [subs, pacoteSummary, qualSummary]);
  const decision = useMemo(() => computeFinalDecision(allSubs), [allSubs]);

  const exportarRelatorio = () => {
    const wb = XLSX.utils.book_new();
    const capa = [
      ["PrescriMed — Relatório Final Beta"],
      ["Versão", versao],
      ["Data", new Date().toLocaleString("pt-BR")],
      ["Status geral", decision.label],
      [],
      ["Sub-sistema", "Status", "Detalhe", "Bloqueia GO?"],
      ...allSubs.map((s) => [s.label, SUB_STATUS_LABEL[s.status], s.hint, s.blocker ? "Sim" : "Não"]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(capa), "Resumo");

    const criterios = [
      ["Critérios NO-GO (qualquer um bloqueia)"],
      ...CRITERIOS_NOGO.map((c) => [c]),
      [],
      ["Critérios GO (todos devem estar OK)"],
      ...CRITERIOS_GO.map((c) => [c]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(criterios), "Critérios");

    const metrics: (string | number)[][] = [["Sub-sistema", "Métrica", "Valor"]];
    for (const s of allSubs) {
      for (const [k, v] of Object.entries(s.metrics)) metrics.push([s.label, k, v]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(metrics), "Métricas");

    XLSX.writeFile(wb, `prescrimed_relatorio_final_${versao}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Relatório exportado.");
  };

  if (loading || qualidade.loading) {
    return <div className="text-sm text-muted-foreground p-4">Consolidando revisão final…</div>;
  }

  const Icon = decision.status === "go" ? CheckCircle2 : decision.status === "nogo" ? AlertTriangle : ShieldCheck;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Icon className={`h-6 w-6 ${decision.color}`} />
              <div>
                <CardTitle className="text-base">Revisão Final Beta — Etapa 22J</CardTitle>
                <p className={`text-sm font-medium ${decision.color}`}>{decision.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Versão: <span className="font-mono">{versao}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={load}>
                <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
              </Button>
              <Button size="sm" onClick={exportarRelatorio}>
                <Download className="h-4 w-4 mr-1" /> Exportar relatório final
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allSubs.map((s) => (
            <div key={s.key} className="border rounded-md p-3 bg-card">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{s.label}</span>
                <Badge variant="outline" className={SUB_STATUS_TONE[s.status]}>
                  {SUB_STATUS_LABEL[s.status]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{s.hint}</p>
              {s.blocker && (
                <p className="text-xs text-destructive mt-1">Bloqueia GO enquanto não resolvido.</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {Object.entries(s.metrics).map(([k, v]) => (
                  <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {k}: {v}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {decision.blockers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-destructive">Bloqueios ativos ({decision.blockers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {decision.blockers.map((b) => (
                <li key={b.key}>
                  <span className="font-medium">{b.label}:</span>{" "}
                  <span className="text-muted-foreground">{b.hint}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Critérios NO-GO</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
              {CRITERIOS_NOGO.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Critérios GO</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
              {CRITERIOS_GO.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Consolidação apenas de leitura. A liberação/pausa do beta continua na aba
        <span className="font-medium"> Lançamento Beta</span>.
      </p>
    </div>
  );
}
