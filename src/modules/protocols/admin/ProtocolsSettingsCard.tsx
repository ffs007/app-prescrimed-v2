import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useProtocolsSettings } from "../hooks/useProtocolsSettings";

interface Props { canEdit: boolean }

const ROWS: { key: keyof ReturnType<typeof useProtocolsSettings>["settings"]; label: string }[] = [
  { key: "usar_apenas_revisados", label: "Usar apenas protocolos revisados" },
  { key: "mostrar_rascunho_admin", label: "Mostrar protocolos em rascunho para administradores" },
  { key: "permitir_montar_plano", label: "Permitir montar plano sugerido" },
  { key: "exigir_revisao_med_sugerido", label: "Exigir revisão antes de adicionar medicamentos sugeridos" },
  { key: "cruzar_seguranca_med_sugerido", label: "Cruzar medicamentos sugeridos com alergias/interações/renal/pediátrico" },
  { key: "mostrar_gravidade_topo", label: "Mostrar sinais de gravidade no topo do protocolo" },
  { key: "alertar_sem_revisao_12m", label: "Alertar protocolo sem revisão há 12 meses" },
  { key: "permitir_favoritos", label: "Permitir favoritos por usuário" },
];

export default function ProtocolsSettingsCard({ canEdit }: Props) {
  const { settings, update } = useProtocolsSettings();
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm">Governança de Protocolos</CardTitle></CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {ROWS.map((r) => (
          <label key={r.key as string} className="flex items-center justify-between gap-3 border rounded-md p-2">
            <Label className="text-xs cursor-pointer">{r.label}</Label>
            <Switch checked={!!settings[r.key]} disabled={!canEdit} onCheckedChange={(v) => update({ [r.key]: v } as any)} />
          </label>
        ))}
      </CardContent>
    </Card>
  );
}
