// Etapa 19 — Card de configurações administrativas da Entrada Inteligente.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSmartInputSettings } from "../hooks/useSmartInputSettings";
import type { SmartInputSettings } from "../lib/types";

const toggles: { key: keyof SmartInputSettings; label: string; desc?: string }[] = [
  { key: "usar_texto_livre", label: "Permitir entrada por texto livre" },
  { key: "usar_foto", label: "Permitir entrada por foto/imagem" },
  { key: "usar_arquivo", label: "Permitir entrada por arquivo" },
  { key: "exigir_revisao_todos_itens", label: "Sempre exigir revisão antes de aplicar" },
  { key: "permitir_preselecao_alta_confianca", label: "Pré-selecionar itens com alta confiança" },
  { key: "salvar_logs", label: "Salvar logs detalhados de extração" },
  { key: "permitir_aprendizado_termos", label: "Permitir aprendizado de termos" },
  { key: "aprendizado_automatico_sem_revisao", label: "Aprendizado automático sem revisão (não recomendado)" },
];

export default function SmartInputSettingsCard({ canEdit }: { canEdit: boolean }) {
  const { settings, loading, update } = useSmartInputSettings();

  if (loading || !settings) {
    return (
      <Card><CardContent className="p-6 flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </CardContent></Card>
    );
  }

  const apply = async (patch: Partial<SmartInputSettings>) => {
    try { await update(patch); toast.success("Configurações atualizadas"); }
    catch { toast.error("Falha ao atualizar"); }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Configurações — Entrada Inteligente</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {toggles.map((t) => (
          <div key={t.key} className="flex items-center justify-between border-b pb-2">
            <Label htmlFor={t.key} className="text-sm">{t.label}</Label>
            <Switch
              id={t.key}
              checked={Boolean(settings[t.key])}
              disabled={!canEdit}
              onCheckedChange={(v) => apply({ [t.key]: v } as Partial<SmartInputSettings>)}
            />
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1">
            <Label className="text-xs">Confiança mínima para pré-seleção (0-100)</Label>
            <Input
              type="number" min={0} max={100} disabled={!canEdit}
              defaultValue={settings.confianca_min_preselecao}
              onBlur={(e) => apply({ confianca_min_preselecao: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Confiança mínima para sugestão (0-100)</Label>
            <Input
              type="number" min={0} max={100} disabled={!canEdit}
              defaultValue={settings.confianca_min_sugestao}
              onBlur={(e) => apply({ confianca_min_sugestao: Number(e.target.value) })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
