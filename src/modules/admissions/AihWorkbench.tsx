import { useMemo, useState } from "react";
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
  ArrowDown,
  ArrowUp,
  BookmarkPlus,
  Check,
  Eraser,
  FileDown,
  Plus,
  Printer,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { printHtml, downloadHtml } from "@/modules/documents/lib/pdfPrint";
import { recordCriticalEvent } from "@/modules/security/lib/auditClient";
import { AUDIT_ACTIONS } from "@/modules/security/lib/auditActions";
import { persistFormDocument } from "@/modules/documents/lib/persistEmission";
import { AIH_SECTIONS, aihToText, buildAihHtml, displayValue, type AihField } from "./lib/aihSpec";
import { useAihWorkbench } from "./hooks/useAihWorkbench";
import {
  loadAihDefaults,
  patchFromEmission,
  patchFromPathology,
  recentEmissions,
  saveAihDefaults,
  suggestCids,
} from "./lib/smartFill";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

const AihWorkbench = () => {
  const wb = useAihWorkbench();
  const [pathology, setPathology] = useState("");
  const [newFieldSection, setNewFieldSection] = useState<string | null>(null);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<AihField["type"]>("text");

  const emissions = useMemo(() => recentEmissions(), []);
  const missingKeys = useMemo(
    () => new Set(wb.missing.map((m) => m.fieldKey).filter(Boolean) as string[]),
    [wb.missing],
  );
  const cidSuggestions = useMemo(
    () =>
      suggestCids(
        pathology,
        [wb.data.sinaisSintomas, wb.data.condicoes, wb.data.comorbidades]
          .map((v) => String(v ?? ""))
          .join(" "),
      ),
    [pathology, wb.data.sinaisSintomas, wb.data.condicoes, wb.data.comorbidades],
  );

  const applyPathology = () => {
    if (!pathology.trim()) return;
    wb.merge(patchFromPathology(pathology));
    toast({
      title: "Sugestões aplicadas",
      description: "Revise cada campo: nada é enviado sem sua conferência.",
    });
  };

  const applyDefaults = () => {
    const d = loadAihDefaults();
    if (!Object.keys(d).length) {
      toast({ title: "Nenhum dado fixo salvo ainda", description: "Preencha o serviço e o médico e clique em Salvar dados fixos." });
      return;
    }
    wb.merge(d);
    toast({ title: "Dados do serviço e do médico preenchidos" });
  };

  /** Registra a AIH em documentos_gerados antes de deixá-la sair. Sem registro, não imprime nem baixa. */
  const registerEmission = async (acao: "imprimiu" | "baixou"): Promise<boolean> => {
    try {
      await persistFormDocument({
        tipo: "aih",
        titulo: `AIH — ${String(wb.data.pacienteNome || "paciente")}`,
        resumo: aihToText(wb.sections, wb.data),
        campos: wb.data,
        acao,
      });
    } catch (err) {
      console.error("[AihWorkbench.registrarEmissao]", err);
      toast({
        title: "AIH não registrada — emissão cancelada",
        description: "Verifique a conexão e tente novamente. Nenhum documento é emitido sem registro.",
        variant: "destructive",
      });
      return false;
    }
    void recordCriticalEvent({
      acao: AUDIT_ACTIONS.INTERNACAO_REGISTRADA,
      modulo: "internacao",
      entidade: "aih",
      entidadeId: (wb.data["numero_aih"] as string) || null,
      severidade: "alerta",
    });
    return true;
  };

  const print = async () => {
    if (!(await registerEmission("imprimiu"))) return;
    printHtml(buildAihHtml(wb.sections, wb.data));
  };
  const download = async () => {
    if (!(await registerEmission("baixou"))) return;
    downloadHtml(
      buildAihHtml(wb.sections, wb.data),
      `AIH-${String(wb.data.pacienteNome || "paciente").replace(/\s+/g, "-")}.html`,
    );
  };

  const addField = () => {
    if (!newFieldSection || !newFieldLabel.trim()) return;
    const key = `custom_${newFieldLabel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_")}_${Date.now().toString(36)}`;
    wb.addCustomField(newFieldSection, { key, label: newFieldLabel.trim(), type: newFieldType, custom: true, half: newFieldType !== "textarea" });
    setNewFieldLabel("");
    setNewFieldSection(null);
  };

  const renderField = (sectionId: string, f: AihField) => {
    const value = wb.data[f.key];
    const isMissing = missingKeys.has(f.key);
    const listId = f.suggestions ? `aih-sug-${f.key}` : undefined;

    return (
      <div key={f.key} className={cn("space-y-1.5", (!f.half || f.type === "textarea") && "sm:col-span-2")}>
        {f.type !== "checkbox" && (
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor={`aih-${f.key}`} className="text-xs font-medium">
              {f.label} {f.required && <span className="text-destructive">*</span>}
            </Label>
            {f.custom && (
              <button
                type="button"
                onClick={() => wb.removeCustomField(sectionId, f.key)}
                className="text-[10px] text-muted-foreground hover:text-destructive"
              >
                remover campo
              </button>
            )}
          </div>
        )}

        {f.type === "textarea" && (
          <Textarea
            id={`aih-${f.key}`}
            value={String(value ?? "")}
            onChange={(e) => wb.setField(f.key, e.target.value)}
            placeholder={f.placeholder}
            className={cn("min-h-[88px]", isMissing && "border-destructive")}
          />
        )}

        {(f.type === "text" || f.type === "date" || f.type === "number") && (
          <>
            <Input
              id={`aih-${f.key}`}
              type={f.type === "text" ? "text" : f.type}
              value={String(value ?? "")}
              onChange={(e) => wb.setField(f.key, e.target.value)}
              placeholder={f.placeholder}
              list={listId}
              className={cn("h-10", isMissing && "border-destructive")}
            />
            {f.suggestions && (
              <datalist id={listId}>
                {f.suggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            )}
          </>
        )}

        {f.type === "select" && (
          <select
            id={`aih-${f.key}`}
            value={String(value ?? "")}
            onChange={(e) => wb.setField(f.key, e.target.value)}
            className={cn(
              "h-10 w-full rounded-md border border-input bg-background px-3 text-sm",
              isMissing && "border-destructive",
            )}
          >
            {f.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}

        {f.type === "checkbox" && (
          <div className="flex items-center gap-2 pt-5">
            <Checkbox
              id={`aih-${f.key}`}
              checked={value === true}
              onCheckedChange={(c) => wb.setField(f.key, c === true)}
            />
            <Label htmlFor={`aih-${f.key}`} className="text-xs font-medium">
              {f.label}
            </Label>
            {f.custom && (
              <button
                type="button"
                onClick={() => wb.removeCustomField(sectionId, f.key)}
                className="text-[10px] text-muted-foreground hover:text-destructive"
              >
                remover
              </button>
            )}
          </div>
        )}

        {f.hint && <p className="text-[10px] leading-4 text-muted-foreground">{f.hint}</p>}
        {isMissing && <p className="text-[10px] font-medium text-destructive">Campo obrigatório na AIH.</p>}
      </div>
    );
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        {/* Preenchimento inteligente ---------------------------------- */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" /> Preenchimento inteligente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input
                value={pathology}
                onChange={(e) => setPathology(e.target.value)}
                placeholder="Patologia da internação (ex.: pneumonia, sepse, AVC)"
                className="h-10"
              />
              <Button type="button" variant="secondary" onClick={applyPathology}>
                Sugerir conteúdo
              </Button>
            </div>

            {cidSuggestions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">CIDs sugeridos — clique para usar:</p>
                <div className="flex flex-wrap gap-1.5">
                  {cidSuggestions.map((c) => (
                    <div key={c.code} className="flex items-center overflow-hidden rounded-md border">
                      <button
                        type="button"
                        className="px-2 py-1 text-xs font-medium hover:bg-accent"
                        onClick={() => wb.setField("cidPrincipal", c.code)}
                        title={`Usar ${c.code} como principal (${c.origem})`}
                      >
                        {c.code}
                      </button>
                      <button
                        type="button"
                        className="border-l px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent"
                        onClick={() => {
                          const cur = String(wb.data.cidCausasAssociadas ?? "")
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean);
                          if (!cur.includes(c.code)) cur.push(c.code);
                          wb.setField("cidCausasAssociadas", cur.join(", "));
                        }}
                      >
                        + associado
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={applyDefaults}>
                Usar dados fixos do serviço
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  saveAihDefaults(wb.data);
                  toast({ title: "Dados fixos salvos", description: "Serviço e médico serão reaproveitados nas próximas AIH." });
                }}
              >
                <BookmarkPlus className="mr-1 h-3.5 w-3.5" /> Salvar dados fixos
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => wb.setField("dataSolicitacao", new Date().toISOString().slice(0, 10))}
              >
                Data de hoje na solicitação
              </Button>
            </div>

            {emissions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  Trazer paciente e terapêutica de um atendimento recente:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {emissions.slice(0, 6).map((rec) => (
                    <Button
                      key={rec.id}
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 border text-xs"
                      onClick={() => {
                        wb.merge(patchFromEmission(rec));
                        toast({ title: "Dados importados da prescrição", description: "Confira a terapêutica antes de emitir." });
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

        {/* Seções ----------------------------------------------------- */}
        {wb.sections.map((s) => (
          <Card key={s.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                  {s.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => wb.moveSection(s.id, -1)} aria-label="Mover seção para cima">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => wb.moveSection(s.id, 1)} aria-label="Mover seção para baixo">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  {!s.core && (
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => wb.toggleSection(s.id)} aria-label="Ocultar seção">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
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
                    onChange={(e) => setNewFieldType(e.target.value as AihField["type"])}
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

        {/* Seções ocultas --------------------------------------------- */}
        {AIH_SECTIONS.filter((s) => !s.core && wb.layout.hidden.includes(s.id)).length > 0 && (
          <Card>
            <CardContent className="flex flex-wrap items-center gap-2 py-4">
              <span className="text-xs text-muted-foreground">Seções ocultas:</span>
              {AIH_SECTIONS.filter((s) => !s.core && wb.layout.hidden.includes(s.id)).map((s) => (
                <Button key={s.id} type="button" size="sm" variant="outline" onClick={() => wb.toggleSection(s.id)}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> {s.title}
                </Button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Coluna lateral: conformidade e emissão ------------------------ */}
      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conformidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
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
                  <li key={m.label} className="flex gap-1.5">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                    {m.label}
                  </li>
                ))}
                {wb.missing.length > 8 && <li>e mais {wb.missing.length - 8}…</li>}
              </ul>
            )}

            {wb.inconsistencies.length > 0 && (
              <ul className="space-y-1 border-t pt-2 text-xs text-muted-foreground">
                {wb.inconsistencies.map((i) => (
                  <li key={i.message} className="flex gap-1.5">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
                    {i.message}
                  </li>
                ))}
              </ul>
            )}

            {!wb.issues.length && (
              <p className="text-xs text-muted-foreground">
                Exigências mínimas preenchidas e consistentes. Revise o conteúdo clínico antes de emitir.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Emissão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button type="button" className="w-full" onClick={print}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir / salvar em PDF
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={download}>
              <FileDown className="mr-2 h-4 w-4" /> Baixar arquivo do laudo
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => {
                wb.reset();
                toast({ title: "Formulário limpo" });
              }}
            >
              <Eraser className="mr-2 h-4 w-4" /> Limpar formulário
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => {
                wb.resetLayout();
                toast({ title: "Layout restaurado ao padrão do SUS" });
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Restaurar layout padrão
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {wb.sections
              .flatMap((s) => s.fields.map((f) => ({ f, v: displayValue(f, wb.data) })))
              .filter((x) => x.v)
              .slice(0, 12)
              .map((x) => (
                <div key={x.f.key}>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{x.f.label}</div>
                  <div className="whitespace-pre-line">{x.v}</div>
                </div>
              ))}
            {!wb.sections.some((s) => s.fields.some((f) => displayValue(f, wb.data))) && (
              <p className="text-muted-foreground">Comece preenchendo o paciente e o diagnóstico.</p>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
};

export default AihWorkbench;
