import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

type Sug = {
  id: string;
  id_medicamento: string | null;
  principio_ativo: string;
  termo_sugerido: string;
  termo_normalizado: string | null;
  vezes_confirmado: number;
  ultimo_usuario: string | null;
  status: "pendente" | "aprovado" | "rejeitado";
  created_at: string;
};

export default function IVSuggestedTermsPanel({ canApprove }: { canApprove: boolean }) {
  const [items, setItems] = useState<Sug[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("iv_termos_sugeridos")
      .select("*")
      .eq("status", "pendente")
      .order("created_at", { ascending: false })
      .limit(100);
    setItems((data as Sug[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (s: Sug) => {
    if (!s.id_medicamento) return;
    const { data: med } = await supabase
      .from("iv_medications")
      .select("termos_busca")
      .eq("id", s.id_medicamento)
      .maybeSingle();
    const current = ((med as any)?.termos_busca ?? []) as string[];
    if (!current.includes(s.termo_sugerido)) {
      await supabase
        .from("iv_medications")
        .update({ termos_busca: [...current, s.termo_sugerido] } as any)
        .eq("id", s.id_medicamento);
    }
    await supabase
      .from("iv_termos_sugeridos")
      .update({ status: "aprovado", data_revisao: new Date().toISOString() } as any)
      .eq("id", s.id);
    toast.success("Termo aprovado");
    load();
  };

  const reject = async (s: Sug) => {
    await supabase
      .from("iv_termos_sugeridos")
      .update({ status: "rejeitado", data_revisao: new Date().toISOString() } as any)
      .eq("id", s.id);
    load();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Termos sugeridos por usuários</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Termo sugerido</TableHead>
              <TableHead>Medicamento</TableHead>
              <TableHead>Confirmações</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Carregando…</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Sem sugestões pendentes.</TableCell></TableRow>
            ) : items.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.termo_sugerido}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.principio_ativo}</TableCell>
                <TableCell><Badge variant="outline">{s.vezes_confirmado}×</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="outline" onClick={() => approve(s)} disabled={!canApprove}>
                      <Check className="h-3 w-3 mr-1" /> Aprovar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => reject(s)} disabled={!canApprove}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
