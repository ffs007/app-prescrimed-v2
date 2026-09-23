/**
 * Bancada de Notificação Compulsória: escolha do agravo, ficha específica,
 * campos internos da instituição, conferência de obrigatórios e prazos,
 * emissão em PDF e histórico com situação de envio.
 */
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  BookmarkPlus,
  Check,
  Clock,
  Eraser,
  FileDown,
  Plus,
  Printer,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { printHtml, downloadHtml } from "@/modules/documents/lib/pdfPrint";
import { persistFormDocument } from "@/modules/documents/lib/persistEmission";
import { useEmissionHistory } from "@/modules/prescription/hooks/useEmissionHistory";
import {
  AGRAVOS,
  buildNotifHtml,
  notifToText,
  prazoLabel,
  searchAgravos,
  type NotifField,
} from "./lib/notificationSpec";
import {
  saveNotifDefaults,
  readNotifDefaults,
  useNotificationWorkbench,
} from "./hooks/useNotificationWorkbench";
import {
  STATUS_LABEL,
  useNotificationRecords,
  type NotifStatus,
} from "./hooks/useNotificationRecords";

interface Props {
  /** Agravo sugerido pela patologia do atendimento. */
  initialAgravoId?: string;
}

const STATUS_ORDER: NotifStatus[] = ["pendente", "enviado", "confirmado"];

export default function NotificationWorkbench({ initialAgravoId }: Props) {
  const wb = useNotificationWorkbench();
  const registros = useNotificationRecords();
  const { history: emissions } = useEmissionHistory();

  const [busca, setBusca] = useState("");
  const [newFieldSection, setNewFieldSection] = useState<string | null>(null);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<NotifField["type"]>("text");
  const [statusFiltro, setStatusFiltro] = useState<NotifStatus | "todos">("todos");

  useEffect(() => {
    if (initialAgravoId && !wb.agravoId) wb.setAgravoId(initialAgravoId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAgravoId]);

  const encontrados = useMemo(() => searchAgravos(busca), [busca]);

  const html = useMemo(
    () => buildNotifHtml(wb.sections, wb.data, wb.agravo),
    [wb.sections, wb.data, wb.agravo],
  );

  const addField = () => {
    if (!newFieldSection || !newFieldLabel.trim()) return;
    const key = `inst_${newFieldLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now().toString(36)}`;
    wb.addCustomField(newFieldSection, { key, label: newFieldLabel.trim(), type: newFieldType, half: newFieldType !== "textarea" });
    setNewFieldLabel("");
    setNewFieldSection(null);
  };

  /** Registra a ficha em documentos_gerados antes de deixá-la sair. Sem registro, não imprime nem baixa. */
  const registerEmission = async (acao: "imprimiu" | "baixou"): Promise<boolean> => {
    if (!wb.agravo) {
      toast({ title: "Escolha o agravo", description: "Selecione a doença ou evento notificado.", variant: "destructive" });
      return false;
    }
    try {
      await persistFormDocument({
        tipo: "notificacao_compulsoria",
        titulo: `Notificação compulsória — ${String(wb.data.outroAgravoNome || wb.agravo.nome)}`,
        resumo: notifToText(wb.sections, wb.data),
        campos: wb.data,
        acao,
      });
      return true;
    } catch (err) {
      console.error("[NotificationWorkbench.registrarEmissao]", err);
      toast({
        title: "Notificação não registrada — emissão cancelada",
        description: "Verifique a conexão e tente novamente. Nenhum documento é emitido sem registro.",
        variant: "destructive",
      });
      return false;
    }
  };

  const registrar = async () => {
    if (!wb.agravo) {
      toast({ title: "Escolha o agravo", description: "Selecione a doença ou evento notificado.", variant: "destructive" });
      return;
    }
    try {
      await registros.create({
        agravo_id: wb.agravo.id,
        agravo: String(wb.data.outroAgravoNome || wb.agravo.nome),
        paciente_nome: String(wb.data.pacienteNome ?? ""),
        cid: String(wb.data.cid ?? ""),
        classificacao: String(wb.data.classificacao ?? ""),
        imediata: wb.agravo.prazoHoras === 24,
        prazo_horas: wb.agravo.prazoHoras,
        data_sintomas: String(wb.data.dataSintomas ?? "") || null,
        dados: wb.data,
        texto: notifToText(wb.sections, wb.data),
      });
      toast({ title: "Notificação registrada", description: "Ela aparece no histórico como pendente até o envio à vigilância." });
    } catch (e) {
      toast({ title: "Não foi possível registrar", description: (e as Error).message, variant: "destructive" });
    }
  };

  const renderField = (sectionId: string, f: NotifField) => {
    const v = wb.data[f.key];
    const faltando = f.required && !(f.type === "checkbox" ? v === true : String(v ?? "").trim());
    const wrap = f.half ? "" : "sm:col-span-2";

    return (
      <div key={f.key} className={`space-y-1.5 ${wrap}`}>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={f.key} className="text-xs">
            {f.label}
            {f.required && <span className="ml-1 text-destructive">*</span>}
          </Label>
          {f.custom && (
            <button
              type="button"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => wb.removeCustomField(sectionId, f.key)}
              aria-label={`Remover campo ${f.label}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {f.type === "textarea" ? (
          <Textarea
            id={f.key}
            value={String(v ?? "")}
            onChange={(e) => wb.setField(f.key, e.target.value)}
            placeholder={f.placeholder}
            rows={3}
            className={faltando ? "border-destructive" : undefined}
          />
        ) : f.type === "select" ? (
          <select
            id={f.key}
            value={String(v ?? "")}
            onChange={(e) => wb.setField(f.key, e.target.value)}
            className={`h-10 w-full rounded-md border bg-background px-2 text-sm ${faltando ? "border-destructive" : "border-input"}`}
          >
            {f.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : f.type === "checkbox" ? (
          <div className="flex h-10 items-center gap-2">
            <Checkbox id={f.key} checked={v === true} onCheckedChange={(c) => wb.setField(f.key, c === true)} />
            <span className="text-sm text-muted-foreground">{f.hint ?? "Sim"}</span>
          </div>
        ) : (
          <Input
            id={f.key}
            type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
            value={String(v ?? "")}
            onChange={(e) => wb.setField(f.key, e.target.value)}
            placeholder={f.placeholder}
            className={faltando ? "border-destructive" : undefined}
          />
        )}
        {f.hint && f.type !== "checkbox" && <p className="text-[11px] text-muted-foreground">{f.hint}</p>}
      </div>
    );
  };

  const registrosFiltrados = registros.records.filter(
    (r) => statusFiltro === "todos" || r.status === statusFiltro,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        {/* Escolha do agravo -------------------------------------------- */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4" /> Agravo de notificação compulsória
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por doença ou evento (dengue, sífilis, tuberculose, violência, vacina…)"
              className="h-10"
            />
            <div className="flex flex-wrap gap-1.5">
              {encontrados.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => wb.setAgravoId(a.id)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    wb.agravoId === a.id
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "hover:bg-accent"
                  }`}
                >
                  {a.nome}
                  {a.prazoHoras === 24 && <span className="ml-1 text-destructive">24h</span>}
                </button>
              ))}
              {encontrados.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhum agravo encontrado — use “Outro agravo da lista nacional”.
                </p>
              )}
            </div>

            {wb.agravo && (
              <div
                className={`rounded-md border p-3 text-xs leading-relaxed ${
                  wb.agravo.prazoHoras === 24 ? "border-destructive/40 bg-destructive/5" : "bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-2 font-medium">
                  <Clock className="h-3.5 w-3.5" /> {prazoLabel(wb.agravo)}
                </div>
                <p className="mt-1 text-muted-foreground">
                  Ficha: {wb.agravo.ficha} · Destino: {wb.agravo.destino}
                </p>
                {wb.agravo.alertas?.map((al) => (
                  <p key={al} className="mt-1 flex gap-1.5">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                    {al}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preenchimento inteligente ------------------------------------ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" /> Preenchimento inteligente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => wb.merge(readNotifDefaults())}>
                Usar dados fixos do serviço
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  saveNotifDefaults(wb.data);
                  toast({ title: "Dados fixos salvos", description: "Unidade e notificante serão reaproveitados." });
                }}
              >
                <BookmarkPlus className="mr-1 h-3.5 w-3.5" /> Salvar dados fixos
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => wb.setField("dataNotificacao", new Date().toISOString().slice(0, 10))}
              >
                Notificar com a data de hoje
              </Button>
            </div>

            {emissions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Trazer o paciente de um atendimento recente:</p>
                <div className="flex flex-wrap gap-1.5">
                  {emissions.slice(0, 6).map((rec) => (
                    <Button
                      key={rec.id}
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 border text-xs"
                      onClick={() => {
                        wb.merge({
                          pacienteNome: rec.patientName,
                          gestante: rec.isPregnant ? "ig_ignorada" : "nao",
                        });
                        toast({ title: "Paciente importado", description: "Confira os dados antes de notificar." });
                      }}
                    >
                      {rec.patientName || "Sem nome"} · {rec.documentTitle}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seções -------------------------------------------------------- */}
        {wb.sections.map((s) => (
          <Card key={s.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                  {s.description && <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>}
                </div>
                {!s.core && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={() => wb.toggleSection(s.id)}
                    aria-label="Ocultar seção"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {s.fields.map((f) => renderField(s.id, f))}
              </div>

              <Separator />
              {newFieldSection === s.id ? (
                <div className="grid gap-2 sm:grid-cols-[1fr_150px_auto]">
                  <Input
                    autoFocus
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    placeholder="Nome do campo institucional"
                    className="h-9"
                  />
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as NotifField["type"])}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="text">Texto curto</option>
                    <option value="textarea">Texto longo</option>
                    <option value="date">Data</option>
                    <option value="number">Número</option>
                    <option value="checkbox">Marcação</option>
                  </select>
                  <div className="flex gap-1">
                    <Button type="button" size="sm" onClick={addField}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setNewFieldSection(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button type="button" size="sm" variant="ghost" className="text-xs" onClick={() => setNewFieldSection(s.id)}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar campo desta instituição
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        {wb.hiddenSections.length > 0 && (
          <Card>
            <CardContent className="flex flex-wrap items-center gap-2 py-4">
              <span className="text-xs text-muted-foreground">Seções ocultas:</span>
              {wb.hiddenSections.map((s) => (
                <Button key={s.id} type="button" size="sm" variant="outline" onClick={() => wb.toggleSection(s.id)}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> {s.title}
                </Button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lateral: conformidade, emissão e histórico --------------------- */}
      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conformidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={wb.missing.length ? "destructive" : "secondary"}>
                {wb.missing.length} obrigatório(s) em falta
              </Badge>
              <Badge variant={wb.inconsistencies.length ? "outline" : "secondary"}>
                {wb.inconsistencies.length} inconsistência(s)
              </Badge>
            </div>

            {wb.missing.length > 0 && (
              <ul className="space-y-1 text-xs text-muted-foreground">
                {wb.missing.slice(0, 8).map((m) => (
                  <li key={m.fieldKey ?? m.label} className="flex gap-1.5">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                    {m.label}
                  </li>
                ))}
                {wb.missing.length > 8 && <li>e mais {wb.missing.length - 8}…</li>}
              </ul>
            )}

            {wb.inconsistencies.length > 0 && (
              <ul className="space-y-1 text-xs text-muted-foreground">
                {wb.inconsistencies.map((m) => (
                  <li key={m.message}>• {m.message}</li>
                ))}
              </ul>
            )}

            <Separator />
            <div className="grid gap-2">
              <Button
                type="button"
                onClick={async () => {
                  if (await registerEmission("imprimiu")) printHtml(html);
                }}
              >
                <Printer className="mr-2 h-4 w-4" /> Imprimir / PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (await registerEmission("baixou")) downloadHtml(html, `notificacao-${(wb.agravo?.id ?? "ficha")}.html`);
                }}
              >
                <FileDown className="mr-2 h-4 w-4" /> Baixar arquivo
              </Button>
              <Button type="button" variant="secondary" onClick={registrar}>
                <Send className="mr-2 h-4 w-4" /> Registrar no histórico
              </Button>
              <Button type="button" variant="ghost" onClick={wb.reset}>
                <Eraser className="mr-2 h-4 w-4" /> Limpar ficha
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Histórico de notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {(["todos", ...STATUS_ORDER] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFiltro(s)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] ${
                    statusFiltro === s ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent"
                  }`}
                >
                  {s === "todos" ? "Todas" : STATUS_LABEL[s]}
                </button>
              ))}
            </div>

            {registros.loading && <p className="text-xs text-muted-foreground">Carregando…</p>}
            {registros.error && <p className="text-xs text-destructive">{registros.error}</p>}
            {!registros.loading && registrosFiltrados.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma notificação registrada ainda.</p>
            )}

            <ul className="space-y-2">
              {registrosFiltrados.slice(0, 20).map((r) => (
                <li key={r.id} className="rounded-md border p-2.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{r.agravo}</p>
                      <p className="text-muted-foreground">
                        {r.paciente_nome || "Sem nome"} ·{" "}
                        {new Date(r.created_at).toLocaleDateString("pt-BR")}
                        {r.imediata && <span className="ml-1 text-destructive">24h</span>}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => void registros.remove(r.id)}
                      aria-label="Remover notificação"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {STATUS_ORDER.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => void registros.setStatus(r.id, s)}
                        className={`rounded border px-2 py-0.5 text-[10px] ${
                          r.status === s ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent"
                        }`}
                      >
                        {STATUS_LABEL[s]}
                      </button>
                    ))}
                  </div>
                  {r.protocolo_vigilancia && (
                    <p className="mt-1 text-muted-foreground">Protocolo: {r.protocolo_vigilancia}</p>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-muted-foreground">
              O envio à vigilância ainda é feito pelo canal oficial (SINAN, e-SUS Notifica ou plantão).
              A situação registrada aqui serve de controle interno até a integração direta.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 text-[11px] leading-relaxed text-muted-foreground">
            Lista Nacional de Notificação Compulsória — {AGRAVOS.length - 1} fichas disponíveis, conforme a
            Portaria de Consolidação nº 4/2017 e atualizações. Conteúdo assistivo e revisável: confira sempre
            as exigências da vigilância local antes de enviar.
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
