import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBaseMedChecklist } from "../hooks/useBaseMedChecklist";

const STATUS = [
  { value: "pendente", label: "Pendente" },
  { value: "em_andamento", label: "Em cadastro" },
  { value: "concluido", label: "Pronto beta" },
  { value: "nao_aplicavel", label: "N/A" },
];

const variant = (s: string) =>
  s === "concluido" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
  : s === "em_andamento" ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
  : s === "nao_aplicavel" ? "bg-muted text-muted-foreground"
  : "bg-destructive/10 text-destructive border-destructive/30";

export default function ChecklistBaseMedTab() {
  const { items, loading, updateStatus } = useBaseMedChecklist();
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Checklist — Base Medicamentosa Beta</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between gap-3 border rounded p-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{it.label}</p>
            </div>
            <Badge variant="outline" className={variant(it.status)}>
              {STATUS.find((s) => s.value === it.status)?.label ?? it.status}
            </Badge>
            <Select value={it.status} onValueChange={(v) => updateStatus(it.id, v)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
