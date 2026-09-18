import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRenalHepaticSettings } from "../hooks/useRenalHepaticSettings";
import type { RHSettings } from "../lib/renalHepaticCalc";

export default function IVRenalHepaticSettingsCard({ canEdit }: { canEdit: boolean }) {
  const { settings, save, loading } = useRenalHepaticSettings();
  const [draft, setDraft] = useState<RHSettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(settings); }, [settings]);

  const onSave = async () => {
    setSaving(true);
    const { error } = await save(draft);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Configurações renal/hepático atualizadas");
  };

  const items: { key: keyof RHSettings; label: string; desc: string }[] = [
    { key: "exigir_just_clcr_lt30_ajuste_renal", label: "Exigir justificativa se ClCr < 30 e medicamento exige ajuste renal", desc: "Pede justificativa quando há disfunção renal importante." },
    { key: "exigir_just_nefrotoxico_clcr_lt30", label: "Exigir justificativa se medicamento nefrotóxico e ClCr < 30", desc: "Pede justificativa em medicamentos nefrotóxicos com função renal reduzida." },
    { key: "exigir_funcao_renal_alerta_alto", label: "Exigir função renal para medicamentos de alerta alto", desc: "Solicita justificativa se função renal estiver ausente em alto risco." },
    { key: "alertar_creatinina_desatualizada", label: "Alertar se creatinina estiver desatualizada", desc: "Internado: > 7 dias. Ambulatorial: > 30 dias." },
    { key: "bloquear_contraind_renal_grave", label: "Bloquear contraindicado renal grave em ClCr < 15/diálise", desc: "Quando desligado, apenas exige justificativa." },
    { key: "bloquear_contraind_hepatico_grave", label: "Bloquear contraindicado hepático grave em Child-Pugh C", desc: "Quando desligado, apenas exige justificativa." },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Configurações de ajuste renal/hepático</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando…</p>
        ) : (
          <>
            <div className="rounded-md border px-3 py-2 space-y-1">
              <Label className="text-sm font-medium">Método renal padrão</Label>
              <Select value={draft.metodo_renal_padrao} onValueChange={(v) => setDraft({ ...draft, metodo_renal_padrao: v as any })} disabled={!canEdit}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cockcroft_gault">Cockcroft-Gault</SelectItem>
                  <SelectItem value="etfg_informada">eTFG informada</SelectItem>
                  <SelectItem value="perguntar">Perguntar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {items.map((it) => (
              <div key={it.key} className="flex items-start justify-between gap-3 rounded-md border px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{it.label}</p>
                  <p className="text-xs text-muted-foreground">{it.desc}</p>
                </div>
                <Switch
                  checked={draft[it.key] as boolean}
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
