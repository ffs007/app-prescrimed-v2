import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Resultado {
  escore: string;
  pontuacao: number;
  estrato: string;
  rotulo: string;
  detalhes: string[];
  observacao: string | null;
  created_at: string;
}

export default function ResultadoEscorePage() {
  const { token } = useParams<{ token: string }>();
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token) { setLoading(false); return; }
      const { data, error } = await supabase.rpc("get_resultado_escore_trauma", { _token: token });
      if (error) {
        console.error("[ResultadoEscorePage] falha ao buscar resultado:", error);
        setErro(true);
        setLoading(false);
        return;
      }
      const row = Array.isArray(data) ? data[0] : null;
      if (row) setResultado(row as unknown as Resultado);
      setLoading(false);
    })();
  }, [token]);

  return (
    <div className="container mx-auto py-10 px-4 max-w-2xl">
      <Helmet>
        <title>Resultado de escore de trauma | PrescriMed</title>
        <meta name="description" content="Consulte o resultado salvo de um escore de trauma (RTS, ISS ou TRISS) compartilhado por link seguro." />
      </Helmet>
      <main>
        <h1 className="text-2xl font-semibold mb-4">Resultado de escore de trauma</h1>
        {loading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : erro ? (
          <p className="text-muted-foreground">Não foi possível carregar o resultado agora. Tente novamente em instantes.</p>
        ) : !resultado ? (
          <p className="text-muted-foreground">Resultado não encontrado ou link inválido.</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>{resultado.escore}</span>
                <Badge variant="outline">{resultado.estrato}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-semibold tabular-nums">{resultado.rotulo}</p>
              <p className="text-sm text-muted-foreground">
                Registrado em {new Date(resultado.created_at).toLocaleString()}
              </p>
              {resultado.observacao && <p className="text-sm">{resultado.observacao}</p>}
              {resultado.detalhes?.length > 0 && (
                <ul className="text-sm space-y-1 border-t pt-3">
                  {resultado.detalhes.map((d) => (
                    <li key={d} className="text-muted-foreground">{d}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
        <Button asChild variant="outline" className="mt-6">
          <Link to="/app/escores-trauma">Abrir calculadora</Link>
        </Button>
      </main>
    </div>
  );
}
