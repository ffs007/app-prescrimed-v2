import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, FileSpreadsheet, Search } from "lucide-react";
import { useBaseMedicamentos, type BaseMedicamento } from "../hooks/useBaseMedicamentos";
import { CATEGORIAS_CLINICAS, PRIORIDADES_MVP, STATUS_REVISAO } from "../lib/constants";
import MedicamentoFormDialog from "./MedicamentoFormDialog";
import ImportarMedicamentosDialog from "./ImportarMedicamentosDialog";

const labelOf = (arr: readonly { value: string; label: string }[], v: string) =>
  arr.find((x) => x.value === v)?.label ?? v;

const statusVariant = (s: string) =>
  s === "revisado" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
  : s === "precisa_corrigir" ? "bg-destructive/10 text-destructive border-destructive/30"
  : s === "inativo" ? "bg-muted text-muted-foreground"
  : "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400";

const prioVariant = (p: string) =>
  p === "essencial" ? "bg-primary/10 text-primary border-primary/30"
  : p === "alta" ? "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400"
  : "";

type Props = { canEdit: boolean; isAdmin: boolean };

export default function BaseMedicamentosTab({ canEdit }: Props) {
  const { items, loading, upsert, reload } = useBaseMedicamentos();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [prio, setPrio] = useState("all");
  const [stat, setStat] = useState("all");
  const [editing, setEditing] = useState<BaseMedicamento | null>(null);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((m) => {
      if (q) {
        const hay = [m.principio_ativo, ...(m.nomes_comerciais ?? []), ...(m.sinonimos ?? []), ...(m.termos_busca ?? [])].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (cat !== "all" && m.categoria_clinica !== cat) return false;
      if (prio !== "all" && m.prioridade_mvp !== prio) return false;
      if (stat !== "all" && m.status_revisao !== stat) return false;
      return true;
    });
  }, [items, search, cat, prio, stat]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Base Geral de Medicamentos</CardTitle>
          {canEdit && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setImporting(true)}>
                <FileSpreadsheet className="h-4 w-4 mr-1" /> Importar
              </Button>
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4 mr-1" /> Novo
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome, sinônimo, CID…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {CATEGORIAS_CLINICAS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={prio} onValueChange={setPrio}>
            <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas prioridades</SelectItem>
              {PRIORIDADES_MVP.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={stat} onValueChange={setStat}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              {STATUS_REVISAO.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Princípio ativo</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead className="hidden lg:table-cell">Vias</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Carregando…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum medicamento.</TableCell></TableRow>
              ) : filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="font-medium">{m.principio_ativo}</div>
                    {m.nome_comercial_referencia && <div className="text-xs text-muted-foreground">{m.nome_comercial_referencia}</div>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {labelOf(CATEGORIAS_CLINICAS as any, m.categoria_clinica)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {[m.medicamento_oral && "Oral", m.medicamento_injetavel && "Inj", m.medicamento_topico && "Tóp", m.medicamento_inalatorio && "Inal"].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
                  <TableCell><Badge variant="outline" className={prioVariant(m.prioridade_mvp)}>{labelOf(PRIORIDADES_MVP as any, m.prioridade_mvp)}</Badge></TableCell>
                  <TableCell className="hidden sm:table-cell"><Badge variant="outline" className={statusVariant(m.status_revisao)}>{labelOf(STATUS_REVISAO as any, m.status_revisao)}</Badge></TableCell>
                  <TableCell className="text-right">
                    {canEdit && (
                      <Button size="icon" variant="ghost" onClick={() => setEditing(m)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {(creating || editing) && (
        <MedicamentoFormDialog
          open={creating || !!editing}
          initial={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={upsert}
        />
      )}
      <ImportarMedicamentosDialog open={importing} onClose={() => setImporting(false)} onImported={reload} />
    </div>
  );
}
