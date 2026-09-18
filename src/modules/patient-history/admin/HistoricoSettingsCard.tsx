// Etapa 18 — Card de configurações do módulo Histórico.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useHistoricoSettings } from "../hooks/usePatientHistory";

const TOGGLES: { key: keyof NonNullable<ReturnType<typeof useHistoricoSettings>["settings"]>; label: string }[] = [
  { key: "permitir_reaproveitar", label: "Permitir reaproveitar prescrições anteriores" },
  { key: "exigir_revisao_antes_reaproveitar", label: "Sempre exigir revisão antes de reaproveitar" },
  { key: "permitir_repetir_medicamento_isolado", label: "Permitir repetir medicamento isolado" },
  { key: "cruzar_com_seguranca_atual", label: "Cruzar histórico com módulos de segurança atuais" },
  { key: "bloquear_item_alerta_critico", label: "Bloquear reaproveitamento de item com alerta crítico" },
  { key: "exigir_just_dados_mudaram", label: "Exigir justificativa se dados atuais mudaram muito" },
  { key: "mostrar_medicamentos_recorrentes", label: "Mostrar medicamentos recorrentes" },
  { key: "permitir_uso_continuo", label: "Permitir medicações de uso contínuo" },
  { key: "registrar_logs", label: "Registrar logs de reaproveitamento" },
];

export default function HistoricoSettingsCard() {
  const { settings, loading, update } = useHistoricoSettings();
  if (loading || !settings) {
    return <div className="text-xs text-muted-foreground p-4">Carregando…</div>;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Configurações de histórico e reaproveitamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {TOGGLES.map((t) => (
          <div key={t.key as string} className="flex items-center justify-between gap-3">
            <Label className="text-xs">{t.label}</Label>
            <Switch
              checked={Boolean((settings as Record<string, unknown>)[t.key as string])}
              onCheckedChange={(v) => update({ [t.key]: v } as never)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
