import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";
import { reportError } from "@/lib/reportError";

interface DocRow {
  id: string;
  titulo: string;
  tipo: string;
  status: string;
  data_hora: string;
  id_paciente: string | null;
}

export default function HistoryPage() {
  const [items, setItems] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("documentos_gerados")
        .select("id, titulo, tipo, status, data_hora, id_paciente")
        .order("data_hora", { ascending: false })
        .limit(100);
      if (error) reportError("HistoryPage", error, "Não foi possível carregar o histórico de documentos.");
      setItems((data ?? []) as DocRow[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Histórico recente</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Últimos documentos e prescrições</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin" /></div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum registro ainda. As prescrições aparecerão aqui após geradas.
            </p>
          ) : items.map((d) => (
            <div key={d.id} className="flex items-center gap-3 border rounded-md p-3">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{d.titulo}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(d.data_hora).toLocaleString("pt-BR")} · {d.tipo}
                </div>
              </div>
              <Badge variant="outline" className="text-xs">{d.status}</Badge>
            </div>
          ))}
          <div className="pt-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/app/documentos">Ver todos os documentos</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
