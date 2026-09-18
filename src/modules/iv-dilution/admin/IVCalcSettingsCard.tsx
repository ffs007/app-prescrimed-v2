import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useIVCalcSettings } from "../hooks/useIVCalcSettings";
import type { IVCalcSettings } from "../lib/ivCalc";

export default function IVCalcSettingsCard({ canEdit }: { canEdit: boolean }) {
  const { settings, save, loading } = useIVCalcSettings();
  const [draft, setDraft] = useState<IVCalcSettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(settings); }, [settings]);

  const onSave = async () => {
    setSaving(true);
    const { error } = await save(draft);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Configurações atualizadas");
  };

  const items: { key: keyof IVCalcSettings; label: string; desc: string }[] = [
    { key: "bloquear_concentracao_2x", label: "Bloquear concentração > 2× máxima (alto risco)", desc: "Impede finalização quando a concentração calculada ultrapassa o dobro da máxima cadastrada em medicamento de alto risco." },
    { key: "exigir_just_velocidade", label: "Exigir justificativa para velocidade acima da máxima", desc: "Em medicamentos de alto risco, exige texto justificando o desvio." },
    { key: "exigir_just_tempo", label: "Exigir justificativa para tempo abaixo do mínimo", desc: "Aplica-se quando tempo de infusão fica abaixo de 50% do mínimo em alto risco." },
    { key: "permitir_calculo_incompleto", label: "Permitir cálculo incompleto", desc: "Quando ligado, mostra alerta informativo em vez de bloquear." },
    { key: "exigir_peso_vasoativos", label: "Exigir peso para vasoativos", desc: "Pede peso do paciente para fórmula em mcg/kg/min." },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Configurações dos cálculos IV</CardTitle>
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
