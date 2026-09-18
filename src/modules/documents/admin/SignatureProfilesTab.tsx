// Etapa 20 — Gestão de perfis de assinatura (carimbos).
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSignatureProfiles } from "../hooks/useSignatureProfiles";
import type { AssinaturaPerfil } from "../lib/types";

type FormState = Partial<AssinaturaPerfil> & { perfil_nome: string; nome_profissional: string };

const empty: FormState = {
  perfil_nome: "", nome_profissional: "", registro: "", registro_uf: "",
  especialidade: "", rqe: "", email: "", telefone: "", endereco: "",
  cidade_padrao: "", logo_url: "", assinatura_url: "", padrao: false, ativo: true,
};

export default function SignatureProfilesTab({ canEdit }: { canEdit: boolean }) {
  const { profiles, loading, upsert, remove } = useSignatureProfiles();
  const [editing, setEditing] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.perfil_nome || !editing.nome_profissional) {
      toast.error("Informe nome do perfil e do profissional.");
      return;
    }
    setSaving(true);
    try {
      await upsert(editing);
      toast.success("Perfil salvo.");
      setEditing(null);
    } catch (e) {
      console.error(e);
      toast.error("Falha ao salvar perfil.");
    } finally { setSaving(false); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Perfis de Assinatura</CardTitle>
        {canEdit && (
          <Button size="sm" onClick={() => setEditing(empty)}>
            <Plus className="h-4 w-4 mr-1" /> Novo perfil
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Perfil</TableHead>
              <TableHead>Profissional</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead>Padrão</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-6">
                <Loader2 className="h-4 w-4 animate-spin inline" />
              </TableCell></TableRow>
            ) : profiles.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                Nenhum perfil cadastrado.
              </TableCell></TableRow>
            ) : profiles.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium text-sm">{p.perfil_nome}</TableCell>
                <TableCell className="text-sm">
                  {p.nome_profissional}
                  {p.especialidade && (
                    <div className="text-xs text-muted-foreground">{p.especialidade}</div>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {[p.registro, p.registro_uf].filter(Boolean).join("/")}
                </TableCell>
                <TableCell>
                  {p.padrao && <Badge variant="secondary">Padrão</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" disabled={!canEdit}
                      onClick={() => setEditing(p as FormState)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" disabled={!canEdit}
                      onClick={async () => {
                        if (!confirm("Excluir este perfil?")) return;
                        try { await remove(p.id); toast.success("Removido"); }
                        catch { toast.error("Falha ao remover"); }
                      }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Editar perfil" : "Novo perfil"}</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Nome do perfil"
                  value={editing.perfil_nome}
                  onChange={(v) => setEditing({ ...editing, perfil_nome: v })} />
                <Field label="Nome do profissional"
                  value={editing.nome_profissional}
                  onChange={(v) => setEditing({ ...editing, nome_profissional: v })} />
                <Field label="Registro (CRM/COREN…)"
                  value={editing.registro ?? ""}
                  onChange={(v) => setEditing({ ...editing, registro: v })} />
                <Field label="UF do registro"
                  value={editing.registro_uf ?? ""}
                  onChange={(v) => setEditing({ ...editing, registro_uf: v })} />
                <Field label="Especialidade"
                  value={editing.especialidade ?? ""}
                  onChange={(v) => setEditing({ ...editing, especialidade: v })} />
                <Field label="RQE"
                  value={editing.rqe ?? ""}
                  onChange={(v) => setEditing({ ...editing, rqe: v })} />
                <Field label="E-mail"
                  value={editing.email ?? ""}
                  onChange={(v) => setEditing({ ...editing, email: v })} />
                <Field label="Telefone"
                  value={editing.telefone ?? ""}
                  onChange={(v) => setEditing({ ...editing, telefone: v })} />
                <Field label="Endereço" full
                  value={editing.endereco ?? ""}
                  onChange={(v) => setEditing({ ...editing, endereco: v })} />
                <Field label="Cidade padrão"
                  value={editing.cidade_padrao ?? ""}
                  onChange={(v) => setEditing({ ...editing, cidade_padrao: v })} />
                <Field label="Logo (URL)"
                  value={editing.logo_url ?? ""}
                  onChange={(v) => setEditing({ ...editing, logo_url: v })} />
                <Field label="Assinatura digital (URL)" full
                  value={editing.assinatura_url ?? ""}
                  onChange={(v) => setEditing({ ...editing, assinatura_url: v })} />
                <div className="flex items-center gap-2 col-span-1">
                  <Switch checked={Boolean(editing.padrao)}
                    onCheckedChange={(v) => setEditing({ ...editing, padrao: v })} />
                  <Label className="text-sm">Definir como padrão</Label>
                </div>
                <div className="flex items-center gap-2 col-span-1">
                  <Switch checked={Boolean(editing.ativo ?? true)}
                    onCheckedChange={(v) => setEditing({ ...editing, ativo: v })} />
                  <Label className="text-sm">Ativo</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, onChange, full }: {
  label: string; value: string; onChange: (v: string) => void; full?: boolean;
}) {
  return (
    <div className={`space-y-1 ${full ? "md:col-span-2" : ""}`}>
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
