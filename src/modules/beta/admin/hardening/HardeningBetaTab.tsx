import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, Shield, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";
import {
  HardeningItem, HardeningStatus, SECOES, STATUS_LABEL,
  CRITICIDADE_LABEL, statusBadgeClass, computeProntidao,
} from "./hardeningConstants";

const STATUS_OPTIONS: HardeningStatus[] = [
  "pendente", "em_teste", "aprovado", "precisa_ajuste", "bloqueante", "nao_aplicavel",
];

export default function HardeningBetaTab() {
  const [items, setItems] = useState<HardeningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSecao, setFilterSecao] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCrit, setFilterCrit] = useState<string>("all");
  const [editing, setEditing] = useState<HardeningItem | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("hardening_beta_itens" as any)
      .select("*")
      .order("secao", { ascending: true })
      .order("ordem", { ascending: true });
    if (error) {
      toast.error("Não foi possível carregar o checklist agora.");
      setItems([]);
    } else {
      setItems((data as any) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filterSecao !== "all" && i.secao !== filterSecao) return false;
      if (filterStatus !== "all" && i.status !== filterStatus) return false;
      if (filterCrit !== "all" && i.criticidade !== filterCrit) return false;
      return true;
    });
  }, [items, filterSecao, filterStatus, filterCrit]);

  const prontidao = useMemo(() => computeProntidao(items), [items]);

  const bySecao = useMemo(() => {
    const map: Record<string, HardeningItem[]> = {};
    for (const it of filtered) {
      (map[it.secao] ??= []).push(it);
    }
    return map;
  }, [filtered]);

  const saveEdit = async (patch: Partial<HardeningItem>) => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from("hardening_beta_itens" as any)
      .update(patch)
      .eq("id", editing.id);
    setSaving(false);
    if (error) {
      toast.error("Não foi possível salvar agora. Tente novamente.");
      return;
    }
    toast.success("Item atualizado.");
    setEditing(null);
    load();
  };

  const exportRelatorio = (format: "xlsx" | "csv") => {
    const rows = items.map((i) => ({
      Seção: SECOES.find((s) => s.key === i.secao)?.label ?? i.secao,
      Título: i.titulo,
      Descrição: i.descricao ?? "",
      Status: STATUS_LABEL[i.status],
      Criticidade: CRITICIDADE_LABEL[i.criticidade],
      Responsável: i.responsavel ?? "",
      Observação: i.observacao ?? "",
      "Atualizado em": new Date(i.atualizado_em).toLocaleString("pt-BR"),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hardening Beta");
    const meta = [
      ["Data da revisão", new Date().toLocaleString("pt-BR")],
      ["Status final", prontidao.label],
      ["Total itens", items.length],
      ["Aprovados", prontidao.totais.aprovado],
      ["Pendentes", prontidao.totais.pendente],
      ["Em teste", prontidao.totais.em_teste],
      ["Precisa ajuste", prontidao.totais.precisa_ajuste],
      ["Bloqueantes", prontidao.totais.bloqueante],
      ["Não aplicáveis", prontidao.totais.nao_aplicavel],
      ["Críticos bloqueantes", prontidao.criticosBloqueantes],
      ["Críticos pendentes", prontidao.criticosPendentes],
    ];
    const wsMeta = XLSX.utils.aoa_to_sheet(meta);
    XLSX.utils.book_append_sheet(wb, wsMeta, "Resumo");
    const filename = `prescrimed-hardening-beta-${new Date().toISOString().slice(0, 10)}.${format}`;
    XLSX.writeFile(wb, filename, { bookType: format });
    toast.success("Relatório exportado.");
  };

  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Hardening Beta — Prontidão Final</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => exportRelatorio("csv")}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => exportRelatorio("xlsx")}>
                <Download className="h-4 w-4 mr-1" /> XLSX
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="col-span-full">
            <div className={`text-lg font-semibold ${prontidao.color}`}>{prontidao.label}</div>
            {prontidao.criticosBloqueantes > 0 && (
              <div className="text-xs text-destructive mt-1">
                {prontidao.criticosBloqueantes} item(ns) crítico(s) marcados como bloqueante ou precisa ajuste.
              </div>
            )}
            {prontidao.criticosPendentes > 0 && prontidao.criticosBloqueantes === 0 && (
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {prontidao.criticosPendentes} item(ns) crítico(s) ainda pendentes ou em teste.
              </div>
            )}
          </div>
          <SummaryStat label="Aprovados" value={prontidao.totais.aprovado} tone="emerald" />
          <SummaryStat label="Em teste" value={prontidao.totais.em_teste} tone="blue" />
          <SummaryStat label="Precisa ajuste" value={prontidao.totais.precisa_ajuste} tone="amber" />
          <SummaryStat label="Bloqueantes" value={prontidao.totais.bloqueante} tone="destructive" />
          <SummaryStat label="Pendentes" value={prontidao.totais.pendente} tone="muted" />
          <SummaryStat label="Não aplicáveis" value={prontidao.totais.nao_aplicavel} tone="muted" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Select value={filterSecao} onValueChange={setFilterSecao}>
            <SelectTrigger><SelectValue placeholder="Seção" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as seções</SelectItem>
              {SECOES.map((s) => (
                <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCrit} onValueChange={setFilterCrit}>
            <SelectTrigger><SelectValue placeholder="Criticidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as criticidades</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Carregando…</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum item encontrado com os filtros atuais.</CardContent></Card>
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
                      {it.criticidade === "alta" && (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px]">Crítico</Badge>
                      )}
                    </div>
                    {it.descricao && (
                      <div className="text-xs text-muted-foreground mt-0.5">{it.descricao}</div>
                    )}
                    {it.observacao && (
                      <div className="text-xs text-foreground/80 mt-1 italic">“{it.observacao}”</div>
                    )}
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

      <EditDialog
        item={editing}
        saving={saving}
        onClose={() => setEditing(null)}
        onSave={saveEdit}
      />
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone: "emerald" | "blue" | "amber" | "destructive" | "muted" }) {
  const toneClass =
    tone === "emerald" ? "text-emerald-600 dark:text-emerald-400"
    : tone === "blue" ? "text-blue-600 dark:text-blue-400"
    : tone === "amber" ? "text-amber-600 dark:text-amber-400"
    : tone === "destructive" ? "text-destructive"
    : "text-foreground";
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

function EditDialog({
  item, saving, onClose, onSave,
}: {
  item: HardeningItem | null;
  saving: boolean;
  onClose: () => void;
  onSave: (patch: Partial<HardeningItem>) => void;
}) {
  const [status, setStatus] = useState<HardeningStatus>("pendente");
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
        </DialogHeader>
        <div className="space-y-3">
          {item.descricao && <div className="text-sm text-muted-foreground">{item.descricao}</div>}
          <div className="grid gap-2">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as HardeningStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label className="text-xs text-muted-foreground">Responsável</label>
            <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Nome do responsável pela validação" />
          </div>
          <div className="grid gap-2">
            <label className="text-xs text-muted-foreground">Observação / evidência</label>
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Notas, passos testados, link de evidência…"
              rows={4}
            />
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
