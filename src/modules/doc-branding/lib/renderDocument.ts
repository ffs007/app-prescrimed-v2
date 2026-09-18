/**
 * Motor de renderização dos documentos personalizados.
 *
 * Produz uma folha HTML/CSS única usada tanto na pré-visualização em tela
 * quanto na impressão/PDF. Não depende de biblioteca pesada de PDF: a folha é
 * CSS de impressão nativa (rápida, fiel e sem baixar megabytes), e o PDF sai
 * pelo diálogo de impressão do navegador.
 */
import type {
  CustomField,
  DocTypeKey,
  DocumentBranding,
  DocumentRenderData,
  LogoSlot,
} from "./types";

export const escapeHtml = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const FONT_STACKS: Record<string, string> = {
  sistema: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`,
  serifada: `Georgia, "Times New Roman", serif`,
  monoespacada: `"SFMono-Regular", Consolas, "Liberation Mono", monospace`,
};

/** Substitui {{variaveis}} pelos dados do documento. */
export function interpolate(
  template: string,
  branding: DocumentBranding,
  data: DocumentRenderData,
): string {
  const i = branding.institution;
  const map: Record<string, string> = {
    "instituicao.nome": i.nomeInstituicao,
    "instituicao.unidade": i.unidade,
    "instituicao.endereco": i.endereco,
    "instituicao.cidadeUf": i.cidadeUf,
    "instituicao.telefone": i.telefone,
    "instituicao.email": i.email,
    "instituicao.site": i.site,
    "instituicao.cnpj": i.cnpj,
    "instituicao.cnes": i.cnes,
    "profissional.nome": i.profissionalNome,
    "profissional.registro": i.profissionalRegistro,
    "profissional.especialidade": i.profissionalEspecialidade,
    "documento.titulo": data.titulo ?? "",
    "documento.data": data.data ?? "",
    "documento.cidade": data.cidade ?? "",
    "documento.codigo": data.codigo ?? "",
    "documento.hash": data.hash ?? "",
    "documento.urlValidacao": data.urlValidacao ?? "",
    "paciente.nome": data.paciente?.nome ?? "",
    "paciente.idade": data.paciente?.idade ?? "",
    "paciente.documento": data.paciente?.documento ?? "",
    "paciente.cartaoSus": data.paciente?.cartaoSus ?? "",
    "paciente.convenio": data.paciente?.convenio ?? "",
  };
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) => map[key] ?? "");
}

/** Campos que se aplicam a um tipo de documento. */
export const fieldsForDoc = (fields: CustomField[], docType: DocTypeKey): CustomField[] =>
  fields.filter((f) => f.docTypes.length === 0 || f.docTypes.includes(docType) || docType === "todos");

/** Campos obrigatórios ainda vazios — trava de emissão. */
export const missingRequiredFields = (
  branding: DocumentBranding,
  docType: DocTypeKey,
): CustomField[] =>
  fieldsForDoc(branding.customFields, docType).filter((f) => f.required && !f.value.trim());

const LOGO_ORDER: LogoSlot[] = ["institucional", "clinica", "consultorio", "rede"];

function logosHtml(branding: DocumentBranding): string {
  const logos = LOGO_ORDER.map((slot) => branding.logos[slot]).filter(
    (l): l is NonNullable<typeof l> => Boolean(l?.src),
  );
  if (!logos.length) return "";
  return `<div class="logos">${logos
    .map(
      (l) =>
        `<img src="${escapeHtml(l.src)}" alt="${escapeHtml(l.alt || "Logo")}" style="height:${
          Number(l.heightMm) || 14
        }mm" />`,
    )
    .join("")}</div>`;
}

function institutionLines(branding: DocumentBranding): string[] {
  const i = branding.institution;
  const l1 = [i.endereco, i.cidadeUf, i.cep].filter(Boolean).join(" — ");
  const l2 = [
    i.telefone && `Tel.: ${i.telefone}`,
    i.email,
    i.site,
  ]
    .filter(Boolean)
    .join(" · ");
  const l3 = [i.cnpj && `CNPJ ${i.cnpj}`, i.cnes && `CNES ${i.cnes}`].filter(Boolean).join(" · ");
  return [l1, l2, l3].filter(Boolean);
}

function professionalLines(branding: DocumentBranding): string[] {
  const i = branding.institution;
  const out: string[] = [];
  if (i.profissionalNome) out.push(i.profissionalNome);
  const reg = [i.profissionalRegistro, i.profissionalRqe && `RQE ${i.profissionalRqe}`]
    .filter(Boolean)
    .join(" · ");
  if (reg) out.push(reg);
  if (i.profissionalEspecialidade) out.push(i.profissionalEspecialidade);
  for (const r of i.registrosExtras) {
    const line = [r.nome, `${r.conselho} ${r.numero}`.trim()].filter(Boolean).join(" — ");
    if (line.trim()) out.push(line);
  }
  return out;
}

function customFieldsHtml(fields: CustomField[], title: string): string {
  if (!fields.length) return "";
  return `<div class="custom-block">
    <div class="custom-title">${escapeHtml(title)}</div>
    ${fields
      .map((f) =>
        f.signable
          ? `<div class="custom-signable"><span>${escapeHtml(f.label)}</span><span class="dots"></span></div>`
          : `<div class="custom-row"><span class="custom-label">${escapeHtml(f.label)}:</span> <span class="custom-value">${
              f.value ? escapeHtml(f.value) : '<span class="dots inline"></span>'
            }</span></div>`,
      )
      .join("")}
  </div>`;
}

export interface RenderOptions {
  docType: DocTypeKey;
  /** Data URL do QR já gerado (ver buildQrDataUrl). */
  qrDataUrl?: string;
  /** Imagem da assinatura (data URL). */
  signatureImage?: string;
  /** Renderiza para tela (sem @page) — usado na pré-visualização. */
  screen?: boolean;
}

export function renderDocumentHtml(
  branding: DocumentBranding,
  data: DocumentRenderData,
  opts: RenderOptions,
): string {
  const L = branding.layout;
  const i = branding.institution;
  const fields = fieldsForDoc(branding.customFields, opts.docType);
  const auditoria = fields.filter((f) => f.kind === "auditoria");
  const consentimento = fields.filter((f) => f.kind === "consentimento");
  const rodapeExtra = fields.filter((f) => f.kind === "rodape");
  const paper = L.paperSize === "Carta" ? "letter" : "A4";
  const font = FONT_STACKS[L.fontFamily] ?? FONT_STACKS.sistema;
  const accent = /^#[0-9a-fA-F]{3,8}$/.test(L.accentColor) ? L.accentColor : "#1f3a5f";

  const headerText = interpolate(L.headerText, branding, data);
  const footerText = interpolate(L.footerText, branding, data);
  const qrTop = L.qrPosition === "cabecalho-direita" && opts.qrDataUrl;
  const qrBottom =
    (L.qrPosition === "rodape-direita" || L.qrPosition === "rodape-esquerda") && opts.qrDataUrl;

  const qrBlock = opts.qrDataUrl
    ? `<div class="qr"><img src="${escapeHtml(opts.qrDataUrl)}" alt="QR code de validação" />${
        L.qrCaption ? `<div class="qr-caption">${escapeHtml(L.qrCaption)}</div>` : ""
      }</div>`
    : "";

  const header = L.showHeader
    ? `<header class="doc-header ${L.headerDivider ? "divider" : ""}">
        ${logosHtml(branding)}
        <div class="head-info">
          ${i.nomeInstituicao ? `<div class="inst-name">${escapeHtml(i.nomeInstituicao)}</div>` : ""}
          ${i.unidade ? `<div class="inst-unit">${escapeHtml(i.unidade)}</div>` : ""}
          ${institutionLines(branding)
            .map((l) => `<div class="inst-line">${escapeHtml(l)}</div>`)
            .join("")}
          ${headerText ? `<div class="head-free">${escapeHtml(headerText)}</div>` : ""}
        </div>
        ${qrTop ? qrBlock : ""}
      </header>`
    : "";

  const body =
    data.corpoHtml ??
    `<div class="body-text">${escapeHtml(data.corpoTexto ?? "").replace(/\n/g, "<br />")}</div>`;

  const pacienteBloco = data.paciente?.nome
    ? `<div class="patient">
        <div><strong>Paciente:</strong> ${escapeHtml(data.paciente.nome)}</div>
        ${data.paciente.idade ? `<div><strong>Idade:</strong> ${escapeHtml(data.paciente.idade)}</div>` : ""}
        ${data.paciente.documento ? `<div><strong>Documento:</strong> ${escapeHtml(data.paciente.documento)}</div>` : ""}
        ${data.paciente.cartaoSus ? `<div><strong>Cartão SUS:</strong> ${escapeHtml(data.paciente.cartaoSus)}</div>` : ""}
        ${data.paciente.convenio ? `<div><strong>Convênio:</strong> ${escapeHtml(data.paciente.convenio)}</div>` : ""}
      </div>`
    : "";

  const assinatura = `<div class="sign-area align-${L.signaturePosition}">
      <div class="sign-space" style="height:${Number(L.signatureSpaceMm) || 0}mm">
        ${opts.signatureImage ? `<img class="sign-img" src="${escapeHtml(opts.signatureImage)}" alt="Assinatura" />` : ""}
      </div>
      <div class="sign-line"></div>
      ${professionalLines(branding)
        .map((l, idx) => `<div class="${idx === 0 ? "sign-name" : "sign-meta"}">${escapeHtml(l)}</div>`)
        .join("")}
    </div>`;

  const carimbo = L.stampBox
    ? `<div class="stamp-box"><span>${escapeHtml(L.stampBoxLabel || "Carimbo")}</span></div>`
    : "";

  const digital = L.digitalSignatureBlock
    ? `<div class="digital">
        <div class="digital-title">Assinatura digital</div>
        ${data.codigo ? `<div>Código de validação: <strong>${escapeHtml(data.codigo)}</strong></div>` : ""}
        ${data.hash ? `<div class="hash">Hash SHA-256: ${escapeHtml(data.hash)}</div>` : ""}
        ${L.digitalSignatureNote ? `<div class="digital-note">${escapeHtml(L.digitalSignatureNote)}</div>` : ""}
      </div>`
    : "";

  const styles = `
    ${opts.screen ? "" : `@page { size: ${paper} ${L.orientation === "paisagem" ? "landscape" : "portrait"}; margin: ${L.marginTopMm}mm ${L.marginSideMm}mm ${L.marginBottomMm}mm; }`}
    * { box-sizing: border-box; }
    body { margin: 0; color: #111; background: #fff; font-family: ${font};
           font-size: ${L.fontSizePt}pt; line-height: ${L.lineHeight}; }
    ${opts.screen ? `body { padding: ${L.marginTopMm}mm ${L.marginSideMm}mm ${L.marginBottomMm}mm; }` : ""}
    .sheet { position: relative; }
    .watermark { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
                 font-size: 46pt; color: rgba(0,0,0,.07); transform: rotate(-30deg);
                 letter-spacing: 6px; pointer-events: none; z-index: 0; }
    .doc-header { display: flex; align-items: flex-start; gap: 12px; padding-bottom: 6px; margin-bottom: 10px; }
    .doc-header.divider { border-bottom: 1.5px solid ${accent}; }
    .logos { display: flex; align-items: center; gap: 8px; }
    .logos img { object-fit: contain; max-width: 45mm; }
    .head-info { flex: 1; min-width: 0; }
    .inst-name { font-weight: 700; font-size: 1.05em; color: ${accent}; }
    .inst-unit { font-size: .82em; font-weight: 600; }
    .inst-line, .head-free { font-size: .74em; color: #444; }
    h1.doc-title { text-align: center; font-size: 1.15em; margin: 10px 0 12px; text-transform: uppercase;
                   letter-spacing: 1px; color: ${accent}; }
    .patient { border: 1px solid #ddd; border-left: 3px solid ${accent}; padding: 6px 9px;
               margin-bottom: 10px; font-size: .82em; display: flex; flex-wrap: wrap; gap: 4px 18px; }
    .body-text, .doc-body { position: relative; z-index: 1; }
    .custom-block { margin-top: 12px; border: 1px solid #ddd; padding: 7px 9px; font-size: .82em; }
    .custom-title { font-weight: 700; text-transform: uppercase; letter-spacing: .5px;
                    font-size: .82em; color: ${accent}; margin-bottom: 4px; }
    .custom-row { margin-bottom: 3px; }
    .custom-label { font-weight: 600; }
    .custom-signable { display: flex; align-items: flex-end; gap: 8px; margin-top: 10px; }
    .dots { flex: 1; border-bottom: 1px dotted #666; height: 1em; display: block; }
    .dots.inline { display: inline-block; min-width: 40mm; }
    .sign-area { margin-top: 14mm; width: 68mm; }
    .sign-area.align-centro { margin-left: auto; margin-right: auto; text-align: center; }
    .sign-area.align-direita { margin-left: auto; text-align: center; }
    .sign-area.align-esquerda { margin-right: auto; text-align: center; }
    .sign-space { display: flex; align-items: flex-end; justify-content: center; }
    .sign-img { max-height: 100%; max-width: 60mm; object-fit: contain; }
    .sign-line { border-top: 1px solid #333; }
    .sign-name { font-weight: 600; font-size: .84em; margin-top: 3px; }
    .sign-meta { font-size: .76em; color: #444; }
    .stamp-box { margin-top: 8mm; height: 28mm; border: 1px dashed #999; display: flex;
                 align-items: flex-start; justify-content: flex-start; padding: 3px 6px;
                 font-size: .7em; color: #777; text-transform: uppercase; letter-spacing: .5px; }
    .digital { margin-top: 8mm; border-top: 1px solid #ccc; padding-top: 5px; font-size: .72em; color: #333; }
    .digital-title { font-weight: 700; color: ${accent}; }
    .hash { word-break: break-all; color: #666; }
    .digital-note { color: #666; margin-top: 2px; }
    .doc-footer { margin-top: 8mm; border-top: 1px solid #ccc; padding-top: 5px; font-size: .7em;
                  color: #555; display: flex; align-items: flex-end; gap: 12px; }
    .doc-footer.left-qr { flex-direction: row-reverse; }
    .footer-text { flex: 1; white-space: pre-line; }
    .qr { text-align: center; }
    .qr img { width: 22mm; height: 22mm; }
    .qr-caption { font-size: .62em; color: #666; max-width: 26mm; }
    .city-date { text-align: right; margin-top: 8mm; font-size: .84em; }
    @media print { .no-print { display: none !important; } }
  `;

  const footer =
    L.showFooter || rodapeExtra.length || qrBottom
      ? `<footer class="doc-footer ${L.qrPosition === "rodape-esquerda" ? "left-qr" : ""}">
          <div class="footer-text">${
            [
              footerText,
              ...rodapeExtra.map((f) => `${f.label}${f.value ? `: ${f.value}` : ""}`),
              institutionLines(branding)[0] ?? "",
            ]
              .filter(Boolean)
              .map((t) => escapeHtml(t))
              .join("\n")
          }</div>
          ${qrBottom ? qrBlock : ""}
        </footer>`
      : "";

  const inner = `
    ${L.watermark ? `<div class="watermark">${escapeHtml(L.watermark)}</div>` : ""}
    ${header}
    <h1 class="doc-title">${escapeHtml(data.titulo)}</h1>
    ${pacienteBloco}
    ${customFieldsHtml(auditoria, "Dados para auditoria")}
    <div class="doc-body">${body}</div>
    ${customFieldsHtml(consentimento, "Consentimento")}
    ${data.cidade || data.data ? `<div class="city-date">${escapeHtml([data.cidade, data.data].filter(Boolean).join(", "))}</div>` : ""}
    ${assinatura}
    ${carimbo}
    ${digital}
    ${footer}
  `;

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(data.titulo)}</title><style>${styles}</style></head>
    <body><div class="sheet">${inner}</div></body></html>`;
}
