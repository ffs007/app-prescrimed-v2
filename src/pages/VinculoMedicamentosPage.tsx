import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LINK_CONTEXT_LABEL,
  LINK_ROLE_LABEL,
  LINK_STATUS_LABEL,
  upsertLink,
  type LinkContext,
  type LinkRole,
  type LinkStatus,
} from "@/modules/medications/services/clinicalLinks";
import { toast } from "sonner";

const AMBIENTES: LinkContext[] = ["ambulatorial", "urgencia", "emergencia", "hospitalar", "qualquer"];
const PAPEIS = Object.keys(LINK_ROLE_LABEL) as LinkRole[];

interface Patologia {
  id: string;
  nome_patologia: string;
  nome_normalizado: string;
}

interface Medicamento {
  id: string;
  principio_ativo: string;
  via_administracao: string | null;
  dose_adulto_padrao: string | null;
  dose_pediatrica_padrao: string | null;
  duracao_padrao: string | null;
}

interface VinculoRow {
  id: string;
  condicao_nome: string;
  condicao_normalizada: string;
  medicamento_id: string;
  care_context: LinkContext;
  papel: LinkRole;
  prioridade: number;
  review_status: LinkStatus;
  notes: string | null;
}

interface Vinculo extends VinculoRow {
  medicamento: Medicamento | null;
}

const normalizar = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export default function VinculoMedicamentosPage() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [ambiente, setAmbiente] = useState<string>("todos");
  const [novo, setNovo] = useState({
    patologia: "",
    medicamento: "",
    ambiente: "urgencia" as LinkContext,
    papel: "primeira_linha" as LinkRole,
  });

  const catalogos = useQuery({
    queryKey: ["admin-vinculos-catalogos"],
    queryFn: async () => {
      const [patologias, medicamentos] = await Promise.all([
        supabase
          .from("base_patologias_ref")
          .select("id, nome_patologia, nome_normalizado")
          .order("nome_patologia")
          .limit(1000),
        supabase
          .from("base_medicamentos_geral")
          .select(
            "id, principio_ativo, via_administracao, dose_adulto_padrao, dose_pediatrica_padrao, duracao_padrao",
          )
          .eq("ativo", true)
          .order("principio_ativo")
          .limit(1000),
      ]);
      if (patologias.error) throw patologias.error;
      if (medicamentos.error) throw medicamentos.error;
      return {
        patologias: (patologias.data ?? []) as Patologia[],
        medicamentos: (medicamentos.data ?? []) as Medicamento[],
      };
    },
    staleTime: 60_000,
  });

  const vinculos = useQuery({
    queryKey: ["admin-vinculos-med"],
    queryFn: async (): Promise<Vinculo[]> => {
      const { data, error } = await supabase
        .from("clinical_condition_medication")
        .select(
          "id, condicao_nome, condicao_normalizada, medicamento_id, care_context, papel, prioridade, review_status, notes",
        )
        .eq("condicao_tipo", "patologia")
        .order("condicao_nome")
        .order("prioridade")
        .limit(1000);
      if (error) throw error;

      const medicamentos = new Map((catalogos.data?.medicamentos ?? []).map((item) => [item.id, item]));
      return ((data ?? []) as VinculoRow[]).map((item) => ({
        ...item,
        medicamento: medicamentos.get(item.medicamento_id) ?? null,
      }));
    },
    enabled: catalogos.isSuccess,
  });

  const ambientesPatologia = useQuery({
    queryKey: ["admin-vinculos-cobertura-base"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patologia_ambiente")
        .select("nome_normalizado, ambiente")
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const cobertura = useMemo(() => {
    const cobertas = new Set(
      (vinculos.data ?? [])
        .filter((item) => item.papel === "primeira_linha" && item.review_status !== "inactive")
        .map((item) => `${item.care_context}|${item.condicao_normalizada}`),
    );
    const resultado: Record<string, { total: number; com: number }> = {};
    for (const item of ambientesPatologia.data ?? []) {
      resultado[item.ambiente] ??= { total: 0, com: 0 };
      resultado[item.ambiente].total += 1;
      if (cobertas.has(`${item.ambiente}|${item.nome_normalizado}`)) resultado[item.ambiente].com += 1;
    }
    return resultado;
  }, [ambientesPatologia.data, vinculos.data]);

  const criar = useMutation({
    mutationFn: async () => {
      const patologia = catalogos.data?.patologias.find(
        (item) => normalizar(item.nome_patologia) === normalizar(novo.patologia),
      );
      const medicamento = catalogos.data?.medicamentos.find(
        (item) => normalizar(item.principio_ativo) === normalizar(novo.medicamento),
      );
      if (!patologia) throw new Error("Escolha uma patologia existente no catálogo.");
      if (!medicamento) throw new Error("Escolha um medicamento existente no catálogo.");

      await upsertLink({
        conditionType: "patologia",
        conditionId: patologia.id,
        conditionName: patologia.nome_patologia,
        medicationId: medicamento.id,
        role: novo.papel,
        priority: 20,
        careContext: novo.ambiente,
        source: "Curadoria manual",
      });
    },
    onSuccess: () => {
      toast.success("Vínculo criado e enviado para revisão");
      setNovo((atual) => ({ ...atual, medicamento: "" }));
      qc.invalidateQueries({ queryKey: ["admin-vinculos-med"] });
      qc.invalidateQueries({ queryKey: ["vinculos"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clinical_condition_medication").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vínculo removido");
      qc.invalidateQueries({ queryKey: ["admin-vinculos-med"] });
      qc.invalidateQueries({ queryKey: ["vinculos"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const lista = useMemo(() => {
    const termo = normalizar(busca);
    return (vinculos.data ?? []).filter((item) => {
      const correspondeAmbiente = ambiente === "todos" || item.care_context === ambiente;
      const correspondeBusca =
        termo.length < 2 ||
        normalizar(item.condicao_nome).includes(termo) ||
        normalizar(item.medicamento?.principio_ativo ?? "").includes(termo);
      return correspondeAmbiente && correspondeBusca;
    });
  }, [ambiente, busca, vinculos.data]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4">
      <Helmet>
        <title>Medicamentos por patologia | PrescriMed</title>
        <meta
          name="description"
          content="Gerencie os vínculos revisáveis entre patologias e medicamentos do catálogo clínico."
        />
      </Helmet>

      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/app"><ArrowLeft className="mr-1 h-4 w-4" />Voltar</Link>
        </Button>
        <h1 className="text-lg font-semibold">Medicamentos por patologia</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Cobertura revisada</CardTitle>
          <CardDescription>Patologias com pelo menos um medicamento de primeira linha não inativo.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {["ambulatorial", "urgencia", "emergencia"].map((item) => {
            const valor = cobertura[item];
            return (
              <Badge key={item} variant="outline" className="text-xs">
                {LINK_CONTEXT_LABEL[item as LinkContext]}: {valor ? `${valor.com}/${valor.total}` : "—"}
              </Badge>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Novo vínculo</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <Input
            list="catalogo-patologias"
            placeholder="Patologia"
            value={novo.patologia}
            onChange={(event) => setNovo({ ...novo, patologia: event.target.value })}
          />
          <datalist id="catalogo-patologias">
            {(catalogos.data?.patologias ?? []).map((item) => (
              <option key={item.id} value={item.nome_patologia} />
            ))}
          </datalist>
          <Input
            list="catalogo-medicamentos"
            placeholder="Medicamento"
            value={novo.medicamento}
            onChange={(event) => setNovo({ ...novo, medicamento: event.target.value })}
          />
          <datalist id="catalogo-medicamentos">
            {(catalogos.data?.medicamentos ?? []).map((item) => (
              <option key={item.id} value={item.principio_ativo} />
            ))}
          </datalist>
          <Select
            value={novo.ambiente}
            onValueChange={(value) => setNovo({ ...novo, ambiente: value as LinkContext })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {AMBIENTES.map((item) => (
                <SelectItem key={item} value={item}>{LINK_CONTEXT_LABEL[item]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={novo.papel}
            onValueChange={(value) => setNovo({ ...novo, papel: value as LinkRole })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAPEIS.map((item) => (
                <SelectItem key={item} value={item}>{LINK_ROLE_LABEL[item]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="sm:col-span-2">
            <Button size="sm" onClick={() => criar.mutate()} disabled={criar.isPending || catalogos.isLoading}>
              {criar.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Vínculos cadastrados</CardTitle>
          <CardDescription>{vinculos.data?.length ?? 0} vínculos canônicos no banco.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Buscar patologia ou medicamento"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
              />
            </div>
            <Select value={ambiente} onValueChange={setAmbiente}>
              <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os ambientes</SelectItem>
                {AMBIENTES.map((item) => (
                  <SelectItem key={item} value={item}>{LINK_CONTEXT_LABEL[item]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[460px] pr-2">
            {(vinculos.isLoading || catalogos.isLoading) && (
              <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
            )}
            {!vinculos.isLoading && lista.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum vínculo encontrado.</p>
            )}
            <div className="space-y-2">
              {lista.map((item) => (
                <div key={item.id} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{item.condicao_nome}</div>
                    <div className="text-muted-foreground">
                      {item.medicamento?.principio_ativo ?? "Medicamento não encontrado"} · {LINK_ROLE_LABEL[item.papel]} · {LINK_CONTEXT_LABEL[item.care_context]}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {[
                        item.medicamento?.via_administracao,
                        item.medicamento?.dose_adulto_padrao,
                        item.medicamento?.dose_pediatrica_padrao,
                        item.medicamento?.duracao_padrao,
                      ].filter(Boolean).join(" · ") || "Dados de dose no cadastro do medicamento"}
                    </div>
                    <Badge variant={item.review_status === "reviewed" ? "secondary" : "outline"} className="mt-1 text-[10px]">
                      {LINK_STATUS_LABEL[item.review_status]}
                    </Badge>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Remover vínculo"
                    disabled={remover.isPending}
                    onClick={() => remover.mutate(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
