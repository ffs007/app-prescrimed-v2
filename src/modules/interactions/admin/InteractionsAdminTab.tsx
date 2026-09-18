import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, FileSpreadsheet } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import InteractionFormDialog from "./InteractionFormDialog";
import InteractionsSettingsCard from "./InteractionsSettingsCard";
import { toast } from "sonner";

interface Props { canEdit: boolean; isAdmin: boolean }

export default function InteractionsAdminTab({ canEdit, isAdmin }: Props) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await (supabase.from("base_interacoes_medicamentosas") as any)
      .select("*").order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Record<string, unknown>[]) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = items.filter((it) => {
    if (!search) return true;
    const t = search.toLowerCase();
    return [it.principio_ativo_a, it.principio_ativo_b, it.classe_a, it.classe_b]
      .some((v) => String(v || "").toLowerCase().includes(t));
  });

  function downloadTemplate() {
    const headers = [
      "medicamento_a","medicamento_b","principio_ativo_a","principio_ativo_b","classe_a","classe_b",
      "tipo_interacao","mecanismo","gravidade","nivel_alerta","conduta_sugerida","mensagem_medico",
      "mensagem_enfermagem_farmacia","exige_justificativa","bloqueio_absoluto",
      "monitorizacao_recomendada","exames_monitorar","populacoes_maior_risco",
      "contexto_clinico_relevante","fonte_referencia","data_atualizacao","status_revisao",
    ];
    const csv = headers.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "interacoes_modelo.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Base de Interações Medicamentosas</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={downloadTemplate}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Modelo CSV
            </Button>
            <Button size="sm" disabled={!canEdit} onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nova interação
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Input placeholder="Buscar por princípio ativo ou classe…" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-3" />
          {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>A</TableHead>
                  <TableHead>B</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Gravidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((it) => (
                  <TableRow key={it.id as string}>
                    <TableCell className="text-xs">{(it.principio_ativo_a as string) || (it.classe_a as string) || "—"}</TableCell>
                    <TableCell className="text-xs">{(it.principio_ativo_b as string) || (it.classe_b as string) || "—"}</TableCell>
                    <TableCell className="text-xs">{it.tipo_interacao as string}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px]">{it.gravidade as string}</Badge>
                      {(it.bloqueio_absoluto as boolean) && <Badge className="ml-1 bg-destructive/10 text-destructive border-destructive/30 text-[10px]">Bloqueio</Badge>}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px]">{it.status_revisao as string}</Badge>
                      {!it.fonte_referencia && <Badge className="ml-1 text-[10px] bg-warning/10 text-warning border-warning/30">Sem fonte</Badge>}
                    </TableCell>
                    <TableCell className="text-xs max-w-[180px] truncate">{(it.fonte_referencia as string) || "—"}</TableCell>
                    <TableCell><Button size="sm" variant="ghost" disabled={!canEdit} onClick={() => setEditing(it)}><Pencil className="h-3 w-3" /></Button></TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-6">Nenhuma interação cadastrada.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <InteractionsSettingsCard canEdit={isAdmin} />

      <p className="text-[11px] text-muted-foreground">
        Interações e riscos devem ser cadastrados com fonte, data e revisão técnica antes de uso clínico.
      </p>

      {(creating || editing) && (
        <InteractionFormDialog
          open={creating || !!editing}
          initial={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
