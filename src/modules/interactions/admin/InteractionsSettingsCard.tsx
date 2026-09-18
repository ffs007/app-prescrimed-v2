import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useInteractionsSettings } from "../hooks/useInteractionsSettings";

const FIELDS: { key: keyof ReturnType<typeof useInteractionsSettings>["settings"]; label: string }[] = [
  { key: "usar_apenas_revisadas", label: "Usar apenas interações revisadas" },
  { key: "exigir_just_interacao_grave", label: "Exigir justificativa para interação grave" },
  { key: "bloquear_contraindicada", label: "Bloquear interação contraindicada" },
  { key: "alertar_duplicidade", label: "Alertar duplicidade terapêutica" },
  { key: "exigir_just_duplicidade_alto_risco", label: "Exigir justificativa para duplicidade de alto risco" },
  { key: "mostrar_risco_acumulado", label: "Mostrar risco acumulado por categoria" },
  { key: "exigir_just_risco_muito_alto", label: "Exigir justificativa para risco acumulado muito alto" },
  { key: "ignorar_alertas_leves_revisao", label: "Ignorar alertas leves na revisão final" },
];

interface Props { canEdit: boolean }

export default function InteractionsSettingsCard({ canEdit }: Props) {
  const { settings, save, loading } = useInteractionsSettings();
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Configurações de Interações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && <p className="text-xs text-muted-foreground">Carregando…</p>}
        {!loading && FIELDS.map((f) => (
          <div key={f.key} className="flex items-center justify-between gap-3 py-1">
            <Label htmlFor={f.key as string} className="text-[13px]">{f.label}</Label>
            <Switch
              id={f.key as string}
              checked={Boolean(settings[f.key])}
              disabled={!canEdit}
              onCheckedChange={(v) => save({ [f.key]: v } as never)}
            />
          </div>
        ))}
        <p className="text-[11px] text-muted-foreground pt-2 border-t">
          Interações e riscos devem ser cadastrados com fonte, data e revisão técnica antes de uso clínico.
        </p>
      </CardContent>
    </Card>
  );
}
