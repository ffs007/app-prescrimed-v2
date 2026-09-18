import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, ShieldAlert, Activity, AlertTriangle, Layers, Search } from "lucide-react";
import { toast } from "sonner";
import { useQualidadeBase } from "./useQualidadeBase";
import {
  GRAV_LABEL, SAUDE_LABEL, gravTone,
  type Finding,
} from "./qualidadeLogic";

const csvEscape = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const CATEGORIA_LABEL: Record<string, string> = {
  erro_critico: "Erro crítico",
  alerta_alto: "Alerta alto",
  alerta_medio: "Alerta médio",
  pendencia_leve: "Pendência leve",
  sugestao: "Sugestão",
  duplicidade: "Duplicidade",
  modelo_rapido: "Modelo rápido",
  alto_risco: "Alto risco",
  controlado: "Controlado",
  antimicrobiano: "Antimicrobiano",
  injetavel_iv: "Injetável / IV",
};

export default function QualidadeBaseTab() {
  const { loading, erro, findings, duplicidades, saude, resumo, config, salvarConfig, ignorar } = useQualidadeBase();
  const [filtroGrav, setFiltroGrav] = useState<string>("all");
  const [filtroCat, setFiltroCat] = useState<string>("all");
  const [busca, setBusca] = useState("");
  const [ignorando, setIgnorando] = useState<Finding | null>(null);
  const [justificativa, setJustificativa] = useState("");

  const filtrados = useMemo(() => {
    return findings.filter(f => {
      if (filtroGrav !== "all" && f.gravidade !== filtroGrav) return false;
      if (filtroCat !== "all" && f.categoria !== filtroCat) return false;
      if (busca && !`${f.principio_ativo} ${f.mensagem} ${f.rule_code}`.toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    });
  }, [findings, filtroGrav, filtroCat, busca]);

  const exportar = () => {
    const header = ["medicamento","categoria","gravidade","regra","mensagem","acao_recomendada"];
    const lines = [header.join(";")];
    for (const f of findings) {
      lines.push([f.principio_ativo, CATEGORIA_LABEL[f.categoria] ?? f.categoria, GRAV_LABEL[f.gravidade], f.rule_code, f.mensagem, f.acao].map(csvEscape).join(";"));
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `prescrimed_qualidade_base_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const confirmIgnorar = async () => {
    if (!ignorando || justificativa.trim().length < 5) {
      toast.error("Justificativa muito curta.");
      return;
    }
    try {
      await ignorar(ignorando, justificativa.trim());
      toast.success("Alerta ignorado com justificativa.");
      setIgnorando(null); setJustificativa("");
    } catch (e: any) {
      toast.error("Erro: " + (e.message ?? "não foi possível ignorar"));
    }
  };

  const saudeTone =
    saude === "pronta_beta" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
    : saude === "boa" ? "bg-sky-500/10 text-sky-700 border-sky-500/30"
    : saude === "atencao" ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
    : "bg-destructive/10 text-destructive border-destructive/30";

  if (loading) return <p className="text-sm text-muted-foreground">Analisando base…</p>;
  if (erro) return <p className="text-sm text-destructive">Erro: {erro}</p>;

  return (
    <div className="space-y-4">
      {/* Saúde e resumo */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" /> Saúde da Base Medicamentosa
            </CardTitle>
            <Badge variant="outline" className={saudeTone}>{SAUDE_LABEL[saude]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
          <Metric label="Total" value={resumo.total} />
          <Metric label="Revisados" value={resumo.revisados} tone="ok" />
          <Metric label="Rascunho seguro" value={resumo.rascunho} />
          <Metric label="Aguardando revisão" value={resumo.aguardando} />
          <Metric label="Incompletos" value={resumo.incompletos} tone={resumo.incompletos > 0 ? "warn" : "ok"} />
          <Metric label="Com erro crítico" value={resumo.criticos} tone={resumo.criticos > 0 ? "danger" : "ok"} />
          <Metric label="Alto risco pendente" value={resumo.altoRiscoPend} tone={resumo.altoRiscoPend > 0 ? "danger" : "ok"} />
          <Metric label="Sem fonte" value={resumo.semFonte} tone={resumo.semFonte > 0 ? "warn" : "ok"} />
          <Metric label="Duplicados possíveis" value={resumo.dupPossiveis} tone={resumo.dupPossiveis > 0 ? "warn" : "ok"} />
          <Metric label="Prontos para beta" value={resumo.prontosBeta} tone="ok" />
        </CardContent>
      </Card>

      {/* Configurações */}
      {config && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Configurações da revisão automática</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-3 text-sm">
            <Toggle label="Rodar revisão automática ao importar planilha"
              value={config.revisao_ao_importar}
              onChange={v => salvarConfig({ revisao_ao_importar: v })} />
            <Toggle label="Rodar revisão automática ao editar medicamento"
              value={config.revisao_ao_editar}
              onChange={v => salvarConfig({ revisao_ao_editar: v })} />
            <Toggle label="Bloquear pronto beta com erro crítico"
              value={config.bloquear_beta_com_erro_critico}
              onChange={v => salvarConfig({ bloquear_beta_com_erro_critico: v })} />
            <Toggle label="Bloquear revisado sem fonte"
              value={config.bloquear_revisado_sem_fonte}
              onChange={v => salvarConfig({ bloquear_revisado_sem_fonte: v })} />
            <Toggle label="Permitir ignorar pendência com justificativa"
              value={config.permitir_ignorar_com_justificativa}
              onChange={v => salvarConfig({ permitir_ignorar_com_justificativa: v })} />
            <Toggle label="Sugerir termos de busca automaticamente"
              value={config.sugerir_termos_busca}
              onChange={v => salvarConfig({ sugerir_termos_busca: v })} />
            <Toggle label="Criar tarefa de correção para erro crítico"
              value={config.criar_tarefa_para_critico}
              onChange={v => salvarConfig({ criar_tarefa_para_critico: v })} />
          </CardContent>
        </Card>
      )}

      {/* Tabela de problemas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm">Problemas encontrados ({filtrados.length}/{findings.length})</CardTitle>
            <Button size="sm" variant="outline" onClick={exportar}>
              <Download className="h-4 w-4 mr-1" /> Exportar CSV
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap pt-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
              <Input placeholder="Buscar…" value={busca} onChange={e => setBusca(e.target.value)} className="pl-8 max-w-xs" />
            </div>
            <Select value={filtroGrav} onValueChange={setFiltroGrav}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas gravidades</SelectItem>
                <SelectItem value="critico">Críticos</SelectItem>
                <SelectItem value="alto">Altos</SelectItem>
                <SelectItem value="medio">Médios</SelectItem>
                <SelectItem value="leve">Leves</SelectItem>
                <SelectItem value="sugestao">Sugestões</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroCat} onValueChange={setFiltroCat}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {Object.entries(CATEGORIA_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Gravidade</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.slice(0, 400).map(f => (
                  <TableRow key={f.key}>
                    <TableCell className="text-sm font-medium">{f.principio_ativo}</TableCell>
                    <TableCell className="text-xs">{CATEGORIA_LABEL[f.categoria] ?? f.categoria}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={gravTone(f.gravidade)}>{GRAV_LABEL[f.gravidade]}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{f.mensagem}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{f.acao}</TableCell>
                    <TableCell className="text-right">
                      {config?.permitir_ignorar_com_justificativa && (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                          onClick={() => { setIgnorando(f); setJustificativa(""); }}>
                          Ignorar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                      Nenhum problema encontrado com os filtros atuais.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {filtrados.length > 400 && (
              <p className="text-xs text-muted-foreground mt-2">Exibindo os primeiros 400. Use os filtros para refinar.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Duplicidades */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4" /> Possíveis duplicidades ({duplicidades.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {duplicidades.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma duplicidade provável encontrada.</p>
          )}
          <div className="grid gap-2">
            {duplicidades.slice(0, 30).map(d => (
              <div key={d.key} className="border rounded-md p-3 text-sm bg-card">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-medium">{d.a.principio_ativo}</p>
                    <p className="text-xs text-muted-foreground">{d.a.apresentacao ?? "—"} · {d.a.via_administracao ?? "—"}</p>
                  </div>
                  <span className="text-xs text-muted-foreground self-center">⇄</span>
                  <div>
                    <p className="font-medium">{d.b.principio_ativo}</p>
                    <p className="text-xs text-muted-foreground">{d.b.apresentacao ?? "—"} · {d.b.via_administracao ?? "—"}</p>
                  </div>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30">
                    Possível duplicidade
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong className="text-foreground">Motivo:</strong> {d.motivo}
                </p>
              </div>
            ))}
          </div>
          {duplicidades.length > 30 && (
            <p className="text-xs text-muted-foreground mt-2">Exibindo as 30 primeiras. Duplicidades não são mescladas automaticamente.</p>
          )}
        </CardContent>
      </Card>

      {/* Alto risco / Controlados / Antimicrobianos / IV */}
      <div className="grid md:grid-cols-2 gap-4">
        <SecaoResumo titulo="Alto risco" icon={<ShieldAlert className="h-4 w-4" />}
          findings={findings.filter(f => f.categoria === "alto_risco")} />
        <SecaoResumo titulo="Controlados" icon={<AlertTriangle className="h-4 w-4" />}
          findings={findings.filter(f => f.categoria === "controlado")} />
        <SecaoResumo titulo="Antimicrobianos" icon={<AlertTriangle className="h-4 w-4" />}
          findings={findings.filter(f => f.categoria === "antimicrobiano")} />
        <SecaoResumo titulo="Injetáveis / Segurança IV" icon={<AlertTriangle className="h-4 w-4" />}
          findings={findings.filter(f => f.categoria === "injetavel_iv")} />
        <SecaoResumo titulo="Modelos rápidos com problema" icon={<AlertTriangle className="h-4 w-4" />}
          findings={findings.filter(f => f.categoria === "modelo_rapido")} />
      </div>

      <p className="text-xs text-muted-foreground">
        Correções sensíveis (dose, fonte, regra legal, mesclagem de duplicados) NUNCA são aplicadas automaticamente.
        A revisão manual continua obrigatória para alto risco, controlados e antimicrobianos.
      </p>

      {/* Modal ignorar */}
      <Dialog open={!!ignorando} onOpenChange={o => { if (!o) { setIgnorando(null); setJustificativa(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ignorar alerta com justificativa</DialogTitle>
          </DialogHeader>
          {ignorando && (
            <div className="space-y-3 text-sm">
              <div className="rounded border p-2 bg-muted/50">
                <p className="font-medium">{ignorando.principio_ativo}</p>
                <p className="text-xs text-muted-foreground">{ignorando.mensagem}</p>
              </div>
              <div>
                <Label>Justificativa clínica</Label>
                <Textarea
                  value={justificativa}
                  onChange={e => setJustificativa(e.target.value)}
                  placeholder="Ex.: medicamento não é usado em pediatria neste serviço."
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIgnorando(null)}>Cancelar</Button>
            <Button onClick={confirmIgnorar}>Ignorar e registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number | string; tone?: "ok" | "warn" | "danger" }) {
  const t = tone === "danger" ? "text-destructive"
    : tone === "warn" ? "text-amber-700"
    : tone === "ok" ? "text-emerald-700"
    : "text-foreground";
  return (
    <div className="border rounded-md p-3 bg-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${t}`}>{value}</p>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border rounded p-2">
      <Label className="text-sm leading-tight">{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function SecaoResumo({ titulo, icon, findings }: { titulo: string; icon: React.ReactNode; findings: Finding[] }) {
  const grouped = new Map<string, Finding[]>();
  for (const f of findings) {
    const k = f.medicamento_id ?? f.principio_ativo;
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(f);
  }
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">{icon} {titulo} ({grouped.size})</CardTitle>
      </CardHeader>
      <CardContent>
        {grouped.size === 0 && <p className="text-sm text-muted-foreground">Sem pendências nesta seção.</p>}
        <div className="space-y-2 max-h-64 overflow-auto">
          {Array.from(grouped.entries()).slice(0, 20).map(([k, arr]) => {
            const worst = arr.reduce((w, f) => {
              const rank = { critico: 4, alto: 3, medio: 2, leve: 1, sugestao: 0 } as const;
              return rank[f.gravidade] > rank[w.gravidade] ? f : w;
            }, arr[0]);
            return (
              <div key={k} className="border rounded p-2 text-sm flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{arr[0].principio_ativo}</p>
                  <p className="text-xs text-muted-foreground truncate">{arr[0].mensagem}</p>
                </div>
                <Badge variant="outline" className={gravTone(worst.gravidade)}>{GRAV_LABEL[worst.gravidade]}</Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
