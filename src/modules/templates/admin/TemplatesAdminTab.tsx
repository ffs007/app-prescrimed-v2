// Etapa 17 — Aba administrativa de Modelos / Conjuntos / Kits / Configurações.
import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { useModelosPrescricao } from "../hooks/useModelosPrescricao";
import { useConjuntosRapidos } from "../hooks/useConjuntosRapidos";
import { useKitsRapidos } from "../hooks/useKitsRapidos";
import { computeModeloBadges } from "../lib/templateBadges";
import ModeloFormDialog from "./ModeloFormDialog";
import ConjuntoFormDialog from "./ConjuntoFormDialog";
import KitFormDialog from "./KitFormDialog";
import TemplatesSettingsCard from "./TemplatesSettingsCard";

interface Props { canEdit: boolean; isAdmin: boolean }

export default function TemplatesAdminTab({ canEdit, isAdmin }: Props) {
  return (
    <div className="space-y-3">
      <Tabs defaultValue="modelos">
        <TabsList>
          <TabsTrigger value="modelos">Modelos</TabsTrigger>
          <TabsTrigger value="conjuntos">Conjuntos rápidos</TabsTrigger>
          <TabsTrigger value="kits">Kits rápidos</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="modelos" className="pt-4">
          <ModelosSection canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="conjuntos" className="pt-4">
          <ConjuntosSection canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="kits" className="pt-4">
          <KitsSection canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="config" className="pt-4">
          <TemplatesSettingsCard canEdit={isAdmin} />
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground border-t pt-3">
        Modelos aceleram a prescrição, mas devem ser revisados conforme paciente, contexto clínico, alergias, função renal/hepática, idade, peso e protocolos institucionais.
      </p>
    </div>
  );
}

function ModelosSection({ canEdit }: { canEdit: boolean }) {
  const { items, loading, newVersion, remove } = useModelosPrescricao("todos");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<typeof items[number] | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((m) =>
      m.nome_modelo.toLowerCase().includes(q) ||
      (m.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
      (m.area_clinica ?? "").toLowerCase().includes(q),
    );
  }, [items, search]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm">Modelos de prescrição</CardTitle>
        {canEdit && (
          <Button size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" />Novo</Button>
        )}
      </CardHeader>
      <CardContent>
        <Input placeholder="Buscar por nome, tag, área…" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-3" />
        {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contexto</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Badges</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.nome_modelo}</TableCell>
                    <TableCell>{m.tipo_modelo}</TableCell>
                    <TableCell>{m.contexto_atendimento}</TableCell>
                    <TableCell>v{m.versao_modelo}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {computeModeloBadges(m).map((b) => (
                          <Badge key={b} variant="secondary" className="text-xs">{b}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {canEdit && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => setEditing(m)}><Pencil className="h-3 w-3" /></Button>
                            <Button size="sm" variant="ghost" onClick={async () => {
                              const motivo = window.prompt("Motivo da nova versão:");
                              if (!motivo) return;
                              try { await newVersion(m, motivo); toast.success("Nova versão criada"); }
                              catch (e: any) { toast.error(e.message); }
                            }}><Copy className="h-3 w-3" /></Button>
                            <Button size="sm" variant="ghost" onClick={async () => {
                              if (!confirm("Inativar este modelo?")) return;
                              try { await remove(m.id); toast.success("Inativado"); }
                              catch (e: any) { toast.error(e.message); }
                            }}><Trash2 className="h-3 w-3" /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">Nenhum modelo cadastrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
        {(creating || editing) && (
          <ModeloFormDialog open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} modelo={editing} />
        )}
      </CardContent>
    </Card>
  );
}

function ConjuntosSection({ canEdit }: { canEdit: boolean }) {
  const { items, loading, remove } = useConjuntosRapidos();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<typeof items[number] | null>(null);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm">Conjuntos rápidos</CardTitle>
        {canEdit && <Button size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" />Novo</Button>}
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead><TableHead>Categoria</TableHead><TableHead>Contexto</TableHead>
                <TableHead>Visibilidade</TableHead><TableHead>Status</TableHead><TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.nome_conjunto}</TableCell>
                  <TableCell>{c.categoria}</TableCell>
                  <TableCell>{c.contexto_atendimento}</TableCell>
                  <TableCell>{c.visibilidade}</TableCell>
                  <TableCell>{c.status_revisao}</TableCell>
                  <TableCell>
                    {canEdit && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(c)}><Pencil className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={async () => {
                          if (!confirm("Inativar este conjunto?")) return;
                          try { await remove(c.id); toast.success("Inativado"); } catch (e: any) { toast.error(e.message); }
                        }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">Nenhum conjunto cadastrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
        {(creating || editing) && (
          <ConjuntoFormDialog open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} conjunto={editing} />
        )}
      </CardContent>
    </Card>
  );
}

function KitsSection({ canEdit }: { canEdit: boolean }) {
  const { items, loading, remove } = useKitsRapidos();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<typeof items[number] | null>(null);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm">Kits rápidos</CardTitle>
        {canEdit && <Button size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" />Novo</Button>}
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead><TableHead>Categoria</TableHead><TableHead>Contexto</TableHead>
                <TableHead>Visibilidade</TableHead><TableHead>Status</TableHead><TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((k) => (
                <TableRow key={k.id}>
                  <TableCell>{k.nome}</TableCell>
                  <TableCell>{k.categoria ?? "—"}</TableCell>
                  <TableCell>{k.contexto}</TableCell>
                  <TableCell>{k.visibilidade}</TableCell>
                  <TableCell>{k.status_revisao}</TableCell>
                  <TableCell>
                    {canEdit && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(k)}><Pencil className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={async () => {
                          if (!confirm("Inativar este kit?")) return;
                          try { await remove(k.id); toast.success("Inativado"); } catch (e: any) { toast.error(e.message); }
                        }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">Nenhum kit cadastrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
        {(creating || editing) && (
          <KitFormDialog open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} kit={editing} />
        )}
      </CardContent>
    </Card>
  );
}
