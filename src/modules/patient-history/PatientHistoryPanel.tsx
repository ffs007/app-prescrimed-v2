// Etapa 18 — Painel principal "Histórico do Paciente".
// Standalone para futura integração no Dashboard de prescrição.
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { usePatientHistory, type TimeFilter } from "./hooks/usePatientHistory";
import { useHistoricoSettings } from "./hooks/usePatientHistory";
import PreviousPrescriptionCard from "./PreviousPrescriptionCard";
import PrescriptionDetailDialog from "./PrescriptionDetailDialog";
import ReuseReviewDialog from "./ReuseReviewDialog";
import RecurrentMedicationsList from "./RecurrentMedicationsList";
import MedicationRepeatDialog from "./MedicationRepeatDialog";
import ContinuousMedicationsCard from "./ContinuousMedicationsCard";
import PreviousDocumentsList from "./PreviousDocumentsList";
import PatientComparisonSection from "./PatientComparisonSection";
import ReuseAlertBanner from "./ReuseAlertBanner";
import { comparePatientSnapshots } from "./lib/historyCompare";
import { logHistoryView } from "./lib/reuseLog";
import type { PrescriptionHistoryRow, PatientSnapshot, ReuseItem } from "./lib/types";
import type { RecurrentMed } from "./hooks/usePatientHistory";

interface Props {
  idPaciente: string | null;
  pacienteAtual: PatientSnapshot;
  onAddItems?: (items: ReuseItem[], origemId?: string) => void;
}

const FILTERS: { v: TimeFilter; l: string }[] = [
  { v: "7d", l: "7 dias" },
  { v: "30d", l: "30 dias" },
  { v: "90d", l: "90 dias" },
  { v: "1y", l: "1 ano" },
  { v: "all", l: "Todos" },
];

export default function PatientHistoryPanel({ idPaciente, pacienteAtual, onAddItems }: Props) {
  const [filter, setFilter] = useState<TimeFilter>("30d");
  const { rows } = usePatientHistory(idPaciente, filter);
  const { settings } = useHistoricoSettings();

  const [detail, setDetail] = useState<PrescriptionHistoryRow | null>(null);
  const [compareTarget, setCompareTarget] = useState<PrescriptionHistoryRow | null>(null);
  const [reuseTarget, setReuseTarget] = useState<PrescriptionHistoryRow | null>(null);
  const [repeatMed, setRepeatMed] = useState<RecurrentMed | null>(null);

  const handleReuse = (row: PrescriptionHistoryRow) => {
    setReuseTarget(row);
    if (idPaciente) {
      logHistoryView({ id_paciente: idPaciente, tipo: "prescricao", item_visualizado: row.id });
    }
  };

  const itensReuso: ReuseItem[] =
    ((reuseTarget?.itens as unknown as Array<Record<string, unknown>>) ?? []).map((it, i) => ({
      id: String(it.id ?? `it_${i}`),
      kind: (String(it.kind ?? "medicamento") as ReuseItem["kind"]),
      titulo: String(it.titulo ?? it.principio_ativo ?? "Item"),
      principio_ativo: it.principio_ativo as string | undefined,
      dose: it.dose as string | undefined,
      via: it.via as string | undefined,
      frequencia: it.frequencia as string | undefined,
      duracao: it.duracao as string | undefined,
      observacoes: it.observacoes as string | undefined,
      selecionado: true,
      editado: false,
      status: "seguro_para_revisao",
      alertas_atuais: [],
    }));

  const compareDiffs = compareTarget
    ? comparePatientSnapshots(
        (compareTarget.dados_paciente_snapshot as unknown as PatientSnapshot) ?? {},
        pacienteAtual,
      )
    : [];

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="h-4 w-4" /> Histórico do Paciente
        </CardTitle>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <Button
              key={f.v}
              size="sm"
              variant={filter === f.v ? "default" : "outline"}
              className="h-7 px-2 text-[11px]"
              onClick={() => setFilter(f.v)}
            >
              {f.l}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ReuseAlertBanner kind="default" />
        <Tabs defaultValue="prescricoes" className="mt-3">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="prescricoes">Prescrições</TabsTrigger>
            <TabsTrigger value="medicamentos">Medicamentos</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="uso_continuo">Uso contínuo</TabsTrigger>
            <TabsTrigger value="alertas">Alertas</TabsTrigger>
          </TabsList>

          <TabsContent value="prescricoes" className="space-y-2 mt-3">
            {rows.length === 0 && (
              <div className="text-xs text-muted-foreground">Nenhuma prescrição no período.</div>
            )}
            {rows.map((r) => (
              <PreviousPrescriptionCard
                key={r.id}
                row={r}
                onView={() => {
                  setDetail(r);
                  if (idPaciente) logHistoryView({ id_paciente: idPaciente, tipo: "prescricao", item_visualizado: r.id });
                }}
                onReuse={() => handleReuse(r)}
                onCompare={() => setCompareTarget(r)}
              />
            ))}
          </TabsContent>

          <TabsContent value="medicamentos" className="space-y-3 mt-3">
            <RecurrentMedicationsList idPaciente={idPaciente} onRepeat={setRepeatMed} />
          </TabsContent>

          <TabsContent value="documentos" className="mt-3">
            <PreviousDocumentsList
              rows={rows}
              onView={() => { /* visualizar via detalhe da prescrição */ }}
              onDuplicate={() => { /* ganho futuro: hook de duplicar */ }}
              onUseAsBase={() => { /* idem */ }}
            />
          </TabsContent>

          <TabsContent value="uso_continuo" className="mt-3">
            <ContinuousMedicationsCard idPaciente={idPaciente} />
          </TabsContent>

          <TabsContent value="alertas" className="mt-3 space-y-2">
            {rows.flatMap((p) =>
              ((p.alertas_registrados as unknown as Array<Record<string, unknown>>) ?? [])
                .map((a, i) => (
                  <div key={`${p.id}-${i}`} className="text-xs rounded border bg-warning/5 border-warning/30 p-2">
                    <div className="text-muted-foreground">
                      {new Date(p.criado_em).toLocaleDateString("pt-BR")}
                    </div>
                    {String(a.mensagem ?? a.tipo ?? JSON.stringify(a))}
                  </div>
                )),
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <PrescriptionDetailDialog row={detail} onClose={() => setDetail(null)} />

      {compareTarget && (
        <div className="p-4">
          <PatientComparisonSection diffs={compareDiffs} />
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setCompareTarget(null)}>
            Fechar comparação
          </Button>
        </div>
      )}

      <ReuseReviewDialog
        open={!!reuseTarget}
        onClose={() => setReuseTarget(null)}
        prescricaoOrigem={reuseTarget}
        itensOriginais={itensReuso}
        pacienteAtual={pacienteAtual}
        bloquearAlertaCritico={settings?.bloquear_item_alerta_critico ?? true}
        exigirJustDadosMudaram={settings?.exigir_just_dados_mudaram ?? true}
        onAdd={(items) => onAddItems?.(items, reuseTarget?.id)}
      />

      <MedicationRepeatDialog
        med={repeatMed}
        onClose={() => setRepeatMed(null)}
        onAdd={(item) => onAddItems?.([item])}
      />
    </Card>
  );
}
