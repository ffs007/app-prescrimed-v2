import { useMemo, useState } from "react";
import { AlertTriangle, ShieldAlert, Activity, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  analyzePrescription, type PrescItem, type InteractionRecord,
  type InteractionsSettings, type PatientCtx, type AnalysisResult, type InteractionAlertLevel,
} from "./lib/interactionsCalc";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

const levelStyles: Record<InteractionAlertLevel, string> = {
  critico: "border-destructive/40 bg-destructive/5 text-destructive",
  alto: "border-destructive/30 bg-destructive/5 text-destructive",
  atencao: "border-warning/40 bg-warning/5 text-warning",
  informativo: "border-canon-blue/30 bg-canon-blue/5 text-canon-blue",
};

const classifBadge: Record<string, string> = {
  baixo: "bg-muted text-muted-foreground",
  moderado: "bg-warning/15 text-warning border-warning/40",
  alto: "bg-destructive/10 text-destructive border-destructive/30",
  muito_alto: "bg-destructive/20 text-destructive border-destructive/40",
};

interface Props {
  items: PrescItem[];
  base: InteractionRecord[];
  settings: InteractionsSettings;
  patient?: PatientCtx;
  defaultCollapsed?: boolean;
}

export default function InteractionsRiskCard({ items, base, settings, patient, defaultCollapsed = true }: Props) {
  const [expanded, setExpanded] = useState(!defaultCollapsed);
  const [open, setOpen] = useState(false);

  const analysis: AnalysisResult = useMemo(
    () => analyzePrescription({ items, base, settings, patient }),
    [items, base, settings, patient]
  );

  const { contadores, riscos_acumulados, alertas_gerais } = analysis;
  const maiorNivel: InteractionAlertLevel = contadores.criticos
    ? "critico"
    : contadores.alertas_altos
    ? "alto"
    : alertas_gerais.some((a) => a.nivel === "atencao")
    ? "atencao"
    : "informativo";

  const topRisks = riscos_acumulados
    .filter((r) => r.classificacao !== "baixo")
    .sort((a, b) => b.soma - a.soma)
    .slice(0, 3);

  return (
    <div className={cn("rounded-md border p-3 text-[12px]", levelStyles[maiorNivel])}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-1.5 font-semibold text-ink">
          <ShieldAlert className="h-4 w-4" />
          Interações e Riscos da Prescrição
        </span>
        {expanded ? <ChevronUp className="h-4 w-4 text-ink-faint" /> : <ChevronDown className="h-4 w-4 text-ink-faint" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">Interações: {contadores.interacoes}</Badge>
            <Badge variant="outline">Duplicidades: {contadores.duplicidades}</Badge>
            {contadores.criticos > 0 && (
              <Badge className="bg-destructive/10 text-destructive border-destructive/30">
                Críticos: {contadores.criticos}
              </Badge>
            )}
            {contadores.alertas_altos > 0 && (
              <Badge className="bg-destructive/10 text-destructive border-destructive/30">
                Altos: {contadores.alertas_altos}
              </Badge>
            )}
          </div>

          {topRisks.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topRisks.map((r) => (
                <span key={r.categoria} className={cn("rounded border px-2 py-0.5 text-[11px]", classifBadge[r.classificacao])}>
                  {r.label}: {r.classificacao.replace("_", " ")}
                </span>
              ))}
            </div>
          )}

          {alertas_gerais.slice(0, 3).map((a) => (
            <p key={a.id} className="flex items-start gap-1 text-[11px] leading-snug">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{a.mensagem}</span>
            </p>
          ))}

          <div className="pt-1">
            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setOpen(true)}>
              Ver detalhes
            </Button>
          </div>

          <p className="flex items-start gap-1 text-[10px] italic text-ink-faint pt-0.5">
            <Info className="h-2.5 w-2.5 mt-0.5 shrink-0" />
            Alertas de interação são ferramentas de apoio à decisão. Validar indicação, dose, duração, exames, contexto clínico e protocolo institucional.
          </p>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes — Interações e Riscos</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="interacoes">
            <TabsList>
              <TabsTrigger value="interacoes">Interações</TabsTrigger>
              <TabsTrigger value="duplicidades">Duplicidades</TabsTrigger>
              <TabsTrigger value="riscos">Riscos acumulados</TabsTrigger>
              <TabsTrigger value="monitor">Monitorização</TabsTrigger>
            </TabsList>

            <TabsContent value="interacoes" className="space-y-2">
              {analysis.interacoes.length === 0 && (
                <p className="text-sm text-ink-faint">Nenhuma interação específica encontrada na base atual.</p>
              )}
              {analysis.interacoes.map((f) => (
                <div key={f.record.id} className={cn("rounded border p-2 text-[12px]", levelStyles[f.record.nivel_alerta])}>
                  <div className="font-medium">
                    {f.itemA.principio_ativo} ↔ {f.itemB.principio_ativo}
                  </div>
                  <div className="text-[11px] text-ink-faint">
                    {f.record.tipo_interacao} • gravidade: {f.record.gravidade} • {f.record.status_revisao}
                  </div>
                  {f.record.mensagem_medico && <p className="mt-1 text-[12px]">{f.record.mensagem_medico}</p>}
                  {f.record.mecanismo && <p className="text-[11px]"><strong>Mecanismo:</strong> {f.record.mecanismo}</p>}
                  {f.record.conduta_sugerida && <p className="text-[11px]"><strong>Conduta:</strong> {f.record.conduta_sugerida}</p>}
                  {f.record.monitorizacao_recomendada && (
                    <p className="text-[11px]"><strong>Monitorização:</strong> {f.record.monitorizacao_recomendada}</p>
                  )}
                  {f.record.fonte_referencia && <p className="text-[10px] text-ink-faint">Fonte: {f.record.fonte_referencia}</p>}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="duplicidades" className="space-y-2">
              {analysis.duplicidades.length === 0 && (
                <p className="text-sm text-ink-faint">Sem duplicidades terapêuticas identificadas.</p>
              )}
              {analysis.duplicidades.map((d, i) => (
                <div key={i} className="rounded border p-2 text-[12px]">
                  <div className="font-medium">{d.subclasse || d.classe}</div>
                  <div className="text-[11px]">{d.itens.map((x) => x.principio_ativo).join(" + ")}</div>
                  {d.observacao && <p className="text-[11px] text-ink-faint mt-1">{d.observacao}</p>}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="riscos" className="space-y-2">
              {riscos_acumulados.map((r) => (
                <div key={r.categoria} className="rounded border p-2 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.label}</span>
                    <span className={cn("rounded border px-2 py-0.5 text-[11px]", classifBadge[r.classificacao])}>
                      {r.classificacao.replace("_", " ")} (soma {r.soma})
                    </span>
                  </div>
                  {r.contribuintes.length > 0 && (
                    <p className="text-[11px] mt-1">
                      Contribuintes: {r.contribuintes.map((c) => `${c.principio_ativo} (${c.nivel})`).join(", ")}
                    </p>
                  )}
                  {r.desconhecidos.length > 0 && (
                    <p className="text-[11px] text-ink-faint">
                      Risco não cadastrado em: {r.desconhecidos.map((c) => c.principio_ativo).join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="monitor" className="space-y-2">
              {analysis.monitorizacao_sugerida.length === 0 && (
                <p className="text-sm text-ink-faint">Nenhuma monitorização adicional sugerida.</p>
              )}
              {analysis.monitorizacao_sugerida.map((m, i) => (
                <p key={i} className="flex items-start gap-1 text-[12px]">
                  <Activity className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{m}</span>
                </p>
              ))}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
