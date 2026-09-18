import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { logIVAction } from "../lib/ivAuditLog";

type Props = { open: boolean; onClose: () => void; onSaved: () => void };

const FIELDS_PT: Record<string, string> = {
  principio_ativo: "Princípio ativo",
  nome_comercial_referencia: "Nome comercial",
  apresentacao: "Apresentação",
  via_administracao: "Via",
  volume_reconstituicao: "Vol. reconstituição",
  diluente_reconstituicao: "Diluente",
  estabilidade_apos_reconstituicao: "Estab. pós-reconst.",
  volume_expansao_pos_reconstituicao: "Vol. expansão",
  solucoes_compativeis: "Soluções compatíveis",
  volume_diluicao: "Vol. diluição",
  estabilidade_apos_diluicao: "Estab. pós-diluição",
  concentracao_maxima: "Concentração máx.",
  tempo_minimo_infusao: "Tempo mín. infusão",
  velocidade_maxima_infusao: "Velocidade máx.",
  ph: "pH",
  observacoes_gerais: "Observações",
  risco_flebite: "Risco de flebite",
  exige_fotoprotecao: "Fotoproteção",
  exige_equipo_fotossensivel: "Equipo fotossensível",
  exige_filtro: "Exige filtro",
  incompatibilidades: "Incompatibilidades",
  nivel_alerta: "Nível de alerta",
  alerta_medico: "Alerta médico",
  alerta_enfermagem_farmacia: "Alerta enfermagem/farmácia",
  fonte_referencia: "Fonte",
};

export default function IVAIExtractDialog({ open, onClose, onSaved }: Props) {
  const [text, setText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [campos, setCampos] = useState<Record<string, any> | null>(null);
  const [baixaConf, setBaixaConf] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const reset = () => { setText(""); setCampos(null); setBaixaConf([]); };
  const close = () => { reset(); onClose(); };

  const extract = async () => {
    if (text.trim().length < 10) { toast.error("Cole um texto com mais conteúdo."); return; }
    setExtracting(true);
    const { data, error } = await supabase.functions.invoke("iv-extract", { body: { texto: text } });
    setExtracting(false);
    if (error || (data as any)?.error) {
      toast.error("Falha na extração: " + (error?.message || (data as any)?.error));
      return;
    }
    setCampos((data as any).campos);
    setBaixaConf((data as any).baixa_confianca ?? []);
    toast.success("Dados extraídos. Revise antes de salvar.");
  };

  const save = async (status: "rascunho" | "aguardando_revisao") => {
    if (!campos?.principio_ativo) { toast.error("Princípio ativo ausente."); return; }
    setSaving(true);
    const payload: any = {
      ...campos,
      via_administracao: campos.via_administracao || "IV",
      fonte_referencia: campos.fonte_referencia || "Extraído por IA — fonte original não informada",
      status_revisao: status,
      data_atualizacao: new Date().toISOString().slice(0, 10),
    };
    const { data, error } = await supabase.from("iv_medications").insert(payload).select("id").single();
    setSaving(false);
    if (error) { toast.error("Erro ao salvar: " + error.message); return; }
    await logIVAction({ id_medicamento: (data as any)?.id, principio_ativo: payload.principio_ativo, tipo_acao: "criou" });
    toast.success(status === "rascunho" ? "Salvo como rascunho." : "Enviado para revisão.");
    onSaved();
    close();
  };

  const update = (k: string, v: any) => setCampos((c) => ({ ...(c ?? {}), [k]: v }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Extrair dados com IA
          </DialogTitle>
          <DialogDescription>
            Cole um trecho de referência. A IA preenche os campos como rascunho — sempre revise antes de aprovar.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-2 text-xs flex gap-2 items-start">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          Dados extraídos automaticamente. Revise antes de utilizar em prescrição.
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs">Texto original</Label>
            <Textarea
              rows={16}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='Ex.: "Aciclovir: reconstituir com 10 mL de água destilada. Diluir em SF 0,9% ou SG 5%, volume 100 mL. Concentração máxima 5 mg/mL. Infundir em no mínimo 1 hora."'
            />
            <Button onClick={extract} disabled={extracting} className="w-full">
              {extracting ? "Extraindo…" : <><Sparkles className="h-4 w-4 mr-1" /> Extrair</>}
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Campos extraídos</Label>
            {!campos ? (
              <div className="border rounded-md p-6 text-center text-sm text-muted-foreground">
                Os campos preenchidos aparecerão aqui após a extração.
              </div>
            ) : (
              <div className="space-y-2 border rounded-md p-3 max-h-[60vh] overflow-y-auto">
                {Object.entries(campos).map(([k, v]) => {
                  const low = baixaConf.includes(k);
                  const isArr = Array.isArray(v);
                  const isBool = typeof v === "boolean";
                  return (
                    <div key={k} className={`p-2 rounded ${low ? "bg-amber-500/10 border border-amber-500/30" : "bg-muted/30"}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-medium">{FIELDS_PT[k] ?? k}</span>
                        {low && <Badge variant="outline" className="text-amber-700 border-amber-500/40 text-[10px]">Baixa confiança</Badge>}
                      </div>
                      {isBool ? (
                        <select className="text-xs bg-background border rounded px-2 py-1 w-full" value={String(v)} onChange={(e) => update(k, e.target.value === "true")}>
                          <option value="true">Sim</option>
                          <option value="false">Não</option>
                        </select>
                      ) : isArr ? (
                        <input className="text-xs bg-background border rounded px-2 py-1 w-full" value={(v as string[]).join(", ")} onChange={(e) => update(k, e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
                      ) : (
                        <input className="text-xs bg-background border rounded px-2 py-1 w-full" value={String(v ?? "")} onChange={(e) => update(k, e.target.value)} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close}>Cancelar</Button>
          {campos && (
            <>
              <Button variant="secondary" onClick={() => save("rascunho")} disabled={saving}>Salvar como rascunho</Button>
              <Button onClick={() => save("aguardando_revisao")} disabled={saving}>Enviar para revisão</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
