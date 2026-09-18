import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, AlertTriangle, ShieldCheck, ListChecks } from "lucide-react";
import { usePacoteBeta } from "./usePacoteBeta";
import {
  BLOCO_STATUS_LABEL, PRONTIDAO_LABEL, STATUS_LABEL,
  blocoTone, statusTone,
} from "./pacoteBetaLogic";

const gravidadeTone = (g: string) =>
  g === "critica" ? "bg-destructive/10 text-destructive border-destructive/30"
  : g === "alta" ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
  : g === "media" ? "bg-sky-500/10 text-sky-700 border-sky-500/30"
  : "bg-muted text-muted-foreground";

function csvEscape(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function PacoteBetaTab() {
  const { loading, erro, avaliados, blocos, prontidao, resumo } = usePacoteBeta();
  const [blocoFiltro, setBlocoFiltro] = useState<string>("all");
  const [tipo, setTipo] = useState<string>("all");
  const [busca, setBusca] = useState("");

  const pendencias = useMemo(() => {
    const rows: Array<{
      bloco: string; med: string; tipo: string;
      statusKey: import("./pacoteBetaLogic").StatusCompletude;
      status: string;
      campo: string; gravidade: string; acao: string; alto_risco: string; observacao: string;
    }> = [];
    for (const it of avaliados) {
      if (it.status === "pronto_beta" || it.status === "revisado") continue;
      const list = it.pendencias.length ? it.pendencias : [{ campo: "-", gravidade: "media", acao: "Revisar" }];
      for (const p of list) {
        rows.push({
          bloco: it.pacote.bloco_nome,
          med: it.pacote.principio_ativo,
          tipo: it.pacote.obrigatoriedade,
          statusKey: it.status,
          status: STATUS_LABEL[it.status],
          campo: p.campo,
          gravidade: p.gravidade,
          acao: p.acao,
          alto_risco: it.pacote.alto_risco ? "sim" : "nao",
          observacao: it.seguranca_incompleta ? "Segurança incompleta" : "",
        });
      }
    }
    return rows;
  }, [avaliados]);

  const pendenciasFiltradas = pendencias.filter(p => {
    if (blocoFiltro !== "all" && p.bloco !== blocoFiltro) return false;
    if (tipo !== "all" && p.tipo !== tipo) return false;
    if (busca && !`${p.med} ${p.campo} ${p.acao}`.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const exportCsv = () => {
    const header = ["bloco","medicamento","obrigatoriedade","status","campo_pendente","gravidade","acao","alto_risco","observacao"];
    const lines = [header.join(";")];
    for (const p of pendencias) {
      lines.push([p.bloco, p.med, p.tipo, p.status, p.campo, p.gravidade, p.acao, p.alto_risco, p.observacao].map(csvEscape).join(";"));
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prescrimed_pendencias_beta_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Carregando pacote beta…</p>;
  if (erro) return <p className="text-sm text-destructive">Erro: {erro}</p>;

  return (
    <div className="space-y-4">
      {/* Prontidão geral */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Prontidão Medicamentosa Beta
            </CardTitle>
            <Badge variant="outline" className={
              prontidao === "pronto_beta" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
              : prontidao === "pronto_com_pendencias" ? "bg-sky-500/10 text-sky-700 border-sky-500/30"
              : prontidao === "parcial" ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
              : "bg-destructive/10 text-destructive border-destructive/30"
            }>{PRONTIDAO_LABEL[prontidao]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Metric label="Obrigatórios prontos" value={`${resumo.obrig_prontos}/${resumo.obrig_total}`} />
          <Metric label="Obrigatórios pendentes" value={String(resumo.obrig_pendentes)} tone={resumo.obrig_pendentes > 0 ? "warn" : "ok"} />
          <Metric label="Desejáveis prontos" value={`${resumo.desej_prontos}/${resumo.desej_total}`} />
          <Metric label="Blocos prontos" value={`${resumo.blocos_prontos}/${blocos.length}`} />
          <Metric label="Blocos pendentes" value={String(resumo.blocos_pendentes)} tone={resumo.blocos_pendentes > 0 ? "warn" : "ok"} />
          <Metric label="Alto risco pendentes" value={String(resumo.alto_risco_pendentes)} tone={resumo.alto_risco_pendentes > 0 ? "danger" : "ok"} />
        </CardContent>
      </Card>

      {/* Cards por bloco */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ListChecks className="h-4 w-4" /> Blocos clínicos
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {blocos.map(b => (
            <div key={b.slug} className="border rounded-md p-3 space-y-2 bg-card">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-tight">{b.nome}</p>
                <Badge variant="outline" className={blocoTone(b.status)}>{BLOCO_STATUS_LABEL[b.status]}</Badge>
              </div>
              <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1">
                <span>Obrigatórios: <strong className="text-foreground">{b.obrig_prontos}/{b.obrig_total}</strong></span>
                <span>Desejáveis: <strong className="text-foreground">{b.desej_prontos}/{b.desej_total}</strong></span>
                {b.alto_risco_pendentes > 0 && (
                  <span className="col-span-2 flex items-center gap-1 text-destructive">
                    <AlertTriangle className="h-3 w-3" /> {b.alto_risco_pendentes} alto risco pendente(s)
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                onClick={() => setBlocoFiltro(b.nome)}>
                Ver pendências
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tabela de pendências */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm">Pendências do beta ({pendencias.length})</CardTitle>
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-1" /> Exportar CSV
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap pt-2">
            <Input
              placeholder="Buscar medicamento, campo…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="max-w-xs"
            />
            <Select value={blocoFiltro} onValueChange={setBlocoFiltro}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Bloco" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os blocos</SelectItem>
                {blocos.map(b => <SelectItem key={b.slug} value={b.nome}>{b.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="obrigatorio">Obrigatórios</SelectItem>
                <SelectItem value="desejavel">Desejáveis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bloco</TableHead>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Campo</TableHead>
                  <TableHead>Gravidade</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendenciasFiltradas.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{p.bloco}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {p.med}
                      {p.alto_risco === "sim" && (
                        <Badge variant="outline" className="ml-2 bg-destructive/10 text-destructive border-destructive/30">
                          alto risco
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs capitalize">{p.tipo}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusTone(p.statusKey)}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{p.campo}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={gravidadeTone(p.gravidade)}>{p.gravidade}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{p.acao}</TableCell>
                  </TableRow>
                ))}
                {pendenciasFiltradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
                      Nenhuma pendência com os filtros atuais.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        O sistema permite lançar o beta com pendências não críticas. Alto risco pendente exige revisão manual antes de aparecer como referência confiável.
      </p>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" | "danger" }) {
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
