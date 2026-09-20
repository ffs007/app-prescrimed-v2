import { Link } from "react-router-dom";
import { Plus, Sparkles, Mic, History as HistoryIcon, FileText, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { reportError } from "@/lib/reportError";

export default function Home() {
  const [counts, setCounts] = useState({ presc: 0, docs: 0, favs: 0 });

  useEffect(() => {
    (async () => {
      const today = new Date(); today.setHours(0,0,0,0);
      const since = today.toISOString();
      const [prescRes, docsRes, favsRes] = await Promise.all([
        supabase.from("prescricoes_historico").select("*", { count: "exact", head: true }).gte("criado_em", since),
        supabase.from("documentos_gerados").select("*", { count: "exact", head: true }).gte("data_hora", since),
        supabase.from("patologia_personalizacao").select("*", { count: "exact", head: true }).eq("favorito", true),
      ]);
      const failed = [prescRes, docsRes, favsRes].find((r) => r.error);
      if (failed?.error) {
        reportError("Home.contadores", failed.error);
        return;
      }
      setCounts({ presc: prescRes.count ?? 0, docs: docsRes.count ?? 0, favs: favsRes.count ?? 0 });
    })();
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">PrescriMed</h1>
        <p className="text-muted-foreground">
          Prescrição rápida e segura para urgência e emergência.
        </p>
      </div>

      <Button asChild size="lg" className="w-full h-16 text-lg">
        <Link to="/app/prescricao/nova">
          <Plus className="h-6 w-6 mr-2" /> Nova Prescrição
        </Link>
      </Button>

      <div className="grid grid-cols-3 gap-3">
        <SecondaryAction to="/app/modelos" icon={Sparkles} label="Usar modelo rápido" />
        <SecondaryAction to="/app/prescricao/nova?smart=1" icon={Mic} label="Entrada por voz/texto" />
        <SecondaryAction to="/app/historico" icon={HistoryIcon} label="Histórico recente" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MiniCard icon={FileText} label="Prescrições hoje" value={counts.presc} />
        <MiniCard icon={FileText} label="Documentos gerados" value={counts.docs} />
        <MiniCard icon={Star} label="Modelos favoritos" value={counts.favs} />
      </div>
    </div>
  );
}

function SecondaryAction({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
      <Link to={to}>
        <Icon className="h-5 w-5" />
        <span className="text-xs text-center font-medium">{label}</span>
      </Link>
    </Button>
  );
}

function MiniCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div>
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
