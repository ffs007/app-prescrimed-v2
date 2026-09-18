import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useTestesClinicos, type TesteClinico, type TesteStatus } from "./hooks/useTestesClinicos";
import { SEED_CASES } from "./lib/seedCases";
import { toast } from "@/components/ui/use-toast";
import { logBetaEvent } from "../beta/lib/eventLog";
import { Plus, Play, Trash2 } from "lucide-react";

const TONE: Record<TesteStatus, string> = {
  pendente: "bg-muted text-muted-foreground",
  aprovado: "bg-primary/10 text-primary",
  reprovado: "bg-destructive/10 text-destructive",
  precisa_ajuste: "bg-secondary text-secondary-foreground",
  corrigido: "bg-primary/10 text-primary",
};

export default function TestesClinicosPanel() {
  const { items, loading, upsert, remove, setResult } = useTestesClinicos();
  const [openId, setOpenId] = useState<string | null>(null);
  const [obs, setObs] = useState("");

  const seedAll = async () => {
    for (const c of SEED_CASES) {
      const exists = items.find((i) => i.nome_do_teste === c.nome_do_teste);
      if (!exists) await upsert(c as never);
    }
    toast({ title: "Casos iniciais carregados" });
  };

  const markStatus = async (t: TesteClinico, status: TesteStatus) => {
    await setResult(t.id, t.alerta_esperado, status, obs);
    logBetaEvent(status === "aprovado" ? "teste_clinico_aprovado" : "teste_clinico_reprovado", { id: t.id, nome: t.nome_do_teste });
    setOpenId(null);
    setObs("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Testes Clínicos</h2>
          <p className="text-xs text-muted-foreground">Casos simulados para validar segurança antes do beta.</p>
        </div>
        <Button size="sm" onClick={seedAll} variant="outline">
          <Plus className="h-4 w-4 mr-1" /> Carregar casos iniciais
        </Button>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Carregando…</div>}
      {!loading && items.length === 0 && (
        <Card><CardContent className="p-6 text-sm text-muted-foreground text-center">
          Nenhum caso cadastrado. Clique em <b>Carregar casos iniciais</b> para semear os 15 casos do brief.
        </CardContent></Card>
      )}

      <div className="grid gap-3">
        {items.map((t) => {
          const esp = t.alerta_esperado as { descricao?: string; severidade?: string };
          return (
            <Card key={t.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm">{t.nome_do_teste}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={TONE[t.status]}>{t.status.replace(/_/g, " ")}</Badge>
                    <Button size="icon" variant="ghost" onClick={() => remove(t.id)} className="h-7 w-7">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                {t.descricao && <p className="text-muted-foreground">{t.descricao}</p>}
                <p><b>Esperado:</b> {esp?.descricao} {esp?.severidade && <Badge variant="outline" className="ml-1">{esp.severidade}</Badge>}</p>
                {openId === t.id ? (
                  <div className="space-y-2 pt-2 border-t">
                    <Textarea placeholder="Observação (o que foi visto na prática)" value={obs} onChange={(e) => setObs(e.target.value)} className="text-xs" rows={2} />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => markStatus(t, "aprovado")}>Aprovar</Button>
                      <Button size="sm" variant="secondary" onClick={() => markStatus(t, "precisa_ajuste")}>Precisa ajuste</Button>
                      <Button size="sm" variant="destructive" onClick={() => markStatus(t, "reprovado")}>Reprovar</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setOpenId(null); setObs(""); }}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => { setOpenId(t.id); setObs(t.observacoes ?? ""); }}>
                    <Play className="h-3.5 w-3.5 mr-1" /> Executar / marcar
                  </Button>
                )}
                {t.observacoes && openId !== t.id && (
                  <p className="text-muted-foreground italic">Obs: {t.observacoes}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
