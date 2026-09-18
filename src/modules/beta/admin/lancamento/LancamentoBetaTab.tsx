import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, Rocket, Pause, AlertTriangle, CheckCircle2, ChevronRight, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";
import {
  ChecklistItem, ChecklistStatus, SECOES, STATUS_LABEL, STATUS_OPTIONS,
  computeDecision, statusBadgeClass,
} from "./lancamentoLogic";

type Versao = {
  id: string;
  versao: string;
  data_lancamento: string | null;
  changelog: string | null;
  status_versao: string;
  pendencias_conhecidas: string | null;
  criado_em: string;
};

type Bug = {
  id: string;
  titulo: string;
  descricao: string | null;
  gravidade: "baixa" | "media" | "alta" | "critica";
  modulo_afetado: string | null;
  status: "aberto" | "em_correcao" | "corrigido" | "nao_reproduzido" | "descartado";
};

export default function LancamentoBetaTab() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [versoes, setVersoes] = useState<Versao[]>([]);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ChecklistItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [confirmPause, setConfirmPause] = useState(false);
  const [pauseMotivo, setPauseMotivo] = useState<string>("erro_critico");
  const [pauseObs, setPauseObs] = useState("");

  const load = async () => {
    setLoading(true);
    const [ck, vs, bg] = await Promise.all([
      supabase.from("lancamento_checklist" as any).select("*").order("secao").order("ordem"),
      supabase.from("lancamento_versoes" as any).select("*").order("criado_em", { ascending: false }),
      supabase.from("lancamento_bugs_conhecidos" as any).select("*").order("criado_em", { ascending: false }),
    ]);
    if (ck.error || vs.error || bg.error) {
      toast.error("Não foi possível carregar agora. Tente novamente.");
    }
    setItems((ck.data as any) ?? []);
    setVersoes((vs.data as any) ?? []);
    setBugs((bg.data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const decision = useMemo(() => computeDecision(items), [items]);
  const versaoAtual = versoes[0];
  const bugsCriticos = bugs.filter((b) => (b.gravidade === "critica" || b.gravidade === "alta") && b.status === "aberto");
  const canRelease = decision.canRelease && bugsCriticos.length === 0;

  const bySecao = useMemo(() => {
    const map: Record<string, ChecklistItem[]> = {};
    for (const it of items) (map[it.secao] ??= []).push(it);
    return map;
  }, [items]);

  const saveEdit = async (patch: Partial<ChecklistItem>) => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from("lancamento_checklist" as any).update(patch).eq("id", editing.id);
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar agora.");
    toast.success("Item atualizado.");
    await logAcao("checklist_atualizado", versaoAtual?.versao, null, editing.status, patch.observacao ?? null);
    setEditing(null);
    load();
  };

  const logAcao = async (acao: string, versao_beta?: string | null, status_anterior?: string | null, status_novo?: string | null, observacao?: string | null, motivo?: string | null) => {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("lancamento_log" as any).insert({
      acao,
      versao_beta: versao_beta ?? null,
      status_anterior: status_anterior ?? null,
      status_novo: status_novo ?? null,
      usuario_responsavel: userData.user?.id ?? null,
      motivo: motivo ?? null,
      observacao: observacao ?? null,
    });
  };

  const handleRelease = async () => {
    if (!versaoAtual) return toast.error("Nenhuma versão beta cadastrada.");
    if (!canRelease) return toast.error("Não é possível liberar beta com bloqueios críticos.");
    const { error } = await supabase
      .from("lancamento_versoes" as any)
      .update({ status_versao: "liberada", data_lancamento: new Date().toISOString() })
      .eq("id", versaoAtual.id);
    if (error) return toast.error("Falha ao liberar beta. Tente novamente.");
    await logAcao("beta_liberado", versaoAtual.versao, versaoAtual.status_versao, "liberada");
    toast.success("Beta liberado com sucesso.");
    setConfirmRelease(false);
    load();
  };

  const handlePause = async () => {
    if (!versaoAtual) return;
    const { error } = await supabase
      .from("lancamento_versoes" as any)
      .update({ status_versao: "pausada" })
      .eq("id", versaoAtual.id);
    if (error) return toast.error("Falha ao pausar beta.");
    await logAcao("beta_pausado", versaoAtual.versao, versaoAtual.status_versao, "pausada", pauseObs, pauseMotivo);
    toast.success("Beta pausado.");
    setConfirmPause(false);
    setPauseObs("");
    load();
  };

  const exportRelatorio = (format: "xlsx" | "csv") => {
    const rows = items.map((i) => ({
      Seção: SECOES.find((s) => s.key === i.secao)?.label ?? i.secao,
      Item: i.titulo,
      Descrição: i.descricao ?? "",
      Status: STATUS_LABEL[i.status],
      Criticidade: i.criticidade,
      Bloqueante: i.bloqueante ? "Sim" : "Não",
      Responsável: i.responsavel ?? "",
      Observação: i.observacao ?? "",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Checklist");
    const resumo = [
      ["Status geral", decision.label],
      ["Versão beta", versaoAtual?.versao ?? "—"],
      ["Status da versão", versaoAtual?.status_versao ?? "—"],
      ["Data do relatório", new Date().toLocaleString("pt-BR")],
      ["Total itens", items.length],
      ["Aprovados", decision.totais.aprovado],
      ["Pendentes", decision.totais.pendente],
      ["Precisa ajuste", decision.totais.precisa_ajuste],
      ["Bloqueantes", decision.totais.bloqueante],
      ["Não aplicáveis", decision.totais.nao_aplicavel],
      ["No-Go itens", decision.noGoItems.length],
      ["Pendências não críticas", decision.pendenciasNaoCriticas.length],
      ["Bugs críticos abertos", bugsCriticos.length],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumo), "Resumo");
    if (decision.noGoItems.length) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          decision.noGoItems.map((i) => ({ Seção: i.secao, Item: i.titulo, Status: STATUS_LABEL[i.status], Observação: i.observacao ?? "" })),
        ),
        "No-Go",
      );
    }
    if (bugs.length) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(bugs.map((b) => ({ Título: b.titulo, Gravidade: b.gravidade, Status: b.status, Módulo: b.modulo_afetado ?? "" }))),
        "Bugs conhecidos",
      );
    }
    const filename = `prescrimed-lancamento-beta-${new Date().toISOString().slice(0, 10)}.${format}`;
    XLSX.writeFile(wb, filename, { bookType: format });
    logAcao("relatorio_exportado", versaoAtual?.versao);
    toast.success("Relatório exportado.");
  };

  const statusBg =
    decision.status === "pronto" ? "bg-emerald-500/5 border-emerald-500/30"
    : decision.status === "quase_pronto" ? "bg-blue-500/5 border-blue-500/30"
    : decision.status === "atencao" ? "bg-amber-500/5 border-amber-500/30"
    : "bg-destructive/5 border-destructive/30";

  return (
    <div className="space-y-4 pt-4">
      {/* Status geral */}
      <Card className={statusBg}>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
                <Rocket className="h-3.5 w-3.5" /> Lançamento Beta
              </div>
              <div className={`text-2xl font-semibold mt-1 ${decision.color}`}>{decision.label}</div>
              {versaoAtual && (
                <div className="text-sm text-muted-foreground mt-1">
                  Versão <span className="font-medium text-foreground">{versaoAtual.versao}</span> · status <span className="font-medium">{versaoAtual.status_versao.replace("_", " ")}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => load()} title="Recarregar">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => exportRelatorio("csv")}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => exportRelatorio("xlsx")}>
                <Download className="h-4 w-4 mr-1" /> XLSX
              </Button>
              {versaoAtual?.status_versao === "liberada" ? (
                <Button size="sm" variant="outline" onClick={() => setConfirmPause(true)}>
                  <Pause className="h-4 w-4 mr-1" /> Pausar beta
                </Button>
              ) : (
                <Button size="sm" disabled={!canRelease} onClick={() => setConfirmRelease(true)}>
                  <Rocket className="h-4 w-4 mr-1" /> Liberar beta controlado
                </Button>
              )}
            </div>
          </div>

          {!canRelease && decision.noGoItems.length > 0 && (
            <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                <AlertTriangle className="h-4 w-4" /> Corrija os itens de No-Go antes de liberar
              </div>
              <ul className="mt-2 text-sm text-foreground/90 space-y-1">
                {decision.noGoItems.slice(0, 8).map((i) => (
                  <li key={i.id}>
                    • <span className="text-muted-foreground">{SECOES.find((s) => s.key === i.secao)?.label}</span> — {i.titulo}
                    <Badge variant="outline" className={`ml-2 ${statusBadgeClass(i.status)}`}>{STATUS_LABEL[i.status]}</Badge>
                  </li>
                ))}
                {decision.noGoItems.length > 8 && (
                  <li className="text-xs text-muted-foreground">+{decision.noGoItems.length - 8} outros itens</li>
                )}
              </ul>
            </div>
          )}

          {canRelease && decision.pendenciasNaoCriticas.length > 0 && (
            <div className="mt-4 rounded-md border border-blue-500/30 bg-blue-500/5 p-3">
              <div className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Beta pode ser liberado com pendências não críticas
              </div>
              <ul className="mt-2 text-sm space-y-1">
                {decision.pendenciasNaoCriticas.slice(0, 6).map((i) => (
                  <li key={i.id}>• {i.titulo}</li>
                ))}
                {decision.pendenciasNaoCriticas.length > 6 && (
                  <li className="text-xs text-muted-foreground">+{decision.pendenciasNaoCriticas.length - 6} outras</li>
                )}
              </ul>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Stat label="Aprovados" value={decision.totais.aprovado} tone="emerald" />
            <Stat label="Pendentes" value={decision.totais.pendente} tone="muted" />
            <Stat label="Precisa ajuste" value={decision.totais.precisa_ajuste} tone="amber" />
            <Stat label="Bloqueantes" value={decision.totais.bloqueante} tone="destructive" />
            <Stat label="N/A" value={decision.totais.nao_aplicavel} tone="muted" />
          </div>
        </CardContent>
      </Card>

      {/* Bugs críticos abertos alertando */}
      {bugsCriticos.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-3 text-sm text-destructive">
            {bugsCriticos.length} bug(s) crítico(s)/alto(s) aberto(s). O beta não pode ser liberado enquanto houver bug crítico aberto.
          </CardContent>
        </Card>
      )}

      {/* Checklist por seção */}
      {loading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Carregando…</CardContent></Card>
      ) : (
        SECOES.filter((s) => bySecao[s.key]?.length).map((s) => (
          <Card key={s.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{s.label}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {bySecao[s.key].map((it) => (
                <button
                  key={it.id}
                  onClick={() => setEditing(it)}
                  className="w-full flex items-start justify-between gap-3 py-3 text-left hover:bg-muted/40 rounded-sm px-2 -mx-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{it.titulo}</span>
                      {it.bloqueante && (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px]">Bloqueante</Badge>
                      )}
                      {!it.bloqueante && it.criticidade === "alta" && (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px]">Crítico</Badge>
                      )}
                    </div>
                    {it.descricao && <div className="text-xs text-muted-foreground mt-0.5">{it.descricao}</div>}
                    {it.observacao && <div className="text-xs italic text-foreground/80 mt-1">“{it.observacao}”</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={statusBadgeClass(it.status)}>
                      {STATUS_LABEL[it.status]}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        ))
      )}

      {/* Histórico de versões */}
      {versoes.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Versões Beta</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {versoes.map((v) => (
              <div key={v.id} className="py-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="font-medium text-sm">{v.versao}</div>
                  <Badge variant="outline" className="text-xs">{v.status_versao.replace("_", " ")}</Badge>
                </div>
                {v.data_lancamento && (
                  <div className="text-xs text-muted-foreground">Liberado em {new Date(v.data_lancamento).toLocaleString("pt-BR")}</div>
                )}
                {v.changelog && <div className="text-xs mt-1 text-foreground/80">{v.changelog}</div>}
                {v.pendencias_conhecidas && (
                  <div className="text-xs mt-1 text-amber-600 dark:text-amber-400">Pendências: {v.pendencias_conhecidas}</div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Diálogo edição */}
      <EditDialog item={editing} saving={saving} onClose={() => setEditing(null)} onSave={saveEdit} />

      {/* Confirmação liberar */}
      <Dialog open={confirmRelease} onOpenChange={setConfirmRelease}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirma liberar o PrescriMed beta para médicos autorizados?</DialogTitle>
            <DialogDescription>
              Versão <span className="font-medium">{versaoAtual?.versao}</span> será marcada como liberada.
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Sem bloqueios críticos
            </div>
            {decision.pendenciasNaoCriticas.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {decision.pendenciasNaoCriticas.length} pendência(s) não crítica(s) permanecerão em acompanhamento.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmRelease(false)}>Cancelar</Button>
            <Button onClick={handleRelease}>Confirmar liberação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação pausar */}
      <Dialog open={confirmPause} onOpenChange={setConfirmPause}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pausar beta</DialogTitle>
            <DialogDescription>Novos acessos poderão ficar bloqueados conforme configuração.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Motivo</label>
              <Select value={pauseMotivo} onValueChange={setPauseMotivo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="erro_critico">Erro crítico</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="atualizacao">Atualização</SelectItem>
                  <SelectItem value="revisao_base">Revisão de base</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Observação</label>
              <Textarea value={pauseObs} onChange={(e) => setPauseObs(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmPause(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handlePause}>Pausar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "emerald" | "amber" | "destructive" | "muted" }) {
  const cls =
    tone === "emerald" ? "text-emerald-600 dark:text-emerald-400"
    : tone === "amber" ? "text-amber-600 dark:text-amber-400"
    : tone === "destructive" ? "text-destructive"
    : "text-foreground";
  return (
    <div className="rounded-md border p-2">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`text-lg font-semibold ${cls}`}>{value}</div>
    </div>
  );
}

function EditDialog({
  item, saving, onClose, onSave,
}: { item: ChecklistItem | null; saving: boolean; onClose: () => void; onSave: (patch: Partial<ChecklistItem>) => void }) {
  const [status, setStatus] = useState<ChecklistStatus>("pendente");
  const [responsavel, setResponsavel] = useState("");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    if (item) {
      setStatus(item.status);
      setResponsavel(item.responsavel ?? "");
      setObservacao(item.observacao ?? "");
    }
  }, [item]);

  if (!item) return null;
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">{item.titulo}</DialogTitle>
          {item.descricao && <DialogDescription>{item.descricao}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as ChecklistStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Responsável</label>
            <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Observação / evidência</label>
            <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button
            onClick={() => onSave({ status, responsavel: responsavel || null, observacao: observacao || null })}
            disabled={saving}
          >
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
