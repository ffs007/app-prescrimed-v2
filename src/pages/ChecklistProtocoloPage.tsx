import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Activity,
  ArrowLeft,
  ClipboardList,
  Download,
  FlaskConical,
  Loader2,
  Pill,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LOTE_ID = "medflow_ps_v1";

const ICONE_TIPO: Record<string, typeof Pill> = {
  medicamento: Pill,
  exame: FlaskConical,
  monitorizacao: Activity,
  conduta: ClipboardList,
};

const variantePorObrigatoriedade = (v: string | null) =>
  v === "essencial" ? "destructive" : v === "recomendado" ? "default" : "secondary";

const varianteRestricao = (tipo: string) =>
  tipo === "contraindicacao" ? "destructive" : tipo === "limite_maximo" ? "default" : "secondary";

const ROTULO_RESTRICAO: Record<string, string> = {
  contraindicacao: "contraindicação",
  cautela: "cautela",
  limite_maximo: "limite máximo",
};

interface ItemChecklist {
  id: string;
  nome_patologia: string;
  etapa_ordem: number;
  etapa_titulo: string;
  item_tipo: string;
  item_nome: string;
  detalhe: string | null;
  obrigatoriedade: string | null;
  tempo_alvo_min: number | null;
  observacao: string | null;
}

export default function ChecklistProtocoloPage() {
  const [busca, setBusca] = useState("");
  const [filtroMedicamento, setFiltroMedicamento] = useState("");
  const [filtroExame, setFiltroExame] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [feitos, setFeitos] = useState<Record<string, boolean>>({});

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["checklist-protocolo", LOTE_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stg_protocolo_checklist")
        .select("id, nome_patologia, etapa_ordem, etapa_titulo, item_tipo, item_nome, detalhe, obrigatoriedade, tempo_alvo_min, observacao")
        .eq("lote_id", LOTE_ID)
        .eq("ativo", true)
        .order("etapa_ordem", { ascending: true })
        .order("item_nome", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ItemChecklist[];
    },
  });

  const patologias = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const med = filtroMedicamento.trim().toLowerCase();
    const exame = filtroExame.trim().toLowerCase();

    const nomes = Array.from(new Set(itens.map((i) => i.nome_patologia))).sort((a, b) => a.localeCompare(b));

    return nomes.filter((nome) => {
      if (termo && !nome.toLowerCase().includes(termo)) return false;
      const daPatologia = itens.filter((i) => i.nome_patologia === nome);
      if (
        med &&
        !daPatologia.some((i) => i.item_tipo === "medicamento" && i.item_nome.toLowerCase().includes(med))
      )
        return false;
      if (
        exame &&
        !daPatologia.some(
          (i) => (i.item_tipo === "exame" || i.item_tipo === "monitorizacao") && i.item_nome.toLowerCase().includes(exame),
        )
      )
        return false;
      return true;
    });
  }, [itens, busca, filtroMedicamento, filtroExame]);

  const patologiaAtiva = selecionada && patologias.includes(selecionada) ? selecionada : patologias[0] ?? null;

  const itensDaPatologia = useMemo(
    () => itens.filter((i) => i.nome_patologia === patologiaAtiva),
    [itens, patologiaAtiva],
  );

  const itensVisiveis = useMemo(() => {
    const med = filtroMedicamento.trim().toLowerCase();
    const exame = filtroExame.trim().toLowerCase();
    return itensDaPatologia.filter((i) => {
      if (filtroTipo !== "todos" && i.item_tipo !== filtroTipo) return false;
      if (med && i.item_tipo === "medicamento" && !i.item_nome.toLowerCase().includes(med)) return false;
      if (
        exame &&
        (i.item_tipo === "exame" || i.item_tipo === "monitorizacao") &&
        !i.item_nome.toLowerCase().includes(exame)
      )
        return false;
      return true;
    });
  }, [itensDaPatologia, filtroTipo, filtroMedicamento, filtroExame]);

  const etapas = useMemo(() => {
    const mapa = new Map<string, { ordem: number; titulo: string; itens: ItemChecklist[] }>();
    for (const item of itensVisiveis) {
      const chave = `${item.etapa_ordem}-${item.etapa_titulo}`;
      if (!mapa.has(chave)) mapa.set(chave, { ordem: item.etapa_ordem, titulo: item.etapa_titulo, itens: [] });
      mapa.get(chave)!.itens.push(item);
    }
    return Array.from(mapa.values()).sort((a, b) => a.ordem - b.ordem);
  }, [itensVisiveis]);

  const medicamentosDaPatologia = useMemo(
    () => Array.from(new Set(itensDaPatologia.filter((i) => i.item_tipo === "medicamento").map((i) => i.item_nome))),
    [itensDaPatologia],
  );

  const { data: posologias = [] } = useQuery({
    queryKey: ["posologias", medicamentosDaPatologia],
    enabled: medicamentosDaPatologia.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stg_med_posologia")
        .select("*")
        .eq("lote_id", LOTE_ID)
        .in("principio_ativo", medicamentosDaPatologia)
        .order("principio_ativo");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: restricoes = [] } = useQuery({
    queryKey: ["restricoes-dose", medicamentosDaPatologia],
    enabled: medicamentosDaPatologia.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stg_med_restricoes")
        .select("*")
        .eq("lote_id", LOTE_ID)
        .eq("ativo", true)
        .in("principio_ativo", medicamentosDaPatologia)
        .order("principio_ativo");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: monitoramentos = [] } = useQuery({
    queryKey: ["monitoramentos", medicamentosDaPatologia],
    enabled: medicamentosDaPatologia.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stg_med_exames_monitoramento")
        .select("*")
        .eq("lote_id", LOTE_ID)
        .in("principio_ativo", medicamentosDaPatologia)
        .order("principio_ativo");
      if (error) throw error;
      return data ?? [];
    },
  });

  const total = itensDaPatologia.length;
  const concluidos = itensDaPatologia.filter((i) => feitos[i.id]).length;
  const progresso = total ? Math.round((concluidos / total) * 100) : 0;

  const gerarPDF = () => {
    if (!patologiaAtiva) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margem = 40;
    let y = margem;

    doc.setFontSize(16);
    doc.text("Checklist de Protocolo Clínico", margem, y);
    y += 20;
    doc.setFontSize(12);
    doc.text(patologiaAtiva, margem, y);
    y += 16;
    doc.setFontSize(9);
    doc.text(
      `Lote ${LOTE_ID} · ${concluidos}/${total} itens concluídos · gerado em ${new Date().toLocaleString("pt-BR")}`,
      margem,
      y,
    );
    y += 14;

    autoTable(doc, {
      startY: y,
      head: [["", "Etapa", "Item", "Tipo", "Obrigatoriedade", "Detalhe"]],
      body: etapas.flatMap((etapa) =>
        etapa.itens.map((i) => [
          feitos[i.id] ? "[x]" : "[ ]",
          `${etapa.ordem}. ${etapa.titulo}`,
          i.item_nome,
          i.item_tipo,
          i.obrigatoriedade ?? "recomendado",
          i.detalhe ?? "",
        ]),
      ),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59] },
      columnStyles: { 0: { cellWidth: 18 }, 5: { cellWidth: 150 } },
    });

    if (posologias.length > 0) {
      autoTable(doc, {
        head: [["Princípio ativo", "Via", "Dose", "Frequência", "Dose máx.", "Restrições"]],
        body: posologias.map((p) => [
          p.principio_ativo ?? "",
          p.via ?? "",
          p.dose_padrao ?? "",
          p.frequencia ?? "—",
          p.dose_maxima ?? "—",
          p.restricoes ?? "—",
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [30, 41, 59] },
        margin: { top: 20 },
      });
    }

    if (restricoes.length > 0) {
      autoTable(doc, {
        head: [["Princípio ativo", "Tipo", "Descrição", "Limite máximo", "Conduta"]],
        body: restricoes.map((r) => [
          r.principio_ativo ?? "",
          ROTULO_RESTRICAO[r.tipo_restricao] ?? r.tipo_restricao,
          r.descricao ?? "",
          r.limite_maximo_valor != null
            ? `${r.limite_maximo_valor} ${r.limite_maximo_unidade ?? ""} / ${r.limite_periodo ?? "—"}`
            : "—",
          r.conduta ?? "—",
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [127, 29, 29] },
        margin: { top: 20 },
      });
    }

    doc.save(`checklist-${patologiaAtiva.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Helmet>
        <title>Checklist de Protocolo Clínico | PrescriMed</title>
        <meta
          name="description"
          content="Checklist passo a passo por patologia com exames, medicamentos, posologia padrão, restrições e monitorização."
        />
      </Helmet>

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/" aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Checklist de Protocolo Clínico</h1>
            <p className="text-sm text-muted-foreground">
              Execução passo a passo por patologia: exames, medicamentos, posologia, restrições e monitorização.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/admin/revisao-doses">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Revisão de doses
            </Link>
          </Button>
          <Button onClick={gerarPDF} disabled={!patologiaAtiva}>
            <Download className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Busca e filtros</CardTitle>
            <CardDescription>Encontre por patologia, medicamento ou exame recomendado.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Patologia..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <Input
              placeholder="Medicamento..."
              value={filtroMedicamento}
              onChange={(e) => setFiltroMedicamento(e.target.value)}
            />
            <Input placeholder="Exame recomendado..." value={filtroExame} onChange={(e) => setFiltroExame(e.target.value)} />
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="medicamento">Medicamentos</SelectItem>
                <SelectItem value="exame">Exames</SelectItem>
                <SelectItem value="monitorizacao">Monitorização</SelectItem>
                <SelectItem value="conduta">Condutas</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Patologias</CardTitle>
              <CardDescription>{patologias.length} encontradas</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[60vh] pr-2">
                  <div className="space-y-1">
                    {patologias.map((nome) => (
                      <button
                        key={nome}
                        onClick={() => setSelecionada(nome)}
                        className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          nome === patologiaAtiva ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                      >
                        {nome}
                      </button>
                    ))}
                    {patologias.length === 0 && (
                      <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma patologia encontrada.</p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {patologiaAtiva && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>{patologiaAtiva}</CardTitle>
                    <CardDescription>
                      {concluidos} de {total} itens concluídos
                      {itensVisiveis.length !== total && ` · ${itensVisiveis.length} exibidos pelos filtros`}
                    </CardDescription>
                    <Progress value={progresso} className="mt-2" />
                  </CardHeader>
                </Card>

                {etapas.map((etapa) => (
                  <Card key={`${etapa.ordem}-${etapa.titulo}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        Etapa {etapa.ordem} · {etapa.titulo}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {etapa.itens.map((item) => {
                        const Icone = ICONE_TIPO[item.item_tipo] ?? ClipboardList;
                        return (
                          <div key={item.id} className="flex items-start gap-3 rounded-md border p-3">
                            <Checkbox
                              checked={!!feitos[item.id]}
                              onCheckedChange={(v) => setFeitos((p) => ({ ...p, [item.id]: !!v }))}
                              className="mt-1"
                            />
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Icone className="h-4 w-4 text-muted-foreground" />
                                <span className={`font-medium ${feitos[item.id] ? "line-through text-muted-foreground" : ""}`}>
                                  {item.item_nome}
                                </span>
                                <Badge variant={variantePorObrigatoriedade(item.obrigatoriedade)}>
                                  {item.obrigatoriedade ?? "recomendado"}
                                </Badge>
                                {item.tempo_alvo_min != null && (
                                  <Badge variant="outline">até {item.tempo_alvo_min} min</Badge>
                                )}
                              </div>
                              {item.detalhe && <p className="text-sm text-muted-foreground">{item.detalhe}</p>}
                              {item.observacao && item.observacao !== "NAO_NA_FONTE" && (
                                <p className="text-xs text-muted-foreground">Se alterado: {item.observacao}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {etapa.itens.length === 0 && (
                        <p className="text-sm text-muted-foreground">Nenhum item nesta etapa com os filtros atuais.</p>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {posologias.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Posologia padrão e ajustes</CardTitle>
                      <CardDescription>Doses de referência dos medicamentos deste protocolo</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Princípio ativo</TableHead>
                            <TableHead>Via</TableHead>
                            <TableHead>Dose</TableHead>
                            <TableHead>Frequência</TableHead>
                            <TableHead>Dose máx.</TableHead>
                            <TableHead>Ajustes</TableHead>
                            <TableHead>Restrições</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {posologias.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium">
                                {p.principio_ativo}
                                {p.alto_risco && (
                                  <Badge variant="destructive" className="ml-2">
                                    alto risco
                                  </Badge>
                                )}
                                {p.indicacao && <p className="text-xs text-muted-foreground">{p.indicacao}</p>}
                              </TableCell>
                              <TableCell>{p.via}</TableCell>
                              <TableCell>{p.dose_padrao}</TableCell>
                              <TableCell>{p.frequencia ?? "—"}</TableCell>
                              <TableCell>{p.dose_maxima ?? "—"}</TableCell>
                              <TableCell className="text-xs">
                                <p>Renal: {p.ajuste_renal ?? "—"}</p>
                                <p>Hepático: {p.ajuste_hepatico ?? "—"}</p>
                                <p>Idoso: {p.ajuste_idoso ?? "—"}</p>
                                <p>Pediátrico: {p.ajuste_pediatrico ?? "—"}</p>
                              </TableCell>
                              <TableCell className="text-xs">{p.restricoes ?? "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <Separator className="my-4" />
                      <p className="text-xs text-muted-foreground">
                        Doses de referência para adultos; sempre confirmar com o contexto clínico do paciente.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {restricoes.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                        Restrições clínicas das doses
                      </CardTitle>
                      <CardDescription>Contraindicações, cautelas e limites máximos cumulativos</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Princípio ativo</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Limite máximo</TableHead>
                            <TableHead>Conduta</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {restricoes.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-medium">
                                {r.principio_ativo}
                                <p className="text-xs text-muted-foreground">
                                  {[r.via, r.populacao].filter(Boolean).join(" · ")}
                                </p>
                              </TableCell>
                              <TableCell>
                                <Badge variant={varianteRestricao(r.tipo_restricao)}>
                                  {ROTULO_RESTRICAO[r.tipo_restricao] ?? r.tipo_restricao}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs">{r.descricao}</TableCell>
                              <TableCell className="text-xs">
                                {r.limite_maximo_valor != null
                                  ? `${r.limite_maximo_valor} ${r.limite_maximo_unidade ?? ""} / ${r.limite_periodo ?? "—"}`
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-xs">{r.conduta ?? "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {monitoramentos.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Exames e monitorização por medicamento</CardTitle>
                      <CardDescription>Controles antes, durante e após a administração</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Medicamento</TableHead>
                            <TableHead>Exame / controle</TableHead>
                            <TableHead>Momento</TableHead>
                            <TableHead>Frequência</TableHead>
                            <TableHead>Alvo</TableHead>
                            <TableHead>Se alterado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {monitoramentos.map((m) => (
                            <TableRow key={m.id}>
                              <TableCell className="font-medium">{m.principio_ativo}</TableCell>
                              <TableCell>{m.nome_exame}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{m.tipo_monitoramento}</Badge>
                              </TableCell>
                              <TableCell>{m.frequencia ?? "—"}</TableCell>
                              <TableCell className="text-xs">{m.parametro_alvo ?? "—"}</TableCell>
                              <TableCell className="text-xs">{m.conduta_se_alterado ?? "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {!isLoading && !patologiaAtiva && (
              <Card>
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  Nenhum checklist encontrado com os filtros atuais.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
