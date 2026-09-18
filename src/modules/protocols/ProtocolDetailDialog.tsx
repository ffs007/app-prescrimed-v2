import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Plus } from "lucide-react";
import type { Protocolo, ProtocolContext, MedicamentoSugerido } from "./lib/types";
import { qualityBadges } from "./lib/protocolQuality";
import { logProtocolUse } from "./lib/protocolLog";
import ProtocolMedicationItem from "./ProtocolMedicationItem";
import ProtocolPlanReviewDialog from "./ProtocolPlanReviewDialog";
import { useProtocolsSettings } from "./hooks/useProtocolsSettings";

interface Props {
  protocolo: Protocolo;
  open: boolean;
  onClose: () => void;
  patientCtx?: { idade_anos?: number; gestante?: boolean; contexto?: ProtocolContext };
  onAddPrescription?: (m: { principio_ativo: string; dose?: string; via?: string; frequencia?: string; duracao?: string }) => void;
  onAddExams?: (exames: string[]) => void;
  onAddOrientations?: (texto: string) => void;
}

const toneClass = (tone: string) =>
  tone === "success" ? "bg-success/10 text-success border-success/30"
  : tone === "warning" ? "bg-warning/10 text-warning border-warning/30"
  : tone === "destructive" ? "bg-destructive/10 text-destructive border-destructive/30"
  : "bg-muted text-muted-foreground";

export default function ProtocolDetailDialog({ protocolo, open, onClose, patientCtx, onAddPrescription, onAddExams, onAddOrientations }: Props) {
  const { settings } = useProtocolsSettings();
  const [gravity, setGravity] = useState<Record<number, "presente"|"ausente"|"nao_avaliado">>({});
  const [selectedExams, setSelectedExams] = useState<Record<number, boolean>>({});
  const [planOpen, setPlanOpen] = useState(false);

  useEffect(() => {
    logProtocolUse({
      id_protocolo: protocolo.id, nome_protocolo: protocolo.nome_protocolo,
      versao_protocolo: protocolo.versao_protocolo, contexto_atendimento: patientCtx?.contexto,
      acao: "aberto",
    });
  }, [protocolo.id]); // eslint-disable-line

  const hasGravePresent = useMemo(() => Object.values(gravity).includes("presente"), [gravity]);
  const badges = qualityBadges(protocolo);

  function copyExams() {
    const list = (protocolo.exames_sugeridos || [])
      .filter((_, i) => selectedExams[i])
      .map((e) => e.nome_exame);
    if (list.length === 0) return;
    onAddExams?.(list);
    logProtocolUse({ id_protocolo: protocolo.id, nome_protocolo: protocolo.nome_protocolo, acao: "item_adicionado", itens_adicionados: list });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              {protocolo.nome_protocolo}
              <Badge variant="outline" className="text-[10px]">v{protocolo.versao_protocolo}</Badge>
              {badges.map((b, i) => (
                <Badge key={i} variant="outline" className={`text-[10px] ${toneClass(b.tone)}`}>{b.label}</Badge>
              ))}
            </DialogTitle>
          </DialogHeader>

          {settings.mostrar_gravidade_topo && hasGravePresent && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-destructive text-xs">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Sinal de gravidade presente. Reavaliar conduta, monitorização e necessidade de encaminhamento/internação.</span>
            </div>
          )}

          <Tabs defaultValue="resumo">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="gravidade">Gravidade</TabsTrigger>
              <TabsTrigger value="condutas">Condutas</TabsTrigger>
              <TabsTrigger value="exames">Exames</TabsTrigger>
              <TabsTrigger value="medicamentos">Medicamentos</TabsTrigger>
              <TabsTrigger value="cuidados">Cuidados</TabsTrigger>
              <TabsTrigger value="orientacoes">Orientações</TabsTrigger>
              <TabsTrigger value="fontes">Fontes</TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="space-y-2 pt-3 text-sm">
              <Field label="Tipo">{protocolo.tipo_protocolo}</Field>
              <Field label="Contexto">{protocolo.contexto_atendimento}</Field>
              {protocolo.area_clinica && <Field label="Área clínica">{protocolo.area_clinica}</Field>}
              {protocolo.populacao_alvo && <Field label="População-alvo">{protocolo.populacao_alvo}</Field>}
              {protocolo.queixas_relacionadas?.length > 0 && <Field label="Queixas">{protocolo.queixas_relacionadas.join(", ")}</Field>}
              {protocolo.cids_relacionados?.length > 0 && <Field label="CIDs">{protocolo.cids_relacionados.join(", ")}</Field>}
              {protocolo.diagnosticos_diferenciais?.length > 0 && <Field label="Diferenciais">{protocolo.diagnosticos_diferenciais.join(", ")}</Field>}
              {protocolo.alertas_seguranca?.length > 0 && (
                <Field label="Alertas de segurança">
                  <ul className="list-disc pl-4">{protocolo.alertas_seguranca.map((a, i) => <li key={i}>{a}</li>)}</ul>
                </Field>
              )}
              {protocolo.contraindicacoes_relevantes?.length > 0 && (
                <Field label="Contraindicações relevantes">
                  <ul className="list-disc pl-4">{protocolo.contraindicacoes_relevantes.map((a, i) => <li key={i}>{a}</li>)}</ul>
                </Field>
              )}
            </TabsContent>

            <TabsContent value="gravidade" className="space-y-2 pt-3">
              {(protocolo.sinais_gravidade || []).length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem sinais de gravidade cadastrados.</p>
              ) : (
                <div className="space-y-1">
                  {protocolo.sinais_gravidade.map((s, i) => (
                    <div key={i} className="flex items-center justify-between border rounded-md p-2">
                      <div>
                        <div className="text-sm">{s.titulo}</div>
                        {s.descricao && <div className="text-xs text-muted-foreground">{s.descricao}</div>}
                      </div>
                      <div className="flex gap-1">
                        {(["presente","ausente","nao_avaliado"] as const).map((v) => (
                          <Button key={v} size="sm" variant={gravity[i] === v ? "default" : "outline"} onClick={() => setGravity((g) => ({ ...g, [i]: v }))}>
                            {v === "nao_avaliado" ? "n/a" : v}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="condutas" className="space-y-2 pt-3">
              {(protocolo.condutas_iniciais || []).length === 0 ? <p className="text-xs text-muted-foreground">Sem condutas cadastradas.</p>
                : protocolo.condutas_iniciais.map((c, i) => (
                  <div key={i} className="border rounded-md p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{c.titulo}</span>
                      {c.prioridade && <Badge variant="outline" className="text-[10px]">{c.prioridade}</Badge>}
                      {c.obrigatoria && <Badge className="text-[10px] bg-destructive/10 text-destructive border-destructive/30">obrigatória</Badge>}
                    </div>
                    {c.descricao && <p className="text-xs text-muted-foreground mt-1">{c.descricao}</p>}
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="exames" className="space-y-2 pt-3">
              {(protocolo.exames_sugeridos || []).length === 0 ? <p className="text-xs text-muted-foreground">Sem exames cadastrados.</p>
                : <>
                  <div className="space-y-1">
                    {protocolo.exames_sugeridos.map((e, i) => (
                      <label key={i} className="flex items-start gap-2 border rounded-md p-2 cursor-pointer">
                        <Checkbox checked={!!selectedExams[i]} onCheckedChange={(v) => setSelectedExams((s) => ({ ...s, [i]: !!v }))} className="mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm">{e.nome_exame} {e.categoria && <Badge variant="outline" className="ml-1 text-[10px]">{e.categoria}</Badge>}{e.obrigatorio && <Badge className="ml-1 text-[10px] bg-destructive/10 text-destructive border-destructive/30">obrigatório</Badge>}</div>
                          {e.indicacao && <div className="text-xs text-muted-foreground">{e.indicacao}</div>}
                        </div>
                      </label>
                    ))}
                  </div>
                  <Button size="sm" onClick={copyExams} disabled={Object.values(selectedExams).every((v) => !v)}>
                    <Plus className="h-3 w-3 mr-1" /> Adicionar exames à solicitação
                  </Button>
                </>}
            </TabsContent>

            <TabsContent value="medicamentos" className="space-y-2 pt-3">
              {(protocolo.medicamentos_sugeridos || []).length === 0 ? <p className="text-xs text-muted-foreground">Sem medicamentos cadastrados.</p>
                : protocolo.medicamentos_sugeridos.map((m: MedicamentoSugerido, i: number) => (
                  <ProtocolMedicationItem
                    key={i} med={m} patientCtx={patientCtx}
                    cruzarSeguranca={settings.cruzar_seguranca_med_sugerido}
                    exigirRevisao={settings.exigir_revisao_med_sugerido}
                    onAdd={(payload) => {
                      onAddPrescription?.(payload);
                      logProtocolUse({ id_protocolo: protocolo.id, nome_protocolo: protocolo.nome_protocolo, acao: "item_adicionado", itens_adicionados: [payload] });
                    }}
                  />
                ))}
            </TabsContent>

            <TabsContent value="cuidados" className="space-y-2 pt-3">
              {(protocolo.cuidados_enfermagem || []).length === 0 ? <p className="text-xs text-muted-foreground">Sem cuidados de enfermagem cadastrados.</p>
                : protocolo.cuidados_enfermagem.map((c, i) => (
                  <div key={i} className="border rounded-md p-2 text-sm">
                    <div className="font-medium">{c.descricao}</div>
                    {(c.frequencia || c.prioridade) && (
                      <div className="text-xs text-muted-foreground">{[c.frequencia, c.prioridade].filter(Boolean).join(" · ")}</div>
                    )}
                  </div>
                ))}
              {(protocolo.medidas_nao_farmacologicas || []).length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold mt-2 mb-1">Medidas não farmacológicas</h5>
                  <ul className="list-disc pl-4 text-xs">
                    {protocolo.medidas_nao_farmacologicas.map((m, i) => <li key={i}>{m.descricao}</li>)}
                  </ul>
                </div>
              )}
              {(protocolo.criterios_encaminhamento || []).length + (protocolo.criterios_internacao || []).length > 0 && (
                <div className="border-t pt-2">
                  <h5 className="text-xs font-semibold mb-1">Encaminhamento / Internação</h5>
                  {protocolo.criterios_encaminhamento.map((c, i) => <div key={`e${i}`} className="text-xs">• {c.titulo}</div>)}
                  {protocolo.criterios_internacao.map((c, i) => <div key={`i${i}`} className="text-xs">• {c.titulo}</div>)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="orientacoes" className="space-y-2 pt-3">
              {protocolo.orientacoes_paciente
                ? <>
                  <div className="text-sm whitespace-pre-wrap border rounded-md p-2 bg-muted/30">{protocolo.orientacoes_paciente}</div>
                  <Button size="sm" onClick={() => {
                    onAddOrientations?.(protocolo.orientacoes_paciente!);
                    logProtocolUse({ id_protocolo: protocolo.id, nome_protocolo: protocolo.nome_protocolo, acao: "item_adicionado", itens_adicionados: ["orientacoes"] });
                  }}>
                    <Plus className="h-3 w-3 mr-1" /> Adicionar às orientações do paciente
                  </Button>
                </>
                : <p className="text-xs text-muted-foreground">Sem orientações cadastradas.</p>}
              {(protocolo.sinais_retorno_imediato || []).length > 0 && (
                <div className="border-t pt-2">
                  <h5 className="text-xs font-semibold mb-1">Sinais de retorno imediato</h5>
                  <ul className="list-disc pl-4 text-xs">{protocolo.sinais_retorno_imediato.map((s, i) => <li key={i}>{s.titulo}</li>)}</ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="fontes" className="space-y-2 pt-3 text-sm">
              <Field label="Fonte">{protocolo.fonte_referencia || <span className="text-muted-foreground">—</span>}</Field>
              <Field label="Status">{protocolo.status_revisao}</Field>
              <Field label="Versão">{protocolo.versao_protocolo}</Field>
              <Field label="Data atualização">{protocolo.data_atualizacao}</Field>
              {protocolo.revisado_em && <Field label="Revisado em">{new Date(protocolo.revisado_em).toLocaleDateString()}</Field>}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 border-t pt-3">
            {settings.permitir_montar_plano && (
              <Button variant="outline" onClick={() => setPlanOpen(true)}>Montar plano sugerido</Button>
            )}
            <Button variant="ghost" onClick={onClose}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {planOpen && (
        <ProtocolPlanReviewDialog
          open={planOpen}
          protocolo={protocolo}
          onClose={() => setPlanOpen(false)}
          patientCtx={patientCtx}
          onAddPrescription={onAddPrescription}
          onAddExams={onAddExams}
          onAddOrientations={onAddOrientations}
        />
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
