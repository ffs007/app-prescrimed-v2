import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { IVMedication } from "../IVDilutionAdminPage";
import { generateAllTexts } from "../lib/ivTextGenerator";
import { logIVTextChange } from "../lib/ivTextLog";

type Med = IVMedication & {
  alerta_medico?: string | null;
  status_texto?: string | null;
  texto_gerado_automaticamente?: boolean;
};

type Scope =
  | "sem_texto"
  | "desatualizados"
  | "aguardando_revisao"
  | "alerta_alto"
  | "selecionados";

const filterByScope = (items: Med[], scope: Scope): Med[] => {
  switch (scope) {
    case "sem_texto": return items.filter((m) => !m.alerta_medico);
    case "desatualizados": return items.filter((m) => m.texto_gerado_automaticamente && (!m.status_texto || m.status_texto === "aguardando_revisao"));
    case "aguardando_revisao": return items.filter((m) => m.status_texto === "aguardando_revisao");
    case "alerta_alto": return items.filter((m) => m.nivel_alerta === "alto");
    case "selecionados": return items;
  }
};

export default function IVTextsBatchDialog({ open, onClose, items, onDone }: {
  open: boolean; onClose: () => void; items: Med[]; onDone: () => void;
}) {
  const [scope, setScope] = useState<Scope>("sem_texto");
  const candidates = useMemo(() => filterByScope(items, scope), [items, scope]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [running, setRunning] = useState(false);

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const allChecked = candidates.length > 0 && candidates.every((m) => selected[m.id]);
  const toggleAll = () => {
    if (allChecked) setSelected({});
    else setSelected(Object.fromEntries(candidates.map((m) => [m.id, true])));
  };

  const apply = async (mode: "all" | "selected") => {
    const target = mode === "all" ? candidates : candidates.filter((m) => selected[m.id]);
    if (!target.length) { toast.error("Nenhum medicamento selecionado."); return; }
    setRunning(true);
    let ok = 0, fail = 0;
    for (const m of target) {
      const texts = generateAllTexts(m);
      const { error } = await (supabase as any).from("iv_medications").update({
        ...texts,
        texto_gerado_automaticamente: true,
        status_texto: "aguardando_revisao",
        data_geracao_texto: new Date().toISOString(),
      }).eq("id", m.id);
      if (error) { fail++; continue; }
      ok++;
      logIVTextChange({
        id_medicamento: m.id,
        principio_ativo: m.principio_ativo,
        campo_texto_alterado: "lote",
        valor_anterior: m.alerta_medico ?? null,
        valor_novo: texts.alerta_medico,
        tipo_acao: "gerou_texto",
      });
    }
    setRunning(false);
    toast.success(`Textos atualizados: ${ok}${fail ? ` · falhas: ${fail}` : ""}`);
    onDone();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerar textos em lote</DialogTitle>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-3">
          <Select value={scope} onValueChange={(v) => { setScope(v as Scope); setSelected({}); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sem_texto">Sem texto cadastrado</SelectItem>
              <SelectItem value="desatualizados">Texto desatualizado</SelectItem>
              <SelectItem value="aguardando_revisao">Aguardando revisão</SelectItem>
              <SelectItem value="alerta_alto">Apenas alerta alto</SelectItem>
              <SelectItem value="selecionados">Selecionar manualmente</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground self-center">
            {candidates.length} medicamentos no escopo. Os textos atuais serão substituídos.
          </p>
        </div>

        <div className="border rounded-md max-h-[340px] overflow-y-auto mt-3">
          <div className="flex items-center gap-2 p-2 border-b bg-muted/40 text-xs font-medium sticky top-0">
            <Checkbox checked={allChecked} onCheckedChange={toggleAll} /> Selecionar todos
          </div>
          {candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum medicamento neste escopo.</p>
          ) : candidates.map((m) => (
            <div key={m.id} className="flex items-start gap-2 p-2 border-b last:border-b-0 text-sm">
              <Checkbox checked={!!selected[m.id]} onCheckedChange={() => toggle(m.id)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{m.principio_ativo}</span>
                  <Badge variant="outline" className="text-[10px]">{m.nivel_alerta}</Badge>
                  {m.status_texto && <Badge variant="outline" className="text-[10px]">{m.status_texto}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  Atual: {m.alerta_medico ?? "—"}
                </p>
                <p className="text-xs">
                  Novo: {generateAllTexts(m).alerta_medico}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground pt-2">
          Após gerar, os textos entrarão como <em>aguardando revisão</em>. Revise antes de uso clínico.
        </p>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="outline" disabled={running} onClick={() => apply("selected")}>Aplicar selecionados</Button>
          <Button disabled={running} onClick={() => apply("all")}>Aplicar todos do escopo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
