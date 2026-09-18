import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import ProntidaoBetaTestesResumo from "@/modules/clinical-tests-v2/ProntidaoBetaTestesResumo";

type Status = "pendente" | "em_teste" | "aprovado" | "precisa_ajuste";
interface Item { id: string; chave: string; label: string; status: Status; observacao: string | null; ordem: number; }

const STATUS_TONE: Record<Status, string> = {
  pendente: "bg-muted text-muted-foreground",
  em_teste: "bg-secondary text-secondary-foreground",
  aprovado: "bg-primary/10 text-primary",
  precisa_ajuste: "bg-destructive/10 text-destructive",
};

export default function ChecklistBetaTab() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("beta_checklist_items").select("*").order("ordem");
      if (error) {
        console.error("[ChecklistBetaTab] falha ao carregar checklist:", error);
        toast.error("Não foi possível carregar o checklist beta.");
        return;
      }
      setItems((data ?? []) as Item[]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: Partial<Item>) => {
    const { error } = await supabase.from("beta_checklist_items").update(patch).eq("id", id);
    if (error) {
      console.error("[ChecklistBetaTab] falha ao atualizar item:", error);
      toast.error("Não foi possível salvar a alteração.");
      return;
    }
    load();
  };

  return (
    <div className="space-y-3">
      <ProntidaoBetaTestesResumo />
      <Card>
      <CardHeader>
        <CardTitle>Checklist Beta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && <div className="text-sm text-muted-foreground py-4 text-center">Carregando checklist...</div>}
        {!loading && items.length === 0 && (
          <div className="text-sm text-muted-foreground py-4 text-center">Nenhum item de checklist encontrado.</div>
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
              <Badge variant="outline" className={STATUS_TONE[it.status]}>{it.status}</Badge>
              <Select value={it.status} onValueChange={(v) => update(it.id, { status: v as Status })}>
                <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_teste">Em teste</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="precisa_ajuste">Precisa ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
    </div>
  );
}
