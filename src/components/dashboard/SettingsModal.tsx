import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  X, Building2, PenTool, Plus, Trash2, Pill, FileText, Save, LayoutTemplate,
} from "lucide-react";
import { toast } from "sonner";
import { buildStampLines } from "@/types/prescription";
import DocumentCustomizationDialog from "@/modules/doc-branding/DocumentCustomizationDialog";
import { useDocumentBranding } from "@/modules/doc-branding/hooks/useDocumentBranding";
import type { ClinicInfo, SignatureConfig, Medication, Pathology, SelectedMed, PrescriptionTemplate } from "@/types/prescription";


interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  clinicInfo: ClinicInfo;
  setClinicInfo: (info: ClinicInfo) => void;
  signatureConfig: SignatureConfig;
  setSignatureConfig: (config: SignatureConfig) => void;
  customMedications: Medication[];
  setCustomMedications: (meds: Medication[]) => void;
  customTemplates: PrescriptionTemplate[];
  setCustomTemplates: (templates: PrescriptionTemplate[]) => void;
  allMedications: Medication[];
}

const SettingsModal = ({
  open, onClose, clinicInfo, setClinicInfo, signatureConfig, setSignatureConfig,
  customMedications, setCustomMedications, customTemplates, setCustomTemplates, allMedications,
}: SettingsModalProps) => {
  const [localClinic, setLocalClinic] = useState<ClinicInfo>(clinicInfo);
  const [localSignature, setLocalSignature] = useState<SignatureConfig>(signatureConfig);

  // Personalização visual dos documentos (logos, layout, campos extras)
  const [brandingOpen, setBrandingOpen] = useState(false);
  const { branding, setBranding } = useDocumentBranding();
  // Semeia os dados institucionais com o que já foi preenchido na aba Unidade.
  const brandingWithFallback = useMemo(
    () => ({
      ...branding,
      institution: {
        ...branding.institution,
        nomeInstituicao: branding.institution.nomeInstituicao || clinicInfo.clinicName,
        endereco: branding.institution.endereco || clinicInfo.address,
        telefone: branding.institution.telefone || clinicInfo.phone,
        email: branding.institution.email || clinicInfo.email,
        profissionalNome: branding.institution.profissionalNome || clinicInfo.doctorName,
        profissionalRegistro: branding.institution.profissionalRegistro || clinicInfo.crm,
        profissionalEspecialidade:
          branding.institution.profissionalEspecialidade || clinicInfo.specialty,
      },
    }),
    [branding, clinicInfo],
  );



  // New medication form
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedInstructions, setNewMedInstructions] = useState("");
  const [newMedCategory, setNewMedCategory] = useState("");
  const [newMedPediatricDose, setNewMedPediatricDose] = useState("");
  const [newMedSafePregnant, setNewMedSafePregnant] = useState(false);

  // New template form
  const [newTemplateName, setNewTemplateName] = useState("");
  const [templateMedIds, setTemplateMedIds] = useState<number[]>([]);

  if (!open) return null;

  const saveClinic = () => {
    setClinicInfo(localClinic);
    toast.success("Dados da unidade salvos!");
  };

  const saveSignature = () => {
    setSignatureConfig(localSignature);
    toast.success("Assinatura e carimbo salvos!");
  };

  /** Lê a imagem escolhida e guarda como data URL (sem depender de URL externa). */
  const handleSignatureFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 1 MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLocalSignature((prev) => ({ ...prev, signatureImageUrl: String(reader.result) }));
      toast.success("Assinatura carregada");
    };
    reader.onerror = () => toast.error("Não foi possível ler a imagem");
    reader.readAsDataURL(file);
  };

  const stampPreview = buildStampLines(localSignature, {
    doctorName: localClinic.doctorName,
    specialty: localClinic.specialty,
    crm: localClinic.crm,
  });

  const addMedication = () => {
    if (!newMedName.trim() || !newMedDosage.trim()) {
      toast.error("Preencha nome e posologia");
      return;
    }
    const maxId = Math.max(...allMedications.map((m) => m.id), ...customMedications.map((m) => m.id), 100);
    const newMed: Medication = {
      id: maxId + 1,
      name: newMedName.trim(),
      dosage: newMedDosage.trim(),
      instructions: newMedInstructions.trim(),
      category: newMedCategory.trim() || "Personalizado",
      pediatricDose: newMedPediatricDose.trim() || undefined,
      safeForPregnant: newMedSafePregnant,
      isCustom: true,
    };
    setCustomMedications([...customMedications, newMed]);
    setNewMedName("");
    setNewMedDosage("");
    setNewMedInstructions("");
    setNewMedCategory("");
    setNewMedPediatricDose("");
    setNewMedSafePregnant(false);
    toast.success("Medicação adicionada!");
  };

  const removeMedication = (id: number) => {
    setCustomMedications(customMedications.filter((m) => m.id !== id));
    toast.success("Medicação removida");
  };

  const addTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error("Dê um nome ao modelo");
      return;
    }
    if (templateMedIds.length === 0) {
      toast.error("Selecione ao menos uma medicação");
      return;
    }
    const maxId = Math.max(...customTemplates.map((t) => t.id), 0);
    const meds: SelectedMed[] = templateMedIds
      .map((id) => {
        const med = [...allMedications, ...customMedications].find((m) => m.id === id);
        if (!med) return null;
        return { id: med.id, name: med.name, text: `${med.name}\n${med.dosage} ${med.instructions}`.trim() };
      })
      .filter(Boolean) as SelectedMed[];

    const newTemplate: PrescriptionTemplate = {
      id: maxId + 1,
      name: newTemplateName.trim(),
      meds,
      isCustom: true,
    };
    setCustomTemplates([...customTemplates, newTemplate]);
    setNewTemplateName("");
    setTemplateMedIds([]);
    toast.success("Modelo salvo!");
  };

  const removeTemplate = (id: number) => {
    setCustomTemplates(customTemplates.filter((t) => t.id !== id));
    toast.success("Modelo removido");
  };

  const toggleTemplateMed = (medId: number) => {
    setTemplateMedIds((prev) =>
      prev.includes(medId) ? prev.filter((id) => id !== medId) : [...prev, medId]
    );
  };

  const allMeds = [...allMedications, ...customMedications];

  return (
    <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-foreground text-lg">Configurações</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <Tabs defaultValue="clinic" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-3 bg-muted/50">
            <TabsTrigger value="clinic" className="text-xs gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Unidade
            </TabsTrigger>
            <TabsTrigger value="signature" className="text-xs gap-1.5">
              <PenTool className="h-3.5 w-3.5" /> Assinatura
            </TabsTrigger>
            <TabsTrigger value="medications" className="text-xs gap-1.5">
              <Pill className="h-3.5 w-3.5" /> Medicações
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-xs gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Modelos
            </TabsTrigger>
            <TabsTrigger value="layout" className="text-xs gap-1.5">
              <LayoutTemplate className="h-3.5 w-3.5" /> Layout
            </TabsTrigger>
          </TabsList>


          <div className="flex-1 overflow-y-auto p-4">
            {/* Clinic Tab */}
            <TabsContent value="clinic" className="mt-0 space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Nome da Clínica / Unidade</Label>
                <Input value={localClinic.clinicName} onChange={(e) => setLocalClinic({ ...localClinic, clinicName: e.target.value })} placeholder="Ex: Clínica São Lucas" className="text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Nome do Médico</Label>
                  <Input value={localClinic.doctorName} onChange={(e) => setLocalClinic({ ...localClinic, doctorName: e.target.value })} placeholder="Dr(a). Nome" className="text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">CRM</Label>
                  <Input value={localClinic.crm} onChange={(e) => setLocalClinic({ ...localClinic, crm: e.target.value })} placeholder="CRM/UF 00000" className="text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Especialidade</Label>
                <Input value={localClinic.specialty} onChange={(e) => setLocalClinic({ ...localClinic, specialty: e.target.value })} placeholder="Ex: Clínica Médica" className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Endereço</Label>
                <Input value={localClinic.address} onChange={(e) => setLocalClinic({ ...localClinic, address: e.target.value })} placeholder="Rua, número, bairro, cidade - UF" className="text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Telefone</Label>
                  <Input value={localClinic.phone} onChange={(e) => setLocalClinic({ ...localClinic, phone: e.target.value })} placeholder="(00) 00000-0000" className="text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">E-mail</Label>
                  <Input value={localClinic.email} onChange={(e) => setLocalClinic({ ...localClinic, email: e.target.value })} placeholder="contato@clinica.com" className="text-sm" />
                </div>
              </div>
              <Button variant="hero" onClick={saveClinic} className="w-full mt-2">
                <Save className="h-4 w-4 mr-2" /> Salvar Dados da Unidade
              </Button>
            </TabsContent>

            {/* Signature Tab */}
            <TabsContent value="signature" className="mt-0 space-y-4">
              {/* Upload da assinatura */}
              <div className="space-y-2">
                <Label className="text-xs">Imagem da assinatura (upload)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleSignatureFile}
                    className="text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs"
                  />
                  {localSignature.signatureImageUrl && (
                    <Button variant="outline" size="sm" onClick={() => setLocalSignature({ ...localSignature, signatureImageUrl: "" })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  PNG com fundo transparente funciona melhor. Máx. 1 MB.
                </p>
                {localSignature.signatureImageUrl && (
                  <div className="border border-border rounded-lg p-3 bg-muted/20">
                    <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                    <img
                      src={localSignature.signatureImageUrl}
                      alt="Assinatura"
                      className="max-h-20 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
              </div>

              {/* Carimbo digital (texto) */}
              <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/10">
                <h3 className="text-sm font-semibold text-foreground">Carimbo digital</h3>
                <p className="text-[11px] text-muted-foreground -mt-2">
                  Impresso automaticamente no rodapé de todos os documentos.
                </p>
                <div className="space-y-2">
                  <Label className="text-xs">Nome do médico *</Label>
                  <Input
                    value={localSignature.stampName ?? ""}
                    onChange={(e) => setLocalSignature({ ...localSignature, stampName: e.target.value })}
                    placeholder="Dr(a). Nome Completo"
                    className="text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Especialidade / função *</Label>
                    <Input
                      value={localSignature.stampRole ?? ""}
                      onChange={(e) => setLocalSignature({ ...localSignature, stampRole: e.target.value })}
                      placeholder="Ex: Clínica Médica"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">CRM *</Label>
                    <Input
                      value={localSignature.stampCrm ?? ""}
                      onChange={(e) => setLocalSignature({ ...localSignature, stampCrm: e.target.value })}
                      placeholder="CRM/UF 000000"
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Linha extra (opcional)</Label>
                  <Input
                    value={localSignature.stampExtra ?? ""}
                    onChange={(e) => setLocalSignature({ ...localSignature, stampExtra: e.target.value })}
                    placeholder="Ex: RQE 12345"
                    className="text-sm"
                  />
                </div>

                {/* Preview do carimbo */}
                <div className="rounded-lg border border-dashed border-border bg-card p-3 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1.5">Prévia do carimbo</p>
                  {localSignature.signatureImageUrl && (
                    <img src={localSignature.signatureImageUrl} alt="" className="mx-auto mb-1 max-h-12 object-contain" />
                  )}
                  <div className="mx-auto w-56 border-t border-foreground/60 pt-1">
                    {stampPreview.length > 0 ? (
                      stampPreview.map((line, i) => (
                        <p key={i} className={i === 0 ? "text-xs font-semibold text-foreground" : "text-[11px] text-muted-foreground"}>
                          {line}
                        </p>
                      ))
                    ) : (
                      <p className="text-[11px] text-muted-foreground">Assinatura e Carimbo</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Observações adicionais no rodapé (opcional)</Label>
                <Textarea
                  value={localSignature.signatureText}
                  onChange={(e) => setLocalSignature({ ...localSignature, signatureText: e.target.value })}
                  placeholder="Linhas extras impressas abaixo do carimbo"
                  className="text-sm min-h-[70px]"
                />
              </div>

              <Button variant="hero" onClick={saveSignature} className="w-full mt-2">
                <Save className="h-4 w-4 mr-2" /> Salvar Assinatura e Carimbo
              </Button>
            </TabsContent>

            {/* Medications Tab */}
            <TabsContent value="medications" className="mt-0 space-y-4">
              <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/10">
                <h3 className="text-sm font-semibold text-foreground">Nova Medicação</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={newMedName} onChange={(e) => setNewMedName(e.target.value)} placeholder="Nome (ex: Amoxicilina 500mg)" className="text-sm" />
                  <Input value={newMedCategory} onChange={(e) => setNewMedCategory(e.target.value)} placeholder="Categoria" className="text-sm" />
                </div>
                <Input value={newMedDosage} onChange={(e) => setNewMedDosage(e.target.value)} placeholder="Posologia (ex: 1 comp de 8/8h)" className="text-sm" />
                <Input value={newMedInstructions} onChange={(e) => setNewMedInstructions(e.target.value)} placeholder="Instruções (ex: por 7 dias)" className="text-sm" />
                <Input value={newMedPediatricDose} onChange={(e) => setNewMedPediatricDose(e.target.value)} placeholder="Dose pediátrica (opcional)" className="text-sm" />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newMedSafePregnant}
                    onChange={(e) => setNewMedSafePregnant(e.target.checked)}
                    className="rounded"
                    id="safe-pregnant"
                  />
                  <Label htmlFor="safe-pregnant" className="text-xs">Seguro para gestantes</Label>
                </div>
                <Button variant="hero" onClick={addMedication} className="w-full" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Medicação
                </Button>
              </div>

              {customMedications.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Medicações Personalizadas</h3>
                  {customMedications.map((med) => (
                    <div key={med.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card text-sm">
                      <Pill className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{med.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{med.dosage} {med.instructions}</p>
                      </div>
                      <button onClick={() => removeMedication(med.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="mt-0 space-y-4">
              <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/10">
                <h3 className="text-sm font-semibold text-foreground">Novo Modelo de Prescrição</h3>
                <Input value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} placeholder="Nome do modelo (ex: Gripe Comum)" className="text-sm" />
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  <p className="text-xs text-muted-foreground">Selecione as medicações:</p>
                  {allMeds.map((med) => (
                    <label key={med.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/30 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={templateMedIds.includes(med.id)}
                        onChange={() => toggleTemplateMed(med.id)}
                        className="rounded"
                      />
                      <span className="text-foreground">{med.name}</span>
                      {med.isCustom && <span className="text-primary text-[10px] font-medium">(custom)</span>}
                    </label>
                  ))}
                </div>
                <Button variant="hero" onClick={addTemplate} className="w-full" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Salvar Modelo
                </Button>
              </div>

              {customTemplates.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Modelos Salvos</h3>
                  {customTemplates.map((tmpl) => (
                    <div key={tmpl.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card text-sm">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{tmpl.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{tmpl.meds.map((m) => m.name).join(", ")}</p>
                      </div>
                      <button onClick={() => removeTemplate(tmpl.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Layout dos documentos */}
            <TabsContent value="layout" className="mt-0 space-y-4">
              <div className="space-y-3 rounded-xl border border-border bg-muted/10 p-4">
                <h3 className="text-sm font-semibold text-foreground">Personalização de documentos</h3>
                <p className="text-xs text-muted-foreground">
                  Logos, dados da instituição, campos de auditoria e consentimento, tamanho de fonte,
                  cabeçalho e rodapé, posição da assinatura, espaço de carimbo, QR code e assinatura
                  digital — com pré-visualização e modelos reutilizáveis.
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-full border border-border px-2 py-0.5">
                    {Object.values(branding.logos).filter(Boolean).length} logo(s)
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5">
                    {branding.customFields.length} campo(s) extra(s)
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5">
                    fonte {branding.layout.fontSizePt} pt
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5">
                    {branding.layout.qrPosition === "nenhum" ? "sem QR" : "com QR"}
                  </span>
                </div>
                <Button variant="hero" size="sm" className="w-full" onClick={() => setBrandingOpen(true)}>
                  <LayoutTemplate className="mr-1 h-4 w-4" /> Abrir personalização
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <DocumentCustomizationDialog
        open={brandingOpen}
        onOpenChange={setBrandingOpen}
        branding={brandingWithFallback}
        onSave={setBranding}
      />
    </div>
  );
};


export default SettingsModal;
