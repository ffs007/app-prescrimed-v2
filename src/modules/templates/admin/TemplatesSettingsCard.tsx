// Etapa 17 — Configurações administrativas de Modelos/Kits/Favoritos.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTemplatesSettings } from "../hooks/useTemplatesSettings";

interface Props { canEdit: boolean }

const ROWS: Array<{ key: keyof NonNullable<ReturnType<typeof useTemplatesSettings>["settings"]>; label: string; }> = [
  { key: "permitir_modelos_pessoais", label: "Permitir modelos pessoais" },
  { key: "permitir_modelos_institucionais", label: "Permitir modelos institucionais" },
  { key: "exigir_revisao_modelos_institucionais", label: "Exigir revisão para modelos institucionais" },
  { key: "cruzar_seguranca_antes_aplicar", label: "Cruzar com módulos de segurança antes de aplicar" },
  { key: "exigir_just_alerta_alto", label: "Exigir justificativa para item com alerta alto" },
  { key: "bloquear_alerta_critico", label: "Bloquear item com alerta crítico" },
  { key: "permitir_salvar_prescricao_como_modelo", label: "Permitir salvar prescrição como modelo" },
  { key: "remover_dados_paciente_auto", label: "Remover dados do paciente automaticamente ao salvar modelo" },
  { key: "alertar_modelo_sem_revisao_12m", label: "Alertar modelo institucional sem revisão há 12 meses" },
];

export default function TemplatesSettingsCard({ canEdit }: Props) {
  const { settings, update } = useTemplatesSettings();
  if (!settings) return null;
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Configurações — Modelos, Kits e Favoritos</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {ROWS.map((r) => (
          <div key={String(r.key)} className="flex items-center justify-between gap-3">
            <Label htmlFor={String(r.key)} className="text-sm">{r.label}</Label>
            <Switch
              id={String(r.key)}
              checked={Boolean((settings as any)[r.key])}
              disabled={!canEdit}
              onCheckedChange={(v) => update({ [r.key]: v } as any)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
