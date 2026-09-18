import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type Status = "pronto" | "em_ajuste" | "pendente" | "desativado_no_beta";
interface Item { id: string; chave: string; label: string; status: Status; observacao: string | null; ordem: number; }

const TONE: Record<Status, string> = {
  pronto: "bg-primary/10 text-primary",
  em_ajuste: "bg-secondary text-secondary-foreground",
  pendente: "bg-muted text-muted-foreground",
  desativado_no_beta: "bg-destructive/10 text-destructive",
};

export default function RevisaoBetaTab() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("beta_modulos_revisao").select("*").order("ordem");
      if (error) {
        console.error("[RevisaoBetaTab] falha ao carregar módulos:", error);
        toast.error("Não foi possível carregar a revisão de módulos.");
        return;
      }
      setItems((data ?? []) as Item[]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: Partial<Item>) => {
    const { error } = await supabase.from("beta_modulos_revisao").update(patch).eq("id", id);
    if (error) {
      console.error("[RevisaoBetaTab] falha ao atualizar item:", error);
      toast.error("Não foi possível salvar a alteração.");
      return;
    }
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revisão para Beta — Módulos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && <div className="text-sm text-muted-foreground py-4 text-center">Carregando módulos...</div>}
        {!loading && items.length === 0 && (
          <div className="text-sm text-muted-foreground py-4 text-center">Nenhum módulo encontrado.</div>
        )}
        {!loading && items.map((it) => (
          <div key={it.id} className="flex flex-col md:flex-row md:items-center gap-2 py-2 border-b last:border-0">
            <div className="flex-1">
              <div className="text-sm font-medium">{it.label}</div>
              <Input
                placeholder="Observação"
                defaultValue={it.observacao ?? ""}
                onBlur={(e) => e.target.value !== (it.observacao ?? "") && update(it.id, { observacao: e.target.value })}
                className="h-8 mt-1 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={TONE[it.status]}>{it.status.replace(/_/g, " ")}</Badge>
              <Select value={it.status} onValueChange={(v) => update(it.id, { status: v as Status })}>
                <SelectTrigger className="w-44 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pronto">Pronto</SelectItem>
                  <SelectItem value="em_ajuste">Em ajuste</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="desativado_no_beta">Desativado no beta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
