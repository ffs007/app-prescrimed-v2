import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, FileSpreadsheet, Copy, Power } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import ProtocolFormDialog from "./ProtocolFormDialog";
import ProtocolsSettingsCard from "./ProtocolsSettingsCard";
import { qualityBadges } from "../lib/protocolQuality";
import type { Protocolo } from "../lib/types";

interface Props { canEdit: boolean; isAdmin: boolean }

const toneClass = (tone: string) =>
  tone === "success" ? "bg-success/10 text-success border-success/30"
  : tone === "warning" ? "bg-warning/10 text-warning border-warning/30"
  : tone === "destructive" ? "bg-destructive/10 text-destructive border-destructive/30"
  : "bg-muted text-muted-foreground";

export default function ProtocolsAdminTab({ canEdit, isAdmin }: Props) {
  const [items, setItems] = useState<Protocolo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Protocolo | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await (supabase.from("base_protocolos_clinicos") as any)
      .select("*").order("atualizado_em", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Protocolo[]) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = items.filter((p) => {
    if (!search) return true;
    const t = search.toLowerCase();
    return [p.nome_protocolo, p.area_clinica, ...(p.queixas_relacionadas || []), ...(p.cids_relacionados || [])]
      .some((v) => String(v || "").toLowerCase().includes(t));
  });

  async function duplicate(p: Protocolo) {
    const { id, criado_em, atualizado_em, ...rest } = p as any;
    const payload = { ...rest, nome_protocolo: `${p.nome_protocolo} (cópia)`, versao_protocolo: (p.versao_protocolo || 1) + 1, protocolo_origem: id, status_revisao: "rascunho" };
    const { error } = await (supabase.from("base_protocolos_clinicos") as any).insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Protocolo duplicado");
    load();
  }

  async function toggleActive(p: Protocolo) {
    const { error } = await (supabase.from("base_protocolos_clinicos") as any).update({ ativo: !p.ativo }).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    load();
  }

  function downloadTemplate() {
    const headers = [
      "nome_protocolo","tipo_protocolo","area_clinica","contexto_atendimento",
      "queixas_relacionadas","sindromes_relacionadas","cids_relacionados","palavras_chave",
      "populacao_alvo","faixa_etaria_min","faixa_etaria_max","orientacoes_paciente",
      "fonte_referencia","data_atualizacao","status_revisao","versao_protocolo",
    ];
    const csv = headers.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "protocolos_modelo.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Base de Protocolos Clínicos</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={downloadTemplate}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Modelo CSV
            </Button>
            <Button size="sm" disabled={!canEdit} onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4 mr-1" /> Novo protocolo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Input placeholder="Buscar por nome, área, queixa ou CID…" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-3" />
          {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contexto</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Qualidade</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const badges = qualityBadges(p);
                  return (
                    <TableRow key={p.id} className={!p.ativo ? "opacity-50" : ""}>
                      <TableCell className="text-xs">
                        <div className="font-medium">{p.nome_protocolo}</div>
                        {p.area_clinica && <div className="text-muted-foreground">{p.area_clinica}</div>}
                      </TableCell>
                      <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{p.tipo_protocolo}</Badge></TableCell>
                      <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{p.contexto_atendimento}</Badge></TableCell>
                      <TableCell className="text-xs">v{p.versao_protocolo}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-wrap gap-1">
                          {badges.map((b, i) => (
                            <Badge key={i} variant="outline" className={`text-[10px] ${toneClass(b.tone)}`}>{b.label}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" disabled={!canEdit} onClick={() => setEditing(p)}><Pencil className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" disabled={!canEdit} onClick={() => duplicate(p)} title="Duplicar"><Copy className="h-3 w-3" /></Button>
                          {isAdmin && (
                            <Button size="sm" variant="ghost" onClick={() => toggleActive(p)} title={p.ativo ? "Inativar" : "Ativar"}><Power className="h-3 w-3" /></Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">Nenhum protocolo cadastrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ProtocolsSettingsCard canEdit={isAdmin} />

      <p className="text-[11px] text-muted-foreground">
        Protocolos clínicos devem ser cadastrados com fonte, data e revisão técnica antes de uso assistencial.
      </p>

      {(creating || editing) && (
        <ProtocolFormDialog
          open={creating || !!editing}
          initial={editing as any}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
