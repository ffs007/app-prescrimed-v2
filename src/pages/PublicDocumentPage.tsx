import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ShieldAlert } from "lucide-react";

interface Resp {
  ok: boolean;
  reason?: "expirado" | "revogado" | "nao_encontrado";
  documento?: {
    titulo: string;
    tipo: string;
    paciente: string | null;
    profissional: string | null;
    data: string;
    pdf_url: string | null;
  };
}

export default function PublicDocumentPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    try {
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/public-document-link?token=${encodeURIComponent(token ?? "")}`;
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch {
      setData({ ok: false, reason: "nao_encontrado" });
    } finally {
      setLoading(false);
    }
  })(); }, [token]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando documento…</div>;
  }

  if (!data?.ok) {
    const msg = data?.reason === "expirado" ? "Este link expirou. Solicite novo envio ao profissional."
      : data?.reason === "revogado" ? "Este documento não está mais disponível."
      : "Documento não encontrado.";
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Indisponível</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{msg}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const d = data.documento!;
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5" /> {d.titulo}</CardTitle>
            <Badge variant="outline">{d.tipo}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {d.paciente && <p><span className="text-muted-foreground">Paciente:</span> {d.paciente}</p>}
          {d.profissional && <p><span className="text-muted-foreground">Profissional:</span> {d.profissional}</p>}
          <p><span className="text-muted-foreground">Emitido em:</span> {new Date(d.data).toLocaleString()}</p>
          {d.pdf_url ? (
            <Button asChild className="w-full"><a href={d.pdf_url} target="_blank" rel="noopener noreferrer">Baixar PDF</a></Button>
          ) : (
            <p className="text-xs text-muted-foreground">PDF ainda não disponível para este documento.</p>
          )}
          <p className="text-xs text-muted-foreground border-t pt-2">
            Documento emitido via PrescriMed. Em caso de dúvida, contate seu profissional.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
