import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useClinicalAlertsSettings } from "../hooks/useClinicalAlertsSettings";
import type { ClinicalSettings } from "../lib/clinicalAlertsCalc";

const FIELDS: { key: keyof ClinicalSettings; label: string }[] = [
  { key: "usar_apenas_revisadas", label: "Usar apenas contraindicações revisadas" },
  { key: "bloquear_alergia_grave_pa", label: "Bloquear alergia confirmada grave ao princípio ativo" },
  { key: "exigir_just_alergia_suspeita", label: "Exigir justificativa para alergia suspeita" },
  { key: "diferenciar_intolerancia_alergia", label: "Diferenciar intolerância de alergia" },
  { key: "exigir_just_gestacao", label: "Exigir justificativa em medicamento contraindicado na gestação" },
  { key: "exigir_just_lactacao", label: "Exigir justificativa em medicamento contraindicado na lactação" },
  { key: "exigir_just_comorbidade_grave", label: "Exigir justificativa para contraindicação grave por comorbidade" },
  { key: "ocultar_sem_fonte_uso_clinico", label: "Mostrar alertas sem fonte apenas na área administrativa" },
  { key: "permitir_restricoes_paciente", label: "Permitir restrições específicas por paciente" },
];

interface Props { canEdit: boolean }

export default function ClinicalAlertsSettingsCard({ canEdit }: Props) {
  const { settings, save, loading } = useClinicalAlertsSettings();
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm">Configurações de Alergias e Contraindicações</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {loading && <p className="text-xs text-muted-foreground">Carregando…</p>}
        {!loading && FIELDS.map((f) => (
          <div key={f.key} className="flex items-center justify-between gap-3 py-1">
            <Label htmlFor={f.key} className="text-[13px]">{f.label}</Label>
            <Switch
              id={f.key}
              checked={Boolean(settings[f.key])}
              disabled={!canEdit}
              onCheckedChange={(v) => save({ [f.key]: v } as Partial<ClinicalSettings>)}
            />
          </div>
        ))}
        <p className="text-[11px] text-muted-foreground pt-2 border-t">
          Contraindicações, alergias cruzadas e alertas por condição clínica devem ter fonte, data e revisão técnica antes de uso clínico.
        </p>
      </CardContent>
    </Card>
  );
}
