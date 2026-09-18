import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Search, Pencil } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import IVSynonymsEditor from "./IVSynonymsEditor";
import IVSuggestedTermsPanel from "./IVSuggestedTermsPanel";
import type { IVMedication } from "../IVDilutionAdminPage";

type Props = {
  items: IVMedication[];
  canEdit: boolean;
  canApprove: boolean;
  onChanged: () => void;
};

export default function IVSynonymsTab({ items, canEdit, canApprove, onChanged }: Props) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<IVMedication | null>(null);

  const filtered = items.filter((m) =>
    !search || m.principio_ativo.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleActive = async (m: IVMedication, value: boolean) => {
    const { error } = await supabase
      .from("iv_medications")
      .update({ ativo_para_correspondencia: value } as any)
      .eq("id", m.id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    toast.success(value ? "Ativado para correspondência" : "Desativado");
    onChanged();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar princípio ativo…" className="pl-8"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Princípio ativo</TableHead>
                <TableHead className="hidden md:table-cell">Normalizado</TableHead>
                <TableHead>Comerciais</TableHead>
                <TableHead className="hidden sm:table-cell">Sinônimos</TableHead>
                <TableHead className="hidden lg:table-cell">Termos busca</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum medicamento.</TableCell></TableRow>
              ) : filtered.map((m) => {
                const a = m as any;
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.principio_ativo}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{a.principio_ativo_normalizado ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{(a.nomes_comerciais ?? []).length}</Badge></TableCell>
                    <TableCell className="hidden sm:table-cell"><Badge variant="outline">{(a.sinonimos ?? []).length}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell"><Badge variant="outline">{(a.termos_busca ?? []).length}</Badge></TableCell>
                    <TableCell>
                      <Switch
                        checked={a.ativo_para_correspondencia ?? true}
                        onCheckedChange={(v) => toggleActive(m, v)}
                        disabled={!canEdit}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setEditing(m)} disabled={!canEdit}>
                        <Pencil className="h-3 w-3 mr-1" /> Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <IVSuggestedTermsPanel canApprove={canApprove} />

      {editing && (
        <IVSynonymsEditor
          medication={editing}
          open={!!editing}
          onClose={() => setEditing(null)}
          onSaved={onChanged}
        />
      )}
    </div>
  );
}
