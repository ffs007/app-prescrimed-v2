// Etapa 19 — Aba de aprendizado de termos sugeridos pela IA.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";

interface TermoRow {
  id: string;
  termo_original: string;
  termo_corrigido: string;
  principio_ativo_relacionado: string | null;
  contexto: string | null;
  status: string;
  criado_em: string;
}

export default function LearningTermsTab({ canEdit }: { canEdit: boolean }) {
  const [rows, setRows] = useState<TermoRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("termos_aprendizado_ia")
      .select("id, termo_original, termo_corrigido, principio_ativo_relacionado, contexto, status, criado_em")
      .order("criado_em", { ascending: false })
      .limit(200);
    setRows((data ?? []) as TermoRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: "aprovado" | "rejeitado") => {
    const { error } = await supabase
      .from("termos_aprendizado_ia")
      .update({ status })
      .eq("id", id);
    if (error) { toast.error("Falha ao atualizar"); return; }
    toast.success("Termo " + (status === "aprovado" ? "aprovado" : "rejeitado"));
    load();
  };

  return (
    <Card>
      <CardHeader><CardTitle>Termos aprendidos pela IA</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-6"><Loader2 className="h-4 w-4 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum termo registrado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Termo original</TableHead>
                <TableHead>Termo corrigido</TableHead>
                <TableHead>Princípio ativo</TableHead>
                <TableHead>Contexto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{r.termo_original}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.termo_corrigido}</TableCell>
                  <TableCell className="text-xs">{r.principio_ativo_relacionado ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{r.contexto ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{r.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    {canEdit && r.status === "pendente" && (
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "aprovado")}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "rejeitado")}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
