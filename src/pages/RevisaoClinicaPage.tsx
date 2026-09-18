/**
 * Etapa 3 — Fila de revisão clínica (área administrativa).
 *
 * O médico não passa por aqui: toda a complexidade de validação fica nos
 * bastidores. Nada é preenchido ou convertido automaticamente.
 */
import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { AlertTriangle, Check, Pause, Pencil, Power } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { describeSupabaseError } from "@/lib/supabaseError";
import { useReviewActions, useReviewQueue, useReviewSummary } from "@/modules/medications/hooks/useClinicalReview";
import {
  REVIEW_FILTER_LABEL,
  REVIEW_STATUS_LABEL,
  posologyLabel,
  presentationLabel,
  type DosePatch,
  type ReviewFilter,
  type ReviewQueueItem,
} from "@/modules/medications/services/clinicalReview";

const FILTERS: ReviewFilter[] = [
  "inconsistencias",
  "prontos",
  "pendentes",
  "precisam_corrigir",
  "revisados",
  "inativos",
  "todos",
];

const SUMMARY_CARDS: Array<{ key: keyof ReturnType<typeof useReviewSummary>["data"] & string; label: string }> = [
  { key: "liberados_medicamentos", label: "Liberados para prescrição rápida" },
  { key: "completos_aguardando", label: "Tecnicamente completos aguardando revisão" },
  { key: "pendentes", label: "Pendentes" },
  { key: "revisados", label: "Revisados" },
  { key: "precisam_corrigir", label: "Precisam correção" },
  { key: "inativos", label: "Inativos" },
  { key: "apresentacoes_total", label: "Apresentações cadastradas" },
  { key: "medicamentos_com_apresentacao", label: "Medicamentos com apresentação" },
];

function itemKey(item: ReviewQueueItem) {
  return `${item.medicamentoId}|${item.apresentacaoId ?? "-"}|${item.doseId ?? "-"}`;
}

export default function RevisaoClinicaPage() {
  const [filter, setFilter] = useState<ReviewFilter>("inconsistencias");
  const [editing, setEditing] = useState<string | null>(null);
  const [patch, setPatch] = useState<DosePatch>({});
  const [nota, setNota] = useState("");

  const summary = useReviewSummary();
  const queue = useReviewQueue(filter);
  const { act, correct } = useReviewActions();

  const items = useMemo(() => queue.data ?? [], [queue.data]);

  const run = async (item: ReviewQueueItem, action: Parameters<typeof act.mutateAsync>[0]["action"]) => {
    try {
      await act.mutateAsync({ item, action, observacao: nota || null });
      setNota("");
      toast({ title: "Revisão registrada", description: `${item.principioAtivo} — ${action}.` });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Não foi possível registrar",
        description: describeSupabaseError(e as { message?: string }),
      });
    }
  };

  const saveCorrection = async (item: ReviewQueueItem) => {
    if (!item.doseId) return;
    try {
      await correct.mutateAsync({ doseId: item.doseId, patch });
      await act.mutateAsync({ item, action: "corrigir", observacao: nota || "Correção manual do revisor." });
      setEditing(null);
      setPatch({});
      toast({ title: "Correção salva", description: "O item segue como 'precisa corrigir' até ser aprovado." });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Não foi possível salvar",
        description: describeSupabaseError(e as { message?: string }),
      });
    }
  };

  return (
    <div className="container mx-auto max-w-5xl space-y-4 px-4 py-6">
      <Helmet>
        <title>Revisão clínica da base | PrescriMed</title>
        <meta
          name="description"
          content="Fila de revisão clínica dos medicamentos antes da liberação para prescrição rápida."
        />
      </Helmet>

      <header>
        <h1 className="text-2xl font-bold">Revisão clínica</h1>
        <p className="text-sm text-muted-foreground">
          Dado completo não é sinônimo de dado revisado. Só o que for aprovado aqui entra no preenchimento automático.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Situação</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
              {SUMMARY_CARDS.map((c) => (
                <div key={c.key} className="rounded-md border p-2">
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                  <div className="text-lg font-semibold">{(summary.data?.[c.key] as number) ?? 0}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {REVIEW_FILTER_LABEL[f]}
          </Button>
        ))}
      </div>

      {queue.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar a fila</AlertTitle>
          <AlertDescription>{describeSupabaseError(queue.error as { message?: string })}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="nota-revisao" className="text-xs">
          Observação da revisão (opcional, fica no histórico)
        </Label>
        <Textarea
          id="nota-revisao"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={2}
          placeholder="Fonte consultada, ressalva clínica, motivo da inativação…"
        />
      </div>

      {queue.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : items.length === 0 ? (
        <p className="rounded-md border p-4 text-sm text-muted-foreground">Nenhum item neste filtro.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const key = itemKey(item);
            const bloqueado = item.alertas > 0;
            const aprovavel = !bloqueado && !!item.apresentacaoId && !!item.doseId;
            return (
              <li key={key} className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="font-semibold">{item.principioAtivo}</span>
                    {item.classeTerapeutica && (
                      <span className="text-muted-foreground"> · {item.classeTerapeutica}</span>
                    )}
                  </div>
                  <span className="rounded-full border px-2 py-0.5 text-xs">
                    {REVIEW_STATUS_LABEL[item.status]}
                    {item.versao ? ` · v${item.versao}` : ""}
                  </span>
                </div>

                <div className="mt-1 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
                  <div>
                    <span className="font-medium text-foreground">Apresentação: </span>
                    {presentationLabel(item)}
                    {item.via ? ` · ${item.via}` : ""}
                    {item.volume ? ` · ${item.volume} ${item.unidadeVolume ?? ""}` : ""}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Posologia: </span>
                    {posologyLabel(item)}
                    {item.doseMaximaDia ? ` · máx/dia ${item.doseMaximaDia}` : ""}
                  </div>
                  <div>
                    Contexto: {item.populacao ?? (item.usoPediatrico ? "adulto e pediátrico" : "adulto")}
                    {item.usoEmergencia ? " · emergência" : ""}
                    {item.usoUrgencia ? " · urgência" : ""}
                    {item.categoriaClinica ? ` · ${item.categoriaClinica}` : ""}
                  </div>
                  <div>
                    Completude técnica: {item.apresentacaoUtilizavel ? "apresentação ok" : "sem apresentação"} ·{" "}
                    {item.doseUtilizavel ? "dose ok" : "dose pendente"}
                  </div>
                </div>

                {bloqueado && (
                  <p className="mt-2 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
                    Bloqueado para aprovação — possível inconsistência: {item.tiposAlerta.join(", ")}. Nenhuma unidade
                    foi convertida automaticamente.
                  </p>
                )}

                {editing === key ? (
                  <div className="mt-2 grid gap-2 rounded-md border p-2 md:grid-cols-2">
                    {(
                      [
                        ["posologia_texto", "Texto da posologia"],
                        ["dose_min", "Dose mínima"],
                        ["dose_max", "Dose máxima"],
                        ["dose_unidade", "Unidade"],
                        ["frequencia", "Frequência"],
                        ["duracao", "Duração"],
                        ["via", "Via"],
                        ["observacao_dose", "Observação"],
                      ] as Array<[keyof DosePatch, string]>
                    ).map(([field, label]) => (
                      <div key={field} className="space-y-1">
                        <Label htmlFor={`${key}-${field}`} className="text-xs">
                          {label}
                        </Label>
                        <Input
                          id={`${key}-${field}`}
                          value={patch[field] ?? ""}
                          onChange={(e) => setPatch((p) => ({ ...p, [field]: e.target.value }))}
                        />
                      </div>
                    ))}
                    <div className="flex gap-2 md:col-span-2">
                      <Button size="sm" onClick={() => saveCorrection(item)} disabled={correct.isPending}>
                        Salvar correção
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(null);
                          setPatch({});
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => run(item, "aprovar")} disabled={!aprovavel || act.isPending}>
                      <Check className="mr-1 h-3.5 w-3.5" /> Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!item.doseId}
                      onClick={() => {
                        setEditing(key);
                        setPatch({});
                      }}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Corrigir
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => run(item, "pendente")}>
                      <Pause className="mr-1 h-3.5 w-3.5" /> Manter pendente
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => run(item, "inativar")}>
                      <Power className="mr-1 h-3.5 w-3.5" /> Inativar
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Medicamentos sem dose ou sem apresentação continuam disponíveis na busca manual do médico, sempre identificados
        como não cadastrados. Esta tela nunca cria conteúdo clínico.
      </p>
    </div>
  );
}
