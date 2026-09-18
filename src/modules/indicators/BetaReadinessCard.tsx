import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Circle } from "lucide-react";

interface Crit { label: string; ok: boolean; }

export default function BetaReadinessCard() {
  const [crits, setCrits] = useState<Crit[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => { (async () => {
    try {
      const [tRep, tApr, ivMeds, mods, docsCfg, sigCfg] = await Promise.all([
        supabase.from("testes_clinicos").select("*", { count: "exact", head: true }).eq("status", "reprovado"),
        supabase.from("testes_clinicos").select("*", { count: "exact", head: true }).eq("status", "aprovado"),
        supabase.from("iv_medications").select("*", { count: "exact", head: true }),
        supabase.from("kits_rapidos").select("*", { count: "exact", head: true }),
        supabase.from("documentos_settings").select("*").limit(1).maybeSingle(),
        supabase.from("assinatura_digital_config").select("*").limit(1).maybeSingle(),
      ]);
      const firstError = [tRep, tApr, ivMeds, mods, docsCfg, sigCfg].find((r) => r.error)?.error;
      if (firstError) {
        console.error("[BetaReadinessCard] falha ao carregar indicadores:", firstError);
        toast.error("Não foi possível carregar a prontidão para beta.");
        setFailed(true);
        return;
      }
      setCrits([
        { label: "Nenhum teste clínico reprovado", ok: (tRep.count ?? 0) === 0 },
        { label: "Pelo menos 5 testes aprovados", ok: (tApr.count ?? 0) >= 5 },
        { label: "Medicamentos IV cadastrados (≥10)", ok: (ivMeds.count ?? 0) >= 10 },
        { label: "Modelos rápidos cadastrados", ok: (mods.count ?? 0) >= 1 },
        { label: "Configuração de documentos pronta", ok: !!docsCfg.data },
        { label: "Assinatura digital configurável", ok: !!sigCfg.data },
      ]);
    } finally {
      setLoading(false);
    }
  })(); }, []);

  if (loading) return null;
  if (failed) return null;

  const okCount = crits.filter((c) => c.ok).length;
  const total = crits.length;
  const ratio = okCount / total;
  const status =
    ratio >= 1 ? { label: "Pronto para beta", tone: "bg-primary/10 text-primary" } :
    ratio >= 0.7 ? { label: "Quase pronto", tone: "bg-secondary text-secondary-foreground" } :
    { label: "Não pronto", tone: "bg-destructive/10 text-destructive" };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Prontidão para Beta</CardTitle>
          <Badge variant="outline" className={status.tone}>{status.label} ({okCount}/{total})</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {crits.map((c, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {c.ok ? <CheckCircle2 className="h-4 w-4 text-primary" /> :
              ratio === 0 ? <Circle className="h-4 w-4 text-muted-foreground" /> :
              <AlertCircle className="h-4 w-4 text-destructive" />}
            <span className={c.ok ? "" : "text-muted-foreground"}>{c.label}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
