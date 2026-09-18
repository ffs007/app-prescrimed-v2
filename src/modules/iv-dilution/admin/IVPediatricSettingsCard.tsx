import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePediatricSettings } from "../hooks/usePediatricSettings";
import type { PedSettings } from "../lib/pediatricCalc";

export default function IVPediatricSettingsCard({ canEdit }: { canEdit: boolean }) {
  const { settings, save, loading } = usePediatricSettings();
  const [draft, setDraft] = useState<PedSettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(settings); }, [settings]);

  const onSave = async () => {
    setSaving(true);
    const { error } = await save(draft);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Configurações pediátricas atualizadas");
  };

  const items: { key: keyof PedSettings; label: string; desc: string }[] = [
    { key: "exigir_peso_pediatrico", label: "Exigir peso para cálculo pediátrico", desc: "Mostra alerta forte e bloqueia o cálculo se o peso não estiver preenchido." },
    { key: "exigir_just_dose_acima_faixa", label: "Exigir justificativa para dose acima da faixa", desc: "Pede texto justificando dose acima da faixa pediátrica cadastrada." },
    { key: "bloquear_dose_2x_maxima", label: "Bloquear dose > 2× máxima cadastrada", desc: "Impede finalização quando a dose excede o dobro da máxima cadastrada." },
    { key: "alertar_volume_abaixo_05ml", label: "Alertar volume calculado < 0,5 mL", desc: "Mostra alerta médio para volumes muito pequenos." },
    { key: "bloquear_volume_abaixo_01ml", label: "Bloquear volume calculado < 0,1 mL", desc: "Impede finalização quando o volume calculado é menor que 0,1 mL." },
    { key: "mostrar_calc_sempre_menor_18", label: "Mostrar cálculo pediátrico sempre que paciente < 18 anos", desc: "Card aparece automaticamente para menores de 18 anos." },
    { key: "permitir_calc_pediatrico_adulto", label: "Permitir cálculo pediátrico manual em adulto", desc: "Permite ativar manualmente o card pediátrico mesmo em pacientes adultos." },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Configurações dos cálculos pediátricos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando…</p>
        ) : (
          <>
            {items.map((it) => (
              <div key={it.key} className="flex items-start justify-between gap-3 rounded-md border px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{it.label}</p>
                  <p className="text-xs text-muted-foreground">{it.desc}</p>
                </div>
                <Switch
                  checked={draft[it.key]}
                  disabled={!canEdit}
                  onCheckedChange={(v) => setDraft({ ...draft, [it.key]: v })}
                />
              </div>
            ))}
            {canEdit && (
              <div className="flex justify-end">
                <Button onClick={onSave} disabled={saving} size="sm">
                  {saving ? "Salvando…" : "Salvar configurações"}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
