import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useBetaSettings, type BetaSettings } from "../hooks/useBetaSettings";

const TOGGLES: Array<{ key: keyof BetaSettings; label: string; help?: string }> = [
  { key: "modo_beta_ativo", label: "Modo beta ativo", help: "Mostra badge Beta no app" },
  { key: "entrada_voz", label: "Entrada por voz" },
  { key: "link_paciente", label: "Link para paciente" },
  { key: "assinatura_digital", label: "Assinatura digital" },
  { key: "seguranca_iv", label: "Segurança IV" },
  { key: "calculo_pediatrico", label: "Cálculo pediátrico" },
  { key: "ajuste_renal", label: "Ajuste renal" },
  { key: "interacoes", label: "Interações" },
  { key: "modelos_rapidos", label: "Modelos rápidos" },
  { key: "protocolos", label: "Protocolos clínicos (em breve)" },
];

export default function ConfiguracoesBetaTab() {
  const { settings, loading, update } = useBetaSettings();
  if (loading || !settings) return <div className="text-sm text-muted-foreground p-4">Carregando…</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações Beta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {TOGGLES.map((t) => (
          <div key={t.key} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
            <div>
              <Label className="text-sm font-medium">{t.label}</Label>
              {t.help && <p className="text-xs text-muted-foreground">{t.help}</p>}
            </div>
            <Switch
              checked={Boolean(settings[t.key])}
              onCheckedChange={(v) => update({ [t.key]: v } as Partial<BetaSettings>)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
