import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import type { IVMedication } from "../IVDilutionAdminPage";

type Props = {
  medication: IVMedication;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

type EditableArrays = "nomes_comerciais" | "nomes_alternativos" | "sinonimos" | "termos_busca";

const LABELS: Record<EditableArrays, string> = {
  nomes_comerciais: "Nomes comerciais",
  nomes_alternativos: "Nomes alternativos",
  sinonimos: "Sinônimos",
  termos_busca: "Termos de busca",
};

export default function IVSynonymsEditor({ medication, open, onClose, onSaved }: Props) {
  const m = medication as any;
  const [draft, setDraft] = useState({
    nomes_comerciais: (m.nomes_comerciais ?? []) as string[],
    nomes_alternativos: (m.nomes_alternativos ?? []) as string[],
    sinonimos: (m.sinonimos ?? []) as string[],
    termos_busca: (m.termos_busca ?? []) as string[],
    grupo_medicamento: m.grupo_medicamento ?? "",
    codigo_interno_medicamento: m.codigo_interno_medicamento ?? "",
    forma_farmaceutica: m.forma_farmaceutica ?? "",
    concentracao_apresentacao: m.concentracao_apresentacao ?? "",
    ativo_para_correspondencia: m.ativo_para_correspondencia ?? true,
  });
  const [inputs, setInputs] = useState<Record<EditableArrays, string>>({
    nomes_comerciais: "", nomes_alternativos: "", sinonimos: "", termos_busca: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({
      nomes_comerciais: (m.nomes_comerciais ?? []),
      nomes_alternativos: (m.nomes_alternativos ?? []),
      sinonimos: (m.sinonimos ?? []),
      termos_busca: (m.termos_busca ?? []),
      grupo_medicamento: m.grupo_medicamento ?? "",
      codigo_interno_medicamento: m.codigo_interno_medicamento ?? "",
      forma_farmaceutica: m.forma_farmaceutica ?? "",
      concentracao_apresentacao: m.concentracao_apresentacao ?? "",
      ativo_para_correspondencia: m.ativo_para_correspondencia ?? true,
    });
  }, [medication.id]);

  const addTerm = (key: EditableArrays) => {
    const v = inputs[key].trim();
    if (!v) return;
    if (draft[key].includes(v)) return;
    setDraft((d) => ({ ...d, [key]: [...d[key], v] }));
    setInputs((i) => ({ ...i, [key]: "" }));
  };
  const removeTerm = (key: EditableArrays, term: string) => {
    setDraft((d) => ({ ...d, [key]: d[key].filter((t) => t !== term) }));
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("iv_medications")
      .update(draft as any)
      .eq("id", medication.id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Sinônimos atualizados");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sinônimos e nomes — {medication.principio_ativo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {(Object.keys(LABELS) as EditableArrays[]).map((key) => (
            <div key={key}>
              <Label className="text-xs">{LABELS[key]}</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={inputs[key]}
                  onChange={(e) => setInputs((i) => ({ ...i, [key]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTerm(key); } }}
                  placeholder={`Adicionar ${LABELS[key].toLowerCase()}…`}
                  className="h-8 text-sm"
                />
                <Button type="button" size="sm" variant="outline" onClick={() => addTerm(key)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {draft[key].length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                {draft[key].map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t}
                    <button onClick={() => removeTerm(key, t)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Grupo / classe</Label>
              <Input value={draft.grupo_medicamento}
                onChange={(e) => setDraft({ ...draft, grupo_medicamento: e.target.value })}
                className="h-8 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-xs">Código interno</Label>
              <Input value={draft.codigo_interno_medicamento}
                onChange={(e) => setDraft({ ...draft, codigo_interno_medicamento: e.target.value })}
                className="h-8 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-xs">Forma farmacêutica</Label>
              <Input value={draft.forma_farmaceutica}
                onChange={(e) => setDraft({ ...draft, forma_farmaceutica: e.target.value })}
                className="h-8 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-xs">Concentração / apresentação</Label>
              <Input value={draft.concentracao_apresentacao}
                onChange={(e) => setDraft({ ...draft, concentracao_apresentacao: e.target.value })}
                className="h-8 text-sm mt-1" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <p className="text-sm font-medium">Ativo para correspondência</p>
              <p className="text-xs text-muted-foreground">Se desligado, este medicamento não será sugerido na busca inteligente.</p>
            </div>
            <Switch
              checked={draft.ativo_para_correspondencia}
              onCheckedChange={(v) => setDraft({ ...draft, ativo_para_correspondencia: v })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
