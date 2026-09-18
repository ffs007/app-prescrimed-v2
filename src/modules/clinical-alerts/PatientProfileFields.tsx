import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PatientProfile } from "./lib/clinicalAlertsCalc";

interface Props { profile: PatientProfile; onSave: (p: PatientProfile) => void }

const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function PatientProfileFields({ profile, onSave }: Props) {
  const [p, setP] = useState<PatientProfile>(profile);
  const set = <K extends keyof PatientProfile>(k: K, v: PatientProfile[K]) => setP((prev) => ({ ...prev, [k]: v }));

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm">Perfil clínico do paciente</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Idade (anos)</Label><Input type="number" value={p.idade_anos ?? ""} onChange={(e) => set("idade_anos", e.target.value ? Number(e.target.value) : null)} /></div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm"><Switch checked={p.gestante} onCheckedChange={(v) => set("gestante", v)} /> Gestante</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={p.lactante} onCheckedChange={(v) => set("lactante", v)} /> Lactante</label>
          </div>
        </div>
        <div>
          <Label>Alergias (princípios ativos, separados por vírgula)</Label>
          <Input
            value={p.alergias_medicamentosas.map((a) => a.principio_ativo).filter(Boolean).join(", ")}
            onChange={(e) => set("alergias_medicamentosas", csv(e.target.value).map((pa) => ({ principio_ativo: pa, tipo_registro: "alergia_confirmada", gravidade: "desconhecida" })))}
          />
        </div>
        <div>
          <Label>Alergias por classe</Label>
          <Input value={p.alergias_classes_medicamentosas.join(", ")} onChange={(e) => set("alergias_classes_medicamentosas", csv(e.target.value))} />
        </div>
        <div>
          <Label>Comorbidades</Label>
          <Input value={p.comorbidades.join(", ")} onChange={(e) => set("comorbidades", csv(e.target.value))} />
        </div>
        <div>
          <Label>CIDs</Label>
          <Input value={p.diagnosticos_cid.join(", ")} onChange={(e) => set("diagnosticos_cid", csv(e.target.value))} />
        </div>
        <div>
          <Label>Observações clínicas</Label>
          <Textarea rows={2} maxLength={2000} value={p.observacoes_clinicas_paciente || ""} onChange={(e) => set("observacoes_clinicas_paciente", e.target.value)} />
        </div>
        <Button size="sm" onClick={() => onSave(p)}>Salvar perfil</Button>
      </CardContent>
    </Card>
  );
}
