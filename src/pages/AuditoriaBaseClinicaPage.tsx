/**
 * Auditoria da base clínica (admin) — Etapa 1.
 *
 * Rastreabilidade: mostra o retrato da base e, por quadro clínico, o caminho
 * vínculos no banco → retornados pelo serviço → exibidos na interface.
 * Invisível para o médico; não altera nenhum dado.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useReviewSummary } from "@/modules/medications/hooks/useClinicalReview";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";
import { describeSupabaseError } from "@/lib/supabaseError";
import { getClinicalSuggestions } from "@/modules/prescription/services/clinicalSuggestions";
import type { ClinicalEnvironment } from "@/modules/prescription/types/prescription";

type Resumo = Record<string, number>;

const LABELS: Array<[keyof Resumo & string, string]> = [
  ["medicamentos_total", "Medicamentos cadastrados"],
  ["medicamentos_ativos", "Medicamentos ativos"],
  ["com_dose", "Com dose válida"],
  ["sem_dose", "Sem dose cadastrada"],
  ["com_apresentacao", "Com apresentação válida"],
  ["sem_apresentacao", "Sem apresentação"],
  ["vinculados_a_quadros", "Vinculados a quadros clínicos"],
  ["medicamentos_orfaos", "Medicamentos órfãos (sem vínculo)"],
  ["apresentacoes_orfas", "Apresentações órfãs"],
  ["doses_sem_medicamento", "Doses sem medicamento correspondente"],
  ["vinculos_patologia_ativos", "Vínculos doença ativos"],
  ["vinculos_patologia_total", "Vínculos doença (total)"],
  ["vinculos_sindrome_ativos", "Vínculos síndrome ativos"],
  ["vinculos_sindrome_total", "Vínculos síndrome (total)"],
  ["vinculos_quebrados", "Vínculos quebrados"],
  ["condicoes_com_sugestao", "Quadros com conduta revisada"],
  ["condicoes_sem_sugestao", "Quadros sem conduta revisada"],
  ["duplicidades_medicamento", "Duplicidades de medicamento"],
  ["lacunas_registradas", "Lacunas registradas pelos usuários"],
];

const LABELS_APRES: Array<[string, string]> = [
  ["apresentacoes_total", "Apresentações cadastradas"],
  ["com_apresentacao", "Medicamentos com apresentação"],
  ["sem_apresentacao", "Medicamentos sem apresentação"],
  ["medicamentos_multi_apresentacao", "Com mais de uma apresentação"],
  ["apresentacoes_pendentes", "Apresentações pendentes de revisão"],
  ["apresentacoes_incompletas", "Apresentações incompletas"],
  ["doses_total", "Doses cadastradas"],
  ["medicamentos_com_dose", "Medicamentos com dose"],
  ["medicamentos_sem_dose", "Medicamentos sem dose"],
  ["doses_ligadas_apresentacao", "Doses ligadas a uma apresentação"],
  ["doses_pendentes", "Doses pendentes de revisão"],
  ["prontos_para_prescrever", "Prontos para prescrição rápida"],
];

/** Cartões clicáveis: cada um abre a lista correspondente. */
const QUALIDADE_CARDS: Array<{ key: string; label: string; filtro: string | null }> = [
  { key: "medicamentos_total", label: "Medicamentos na base", filtro: null },
  { key: "funcionalmente_prontos", label: "Prontos para prescrição rápida", filtro: "funcionalmente_prontos" },
  { key: "completos", label: "Completos (com revisão clínica)", filtro: "completo" },
  { key: "parciais", label: "Parciais", filtro: "parcial" },
  { key: "pendentes", label: "Pendentes de revisão", filtro: "pendente" },
  { key: "com_dose", label: "Com dose cadastrada", filtro: null },
  { key: "sem_dose", label: "Sem dose", filtro: "sem_dose" },
  { key: "com_apresentacao_utilizavel", label: "Com apresentação utilizável", filtro: null },
  { key: "sem_apresentacao", label: "Sem apresentação", filtro: "sem_apresentacao" },
  { key: "multiplas_apresentacoes", label: "Com várias apresentações", filtro: "multiplas_apresentacoes" },
  { key: "possiveis_erros_unidade", label: "Possível erro de unidade", filtro: "erro_unidade" },
  { key: "possiveis_erros_concentracao", label: "Possível erro de concentração", filtro: "erro_concentracao" },
];

const PENDENCIA_LABEL: Record<string, string> = {
  funcionalmente_prontos: "Prontos para prescrição rápida",
  completo: "Completos",
  parcial: "Parciais",
  pendente: "Pendentes de revisão",
  sem_dose: "Sem dose",
  sem_apresentacao: "Sem apresentação",
  multiplas_apresentacoes: "Com várias apresentações",
  erro_unidade: "Possível erro de unidade",
  erro_concentracao: "Possível erro de concentração",
};

const AMBIENTES: ClinicalEnvironment[] = ["ambulatorial", "urgencia", "emergencia"];

export default function AuditoriaBaseClinicaPage() {
  const [condicao, setCondicao] = useState("");
  const [consulta, setConsulta] = useState("");
  const [ambiente, setAmbiente] = useState<ClinicalEnvironment>("urgencia");
  const [pendencia, setPendencia] = useState<string | null>(null);

  const resumo = useQuery({
    queryKey: ["auditoria-base-clinica"],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<Resumo> => {
      const { data, error } = await supabase.rpc("fn_auditoria_base_clinica" as never);
      if (error) throw error;
      return (data ?? {}) as Resumo;
    },
  });

  const revisao = useReviewSummary();

  const qualidade = useQuery({
    queryKey: ["auditoria-qualidade-farmacologica"],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<Resumo> => {
      const { data, error } = await supabase.rpc("fn_auditoria_qualidade_farmacologica" as never);
      if (error) throw error;
      return (data ?? {}) as Resumo;
    },
  });

  const pendencias = useQuery({
    queryKey: ["auditoria-pendencias", pendencia],
    enabled: !!pendencia,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("fn_pendencias_medicamentos" as never, {
        p_tipo: pendencia,
        p_limit: 300,
      } as never);
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        principio_ativo: string;
        classe_terapeutica: string | null;
        status_funcional: string;
        detalhe: string | null;
      }>;
    },
  });

  const apresentacoes = useQuery({
    queryKey: ["auditoria-apresentacoes-doses"],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<Resumo> => {
      const { data, error } = await supabase.rpc("fn_auditoria_apresentacoes_doses" as never);
      if (error) throw error;
      return (data ?? {}) as Resumo;
    },
  });

  const semSugestao = useQuery({
    queryKey: ["auditoria-condicoes-sem-sugestao"],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("fn_auditoria_condicoes_sem_sugestao" as never, { p_limit: 100 } as never);
      if (error) throw error;
      return ((data ?? []) as Array<{ nome: string; sistema: string | null }>);
    },
  });

  const trace = useQuery({
    queryKey: ["auditoria-trace", consulta.toLowerCase(), ambiente],
    enabled: consulta.trim().length > 1,
    queryFn: async () => {
      const t0 = performance.now();
      const vinculosBanco = await supabase
        .from("patologia_medicamento" as never)
        .select("id, status_revisao", { count: "exact", head: false })
        .eq("patologia_normalizada", consulta.trim().toLowerCase())
        .eq("ambiente", ambiente);
      const result = await getClinicalSuggestions({ condition: consulta.trim(), environment: ambiente });
      return {
        ms: Math.round(performance.now() - t0),
        noBanco: vinculosBanco.data?.length ?? 0,
        aprovados: (vinculosBanco.data ?? []).filter((r: never) => (r as { status_revisao: string }).status_revisao === "aprovado").length,
        ...result.diagnostics,
        itens: result.suggestions,
      };
    },
  });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 space-y-4">
      <Helmet>
        <title>Auditoria da base clínica | PrescriMed</title>
        <meta name="description" content="Painel administrativo de auditoria da base clínica e farmacológica." />
      </Helmet>

      <header>
        <h1 className="text-2xl font-bold">Auditoria da base clínica</h1>
        <p className="text-sm text-muted-foreground">
          Retrato do banco e rastreabilidade das sugestões. Somente leitura.
        </p>
      </header>

      {resumo.error && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar a auditoria</AlertTitle>
          <AlertDescription>{describeSupabaseError(resumo.error as { message?: string })}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Revisão clínica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
            {(
              [
                ["liberados_medicamentos", "Liberados para prescrição rápida"],
                ["completos_aguardando", "Completos aguardando revisão"],
                ["pendentes", "Pendentes"],
                ["revisados", "Revisados"],
                ["precisam_corrigir", "Precisam correção"],
                ["inativos", "Inativos"],
              ] as Array<[string, string]>
            ).map(([key, label]) => (
              <div key={key} className="rounded-md border p-2">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-lg font-semibold">
                  {(revisao.data as unknown as Record<string, number> | undefined)?.[key] ?? 0}
                </div>
              </div>
            ))}
          </div>
          <Link to="/admin/revisao-clinica" className="text-sm font-medium text-primary underline">
            Abrir fila de revisão clínica
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Resumo</CardTitle>
        </CardHeader>
        <CardContent>
          {resumo.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {LABELS.map(([key, label]) => (
                <div key={key} className="rounded-md border p-2">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-lg font-semibold">{resumo.data?.[key] ?? 0}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Qualidade farmacológica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {qualidade.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {QUALIDADE_CARDS.map(({ key, label, filtro }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => filtro && setPendencia(filtro)}
                  disabled={!filtro}
                  className={`rounded-md border p-2 text-left transition ${
                    filtro ? "hover:border-primary hover:bg-accent" : "cursor-default"
                  } ${pendencia === filtro ? "border-primary bg-accent" : ""}`}
                >
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-lg font-semibold">{qualidade.data?.[key] ?? 0}</div>
                </button>
              ))}
            </div>
          )}

          {pendencia && (
            <div className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {PENDENCIA_LABEL[pendencia] ?? pendencia}
                  {pendencias.data ? ` · ${pendencias.data.length}` : ""}
                </p>
                <Button size="sm" variant="ghost" onClick={() => setPendencia(null)}>
                  Fechar
                </Button>
              </div>
              {pendencias.isFetching ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <ul className="max-h-72 space-y-1 overflow-y-auto text-xs">
                  {(pendencias.data ?? []).map((m) => (
                    <li key={m.id} className="rounded-md border p-2">
                      <span className="font-medium">{m.principio_ativo}</span>
                      {m.classe_terapeutica ? ` · ${m.classe_terapeutica}` : ""}
                      <span className="ml-1 text-muted-foreground">
                        ({m.status_funcional}) {m.detalhe}
                      </span>
                    </li>
                  ))}
                  {(pendencias.data ?? []).length === 0 && (
                    <li className="text-muted-foreground">Nenhum registro nesta pendência.</li>
                  )}
                </ul>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Medicamentos parciais ou pendentes continuam encontráveis na busca manual do médico; apenas não recebem
            preenchimento automático.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Apresentações e doses (Etapa 2)</CardTitle>
        </CardHeader>
        <CardContent>
          {apresentacoes.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {LABELS_APRES.map(([key, label]) => (
                <div key={key} className="rounded-md border p-2">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-lg font-semibold">{apresentacoes.data?.[key] ?? 0}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Rastrear um quadro clínico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input
              value={condicao}
              onChange={(e) => setCondicao(e.target.value)}
              placeholder="Nome do quadro (ex.: pneumonia adquirida na comunidade)"
              className="max-w-md"
              aria-label="Quadro clínico"
            />
            {AMBIENTES.map((a) => (
              <Button key={a} size="sm" variant={ambiente === a ? "default" : "outline"} onClick={() => setAmbiente(a)}>
                {a}
              </Button>
            ))}
            <Button size="sm" onClick={() => setConsulta(condicao)}>Rastrear</Button>
          </div>

          {trace.isFetching && <p className="text-sm text-muted-foreground">Consultando…</p>}
          {trace.data && (
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Vínculos no banco: {trace.data.noBanco}</Badge>
                <Badge variant="outline">Aprovados: {trace.data.aprovados}</Badge>
                <Badge variant="outline">Retornados pelo serviço: {trace.data.returnedByService}</Badge>
                <Badge variant="outline">Exibidos: {trace.data.displayed}</Badge>
                <Badge variant="outline">Sem dose: {trace.data.droppedNoDose}</Badge>
                <Badge variant="outline">{trace.data.ms} ms</Badge>
              </div>
              {trace.data.noBanco !== trace.data.aprovados && (
                <p className="text-xs text-amber-600">
                  {trace.data.noBanco - trace.data.aprovados} vínculo(s) escondido(s) por estarem em revisão.
                </p>
              )}
              <ul className="space-y-1">
                {trace.data.itens.map((s) => (
                  <li key={s.linkId} className="rounded-md border p-2 text-xs">
                    <span className="font-medium">{s.name}</span> · {s.line} · {s.route ?? "via não cadastrada"} ·{" "}
                    {s.adultDose ?? "dose não cadastrada"}
                    {s.presentation ? ` · ${s.presentation}` : ""}
                  </li>
                ))}
                {trace.data.itens.length === 0 && (
                  <li className="text-xs text-muted-foreground">Nenhuma sugestão revisada para este quadro/ambiente.</li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Quadros sem conduta revisada {semSugestao.data ? `· ${semSugestao.data.length}+` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {semSugestao.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="flex flex-wrap gap-1 max-h-64 overflow-y-auto">
              {(semSugestao.data ?? []).map((c) => (
                <Badge key={c.nome} variant="outline" className="text-[10px]">
                  {c.nome}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
