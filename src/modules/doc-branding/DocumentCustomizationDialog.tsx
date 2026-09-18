import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Building2, Image as ImageIcon, LayoutTemplate, ListPlus, Loader2, Plus, Printer,
  QrCode, Save, Share2, Sparkles, Trash2, Copy, Download, AlertTriangle, CheckCircle2, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { printHtml, downloadHtml } from "@/modules/documents/lib/pdfPrint";
import { useDocumentTemplates } from "./hooks/useDocumentTemplates";
import { buildQrDataUrl } from "./lib/qr";
import { renderDocumentHtml, interpolate } from "./lib/renderDocument";
import { validateTemplate } from "./lib/validation";
import {
  DEFAULT_BRANDING, GALLERY, newCustomField, normalizeBranding,
} from "./lib/defaults";
import {
  DOC_TYPES, DOC_TYPE_LABELS, LOGO_LABELS,
  type CustomField, type DocTypeKey, type DocumentBranding,
  type DocumentRenderData, type LogoSlot,
} from "./lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branding: DocumentBranding;
  onSave: (b: DocumentBranding) => void;
  /** Documento em foco — pré-seleciona o tipo e a validação. */
  docType?: DocTypeKey;
  /** Amostra usada na pré-visualização (paciente/corpo do documento atual). */
  sample?: Partial<DocumentRenderData>;
}

const LOGO_SLOTS: LogoSlot[] = ["institucional", "clinica", "consultorio", "rede"];

const SAMPLE_BODY = `<p>Este é um exemplo de corpo de documento. O conteúdo real (medicações, exames, texto do atestado) entra aqui exatamente com esta formatação.</p>
<ol><li>Medicamento exemplo 500 mg — 1 comprimido de 8/8 h por 7 dias.</li>
<li>Orientações gerais: repouso relativo e hidratação.</li></ol>`;

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Falha ao ler o arquivo"));
    r.readAsDataURL(file);
  });

const DocumentCustomizationDialog = ({
  open, onOpenChange, branding, onSave, docType = "todos", sample,
}: Props) => {
  const [draft, setDraft] = useState<DocumentBranding>(() => normalizeBranding(branding));
  const [previewType, setPreviewType] = useState<DocTypeKey>(docType);
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>();
  const [tplName, setTplName] = useState("");
  const [tplDesc, setTplDesc] = useState("");
  const [tplVis, setTplVis] = useState<"privado" | "instituicao" | "publico">("privado");
  const [saving, setSaving] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const { templates, userId, loading, save, duplicate, remove } = useDocumentTemplates();

  useEffect(() => {
    if (open) {
      setDraft(normalizeBranding(branding));
      setPreviewType(docType);
    }
  }, [open, branding, docType]);

  const data: DocumentRenderData = useMemo(
    () => ({
      titulo: DOC_TYPE_LABELS[previewType === "todos" ? "receita" : previewType],
      corpoHtml: sample?.corpoHtml ?? SAMPLE_BODY,
      paciente: sample?.paciente ?? { nome: "Maria de Souza", idade: "42 anos" },
      cidade: sample?.cidade ?? (draft.institution.cidadeUf || "São Paulo/SP"),
      data: sample?.data ?? new Date().toLocaleDateString("pt-BR"),
      codigo: sample?.codigo ?? "A1B2C3D4",
      hash: sample?.hash ?? "d1f4…exemplo",
      urlValidacao: sample?.urlValidacao ?? `${window.location.origin}/verificar/A1B2C3D4`,
    }),
    [previewType, sample, draft.institution.cidadeUf],
  );

  // QR é reconstruído sempre que o conteúdo muda (debounce curto).
  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      if (draft.layout.qrPosition === "nenhum") {
        setQrDataUrl(undefined);
        return;
      }
      const url = await buildQrDataUrl(interpolate(draft.layout.qrContent, draft, data));
      if (alive) setQrDataUrl(url);
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [draft, data]);

  const issues = useMemo(() => validateTemplate(draft, previewType), [draft, previewType]);

  const previewHtml = useMemo(
    () => renderDocumentHtml(draft, data, { docType: previewType, qrDataUrl, screen: true }),
    [draft, data, previewType, qrDataUrl],
  );

  const patchLayout = useCallback(
    (p: Partial<DocumentBranding["layout"]>) =>
      setDraft((d) => ({ ...d, layout: { ...d.layout, ...p } })),
    [],
  );
  const patchInst = useCallback(
    (p: Partial<DocumentBranding["institution"]>) =>
      setDraft((d) => ({ ...d, institution: { ...d.institution, ...p } })),
    [],
  );

  const handleLogo = async (slot: LogoSlot, file?: File) => {
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error("Imagem muito grande", { description: "Use um arquivo de até 500 KB." });
      return;
    }
    const src = await readFileAsDataUrl(file);
    setDraft((d) => ({
      ...d,
      logos: { ...d.logos, [slot]: { src, heightMm: d.logos[slot]?.heightMm ?? 14, alt: LOGO_LABELS[slot] } },
    }));
  };

  const doPrint = () =>
    printHtml(renderDocumentHtml(draft, data, { docType: previewType, qrDataUrl }));

  const doDownload = () =>
    downloadHtml(
      renderDocumentHtml(draft, data, { docType: previewType, qrDataUrl }),
      `modelo-${previewType}.html`,
    );

  const applySaved = (config: DocumentBranding) => {
    setDraft(normalizeBranding(config));
    toast.success("Modelo aplicado", { description: "Revise antes de salvar." });
  };

  const saveTemplate = async () => {
    if (!tplName.trim()) {
      toast.error("Dê um nome ao modelo");
      return;
    }
    setSaving(true);
    try {
      await save({
        nome: tplName.trim(),
        descricao: tplDesc.trim() || undefined,
        documento_tipo: previewType,
        visibilidade: tplVis,
        instituicao: draft.institution.nomeInstituicao || undefined,
        config: draft,
      });
      setTplName("");
      setTplDesc("");
      toast.success("Modelo salvo");
    } catch {
      toast.error("Não foi possível salvar o modelo");
    } finally {
      setSaving(false);
    }
  };

  const addField = (kind: CustomField["kind"]) =>
    setDraft((d) => ({ ...d, customFields: [...d.customFields, newCustomField(kind)] }));

  const updateField = (id: string, p: Partial<CustomField>) =>
    setDraft((d) => ({
      ...d,
      customFields: d.customFields.map((f) => (f.id === id ? { ...f, ...p } : f)),
    }));

  const removeField = (id: string) =>
    setDraft((d) => ({ ...d, customFields: d.customFields.filter((f) => f.id !== id) }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl p-0 sm:max-h-[92vh]">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <LayoutTemplate className="h-5 w-5 text-primary" />
            Personalização de documentos
          </DialogTitle>
          <DialogDescription>
            Marcas, dados da instituição, campos extras e layout. Tudo revisável antes de emitir.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[74vh] grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          {/* Editor */}
          <div className="min-w-0 border-border lg:border-r">
            <Tabs defaultValue="logos" className="flex h-full flex-col">
              <TabsList className="m-3 grid grid-cols-5">
                <TabsTrigger value="logos" className="gap-1 text-xs">
                  <ImageIcon className="h-3.5 w-3.5" /> Logos
                </TabsTrigger>
                <TabsTrigger value="inst" className="gap-1 text-xs">
                  <Building2 className="h-3.5 w-3.5" /> Dados
                </TabsTrigger>
                <TabsTrigger value="campos" className="gap-1 text-xs">
                  <ListPlus className="h-3.5 w-3.5" /> Campos
                </TabsTrigger>
                <TabsTrigger value="layout" className="gap-1 text-xs">
                  <QrCode className="h-3.5 w-3.5" /> Layout
                </TabsTrigger>
                <TabsTrigger value="modelos" className="gap-1 text-xs">
                  <Sparkles className="h-3.5 w-3.5" /> Modelos
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[62vh] px-4 pb-4">
                {/* ---------- LOGOS ---------- */}
                <TabsContent value="logos" className="mt-0 space-y-4">
                  {LOGO_SLOTS.map((slot) => {
                    const logo = draft.logos[slot];
                    return (
                      <div key={slot} className="rounded-lg border border-border p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <Label className="text-sm">{LOGO_LABELS[slot]}</Label>
                          {logo?.src && (
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => setDraft((d) => ({ ...d, logos: { ...d.logos, [slot]: undefined } }))}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded border border-dashed border-border bg-muted/30">
                            {logo?.src ? (
                              <img src={logo.src} alt={logo.alt} className="max-h-12 max-w-20 object-contain" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                            <Input
                              placeholder="Cole uma URL de imagem…"
                              value={logo?.src?.startsWith("data:") ? "" : (logo?.src ?? "")}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  logos: {
                                    ...d.logos,
                                    [slot]: { src: e.target.value, heightMm: logo?.heightMm ?? 14, alt: LOGO_LABELS[slot] },
                                  },
                                }))
                              }
                              className="h-9"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="file" accept="image/*" className="hidden"
                                ref={(el) => { fileRefs.current[slot] = el; }}
                                onChange={(e) => void handleLogo(slot, e.target.files?.[0])}
                              />
                              <Button variant="outline" size="sm" onClick={() => fileRefs.current[slot]?.click()}>
                                Enviar arquivo
                              </Button>
                              {logo?.src && (
                                <div className="flex flex-1 items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Altura {logo.heightMm} mm</span>
                                  <Slider
                                    value={[logo.heightMm]} min={8} max={30} step={1}
                                    onValueChange={([v]) =>
                                      setDraft((d) => ({
                                        ...d,
                                        logos: { ...d.logos, [slot]: { ...logo, heightMm: v } },
                                      }))
                                    }
                                    className="flex-1"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </TabsContent>

                {/* ---------- DADOS INSTITUCIONAIS ---------- */}
                <TabsContent value="inst" className="mt-0 grid grid-cols-2 gap-3">
                  {([
                    ["nomeInstituicao", "Instituição", 2],
                    ["unidade", "Unidade / setor", 2],
                    ["endereco", "Endereço", 2],
                    ["cidadeUf", "Cidade/UF", 1],
                    ["cep", "CEP", 1],
                    ["telefone", "Telefone", 1],
                    ["email", "E-mail", 1],
                    ["site", "Site", 1],
                    ["cnpj", "CNPJ", 1],
                    ["cnes", "CNES", 1],
                    ["profissionalNome", "Profissional responsável", 2],
                    ["profissionalConselho", "Conselho", 1],
                    ["profissionalRegistro", "Registro (ex.: CRM/SP 123456)", 1],
                    ["profissionalEspecialidade", "Especialidade", 1],
                    ["profissionalRqe", "RQE", 1],
                  ] as Array<[keyof DocumentBranding["institution"], string, number]>).map(
                    ([key, label, span]) => (
                      <div key={String(key)} className={span === 2 ? "col-span-2 space-y-1.5" : "space-y-1.5"}>
                        <Label className="text-xs">{label}</Label>
                        <Input
                          className="h-9"
                          value={String(draft.institution[key] ?? "")}
                          onChange={(e) => patchInst({ [key]: e.target.value } as never)}
                        />
                      </div>
                    ),
                  )}

                  <div className="col-span-2 rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <Label className="text-xs">Registros de outras categorias</Label>
                      <Button
                        variant="outline" size="sm"
                        onClick={() =>
                          patchInst({
                            registrosExtras: [...draft.institution.registrosExtras, { conselho: "COREN", numero: "", nome: "" }],
                          })
                        }
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
                      </Button>
                    </div>
                    {draft.institution.registrosExtras.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Ex.: enfermagem (COREN), odontologia (CRO), psicologia (CRP), nutrição (CRN).
                      </p>
                    )}
                    <div className="space-y-2">
                      {draft.institution.registrosExtras.map((r, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            className="h-9 w-24" placeholder="Conselho" value={r.conselho}
                            onChange={(e) => {
                              const next = [...draft.institution.registrosExtras];
                              next[idx] = { ...r, conselho: e.target.value };
                              patchInst({ registrosExtras: next });
                            }}
                          />
                          <Input
                            className="h-9 w-32" placeholder="Número" value={r.numero}
                            onChange={(e) => {
                              const next = [...draft.institution.registrosExtras];
                              next[idx] = { ...r, numero: e.target.value };
                              patchInst({ registrosExtras: next });
                            }}
                          />
                          <Input
                            className="h-9 flex-1" placeholder="Nome do profissional" value={r.nome ?? ""}
                            onChange={(e) => {
                              const next = [...draft.institution.registrosExtras];
                              next[idx] = { ...r, nome: e.target.value };
                              patchInst({ registrosExtras: next });
                            }}
                          />
                          <Button
                            variant="ghost" size="sm"
                            onClick={() =>
                              patchInst({
                                registrosExtras: draft.institution.registrosExtras.filter((_, i) => i !== idx),
                              })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* ---------- CAMPOS PERSONALIZADOS ---------- */}
                <TabsContent value="campos" className="mt-0 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => addField("auditoria")}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Campo de auditoria
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addField("consentimento")}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Consentimento
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addField("rodape")}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Rodapé
                    </Button>
                  </div>

                  {draft.customFields.length === 0 && (
                    <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      Nenhum campo extra. Use auditoria para exigências de convênio, consentimento para
                      linhas assináveis e rodapé para avisos fixos.
                    </p>
                  )}

                  {draft.customFields.map((f) => (
                    <div key={f.id} className="space-y-2 rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] uppercase">{f.kind}</Badge>
                        <Input
                          className="h-9 flex-1" value={f.label}
                          onChange={(e) => updateField(f.id, { label: e.target.value })}
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeField(f.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Input
                        className="h-9" placeholder="Valor padrão (deixe vazio para preencher à mão)"
                        value={f.value} onChange={(e) => updateField(f.id, { value: e.target.value })}
                      />
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 text-xs">
                          <Checkbox checked={f.required} onCheckedChange={(c) => updateField(f.id, { required: c === true })} />
                          Obrigatório
                        </label>
                        <label className="flex items-center gap-2 text-xs">
                          <Checkbox checked={!!f.signable} onCheckedChange={(c) => updateField(f.id, { signable: c === true })} />
                          Linha para assinar
                        </label>
                        <Select
                          value={f.docTypes[0] ?? "todos"}
                          onValueChange={(v) => updateField(f.id, { docTypes: v === "todos" ? [] : [v as DocTypeKey] })}
                        >
                          <SelectTrigger className="h-8 w-56 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DOC_TYPES.map((t) => (
                              <SelectItem key={t} value={t} className="text-xs">{DOC_TYPE_LABELS[t]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                {/* ---------- LAYOUT ---------- */}
                <TabsContent value="layout" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Fonte do corpo: {draft.layout.fontSizePt} pt</Label>
                      <Slider value={[draft.layout.fontSizePt]} min={8} max={18} step={0.5}
                        onValueChange={([v]) => patchLayout({ fontSizePt: v })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Entrelinha: {draft.layout.lineHeight.toFixed(2)}</Label>
                      <Slider value={[draft.layout.lineHeight]} min={1} max={2} step={0.05}
                        onValueChange={([v]) => patchLayout({ lineHeight: v })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tipo de letra</Label>
                      <Select value={draft.layout.fontFamily} onValueChange={(v) => patchLayout({ fontFamily: v as never })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sistema">Sem serifa (padrão)</SelectItem>
                          <SelectItem value="serifada">Serifada</SelectItem>
                          <SelectItem value="monoespacada">Monoespaçada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Papel e orientação</Label>
                      <div className="flex gap-2">
                        <Select value={draft.layout.paperSize} onValueChange={(v) => patchLayout({ paperSize: v as never })}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A4">A4</SelectItem>
                            <SelectItem value="Carta">Carta</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={draft.layout.orientation} onValueChange={(v) => patchLayout({ orientation: v as never })}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="retrato">Retrato</SelectItem>
                            <SelectItem value="paisagem">Paisagem</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {([
                      ["marginTopMm", "Margem topo (mm)"],
                      ["marginBottomMm", "Margem base (mm)"],
                      ["marginSideMm", "Margens laterais (mm)"],
                    ] as Array<[keyof DocumentBranding["layout"], string]>).map(([k, label]) => (
                      <div key={String(k)} className="space-y-1.5">
                        <Label className="text-xs">{label}</Label>
                        <Input
                          type="number" className="h-9" value={Number(draft.layout[k])}
                          onChange={(e) => patchLayout({ [k]: Number(e.target.value) } as never)}
                        />
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Cabeçalho</Label>
                      <Switch checked={draft.layout.showHeader} onCheckedChange={(v) => patchLayout({ showHeader: v })} />
                    </div>
                    {draft.layout.showHeader && (
                      <>
                        <Textarea
                          placeholder="Linha livre do cabeçalho (aceita {{instituicao.nome}})"
                          value={draft.layout.headerText}
                          onChange={(e) => patchLayout({ headerText: e.target.value })}
                          className="min-h-[60px]"
                        />
                        <label className="flex items-center gap-2 text-xs">
                          <Checkbox checked={draft.layout.headerDivider} onCheckedChange={(c) => patchLayout({ headerDivider: c === true })} />
                          Filete abaixo do cabeçalho
                        </label>
                      </>
                    )}

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Rodapé</Label>
                      <Switch checked={draft.layout.showFooter} onCheckedChange={(v) => patchLayout({ showFooter: v })} />
                    </div>
                    {draft.layout.showFooter && (
                      <Textarea
                        placeholder="Texto do rodapé"
                        value={draft.layout.footerText}
                        onChange={(e) => patchLayout({ footerText: e.target.value })}
                        className="min-h-[60px]"
                      />
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Posição da assinatura</Label>
                      <Select value={draft.layout.signaturePosition} onValueChange={(v) => patchLayout({ signaturePosition: v as never })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="esquerda">Esquerda</SelectItem>
                          <SelectItem value="centro">Centro</SelectItem>
                          <SelectItem value="direita">Direita</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Espaço da assinatura: {draft.layout.signatureSpaceMm} mm</Label>
                      <Slider value={[draft.layout.signatureSpaceMm]} min={0} max={40} step={1}
                        onValueChange={([v]) => patchLayout({ signatureSpaceMm: v })} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Espaço para carimbo</Label>
                    <Switch checked={draft.layout.stampBox} onCheckedChange={(v) => patchLayout({ stampBox: v })} />
                  </div>
                  {draft.layout.stampBox && (
                    <Input className="h-9" value={draft.layout.stampBoxLabel}
                      onChange={(e) => patchLayout({ stampBoxLabel: e.target.value })} />
                  )}

                  <Separator />

                  <div className="space-y-1.5">
                    <Label className="text-xs">QR code</Label>
                    <Select value={draft.layout.qrPosition} onValueChange={(v) => patchLayout({ qrPosition: v as never })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nenhum">Sem QR code</SelectItem>
                        <SelectItem value="rodape-direita">Rodapé — direita</SelectItem>
                        <SelectItem value="rodape-esquerda">Rodapé — esquerda</SelectItem>
                        <SelectItem value="cabecalho-direita">Cabeçalho — direita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {draft.layout.qrPosition !== "nenhum" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Input className="h-9" value={draft.layout.qrContent}
                        onChange={(e) => patchLayout({ qrContent: e.target.value })}
                        placeholder="{{documento.urlValidacao}}" />
                      <Input className="h-9" value={draft.layout.qrCaption}
                        onChange={(e) => patchLayout({ qrCaption: e.target.value })}
                        placeholder="Legenda do QR" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Bloco de assinatura digital</Label>
                    <Switch checked={draft.layout.digitalSignatureBlock}
                      onCheckedChange={(v) => patchLayout({ digitalSignatureBlock: v })} />
                  </div>
                  {draft.layout.digitalSignatureBlock && (
                    <Textarea value={draft.layout.digitalSignatureNote}
                      onChange={(e) => patchLayout({ digitalSignatureNote: e.target.value })}
                      className="min-h-[54px]" />
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Marca d'água</Label>
                      <Input className="h-9" value={draft.layout.watermark}
                        onChange={(e) => patchLayout({ watermark: e.target.value })}
                        placeholder="Ex.: VIA DO PACIENTE" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Cor de destaque</Label>
                      <Input type="color" className="h-9 w-full" value={draft.layout.accentColor}
                        onChange={(e) => patchLayout({ accentColor: e.target.value })} />
                    </div>
                  </div>
                </TabsContent>

                {/* ---------- MODELOS ---------- */}
                <TabsContent value="modelos" className="mt-0 space-y-4">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Galeria padrão</h3>
                    <div className="grid gap-2">
                      {GALLERY.filter((g) => previewType === "todos" || g.documento_tipo === "todos" || g.documento_tipo === previewType).map((g) => (
                        <button
                          key={g.id} type="button" onClick={() => applySaved(g.config)}
                          className="rounded-lg border border-border p-3 text-left transition-colors hover:border-primary hover:bg-accent/40"
                        >
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Sparkles className="h-3.5 w-3.5 text-primary" /> {g.nome}
                            <Badge variant="outline" className="text-[10px]">{DOC_TYPE_LABELS[g.documento_tipo]}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{g.descricao}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Salvar este layout como modelo</h3>
                    <div className="space-y-2">
                      <Input className="h-9" placeholder="Nome do modelo" value={tplName}
                        onChange={(e) => setTplName(e.target.value)} />
                      <Input className="h-9" placeholder="Descrição (opcional)" value={tplDesc}
                        onChange={(e) => setTplDesc(e.target.value)} />
                      <div className="flex items-center gap-2">
                        <Select value={tplVis} onValueChange={(v) => setTplVis(v as never)}>
                          <SelectTrigger className="h-9 flex-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="privado">Só para mim</SelectItem>
                            <SelectItem value="instituicao">Minha instituição</SelectItem>
                            <SelectItem value="publico">Compartilhar com todos</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={() => void saveTemplate()} disabled={saving}>
                          {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                          Salvar
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <Share2 className="h-3.5 w-3.5" /> Modelos salvos e compartilhados
                    </h3>
                    {loading && <p className="text-xs text-muted-foreground">Carregando…</p>}
                    {!loading && templates.length === 0 && (
                      <p className="text-xs text-muted-foreground">Nenhum modelo salvo ainda.</p>
                    )}
                    <div className="grid gap-2">
                      {templates.map((t) => (
                        <div key={t.id} className="rounded-lg border border-border p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                                {t.nome}
                                <Badge variant="outline" className="text-[10px]">{DOC_TYPE_LABELS[t.documento_tipo]}</Badge>
                                <Badge variant="secondary" className="text-[10px]">{t.visibilidade}</Badge>
                                {t.user_id !== userId && <Badge className="text-[10px]">compartilhado</Badge>}
                              </div>
                              {t.descricao && <p className="mt-1 text-xs text-muted-foreground">{t.descricao}</p>}
                            </div>
                            <div className="flex shrink-0 gap-1">
                              <Button size="sm" variant="outline" onClick={() => applySaved(t.config)}>Usar</Button>
                              <Button size="sm" variant="ghost" onClick={() => void duplicate(t)}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              {t.user_id === userId && (
                                <Button size="sm" variant="ghost" onClick={() => void remove(t.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Pré-visualização */}
          <div className="flex min-w-0 flex-col bg-muted/30">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Select value={previewType} onValueChange={(v) => setPreviewType(v as DocTypeKey)}>
                <SelectTrigger className="h-9 flex-1 bg-background text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">{DOC_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={doPrint}>
                <Printer className="mr-1 h-3.5 w-3.5" /> PDF
              </Button>
              <Button size="sm" variant="ghost" onClick={doDownload}>
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-3">
              <iframe
                title="Pré-visualização do documento"
                srcDoc={previewHtml}
                className="h-[46vh] w-full rounded-md border border-border bg-white shadow-sm"
              />

              <div className="mt-3 space-y-1.5">
                {issues.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    Modelo sem pendências para este documento.
                  </div>
                ) : (
                  issues.map((i) => (
                    <div key={i.id} className="flex items-start gap-2 rounded-md border border-border bg-background p-2 text-xs">
                      {i.level === "erro" ? (
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                      ) : i.level === "aviso" ? (
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span>
                        {i.message}
                        {i.reference && <span className="block text-[10px] text-muted-foreground">{i.reference}</span>}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3">
          <Button variant="ghost" size="sm" onClick={() => setDraft(DEFAULT_BRANDING)}>
            Restaurar padrão
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                onSave(draft);
                toast.success("Personalização aplicada aos documentos");
                onOpenChange(false);
              }}
            >
              <Save className="mr-1 h-4 w-4" /> Aplicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentCustomizationDialog;
