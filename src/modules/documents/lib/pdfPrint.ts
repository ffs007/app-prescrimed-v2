// Etapa 20 — Utilitários de impressão e hash de documentos.

/** Imprime um HTML em um iframe oculto. O navegador permite "Salvar como PDF" no diálogo. */
export function printHtml(html: string): void {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }
  };
}

/**
 * Opções padrão do html2pdf (A4). `pagebreak` funciona em runtime, mas falta na tipagem do pacote;
 * por isso o objeto é montado em variável (sem checagem de propriedade excedente).
 */
export function buildPdfOptions(filename: string, landscape: boolean) {
  const options = {
    margin: landscape ? 5 : 10,
    filename,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
    jsPDF: { unit: "mm", format: "a4", orientation: (landscape ? "landscape" : "portrait") as "landscape" | "portrait" },
    pagebreak: { mode: ["css", "legacy"] },
  };
  return options;
}

/** Dispara o download de um Blob já gerado no navegador. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Faz download do HTML como arquivo .html (fallback simples ao PDF). */
export function downloadHtml(html: string, filename: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Hash SHA-256 do conteúdo serializado. */
export async function hashDocument(payload: unknown): Promise<string> {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload);
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function shortValidationCode(): string {
  return crypto.randomUUID().split("-")[0].toUpperCase();
}
