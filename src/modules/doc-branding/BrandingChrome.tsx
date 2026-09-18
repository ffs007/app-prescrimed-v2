import { useEffect, useState } from "react";
import { buildQrDataUrl } from "./lib/qr";
import { fieldsForDoc, interpolate } from "./lib/renderDocument";
import type { DocTypeKey, DocumentBranding, DocumentRenderData } from "./lib/types";

interface Props {
  branding: DocumentBranding;
  docType: DocTypeKey;
  data: DocumentRenderData;
}

/** Cabeçalho personalizado (logos + dados institucionais) da folha emitida. */
export const BrandingHeader = ({ branding, docType, data }: Props) => {
  const L = branding.layout;
  const i = branding.institution;
  const logos = Object.values(branding.logos).filter((l) => l?.src);
  const auditoria = fieldsForDoc(branding.customFields, docType).filter((f) => f.kind === "auditoria");
  const hasHead = L.showHeader && (logos.length > 0 || i.nomeInstituicao || i.cnes || i.cnpj);
  if (!hasHead && auditoria.length === 0) return null;

  return (
    <>
      {hasHead && (
        <div
          className="mb-3 flex items-start gap-3 pb-2"
          style={L.headerDivider ? { borderBottom: `1.5px solid ${L.accentColor}` } : undefined}
        >
          {logos.map((l, idx) => (
            <img
              key={idx}
              src={l!.src}
              alt={l!.alt}
              style={{ height: `${l!.heightMm}mm`, maxWidth: "45mm", objectFit: "contain" }}
            />
          ))}
          <div className="min-w-0 flex-1">
            {i.nomeInstituicao && (
              <div className="text-sm font-bold" style={{ color: L.accentColor }}>
                {i.nomeInstituicao}
              </div>
            )}
            {i.unidade && <div className="text-[11px] font-semibold">{i.unidade}</div>}
            <div className="text-[10px] leading-snug text-muted-foreground print:text-gray-600">
              {[i.endereco, i.cidadeUf, i.cep].filter(Boolean).join(" — ")}
            </div>
            <div className="text-[10px] leading-snug text-muted-foreground print:text-gray-600">
              {[i.telefone && `Tel.: ${i.telefone}`, i.email, i.cnpj && `CNPJ ${i.cnpj}`, i.cnes && `CNES ${i.cnes}`]
                .filter(Boolean)
                .join(" · ")}
            </div>
            {L.headerText && (
              <div className="text-[10px] text-muted-foreground print:text-gray-600">
                {interpolate(L.headerText, branding, data)}
              </div>
            )}
          </div>
        </div>
      )}

      {auditoria.length > 0 && (
        <div className="mb-3 rounded border border-border p-2 print:rounded-none print:border-gray-400">
          <div className="text-[9px] font-bold uppercase tracking-wide" style={{ color: L.accentColor }}>
            Dados para auditoria
          </div>
          {auditoria.map((f) => (
            <div key={f.id} className="text-[10px]">
              <span className="font-semibold">{f.label}:</span>{" "}
              {f.value || "____________________"}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

/** Rodapé personalizado: consentimento, carimbo, QR, assinatura digital e texto fixo. */
export const BrandingFooter = ({ branding, docType, data }: Props) => {
  const L = branding.layout;
  const [qr, setQr] = useState<string>();
  const fields = fieldsForDoc(branding.customFields, docType);
  const consentimento = fields.filter((f) => f.kind === "consentimento");
  const rodape = fields.filter((f) => f.kind === "rodape");

  useEffect(() => {
    let alive = true;
    if (L.qrPosition === "nenhum") {
      setQr(undefined);
      return;
    }
    void buildQrDataUrl(interpolate(L.qrContent, branding, data)).then((v) => {
      if (alive) setQr(v);
    });
    return () => {
      alive = false;
    };
  }, [L.qrPosition, L.qrContent, branding, data]);

  const footerText = interpolate(L.footerText, branding, data);
  const nothing =
    !consentimento.length && !rodape.length && !qr && !L.stampBox && !L.digitalSignatureBlock && !footerText;
  if (nothing) return null;

  return (
    <div className="mt-6 space-y-3">
      {consentimento.map((f) => (
        <div key={f.id} className="flex items-end gap-2 text-[10px]">
          <span>{f.label}</span>
          <span className="flex-1 border-b border-dotted border-foreground/60 print:border-gray-600" />
        </div>
      ))}

      {L.stampBox && (
        <div className="flex h-[28mm] items-start border border-dashed border-muted-foreground/60 p-1 text-[9px] uppercase tracking-wide text-muted-foreground print:border-gray-500">
          {L.stampBoxLabel}
        </div>
      )}

      {(L.digitalSignatureBlock || qr || footerText || rodape.length > 0) && (
        <div className="flex items-end gap-3 border-t border-border pt-2 print:border-gray-400">
          <div className="flex-1 space-y-0.5 text-[9px] text-muted-foreground print:text-gray-600">
            {L.digitalSignatureBlock && (
              <>
                <div className="font-bold" style={{ color: L.accentColor }}>
                  Assinatura digital
                </div>
                {data.codigo && <div>Código de validação: {data.codigo}</div>}
                {data.hash && <div className="break-all">Hash: {data.hash}</div>}
                {L.digitalSignatureNote && <div>{L.digitalSignatureNote}</div>}
              </>
            )}
            {rodape.map((f) => (
              <div key={f.id}>
                {f.label}
                {f.value ? `: ${f.value}` : ""}
              </div>
            ))}
            {footerText && <div className="whitespace-pre-line">{footerText}</div>}
          </div>
          {qr && (
            <div className={L.qrPosition === "rodape-esquerda" ? "order-first text-center" : "text-center"}>
              <img src={qr} alt="QR code de validação" style={{ width: "22mm", height: "22mm" }} />
              {L.qrCaption && (
                <div className="max-w-[26mm] text-[8px] text-muted-foreground">{L.qrCaption}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** CSS derivado do perfil, aplicado à folha de impressão real. */
export function brandingPrintCss(branding: DocumentBranding, landscape: boolean): string {
  const L = branding.layout;
  const size = `${L.paperSize === "Carta" ? "letter" : "A4"} ${landscape ? "landscape" : "portrait"}`;
  return `@media print {
    @page { size: ${size}; margin: ${L.marginTopMm}mm ${L.marginSideMm}mm ${L.marginBottomMm}mm; }
    .prescription-print-area { font-size: ${L.fontSizePt}pt; line-height: ${L.lineHeight}; padding: 0 !important; }
    ${L.watermark ? `.prescription-print-area::before { content: "${L.watermark.replace(/"/g, "")}"; position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 46pt; color: rgba(0,0,0,.07); transform: rotate(-30deg); letter-spacing: 6px; z-index: 0; }` : ""}
  }`;
}
