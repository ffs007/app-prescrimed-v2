// Etapa 20 — Visualização dos logs de ações sobre documentos clínicos.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type LogRow = Database["public"]["Tables"]["log_documentos_clinicos"]["Row"];

export default function DocumentsLogsTab() {
  const [items, setItems] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("log_documentos_clinicos")
        .select("*")
        .order("data_hora", { ascending: false })
        .limit(300);
      if (error) toast.error("Falha ao carregar logs");
      setItems((data ?? []) as LogRow[]);
      setLoading(false);
    })();
  }, []);

  return (
    <Card>
      <CardHeader><CardTitle>Logs de documentos</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-6">
                <Loader2 className="h-4 w-4 animate-spin inline" />
              </TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                Nenhum registro.
              </TableCell></TableRow>
            ) : items.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-xs">
                  {new Date(l.data_hora).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{l.acao}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{l.tipo_documento ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{l.destino_envio ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{l.motivo_cancelamento ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
