import { useEffect, useMemo, useState } from "react";
import { useDocumentBranding } from "@/modules/doc-branding/hooks/useDocumentBranding";
import {
  BrandingHeader, BrandingFooter, brandingPrintCss,
} from "@/modules/doc-branding/BrandingChrome";

import { Button } from "@/components/ui/button";
import { Printer, X, Heart, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { buildStampLines } from "../types/prescription";
import type { Medication, SelectedMed, ClinicInfo, SignatureConfig } from "../types/prescription";
import type { DocumentAction } from "./ActionGrid";
import type { AtestadoData } from "./AtestadoForm";
import type { ExamesData } from "./ExamesForm";
import type { EncaminhamentoData } from "./EncaminhamentoForm";
import type { DeclaracaoData } from "./DeclaracaoForm";
import type { RelatorioData } from "./RelatorioForm";
import type { OrientacoesData } from "./OrientacoesForm";
import {
  groupSelectedByPrescriptionType,
  hasSpecialPrescription as checkHasSpecial,
} from "../services/medicationSafety";
import { PRESCRIPTION_TYPE_INFO } from "@/data/medications";
import { classifyMedication } from "../services/regulatoryClassification";
import { RECEIPT_RULES } from "../services/regulatoryTaxonomy";
import PrescriptionTemplateRouter, {
  isLandscapeFamily,
} from "./prescriptionTemplates/PrescriptionTemplateRouter";
import IVPdfAnnex from "@/modules/iv-dilution/IVPdfAnnex";
import StructuredDocumentBody from "./StructuredDocumentBody";
import {
  buildSections,
  structuredLead,
  AIH_FIELDS,
  APAC_FIELDS,
  NOTIFICACAO_FIELDS,
  EMPTY_AIH,
  EMPTY_APAC,
  EMPTY_NOTIFICACAO,
  type StructuredData,
} from "../services/regulatoryForms";
import { useIVMedicationsForList } from "@/modules/iv-dilution/useIVMedicationsForList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logIVView } from "@/modules/iv-dilution/lib/ivViewLog";

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

interface Props {
  open: boolean;
  onClose: () => void;
  // Patient
  patientName: string;
  isPediatric: boolean;
  isPregnant: boolean;
  ageValue: string;
  ageUnit: string;
  weight: string;
  // Document
  action: DocumentAction;
  selected: SelectedMed[];
  allMedications: Medication[];
  atestado: AtestadoData;
  exames: ExamesData;
  encaminhamento: EncaminhamentoData;
  declaracao: DeclaracaoData;
  relatorio: RelatorioData;
  orientacoes: OrientacoesData;
  aih?: StructuredData;
  apac?: StructuredData;
  notificacao?: StructuredData;
  clinicInfo: ClinicInfo;
  signatureConfig: SignatureConfig;
  /**
   * Quando definido, restringe a impressão da receita aos SelectedMeds com
   * estes IDs (camada regulatória — emitir 1 grupo por vez).
   * Se omitido, imprime todos os medicamentos selecionados (modo legado).
   */
  selectedFilter?: number[];
  /**
   * Override do título do documento — útil para indicar tipo regulatório
   * específico no PDF (ex: "Receita - Controle Especial").
   */
  titleOverride?: string;
}

const DOC_TITLES: Record<DocumentAction, string> = {
  receita: "Receita Médica",
  atestado: "Atestado Médico",
  exames: "Solicitação de Exames",
  encaminhamento: "Encaminhamento",
  declaracao: "Declaração de Comparecimento",
  relatorio: "Relatório de Atendimento",
  orientacoes: "Orientações & Retorno",
  procedimento: "Solicitação de Procedimento",
  aih: "Laudo de Internação (AIH)",
  apac: "Laudo APAC",
  notificacao: "Notificação Compulsória",
};

const PrintArea = ({
  open, onClose, patientName, isPediatric, isPregnant, ageValue, ageUnit, weight,
  action, selected: selectedRaw, allMedications, atestado, exames, encaminhamento,
  declaracao, relatorio, orientacoes,
  aih = EMPTY_AIH, apac = EMPTY_APAC, notificacao = EMPTY_NOTIFICACAO,
  clinicInfo, signatureConfig,
  selectedFilter, titleOverride,
}: Props) => {
  const { branding } = useDocumentBranding();
  const brandingData = useMemo(
    () => ({
      titulo: titleOverride ?? "",
      paciente: { nome: patientName },
      cidade: clinicInfo.address,
      data: new Date().toLocaleDateString("pt-BR"),
      codigo: "",
      hash: "",
      urlValidacao: typeof window !== "undefined" ? window.location.origin : "",
    }),
    [titleOverride, patientName, clinicInfo.address],
  );
  const [savingPdf, setSavingPdf] = useState(false);

  const [overflowWarning, setOverflowWarning] = useState(false);
  const [ivAnnexScope, setIvAnnexScope] = useState<"none" | "medio_alto" | "todos">("medio_alto");

  // Aplica filtro regulatório quando presente — caso contrário, todos
  const selected = selectedFilter
    ? selectedRaw.filter((s) => selectedFilter.includes(s.id))
    : selectedRaw;

  const docTitle = titleOverride ?? DOC_TITLES[action];
  const hasClinicInfo = clinicInfo.clinicName || clinicInfo.doctorName;

  /* ============================================================
   * Modo regulatório: quando há selectedFilter, esse PrintArea
   * representa um único grupo regulatório. Detectamos a família
   * do primeiro item para escolher o template e a orientação A4.
   * ============================================================ */
  const isRegulatoryMode = action === "receita" && !!selectedFilter && selected.length > 0;
  const regulatoryFamily = isRegulatoryMode
    ? (() => {
        const firstMed = allMedications.find((m) => m.id === selected[0].id);
        if (!firstMed) return null;
        return classifyMedication(firstMed).family;
      })()
    : null;
  const regulatoryRules = regulatoryFamily ? RECEIPT_RULES[regulatoryFamily] : null;

  // Modo legado (sem filtro) ainda usa o detector antigo para landscape
  const hasSpecialPrescription = action === "receita" && checkHasSpecial(selected, allMedications);
  const useLandscape = regulatoryFamily
    ? isLandscapeFamily(regulatoryFamily)
    : hasSpecialPrescription;

  // Inject @page size dynamically (com a personalização do usuário aplicada por cima)
  useEffect(() => {
    if (!open) return;
    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-print-area", "true");
    const base = useLandscape
      ? `@media print {
           @page { size: A4 landscape; margin: 8mm; }
           html, body { height: auto; }
           .prescription-print-area { max-height: 194mm; overflow: hidden; page-break-after: avoid; break-after: avoid; }
           .prescription-template-controlled { page-break-inside: avoid; break-inside: avoid; page-break-after: avoid; break-after: avoid; }
           .prescription-print-area *:last-child { page-break-after: avoid; break-after: avoid; }
         }`
      : `@media print { @page { size: A4 portrait; margin: 15mm; } }`;
    // Em paisagem (2 vias), o layout é fixo por exigência legal — não sobrescreve.
    styleEl.innerHTML = useLandscape ? base : `${base}\n${brandingPrintCss(branding, false)}`;
    document.head.appendChild(styleEl);
    return () => { styleEl.remove(); };
  }, [open, useLandscape, branding]);


  // Aviso de estouro: conteúdo paisagem além de ~194mm é cortado na impressão.
  useEffect(() => {
    if (!open || !useLandscape) { setOverflowWarning(false); return; }
    const t = setTimeout(() => {
      const node = document.querySelector(".prescription-print-area") as HTMLElement | null;
      if (!node) return;
      const limitPx = (194 / 25.4) * 96; // 194mm em px @96dpi
      setOverflowWarning(node.scrollHeight > limitPx);
    }, 250);
    return () => clearTimeout(t);
  }, [open, useLandscape, selected, selectedFilter]);

  const handleSavePdf = async () => {
    const node = document.querySelector(".prescription-print-area") as HTMLElement | null;
    if (!node) return;
    setSavingPdf(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const filename = `${docTitle.replace(/\s+/g, "_")}_${(patientName || "paciente").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
      await html2pdf()
        .set({
          margin: useLandscape ? 5 : 10,
          filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: {
            unit: "mm",
            format: "a4",
            orientation: useLandscape ? "landscape" : "portrait",
          },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(node)
        .save();
      toast.success("PDF salvo com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao gerar PDF");
    } finally {
      setSavingPdf(false);
    }
  };

  // IV PDF annex lookup — MUST run before any early return to keep hook order stable.
  const ivLookupItems = open && action === "receita"
    ? selected.map((s) => ({ name: s.name, route: /\b(IV|EV|intraven|endoven)\b/i.test(s.text) ? "IV" : null }))
    : [];
  const { list: ivMeds } = useIVMedicationsForList(ivLookupItems);

  if (!open) return null;

  const formatDateBR = (iso: string) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
  };

  const ClinicHeader = () => (
    <div className="prescription-header mb-6">
      {hasClinicInfo ? (
        <div className="text-center">
          <div className="border-b-2 border-primary/30 pb-4 mb-3 print:border-b-2 print:border-gray-800">
            {clinicInfo.clinicName && (
              <h2 className="font-serif font-semibold text-foreground text-lg tracking-wide uppercase">
                {clinicInfo.clinicName}
              </h2>
            )}
            {clinicInfo.doctorName && (
              <p className="text-sm text-foreground mt-1 font-medium">
                {clinicInfo.doctorName}{clinicInfo.crm && ` — ${clinicInfo.crm}`}
              </p>
            )}
            {clinicInfo.specialty && <p className="text-xs text-muted-foreground font-medium">{clinicInfo.specialty}</p>}
            <div className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {clinicInfo.address && <p>{clinicInfo.address}</p>}
              {(clinicInfo.phone || clinicInfo.email) && (
                <p>
                  {clinicInfo.phone}
                  {clinicInfo.phone && clinicInfo.email && " • "}
                  {clinicInfo.email}
                </p>
              )}
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary print:text-gray-700">{docTitle}</p>
        </div>
      ) : (
        <div className="text-center border-b border-border pb-4 mb-3">
          <p className="text-xs text-muted-foreground italic mb-2">Configure os dados da unidade em Configurações</p>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{docTitle}</p>
        </div>
      )}
    </div>
  );

  const PatientInfo = () => (
    <div className="prescription-patient-info border border-border rounded-lg p-4 mb-6 bg-muted/10 print:border print:border-gray-300 print:rounded print:bg-transparent">
      <div className="grid grid-cols-2 gap-y-1.5 text-sm">
        <p className="text-foreground"><strong>Paciente:</strong> {patientName || "________________________"}</p>
        <p className="text-foreground text-right"><strong>Data:</strong> {new Date().toLocaleDateString("pt-BR")}</p>
        {isPediatric && (ageValue || weight) && (
          <p className="text-foreground">
            <strong>Idade:</strong> {ageValue} {ageUnit}
            {weight && <> — <strong>Peso:</strong> {weight} kg</>}
          </p>
        )}
        {isPregnant && (
          <p className="text-destructive font-medium flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" /> Gestante
          </p>
        )}
      </div>
    </div>
  );

  /** Sinais de alarme + plano de retorno impressos junto à receita. */
  const printReturnInstructions: string[] = [
    ...orientacoes.sinaisAlarme,
    orientacoes.retornoCondicao
      ? `Retorno: ${orientacoes.retornoCondicao}`
      : "",
  ].filter(Boolean);

  const stampLines = buildStampLines(signatureConfig, {
    doctorName: clinicInfo.doctorName,
    specialty: clinicInfo.specialty,
    crm: clinicInfo.crm,
  });

  const SignatureArea = () => (
    <div className="mt-16 pt-4 text-center prescription-signature">
      {signatureConfig.signatureImageUrl && (
        <img src={signatureConfig.signatureImageUrl} alt="Assinatura" className="max-h-20 mx-auto mb-2 object-contain" />
      )}
      <div className="w-56 mx-auto">
        <div className="border-t-2 border-foreground/70 pt-2 print:border-t-2 print:border-gray-800">
          {stampLines.length > 0 ? (
            stampLines.map((line, i) => (
              <p
                key={i}
                className={i === 0 ? "text-sm font-semibold text-foreground leading-snug" : "text-xs text-foreground/80 leading-snug"}
              >
                {line}
              </p>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Assinatura e Carimbo</p>
          )}
        </div>
      </div>
    </div>
  );

  const SpecialVia = ({ via, meds: viaMeds }: { via: string; meds: typeof selected }) => (
    <div className="flex-1 text-[11px] text-foreground flex flex-col px-4 py-2">
      <div className="text-center mb-1">
        {clinicInfo.clinicName && <p className="font-bold text-foreground text-sm">{clinicInfo.clinicName}</p>}
        <p className="font-semibold text-foreground text-[11px] underline">Receituário de Controle Especial</p>
        <p className="text-foreground text-[10px]">{via}</p>
      </div>
      <div className="border-t border-foreground/60 pt-1 mt-1 print:border-gray-800">
        <div className="flex justify-between">
          <span className="font-bold text-[10px]">IDENTIFICAÇÃO DO EMITENTE</span>
          <span className="text-[10px]">DATA: {new Date().toLocaleDateString("pt-BR")}</span>
        </div>
        <p className="leading-snug mt-0.5 text-[10px]">
          {clinicInfo.doctorName && <>Dr(a). {clinicInfo.doctorName}{clinicInfo.crm && ` - ${clinicInfo.crm}`}<br/></>}
          {clinicInfo.clinicName && <>{clinicInfo.clinicName}<br/></>}
          {clinicInfo.address && <>{clinicInfo.address}</>}
          {clinicInfo.phone && <> - Tel.: {clinicInfo.phone}</>}
        </p>
      </div>
      <div className="mt-2"><p className="text-[11px]"><strong>Paciente:</strong> {patientName || ""}</p></div>
      <div className="mt-2 flex-1">
        <div className="space-y-1.5">
          {viaMeds.map((med, i) => (
            <div key={med.id} className="leading-snug text-[10px]">{i + 1}. {med.text}</div>
          ))}
        </div>
      </div>
      <div className="border-t border-foreground/60 mt-4 pt-1 print:border-gray-800">
        <p className="text-center font-bold text-[10px] mb-1">IDENTIFICAÇÃO DO COMPRADOR</p>
        <div className="space-y-0.5 text-[10px]">
          <p className="border-b border-foreground/40 pb-0.5 print:border-gray-600">Nome:</p>
          <div className="flex gap-6">
            <p className="flex-1 border-b border-foreground/40 pb-0.5 print:border-gray-600">Ident.:</p>
            <p className="flex-1 border-b border-foreground/40 pb-0.5 print:border-gray-600">Órg. emissor:</p>
          </div>
          <p className="border-b border-foreground/40 pb-0.5 print:border-gray-600">End.:</p>
          <div className="flex gap-6">
            <p className="flex-1 border-b border-foreground/40 pb-0.5 print:border-gray-600">Cidade / UF:</p>
            <p className="flex-1 border-b border-foreground/40 pb-0.5 print:border-gray-600">Telefone:</p>
          </div>
        </div>
      </div>
      <div className="border-t border-foreground/60 mt-2 pt-1 print:border-gray-800">
        <p className="text-center font-bold text-[10px]">IDENTIFICAÇÃO DO FORNECEDOR</p>
        <div className="flex justify-between mt-4 text-[9px]">
          <div className="text-center"><p>_________________________</p><p>Assinatura do farmacêutico</p></div>
          <div className="text-center"><p>____ / ____ / ____</p><p>Data de fornecimento</p></div>
        </div>
      </div>
    </div>
  );

  const groups = action === "receita" ? groupSelectedByPrescriptionType(selected, allMedications) : ({} as Record<string, SelectedMed[]>);
  const typeOrder = ["comum", "branca2vias", "amarela", "azul"] as const;
  const sortedTypes = typeOrder.filter((t) => groups[t]?.length > 0);

  // (ivLookupItems / ivMeds calculados acima, antes do early return)


  return (
    <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4 print:bg-white print:p-0 print:block">
      <div className={cn(
        "bg-card rounded-2xl w-full max-h-[90vh] overflow-y-auto p-10 relative print:shadow-none print:rounded-none print:max-w-none print:max-h-none print:p-[10mm] print:bg-white prescription-print-area",
        useLandscape ? "max-w-5xl" : "max-w-2xl"
      )}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground print:hidden">
          <X className="h-5 w-5" />
        </button>

        {overflowWarning && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3 print:hidden">
            <p className="text-xs font-semibold text-destructive">
              Conteúdo excede uma folha A4 paisagem
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              Itens abaixo do limite de 194mm serão cortados na impressão. Reduza medicamentos
              ou orientações para caber nas 2 vias.
            </p>
          </div>
        )}

        {!useLandscape && (
          <BrandingHeader
            branding={branding}
            docType={action as never}
            data={{ ...brandingData, titulo: docTitle }}
          />
        )}


        {/* ============================================================
         * Modo regulatório: template dedicado por família. Já contém
         * cabeçalho, paciente e assinatura próprios — não renderizamos
         * ClinicHeader/PatientInfo aqui.
         * ============================================================ */}
        {isRegulatoryMode && regulatoryFamily && regulatoryRules ? (
          <PrescriptionTemplateRouter
            family={regulatoryFamily}
            meds={selected}
            patientName={patientName}
            isPediatric={isPediatric}
            isPregnant={isPregnant}
            ageValue={ageValue}
            ageUnit={ageUnit}
            weight={weight}
            clinicInfo={clinicInfo}
            signatureConfig={signatureConfig}
            regulatoryLabel={regulatoryRules.label}
            validityDays={regulatoryRules.validityDays}
            returnInstructions={printReturnInstructions}
          />
        ) : (
          <>
            <ClinicHeader />
            <PatientInfo />

            {action === "receita" && (
              <div className="mt-6">
                {sortedTypes.map((type, groupIdx) => {
                  const meds = groups[type];
                  const typeInfo = PRESCRIPTION_TYPE_INFO[type];
                  if (type === "branca2vias") {
                    return (
                      <div key={type} className={groupIdx > 0 ? "mt-8 print:break-before-page print:mt-0" : ""}>
                        <div className="flex print:gap-0">
                          <SpecialVia via="1ª via: farmácia" meds={meds} />
                          <div className="w-px bg-foreground/50 print:bg-gray-800 shrink-0" />
                          <SpecialVia via="2ª via: paciente" meds={meds} />
                        </div>
                      </div>
                    );
                  }
                  const isLastGroup = groupIdx === sortedTypes.length - 1;
                  const hasOrientacoes =
                    !!orientacoes.cuidadosGerais ||
                    orientacoes.sinaisAlarme.length > 0 ||
                    !!orientacoes.retornoData ||
                    !!orientacoes.retornoCondicao;
                  return (
                    <div key={type} className={groupIdx > 0 ? "mt-8 pt-6 border-t-2 border-dashed border-muted-foreground/30 print:break-before-page print:border-none print:mt-0 print:pt-0" : ""}>
                      {type !== "comum" && (
                        <div className={`mb-4 p-2.5 rounded-lg text-center ${typeInfo.color} print:rounded-none`}>
                          <p className="text-xs font-bold uppercase tracking-wider">{typeInfo.printLabel}</p>
                        </div>
                      )}
                      <div className="space-y-5">
                        {meds.map((med, i) => (
                          <div key={med.id} className="flex gap-4">
                            <span className="text-sm font-bold text-foreground shrink-0">{i + 1})</span>
                            <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">{med.text}</div>
                          </div>
                        ))}
                      </div>
                      {isLastGroup && hasOrientacoes && (
                        <div className="mt-6 pt-4 border-t border-border/60 space-y-3 text-sm text-foreground">
                          <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Orientações ao paciente
                          </p>
                          {orientacoes.cuidadosGerais && (
                            <p className="leading-[1.7] whitespace-pre-line">{orientacoes.cuidadosGerais}</p>
                          )}
                          {orientacoes.sinaisAlarme.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold mb-1">Procurar atendimento se apresentar:</p>
                              <ul className="list-disc list-inside space-y-0.5 leading-relaxed">
                                {orientacoes.sinaisAlarme.map((s, i) => <li key={i}>{s}</li>)}
                              </ul>
                            </div>
                          )}
                          {(orientacoes.retornoData || orientacoes.retornoCondicao) && (
                            <p className="leading-[1.7]">
                              <strong>Retorno: </strong>
                              {orientacoes.retornoData && <>em <strong>{formatDateBR(orientacoes.retornoData)}</strong></>}
                              {orientacoes.retornoData && orientacoes.retornoCondicao && " — "}
                              {orientacoes.retornoCondicao}
                            </p>
                          )}
                        </div>
                      )}
                      <SignatureArea />
                    </div>
                  );
                })}
                {ivMeds.length > 0 && ivAnnexScope !== "none" && (
                  <IVPdfAnnex meds={ivMeds} scope={ivAnnexScope === "todos" ? "todos" : "medio_alto"} />
                )}
          </div>
        )}

        {action === "atestado" && (
          <div className="mt-6">
            <p className="text-sm text-foreground leading-[1.8]">
              Atesto, para os devidos fins, que o(a) paciente <strong>{patientName || "____________________"}</strong> foi
              atendido(a) nesta data, necessitando de afastamento de suas atividades por{" "}
              <strong>
                {atestado.days || "___"} ({atestado.days ? (parseInt(atestado.days) === 1 ? "um" : atestado.days) : "___"}) dia
                {parseInt(atestado.days || "0") !== 1 ? "s" : ""}
              </strong>
              , a partir de <strong>{new Date().toLocaleDateString("pt-BR")}</strong>.
            </p>
            {atestado.showCid && atestado.cid && (
              <p className="text-sm text-foreground mt-4">
                <strong>CID-10:</strong> {atestado.cid}{atestado.reason && ` — ${atestado.reason}`}
              </p>
            )}
            <SignatureArea />
          </div>
        )}

        {action === "exames" && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-foreground font-semibold">Solicito os seguintes exames:</p>
              {exames.urgente && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-destructive text-destructive">
                  URGENTE
                </span>
              )}
            </div>
            {(["laboratorial", "imagem"] as const).map((tipo) => {
              const lista = exames.itens.filter((i) => i.tipo === tipo);
              if (lista.length === 0) return null;
              return (
                <div key={tipo} className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                    {tipo === "laboratorial" ? "Laboratoriais" : "Imagem"}
                  </p>
                  <ol className="text-sm text-foreground space-y-1 leading-relaxed list-decimal list-inside">
                    {lista.map((i) => <li key={i.id}>{i.nome}</li>)}
                  </ol>
                </div>
              );
            })}
            {(exames.justificativa || exames.cid) && (
              <div className="mt-4 pt-3 border-t border-border text-sm text-foreground space-y-2">
                {exames.cid && <p><strong>CID-10:</strong> {exames.cid}</p>}
                {exames.justificativa && <p><strong>Justificativa clínica:</strong> {exames.justificativa}</p>}
              </div>
            )}
            {exames.observacoes && (
              <p className="mt-3 text-xs italic text-muted-foreground">Obs.: {exames.observacoes}</p>
            )}
            <SignatureArea />
          </div>
        )}

        {action === "encaminhamento" && (
          <div className="mt-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-foreground leading-[1.8]">
                Encaminho o(a) paciente <strong>{patientName || "____________________"}</strong> para avaliação em{" "}
                <strong>{encaminhamento.especialidade || "____________"}</strong>.
              </p>
              {encaminhamento.urgencia !== "eletivo" && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                  encaminhamento.urgencia === "urgente" ? "border-destructive text-destructive" : "border-amber-600 text-amber-700"
                }`}>
                  {encaminhamento.urgencia === "urgente" ? "URGENTE" : "PRIORITÁRIO"}
                </span>
              )}
            </div>
            {encaminhamento.cid && <p className="text-sm text-foreground"><strong>CID-10:</strong> {encaminhamento.cid}</p>}
            {encaminhamento.hipotese && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-1">Hipótese diagnóstica</p>
                <p className="text-sm text-foreground leading-[1.7] whitespace-pre-line">{encaminhamento.hipotese}</p>
              </div>
            )}
            {encaminhamento.resumoClinico && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-1">Resumo clínico</p>
                <p className="text-sm text-foreground leading-[1.7] whitespace-pre-line">{encaminhamento.resumoClinico}</p>
              </div>
            )}
            {encaminhamento.exames && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-1">Exames realizados</p>
                <p className="text-sm text-foreground leading-[1.7] whitespace-pre-line">{encaminhamento.exames}</p>
              </div>
            )}
            <p className="text-sm text-foreground pt-2">Agradeço a colaboração no acompanhamento do caso.</p>
            <SignatureArea />
          </div>
        )}

        {action === "declaracao" && (
          <div className="mt-6">
            <p className="text-sm text-foreground leading-[1.8]">
              Declaro, para os devidos fins, que o(a) paciente <strong>{patientName || "____________________"}</strong> compareceu
              a esta unidade de saúde no dia{" "}
              <strong>{declaracao.data ? formatDateBR(declaracao.data) : new Date().toLocaleDateString("pt-BR")}</strong>
              {declaracao.horaInicio && (
                <>, no horário das <strong>{declaracao.horaInicio}</strong>
                {declaracao.horaFim && <> às <strong>{declaracao.horaFim}</strong></>}
                </>
              )}
              {declaracao.acompanhante && (
                <>, acompanhado(a) de <strong>{declaracao.acompanhante}</strong></>
              )}
              , para atendimento médico.
            </p>
            {declaracao.finalidade && (
              <p className="text-sm text-foreground mt-4 leading-[1.7]">
                <strong>Finalidade:</strong> {declaracao.finalidade}
              </p>
            )}
            <SignatureArea />
          </div>
        )}

        {action === "relatorio" && (
          <div className="mt-6 space-y-4">
            {relatorio.destinatario && (
              <p className="text-sm text-foreground"><strong>À/Ao:</strong> {relatorio.destinatario}</p>
            )}
            <p className="text-sm text-foreground leading-[1.7]">
              Venho, por meio deste, apresentar relatório do(a) paciente <strong>{patientName || "____________________"}</strong>,
              atendido(a) em <strong>{new Date().toLocaleDateString("pt-BR")}</strong>.
            </p>
            {relatorio.cid && <p className="text-sm text-foreground"><strong>CID-10:</strong> {relatorio.cid}</p>}
            {relatorio.conteudo && (
              <p className="text-sm text-foreground leading-[1.7] whitespace-pre-line">{relatorio.conteudo}</p>
            )}

            <p className="text-sm text-foreground pt-2">Sem mais para o momento, coloco-me à disposição para esclarecimentos adicionais.</p>
            <SignatureArea />
          </div>
        )}

        {action === "orientacoes" && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-foreground leading-[1.8]">
              Orientações para o(a) paciente <strong>{patientName || "____________________"}</strong>
              {orientacoes.diagnostico && <> — <strong>{orientacoes.diagnostico}</strong></>}.
            </p>
            {orientacoes.cuidadosGerais && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-1">Cuidados gerais</p>
                <p className="text-sm text-foreground leading-[1.7] whitespace-pre-line">{orientacoes.cuidadosGerais}</p>
              </div>
            )}
            {orientacoes.sinaisAlarme.length > 0 && (
              <div className="border-2 border-destructive rounded p-3 print:rounded-none">
                <p className="text-xs font-bold uppercase tracking-wider text-destructive mb-2">
                  ⚠ Procurar pronto-atendimento imediatamente se apresentar
                </p>
                <ul className="text-sm text-foreground space-y-1 leading-relaxed list-disc list-inside">
                  {orientacoes.sinaisAlarme.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {(orientacoes.retornoData || orientacoes.retornoCondicao) && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-1">Retorno</p>
                <p className="text-sm text-foreground leading-[1.7]">
                  {orientacoes.retornoData && <>Em <strong>{formatDateBR(orientacoes.retornoData)}</strong></>}
                  {orientacoes.retornoData && orientacoes.retornoCondicao && " — "}
                  {orientacoes.retornoCondicao}
                </p>
              </div>
            )}
            <SignatureArea />
          </div>
        )}

        {(action === "aih" || action === "apac" || action === "notificacao") && (
          <div className="mt-6 space-y-4">
            <StructuredDocumentBody
              variant="print"
              lead={structuredLead(
                action,
                patientName,
                action === "aih" ? aih : action === "apac" ? apac : notificacao,
              )}
              sections={buildSections(
                action === "aih" ? AIH_FIELDS : action === "apac" ? APAC_FIELDS : NOTIFICACAO_FIELDS,
                action === "aih" ? aih : action === "apac" ? apac : notificacao,
              )}
            />
            <SignatureArea />
          </div>
        )}
          </>
        )}

        {!useLandscape && (
          <BrandingFooter
            branding={branding}
            docType={action as never}
            data={{ ...brandingData, titulo: docTitle }}
          />
        )}


        {action === "receita" && ivMeds.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-md border bg-muted/30 print:hidden">
            <p className="text-xs text-foreground flex-1">
              <strong>{ivMeds.length}</strong> medicamento(s) IV identificado(s). Deseja incluir orientações de diluição/administração no PDF?
            </p>
            <Select value={ivAnnexScope} onValueChange={(v) => { setIvAnnexScope(v as any); ivMeds.forEach((m) => logIVView({ principio_ativo: m.principio_ativo, tipo_visualizacao: "pdf", acao_realizada: v === "none" ? "removeu_do_pdf" : "incluiu_no_pdf" })); }}>
              <SelectTrigger className="w-full sm:w-[260px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não incluir</SelectItem>
                <SelectItem value="medio_alto">Apenas alertas médios/altos</SelectItem>
                <SelectItem value="todos">Todos os medicamentos IV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-2 print:hidden sm:flex-row sm:gap-3">
          <Button
            variant="default"
            className="flex-1 bg-canon-blue text-primary-foreground hover:bg-canon-blue/90"
            onClick={() => window.print()}
            disabled={savingPdf}
          >
            <Printer className="h-4 w-4 mr-2" />Imprimir
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-canon-blue text-canon-blue hover:bg-canon-blue/5"
            onClick={handleSavePdf}
            disabled={savingPdf}
          >
            {savingPdf ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gerando…</>
            ) : (
              <><Download className="h-4 w-4 mr-2" />Salvar PDF</>
            )}
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={savingPdf}>Fechar</Button>
        </div>
        {hasSpecialPrescription && (
          <p className="mt-2 text-[10px] text-ink-faint italic text-center print:hidden">
            ⓘ Receita de controle especial será impressa em paisagem (A4 transversal), 2 vias lado a lado.
          </p>
        )}
      </div>
    </div>
  );
};

export default PrintArea;
