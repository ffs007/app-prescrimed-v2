import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const TIPOS = ["queixa","sindrome","cid","diagnostico","emergencia","ambulatorial","hospitalar","pediatrico","obstetrico","outro"];
const CONTEXTOS = ["urgencia","enfermaria","ambulatorio","pronto_atendimento","telemedicina","hospitalar","pediatria","obstetricia","geral"];
const STATUS = ["rascunho","aguardando_revisao","revisado","precisa_corrigir","inativo"];
const PRIO = ["imediata","alta","moderada","baixa"];
const RECOM = ["forte","moderada","condicional","baixa"];
const CAT_EXAME = ["laboratorio","imagem","ecg","microbiologia","procedimento","outro"];

interface Props {
  open: boolean;
  initial?: Record<string, unknown> | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ProtocolFormDialog({ open, initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Record<string, unknown>>(initial || {
    tipo_protocolo: "queixa", contexto_atendimento: "geral", status_revisao: "aguardando_revisao",
    versao_protocolo: 1, queixas_relacionadas: [], sindromes_relacionadas: [], cids_relacionados: [],
    palavras_chave: [], diagnosticos_diferenciais: [], alertas_seguranca: [], contraindicacoes_relevantes: [],
    sinais_gravidade: [], condutas_iniciais: [], exames_sugeridos: [], medicamentos_sugeridos: [],
    medidas_nao_farmacologicas: [], cuidados_enfermagem: [], criterios_encaminhamento: [],
    criterios_internacao: [], sinais_retorno_imediato: [],
  });
  useEffect(() => { if (initial) setForm(initial); }, [initial]);
  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));
  const list = (k: string) => (form[k] as unknown[]) || [];
  const setList = (k: string, arr: unknown[]) => set(k, arr);
  const addItem = (k: string, item: unknown) => setList(k, [...list(k), item]);
  const updItem = (k: string, i: number, item: unknown) => setList(k, list(k).map((x, j) => j === i ? item : x));
  const delItem = (k: string, i: number) => setList(k, list(k).filter((_, j) => j !== i));

  const csv = (arr: string[] = []) => arr.join(", ");
  const toArr = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  async function save() {
    const f = form as Record<string, any>;
    if (!f.nome_protocolo) { toast.error("Nome do protocolo é obrigatório"); return; }
    if (f.status_revisao === "revisado" && !f.fonte_referencia) {
      toast.error("Protocolo revisado exige fonte de referência"); return;
    }
    const { data: u } = await supabase.auth.getUser();
    const { id, ...rest } = f as { id?: string };
    const payload: Record<string, any> = { ...rest, atualizado_por: u?.user?.id };
    if (!id) payload.criado_por = u?.user?.id;
    if (f.status_revisao === "revisado") {
      payload.revisado_por = u?.user?.id;
      payload.revisado_em = new Date().toISOString();
    }
    const { error } = id
      ? await (supabase.from("base_protocolos_clinicos") as any).update(payload).eq("id", id)
      : await (supabase.from("base_protocolos_clinicos") as any).insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Protocolo salvo");
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{(form as { id?: string }).id ? "Editar protocolo" : "Novo protocolo"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="id">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="id">Identificação</TabsTrigger>
            <TabsTrigger value="queixas">Queixas/CID</TabsTrigger>
            <TabsTrigger value="gravidade">Gravidade</TabsTrigger>
            <TabsTrigger value="condutas">Condutas</TabsTrigger>
            <TabsTrigger value="exames">Exames</TabsTrigger>
            <TabsTrigger value="meds">Medicamentos</TabsTrigger>
            <TabsTrigger value="cuid">Cuidados</TabsTrigger>
            <TabsTrigger value="orient">Orientações</TabsTrigger>
            <TabsTrigger value="enc">Encaminh.</TabsTrigger>
            <TabsTrigger value="fonte">Fontes</TabsTrigger>
          </TabsList>

          <TabsContent value="id" className="space-y-2 pt-3">
            <div><Label>Nome do protocolo</Label><Input value={(form.nome_protocolo as string) || ""} onChange={(e) => set("nome_protocolo", e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>Tipo</Label>
                <Select value={form.tipo_protocolo as string} onValueChange={(v) => set("tipo_protocolo", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Contexto</Label>
                <Select value={form.contexto_atendimento as string} onValueChange={(v) => set("contexto_atendimento", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTEXTOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Área clínica</Label><Input value={(form.area_clinica as string) || ""} onChange={(e) => set("area_clinica", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>População-alvo</Label><Input value={(form.populacao_alvo as string) || ""} onChange={(e) => set("populacao_alvo", e.target.value)} /></div>
              <div><Label>Idade mín.</Label><Input type="number" value={(form.faixa_etaria_min as number | string) ?? ""} onChange={(e) => set("faixa_etaria_min", e.target.value ? Number(e.target.value) : null)} /></div>
              <div><Label>Idade máx.</Label><Input type="number" value={(form.faixa_etaria_max as number | string) ?? ""} onChange={(e) => set("faixa_etaria_max", e.target.value ? Number(e.target.value) : null)} /></div>
            </div>
          </TabsContent>

          <TabsContent value="queixas" className="space-y-2 pt-3">
            <div><Label>Queixas (separadas por vírgula)</Label><Input value={csv(form.queixas_relacionadas as string[])} onChange={(e) => set("queixas_relacionadas", toArr(e.target.value))} /></div>
            <div><Label>Síndromes</Label><Input value={csv(form.sindromes_relacionadas as string[])} onChange={(e) => set("sindromes_relacionadas", toArr(e.target.value))} /></div>
            <div><Label>CIDs relacionados</Label><Input value={csv(form.cids_relacionados as string[])} onChange={(e) => set("cids_relacionados", toArr(e.target.value))} /></div>
            <div><Label>Palavras-chave</Label><Input value={csv(form.palavras_chave as string[])} onChange={(e) => set("palavras_chave", toArr(e.target.value))} /></div>
            <div><Label>Diagnósticos diferenciais</Label><Input value={csv(form.diagnosticos_diferenciais as string[])} onChange={(e) => set("diagnosticos_diferenciais", toArr(e.target.value))} /></div>
            <div><Label>Alertas de segurança</Label><Input value={csv(form.alertas_seguranca as string[])} onChange={(e) => set("alertas_seguranca", toArr(e.target.value))} /></div>
            <div><Label>Contraindicações relevantes</Label><Input value={csv(form.contraindicacoes_relevantes as string[])} onChange={(e) => set("contraindicacoes_relevantes", toArr(e.target.value))} /></div>
          </TabsContent>

          <TabsContent value="gravidade" className="space-y-2 pt-3">
            <ListEditor list={list("sinais_gravidade") as any[]}
              addLabel="Adicionar sinal"
              onAdd={() => addItem("sinais_gravidade", { titulo: "", descricao: "" })}
              renderItem={(it, i) => (
                <>
                  <Input placeholder="Título" value={it.titulo} onChange={(e) => updItem("sinais_gravidade", i, { ...it, titulo: e.target.value })} />
                  <Input placeholder="Descrição" value={it.descricao || ""} onChange={(e) => updItem("sinais_gravidade", i, { ...it, descricao: e.target.value })} />
                </>
              )}
              onDelete={(i) => delItem("sinais_gravidade", i)}
            />
          </TabsContent>

          <TabsContent value="condutas" className="space-y-2 pt-3">
            <ListEditor list={list("condutas_iniciais") as any[]}
              addLabel="Adicionar conduta"
              onAdd={() => addItem("condutas_iniciais", { titulo: "", descricao: "", prioridade: "moderada", obrigatoria: false })}
              renderItem={(it, i) => (
                <>
                  <Input placeholder="Título" value={it.titulo} onChange={(e) => updItem("condutas_iniciais", i, { ...it, titulo: e.target.value })} />
                  <Textarea rows={1} placeholder="Descrição" value={it.descricao || ""} onChange={(e) => updItem("condutas_iniciais", i, { ...it, descricao: e.target.value })} />
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Select value={it.prioridade || "moderada"} onValueChange={(v) => updItem("condutas_iniciais", i, { ...it, prioridade: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIO.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input placeholder="Fonte" value={it.fonte || ""} onChange={(e) => updItem("condutas_iniciais", i, { ...it, fonte: e.target.value })} />
                    <label className="flex items-center gap-2 text-xs"><Switch checked={!!it.obrigatoria} onCheckedChange={(v) => updItem("condutas_iniciais", i, { ...it, obrigatoria: v })} /> Obrigatória</label>
                  </div>
                </>
              )}
              onDelete={(i) => delItem("condutas_iniciais", i)}
            />
          </TabsContent>

          <TabsContent value="exames" className="space-y-2 pt-3">
            <ListEditor list={list("exames_sugeridos") as any[]}
              addLabel="Adicionar exame"
              onAdd={() => addItem("exames_sugeridos", { nome_exame: "", categoria: "laboratorio", prioridade: "moderada", obrigatorio: false })}
              renderItem={(it, i) => (
                <>
                  <Input placeholder="Nome do exame" value={it.nome_exame} onChange={(e) => updItem("exames_sugeridos", i, { ...it, nome_exame: e.target.value })} />
                  <Input placeholder="Indicação" value={it.indicacao || ""} onChange={(e) => updItem("exames_sugeridos", i, { ...it, indicacao: e.target.value })} />
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Select value={it.categoria || "laboratorio"} onValueChange={(v) => updItem("exames_sugeridos", i, { ...it, categoria: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CAT_EXAME.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={it.prioridade || "moderada"} onValueChange={(v) => updItem("exames_sugeridos", i, { ...it, prioridade: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIO.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                    <label className="flex items-center gap-2 text-xs"><Switch checked={!!it.obrigatorio} onCheckedChange={(v) => updItem("exames_sugeridos", i, { ...it, obrigatorio: v })} /> Obrigatório</label>
                  </div>
                </>
              )}
              onDelete={(i) => delItem("exames_sugeridos", i)}
            />
          </TabsContent>

          <TabsContent value="meds" className="space-y-2 pt-3">
            <ListEditor list={list("medicamentos_sugeridos") as any[]}
              addLabel="Adicionar medicamento"
              onAdd={() => addItem("medicamentos_sugeridos", { principio_ativo: "", nivel_recomendacao: "moderada", status_revisao: "aguardando_revisao" })}
              renderItem={(it, i) => (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Princípio ativo" value={it.principio_ativo} onChange={(e) => updItem("medicamentos_sugeridos", i, { ...it, principio_ativo: e.target.value })} />
                    <Input placeholder="Nome sugestão" value={it.nome_sugestao || ""} onChange={(e) => updItem("medicamentos_sugeridos", i, { ...it, nome_sugestao: e.target.value })} />
                  </div>
                  <Input placeholder="Indicação no protocolo" value={it.indicacao_no_protocolo || ""} onChange={(e) => updItem("medicamentos_sugeridos", i, { ...it, indicacao_no_protocolo: e.target.value })} />
                  <div className="grid grid-cols-5 gap-2">
                    <Input placeholder="Dose" value={it.dose_sugerida || ""} onChange={(e) => updItem("medicamentos_sugeridos", i, { ...it, dose_sugerida: e.target.value })} />
                    <Input placeholder="Unidade" value={it.unidade_dose || ""} onChange={(e) => updItem("medicamentos_sugeridos", i, { ...it, unidade_dose: e.target.value })} />
                    <Input placeholder="Via" value={it.via || ""} onChange={(e) => updItem("medicamentos_sugeridos", i, { ...it, via: e.target.value })} />
                    <Input placeholder="Frequência" value={it.frequencia || ""} onChange={(e) => updItem("medicamentos_sugeridos", i, { ...it, frequencia: e.target.value })} />
                    <Input placeholder="Duração" value={it.duracao || ""} onChange={(e) => updItem("medicamentos_sugeridos", i, { ...it, duracao: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Select value={it.nivel_recomendacao || "moderada"} onValueChange={(v) => updItem("medicamentos_sugeridos", i, { ...it, nivel_recomendacao: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{RECOM.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={it.status_revisao || "aguardando_revisao"} onValueChange={(v) => updItem("medicamentos_sugeridos", i, { ...it, status_revisao: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input placeholder="Fonte" value={it.fonte || ""} onChange={(e) => updItem("medicamentos_sugeridos", i, { ...it, fonte: e.target.value })} />
                  </div>
                </>
              )}
              onDelete={(i) => delItem("medicamentos_sugeridos", i)}
            />
          </TabsContent>

          <TabsContent value="cuid" className="space-y-2 pt-3">
            <ListEditor list={list("cuidados_enfermagem") as any[]}
              addLabel="Adicionar cuidado"
              onAdd={() => addItem("cuidados_enfermagem", { descricao: "", prioridade: "moderada" })}
              renderItem={(it, i) => (
                <>
                  <Input placeholder="Descrição" value={it.descricao} onChange={(e) => updItem("cuidados_enfermagem", i, { ...it, descricao: e.target.value })} />
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="Frequência" value={it.frequencia || ""} onChange={(e) => updItem("cuidados_enfermagem", i, { ...it, frequencia: e.target.value })} />
                    <Input placeholder="Condição de uso" value={it.condicao_uso || ""} onChange={(e) => updItem("cuidados_enfermagem", i, { ...it, condicao_uso: e.target.value })} />
                    <Select value={it.prioridade || "moderada"} onValueChange={(v) => updItem("cuidados_enfermagem", i, { ...it, prioridade: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIO.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </>
              )}
              onDelete={(i) => delItem("cuidados_enfermagem", i)}
            />
            <h5 className="text-xs font-semibold pt-2">Medidas não farmacológicas</h5>
            <ListEditor list={list("medidas_nao_farmacologicas") as any[]}
              addLabel="Adicionar medida"
              onAdd={() => addItem("medidas_nao_farmacologicas", { descricao: "" })}
              renderItem={(it, i) => (
                <Input placeholder="Descrição" value={it.descricao} onChange={(e) => updItem("medidas_nao_farmacologicas", i, { ...it, descricao: e.target.value })} />
              )}
              onDelete={(i) => delItem("medidas_nao_farmacologicas", i)}
            />
          </TabsContent>

          <TabsContent value="orient" className="space-y-2 pt-3">
            <Label>Orientações ao paciente</Label>
            <Textarea rows={6} value={(form.orientacoes_paciente as string) || ""} onChange={(e) => set("orientacoes_paciente", e.target.value)} />
            <h5 className="text-xs font-semibold pt-2">Sinais de retorno imediato</h5>
            <ListEditor list={list("sinais_retorno_imediato") as any[]}
              addLabel="Adicionar sinal"
              onAdd={() => addItem("sinais_retorno_imediato", { titulo: "" })}
              renderItem={(it, i) => (
                <Input placeholder="Sinal" value={it.titulo} onChange={(e) => updItem("sinais_retorno_imediato", i, { ...it, titulo: e.target.value })} />
              )}
              onDelete={(i) => delItem("sinais_retorno_imediato", i)}
            />
          </TabsContent>

          <TabsContent value="enc" className="space-y-2 pt-3">
            <h5 className="text-xs font-semibold">Critérios de encaminhamento</h5>
            <ListEditor list={list("criterios_encaminhamento") as any[]}
              addLabel="Adicionar critério"
              onAdd={() => addItem("criterios_encaminhamento", { titulo: "" })}
              renderItem={(it, i) => (
                <Input placeholder="Critério" value={it.titulo} onChange={(e) => updItem("criterios_encaminhamento", i, { ...it, titulo: e.target.value })} />
              )}
              onDelete={(i) => delItem("criterios_encaminhamento", i)}
            />
            <h5 className="text-xs font-semibold pt-2">Critérios de internação</h5>
            <ListEditor list={list("criterios_internacao") as any[]}
              addLabel="Adicionar critério"
              onAdd={() => addItem("criterios_internacao", { titulo: "" })}
              renderItem={(it, i) => (
                <Input placeholder="Critério" value={it.titulo} onChange={(e) => updItem("criterios_internacao", i, { ...it, titulo: e.target.value })} />
              )}
              onDelete={(i) => delItem("criterios_internacao", i)}
            />
          </TabsContent>

          <TabsContent value="fonte" className="space-y-2 pt-3">
            <div><Label>Fonte de referência</Label><Input value={(form.fonte_referencia as string) || ""} onChange={(e) => set("fonte_referencia", e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>Status</Label>
                <Select value={form.status_revisao as string} onValueChange={(v) => set("status_revisao", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Versão</Label><Input type="number" value={(form.versao_protocolo as number | string) ?? 1} onChange={(e) => set("versao_protocolo", Number(e.target.value) || 1)} /></div>
              <div><Label>Motivo da alteração</Label><Input value={(form.motivo_alteracao as string) || ""} onChange={(e) => set("motivo_alteracao", e.target.value)} /></div>
            </div>
            {form.status_revisao !== "revisado" && <Badge variant="outline" className="text-[10px]">Aguardando revisão</Badge>}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ListEditor({ list, addLabel, onAdd, renderItem, onDelete }: {
  list: any[]; addLabel: string;
  onAdd: () => void; onDelete: (i: number) => void;
  renderItem: (it: any, i: number) => React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {list.map((it, i) => (
        <div key={i} className="border rounded-md p-2 space-y-1">
          {renderItem(it, i)}
          <Button size="sm" variant="ghost" onClick={() => onDelete(i)}><Trash2 className="h-3 w-3" /></Button>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={onAdd}><Plus className="h-3 w-3 mr-1" />{addLabel}</Button>
    </div>
  );
}
