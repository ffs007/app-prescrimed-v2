import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Play, Download, Filter, AlertTriangle, ShieldCheck, FileText } from "lucide-react";
import { toast } from "sonner";
import { useTestesClinicosV2, type TesteClinicoV2 } from "./hooks/useTestesClinicosV2";
import {
  CATEGORIA_LABEL,
  PRONTIDAO_LABEL,
  PRONTIDAO_TONE,
  STATUS_LABEL,
  STATUS_TONE,
  calcularProntidao,
  type TesteStatusV2,
} from "./lib/status";
import { exportCSV, exportPDF, exportXLSX } from "./lib/exportRelatorio";

export default function TestesClinicosV2Panel() {
  const { items, config, loading, setResult, updateConfig } = useTestesClinicosV2();
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterCategoria, setFilterCategoria] = useState<string>("todas");
  const [filterCritico, setFilterCritico] = useState<string>("todos");
  const [selected, setSelected] = useState<TesteClinicoV2 | null>(null);
  const [novoStatus, setNovoStatus] = useState<TesteStatusV2>("aprovado");
  const [obs, setObs] = useState("");
  const [obtido, setObtido] = useState("");
  const [justificativa, setJustificativa] = useState("");

  const totais = useMemo(() => {
    const total = items.length;
    const aprov = items.filter((i) => i.status_teste === "aprovado" || i.status_teste === "corrigido").length;
    const repr = items.filter((i) => i.status_teste === "reprovado").length;
    const pend = items.filter((i) => i.status_teste === "pendente").length;
    const corr = items.filter((i) => i.status_teste === "corrigido").length;
    const critRepr = items.filter((i) => i.critico && i.status_teste === "reprovado").length;
    const pctAprov = total ? Math.round((aprov / total) * 100) : 0;
    const ultima = items
      .map((i) => i.data_hora_teste)
      .filter((d): d is string => !!d)
      .sort()
      .pop() ?? null;
    return { total, aprov, repr, pend, corr, critRepr, pctAprov, ultima };
  }, [items]);

  const prontidao = useMemo(() => calcularProntidao(items), [items]);

  const criticosPendentes = useMemo(
    () => items.filter((i) => i.critico && ["pendente", "reprovado", "precisa_ajuste"].includes(i.status_teste)),
    [items],
  );

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filterStatus !== "todos" && i.status_teste !== filterStatus) return false;
      if (filterCategoria !== "todas" && i.categoria_teste !== filterCategoria) return false;
      if (filterCritico === "criticos" && !i.critico) return false;
      if (filterCritico === "nao_criticos" && i.critico) return false;
      return true;
    });
  }, [items, filterStatus, filterCategoria, filterCritico]);

  const openDialog = (t: TesteClinicoV2, status: TesteStatusV2 = "aprovado") => {
    setSelected(t);
    setNovoStatus(status);
    setObs(t.observacao ?? "");
    setObtido(t.resultado_obtido ?? "");
    setJustificativa(t.justificativa_ignorar ?? "");
  };

  const handleSave = async () => {
    if (!selected) return;
    if (novoStatus === "ignorado" && selected.critico && config?.exigir_criticos_aprovados) {
      toast.error("Não é permitido ignorar teste crítico com essa configuração ativada.");
      return;
    }
    if (novoStatus === "ignorado" && !justificativa.trim()) {
      toast.error("Justificativa obrigatória para ignorar.");
      return;
    }
    try {
      await setResult(selected, novoStatus, obs, obtido, justificativa);
      toast.success("Teste atualizado.");
      setSelected(null);
    } catch (e) {
      toast.error("Falha ao salvar teste.");
    }
  };

  const categorias = useMemo(
    () => Array.from(new Set(items.map((i) => i.categoria_teste))).sort(),
    [items],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Testes Clínicos
          </h2>
          <p className="text-xs text-muted-foreground">
            Casos simulados para validar segurança clínica antes do beta.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => exportCSV(items)}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportXLSX(items)}>
            <Download className="h-4 w-4 mr-1" /> XLSX
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportPDF(items)}>
            <FileText className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      </div>

      {/* Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        <Metric label="Total" value={totais.total} />
        <Metric label="Aprovados" value={totais.aprov} tone="text-primary" />
        <Metric label="Reprovados" value={totais.repr} tone="text-destructive" />
        <Metric label="Pendentes" value={totais.pend} />
        <Metric label="Corrigidos" value={totais.corr} tone="text-primary" />
        <Metric label="Críticos reprov." value={totais.critRepr} tone="text-destructive" />
        <Metric label="% Aprovação" value={`${totais.pctAprov}%`} />
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3 justify-between">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Status dos Testes Clínicos</div>
            <Badge variant="outline" className={PRONTIDAO_TONE[prontidao]}>
              {PRONTIDAO_LABEL[prontidao]}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Última rodada: {totais.ultima ? new Date(totais.ultima).toLocaleString("pt-BR") : "—"}
          </div>
        </CardContent>
      </Card>

      {criticosPendentes.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Testes críticos pendentes ou reprovados
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            {criticosPendentes.map((t) => (
              <div key={t.id} className="flex justify-between gap-2">
                <span>{t.codigo} — {t.nome_teste}</span>
                <Badge variant="outline" className={STATUS_TONE[t.status_teste]}>
                  {STATUS_LABEL[t.status_teste]}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-3 flex flex-wrap gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[170px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="w-[180px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas categorias</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c} value={c}>{CATEGORIA_LABEL[c] ?? c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCritico} onValueChange={setFilterCritico}>
            <SelectTrigger className="w-[160px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Críticos + não</SelectItem>
              <SelectItem value="criticos">Apenas críticos</SelectItem>
              <SelectItem value="nao_criticos">Não críticos</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground ml-auto">
            {filtered.length} de {items.length}
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Cód.</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="w-20">Crít.</TableHead>
                <TableHead className="w-40">Status</TableHead>
                <TableHead className="w-40">Última exec.</TableHead>
                <TableHead className="w-56">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                  Carregando…
                </TableCell></TableRow>
              )}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                  Nenhum teste encontrado.
                </TableCell></TableRow>
              )}
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs font-mono">{t.codigo}</TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium">{t.nome_teste}</div>
                    {t.descricao && <div className="text-muted-foreground line-clamp-2">{t.descricao}</div>}
                  </TableCell>
                  <TableCell className="text-xs">
                    {CATEGORIA_LABEL[t.categoria_teste] ?? t.categoria_teste}
                  </TableCell>
                  <TableCell>
                    {t.critico ? (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px]">
                        Crítico
                      </Badge>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_TONE[t.status_teste]}>
                      {STATUS_LABEL[t.status_teste]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {t.data_hora_teste ? new Date(t.data_hora_teste).toLocaleString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => openDialog(t)}>
                      <Play className="h-3.5 w-3.5 mr-1" /> Rodar / marcar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Configurações */}
      {config && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Configurações</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-3 text-xs">
            <ConfigRow
              label="Exigir testes críticos aprovados para status pronto para beta"
              checked={config.exigir_criticos_aprovados}
              onChange={(v) => updateConfig({ exigir_criticos_aprovados: v })}
            />
            <ConfigRow
              label="Permitir ignorar teste com justificativa (exceto críticos)"
              checked={config.permitir_ignorar_com_justificativa}
              onChange={(v) => updateConfig({ permitir_ignorar_com_justificativa: v })}
            />
            <ConfigRow
              label="Gerar log a cada execução"
              checked={config.gerar_log_execucao}
              onChange={(v) => updateConfig({ gerar_log_execucao: v })}
            />
            <ConfigRow
              label="Mostrar Testes Clínicos no menu lateral (admin)"
              checked={config.mostrar_no_menu_lateral}
              onChange={(v) => updateConfig({ mostrar_no_menu_lateral: v })}
            />
            <ConfigRow
              label="Mostrar resumo dos testes na Prontidão Beta"
              checked={config.mostrar_resumo_prontidao_beta}
              onChange={(v) => updateConfig({ mostrar_resumo_prontidao_beta: v })}
            />
          </CardContent>
        </Card>
      )}

      {/* Dialog rodar */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {selected?.codigo} — {selected?.nome_teste}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-xs">
              {selected.descricao && (
                <div className="text-muted-foreground">{selected.descricao}</div>
              )}
              <div className="grid gap-1">
                <span className="font-medium">Alerta / resultado esperado</span>
                <span className="text-muted-foreground">{selected.alerta_esperado ?? "—"}</span>
              </div>
              {selected.comportamento_esperado && (
                <div className="grid gap-1">
                  <span className="font-medium">Comportamento esperado</span>
                  <span className="text-muted-foreground">{selected.comportamento_esperado}</span>
                </div>
              )}
              <div className="grid gap-1">
                <Label className="text-xs">Novo status</Label>
                <Select value={novoStatus} onValueChange={(v) => setNovoStatus(v as TesteStatusV2)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="reprovado">Reprovado</SelectItem>
                    <SelectItem value="precisa_ajuste">Precisa ajuste</SelectItem>
                    <SelectItem value="corrigido">Corrigido</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    {config?.permitir_ignorar_com_justificativa && !selected.critico && (
                      <SelectItem value="ignorado">Ignorado com justificativa</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Resultado obtido</Label>
                <Textarea rows={2} value={obtido} onChange={(e) => setObtido(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Observação</Label>
                <Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
              </div>
              {novoStatus === "ignorado" && (
                <div className="grid gap-1">
                  <Label className="text-xs">Justificativa (obrigatória)</Label>
                  <Textarea rows={2} value={justificativa} onChange={(e) => setJustificativa(e.target.value)} />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelected(null)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={`text-lg font-semibold ${tone ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function ConfigRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 p-2 rounded border bg-card">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export function useProntidaoTestesClinicos() {
  const { items } = useTestesClinicosV2();
  return { prontidao: calcularProntidao(items), items };
}
