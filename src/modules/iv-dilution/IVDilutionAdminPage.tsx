import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Search, Pencil, Eye, FileSpreadsheet, Sparkles, FileText, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import IVMedicationFormDialog from "./IVMedicationFormDialog";
import IVMedicationDetailDialog from "./IVMedicationDetailDialog";
import IVAdminDashboard from "./admin/IVAdminDashboard";
import IVImportDialog from "./admin/IVImportDialog";
import IVAIExtractDialog from "./admin/IVAIExtractDialog";
import IVReviewQueue from "./admin/IVReviewQueue";
import IVTextsDialog from "./admin/IVTextsDialog";
import IVTextsBatchDialog from "./admin/IVTextsBatchDialog";
import { IVQualityBadges, IVReviewStatusBadge } from "./admin/IVQualityBadges";
import { isIncomplete, isOutdated } from "./lib/ivQualityRules";
import { useIVPermissions } from "./hooks/useIVPermissions";
import IVSynonymsTab from "./admin/IVSynonymsTab";
import IVCalcSettingsCard from "./admin/IVCalcSettingsCard";
import IVPediatricSettingsCard from "./admin/IVPediatricSettingsCard";
import PediatricDoseTab from "./admin/PediatricDoseTab";
import IVRenalHepaticSettingsCard from "./admin/IVRenalHepaticSettingsCard";
import RenalHepaticDoseTab from "./admin/RenalHepaticDoseTab";
import InteractionsAdminTab from "@/modules/interactions/admin/InteractionsAdminTab";
import ContraindicationsAdminTab from "@/modules/clinical-alerts/admin/ContraindicationsAdminTab";
import ProtocolsAdminTab from "@/modules/protocols/admin/ProtocolsAdminTab";
import TemplatesAdminTab from "@/modules/templates/admin/TemplatesAdminTab";
import HistoricoAdminTab from "@/modules/patient-history/admin/HistoricoAdminTab";
import SmartInputAdminTab from "@/modules/smart-input/admin/SmartInputAdminTab";
import DocumentsAdminTab from "@/modules/documents/admin/DocumentsAdminTab";
import AssinaturaDigitalSettingsCard from "@/modules/digital-signature/admin/AssinaturaDigitalSettingsCard";
import RevisaoBetaTab from "@/modules/beta/admin/RevisaoBetaTab";
import ConfiguracoesBetaTab from "@/modules/beta/admin/ConfiguracoesBetaTab";
import ChecklistBetaTab from "@/modules/beta/admin/ChecklistBetaTab";
import TestesClinicosPanel from "@/modules/clinical-tests/TestesClinicosPanel";
import BaseMedicamentosTab from "@/modules/medications-base/admin/BaseMedicamentosTab";
import ExpansaoBaseMedTab from "@/modules/medications-base/blocos/admin/ExpansaoBaseMedTab";
import ImportacaoBaseGeralTab from "@/modules/medications-base/import/admin/ImportacaoBaseGeralTab";
import ChecklistBaseMedTab from "@/modules/medications-base/admin/ChecklistBaseMedTab";
import PacoteBetaTab from "@/modules/medications-base/beta/PacoteBetaTab";
import QualidadeBaseTab from "@/modules/medications-base/qualidade/QualidadeBaseTab";
import TestesClinicosV2Panel from "@/modules/clinical-tests-v2/TestesClinicosV2Panel";
import HardeningBetaTab from "@/modules/beta/admin/hardening/HardeningBetaTab";
import LancamentoBetaTab from "@/modules/beta/admin/lancamento/LancamentoBetaTab";
import RevisaoFinalBetaTab from "@/modules/beta/admin/revisao-final/RevisaoFinalBetaTab";

export type IVMedication = {
  id: string;
  principio_ativo: string;
  nome_comercial_referencia: string | null;
  apresentacao: string | null;
  via_administracao: string;
  volume_reconstituicao: string | null;
  diluente_reconstituicao: string | null;
  estabilidade_apos_reconstituicao: string | null;
  solucoes_compativeis: string[];
  volume_diluicao: string | null;
  estabilidade_apos_diluicao: string | null;
  concentracao_maxima: string | null;
  tempo_minimo_infusao: string | null;
  velocidade_maxima_infusao: string | null;
  ph: string | null;
  observacoes_gerais: string | null;
  risco_flebite: boolean;
  exige_fotoprotecao: boolean;
  exige_equipo_fotossensivel: boolean;
  exige_filtro: boolean;
  incompatibilidades: string[];
  volume_expansao_pos_reconstituicao: string | null;
  nivel_alerta: "baixo" | "medio" | "alto";
  alerta_medico: string | null;
  alerta_enfermagem_farmacia: string | null;
  fonte_referencia: string | null;
  data_atualizacao: string;
  status_revisao?: string | null;
  observacao_revisao?: string | null;
};

const alertVariant = (n: string) =>
  n === "alto" ? "bg-destructive/10 text-destructive border-destructive/30"
  : n === "medio" ? "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400"
  : "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400";

export default function IVDilutionAdminPage() {
  const perms = useIVPermissions();
  const [items, setItems] = useState<IVMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAlerta, setFilterAlerta] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterFoto, setFilterFoto] = useState<string>("all");
  const [filterFiltro, setFilterFiltro] = useState<string>("all");
  const [filterIncomp, setFilterIncomp] = useState<string>("all");
  const [filterQualidade, setFilterQualidade] = useState<string>("all");
  const [editing, setEditing] = useState<IVMedication | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<IVMedication | null>(null);
  const [importing, setImporting] = useState(false);
  const [aiExtracting, setAiExtracting] = useState(false);
  const [textsFor, setTextsFor] = useState<IVMedication | null>(null);
  const [batchTexts, setBatchTexts] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("iv_medications")
      .select("*")
      .order("principio_ativo", { ascending: true });
    if (error) toast.error("Erro ao carregar medicamentos");
    setItems((data as IVMedication[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return items.filter((m) => {
      if (search && !m.principio_ativo.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterAlerta !== "all" && m.nivel_alerta !== filterAlerta) return false;
      if (filterStatus !== "all" && (m.status_revisao ?? "aguardando_revisao") !== filterStatus) return false;
      if (filterFoto === "yes" && !m.exige_fotoprotecao) return false;
      if (filterFiltro === "yes" && !m.exige_filtro) return false;
      if (filterIncomp === "yes" && (m.incompatibilidades?.length ?? 0) === 0) return false;
      if (filterQualidade === "incompletos" && !isIncomplete(m)) return false;
      if (filterQualidade === "desatualizados" && !isOutdated(m)) return false;
      return true;
    });
  }, [items, search, filterAlerta, filterStatus, filterFoto, filterFiltro, filterIncomp, filterQualidade]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Button asChild variant="ghost" size="icon">
              <Link to="/app"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold truncate">Base de Diluição IV</h1>
              <p className="text-xs text-muted-foreground">Gestão, importação e revisão de medicamentos intravenosos</p>
            </div>
          </div>
          {perms.canEdit && (
            <Button onClick={() => setCreating(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Novo
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-4">
        <IVAdminDashboard items={items} />

        <Tabs defaultValue="catalogo">
          <TabsList>
            <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
            <TabsTrigger value="base-geral">Base Geral</TabsTrigger>
            <TabsTrigger value="expansao-base">Expansão da Base</TabsTrigger>
           <TabsTrigger value="checklist-base">Checklist Base</TabsTrigger>
            <TabsTrigger value="pacote-beta">Pacote Beta Med.</TabsTrigger>
            <TabsTrigger value="qualidade-base">Qualidade da Base</TabsTrigger>
           <TabsTrigger value="importacao-base-geral">Importação da Base Geral</TabsTrigger>
            <TabsTrigger value="importacao">Importação e Revisão</TabsTrigger>
            <TabsTrigger value="fila">Fila de revisão</TabsTrigger>
            <TabsTrigger value="sinonimos">Sinônimos e nomes comerciais</TabsTrigger>
            <TabsTrigger value="pediatrico">Dose Pediátrica</TabsTrigger>
            <TabsTrigger value="renal-hepatico">Renal/Hepático</TabsTrigger>
            <TabsTrigger value="interacoes">Interações</TabsTrigger>
            <TabsTrigger value="alergias">Alergias e Condições</TabsTrigger>
            <TabsTrigger value="protocolos">Protocolos</TabsTrigger>
            <TabsTrigger value="modelos">Modelos & Favoritos</TabsTrigger>
            <TabsTrigger value="historico">Histórico do Paciente</TabsTrigger>
            <TabsTrigger value="entrada-inteligente">Entrada Inteligente</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="assinatura">Assinatura Digital</TabsTrigger>
            <TabsTrigger value="testes-clinicos">Testes Clínicos</TabsTrigger>
            <TabsTrigger value="testes-clinicos-22g">Testes Clínicos+</TabsTrigger>
            <TabsTrigger value="revisao-beta">Revisão Beta</TabsTrigger>
            <TabsTrigger value="config-beta">Config. Beta</TabsTrigger>
            <TabsTrigger value="checklist-beta">Checklist Beta</TabsTrigger>
            <TabsTrigger value="hardening-beta">Hardening Beta</TabsTrigger>
            <TabsTrigger value="lancamento-beta">Lançamento Beta</TabsTrigger>
            <TabsTrigger value="revisao-final-beta">Revisão Final 22J</TabsTrigger>
          </TabsList>


          <TabsContent value="catalogo" className="space-y-4 pt-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Pesquisa e filtros</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar princípio ativo…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={filterAlerta} onValueChange={setFilterAlerta}>
                  <SelectTrigger><SelectValue placeholder="Nível de alerta" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os alertas</SelectItem>
                    <SelectItem value="alto">Alerta alto</SelectItem>
                    <SelectItem value="medio">Alerta médio</SelectItem>
                    <SelectItem value="baixo">Alerta baixo</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger><SelectValue placeholder="Status revisão" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="aguardando_revisao">Aguardando revisão</SelectItem>
                    <SelectItem value="revisado">Revisado</SelectItem>
                    <SelectItem value="precisa_corrigir">Precisa corrigir</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterQualidade} onValueChange={setFilterQualidade}>
                  <SelectTrigger><SelectValue placeholder="Qualidade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Qualidade (todos)</SelectItem>
                    <SelectItem value="incompletos">Dados incompletos</SelectItem>
                    <SelectItem value="desatualizados">Fonte desatualizada</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterFoto} onValueChange={setFilterFoto}>
                  <SelectTrigger><SelectValue placeholder="Fotoproteção" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Fotoproteção (todos)</SelectItem>
                    <SelectItem value="yes">Exige fotoproteção</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterFiltro} onValueChange={setFilterFiltro}>
                  <SelectTrigger><SelectValue placeholder="Filtro" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Filtro (todos)</SelectItem>
                    <SelectItem value="yes">Exige filtro</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterIncomp} onValueChange={setFilterIncomp}>
                  <SelectTrigger><SelectValue placeholder="Incompatibilidade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Incompatibilidade (todos)</SelectItem>
                    <SelectItem value="yes">Tem incompatibilidade</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Princípio ativo</TableHead>
                      <TableHead className="hidden md:table-cell">Apresentação</TableHead>
                      <TableHead className="hidden lg:table-cell">Soluções</TableHead>
                      <TableHead className="hidden lg:table-cell">Conc. máx.</TableHead>
                      <TableHead>Alerta</TableHead>
                      <TableHead className="hidden sm:table-cell">Status</TableHead>
                      <TableHead className="hidden xl:table-cell">Qualidade</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Carregando…</TableCell></TableRow>
                    ) : filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum medicamento encontrado.</TableCell></TableRow>
                    ) : filtered.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="font-medium">{m.principio_ativo}</div>
                          {m.nome_comercial_referencia && <div className="text-xs text-muted-foreground">{m.nome_comercial_referencia}</div>}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{m.apresentacao ?? "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{m.solucoes_compativeis.join(", ") || "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{m.concentracao_maxima ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={alertVariant(m.nivel_alerta)}>
                            {m.nivel_alerta === "alto" ? "Alerta alto" : m.nivel_alerta === "medio" ? "Alerta médio" : "Alerta baixo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell"><IVReviewStatusBadge status={m.status_revisao} /></TableCell>
                        <TableCell className="hidden xl:table-cell"><IVQualityBadges med={m} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" onClick={() => setViewing(m)}>
                              <Eye className="h-4 w-4 mr-1" /> Detalhes
                            </Button>
                            <Button size="icon" variant="ghost" title="Textos e orientações" onClick={() => setTextsFor(m)}>
                              <FileText className="h-4 w-4" />
                            </Button>
                            {perms.canEdit && (
                              <Button size="icon" variant="ghost" onClick={() => setEditing(m)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="importacao" className="space-y-3 pt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Importação e Revisão de Medicamentos IV</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="h-auto py-4 flex-col items-start gap-1" disabled={!perms.canEdit} onClick={() => setCreating(true)}>
                  <span className="flex items-center gap-2 font-medium"><Plus className="h-4 w-4" /> Cadastro manual</span>
                  <span className="text-xs text-muted-foreground font-normal text-left">Formulário dividido por seções</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col items-start gap-1" disabled={!perms.canImport} onClick={() => setImporting(true)}>
                  <span className="flex items-center gap-2 font-medium"><FileSpreadsheet className="h-4 w-4" /> Importar planilha</span>
                  <span className="text-xs text-muted-foreground font-normal text-left">CSV ou XLSX, com prévia e dedupe</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col items-start gap-1" disabled={!perms.canEdit} onClick={() => setAiExtracting(true)}>
                  <span className="flex items-center gap-2 font-medium"><Sparkles className="h-4 w-4" /> Extrair com IA</span>
                  <span className="text-xs text-muted-foreground font-normal text-left">Cole um texto e a IA preenche</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col items-start gap-1" disabled={!perms.canEdit} onClick={() => setBatchTexts(true)}>
                  <span className="flex items-center gap-2 font-medium"><Wand2 className="h-4 w-4" /> Gerar textos em lote</span>
                  <span className="text-xs text-muted-foreground font-normal text-left">Alertas e orientações automáticos</span>
                </Button>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground">
              Itens importados ou criados pela IA entram com status <em>aguardando revisão</em>.
            </p>
            <IVCalcSettingsCard canEdit={perms.isAdmin} />
            <IVPediatricSettingsCard canEdit={perms.isAdmin} />
          </TabsContent>

          <TabsContent value="fila" className="pt-4">
            <IVReviewQueue items={items} canReview={perms.canApprove} onChanged={load} />
          </TabsContent>

          <TabsContent value="sinonimos" className="pt-4">
            <IVSynonymsTab items={items} canEdit={perms.canEdit} canApprove={perms.canApprove} onChanged={load} />
          </TabsContent>

          <TabsContent value="pediatrico" className="pt-4">
            <PediatricDoseTab items={items as any} canEdit={perms.canEdit} onChanged={load} />
          </TabsContent>

          <TabsContent value="interacoes" className="pt-4">
            <InteractionsAdminTab canEdit={perms.canEdit} isAdmin={perms.isAdmin} />
          </TabsContent>

          <TabsContent value="alergias" className="pt-4">
            <ContraindicationsAdminTab canEdit={perms.canEdit} isAdmin={perms.isAdmin} />
          </TabsContent>

          <TabsContent value="protocolos" className="pt-4">
            <ProtocolsAdminTab canEdit={perms.canEdit} isAdmin={perms.isAdmin} />
          </TabsContent>

          <TabsContent value="modelos" className="pt-4">
            <TemplatesAdminTab canEdit={perms.canEdit} isAdmin={perms.isAdmin} />
          </TabsContent>

          <TabsContent value="historico" className="pt-4">
            <HistoricoAdminTab />
          </TabsContent>

          <TabsContent value="entrada-inteligente" className="pt-4">
            <SmartInputAdminTab canEdit={perms.canEdit} isAdmin={perms.isAdmin} />
          </TabsContent>

          <TabsContent value="documentos" className="pt-4">
            <DocumentsAdminTab canEdit={perms.canEdit} isAdmin={perms.isAdmin} />
          </TabsContent>

          <TabsContent value="assinatura" className="pt-4">
            <AssinaturaDigitalSettingsCard />
          </TabsContent>

          <TabsContent value="testes-clinicos" className="pt-4">
            <TestesClinicosPanel />
          </TabsContent>

          <TabsContent value="testes-clinicos-22g" className="pt-4">
            <TestesClinicosV2Panel />
          </TabsContent>

          <TabsContent value="revisao-beta" className="pt-4">
            <RevisaoBetaTab />
          </TabsContent>

          <TabsContent value="config-beta" className="pt-4">
            <ConfiguracoesBetaTab />
          </TabsContent>

          <TabsContent value="checklist-beta" className="pt-4">
            <ChecklistBetaTab />
          </TabsContent>

          <TabsContent value="base-geral" className="pt-4">
            <BaseMedicamentosTab canEdit={perms.canEdit} isAdmin={perms.isAdmin} />
          </TabsContent>

          <TabsContent value="checklist-base" className="pt-4">
            <ChecklistBaseMedTab />
          </TabsContent>

          <TabsContent value="expansao-base" className="pt-4">
            <ExpansaoBaseMedTab />
          </TabsContent>

          <TabsContent value="importacao-base-geral" className="pt-4">
            <ImportacaoBaseGeralTab canImport={perms.canImport} isAdmin={perms.isAdmin} />
          </TabsContent>

          <TabsContent value="pacote-beta" className="pt-4">
            <PacoteBetaTab />
          </TabsContent>

          <TabsContent value="qualidade-base" className="pt-4">
            <QualidadeBaseTab />
          </TabsContent>

          <TabsContent value="hardening-beta" className="pt-4">
            <HardeningBetaTab />
          </TabsContent>

          <TabsContent value="lancamento-beta" className="pt-4">
            <LancamentoBetaTab />
          </TabsContent>

          <TabsContent value="revisao-final-beta" className="pt-4">
            <RevisaoFinalBetaTab />
          </TabsContent>
        </Tabs>


        <p className="text-xs text-muted-foreground pt-4 border-t">
          Apoio à decisão clínica. Validar conforme protocolo institucional, farmácia clínica e condições do paciente.
        </p>
      </main>

      {(creating || editing) && (
        <IVMedicationFormDialog
          open={creating || !!editing}
          initial={editing ?? undefined}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); load(); }}
        />
      )}
      {viewing && (
        <IVMedicationDetailDialog medication={viewing} open={!!viewing} onClose={() => setViewing(null)} />
      )}
      <IVImportDialog open={importing} onClose={() => setImporting(false)} onImported={load} />
      <IVAIExtractDialog open={aiExtracting} onClose={() => setAiExtracting(false)} onSaved={load} />
      {textsFor && (
        <IVTextsDialog
          medication={textsFor as any}
          open={!!textsFor}
          onClose={() => setTextsFor(null)}
          onSaved={load}
          canEdit={perms.canEdit}
          canApprove={perms.canApprove}
        />
      )}
      <IVTextsBatchDialog open={batchTexts} onClose={() => setBatchTexts(false)} items={items as any} onDone={load} />
    </div>
  );
}
